// ============================================================
// EZVisit — Settings Page (Simplified)
// ============================================================

'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { clearAllSessions } from '@/lib/storage';
import {
  Key,
  Cpu,
  Globe,
  Trash2,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const loadSessions = useAppStore((s) => s.loadSessions);
  const logout = useAppStore((s) => s.logout);
  const authUser = useAppStore((s) => s.authUser);

  const isArabic = settings.language === 'ar';
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);

  const handleSaveApiKey = () => {
    updateSettings({ apiKey: apiKeyInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    const msg = isArabic
      ? 'هل أنت متأكد؟ سيتم حذف جميع الجلسات والبيانات نهائياً.'
      : 'Are you sure? All sessions and data will be permanently deleted.';
    if (confirm(msg)) {
      clearAllSessions();
      loadSessions();
    }
  };

  return (
    <div
      className="page-enter"
      style={{ padding: '16px', paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* API Key Section */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Key size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
            {isArabic ? 'مفتاح API' : 'API Key'}
          </h3>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
          {isArabic
            ? 'اختياري — استخدم مفتاح Groq المجاني (console.groq.com)'
            : 'Optional — Use free Groq API key (console.groq.com)'}
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="gsk-..."
              style={{
                width: '100%',
                padding: '10px 36px 10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                outline: 'none',
                fontFamily: 'var(--font-geist-mono)',
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="btn-ghost btn-icon"
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px',
              }}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onClick={handleSaveApiKey}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            {saved ? <CheckCircle2 size={16} /> : isArabic ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>

      {/* AI Status */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Cpu size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
            {isArabic ? 'حالة الذكاء الاصطناعي' : 'AI Status'}
          </h3>
        </div>

        <div style={{ 
          padding: '12px', 
          borderRadius: 'var(--radius-sm)', 
          background: 'var(--surface-hover)',
          fontSize: '0.813rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--foreground-muted)' }}>{isArabic ? 'المزود:' : 'Provider:'}</span>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Groq (Free)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--foreground-muted)' }}>{isArabic ? 'النماذج:' : 'Models:'}</span>
            <span style={{ fontWeight: 600 }}>Whisper Large V3 & Llama 3.3 70B</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(270, 40%, 95%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(270, 55%, 55%)',
            }}
          >
            <Globe size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
            {isArabic ? 'اللغة' : 'Language'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => updateSettings({ language: 'ar' })}
            className={`btn ${settings.language === 'ar' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            العربية
          </button>
          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`btn ${settings.language === 'en' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            English
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--destructive-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--destructive)',
            }}
          >
            <Trash2 size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
            {isArabic ? 'إدارة البيانات' : 'Data Management'}
          </h3>
        </div>

        <button
          onClick={handleClearData}
          className="btn btn-destructive"
          style={{ width: '100%' }}
        >
          <Trash2 size={18} />
          {isArabic ? 'حذف جميع البيانات' : 'Delete All Data'}
        </button>
      </div>

      {/* Sign Out */}
      <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--warning-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning)',
            }}
          >
            <LogOut size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
              {isArabic ? 'الحساب' : 'Account'}
            </h3>
            {authUser?.email && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                {authUser.email}
              </p>
            )}
          </div>
        </div>

        <button
          id="btn-logout"
          onClick={logout}
          className="btn btn-outline"
          style={{
            width: '100%',
            color: 'var(--warning)',
            borderColor: 'var(--warning)',
          }}
        >
          <LogOut size={18} />
          {isArabic ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>

      {/* About */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--foreground-muted)',
            }}
          >
            <Info size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.938rem', fontWeight: 700 }}>
            {isArabic ? 'حول' : 'About'}
          </h3>
        </div>
        <p style={{ fontSize: '0.813rem', color: 'var(--foreground-muted)', margin: 0, lineHeight: 1.6 }}>
          {isArabic
            ? 'EZVisit هي أداة بحثية لتحليل التواصل الطبي باستخدام الذكاء الاصطناعي. الإصدار 0.1.0'
            : 'EZVisit is a research tool for analyzing medical communication using AI. Version 0.1.0'}
        </p>
      </div>
    </div>
  );
}
