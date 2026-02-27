import { z } from 'zod';

export const bookingRequestSchema = z.object({
  bookingReferenceId: z.string().min(1).max(64),
  recipientName: z.string().min(1).max(200),
  recipientPhone: z.string().regex(/^\+?[1-9]\d{6,14}$/),
  recipientEmail: z.string().email().optional(),
  originAddress: z.string().min(1).max(500),
  destinationAddress: z.string().min(1).max(500),
  destinationCountry: z.string().min(2).max(100),
  weightKg: z.number().positive().max(30),
  dimensions: z
    .object({
      lengthCm: z.number().positive(),
      widthCm: z.number().positive(),
      heightCm: z.number().positive(),
    })
    .optional(),
  declaredValue: z.number().nonnegative(),
  shipmentType: z.enum(['medicine', 'document', 'gift']),
  shippingCost: z.number().nonnegative().optional(),
  gstAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export const adminActionSchema = z.object({
  shipmentId: z.string().uuid(),
  action: z.enum(['quality_check', 'package', 'approve_dispatch']),
  expectedVersion: z.number().int().positive(),
});

export const dispatchSchema = z.object({
  shipmentId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
});

export const cronAuthSchema = z.object({
  authorization: z.string().min(1),
});
