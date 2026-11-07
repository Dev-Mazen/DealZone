# TypeScript Type Definitions

This directory contains comprehensive TypeScript type definitions that mirror all backend DTOs from the DealZone .NET Web API.

## 📁 File Structure

```
types/
├── index.ts                  # Central export file for all types
├── common.types.ts           # Common enums (CompanyVerificationStatus, RfqStatus, etc.)
├── auth.types.ts             # Authentication and user profile types
├── company.types.ts          # Company management types
├── verification.types.ts     # Company verification document types
├── catalog.types.ts          # Categories, materials, and units of measure
├── rfq.types.ts              # Request for Quotation types
├── offer.types.ts            # Offer and bidding types
├── deal.types.ts             # Deal and dispute types
├── shipment.types.ts         # Shipping and logistics types
├── review.types.ts           # Company and deal review types
├── notification.types.ts     # User notification types
├── admin.types.ts            # Admin panel and verification management types
├── pagination.types.ts       # Paginated response wrappers
├── error.types.ts            # RFC 7807 ProblemDetails error types
└── README.md                 # This file
```

## 🎯 Usage

### Basic Import

Import types from the central index file:

```typescript
import { 
  UserProfileResponse, 
  RfqStatus, 
  PagedResult,
  ProblemDetails 
} from '@/types';
```

### Specific File Import

Import from specific type files when needed:

```typescript
import { CreateRfqRequest, RfqDetailResponse } from '@/types/rfq.types';
import { OfferStatus } from '@/types/common.types';
```

## 📝 Type Categories

### Common Enums (`common.types.ts`)

All backend domain enums are defined here:
- **Company**: `CompanyVerificationStatus`, `CompanyRole`, `VerificationDocumentType`, `VerificationDocumentStatus`
- **RFQ**: `RfqStatus`
- **Offer**: `OfferStatus`
- **Deal**: `DealStatus`, `DisputeStatus`, `DisputeCategory`, `DisputeResolutionAction`
- **Shipping**: `ShippingArrangement`, `ShipmentStatus`

### Request/Response DTOs

Each domain has corresponding request and response types:

**Authentication** (`auth.types.ts`)
- `RegisterRequest`, `LoginRequest`, `AuthResponse`
- `UserProfileResponse`, `UserCompanyDto`

**Company** (`company.types.ts`)
- `CreateCompanyRequest`, `UpdateCompanyProfileRequest`
- `CompanyResponse`, `CompanyContactDetailsResponse`

**RFQ** (`rfq.types.ts`)
- `CreateRfqRequest`, `UpdateRfqRequest`, `CreateRfqItemRequest`
- `RfqDetailResponse`, `RfqSummaryResponse`, `RfqItemResponse`
- `RfqDiscoveryFilter`, `MyRfqFilter`

**Offer** (`offer.types.ts`)
- `CreateOfferRequest`, `ReviseOfferRequest`, `AcceptOfferRequest`, `RejectOfferRequest`
- `OfferDetailResponse`, `OfferSummaryResponse`, `OfferRevisionSummaryResponse`
- `OfferFilter`

**Deal** (`deal.types.ts`)
- `CreateDisputeRequest`, `ResolveDisputeRequest`, `CancelDealRequest`
- `DealDetailResponse`, `DealSummaryResponse`, `DealCommercialTermsSnapshot`
- `DisputeDetailResponse`, `DisputeSummaryResponse`

**Catalog** (`catalog.types.ts`)
- `CategoryDto`, `MaterialDto`, `UnitOfMeasureDto`
- `CreateCategoryRequest`, `CreateMaterialRequest`, `CreateUnitRequest`
- `CatalogMaterialFilter`

**Shipment** (`shipment.types.ts`)
- `CreateShipmentRequest`, `UpdateShipmentStatusRequest`, `AssignShippingProviderRequest`
- `ShipmentResponse`, `ShipmentTrackingEventDto`, `ShippingProviderResponse`

**Review** (`review.types.ts`)
- `CreateReviewRequest`
- `ReviewResponse`, `CompanyReviewStatsDto`, `CompanyReviewsResponse`

**Notification** (`notification.types.ts`)
- `NotificationResponse`, `UnreadCountResponse`

**Admin** (`admin.types.ts`)
- `RejectCompanyRequest`, `RequestChangesRequest`
- `PendingCompanyDto`, `CompanyVerificationDetailDto`, `VerificationDecisionDto`

**Verification** (`verification.types.ts`)
- `UploadDocumentResponse`, `VerificationStatusResponse`, `VerificationDocumentDto`

### Utility Types

**Pagination** (`pagination.types.ts`)
- `PagedResult<T>`: Generic wrapper for paginated API responses
- `PaginationParams`: Common pagination query parameters
- Helper functions: `createDefaultPaginationParams`, `calculateTotalPages`, `hasNextPage`, `hasPreviousPage`

