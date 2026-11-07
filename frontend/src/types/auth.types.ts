/**
 * Authentication and User Profile Type Definitions
 * Maps to backend DTOs in DealZone.Application.Auth.DTOs
 */

import { CompanyVerificationStatus, CompanyRole } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface RegisterResponse {
  userId: string; // Guid
  email: string;
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: string; // "Bearer"
}

export interface UserCompanyDto {
  id: string; // Guid
  legalName: string;
  tradeName: string;
  industrySector: string;
  city: string;
  governorate: string;
  verificationStatus: CompanyVerificationStatus | string;
  canPerformCommercialActivities: boolean;
  role: CompanyRole | string;
}

export interface UserProfileResponse {
  id: string; // Guid
  email: string;
  fullName: string;
  phoneNumber: string | null;
  isEmailConfirmed: boolean;
  isSystemAdmin: boolean;
  company: UserCompanyDto | null;
}

// Legacy alias for backward compatibility
export type UserProfile = UserProfileResponse;
