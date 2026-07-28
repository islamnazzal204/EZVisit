// ============================================================
// EZVisit — IndexedDB + localStorage Storage Layer
// ============================================================

import { openDB, type IDBPDatabase } from 'idb';
import type { Session } from '@/types';

const DB_NAME = 'ezvisit-db';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-blobs';
const SESSIONS_KEY = 'ezvisit-sessions';
const SETTINGS_KEY = 'ezvisit-settings';

// --- IndexedDB for Audio Blobs ---

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
    },
  });
}

export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(AUDIO_STORE, blob, key);
}

export async function getAudioBlob(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(AUDIO_STORE, key);
}

export async function deleteAudioBlob(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(AUDIO_STORE, key);
}

export async function clearAllAudio(): Promise<void> {
  const db = await getDB();
  await db.clear(AUDIO_STORE);
}

// --- localStorage for Session Metadata ---

function getSessionsFromStorage(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getAllSessions(): Session[] {
  return getSessionsFromStorage().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSession(id: string): Session | undefined {
  return getSessionsFromStorage().find(s => s.id === id);
}

export function saveSession(session: Session): void {
  const sessions = getSessionsFromStorage();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = { ...session, updatedAt: new Date().toISOString() };
  } else {
    sessions.push(session);
  }
  saveSessionsToStorage(sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessionsFromStorage().filter(s => s.id !== id);
  saveSessionsToStorage(sessions);
  // Also delete the audio blob
  deleteAudioBlob(id).catch(() => {});
}

export function clearAllSessions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSIONS_KEY);
  clearAllAudio().catch(() => {});
}

// --- Settings ---

export function getSettings<T>(defaults: T): T {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveSettings<T>(settings: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Stats for Dashboard ---

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalDuration: number;
  averageScore: number;
  recentSessions: Session[];
}

export function getDashboardStats(): DashboardStats {
  const sessions = getAllSessions();
  const completed = sessions.filter(s => s.status === 'completed');

  const totalDuration = sessions.reduce((sum, s) => sum + (s.audioDuration || 0), 0);

  const scores = completed
    .filter(s => s.doctorFeedback?.scores?.overallScore)
    .map(s => s.doctorFeedback!.scores.overallScore);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalDuration,
    averageScore: Math.round(averageScore * 10) / 10,
    recentSessions: sessions.slice(0, 5),
  };
}
