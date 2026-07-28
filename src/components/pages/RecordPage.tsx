// ============================================================
// EZVisit — Record Page
// ============================================================

'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import AudioRecorder from '@/components/recording/AudioRecorder';
import FileUploader from '@/components/recording/FileUploader';
import { Mic, Upload } from 'lucide-react';

export default function RecordPage() {
  const settings = useAppStore((s) => s.settings);
  const isArabic = settings.language === 'ar';
  const [tab, setTab] = useState<'record' | 'upload'>('record');

  return (
    <div className="page-enter" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Tab selector */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          id="tab-record"
          onClick={() => setTab('record')}
          className={tab === 'record' ? 'tab-active' : 'tab-inactive'}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
        >
          <Mic size={18} />
          {isArabic ? 'تسجيل' : 'Record'}
        </button>
        <button
          id="tab-upload"
          onClick={() => setTab('upload')}
          className={tab === 'upload' ? 'tab-active' : 'tab-inactive'}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={18} />
          {isArabic ? 'رفع ملف' : 'Upload'}
        </button>
      </div>

      {/* Content */}
      {tab === 'record' ? <AudioRecorder /> : <FileUploader />}
    </div>
  );
}
