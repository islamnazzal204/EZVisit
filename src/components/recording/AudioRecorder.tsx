// ============================================================
// EZVisit — Audio Recorder Component
// ============================================================

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { getRecordingMimeType, formatDuration, generateSessionId } from '@/lib/utils';
import { saveAudioBlob } from '@/lib/storage';
import AudioPlayer from '@/components/shared/AudioPlayer';
import { Mic, Square, Pause, Play, RotateCcw, ArrowRight } from 'lucide-react';

export default function AudioRecorder() {
  const settings = useAppStore((s) => s.settings);
  const isRecording = useAppStore((s) => s.isRecording);
  const setIsRecording = useAppStore((s) => s.setIsRecording);
  const recordingDuration = useAppStore((s) => s.recordingDuration);
  const setRecordingDuration = useAppStore((s) => s.setRecordingDuration);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const addSession = useAppStore((s) => s.addSession);
  const setPage = useAppStore((s) => s.setPage);
  const setProcessingStep = useAppStore((s) => s.setProcessingStep);

  const isArabic = settings.language === 'ar';

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Review state — after recording, user can play back before processing
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [reviewDuration, setReviewDuration] = useState(0);
  const [reviewBlobSize, setReviewBlobSize] = useState(0);
  const [reviewMimeType, setReviewMimeType] = useState('');

  // Fully clean up all recording resources
  const cleanupRecordingResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop all media tracks FIRST
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
        });
      } catch (e) {
        console.warn('Error stopping tracks:', e);
      }
      streamRef.current = null;
    }

    // Close AudioContext — this is THE critical step that prevents the
    // "second recording is silent" bug. Without this, the browser's audio
    // subsystem can get into a broken state.
    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
        }
      } catch (e) {
        console.warn('Error closing AudioContext:', e);
      }
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecordingResources();
    };
  }, [cleanupRecordingResources]);

  // Waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;

      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isRecording && !isPaused
        ? 'var(--destructive)'
        : 'var(--primary)';
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    draw();
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    setMicError(null);
    // Clear any previous review state
    setReviewSessionId(null);

    // Clean up all lingering resources before starting fresh
    cleanupRecordingResources();

    try {
      // Use permissive constraints — DON'T force sampleRate.
      // Forcing sampleRate: 16000 causes silent recordings on many devices.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Verify stream has active audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }
      console.log('[AudioRecorder] Got audio track:', audioTracks[0].label,
        'settings:', JSON.stringify(audioTracks[0].getSettings()));

      streamRef.current = stream;

      // Create a fresh AudioContext for waveform visualization
      const audioCtx = new AudioContext();
      // CRITICAL: Resume the AudioContext. Some browsers create it in "suspended" state.
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getRecordingMimeType();
      console.log('[AudioRecorder] Using MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });

      // Reset chunks
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('[AudioRecorder] Got chunk:', e.data.size, 'bytes, total chunks:', chunksRef.current.length);
        }
      };

      recorder.onerror = (event) => {
        console.error('[AudioRecorder] MediaRecorder error:', event);
        setMicError(
          isArabic
            ? 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.'
            : 'An error occurred during recording. Please try again.'
        );
        setIsRecording(false);
        setIsPaused(false);
        cleanupRecordingResources();
      };

      recorder.onstop = async () => {
        // Snapshot the data BEFORE any cleanup
        const chunks = [...chunksRef.current];
        const duration = useAppStore.getState().recordingDuration;
        const currentMimeType = mimeType;

        // Clean up hardware resources
        cleanupRecordingResources();

        console.log('[AudioRecorder] Recording stopped. Chunks:', chunks.length,
          'Duration:', duration, 'seconds');

        if (chunks.length === 0) {
          console.error('[AudioRecorder] No audio chunks were recorded!');
          setMicError(
            isArabic
              ? 'لم يتم تسجيل أي صوت. تأكد من أن الميكروفون يعمل وحاول مرة أخرى.'
              : 'No audio was recorded. Make sure your microphone is working and try again.'
          );
          return;
        }

        const blob = new Blob(chunks, { type: currentMimeType });
        console.log('[AudioRecorder] Created blob:', blob.size, 'bytes, type:', blob.type);

        if (blob.size < 100) {
          console.error('[AudioRecorder] Audio blob is too small:', blob.size);
          setMicError(
            isArabic
              ? 'التسجيل فارغ. تأكد من أن الميكروفون يعمل بشكل صحيح.'
              : 'Recording is empty. Make sure your microphone is working properly.'
          );
          return;
        }

        const sessionId = generateSessionId();

        // Save audio to IndexedDB
        await saveAudioBlob(sessionId, blob);

        // Go to review state — let the user play back the audio before processing
        setReviewSessionId(sessionId);
        setReviewDuration(duration);
        setReviewBlobSize(blob.size);
        setReviewMimeType(currentMimeType);
      };

      mediaRecorderRef.current = recorder;
      // timeslice = 500ms — collect data frequently to avoid losing audio
      recorder.start(500);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(useAppStore.getState().recordingDuration + 1);
      }, 1000);

      // Start waveform
      drawWaveform();
    } catch (err: unknown) {
      console.error('[AudioRecorder] Microphone error:', err);
      cleanupRecordingResources();

      let errorMsg: string;
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = isArabic
            ? 'تم رفض إذن الميكروفون. يرجى السماح بالوصول من إعدادات المتصفح.'
            : 'Microphone permission denied. Please allow access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = isArabic
            ? 'لم يتم العثور على ميكروفون. تأكد من توصيل ميكروفون.'
            : 'No microphone found. Make sure a microphone is connected.';
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          errorMsg = isArabic
            ? 'الميكروفون مستخدم من تطبيق آخر. أغلق التطبيقات الأخرى وحاول مرة أخرى.'
            : 'Microphone is in use by another app. Close other apps and try again.';
        } else {
          errorMsg = isArabic
            ? `خطأ في الميكروفون: ${err.message}`
            : `Microphone error: ${err.message}`;
        }
      } else {
        errorMsg = isArabic
          ? 'الرجاء السماح بالوصول إلى الميكروفون'
          : 'Please allow microphone access';
      }
      setMicError(errorMsg);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      // Request any pending data, then stop
      try {
        recorder.requestData();
      } catch (e) {
        console.warn('[AudioRecorder] requestData failed:', e);
      }
      recorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingDuration(useAppStore.getState().recordingDuration + 1);
      }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
    }
  };

  // Process the reviewed recording
  const handleProcessRecording = () => {
    if (!reviewSessionId) return;

    const session = {
      id: reviewSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'uploading' as const,
      audioKey: reviewSessionId,
      audioDuration: reviewDuration,
      audioSize: reviewBlobSize,
      audioMimeType: reviewMimeType,
      modelUsed: settings.model,
    };

    addSession(session);
    setActiveSessionId(reviewSessionId);
    setProcessingStep('uploading');
    setReviewSessionId(null);
    setRecordingDuration(0);
    setPage('processing');
  };

  // Discard and re-record
  const handleDiscardRecording = () => {
    setReviewSessionId(null);
    setReviewDuration(0);
    setReviewBlobSize(0);
    setReviewMimeType('');
    setRecordingDuration(0);
  };

  // ---- REVIEW STATE ----
  if (reviewSessionId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '32px 16px',
        }}
      >
        {/* Success indicator */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
          className="animate-scale-in"
        >
          <Mic size={28} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
          >
            {isArabic ? 'تم التسجيل بنجاح!' : 'Recording Complete!'}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--foreground-muted)',
            }}
          >
            {isArabic ? 'استمع للتسجيل قبل المتابعة' : 'Listen to your recording before proceeding'}
          </p>
        </div>

        {/* Duration & size info */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '0.813rem',
            color: 'var(--foreground-secondary)',
          }}
        >
          <span>
            ⏱ {formatDuration(reviewDuration)}
          </span>
          <span>
            📁 {(reviewBlobSize / 1024).toFixed(0)} KB
          </span>
        </div>

        {/* Audio player */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <AudioPlayer audioKey={reviewSessionId} mimeType={reviewMimeType} />
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <button
            onClick={handleDiscardRecording}
            className="btn btn-outline"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={18} />
            {isArabic ? 'إعادة التسجيل' : 'Re-record'}
          </button>
          <button
            onClick={handleProcessRecording}
            className="btn btn-primary"
            style={{
              flex: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            }}
          >
            {isArabic ? 'بدء التحليل' : 'Start Analysis'}
            <ArrowRight size={18} className="flip-rtl" />
          </button>
        </div>
      </div>
    );
  }

  // ---- RECORDING STATE ----
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '32px 16px',
      }}
    >
      {/* Waveform */}
      <div
        style={{
          width: '100%',
          height: '80px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          style={{ width: '100%', height: '100%' }}
        />
        {!isRecording && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--foreground-muted)',
              fontSize: '0.813rem',
            }}
          >
            {isArabic ? 'اضغط للتسجيل' : 'Tap to start recording'}
          </div>
        )}
      </div>

      {/* Timer */}
      <div
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          fontFamily: 'var(--font-geist-mono)',
          color: isRecording ? 'var(--destructive)' : 'var(--foreground)',
          letterSpacing: '2px',
        }}
        className={isRecording && !isPaused ? 'animate-recording-pulse' : ''}
      >
        {formatDuration(recordingDuration)}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isRecording ? (
          <>
            {/* Pause/Resume */}
            <button
              id="btn-pause"
              onClick={togglePause}
              className="btn btn-outline btn-icon-lg"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>

            {/* Stop */}
            <button
              id="btn-stop-recording"
              onClick={stopRecording}
              className="btn btn-destructive btn-icon-lg"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-full)',
                position: 'relative',
              }}
              aria-label="Stop recording"
            >
              {/* Pulse ring */}
              <div
                className="animate-pulse-ring"
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--destructive)',
                  opacity: 0.3,
                }}
              />
              <Square size={28} fill="white" />
            </button>
          </>
        ) : (
          /* Start button */
          <button
            id="btn-start-recording"
            onClick={startRecording}
            className="btn btn-primary"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            }}
            aria-label="Start recording"
          >
            <Mic size={32} />
          </button>
        )}
      </div>

      {/* Mic error */}
      {micError && (
        <div
          className="animate-fade-in"
          style={{
            padding: '10px 16px',
            background: 'var(--destructive-soft)',
            color: 'var(--destructive)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.813rem',
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: '340px',
          }}
        >
          {micError}
        </div>
      )}

      {/* Hint */}
      <p
        style={{
          color: 'var(--foreground-muted)',
          fontSize: '0.813rem',
          textAlign: 'center',
          maxWidth: '280px',
        }}
      >
        {isRecording
          ? isArabic
            ? 'التسجيل جارٍ... اضغط على الزر الأحمر للإيقاف'
            : 'Recording... Tap the red button to stop'
          : isArabic
            ? 'ضع الجهاز بالقرب من المحادثة وابدأ التسجيل'
            : 'Place the device near the conversation and start recording'}
      </p>
    </div>
  );
}
