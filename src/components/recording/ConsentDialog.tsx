// ============================================================
// EZVisit — Consent Dialog
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import { Shield, X } from 'lucide-react';
import { useState } from 'react';

export default function ConsentDialog() {
  const showConsentDialog = useAppStore((s) => s.showConsentDialog);
  const setShowConsentDialog = useAppStore((s) => s.setShowConsentDialog);
  const setHasConsented = useAppStore((s) => s.setHasConsented);
  const settings = useAppStore((s) => s.settings);
  const setPage = useAppStore((s) => s.setPage);
  const [agreed, setAgreed] = useState(false);

  const isArabic = settings.language === 'ar';

  if (!showConsentDialog) return null;

  const handleAccept = () => {
    setHasConsented(true);
    setShowConsentDialog(false);
    setPage('record');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      className="animate-fade-in"
    >
      <div
        className="card animate-scale-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius)',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Shield size={22} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              {isArabic ? 'موافقة مستنيرة' : 'Informed Consent'}
            </h2>
          </div>
          <button
            onClick={() => setShowConsentDialog(false)}
            className="btn-ghost btn-icon"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--foreground-secondary)',
          }}
        >
          {isArabic ? (
            <>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>الغرض:</strong> هذه أداة بحثية لتحليل التواصل بين الطبيب والمريض. لا تُستخدم لأغراض سريرية أو تشخيصية.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>التسجيل:</strong> سيتم تسجيل المحادثة الصوتية وإرسالها إلى خدمة ذكاء اصطناعي خارجية (OpenRouter) للنسخ والتحليل.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>البيانات:</strong> يتم تخزين التسجيلات والنتائج محلياً على جهازك فقط. يمكنك حذف جميع البيانات في أي وقت من الإعدادات.
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--foreground)' }}>الخصوصية:</strong> لا يتم مشاركة بياناتك مع أي طرف ثالث. الملفات الصوتية تُستخدم فقط للمعالجة ولا يتم تخزينها على خوادم خارجية.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Purpose:</strong> This is a research tool for analyzing doctor-patient communication. It is not intended for clinical or diagnostic use.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Recording:</strong> The audio conversation will be recorded and sent to an external AI service (OpenRouter) for transcription and analysis.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Data Storage:</strong> Recordings and results are stored locally on your device only. You can delete all data anytime from Settings.
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Privacy:</strong> Your data is not shared with any third party. Audio files are only used for processing and are not stored on external servers.
              </p>
            </>
          )}
        </div>

        {/* Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            background: 'var(--surface-hover)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              marginTop: '2px',
              accentColor: 'var(--primary)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--foreground)' }}>
            {isArabic
              ? 'أقر بأنني قرأت وفهمت الشروط أعلاه وأوافق على المتابعة.'
              : 'I acknowledge that I have read and understood the above terms and agree to proceed.'}
          </span>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowConsentDialog(false)}
            className="btn btn-ghost"
            style={{ flex: 1 }}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleAccept}
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={!agreed}
          >
            {isArabic ? 'موافق ومتابعة' : 'Agree & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
