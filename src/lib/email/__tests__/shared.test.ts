import { describe, it, expect } from 'vitest';
import {
  getStatusConfig,
  formatCurrency,
  getEmailWrapper,
  STATUS_CONFIG,
  type ShipmentStatus,
} from '../templates/shared';

describe('getStatusConfig', () => {
  const allStatuses: ShipmentStatus[] = [
    'confirmed', 'picked_up', 'at_warehouse', 'qc_passed', 'qc_failed',
    'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'cancelled',
  ];

  it('returns a config for every shipment status', () => {
    for (const status of allStatuses) {
      const config = getStatusConfig(status);
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.message).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.icon).toBeTruthy();
    }
  });

  it('maps positive statuses to green (#16A34A)', () => {
    for (const status of ['confirmed', 'qc_passed', 'delivered'] as ShipmentStatus[]) {
      expect(getStatusConfig(status).color).toBe('#16A34A');
    }
  });

  it('maps negative statuses to red (#F40000)', () => {
    for (const status of ['qc_failed', 'cancelled'] as ShipmentStatus[]) {
      expect(getStatusConfig(status).color).toBe('#F40000');
    }
  });

  it('maps in-progress statuses to orange (#F97316)', () => {
    for (const status of ['picked_up', 'at_warehouse', 'in_transit', 'customs_clearance', 'out_for_delivery'] as ShipmentStatus[]) {
      expect(getStatusConfig(status).color).toBe('#F97316');
    }
  });

  it('STATUS_CONFIG covers exactly 10 statuses', () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(10);
  });
});

describe('formatCurrency', () => {
  it('formats amount with ₹ symbol and two decimals', () => {
    expect(formatCurrency(1500)).toBe('₹1,500.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(99.5)).toBe('₹99.50');
  });
});

describe('getEmailWrapper', () => {
  it('wraps content in branded HTML with CourierX header', () => {
    const html = getEmailWrapper('<p>Hello</p>');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('CourierX');
    expect(html).toContain('#F40000'); // Coke Red accent
    expect(html).toContain('#FAFAF8'); // Paper White bg
    expect(html).toContain('#262626'); // Charcoal text
    expect(html).toContain('Courier Prime'); // Font
  });
});
