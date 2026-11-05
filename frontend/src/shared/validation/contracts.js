import { z } from 'zod'

/**
 * Validation schemas matching backend FluentValidation contracts.
 */

// Offer Submission Schema (CreateOfferRequestValidator)
export const offerSchema = z.object({
  deliveryLeadTimeDays: z.coerce.number().int().positive('Must be a positive number'),
  shippingIncluded: z.boolean(),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  validityDateUtc: z.string().min(1, 'Validity date is required'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      rfqItemId: z.string(),
      unitPrice: z.coerce.number().positive('Unit price must be positive'),
      offeredQuantity: z.coerce.number().positive('Quantity must be positive'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one line item is required'),
})

// Offer Revision Schema (ReviseOfferRequestValidator)
export const reviseOfferSchema = z.object({
  deliveryLeadTimeDays: z.coerce.number().int().positive('Must be a positive number'),
  shippingIncluded: z.boolean(),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  validityDateUtc: z.string().min(1, 'Validity date is required'),
  changeSummary: z.string().min(5, 'Please describe the changes (min 5 chars)'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      rfqItemId: z.string(),
      unitPrice: z.coerce.number().positive('Unit price must be positive'),
      offeredQuantity: z.coerce.number().positive('Quantity must be positive'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one line item is required'),
})

// Login Schema (LoginRequestValidator)
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

