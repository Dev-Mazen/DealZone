/**
 * Company Type Definitions
 * Maps to backend DTOs in DealZone.Application.Companies.DTOs
 */

import { CompanyVerificationStatus } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateCompanyRequest {
  legalName: string;
  tradeName: string;
  industrySector: string;
  city: string;
  governorate: string;
  description?: string | null;
  website?: string | null;
  taxIdNumber: string;
  commercialRegistrationNumber: string;
  corporateEmail: string;
  corporatePhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
}

export interface UpdateCompanyProfileRequest {
  tradeName: string;
  city: string;
  governorate: string;
  description?: string | null;
  website?: string | null;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface CompanyResponse {
  id: string; // Guid
  legalName: string;
  tradeName: string;
  industrySector: string;
  city: string;
  governorate: string;
  description: string | null;
  website: string | null;
  verificationStatus: CompanyVerificationStatus | string;
  canPerformCommercialActivities: boolean;
  createdAtUtc: string; // ISO datetime
}

export interface CompanyContactDetailsResponse {
  companyId: string; // Guid
  taxIdNumber: string;
  commercialRegistrationNumber: string;
  corporateEmail: string;
  corporatePhone: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  createdAtUtc: string; // ISO datetime
  lastModifiedAtUtc: string | null; // ISO datetime
}
