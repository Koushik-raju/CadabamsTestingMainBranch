/**
 * FILE: contexts/journey-return-context.tsx
 *
 * PURPOSE:
 *   Global context that tracks the single in-flight journey task so a
 *   floating "Return to journey" CTA can be rendered on every page after
 *   the user leaves the journey details view to complete a task.
 *
 * LOGIC OVERVIEW:
 *   On mount, reads the persisted state from localStorage under
 *   JOURNEY_RETURN_KEY. If the stored startedAt is older than STALE_MS,
 *   it is discarded (prevents zombie pins from previous sessions).
 *   Exposes start/markCompleted/clear — each writes through to
 *   localStorage so the FAB survives full-page reloads and cross-page
 *   navigation. Single-slot: a new start() overwrites any prior slot.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyReturnState       — shape of persisted state or null
 *   JourneyReturnProvider    — wraps app subtree, hydrates from storage
 *   useJourneyReturn()       — { state, hydrated, start, markCompleted, clear, dismiss }
 *
 * DEPENDENCIES:
 *   React 18 client-only hooks (context, state, effect)
 *   Browser localStorage
 *
 * LAST UPDATED: 2026-04-22 — initial creation to support global return-to-journey CTA.
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const JOURNEY_RETURN_KEY = 'journey:active-task';
const STALE_MS = 6 * 60 * 60 * 1000;

export type JourneyReturnTaskKind =
  | 'ASSESSMENT'
  | 'WORKSHEET'
  | 'SUB_JOURNAL'
  | 'JOURNAL'
  | 'AUDIO'
  | 'VIDEO'
  | 'MOOD'
  | 'APPOINTMENT'
  | 'CONSULT_BOOKING'
  | 'READ'
  | 'OTHER';

export type JourneyReturnStartPayload = {
  journeyId: string;
  enrollmentId: string;
  taskId: string;
  taskKind: JourneyReturnTaskKind;
  taskTitle: string | null;
  dayNumber?: number;
};

export type JourneyReturnState =
  | (JourneyReturnStartPayload & {
      startedAt: number;
      status: 'in-progress' | 'completed';
      completedAt?: number;
      proofPreview?: string;
      dismissed?: boolean;
    })
  | null;

type Ctx = {
  state: JourneyReturnState;
  hydrated: boolean;
  start: (payload: JourneyReturnStartPayload) => void;
  markCompleted: (patch?: { proofPreview?: string }) => void;
  clear: () => void;
  dismiss: () => void;
};

const JourneyReturnContext = createContext<Ctx | null>(null);

function readFromStorage(): JourneyReturnState {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(JOURNEY_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JourneyReturnState;
    if (!parsed) return null;
    if (Date.now() - parsed.startedAt > STALE_MS) {
      window.localStorage.removeItem(JOURNEY_RETURN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeToStorage(next: JourneyReturnState) {
  if (typeof window === 'undefined') return;
  try {
    if (next == null) window.localStorage.removeItem(JOURNEY_RETURN_KEY);
    else window.localStorage.setItem(JOURNEY_RETURN_KEY, JSON.stringify(next));
  } catch {
    /* storage quota / private mode — best-effort */
  }
}

export function JourneyReturnProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<JourneyReturnState>(null);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef<JourneyReturnState>(null);

  useEffect(() => {
    const initial = readFromStorage();
    stateRef.current = initial;
    setState(initial);
    setHydrated(true);

    // Cross-tab sync: if another tab changes the slot, mirror it here.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== JOURNEY_RETURN_KEY) return;
      const next = readFromStorage();
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((next: JourneyReturnState) => {
    stateRef.current = next;
    setState(next);
    writeToStorage(next);
  }, []);

  const start = useCallback(
    (payload: JourneyReturnStartPayload) => {
      const prev = stateRef.current;
      if (prev && prev.taskId !== payload.taskId) {
        console.warn('[journeyReturn] overwriting in-flight task slot', { prev: prev.taskId, next: payload.taskId });
      }
      commit({
        ...payload,
        startedAt: Date.now(),
        status: 'in-progress',
      });
    },
    [commit],
  );

  const markCompleted = useCallback(
    (patch?: { proofPreview?: string }) => {
      const prev = stateRef.current;
      if (!prev) return;
      commit({
        ...prev,
        status: 'completed',
        completedAt: Date.now(),
        proofPreview: patch?.proofPreview ?? prev.proofPreview,
        dismissed: false,
      });
    },
    [commit],
  );

  const clear = useCallback(() => commit(null), [commit]);

  const dismiss = useCallback(() => {
    const prev = stateRef.current;
    if (!prev) return;
    commit({ ...prev, dismissed: true });
  }, [commit]);

  const value = useMemo<Ctx>(
    () => ({ state, hydrated, start, markCompleted, clear, dismiss }),
    [state, hydrated, start, markCompleted, clear, dismiss],
  );

  return <JourneyReturnContext.Provider value={value}>{children}</JourneyReturnContext.Provider>;
}

export function useJourneyReturn(): Ctx {
  const ctx = useContext(JourneyReturnContext);
  if (!ctx) throw new Error('useJourneyReturn must be used inside <JourneyReturnProvider>');
  return ctx;
}
