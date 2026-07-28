// ============================================================
// EZVisit — Transcript View Component
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import type { DiarizedSegment } from '@/types';
import { User, Stethoscope, HelpCircle } from 'lucide-react';

interface TranscriptViewProps {
  segments: DiarizedSegment[];
  rawTranscript?: string;
}

export default function TranscriptView({ segments, rawTranscript }: TranscriptViewProps) {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';

  if (!segments?.length && !rawTranscript) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
        {isArabic ? 'لا يوجد نص محادثة' : 'No transcript available'}
      </div>
    );
  }

  // If we have diarized segments, show them with speaker labels
  if (segments?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }} dir="rtl">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`animate-fade-in speaker-${seg.speaker}`}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              animationDelay: `${i * 0.05}s`,
              animationFillMode: 'backwards',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {seg.speaker === 'doctor' ? (
                <>
                  <Stethoscope size={14} />
                  {isArabic ? 'الطبيب' : 'Doctor'}
                </>
              ) : seg.speaker === 'patient' ? (
                <>
                  <User size={14} />
                  {isArabic ? 'المريض' : 'Patient'}
                </>
              ) : (
                <>
                  <HelpCircle size={14} />
                  {isArabic ? 'غير محدد' : 'Unknown'}
                </>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.938rem', lineHeight: 1.8, color: 'var(--foreground)' }}>
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: raw transcript
  return (
    <div
      dir="rtl"
      style={{
        padding: '16px',
        fontSize: '0.938rem',
        lineHeight: 1.9,
        color: 'var(--foreground)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {rawTranscript}
    </div>
  );
}
