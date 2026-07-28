// ============================================================
// EZVisit — Home Page
// ============================================================

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Mic, Upload, Clock, BarChart3, ChevronRight } from 'lucide-react';
import { formatDuration, formatRelativeDate } from '@/lib/utils';

export default function HomePage() {
  const settings = useAppStore((s) => s.settings);
  const setPage = useAppStore((s) => s.setPage);
  const sessions = useAppStore((s) => s.sessions);
  const hasConsented = useAppStore((s) => s.hasConsented);
  const setShowConsentDialog = useAppStore((s) => s.setShowConsentDialog);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const loadSessions = useAppStore((s) => s.loadSessions);

  const isArabic = settings.language === 'ar';

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartRecording = () => {
    if (!hasConsented) {
      setShowConsentDialog(true);
    } else {
      setPage('record');
    }
  };

  const recentSessions = sessions.slice(0, 3);
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.audioDuration || 0), 0);

  return (
    <div
      className="page-enter"
      style={{ padding: '24px 16px' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)',
          }}
        >
          <Mic size={32} color="white" />
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--foreground)',
            margin: '0 0 6px',
          }}
        >
          {isArabic ? 'مرحباً بك في EZVisit' : 'Welcome to EZVisit'}
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--foreground-secondary)',
            margin: 0,
            maxWidth: '320px',
            marginInline: 'auto',
            lineHeight: 1.6,
          }}
        >
          {isArabic
            ? 'حلل محادثات الطبيب والمريض باستخدام الذكاء الاصطناعي'
            : 'Analyze doctor-patient conversations using AI'}
        </p>
      </div>

      {/* Main action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        <button
          id="btn-start"
          onClick={handleStartRecording}
          className="btn btn-primary btn-lg"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--primary), hsl(220, 70%, 50%))',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
            fontSize: '1.063rem',
          }}
        >
          <Mic size={22} />
          {isArabic ? 'ابدأ التسجيل' : 'Start Recording'}
        </button>

        <button
          id="btn-upload"
          onClick={() => {
            if (!hasConsented) {
              setShowConsentDialog(true);
            } else {
              setPage('record');
            }
          }}
          className="btn btn-outline btn-lg"
          style={{ width: '100%' }}
        >
          <Upload size={20} />
          {isArabic ? 'رفع ملف صوتي' : 'Upload Audio File'}
        </button>
      </div>

      {/* Stats Row */}
      {sessions.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--primary)' }}>
              {completedCount}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: 0, fontWeight: 600 }}>
              {isArabic ? 'جلسة مكتملة' : 'Completed'}
            </p>
          </div>
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--accent)' }}>
              {formatDuration(totalDuration)}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: 0, fontWeight: 600 }}>
              {isArabic ? 'إجمالي المدة' : 'Total Duration'}
            </p>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '0.938rem',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              {isArabic ? 'الجلسات الأخيرة' : 'Recent Sessions'}
            </h2>
            <button
              onClick={() => setPage('history')}
              className="btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}
            >
              {isArabic ? 'عرض الكل' : 'View All'}
              <ChevronRight size={14} className="flip-rtl" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="card card-interactive"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => {
                  if (session.status === 'completed') {
                    setActiveSessionId(session.id);
                    setPage('results');
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background:
                        session.status === 'completed'
                          ? 'var(--accent-soft)'
                          : session.status === 'error'
                            ? 'var(--destructive-soft)'
                            : 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {session.status === 'completed' ? (
                      <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <Clock size={18} style={{ color: 'var(--primary)' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.name || session.summary?.mainComplaint ||
                        (isArabic ? 'جلسة تسجيل' : 'Recording Session')}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                      {formatRelativeDate(session.createdAt)} · {formatDuration(session.audioDuration)}
                    </p>
                  </div>
                </div>
                <span
                  className={`badge badge-${session.status === 'completed' ? 'accent' : session.status === 'error' ? 'destructive' : 'primary'}`}
                >
                  {session.status === 'completed'
                    ? isArabic ? 'مكتمل' : 'Done'
                    : session.status === 'error'
                      ? isArabic ? 'خطأ' : 'Error'
                      : isArabic ? 'قيد المعالجة' : 'Processing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div
          className="card"
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', margin: '0 0 4px' }}>
            {isArabic ? 'لا توجد جلسات بعد' : 'No sessions yet'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: 0 }}>
            {isArabic
              ? 'ابدأ بتسجيل أو رفع ملف صوتي'
              : 'Start by recording or uploading an audio file'}
          </p>
        </div>
      )}
    </div>
  );
}
