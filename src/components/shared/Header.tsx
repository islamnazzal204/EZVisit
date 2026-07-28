// ============================================================
// EZVisit — Header Component
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import { Globe, ArrowLeft } from 'lucide-react';

export default function Header() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);

  const isArabic = settings.language === 'ar';
  const showBack = currentPage !== 'home';

  const toggleLanguage = () => {
    updateSettings({ language: isArabic ? 'en' : 'ar' });
  };

  return (
    <header
      className="glass safe-top"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'var(--header-height)',
          padding: '0 16px',
          maxWidth: '768px',
          margin: '0 auto',
        }}
      >
        {/* Left: Back button or Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
          {showBack ? (
            <button
              id="btn-back"
              onClick={() => setPage('home')}
              className="btn-ghost btn-icon"
              style={{ padding: '8px' }}
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="flip-rtl" />
            </button>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              EZ
            </div>
            {!showBack && (
              <span style={{ fontWeight: 700, fontSize: '1.063rem', color: 'var(--foreground)' }}>
                EZVisit
              </span>
            )}
          </div>
        </div>

        {/* Center: Page title */}
        {showBack && (
          <h1
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {getPageTitle(currentPage, isArabic)}
          </h1>
        )}

        {/* Right: Language toggle */}
        <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            id="btn-language"
            onClick={toggleLanguage}
            className="btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.813rem',
              fontWeight: 600,
            }}
          >
            <Globe size={16} />
            {isArabic ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {/* Research disclaimer */}
      <div
        style={{
          background: 'var(--warning-soft)',
          padding: '4px 16px',
          textAlign: 'center',
          fontSize: '0.688rem',
          color: 'var(--warning)',
          fontWeight: 600,
        }}
      >
        {isArabic ? '🔬 أداة بحثية — ليست للاستخدام السريري' : '🔬 Research Tool — Not for clinical use'}
      </div>
    </header>
  );
}

function getPageTitle(page: string, isArabic: boolean): string {
  const titles: Record<string, [string, string]> = {
    record: ['تسجيل جديد', 'New Recording'],
    processing: ['جاري المعالجة', 'Processing'],
    results: ['النتائج', 'Results'],
    history: ['السجل', 'History'],
    settings: ['الإعدادات', 'Settings'],
  };
  const [ar, en] = titles[page] || ['', ''];
  return isArabic ? ar : en;
}
