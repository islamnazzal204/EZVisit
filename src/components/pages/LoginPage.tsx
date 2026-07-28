// ============================================================
// EZVisit — Login Page
// ============================================================

'use client';

import { useState } from 'react';
import { signInWithEmail } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = () => {
    updateSettings({ language: isArabic ? 'en' : 'ar' });
  };

  const getErrorMessage = (code: string): string => {
    const messages: Record<string, [string, string]> = {
      'auth/invalid-email': ['البريد الإلكتروني غير صالح', 'Invalid email address'],
      'auth/user-not-found': ['لم يتم العثور على المستخدم', 'User not found'],
      'auth/wrong-password': ['كلمة المرور غير صحيحة', 'Incorrect password'],
      'auth/too-many-requests': ['محاولات كثيرة. حاول لاحقاً', 'Too many attempts. Try later'],
      'auth/invalid-credential': ['بيانات الدخول غير صحيحة', 'Invalid credentials'],
      'auth/network-request-failed': ['خطأ في الاتصال', 'Network error'],
    };
    const [ar, en] = messages[code] || ['حدث خطأ غير متوقع', 'An unexpected error occurred'];
    return isArabic ? ar : en;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // Auth state listener in AppShell will handle the redirect
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      setError(getErrorMessage(firebaseError.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--background)',
      }}
    >
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Language toggle — top corner */}
      <button
        id="login-lang-toggle"
        onClick={toggleLanguage}
        style={{
          position: 'absolute',
          top: '20px',
          right: isArabic ? 'auto' : '20px',
          left: isArabic ? '20px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--foreground-secondary)',
          fontSize: '0.813rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
      >
        {isArabic ? '🌐 EN' : '🌐 عربي'}
      </button>

      {/* Login Card */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          className="login-card"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl), 0 0 60px rgba(59, 130, 246, 0.08)',
            padding: '40px 32px',
          }}
        >
          {/* Logo & Branding */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              className="login-logo-pulse"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              EZ
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--foreground)',
                margin: '0 0 6px',
              }}
            >
              EZVisit
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--foreground-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {isArabic
                ? 'تحليل محادثات الطبيب والمريض بالذكاء الاصطناعي'
                : 'AI-Powered Medical Conversation Analysis'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email field */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  color: 'var(--foreground-secondary)',
                  marginBottom: '6px',
                }}
              >
                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="login-input-wrapper">
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    ...(isArabic ? { right: '14px' } : { left: '14px' }),
                    color: 'var(--foreground-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  autoComplete="email"
                  dir="ltr"
                  className="login-input"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    ...(isArabic ? { paddingRight: '42px' } : { paddingLeft: '42px' }),
                    borderRadius: 'var(--radius)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.938rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  color: 'var(--foreground-secondary)',
                  marginBottom: '6px',
                }}
              >
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="login-input-wrapper">
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    ...(isArabic ? { right: '14px' } : { left: '14px' }),
                    color: 'var(--foreground-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter your password'}
                  autoComplete="current-password"
                  dir="ltr"
                  className="login-input"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    ...(isArabic
                      ? { paddingRight: '42px', paddingLeft: '42px' }
                      : { paddingLeft: '42px', paddingRight: '42px' }),
                    borderRadius: 'var(--radius)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.938rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    ...(isArabic ? { left: '12px' } : { right: '12px' }),
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--foreground-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--destructive-soft)',
                  color: 'var(--destructive)',
                  fontSize: '0.813rem',
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                marginTop: '4px',
                background: isLoading
                  ? 'var(--primary-muted)'
                  : 'linear-gradient(135deg, var(--primary), hsl(220, 70%, 50%))',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.3)',
                fontSize: '1rem',
                position: 'relative',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="login-spinner" />
                  {isArabic ? 'جاري تسجيل الدخول...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--foreground-muted)',
              marginTop: '24px',
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            {isArabic
              ? '🔬 أداة بحثية — ليست للاستخدام السريري'
              : '🔬 Research Tool — Not for clinical use'}
          </p>
        </div>
      </div>
    </div>
  );
}
