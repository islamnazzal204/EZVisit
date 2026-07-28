// ============================================================
// EZVisit — Bottom Navigation (Mobile)
// ============================================================

'use client';

import { useAppStore, type AppPage } from '@/lib/store';
import {
  Home,
  Mic,
  Clock,
  Settings,
} from 'lucide-react';

interface NavItem {
  id: AppPage;
  label: string;
  labelAr: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', labelAr: 'الرئيسية', icon: Home },
  { id: 'record', label: 'Record', labelAr: 'تسجيل', icon: Mic },
  { id: 'history', label: 'History', labelAr: 'السجل', icon: Clock },
  { id: 'settings', label: 'Settings', labelAr: 'إعدادات', icon: Settings },
];

export default function BottomNav() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);
  const settings = useAppStore((s) => s.settings);

  const isArabic = settings.language === 'ar';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 glass safe-bottom"
      style={{
        zIndex: 50,
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-around"
        style={{
          maxWidth: '768px',
          margin: '0 auto',
          height: 'var(--bottom-nav-height)',
        }}
      >
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setPage(item.id)}
              className="btn-ghost"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--primary)' : 'var(--foreground-muted)',
                background: isActive ? 'var(--primary-soft)' : 'transparent',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                minWidth: '64px',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '0.688rem', fontWeight: isActive ? 700 : 500 }}>
                {isArabic ? item.labelAr : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
