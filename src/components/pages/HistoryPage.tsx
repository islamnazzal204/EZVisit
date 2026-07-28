// ============================================================
// EZVisit — History Page
// ============================================================

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDuration, formatRelativeDate, truncate } from '@/lib/utils';
import AudioPlayer from '@/components/shared/AudioPlayer';
import {
  Clock,
  BarChart3,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronDown,
  Inbox,
  Pencil,
  Check,
  X,
  Play,
} from 'lucide-react';
import type { Session } from '@/types';

export default function HistoryPage() {
  const settings = useAppStore((s) => s.settings);
  const sessions = useAppStore((s) => s.sessions);
  const loadSessions = useAppStore((s) => s.loadSessions);
  const removeSession = useAppStore((s) => s.removeSession);
  const updateSession = useAppStore((s) => s.updateSession);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const setPage = useAppStore((s) => s.setPage);

  const isArabic = settings.language === 'ar';

  // Track which session has audio player expanded
  const [expandedAudioId, setExpandedAudioId] = useState<string | null>(null);
  // Track which session is being name-edited
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Focus name input when editing starts
  useEffect(() => {
    if (editingNameId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingNameId]);

  const handleSessionClick = useCallback(
    (session: Session) => {
      if (session.status === 'completed') {
        setActiveSessionId(session.id);
        setPage('results');
      }
    },
    [setActiveSessionId, setPage]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      const msg = isArabic ? 'هل أنت متأكد من حذف هذه الجلسة؟' : 'Delete this session?';
      if (window.confirm(msg)) {
        removeSession(id);
        if (expandedAudioId === id) setExpandedAudioId(null);
        if (editingNameId === id) setEditingNameId(null);
      }
    },
    [isArabic, removeSession, expandedAudioId, editingNameId]
  );

  const handleToggleAudio = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      setExpandedAudioId((prev) => (prev === id ? null : id));
    },
    []
  );

  const handleStartRename = useCallback(
    (e: React.MouseEvent, session: Session) => {
      e.stopPropagation();
      e.preventDefault();
      const currentName =
        session.name ||
        session.summary?.mainComplaint ||
        (isArabic ? 'جلسة تسجيل' : 'Recording Session');
      setEditingNameId(session.id);
      setEditingNameValue(currentName);
    },
    [isArabic]
  );

  const handleSaveName = useCallback(
    (e: React.MouseEvent | React.FormEvent, session: Session) => {
      e.stopPropagation();
      e.preventDefault();
      const trimmed = editingNameValue.trim();
      if (trimmed) {
        updateSession({
          ...session,
          name: trimmed,
          updatedAt: new Date().toISOString(),
        });
      }
      setEditingNameId(null);
    },
    [editingNameValue, updateSession]
  );

  const handleCancelRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingNameId(null);
    setEditingNameValue('');
  }, []);

  const getSessionDisplayName = (session: Session): string => {
    return (
      session.name ||
      session.summary?.mainComplaint ||
      (isArabic ? 'جلسة تسجيل' : 'Recording Session')
    );
  };

  return (
    <div
      className="page-enter"
      style={{ padding: '16px', paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Clock size={20} style={{ color: 'var(--primary)' }} />
        <h2 style={{ margin: 0, fontSize: '1.063rem', fontWeight: 700 }}>
          {isArabic ? 'جميع الجلسات' : 'All Sessions'}
        </h2>
        <span
          className="badge badge-primary"
          style={{ marginInlineStart: 'auto' }}
        >
          {sessions.length}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <Inbox
            size={48}
            style={{ color: 'var(--foreground-muted)', margin: '0 auto 12px', display: 'block' }}
          />
          <p style={{ fontWeight: 600, color: 'var(--foreground-secondary)', margin: '0 0 4px' }}>
            {isArabic ? 'لا توجد جلسات' : 'No sessions yet'}
          </p>
          <p style={{ fontSize: '0.813rem', color: 'var(--foreground-muted)', margin: 0 }}>
            {isArabic
              ? 'سجّل أو ارفع ملفاً صوتياً للبدء'
              : 'Record or upload audio to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map((session, i) => (
            <div
              key={session.id}
              className="card animate-fade-in"
              style={{
                padding: '0',
                animationDelay: `${i * 0.05}s`,
                animationFillMode: 'backwards',
                overflow: 'hidden',
              }}
            >
              {/* Main row */}
              <div
                className="card-interactive"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: session.status === 'completed' ? 'pointer' : 'default',
                }}
                onClick={() => handleSessionClick(session)}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background:
                      session.status === 'completed'
                        ? 'var(--accent-soft)'
                        : session.status === 'error'
                          ? 'var(--destructive-soft)'
                          : 'var(--primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {session.status === 'completed' ? (
                    <BarChart3 size={20} style={{ color: 'var(--accent)' }} />
                  ) : session.status === 'error' ? (
                    <AlertCircle size={20} style={{ color: 'var(--destructive)' }} />
                  ) : (
                    <Clock size={20} style={{ color: 'var(--primary)' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Session name — editable */}
                  {editingNameId === session.id ? (
                    <form
                      onSubmit={(e) => handleSaveName(e, session)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingNameId(null);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1.5px solid var(--primary)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface)',
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
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label="Save name"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        style={{
                          background: 'var(--surface-hover)',
                          color: 'var(--foreground-muted)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {truncate(getSessionDisplayName(session), 50)}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      fontSize: '0.75rem',
                      color: 'var(--foreground-muted)',
                      marginTop: '2px',
                    }}
                  >
                    <span>{formatRelativeDate(session.createdAt)}</span>
                    <span>·</span>
                    <span>{formatDuration(session.audioDuration)}</span>
                    {session.doctorFeedback?.scores?.overallScore != null && (
                      <>
                        <span>·</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          {session.doctorFeedback.scores.overallScore}/10
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  {/* Play audio button */}
                  <button
                    onClick={(e) => handleToggleAudio(e, session.id)}
                    className="btn-ghost btn-icon"
                    style={{
                      padding: '6px',
                      color: expandedAudioId === session.id ? 'var(--primary)' : 'var(--foreground-muted)',
                    }}
                    title={isArabic ? 'تشغيل الصوت' : 'Play Audio'}
                  >
                    {expandedAudioId === session.id ? (
                      <ChevronDown size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>

                  {/* Rename button */}
                  <button
                    onClick={(e) => handleStartRename(e, session)}
                    className="btn-ghost btn-icon"
                    style={{ padding: '6px', color: 'var(--foreground-muted)' }}
                    title={isArabic ? 'تعديل الاسم' : 'Rename'}
                  >
                    <Pencil size={14} />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="btn-ghost btn-icon"
                    style={{ padding: '6px', color: 'var(--foreground-muted)' }}
                    title={isArabic ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>

                  {session.status === 'completed' && (
                    <ChevronRight
                      size={16}
                      style={{ color: 'var(--foreground-muted)' }}
                      className="flip-rtl"
                    />
                  )}
                </div>
              </div>

              {/* Expanded audio player */}
              {expandedAudioId === session.id && (
                <div
                  className="animate-fade-in"
                  style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid var(--border)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ paddingTop: '12px' }}>
                    <AudioPlayer
                      audioKey={session.audioKey}
                      mimeType={session.audioMimeType}
                      compact
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
