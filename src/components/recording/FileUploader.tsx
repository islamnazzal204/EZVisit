// ============================================================
// EZVisit — File Uploader Component
// ============================================================

'use client';

import { useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { isSupportedAudioType, formatFileSize, generateSessionId } from '@/lib/utils';
import { saveAudioBlob } from '@/lib/storage';
import { Upload, FileAudio, X, AlertCircle } from 'lucide-react';

export default function FileUploader() {
  const settings = useAppStore((s) => s.settings);
  const addSession = useAppStore((s) => s.addSession);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const setPage = useAppStore((s) => s.setPage);
  const setProcessingStep = useAppStore((s) => s.setProcessingStep);

  const isArabic = settings.language === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);
      if (!isSupportedAudioType(file.type)) {
        setError(
          isArabic
            ? 'صيغة الملف غير مدعومة. الصيغ المدعومة: WAV, MP3, M4A, WebM, OGG'
            : 'Unsupported format. Supported: WAV, MP3, M4A, WebM, OGG'
        );
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError(
          isArabic
            ? 'حجم الملف كبير جداً. الحد الأقصى 25 ميجابايت'
            : 'File too large. Maximum size is 25MB'
        );
        return;
      }
      setSelectedFile(file);
    },
    [isArabic]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const processFile = async () => {
    if (!selectedFile) return;

    const sessionId = generateSessionId();
    await saveAudioBlob(sessionId, selectedFile);

    // Get audio duration
    let duration = 0;
    try {
      const url = URL.createObjectURL(selectedFile);
      const audio = new Audio(url);
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          duration = audio.duration;
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    } catch {
      // Duration will be 0
    }

    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'uploading' as const,
      audioKey: sessionId,
      audioDuration: Math.round(duration),
      audioSize: selectedFile.size,
      audioMimeType: selectedFile.type,
      modelUsed: settings.model,
    };

    addSession(session);
    setActiveSessionId(sessionId);
    setProcessingStep('uploading');
    setPage('processing');
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'var(--primary-soft)' : 'var(--surface)',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--primary)',
          }}
        >
          <Upload size={26} />
        </div>

        <p
          style={{
            fontWeight: 700,
            color: 'var(--foreground)',
            marginBottom: '4px',
            fontSize: '0.938rem',
          }}
        >
          {isArabic ? 'اسحب ملف صوتي هنا' : 'Drag & drop audio file here'}
        </p>
        <p style={{ fontSize: '0.813rem', color: 'var(--foreground-muted)' }}>
          {isArabic
            ? 'أو اضغط لاختيار ملف — WAV, MP3, M4A, WebM'
            : 'or tap to select — WAV, MP3, M4A, WebM'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
          {isArabic ? 'الحد الأقصى: 25 ميجابايت' : 'Max size: 25MB'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--destructive-soft)',
            color: 'var(--destructive)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.813rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Selected file */}
      {selectedFile && (
        <div
          className="card animate-fade-in"
          style={{
            marginTop: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <FileAudio size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {selectedFile.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: 0 }}>
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="btn-ghost btn-icon"
            style={{ padding: '6px', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Process button */}
      {selectedFile && !error && (
        <button
          id="btn-process-upload"
          onClick={processFile}
          className="btn btn-primary btn-lg animate-fade-in"
          style={{ width: '100%', marginTop: '16px' }}
        >
          {isArabic ? 'بدء التحليل' : 'Start Analysis'}
        </button>
      )}
    </div>
  );
}
