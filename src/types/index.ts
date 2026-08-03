// ============================================================
// EZVisit — Core TypeScript Types
// ============================================================

// --- Session ---

export type SessionStatus =
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'error';

export interface Session {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;

  // Audio
  audioKey: string;
  audioDuration: number;
  audioSize: number;
  audioMimeType: string;

  // Results
  rawTranscript?: string;
  diarizedTranscript?: DiarizedSegment[];
  summary?: ConversationSummary;
  patientInstructions?: PatientInstructions;
  doctorFeedback?: DoctorFeedback;

  // Metadata
  modelUsed: string;
  error?: string;
  tags?: string[];
  notes?: string;
}

// --- Transcript ---

export interface DiarizedSegment {
  speaker: 'doctor' | 'patient' | 'unknown';
  text: string;
  startTime: number;
  endTime: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// --- Conversation Summary ---

export interface SOCRATESHistory {
  site: string;
  onset: string;
  character: string;
  radiation: string;
  associations: string;
  timeCourse: string;
  exacerbatingRelievingFactors: string;
  severity: string;
}

export interface PatientHistory {
  patientProfile: string;
  presentingComplaint: string;
  historyOfPresentIllness: SOCRATESHistory;
  pastMedicalHistory: string[];
  drugHistory: string[];
  familyHistory: string[];
  socialHistory: string[];
  reviewOfSystems: string[];
}

export interface ConversationSummary {
  mainComplaint: string;
  symptomsDiscussed: string[];
  questionsAsked: string[];
  doctorExplanations: string[];
  treatmentDiscussed: string[];
  followUpRecommendations: string[];
  importantConcerns: string[];
  patientHistory?: PatientHistory;
}

// --- Patient Instructions ---

export interface MedicationInstruction {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export interface PatientInstructions {
  medications: MedicationInstruction[];
  lifestyleRecommendations: string[];
  followUpAppointments: string[];
  warningSigns: string[];
  emergencySigns: string[];
}

// --- Doctor Feedback ---

export interface CommunicationScores {
  empathy: number;
  activeListening: number;
  clarity: number;
  organization: number;
  patientCenteredCommunication: number;
  openEndedQuestions: number;
  sharedDecisionMaking: number;
  medicalJargonUsage: number;
  overallScore: number;
}

export interface DoctorFeedback {
  scores: CommunicationScores;
  strengths: string[];
  areasForImprovement: string[];
  specificExamples: string[];
  actionableSuggestions: string[];
}

// --- API ---

export interface TranscribeResponse {
  transcript: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

export interface AnalyzeResponse {
  diarizedTranscript: DiarizedSegment[];
  summary: ConversationSummary;
  patientInstructions: PatientInstructions;
  doctorFeedback: DoctorFeedback;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

// --- Settings ---

export interface AppSettings {
  apiKey: string;
  model: string;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  language: 'ar',
  theme: 'system',
};

// Available models (Groq Free Tier)
export const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (High Quality)', tier: 'free' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)', tier: 'free' },
] as const;
