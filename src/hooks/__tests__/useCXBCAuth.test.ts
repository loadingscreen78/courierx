import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock setup ──────────────────────────────────────────────────────────────

// Mock user state — set per test
let mockUser: { id: string; email?: string } | null = null;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Supabase query chain builder
type QueryResult = { data: unknown; error: unknown };

let partnerByUserIdResult: QueryResult = { data: null, error: null };
let partnerByEmailResult: QueryResult = { data: null, error: null };
let applicationResult: QueryResult = { data: [], error: null };
let updateResult: QueryResult = { data: null, error: null };

const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve(updateResult)),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'cxbc_partners') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, val: unknown) => ({
              eq: vi.fn((_col2: string, _val2: unknown) => ({
                maybeSingle: vi.fn(() => {
                  // Distinguish user_id vs email lookup by the first eq value
                  if (val === mockUser?.id) {
                    return Promise.resolve(partnerByUserIdResult);
                  }
                  if (val === mockUser?.email) {
                    return Promise.resolve(partnerByEmailResult);
                  }
                  return Promise.resolve({ data: null, error: null });
                }),
              })),
            })),
          })),
          update: mockUpdate,
        };
      }
      if (table === 'cxbc_partner_applications') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve(applicationResult)),
                })),
              })),
            })),
          })),
        };
      }
      return {};
    }),
  },
}));

// ── Capture hook state via mocked React ─────────────────────────────────────

// We capture the fetchPartnerStatus callback and the state setters
// so we can invoke the logic directly without rendering.

interface HookState {
  isLoading: boolean;
  isApprovedPartner: boolean;
  partner: unknown;
  applicationStatus: string | null;
  error: string | null;
}

let hookState: HookState;
let fetchPartnerStatus: (() => Promise<void>) | null = null;

// Track which useEffect ran
let effectCleanup: (() => void) | undefined;

vi.mock('react', async () => {
  return {
    useState: (initial: unknown) => {
      // We need separate state slots. Use a simple array-based approach.
      const idx = stateIndex++;
      stateSlots[idx] = stateSlots[idx] ?? initial;
      const setter = (val: unknown) => {
        stateSlots[idx] = typeof val === 'function' ? (val as (prev: unknown) => unknown)(stateSlots[idx]) : val;
      };
      return [stateSlots[idx], setter];
    },
    useEffect: (fn: () => void | (() => void), _deps?: unknown[]) => {
      // Execute the effect immediately (simulates mount)
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        effectCleanup = cleanup;
      }
    },
    useCallback: (fn: (...args: unknown[]) => unknown, _deps?: unknown[]) => fn,
  };
});

let stateIndex = 0;
let stateSlots: unknown[] = [];

function resetHookState() {
  stateIndex = 0;
  stateSlots = [];
}