**Error Handling** (`error.types.ts`)
- `ProblemDetails`: RFC 7807 standard error response structure
- `ApiError`, `ValidationError`: Structured error types
- Helper functions: `formatProblemDetails`, `problemDetailsToApiError`, `extractValidationErrors`
- `HttpStatusCode`: HTTP status code constants

## 🔄 Backend Mapping

All types in this directory are direct mappings of backend C# DTOs:

| Frontend File | Backend Source |
|--------------|----------------|
| `common.types.ts` | `DealZone.Domain/*/*.cs` (Enums) |
| `auth.types.ts` | `DealZone.Application.Auth.DTOs.AuthDtos` |
| `company.types.ts` | `DealZone.Application.Companies.DTOs.CompanyDtos` |
| `verification.types.ts` | `DealZone.Application.Verification.DTOs.VerificationDtos` |
| `catalog.types.ts` | `DealZone.Application.Catalog.DTOs.CatalogDtos` |
| `rfq.types.ts` | `DealZone.Application.Rfqs.DTOs.RfqDtos` |
| `offer.types.ts` | `DealZone.Application.Offers.DTOs.OfferDtos` |
| `deal.types.ts` | `DealZone.Application.Deals.DTOs.DealDtos` |
| `shipment.types.ts` | `DealZone.Application.Shipping.DTOs.ShippingDtos` |
| `review.types.ts` | `DealZone.Application.Reviews.DTOs.ReviewDtos` |
| `notification.types.ts` | `DealZone.Application.Notifications.DTOs.NotificationDtos` |
| `admin.types.ts` | `DealZone.Application.Admin.DTOs.AdminDtos` |
| `pagination.types.ts` | `DealZone.Application.Common.Models.PagedResult` |
| `error.types.ts` | RFC 7807 ProblemDetails (ASP.NET Core) |

## 💡 Best Practices

### 1. Use Enums for Type Safety

```typescript
import { RfqStatus } from '@/types';

// ✅ Good: Type-safe enum usage
if (rfq.status === RfqStatus.Published) {
  // ...
}

// ❌ Bad: Magic strings
if (rfq.status === 'Published') {
  // ...
}
```

### 2. Leverage Union Types for Backend String Enums

The backend returns enum values as strings in API responses. Types support both:

```typescript
interface RfqDetailResponse {
  status: RfqStatus | string; // Supports both enum and string
}

// Type guards for safe conversion
const isValidRfqStatus = (status: string): status is RfqStatus => {
  return Object.values(RfqStatus).includes(status as RfqStatus);
};
```

### 3. Use Generic PagedResult

```typescript
import { PagedResult, RfqSummaryResponse } from '@/types';

const fetchRfqs = async (): Promise<PagedResult<RfqSummaryResponse>> => {
  const response = await apiClient.get('/rfqs');
  return response.data;
};
```

### 4. Handle Errors Consistently

```typescript
import { ProblemDetails, formatProblemDetails } from '@/types';
import { AxiosError } from 'axios';

try {
  await apiClient.post('/rfqs', data);
} catch (error) {
  if (error instanceof AxiosError && error.response?.data) {
    const problem = error.response.data as ProblemDetails;
    const message = formatProblemDetails(problem);
    showToast('error', message);
  }
}
```

### 5. Use Partial for Optional Updates

```typescript
import { UpdateCompanyProfileRequest } from '@/types';

// Only update specific fields
const updateData: Partial<UpdateCompanyProfileRequest> = {
  tradeName: 'New Trade Name',
};
```

## 🔍 Type Checking

All types include proper nullability annotations:
- `string | null`: Backend nullable string
- `string?`: Optional frontend field
- `string`: Required non-null field

Guid fields from the backend are typed as `string` in TypeScript.

Decimal fields from the backend are typed as `number` in TypeScript.

DateTimeOffset fields from the backend are typed as `string` (ISO 8601 format).

## 📚 Related Documentation

- Backend API Handover: `backend/docs/API_HANDOVER.md`
- Backend DTOs: `backend/src/DealZone.Application/*/DTOs/`
- Backend Enums: `backend/src/DealZone.Domain/*/`

## 🔄 Maintenance

When backend DTOs change:
1. Locate the corresponding C# DTO file
2. Update the matching TypeScript interface
3. Run type checking: `npm run type-check`
4. Update any affected API service files

## ✅ Requirements Validation

This implementation satisfies:
- **Requirement 8.3**: Complete TypeScript type definitions for all backend DTOs
- **Requirement 8.4**: Type-safe API integration with proper DTO contract adherence
- **Requirement 8**: Backend API Integration Audit and Verification
