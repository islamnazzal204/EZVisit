// ============================================================
// EZVisit — Processing Page
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import ProcessingAnimation from '@/components/shared/ProcessingAnimation';
import { getAudioBlob } from '@/lib/storage';
import { auth } from '@/lib/firebase';

export default function ProcessingPage() {
  const settings = useAppStore((s) => s.settings);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const getActiveSession = useAppStore((s) => s.getActiveSession);
  const updateSession = useAppStore((s) => s.updateSession);
  const setProcessingStep = useAppStore((s) => s.setProcessingStep);
  const setProcessingError = useAppStore((s) => s.setProcessingError);
  const setPage = useAppStore((s) => s.setPage);
  const processingError = useAppStore((s) => s.processingError);
  const processingStep = useAppStore((s) => s.processingStep);

  const isArabic = settings.language === 'ar';
  const processingRef = useRef(false);

  // Get Firebase ID token for authenticated API calls
  const getAuthToken = async (): Promise<string> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error(isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in first');
    }
    return currentUser.getIdToken();
  };

  useEffect(() => {
    if (processingRef.current || !activeSessionId) return;
    processingRef.current = true;

    const processSession = async () => {
      const session = getActiveSession();
      if (!session) {
        setProcessingError('Session not found');
        return;
      }

      try {
        // Step 1: Upload/Transcribe
        setProcessingStep('transcribing');
        updateSession({ ...session, status: 'transcribing', updatedAt: new Date().toISOString() });

        // Get audio blob from IndexedDB
        const audioBlob = await getAudioBlob(session.audioKey);
        if (!audioBlob) {
          throw new Error(isArabic ? 'لم يتم العثور على الملف الصوتي' : 'Audio file not found');
        }

        // Call transcribe API
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        if (settings.apiKey) {
          formData.append('apiKey', settings.apiKey);
          // Detect provider based on API key format
          const provider = (settings.apiKey.startsWith('sk-or') || settings.apiKey.includes('openrouter')) ? 'openrouter' : 'groq';
          formData.append('provider', provider);
        }

        const authToken = await getAuthToken();

        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        });

        if (!transcribeRes.ok) {
          const errData = await transcribeRes.json().catch(() => ({ error: 'Transcription failed' }));
          throw new Error(errData.error || 'Transcription failed');
        }

        const transcribeData = await transcribeRes.json();

        // Update session with transcript - re-read fresh session from store
        const freshSession1 = useAppStore.getState().sessions.find(s => s.id === activeSessionId) || session;
        const transcribedSession = {
          ...freshSession1,
          rawTranscript: transcribeData.transcript,
          audioDuration: transcribeData.duration || freshSession1.audioDuration,
          status: 'analyzing' as const,
          updatedAt: new Date().toISOString(),
        };
        updateSession(transcribedSession);

        // Step 2: Analyze
        setProcessingStep('analyzing');

        // Detect provider based on API key format
        const provider = settings.apiKey && (settings.apiKey.startsWith('sk-or') || settings.apiKey.includes('openrouter')) ? 'openrouter' : 'groq';
        
        const analyzeToken = await getAuthToken();

        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${analyzeToken}`,
          },
          body: JSON.stringify({
            transcript: transcribeData.transcript,
            model: settings.model,
            apiKey: settings.apiKey || undefined,
            provider: provider,
          }),
        });

        if (!analyzeRes.ok) {
          const errData = await analyzeRes.json().catch(() => ({ error: 'Analysis failed' }));
          throw new Error(errData.error || 'Analysis failed');
        }

        const analyzeData = await analyzeRes.json();

        // Update session with analysis results - re-read fresh session
        const freshSession2 = useAppStore.getState().sessions.find(s => s.id === activeSessionId) || transcribedSession;
        const completedSession = {
          ...freshSession2,
          diarizedTranscript: analyzeData.diarizedTranscript,
          summary: analyzeData.summary,
          modelUsed: `${settings.model} (${provider})`,
          patientInstructions: analyzeData.patientInstructions,
          doctorFeedback: analyzeData.doctorFeedback,
          status: 'completed' as const,
          updatedAt: new Date().toISOString(),
        };
        updateSession(completedSession);

        // Done!
        setProcessingStep('completed');

        // Navigate to results after a brief delay
        setTimeout(() => {
          setPage('results');
        }, 1500);
      } catch (error) {
        console.error('Processing error:', error);
        const message = error instanceof Error ? error.message : 'Processing failed';
        setProcessingError(message);

        // Update session with error status - re-read fresh session
        const freshSession = useAppStore.getState().sessions.find(s => s.id === activeSessionId);
        if (freshSession) {
          updateSession({
            ...freshSession,
            status: 'error',
            error: message,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    };

    processSession();
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-enter" dir={isArabic ? 'rtl' : 'ltr'}>
      <ProcessingAnimation />

      {/* Retry / Go Home on error */}
      {processingError && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '0 24px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => {
              setProcessingError(null);
              setProcessingStep('idle');
              setPage('home');
            }}
            className="btn btn-outline"
          >
            {isArabic ? 'الصفحة الرئيسية' : 'Go Home'}
          </button>
          <button
            onClick={() => {
              setProcessingError(null);
              processingRef.current = false;
              setProcessingStep('uploading');
            }}
            className="btn btn-primary"
          >
            {isArabic ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}
