// ============================================================
// EZVisit — Results Page
// ============================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import AudioPlayer from '@/components/shared/AudioPlayer';
import TranscriptView from '@/components/results/TranscriptView';
import SummaryView from '@/components/results/SummaryView';
import PatientInstructionsView from '@/components/results/PatientInstructionsView';
import DoctorFeedbackView from '@/components/results/DoctorFeedbackView';
import {
  FileText,
  ClipboardList,
  HeartPulse,
  Award,
  Download,
  Pencil,
  Check,
  X,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type ResultTab = 'transcript' | 'summary' | 'instructions' | 'feedback';

interface TabConfig {
  id: ResultTab;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'transcript', labelAr: 'النص', labelEn: 'Transcript', icon: FileText },
  { id: 'summary', labelAr: 'الملخص', labelEn: 'Summary', icon: ClipboardList },
  { id: 'instructions', labelAr: 'تعليمات', labelEn: 'Instructions', icon: HeartPulse },
  { id: 'feedback', labelAr: 'تقييم', labelEn: 'Feedback', icon: Award },
];

export default function ResultsPage() {
  const settings = useAppStore((s) => s.settings);
  const getActiveSession = useAppStore((s) => s.getActiveSession);
  const updateSession = useAppStore((s) => s.updateSession);
  const isArabic = settings.language === 'ar';
  const [activeTab, setActiveTab] = useState<ResultTab>('summary');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const session = getActiveSession();

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  if (!session) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
        {isArabic ? 'لم يتم العثور على الجلسة' : 'Session not found'}
      </div>
    );
  }

  const sessionDisplayName =
    session.name ||
    session.summary?.mainComplaint ||
    (isArabic ? 'جلسة تسجيل' : 'Recording Session');

  const handleStartEditName = () => {
    setEditNameValue(sessionDisplayName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      updateSession({
        ...session,
        name: trimmed,
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingName(false);
  };

  const handleExportJSON = () => {
    const data = {
      session: {
        id: session.id,
        name: session.name,
        createdAt: session.createdAt,
        audioDuration: session.audioDuration,
        modelUsed: session.modelUsed,
      },
      rawTranscript: session.rawTranscript,
      diarizedTranscript: session.diarizedTranscript,
      summary: session.summary,
      patientInstructions: session.patientInstructions,
      doctorFeedback: session.doctorFeedback,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezvisit-${session.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Session name header with edit + audio toggle */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveName();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
              }}
            >
              <input
                ref={nameInputRef}
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: '1.5px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--foreground-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <>
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.938rem',
                  fontWeight: 700,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sessionDisplayName}
              </h2>
              <button
                onClick={handleStartEditName}
                className="btn-ghost btn-icon"
                style={{ padding: '6px', color: 'var(--foreground-muted)', flexShrink: 0 }}
                title={isArabic ? 'تعديل الاسم' : 'Rename'}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                className="btn-ghost btn-icon"
                style={{
                  padding: '6px',
                  color: showAudioPlayer ? 'var(--primary)' : 'var(--foreground-muted)',
                  flexShrink: 0,
                }}
                title={isArabic ? 'تشغيل الصوت' : 'Play Audio'}
              >
                <Volume2 size={16} />
                {showAudioPlayer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </>
          )}
        </div>

        {/* Audio player (collapsible) */}
        {showAudioPlayer && (
          <div className="animate-fade-in" style={{ marginTop: '10px' }}>
            <AudioPlayer audioKey={session.audioKey} mimeType={session.audioMimeType} />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'tab-active' : 'tab-inactive'}
              style={{
                flex: 1,
                minWidth: 'max-content',
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontWeight: 600,
                fontSize: '0.75rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {isArabic ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 60px)' }}>
        {activeTab === 'transcript' && (
          <TranscriptView
            segments={session.diarizedTranscript || []}
            rawTranscript={session.rawTranscript}
          />
        )}
        {activeTab === 'summary' && session.summary && (
          <SummaryView summary={session.summary} />
        )}
        {activeTab === 'instructions' && session.patientInstructions && (
          <PatientInstructionsView instructions={session.patientInstructions} />
        )}
        {activeTab === 'feedback' && session.doctorFeedback && (
          <DoctorFeedbackView feedback={session.doctorFeedback} />
        )}
      </div>

      {/* Export FAB */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 16px)',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 30,
        }}
      >
        <button
          id="btn-export-json"
          onClick={handleExportJSON}
          className="btn btn-primary btn-icon"
          style={{
            width: '48px',
            height: '48px',
            boxShadow: 'var(--shadow-lg)',
          }}
          title="Export JSON"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}
