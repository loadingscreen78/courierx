import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Draft,
  saveDraft,
  getDraft,
  getActiveDraft,
  deleteDraft,
  getAllDrafts,
} from '@/lib/drafts/draftService';

interface UseDraftOptions<T> {
  type: Draft['type'];
  initialData: T;
  totalSteps: number;
  autoSaveInterval?: number; // ms, default 5000
}

interface UseDraftReturn<T> {
  data: T;
  currentStep: number;
  draftId: string | null;
  lastSaved: Date | null;
  isSaving: boolean;
  setData: (data: T | ((prev: T) => T)) => void;
  setStep: (step: number) => void;
  saveNow: () => void;
  discardDraft: () => void;
  hasDraft: boolean;
}

export function useDraft<T>({
  type,
  initialData,
  totalSteps,
  autoSaveInterval = 5000,
  draftId: propDraftId,
}: UseDraftOptions<T> & { draftId?: string | null }): UseDraftReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Use refs for draft metadata to avoid re-renders on auto-save
  const draftIdRef = useRef<string | null>(propDraftId || null);
  const lastSavedRef = useRef<Date | null>(null);
  const hasDraftRef = useRef(false);
  const dataRef = useRef(data);
  const stepRef = useRef(currentStep);

  // Expose lastSaved/hasDraft as state ONLY for UI display — updated sparingly
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  // draftId as state so consumers can read it
  const [draftId, setDraftId] = useState<string | null>(propDraftId || null);

  // Keep data/step refs in sync inline (no useEffect needed)
  dataRef.current = data;
  stepRef.current = currentStep;

  // Rehydrate Date objects from JSON strings after loading from localStorage
  const rehydrateDates = useCallback((obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (isoDateRegex.test(obj)) {
        const date = new Date(obj);
        if (!isNaN(date.getTime())) return date;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => rehydrateDates(item));
    }
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = rehydrateDates(value);
      }
      return result;
    }
    return obj;
  }, []);

  // Load existing draft on mount — runs once
  useEffect(() => {
    if (initialized) return;

    const isNew = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new');

    if (isNew) {
      const existingDraft = getActiveDraft<T>(type);
      if (existingDraft) deleteDraft(existingDraft.id);
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url.toString());
    } else if (propDraftId) {
      const specificDraft = getDraft(propDraftId);
      if (specificDraft && specificDraft.type === type) {
        setDataState(rehydrateDates(specificDraft.data) as T);
        setCurrentStep(specificDraft.currentStep);
        draftIdRef.current = specificDraft.id;
        lastSavedRef.current = new Date(specificDraft.updatedAt);
        hasDraftRef.current = true;
        // Update display state once on load
        setDraftId(specificDraft.id);
        setLastSaved(new Date(specificDraft.updatedAt));
        setHasDraft(true);
      }
    } else {
      const existingDraft = getActiveDraft<T>(type);
      if (existingDraft) {
        setDataState(rehydrateDates(existingDraft.data) as T);
        setCurrentStep(existingDraft.currentStep);
        draftIdRef.current = existingDraft.id;
        lastSavedRef.current = new Date(existingDraft.updatedAt);
        hasDraftRef.current = true;
        // Update display state once on load
        setDraftId(existingDraft.id);
        setLastSaved(new Date(existingDraft.updatedAt));
        setHasDraft(true);
      }
    }
    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent auto-save — writes to localStorage only, NO setState during typing
  const silentSave = useCallback(() => {
    if (!initialized) return;
    try {
      const draft = saveDraft(
        type,
        dataRef.current,
        stepRef.current,
        totalSteps,
        undefined,
        draftIdRef.current || undefined
      );
      draftIdRef.current = draft.id;
      lastSavedRef.current = new Date();
      hasDraftRef.current = true;
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    }
  }, [type, totalSteps, initialized]);

  // saveNow — called explicitly (button click / step change) — updates display state
  const saveNow = useCallback(() => {
    if (!initialized) return;
    try {
      const draft = saveDraft(
        type,
        dataRef.current,
        stepRef.current,
        totalSteps,
        undefined,
        draftIdRef.current || undefined
      );
      draftIdRef.current = draft.id;
      lastSavedRef.current = new Date();
      hasDraftRef.current = true;
      // Update display state — this is intentional (user clicked Save)
      setDraftId(draft.id);
      setLastSaved(new Date());
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [type, totalSteps, initialized]);

  // Auto-save timer — uses silentSave (no setState, no re-render)
  useEffect(() => {
    if (!initialized) return;
    if (JSON.stringify(data) === JSON.stringify(initialData) && !draftIdRef.current) return;

    const timer = setTimeout(() => {
      silentSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  // We intentionally only watch data/currentStep for the auto-save trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currentStep, initialized, autoSaveInterval]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (initialized) {
        saveDraft(type, dataRef.current, stepRef.current, totalSteps, undefined, draftIdRef.current || undefined);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [type, totalSteps, initialized]);

  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState(prev => {
      if (typeof newData === 'function') {
        return (newData as (prev: T) => T)(prev);
      }
      return newData;
    });
  }, []);

  const setStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const discardDraft = useCallback(() => {
    if (draftIdRef.current) deleteDraft(draftIdRef.current);
    draftIdRef.current = null;
    lastSavedRef.current = null;
    hasDraftRef.current = false;
    setDataState(initialData);
    setCurrentStep(1);
    setDraftId(null);
    setLastSaved(null);
    setHasDraft(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('draftId')) {
        url.searchParams.delete('draftId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    currentStep,
    draftId,
    lastSaved,
    isSaving: false, // no async saving, always false
    setData,
    setStep,
    saveNow,
    discardDraft,
    hasDraft,
  };
}

// Hook to get all drafts
export function useAllDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    setDrafts(getAllDrafts());
  }, []);

  const refresh = useCallback(() => {
    setDrafts(getAllDrafts());
  }, []);

  const remove = useCallback((id: string) => {
    deleteDraft(id);
    setDrafts(getAllDrafts());
  }, []);

  return { drafts, refresh, remove };
}
