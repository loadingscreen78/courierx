// Draft Service - Manages form drafts in localStorage

export interface Draft<T = unknown> {
  id: string;
  type: 'gift' | 'document' | 'medicine' | 'cxbc';
  title: string;
  data: T;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

const DRAFTS_KEY = 'courierx_drafts';
const DRAFT_EXPIRY_DAYS = 30;

// Generate unique ID
function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all drafts from localStorage
export function getAllDrafts(): Draft[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(DRAFTS_KEY);
    if (!stored) return [];
    
    const drafts: Draft[] = JSON.parse(stored);
    const now = new Date();
    
    // Filter out expired drafts
    const validDrafts = drafts.filter(draft => new Date(draft.expiresAt) > now);
    
    // If some were expired, update storage
    if (validDrafts.length !== drafts.length) {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(validDrafts));
    }
    
    return validDrafts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

// Get drafts by type
export function getDraftsByType(type: Draft['type']): Draft[] {
  return getAllDrafts().filter(draft => draft.type === type);
}

// Get a specific draft by ID
export function getDraft(id: string): Draft | null {
  const drafts = getAllDrafts();
  return drafts.find(draft => draft.id === id) || null;
}

// Get the current active draft for a type (most recent)
export function getActiveDraft<T>(type: Draft['type']): Draft<T> | null {
  const drafts = getDraftsByType(type);
  return (drafts[0] as Draft<T>) || null;
}

// Save or update a draft
export function saveDraft<T>(
  type: Draft['type'],
  data: T,
  currentStep: number,
  totalSteps: number,
  title?: string,
  existingId?: string
): Draft<T> {
  const drafts = getAllDrafts();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  // Check if updating existing draft
  const existingIndex = existingId 
    ? drafts.findIndex(d => d.id === existingId)
    : drafts.findIndex(d => d.type === type);
  
  const draft: Draft<T> = {
    id: existingId || (existingIndex >= 0 ? drafts[existingIndex].id : generateId()),
    type,
    title: title || getDefaultTitle(type),
    data,
    currentStep,
    totalSteps,
    createdAt: existingIndex >= 0 ? drafts[existingIndex].createdAt : now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  if (existingIndex >= 0) {
    drafts[existingIndex] = draft;
  } else {
    drafts.push(draft);
  }
  
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return draft;
}

// Delete a draft
export function deleteDraft(id: string): boolean {
  const drafts = getAllDrafts();
  const filtered = drafts.filter(draft => draft.id !== id);
  
  if (filtered.length !== drafts.length) {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

// Delete all drafts of a type
export function deleteDraftsByType(type: Draft['type']): void {
  const drafts = getAllDrafts();
  const filtered = drafts.filter(draft => draft.type !== type);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
}

// Clear all drafts
export function clearAllDrafts(): void {
  localStorage.removeItem(DRAFTS_KEY);
}

// Get default title based on type
function getDefaultTitle(type: Draft['type']): string {
  switch (type) {
    case 'gift': return 'Gift Shipment';
    case 'document': return 'Document Shipment';
    case 'medicine': return 'Medicine Shipment';
    case 'cxbc': return 'CXBC Shipment';
    default: return 'Shipment Draft';
  }
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Get progress percentage
export function getProgressPercentage(draft: Draft): number {
  return Math.round((draft.currentStep / draft.totalSteps) * 100);
}
