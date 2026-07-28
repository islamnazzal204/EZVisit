// ============================================================
// EZVisit — /api/transcribe Route Handler
// ============================================================

import { NextRequest } from 'next/server';
import { transcribeAudioGroq, GroqError } from '@/lib/groq';
import { verifyAuthToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// --- Constants ---
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

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
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return Response.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return Response.json(
        { error: `Audio file too large (${(audioFile.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.` },
        { status: 400 }
      );
    }

    // ── Resolve API Key ─────────────────────────────────────
    // Optional: client can provide their own API key
    const clientApiKey = formData.get('apiKey') as string | null;
    const groqKey = (clientApiKey && clientApiKey.trim()) || process.env.GROQ_API_KEY;
    
    if (!groqKey) {
      return Response.json(
        { error: 'No Groq API key configured. Please enter your Groq key (starts with gsk_) in Settings.' },
        { status: 401 }
      );
    }

    // ── Transcribe ──────────────────────────────────────────
    console.log('Transcribing with Groq...');
    const result = await transcribeAudioGroq(audioFile as File, groqKey);

    return Response.json({
      transcript: result.text,
      segments: result.segments,
      language: 'ar',
      duration: result.segments.length > 0
        ? result.segments[result.segments.length - 1].end
        : 0,
      provider: 'groq',
    });
  } catch (error) {
    console.error('Transcription error:', error);

    // Return user-safe messages from known error types; generic message for unknown errors
    if (error instanceof GroqError) {
      return Response.json(
        { error: error.userMessage, code: error.code },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}

