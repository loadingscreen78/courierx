/**
 * Pure utility functions for admin dashboard chart data.
 */

export interface ShipmentWithTimestamp {
  created_at: string;
}

export interface DayOfWeekEntry {
  name: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  shipments: number;
}

const DAY_NAMES: DayOfWeekEntry['name'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Returns the Monday 00:00:00.000 of the week containing the given date.
 * Week starts on Monday (ISO standard).
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  // Shift so Monday = 0: (day + 6) % 7
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Groups shipments by day of week (Mon–Sun) and returns an array of 7 entries.
 * Each entry has the day name and the count of shipments created on that day.
 */
export function groupShipmentsByDayOfWeek(
  shipments: ShipmentWithTimestamp[]
): DayOfWeekEntry[] {
  const counts: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const shipment of shipments) {
    const date = new Date(shipment.created_at);
    // Convert JS day (0=Sun) to ISO index (0=Mon): (day + 6) % 7
    const isoIndex = (date.getDay() + 6) % 7;
    counts[isoIndex]++;
  }

  return DAY_NAMES.map((name, i) => ({ name, shipments: counts[i] }));
}
