// ============================================================
// EZVisit — Doctor Feedback View + Score Radar
// ============================================================

'use client';

import { useAppStore } from '@/lib/store';
import type { DoctorFeedback, CommunicationScores } from '@/types';
import { Award, TrendingUp, Target, Lightbulb, Quote } from 'lucide-react';

interface DoctorFeedbackViewProps {
  feedback: DoctorFeedback;
}

const scoreLabels: Record<keyof CommunicationScores, string> = {
  empathy: 'Empathy',
  activeListening: 'Active Listening',
  clarity: 'Clarity',
  organization: 'Organization',
  patientCenteredCommunication: 'Patient-Centered',
  openEndedQuestions: 'Open Questions',
  sharedDecisionMaking: 'Shared Decisions',
  medicalJargonUsage: 'Jargon Avoidance',
  overallScore: 'Overall',
};

function getScoreColor(score: number): string {
  if (score >= 8) return 'var(--accent)';
  if (score >= 6) return 'var(--primary)';
  if (score >= 4) return 'var(--warning)';
  return 'var(--destructive)';
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Average';
  return 'Needs Work';
}

export default function DoctorFeedbackView({ feedback }: DoctorFeedbackViewProps) {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';

  if (!feedback) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
        No feedback available
      </div>
    );
  }

  const { scores } = feedback;
  const overallColor = getScoreColor(scores.overallScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {/* Overall Score Card */}
      <div
        className="card animate-fade-in"
        style={{
          padding: '20px',
          textAlign: 'center',
          background: `linear-gradient(135deg, var(--card), var(--surface))`,
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-full)',
            border: `4px solid ${overallColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: overallColor }}>
            {scores.overallScore}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--foreground-muted)',
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
            }}
          >
            /10
          </span>
        </div>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: overallColor, margin: '0 0 2px' }}>
          {getScoreLabel(scores.overallScore)}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: 0 }}>
          Overall Communication Score
        </p>
      </div>

      {/* Individual Scores */}
      <div className="card animate-fade-in" style={{ padding: '16px', animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={16} style={{ color: 'var(--primary)' }} />
          Skill Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(Object.entries(scores) as [keyof CommunicationScores, number][])
            .filter(([key]) => key !== 'overallScore')
            .map(([key, value]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--foreground-secondary)' }}>
                    {scoreLabels[key]}
                  </span>
                  <span style={{ fontSize: '0.813rem', fontWeight: 700, color: getScoreColor(value) }}>
                    {value}/10
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: 'var(--surface-hover)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${value * 10}%`,
                      background: getScoreColor(value),
                      borderRadius: '3px',
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <FeedbackSection
          icon={TrendingUp}
          title="Strengths"
          items={feedback.strengths}
          color="var(--accent)"
          bgColor="var(--accent-soft)"
          index={2}
        />
      )}

      {/* Areas for Improvement */}
      {feedback.areasForImprovement?.length > 0 && (
        <FeedbackSection
          icon={Target}
          title="Areas for Improvement"
          items={feedback.areasForImprovement}
          color="var(--warning)"
          bgColor="var(--warning-soft)"
          index={3}
        />
      )}

      {/* Specific Examples */}
      {feedback.specificExamples?.length > 0 && (
        <FeedbackSection
          icon={Quote}
          title="Specific Examples"
          items={feedback.specificExamples}
          color="var(--primary)"
          bgColor="var(--primary-soft)"
          index={4}
        />
      )}

      {/* Actionable Suggestions */}
      {feedback.actionableSuggestions?.length > 0 && (
        <FeedbackSection
          icon={Lightbulb}
          title="Actionable Suggestions"
          items={feedback.actionableSuggestions}
          color="hsl(38, 80%, 48%)"
          bgColor="var(--warning-soft)"
          index={5}
        />
      )}
    </div>
  );
}

function FeedbackSection({
  icon: Icon,
  title,
  items,
  color,
  bgColor,
  index,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
  bgColor: string;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color }}>{title}</h3>
      </div>
      <ul style={{ margin: 0, paddingInlineStart: '20px', listStyle: 'disc' }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.7,
              color: 'var(--foreground)',
              marginBottom: '6px',
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
