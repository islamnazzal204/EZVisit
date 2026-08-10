// ============================================================
// EZVisit — /api/analyze Route Handler (Groq-Only)
// ============================================================

import { NextRequest } from 'next/server';
import { chatCompletionGroq, parseJsonResponseGroq, GroqError } from '@/lib/groq';
import {
  buildSummaryPrompt,
  buildPatientInstructionsPrompt,
  buildDoctorFeedbackPrompt,
} from '@/lib/prompts';
import { verifyAuthToken } from '@/lib/firebase-admin';
import type { AnalyzeResponse } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

// --- Constants ---
const MAX_TRANSCRIPT_LENGTH = 50_000; // ~50K chars ≈ ~12K tokens

export async function POST(request: NextRequest) {
  try {
    // ── Auth Check ──────────────────────────────────────────
    const user = await verifyAuthToken(request);
    if (!user) {
      return Response.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    // ── Parse & Validate Input ──────────────────────────────
    const body = await request.json();
    const { transcript, model, apiKey: clientApiKey } = body;

    if (!transcript || typeof transcript !== 'string') {
      return Response.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return Response.json(
        { error: `Transcript too long (${transcript.length} chars). Maximum is ${MAX_TRANSCRIPT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    let selectedModel = model || 'llama-3.3-70b-versatile';
    
    // Ensure the model ID is exactly what Groq expects
    if (selectedModel.includes('70b')) selectedModel = 'llama-3.3-70b-versatile';
    else if (selectedModel.includes('8b')) selectedModel = 'llama-3.1-8b-instant';
    else selectedModel = 'llama-3.3-70b-versatile';

    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'No Groq API key configured. Get a free Groq API key at console.groq.com.' },
        { status: 401 }
      );
    }

    // ── Run Analysis ────────────────────────────────────────
    // All calls run sequentially because Groq free tier has a 12K TPM limit.
    // The summary alone can use ~9K tokens, so parallel calls would exceed it.
    // The retry logic in chatCompletionGroq auto-waits on 429 rate limits.

    // 1. Speaker diarization + summary (largest output)
    const summaryResult = await chatCompletionGroq(
      'You are an expert medical conversation analyst. Return ONLY valid JSON, no other text.',
      buildSummaryPrompt(transcript),
      selectedModel,
      apiKey,
      8192
    );

    // 2. Patient instructions
    const instructionsResult = await chatCompletionGroq(
      'You are a patient education specialist. Return ONLY valid JSON, no other text.',
      buildPatientInstructionsPrompt(transcript, ''),
      selectedModel,
      apiKey,
      4096
    );

    // 3. Doctor feedback
    const feedbackResult = await chatCompletionGroq(
      'You are a medical communication evaluator. Return ONLY valid JSON, no other text.',
      buildDoctorFeedbackPrompt(transcript),
      selectedModel,
      apiKey,
      4096
    );

    // Parse all three responses with fallback defaults
    let summaryData: {
      diarizedTranscript: AnalyzeResponse['diarizedTranscript'];
      summary: AnalyzeResponse['summary'];
    };
    try {
      summaryData = parseJsonResponseGroq(summaryResult);
    } catch (parseErr) {
      console.error('Failed to parse summary response:', parseErr, 'Raw:', summaryResult);
      summaryData = {
        diarizedTranscript: [],
        summary: {
          mainComplaint: '',
          symptomsDiscussed: [],
          questionsAsked: [],
          doctorExplanations: [],
          treatmentDiscussed: [],
          followUpRecommendations: [],
          importantConcerns: [],
          patientHistory: {
            patientProfile: '',
            presentingComplaint: '',
            historyOfPresentIllness: {
              site: '',
              onset: '',
              character: '',
              radiation: '',
              associations: '',
              timeCourse: '',
              exacerbatingRelievingFactors: '',
              severity: '',
            },
            pastMedicalHistory: [],
            drugHistory: [],
            familyHistory: [],
            socialHistory: [],
            reviewOfSystems: [],
          },
          patientHistoryNarrative: '',
        },
      };
    }

    let instructionsData: AnalyzeResponse['patientInstructions'];
    try {
      instructionsData = parseJsonResponseGroq(instructionsResult);
    } catch (parseErr) {
      console.error('Failed to parse instructions response:', parseErr, 'Raw:', instructionsResult);
      instructionsData = {
        medications: [],
        lifestyleRecommendations: [],
        followUpAppointments: [],
        warningSigns: [],
        emergencySigns: [],
      };
    }

    let feedbackData: AnalyzeResponse['doctorFeedback'];
    try {
      feedbackData = parseJsonResponseGroq(feedbackResult);
    } catch (parseErr) {
      console.error('Failed to parse feedback response:', parseErr, 'Raw:', feedbackResult);
      feedbackData = {
        scores: {
          empathy: 0,
          activeListening: 0,
          clarity: 0,
          organization: 0,
          patientCenteredCommunication: 0,
          openEndedQuestions: 0,
          sharedDecisionMaking: 0,
          medicalJargonUsage: 0,
          overallScore: 0,
        },
        strengths: [],
        areasForImprovement: [],
        specificExamples: [],
        actionableSuggestions: [],
      };
    }

    const response: AnalyzeResponse = {
      diarizedTranscript: summaryData.diarizedTranscript || [],
      summary: summaryData.summary || {
        mainComplaint: '',
        symptomsDiscussed: [],
        questionsAsked: [],
        doctorExplanations: [],
        treatmentDiscussed: [],
        followUpRecommendations: [],
        importantConcerns: [],
        patientHistory: {
          patientProfile: '',
          presentingComplaint: '',
          historyOfPresentIllness: {
            site: '',
            onset: '',
            character: '',
            radiation: '',
            associations: '',
            timeCourse: '',
            exacerbatingRelievingFactors: '',
            severity: '',
          },
          pastMedicalHistory: [],
          drugHistory: [],
          familyHistory: [],
          socialHistory: [],
          reviewOfSystems: [],
        },
        patientHistoryNarrative: '',
      },
      patientInstructions: instructionsData || {
        medications: [],
        lifestyleRecommendations: [],
        followUpAppointments: [],
        warningSigns: [],
        emergencySigns: [],
      },
      doctorFeedback: feedbackData || {
        scores: {
          empathy: 0,
          activeListening: 0,
          clarity: 0,
          organization: 0,
          patientCenteredCommunication: 0,
          openEndedQuestions: 0,
          sharedDecisionMaking: 0,
          medicalJargonUsage: 0,
          overallScore: 0,
        },
        strengths: [],
        areasForImprovement: [],
        specificExamples: [],
        actionableSuggestions: [],
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error('Analysis error:', error);

    // Return user-safe messages from known error types; generic message for unknown errors
    if (error instanceof GroqError) {
      return Response.json(
        { error: error.userMessage, code: error.code },
        { status: error.statusCode }
      );
    }

    // Surface the actual error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

