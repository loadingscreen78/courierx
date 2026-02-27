import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import { sendEmail } from '../resend';

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test_key';
    process.env.RESEND_FROM_EMAIL = 'test@courierx.com';
  });

  it('returns error result when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing RESEND_API_KEY');
  });

  it('returns success result with email ID on successful send', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_123' }, error: null });
    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(true);
    expect(result.id).toBe('email_123');
  });

  it('returns error result when Resend API returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Rate limit exceeded' } });
    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
  });

  it('catches thrown exceptions and returns error result', async () => {
    mockSend.mockRejectedValue(new Error('Network failure'));
    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Hi</p>' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });
});
