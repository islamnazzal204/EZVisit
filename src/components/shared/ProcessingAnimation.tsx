// ============================================================
// EZVisit — Processing Animation
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import { Upload, AudioLines, Brain, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 'uploading', labelAr: 'جاري الرفع', labelEn: 'Uploading Audio', icon: Upload },
  { id: 'transcribing', labelAr: 'جاري النسخ', labelEn: 'Transcribing', icon: AudioLines },
  { id: 'analyzing', labelAr: 'جاري التحليل', labelEn: 'Analyzing', icon: Brain },
  { id: 'completed', labelAr: 'اكتمل!', labelEn: 'Complete!', icon: CheckCircle2 },
];

export default function ProcessingAnimation() {
  const settings = useAppStore((s) => s.settings);
  const processingStep = useAppStore((s) => s.processingStep);
  const processingError = useAppStore((s) => s.processingError);

  const isArabic = settings.language === 'ar';

  const currentStepIndex = steps.findIndex((s) => s.id === processingStep);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        minHeight: '60vh',
      }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {processingError ? (
        /* Error state */
        <div className="animate-scale-in" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--destructive-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--destructive)',
            }}
          >
            <AlertCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px' }}>
            {isArabic ? 'حدث خطأ' : 'An error occurred'}
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--foreground-secondary)',
              maxWidth: '300px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            {processingError}
          </p>
        </div>
      ) : (
        /* Steps */
        <>
          {/* Animated icon */}
          <div
            className="animate-scale-in"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: 'var(--radius-full)',
              background: processingStep === 'completed'
                ? 'var(--accent-soft)'
                : 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '28px',
              position: 'relative',
            }}
          >
            {processingStep !== 'completed' && processingStep !== 'idle' && (
              <div
                className="animate-pulse-ring"
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--primary)',
                  opacity: 0.2,
                }}
              />
            )}
            {processingStep === 'completed' ? (
              <CheckCircle2
                size={48}
                style={{ color: 'var(--accent)' }}
              />
            ) : processingStep !== 'idle' ? (
              <Loader2
                size={48}
                style={{
                  color: 'var(--primary)',
                  animation: 'spin-slow 2s linear infinite',
                }}
              />
            ) : (
              <Brain size={48} style={{ color: 'var(--primary)' }} />
            )}
          </div>

          {/* Step list */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              maxWidth: '300px',
            }}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = step.id === processingStep;
              const isDone = currentStepIndex > i;
              const isWaiting = currentStepIndex < i;

              return (
                <div
                  key={step.id}
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: isWaiting ? 0.4 : 1,
                    animationDelay: `${i * 0.15}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      background: isDone
                        ? 'var(--accent)'
                        : isActive
                          ? 'var(--primary)'
                          : 'var(--surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDone || isActive ? 'white' : 'var(--foreground-muted)',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} />
                    ) : isActive ? (
                      <Loader2 size={18} style={{ animation: 'spin-slow 1.5s linear infinite' }} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.938rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isDone
                        ? 'var(--accent)'
                        : isActive
                          ? 'var(--foreground)'
                          : 'var(--foreground-muted)',
                    }}
                  >
                    {isArabic ? step.labelAr : step.labelEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Subtitle */}
          {processingStep !== 'idle' && processingStep !== 'completed' && (
            <p
              style={{
                marginTop: '24px',
                fontSize: '0.813rem',
                color: 'var(--foreground-muted)',
                textAlign: 'center',
              }}
            >
              {isArabic
                ? 'قد يستغرق هذا بضع دقائق...'
                : 'This may take a few minutes...'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