async function runHook(): Promise<HookState> {
  resetHookState();

  // Import fresh each time to re-execute with mocked React
  const mod = await import('../useCXBCAuth');
  const result = mod.useCXBCAuth();

  // Wait for the effect (fetchPartnerStatus) to complete
  // The useEffect mock runs synchronously, but the async callback needs to settle
  await new Promise(resolve => setTimeout(resolve, 50));

  // Re-run the hook to read final state
  stateIndex = 0;
  const finalResult = mod.useCXBCAuth();

  return {
    isLoading: finalResult.isLoading,
    isApprovedPartner: finalResult.isApprovedPartner,
    partner: finalResult.partner,
    applicationStatus: finalResult.applicationStatus,
    error: finalResult.error,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useCXBCAuth dual-lookup logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    partnerByUserIdResult = { data: null, error: null };
    partnerByEmailResult = { data: null, error: null };
    applicationResult = { data: [], error: null };
    updateResult = { data: null, error: null };
    resetHookState();
  });

  /**
   * Test 1: Partner found by user_id → returns partner, no update
   * Validates: Requirement 13.2
   */
  it('returns partner when found by user_id, does not call update', async () => {
    const partnerRecord = {
      id: 'partner-1',
      user_id: 'user-123',
      email: 'partner@example.com',
      status: 'approved',
      wallet_balance: 5000,
      business_name: 'Test Biz',
    };

    mockUser = { id: 'user-123', email: 'partner@example.com' };
    partnerByUserIdResult = { data: partnerRecord, error: null };

    const state = await runHook();

    expect(state.isApprovedPartner).toBe(true);
    expect(state.partner).toEqual(partnerRecord);
    expect(state.applicationStatus).toBeNull();
    expect(state.error).toBeNull();
    // Should NOT call update since user_id already matches
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  /**
   * Test 2: Partner found by email with null user_id → auto-links, returns partner
   * Validates: Requirement 13.3
   */
  it('auto-links and returns partner when found by email with null user_id', async () => {
    const partnerRecord = {
      id: 'partner-2',
      user_id: null,
      email: 'partner@example.com',
      status: 'approved',
      wallet_balance: 3000,
      business_name: 'Email Biz',
    };

    mockUser = { id: 'user-456', email: 'partner@example.com' };
    partnerByUserIdResult = { data: null, error: null }; // Not found by user_id
    partnerByEmailResult = { data: partnerRecord, error: null }; // Found by email
    updateResult = { data: null, error: null }; // Update succeeds

    const state = await runHook();

    expect(state.isApprovedPartner).toBe(true);
    expect(state.partner).toBeTruthy();
    expect(state.applicationStatus).toBeNull();
    expect(state.error).toBeNull();
    // Should call update to link user_id
    expect(mockUpdate).toHaveBeenCalledWith({ user_id: 'user-456' });
  });

  /**
   * Test 3: Partner found by email with different user_id → auto-links, returns partner
   * Validates: Requirement 13.3
   */
  it('auto-links and returns partner when found by email with different user_id', async () => {
    const partnerRecord = {
      id: 'partner-3',
      user_id: 'old-user-789',
      email: 'partner@example.com',
      status: 'approved',
      wallet_balance: 1000,
      business_name: 'Mismatch Biz',
    };

    mockUser = { id: 'new-user-101', email: 'partner@example.com' };
    partnerByUserIdResult = { data: null, error: null }; // Not found by new user_id
    partnerByEmailResult = { data: partnerRecord, error: null }; // Found by email
    updateResult = { data: null, error: null };

    const state = await runHook();

    expect(state.isApprovedPartner).toBe(true);
    expect(state.partner).toBeTruthy();
    expect(state.applicationStatus).toBeNull();
    // Should call update to re-link user_id
    expect(mockUpdate).toHaveBeenCalledWith({ user_id: 'new-user-101' });
  });

  /**
   * Test 4: No partner, pending application → returns applicationStatus: 'pending'
   * Validates: Requirement 13.2
   */
  it('returns applicationStatus pending when no partner but pending application exists', async () => {
    mockUser = { id: 'user-no-partner', email: 'applicant@example.com' };
    partnerByUserIdResult = { data: null, error: null };
    partnerByEmailResult = { data: null, error: null };
    applicationResult = {
      data: [{ status: 'pending', created_at: '2025-01-01T00:00:00Z' }],
      error: null,
    };

    const state = await runHook();

    expect(state.isApprovedPartner).toBe(false);
    expect(state.partner).toBeNull();
    expect(state.applicationStatus).toBe('pending');
    expect(state.error).toBeNull();
  });

  /**
   * Test 5: No partner, no application → returns null partner and null applicationStatus
   * Validates: Requirement 13.2
   */
  it('returns null partner and null applicationStatus when no partner and no application', async () => {
    mockUser = { id: 'user-fresh', email: 'nobody@example.com' };
    partnerByUserIdResult = { data: null, error: null };
    partnerByEmailResult = { data: null, error: null };
    applicationResult = { data: [], error: null };

    const state = await runHook();

    expect(state.isApprovedPartner).toBe(false);
    expect(state.partner).toBeNull();
    expect(state.applicationStatus).toBeNull();
    expect(state.error).toBeNull();
  });
});
