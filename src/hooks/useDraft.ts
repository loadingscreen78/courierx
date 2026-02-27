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
  const [draftId, setDraftId] = useState<string | null>(propDraftId || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const dataRef = useRef(data);
  const stepRef = useRef(currentStep);
  const draftIdRef = useRef(draftId);

  // Keep refs updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  // Rehydrate Date objects from JSON strings after loading from localStorage
  // JSON.stringify converts Date objects to ISO strings; this converts them back
  const rehydrateDates = useCallback((obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      // Check if it looks like an ISO date string
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

  // Load existing draft on mount
  useEffect(() => {
    if (initialized) return;

    // Check if this is a fresh start (from "New Shipment" page)
    const isNew = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new');

    if (isNew) {
      // Fresh start — delete any existing draft of this type and use initial data
      const existingDraft = getActiveDraft<T>(type);
      if (existingDraft) {
        deleteDraft(existingDraft.id);
      }
      // Clean up the ?new param from URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url.toString());
    } else if (propDraftId) {
      // If propDraftId is provided, try to load that specific draft
      const specificDraft = getDraft(propDraftId);
      if (specificDraft && specificDraft.type === type) {
        setDataState(rehydrateDates(specificDraft.data) as T);
        setCurrentStep(specificDraft.currentStep);
        setDraftId(specificDraft.id);
        setLastSaved(new Date(specificDraft.updatedAt));
        setHasDraft(true);
      }
    } else {
      // Otherwise load the most recent draft of this type
      const existingDraft = getActiveDraft<T>(type);
      if (existingDraft) {
        setDataState(rehydrateDates(existingDraft.data) as T);
        setCurrentStep(existingDraft.currentStep);
        setDraftId(existingDraft.id);
        setLastSaved(new Date(existingDraft.updatedAt));
        setHasDraft(true);
      }
    }
    setInitialized(true);
  }, [type, initialized, propDraftId, rehydrateDates]);

  // Save function
  const saveNow = useCallback(() => {
    // Don't save if not initialized or if data hasn't changed from initial
    if (!initialized) return;

    // Use a ref-based guard to avoid synchronous state flipping
    // which causes re-renders and input blinking
    try {
      const draft = saveDraft(
        type,
        dataRef.current,
        stepRef.current,
        totalSteps,
        undefined,
        draftIdRef.current || undefined
      );

      // Update state only if it's a new draft ID
      if (draft.id !== draftIdRef.current) {
        setDraftId(draft.id);
      }

      setLastSaved(new Date());
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [type, totalSteps, initialized]);

  // Auto-save on data/step change (debounced)
  useEffect(() => {
    if (!initialized) return;

    // Skip if data equals initial data (deep comparison simplified)
    if (JSON.stringify(data) === JSON.stringify(initialData) && !draftId) return;

    const timer = setTimeout(() => {
      saveNow();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [data, currentStep, initialized, autoSaveInterval, saveNow, initialData, draftId]);

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

  // Set data with function support
  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState(prev => {
      if (typeof newData === 'function') {
        return (newData as (prev: T) => T)(prev);
      }
      return newData;
    });
  }, []);

  // Set step
  const setStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  // Discard draft
  const discardDraft = useCallback(() => {
    if (draftId) {
      deleteDraft(draftId);
    }
    setDataState(initialData);
    setCurrentStep(1);
    setDraftId(null);
    setLastSaved(null);
    setHasDraft(false);
    // Remove query param if present
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('draftId')) {
        url.searchParams.delete('draftId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [draftId, initialData]);

  return {
    data,
    currentStep,
    draftId,
    lastSaved,
    isSaving,
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
