// ============================================================
// EZVisit — Summary View Component
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import type { ConversationSummary } from '@/types';
import {
  AlertCircle,
  Stethoscope,
  MessageSquare,
  BookOpen,
  Pill,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';

interface SummaryViewProps {
  summary: ConversationSummary;
}

interface SectionConfig {
  key: keyof ConversationSummary;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const sections: SectionConfig[] = [
  {
    key: 'mainComplaint',
    labelAr: 'الشكوى الرئيسية',
    labelEn: 'Main Complaint',
    icon: AlertCircle,
    color: 'var(--destructive)',
    bgColor: 'var(--destructive-soft)',
  },
  {
    key: 'symptomsDiscussed',
    labelAr: 'الأعراض',
    labelEn: 'Symptoms Discussed',
    icon: Stethoscope,
    color: 'var(--primary)',
    bgColor: 'var(--primary-soft)',
  },
  {
    key: 'questionsAsked',
    labelAr: 'الأسئلة المطروحة',
    labelEn: 'Questions Asked',
    icon: MessageSquare,
    color: 'hsl(270, 55%, 55%)',
    bgColor: 'hsl(270, 40%, 95%)',
  },
  {
    key: 'doctorExplanations',
    labelAr: 'شرح الطبيب',
    labelEn: "Doctor's Explanations",
    icon: BookOpen,
    color: 'hsl(200, 60%, 45%)',
    bgColor: 'hsl(200, 50%, 95%)',
  },
  {
    key: 'treatmentDiscussed',
    labelAr: 'العلاج المقترح',
    labelEn: 'Treatment Discussed',
    icon: Pill,
    color: 'var(--accent)',
    bgColor: 'var(--accent-soft)',
  },
  {
    key: 'followUpRecommendations',
    labelAr: 'توصيات المتابعة',
    labelEn: 'Follow-up Recommendations',
    icon: CalendarCheck,
    color: 'hsl(38, 80%, 48%)',
    bgColor: 'var(--warning-soft)',
  },
  {
    key: 'importantConcerns',
    labelAr: 'ملاحظات مهمة',
    labelEn: 'Important Concerns',
    icon: AlertTriangle,
    color: 'var(--warning)',
    bgColor: 'var(--warning-soft)',
  },
];

export default function SummaryView({ summary }: SummaryViewProps) {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';

  if (!summary) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
        {isArabic ? 'لا يوجد ملخص متاح' : 'No summary available'}
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {sections.map((section, i) => {
        const value = summary[section.key];
        const items = typeof value === 'string' ? [value] : (value as string[]) || [];
        if (!items.length || (items.length === 1 && !items[0])) return null;

        const Icon = section.icon;

        return (
          <div
            key={section.key}
            className="card animate-fade-in"
            style={{
              padding: '14px',
              animationDelay: `${i * 0.08}s`,
              animationFillMode: 'backwards',
            }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: section.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: section.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: section.color,
                }}
              >
                {isArabic ? section.labelAr : section.labelEn}
              </h3>
            </div>

            {/* Content */}
            {typeof value === 'string' ? (
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--foreground)' }}>
                {value}
              </p>
            ) : (
              <ul style={{ margin: 0, paddingInlineStart: '20px', listStyle: 'disc' }}>
                {items.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                      color: 'var(--foreground)',
                      marginBottom: '4px',
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
