import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Draft,
  saveDraft,
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
}: UseDraftOptions<T>): UseDraftReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const dataRef = useRef(data);
  const stepRef = useRef(currentStep);
  
  // Keep refs updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  // Load existing draft on mount
  useEffect(() => {
    if (initialized) return;
    
    const existingDraft = getActiveDraft<T>(type);
    if (existingDraft) {
      setDataState(existingDraft.data);
      setCurrentStep(existingDraft.currentStep);
      setDraftId(existingDraft.id);
      setLastSaved(new Date(existingDraft.updatedAt));
      setHasDraft(true);
    }
    setInitialized(true);
  }, [type, initialized]);

  // Save function
  const saveNow = useCallback(() => {
    setIsSaving(true);
    try {
      const draft = saveDraft(
        type,
        dataRef.current,
        stepRef.current,
        totalSteps,
        undefined,
        draftId || undefined
      );
      setDraftId(draft.id);
      setLastSaved(new Date());
      setHasDraft(true);
    } finally {
      setIsSaving(false);
    }
  }, [type, totalSteps, draftId]);

  // Auto-save on data/step change (debounced)
  useEffect(() => {
    if (!initialized) return;
    
    const timer = setTimeout(() => {
      saveNow();
    }, autoSaveInterval);
    
    return () => clearTimeout(timer);
  }, [data, currentStep, initialized, autoSaveInterval, saveNow]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft(type, dataRef.current, stepRef.current, totalSteps, undefined, draftId || undefined);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [type, totalSteps, draftId]);

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
