import { z } from 'zod'

/**
 * Egyptian phone regex:
 * Accepts:
 * - 01012345678, 01112345678, 01212345678, 01512345678
 * - +201012345678, +201112345678, +201212345678, +201512345678
 * - 00201012345678
 */
export const EGYPT_PHONE_REGEX = /^(?:\+20|0020)?0?1[0125]\d{8}$/

/**
 * Strong password regex patterns matching backend FluentValidation:
 * - Min 8 chars
 * - >= 1 uppercase letter [A-Z]
 * - >= 1 lowercase letter [a-z]
 * - >= 1 digit [0-9]
 * - >= 1 special character [^a-zA-Z0-9]
 */
export function createPasswordSchema(isAr = false) {
  return z
    .string()
    .min(1, isAr ? 'كلمة المرور مطلوبة' : 'Password is required')
    .min(8, isAr ? 'كلمة المرور يجب أن لا تقل عن 8 أحرف' : 'Password must be at least 8 characters')
    .regex(/[A-Z]/, isAr ? 'يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)' : 'Must contain at least one uppercase letter (A-Z)')
    .regex(/[a-z]/, isAr ? 'يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)' : 'Must contain at least one lowercase letter (a-z)')
    .regex(/[0-9]/, isAr ? 'يجب أن تحتوي على رقم واحد على الأقل (0-9)' : 'Must contain at least one digit (0-9)')
    .regex(/[^a-zA-Z0-9]/, isAr ? 'يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)' : 'Must contain at least one special character (!@#$%...)')
}

export function createEmailSchema(isAr = false) {
  return z
    .string()
    .trim()
    .min(1, isAr ? 'البريد الإلكتروني مطلوب' : 'Email address is required')
    .email(isAr ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address')
    .max(256, isAr ? 'البريد الإلكتروني لا يتجاوز 256 حرف' : 'Email cannot exceed 256 characters')
}

export function createPhoneSchema(isAr = false, required = false) {
  let schema = z.string().trim()
  if (!required) {
    return schema
      .optional()
      .refine(
        (val) => !val || EGYPT_PHONE_REGEX.test(val.replace(/\s+/g, '')),
        {
          message: isAr
            ? 'رقم الهاتف يجب أن يكون رقم مصري صالح (مثال: 01012345678 أو +201012345678)'
            : 'Must be a valid Egyptian mobile number (e.g. 01012345678 or +201012345678)',
        }
      )
  }
  return schema
    .min(1, isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required')
    .refine(
      (val) => EGYPT_PHONE_REGEX.test(val.replace(/\s+/g, '')),
      {
        message: isAr
          ? 'رقم الهاتف يجب أن يكون رقم مصري صالح (مثال: 01012345678 أو +201012345678)'
          : 'Must be a valid Egyptian mobile number (e.g. 01012345678 or +201012345678)',
      }
    )
}

export function getRegisterSchema(isAr = false) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, isAr ? 'الاسم الكامل مطلوب' : 'Full name is required')
        .min(3, isAr ? 'الاسم يجب أن لا يقل عن 3 أحرف' : 'Full name must be at least 3 characters')
        .max(150, isAr ? 'الاسم لا يتجاوز 150 حرف' : 'Full name cannot exceed 150 characters'),
      email: createEmailSchema(isAr),
      phoneNumber: createPhoneSchema(isAr, false),
      password: createPasswordSchema(isAr),
      confirmPassword: z.string().min(1, isAr ? 'يرجى تأكيد كلمة المرور' : 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: isAr ? 'كلمتا المرور غير متطابقتين' : "Passwords don't match",
      path: ['confirmPassword'],
    })
}

export function getLoginSchema(isAr = false) {
  return z.object({
    email: createEmailSchema(isAr),
    password: z.string().min(1, isAr ? 'كلمة المرور مطلوبة' : 'Password is required'),
  })
}

export function getResetPasswordSchema(isAr = false) {
  return z
    .object({
      newPassword: createPasswordSchema(isAr),
      confirmPassword: z.string().min(1, isAr ? 'يرجى تأكيد كلمة المرور' : 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: isAr ? 'كلمتا المرور غير متطابقتين' : "Passwords don't match",
      path: ['confirmPassword'],
    })
}
