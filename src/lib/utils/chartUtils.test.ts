import { describe, it, expect } from 'vitest';
import { getStartOfWeek, groupShipmentsByDayOfWeek } from './chartUtils';

describe('getStartOfWeek', () => {
  it('returns Monday 00:00:00 for a Wednesday input', () => {
    // 2025-01-08 is a Wednesday
    const wed = new Date(2025, 0, 8, 14, 30, 0);
    const result = getStartOfWeek(wed);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(6);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('returns the same Monday when input is already Monday', () => {
    const mon = new Date(2025, 0, 6, 10, 0, 0);
    const result = getStartOfWeek(mon);
    expect(result.getDate()).toBe(6);
    expect(result.getDay()).toBe(1);
  });

  it('returns previous Monday for a Sunday input', () => {
    // 2025-01-12 is a Sunday
    const sun = new Date(2025, 0, 12, 23, 59, 59);
    const result = getStartOfWeek(sun);
    expect(result.getDate()).toBe(6);
    expect(result.getDay()).toBe(1);
  });
});

describe('groupShipmentsByDayOfWeek', () => {
  it('returns 7 entries with zero counts for empty input', () => {
    const result = groupShipmentsByDayOfWeek([]);
    expect(result).toHaveLength(7);
    expect(result.map(e => e.name)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(result.every(e => e.shipments === 0)).toBe(true);
  });

  it('correctly counts shipments per day', () => {
    const shipments = [
      { created_at: '2025-01-06T10:00:00Z' }, // Monday
      { created_at: '2025-01-06T15:00:00Z' }, // Monday
      { created_at: '2025-01-08T09:00:00Z' }, // Wednesday
      { created_at: '2025-01-10T12:00:00Z' }, // Friday
      { created_at: '2025-01-12T08:00:00Z' }, // Sunday
    ];
    const result = groupShipmentsByDayOfWeek(shipments);
    expect(result[0]).toEqual({ name: 'Mon', shipments: 2 });
    expect(result[1]).toEqual({ name: 'Tue', shipments: 0 });
    expect(result[2]).toEqual({ name: 'Wed', shipments: 1 });
    expect(result[3]).toEqual({ name: 'Thu', shipments: 0 });
    expect(result[4]).toEqual({ name: 'Fri', shipments: 1 });
    expect(result[5]).toEqual({ name: 'Sat', shipments: 0 });
    expect(result[6]).toEqual({ name: 'Sun', shipments: 1 });
  });

  it('total count across all days equals input length', () => {
    const shipments = [
      { created_at: '2025-01-06T10:00:00Z' },
      { created_at: '2025-01-07T10:00:00Z' },
      { created_at: '2025-01-07T11:00:00Z' },
    ];
    const result = groupShipmentsByDayOfWeek(shipments);
    const total = result.reduce((sum, e) => sum + e.shipments, 0);
    expect(total).toBe(3);
  });
});
