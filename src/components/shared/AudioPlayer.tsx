// ============================================================
// EZVisit — Audio Player Component
// ============================================================

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { getAudioBlob } from '@/lib/storage';
import { formatDuration } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  /** The key used to retrieve the audio blob from IndexedDB */
  audioKey: string;
  /** Optional MIME type for the audio blob */
  mimeType?: string;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export default function AudioPlayer({ audioKey, mimeType, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audio blob from IndexedDB
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const blob = await getAudioBlob(audioKey);
        if (cancelled) return;

        if (!blob) {
          setError('Audio not found');
          setIsLoading(false);
          return;
        }

        // Create object URL for the audio blob
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load audio:', err);
        setError('Failed to load audio');
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioKey]);

  // Set up audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Play failed:', err);
        setError('Playback failed');
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audio.currentTime = ratio * duration;
  }, [duration]);

  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div
        style={{
          padding: compact ? '8px 12px' : '12px 16px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--foreground-muted)',
          fontSize: '0.813rem',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin-slow 1s linear infinite',
          }}
        />
        Loading audio...
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div
        style={{
          padding: compact ? '8px 12px' : '12px 16px',
          background: 'var(--destructive-soft)',
          borderRadius: 'var(--radius)',
          color: 'var(--destructive)',
          fontSize: '0.813rem',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {error || 'Audio unavailable'}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: compact ? '8px 12px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '6px' : '10px',
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          style={{
            width: compact ? '32px' : '40px',
            height: compact ? '32px' : '40px',
            borderRadius: 'var(--radius-full)',
            background: isPlaying
              ? 'var(--primary)'
              : 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={compact ? 14 : 18} fill="white" />
          ) : (
            <Play size={compact ? 14 : 18} fill="white" style={{ marginLeft: '2px' }} />
          )}
        </button>

        {/* Progress bar + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Progress bar */}
          <div
            onClick={handleSeek}
            style={{
              width: '100%',
              height: compact ? '4px' : '6px',
              background: 'var(--border)',
              borderRadius: '3px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                borderRadius: '3px',
                transition: 'width 0.1s linear',
              }}
            />
            {/* Seek handle */}
            {duration > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: compact ? '10px' : '14px',
                  height: compact ? '10px' : '14px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  border: '2px solid white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.1s linear',
                }}
              />
            )}
          </div>

          {/* Time labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: compact ? '0.688rem' : '0.75rem',
              color: 'var(--foreground-muted)',
              fontFamily: 'var(--font-geist-mono)',
            }}
          >
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{duration > 0 ? formatDuration(Math.floor(duration)) : '--:--'}</span>
          </div>
        </div>

        {/* Restart button */}
        <button
          onClick={handleRestart}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--foreground-muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          aria-label="Restart"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--foreground-muted)')}
        >
          <RotateCcw size={compact ? 14 : 16} />
        </button>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isMuted ? 'var(--destructive)' : 'var(--foreground-muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={compact ? 14 : 16} /> : <Volume2 size={compact ? 14 : 16} />}
        </button>
      </div>
    </div>
  );
}
