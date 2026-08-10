// ============================================================
// EZVisit — Summary View Component
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import type { ConversationSummary, PatientHistory, SOCRATESHistory } from '@/types';
import {
  AlertCircle,
  Stethoscope,
  MessageSquare,
  BookOpen,
  Pill,
  CalendarCheck,
  AlertTriangle,
  User,
  FileText,
  Activity,
  Clock,
  Users,
  Home,
  Clipboard,
  Heart,
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

// --- Patient History sub-section config ---

interface HistorySubSection {
  key: keyof PatientHistory;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  type: 'text' | 'list' | 'socrates';
}

const historySubSections: HistorySubSection[] = [
  {
    key: 'patientProfile',
    labelAr: 'الملف الشخصي للمريض',
    labelEn: 'Patient Profile',
    icon: User,
    color: 'hsl(220, 60%, 50%)',
    bgColor: 'hsl(220, 50%, 95%)',
    type: 'text',
  },
  {
    key: 'presentingComplaint',
    labelAr: 'الشكوى الحالية',
    labelEn: 'Presenting Complaint',
    icon: FileText,
    color: 'hsl(0, 65%, 55%)',
    bgColor: 'hsl(0, 50%, 95%)',
    type: 'text',
  },
  {
    key: 'historyOfPresentIllness',
    labelAr: 'تاريخ المرض الحالي (SOCRATES)',
    labelEn: 'History of Present Illness (SOCRATES)',
    icon: Activity,
    color: 'hsl(340, 60%, 50%)',
    bgColor: 'hsl(340, 45%, 95%)',
    type: 'socrates',
  },
  {
    key: 'pastMedicalHistory',
    labelAr: 'التاريخ المرضي السابق',
    labelEn: 'Past Medical History',
    icon: Clock,
    color: 'hsl(180, 50%, 40%)',
    bgColor: 'hsl(180, 40%, 95%)',
    type: 'list',
  },
  {
    key: 'drugHistory',
    labelAr: 'التاريخ الدوائي',
    labelEn: 'Drug History',
    icon: Pill,
    color: 'hsl(260, 55%, 55%)',
    bgColor: 'hsl(260, 40%, 95%)',
    type: 'list',
  },
  {
    key: 'familyHistory',
    labelAr: 'التاريخ العائلي',
    labelEn: 'Family History',
    icon: Users,
    color: 'hsl(140, 50%, 40%)',
    bgColor: 'hsl(140, 40%, 95%)',
    type: 'list',
  },
  {
    key: 'socialHistory',
    labelAr: 'التاريخ الاجتماعي',
    labelEn: 'Social History',
    icon: Home,
    color: 'hsl(30, 65%, 50%)',
    bgColor: 'hsl(30, 50%, 95%)',
    type: 'list',
  },
  {
    key: 'reviewOfSystems',
    labelAr: 'مراجعة الأجهزة',
    labelEn: 'Review of Systems',
    icon: Clipboard,
    color: 'hsl(200, 55%, 45%)',
    bgColor: 'hsl(200, 45%, 95%)',
    type: 'list',
  },
];

// SOCRATES field labels
const socratesLabels: { key: keyof SOCRATESHistory; labelAr: string; labelEn: string }[] = [
  { key: 'site', labelAr: 'الموقع (Site)', labelEn: 'Site' },
  { key: 'onset', labelAr: 'البداية (Onset)', labelEn: 'Onset' },
  { key: 'character', labelAr: 'الطبيعة (Character)', labelEn: 'Character' },
  { key: 'radiation', labelAr: 'الانتشار (Radiation)', labelEn: 'Radiation' },
  { key: 'associations', labelAr: 'الأعراض المصاحبة (Associations)', labelEn: 'Associations' },
  { key: 'timeCourse', labelAr: 'المسار الزمني (Time Course)', labelEn: 'Time Course' },
  {
    key: 'exacerbatingRelievingFactors',
    labelAr: 'العوامل المحفزة والمخففة (Exacerbating/Relieving)',
    labelEn: 'Exacerbating/Relieving Factors',
  },
  { key: 'severity', labelAr: 'الشدة (Severity)', labelEn: 'Severity' },
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

  const patientHistory = summary.patientHistory;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Existing summary sections */}
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

      {/* ── Patient History Section ────────────────────────────── */}
      {(summary.patientHistoryNarrative || patientHistory) && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '0',
            animationDelay: `${sections.length * 0.08}s`,
            animationFillMode: 'backwards',
            overflow: 'hidden',
          }}
        >
          {/* Patient History header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 16px 14px',
              background: 'linear-gradient(135deg, hsl(210, 60%, 50%), hsl(190, 55%, 45%))',
              color: 'white',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={18} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
              }}
            >
              {isArabic ? 'تاريخ المريض' : 'Patient History'}
            </h3>
          </div>

          {/* Patient History narrative content */}
          <div style={{ padding: '20px' }}>
            {summary.patientHistoryNarrative ? (
              /* ── Flowing narrative (Macleod's style) ── */
              <div
                dir="ltr"
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.85,
                  color: 'var(--foreground)',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  textAlign: 'justify',
                }}
              >
                {summary.patientHistoryNarrative.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
                  <p
                    key={idx}
                    style={{
                      margin: 0,
                      marginBottom: idx < summary.patientHistoryNarrative!.split('\n').filter(p => p.trim()).length - 1 ? '14px' : 0,
                      textIndent: idx > 0 ? '2em' : '0',
                    }}
                  >
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            ) : patientHistory ? (
              /* ── Fallback: structured sub-sections ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {historySubSections.map((sub, idx) => {
                  const value = patientHistory[sub.key];

                  // Skip empty fields
                  if (!value) return null;
                  if (sub.type === 'text' && typeof value === 'string' && !value.trim()) return null;
                  if (sub.type === 'list' && Array.isArray(value) && (value.length === 0 || (value.length === 1 && !value[0]))) return null;

                  const SubIcon = sub.icon;

                  return (
                    <div
                      key={sub.key}
                      className="animate-fade-in"
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        marginBottom: '8px',
                        animationDelay: `${(sections.length + idx) * 0.06}s`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      {/* Sub-section header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: sub.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: sub.color,
                            flexShrink: 0,
                          }}
                        >
                          <SubIcon size={14} />
                        </div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.813rem',
                            fontWeight: 700,
                            color: sub.color,
                          }}
                        >
                          {isArabic ? sub.labelAr : sub.labelEn}
                        </h4>
                      </div>

                      {/* Sub-section content */}
                      {sub.type === 'text' && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            lineHeight: 1.75,
                            color: 'var(--foreground)',
                          }}
                        >
                          {value as string}
                        </p>
                      )}

                      {sub.type === 'list' && Array.isArray(value) && (
                        <ul
                          style={{
                            margin: 0,
                            paddingInlineStart: '20px',
                            listStyle: 'disc',
                          }}
                        >
                          {(value as string[]).map((item, j) => (
                            <li
                              key={j}
                              style={{
                                fontSize: '0.85rem',
                                lineHeight: 1.75,
                                color: 'var(--foreground)',
                                marginBottom: '3px',
                              }}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}

                      {sub.type === 'socrates' && (
                        <div
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '0.813rem',
                            }}
                          >
                            <tbody>
                              {socratesLabels.map((field, fi) => {
                                const socrates = value as SOCRATESHistory;
                                const fieldVal = socrates[field.key];
                                if (!fieldVal) return null;

                                return (
                                  <tr
                                    key={field.key}
                                    style={{
                                      borderBottom:
                                        fi < socratesLabels.length - 1
                                          ? '1px solid var(--border)'
                                          : 'none',
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: '8px 12px',
                                        fontWeight: 700,
                                        color: sub.color,
                                        whiteSpace: 'nowrap',
                                        verticalAlign: 'top',
                                        width: isArabic ? 'auto' : '160px',
                                        background: sub.bgColor,
                                        borderInlineEnd: '1px solid var(--border)',
                                      }}
                                    >
                                      {isArabic ? field.labelAr : field.labelEn}
                                    </td>
                                    <td
                                      style={{
                                        padding: '8px 12px',
                                        lineHeight: 1.65,
                                        color: 'var(--foreground)',
                                      }}
                                    >
                                      {fieldVal}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

