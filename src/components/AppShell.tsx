// ============================================================
// EZVisit — Main App Shell (Client Component)
// ============================================================

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { onAuthChange } from '@/lib/firebase';
import Header from '@/components/shared/Header';
import BottomNav from '@/components/shared/BottomNav';
import ConsentDialog from '@/components/recording/ConsentDialog';
import LoginPage from '@/components/pages/LoginPage';
import HomePage from '@/components/pages/HomePage';
import RecordPage from '@/components/pages/RecordPage';
import ProcessingPage from '@/components/pages/ProcessingPage';
import ResultsPage from '@/components/pages/ResultsPage';
import HistoryPage from '@/components/pages/HistoryPage';
import SettingsPage from '@/components/pages/SettingsPage';

export default function AppShell() {
  const currentPage = useAppStore((s) => s.currentPage);
  const settings = useAppStore((s) => s.settings);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const loadSessions = useAppStore((s) => s.loadSessions);
  const setHasConsented = useAppStore((s) => s.setHasConsented);

  // Auth state
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authLoading = useAppStore((s) => s.authLoading);
  const setAuthUser = useAppStore((s) => s.setAuthUser);

  const isArabic = settings.language === 'ar';

  // Subscribe to Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, [setAuthUser]);

  // Initialize app data on mount
  useEffect(() => {
    loadSettings();
    loadSessions();

    // Check consent
    if (typeof window !== 'undefined') {
      const consented = localStorage.getItem('ezvisit-consented') === 'true';
      setHasConsented(consented);
    }
  }, [loadSettings, loadSessions, setHasConsented]);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
  }, [isArabic]);

  // --- Auth Loading State ---
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="auth-loading-pulse"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'white',
            }}
          >
            EZ
          </div>
          <p
            style={{
              color: 'var(--foreground-muted)',
              fontSize: '0.875rem',
              margin: 0,
            }}
          >
            {isArabic ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // --- Not Authenticated → Login Page ---
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // --- Authenticated → Main App ---
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto',
        position: 'relative',
        background: 'var(--background)',
      }}
    >
      <Header />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          paddingBottom: 'var(--bottom-nav-height)',
          overflow: 'auto',
          width: '100%',
        }}
      >
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'record' && <RecordPage />}
        {currentPage === 'processing' && <ProcessingPage />}
        {currentPage === 'results' && <ResultsPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      <BottomNav />
      <ConsentDialog />
    </div>
  );
}

