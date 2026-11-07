/**
 * Verification Type Definitions
 * Maps to backend DTOs in DealZone.Application.Verification.DTOs
 */

import { VerificationDocumentType, VerificationDocumentStatus, CompanyVerificationStatus } from './common.types';

// ============================================================================
// Response DTOs
// ============================================================================

export interface UploadDocumentResponse {
  documentId: string; // Guid
  documentType: VerificationDocumentType | string;
  fileName: string;
  fileSizeBytes: number;
  status: VerificationDocumentStatus | string;
  uploadedAtUtc: string; // ISO datetime
}

export interface VerificationDocumentDto {
  id: string; // Guid
  documentType: VerificationDocumentType | string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  status: VerificationDocumentStatus | string;
  rejectionReason: string | null;
  uploadedAtUtc: string; // ISO datetime
}

export interface VerificationStatusResponse {
  companyVerificationStatus: CompanyVerificationStatus | string;
  documents: VerificationDocumentDto[];
}
