// ============================================================
// EZVisit — Zustand Application Store
// ============================================================

'use client';

import { create } from 'zustand';
import type { Session, AppSettings, SessionStatus } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  getAllSessions,
  saveSession,
  deleteSession as deleteSessionStorage,
  getSettings,
  saveSettings as saveSettingsStorage,
  getDashboardStats,
  type DashboardStats,
} from '@/lib/storage';
import { signOutUser, type User } from '@/lib/firebase';

// --- Navigation ---

export type AppPage = 'home' | 'record' | 'processing' | 'results' | 'history' | 'settings';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  authUser: User | null;
  authLoading: boolean;
  setAuthUser: (user: User | null) => void;
  setAuthLoading: (val: boolean) => void;
  logout: () => Promise<void>;

  // Navigation
  currentPage: AppPage;
  setPage: (page: AppPage) => void;

  // Active session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;

  // Sessions
  sessions: Session[];
  loadSessions: () => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (id: string) => void;
  getActiveSession: () => Session | undefined;

  // Settings
  settings: AppSettings;
  loadSettings: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Processing state
  processingStep: 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  processingProgress: number;
  processingError: string | null;
  setProcessingStep: (step: AppState['processingStep']) => void;
  setProcessingProgress: (progress: number) => void;
  setProcessingError: (error: string | null) => void;

  // Recording
  isRecording: boolean;
  recordingDuration: number;
  setIsRecording: (val: boolean) => void;
  setRecordingDuration: (val: number) => void;

  // Consent
  hasConsented: boolean;
  setHasConsented: (val: boolean) => void;

  // Dashboard
  dashboardStats: DashboardStats | null;
  loadDashboardStats: () => void;

  // UI
  showConsentDialog: boolean;
  setShowConsentDialog: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  authUser: null,
  authLoading: true,
  setAuthUser: (user) => set({ authUser: user, isAuthenticated: !!user, authLoading: false }),
  setAuthLoading: (val) => set({ authLoading: val }),
  logout: async () => {
    await signOutUser();
    set({ authUser: null, isAuthenticated: false, currentPage: 'home' });
  },

  // Navigation
  currentPage: 'home',
  setPage: (page) => set({ currentPage: page }),

  // Active session
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  // Sessions
  sessions: [],
  loadSessions: () => {
    const sessions = getAllSessions();
    set({ sessions });
  },
  addSession: (session) => {
    saveSession(session);
    set((state) => ({ sessions: [session, ...state.sessions] }));
  },
  updateSession: (session) => {
    saveSession(session);
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    }));
  },
  removeSession: (id) => {
    deleteSessionStorage(id);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      // Clear active session if the deleted one was active
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    }));
  },
  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },

  // Settings
  settings: DEFAULT_SETTINGS,
  loadSettings: () => {
    const settings = getSettings(DEFAULT_SETTINGS);
    set({ settings });
  },
  updateSettings: (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    saveSettingsStorage(updated);
    set({ settings: updated });
  },

  // Processing
  processingStep: 'idle',
  processingProgress: 0,
  processingError: null,
  setProcessingStep: (step) => set({ processingStep: step }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  setProcessingError: (error) => set({ processingError: error }),

  // Recording
  isRecording: false,
  recordingDuration: 0,
  setIsRecording: (val) => set({ isRecording: val }),
  setRecordingDuration: (val) => set({ recordingDuration: val }),

  // Consent
  hasConsented: false,
  setHasConsented: (val) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezvisit-consented', val ? 'true' : 'false');
    }
    set({ hasConsented: val });
  },

  // Dashboard
  dashboardStats: null,
  loadDashboardStats: () => {
    const stats = getDashboardStats();
    set({ dashboardStats: stats });
  },

  // UI
  showConsentDialog: false,
  setShowConsentDialog: (val) => set({ showConsentDialog: val }),
}));
