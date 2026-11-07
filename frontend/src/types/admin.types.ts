/**
 * Admin Type Definitions
 * Maps to backend DTOs in DealZone.Application.Admin.DTOs
 */

import { CompanyVerificationStatus } from './common.types';
import { VerificationDocumentDto } from './verification.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface RejectCompanyRequest {
  reason: string;
}

export interface RequestChangesRequest {
  reason: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface PendingCompanyDto {
  companyId: string; // Guid
  legalName: string;
  tradeName: string;
  industrySector: string;
  governorate: string;
  city: string;
  verificationStatus: CompanyVerificationStatus | string;
  documentCount: number;
  createdAtUtc: string; // ISO datetime
}

export interface VerificationDecisionDto {
  id: string; // Guid
  decision: CompanyVerificationStatus | string;
  reason: string | null;
  reviewedByUserEmail: string;
  decidedAtUtc: string; // ISO datetime
}

export interface CompanyVerificationDetailDto {
  companyId: string; // Guid
  legalName: string;
  tradeName: string;
  verificationStatus: CompanyVerificationStatus | string;
  rejectionReason: string | null;
  documents: VerificationDocumentDto[];
  decisionHistory: VerificationDecisionDto[];
}
