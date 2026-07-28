// ============================================================
// EZVisit — Patient Instructions View
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import type { PatientInstructions } from '@/types';
import { Pill, Heart, CalendarCheck, AlertTriangle, Siren } from 'lucide-react';

interface PatientInstructionsViewProps {
  instructions: PatientInstructions;
}

export default function PatientInstructionsView({ instructions }: PatientInstructionsViewProps) {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';

  if (!instructions) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
        {isArabic ? 'لا تتوفر تعليمات' : 'No instructions available'}
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}
      dir="rtl"
    >
      {/* Medications */}
      {instructions.medications?.length > 0 && (
        <Section
          icon={Pill}
          title="الأدوية"
          titleEn="Medications"
          color="var(--primary)"
          bgColor="var(--primary-soft)"
          isArabic={isArabic}
          index={0}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {instructions.medications.map((med, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.938rem', color: 'var(--foreground)' }}>
                  {med.name}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  {med.dosage && (
                    <span className="badge badge-primary">{med.dosage}</span>
                  )}
                  {med.frequency && (
                    <span className="badge badge-accent">{med.frequency}</span>
                  )}
                </div>
                {med.instructions && (
                  <p style={{ margin: 0, fontSize: '0.813rem', color: 'var(--foreground-secondary)', lineHeight: 1.6 }}>
                    {med.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Lifestyle */}
      {instructions.lifestyleRecommendations?.length > 0 && (
        <Section
          icon={Heart}
          title="نصائح نمط الحياة"
          titleEn="Lifestyle Recommendations"
          color="var(--accent)"
          bgColor="var(--accent-soft)"
          isArabic={isArabic}
          index={1}
        >
          <List items={instructions.lifestyleRecommendations} />
        </Section>
      )}

      {/* Follow-up */}
      {instructions.followUpAppointments?.length > 0 && (
        <Section
          icon={CalendarCheck}
          title="مواعيد المتابعة"
          titleEn="Follow-up Appointments"
          color="hsl(200, 60%, 45%)"
          bgColor="hsl(200, 50%, 95%)"
          isArabic={isArabic}
          index={2}
        >
          <List items={instructions.followUpAppointments} />
        </Section>
      )}

      {/* Warning signs */}
      {instructions.warningSigns?.length > 0 && (
        <Section
          icon={AlertTriangle}
          title="علامات تحذيرية"
          titleEn="Warning Signs"
          color="var(--warning)"
          bgColor="var(--warning-soft)"
          isArabic={isArabic}
          index={3}
        >
          <List items={instructions.warningSigns} />
        </Section>
      )}

      {/* Emergency signs */}
      {instructions.emergencySigns?.length > 0 && (
        <Section
          icon={Siren}
          title="متى تذهب للطوارئ"
          titleEn="When to Seek Emergency Care"
          color="var(--destructive)"
          bgColor="var(--destructive-soft)"
          isArabic={isArabic}
          index={4}
        >
          <List items={instructions.emergencySigns} />
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  titleEn,
  color,
  bgColor,
  isArabic,
  children,
  index,
}: {
  icon: React.ElementType;
  title: string;
  titleEn: string;
  color: string;
  bgColor: string;
  isArabic: boolean;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: '14px',
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'backwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={16} />
        </div>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color }}>
          {isArabic ? title : titleEn}
        </h3>
      </div>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingInlineStart: '20px', listStyle: 'disc' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: '0.875rem',
            lineHeight: 1.8,
            color: 'var(--foreground)',
            marginBottom: '4px',
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
