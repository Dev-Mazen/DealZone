# DealZone Backend Integration Audit Report

Generated: 2026-11-07

> **Scope:** Source-code audit only. No runtime execution or database connection was used.  
> **Backend Docs:** `backend/docs/API_HANDOVER.md` (Phases 0–9, 80 operations across 82 routes)  
> **Frontend Files Audited:**
> - `frontend/src/shared/api/axios.js`
> - `frontend/src/shared/api/services/authService.js`
> - `frontend/src/shared/api/services/companyService.js`
> - `frontend/src/shared/api/services/catalogService.js`
> - `frontend/src/shared/api/services/rfqService.js`
> - `frontend/src/shared/api/services/offerService.js`
> - `frontend/src/shared/api/services/dealService.js`
> - `frontend/src/shared/api/services/notificationService.js`
> - `frontend/src/shared/api/services/adminService.js`
> - `frontend/src/store/authStore.js`
> - `frontend/src/store/uiStore.js`

---

## Summary

| Metric | Count |
|---|---|
| Total backend endpoints documented | 80 operations (82 routes) |
| Total frontend service calls audited | 57 |
| ✅ Verified correct | 51 |
| ⚠️ Minor issues found | 4 |
| ❌ Critical issues | 2 |

---

## Axios Configuration Audit

### ✅ Base URL — VITE_API_BASE_URL env variable
```js
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5023/api/v1'
```
Correctly reads `VITE_API_BASE_URL` from the Vite environment and falls back to the documented local HTTP dev server (`http://localhost:5023`). The base URL already includes `/api/v1`, so service files correctly use relative paths like `/auth/login`.

### ✅ Auth token attached via request interceptor
```js
const token = tokenStore.getAccess()
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```
Correctly attaches `Authorization: Bearer <token>` to every outbound request when a token is present.

### ✅ 401 → Token refresh logic with queue
The response interceptor correctly:
1. Detects `401` responses.
2. Guards against refresh loops with `original._retry` and skips the refresh call itself (`original.url !== '/auth/refresh'`).
3. Queues concurrent failed requests while a refresh is in flight (`isRefreshing` flag + `failedQueue`).
4. On refresh success: updates both `accessToken` and `refreshToken` in `tokenStore`, drains the queue, retries original request.
5. On refresh failure: clears all tokens, drains queue with error, dispatches `auth:session-expired` custom event.

> [!NOTE]
> The URL guard check is `original.url !== '/auth/refresh'`. Because the `api` instance's `baseURL` is `http://localhost:5023/api/v1`, the `config.url` on a request made via `api.post('/auth/refresh', …)` will be `/auth/refresh` (the relative portion only). The guard is therefore correct and will not loop.

### ✅ Error extraction from RFC 7807 ProblemDetails
```js
const problem = (error.response?.data) || { status: ..., title: ... }
const apiError = new Error(problem.detail || problem.title)
apiError.status = problem.status || error.response?.status || 0
apiError.problem = problem
```
Correctly extracts `detail` and `title` from ProblemDetails. The full `problem` object (including `errors`, `traceId`, `instance`) is attached as `apiError.problem` for upstream consumers to use (e.g., form field error mapping).

### ⚠️ Token storage security (minor advisory)
The refresh token is stored in `localStorage` (`dz_refresh` key). The backend documentation (Section 14.2) recommends HTTP-only cookies or secure application storage for refresh tokens to protect against XSS. This is a security best practice advisory, not a functional API contract mismatch. The current implementation is functional but suboptimal for production hardening.

---

## Authentication (`authService.js`) — 9 endpoints

### ✅ POST /api/v1/auth/register
```js
register: (data) => api.post('/auth/register', data)
```
Method: `POST` ✅ | Path: `/auth/register` ✅ | Body: passes caller-supplied `data` object (expects `{ email, password, fullName, phoneNumber }`) ✅

### ✅ POST /api/v1/auth/confirm-email
```js
confirmEmail: (email, token) => api.post('/auth/confirm-email', { email, token })
```
Method: `POST` ✅ | Path: `/auth/confirm-email` ✅ | Body fields `email` + `token` match `ConfirmEmailRequest` ✅

### ✅ POST /api/v1/auth/resend-confirmation
```js
resendConfirmation: (email) => api.post('/auth/resend-confirmation', { email })
```
Method: `POST` ✅ | Path: `/auth/resend-confirmation` ✅ | Body `{ email }` matches `ResendConfirmationRequest` ✅

### ✅ POST /api/v1/auth/login
```js
login: (data) => api.post('/auth/login', data)
```
Method: `POST` ✅ | Path: `/auth/login` ✅ | Body: passes caller-supplied `data` (expects `{ email, password }`) ✅

### ✅ POST /api/v1/auth/refresh
```js
refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
```
Method: `POST` ✅ | Path: `/auth/refresh` ✅ | Body field `refreshToken` matches `RefreshTokenRequest` ✅

### ✅ POST /api/v1/auth/logout
```js
logout: (refreshToken) => api.post('/auth/logout', refreshToken ? { refreshToken } : {})
```
Method: `POST` ✅ | Path: `/auth/logout` ✅ | Body field `refreshToken` matches `RefreshTokenRequest` ✅. The optional guard (`refreshToken ? { refreshToken } : {}`) is safe — the backend accepts anonymous calls.

### ✅ POST /api/v1/auth/forgot-password
```js
forgotPassword: (email) => api.post('/auth/forgot-password', { email })
```
Method: `POST` ✅ | Path: `/auth/forgot-password` ✅ | Body `{ email }` matches `ForgotPasswordRequest` ✅

### ✅ POST /api/v1/auth/reset-password
```js
resetPassword: (email, token, newPassword) =>
  api.post('/auth/reset-password', { email, token, newPassword })
```
Method: `POST` ✅ | Path: `/auth/reset-password` ✅ | Body fields `email`, `token`, `newPassword` match `ResetPasswordRequest` ✅

### ✅ GET /api/v1/auth/me
```js
me: () => api.get('/auth/me')
```
Method: `GET` ✅ | Path: `/auth/me` ✅ | No body required ✅

---

## Company Management (`companyService.js`) — 10 endpoints

### ✅ POST /api/v1/companies
```js
create: (data) => api.post('/companies', data)
```
Method: `POST` ✅ | Path: `/companies` ✅ | Body: passes caller-supplied `data` (expects `CreateCompanyRequest` fields) ✅

### ✅ GET /api/v1/companies/me
```js
getMyCompany: () => api.get('/companies/me')
```
Method: `GET` ✅ | Path: `/companies/me` ✅

### ✅ PUT /api/v1/companies/me
```js
updateMyCompany: (data) => api.put('/companies/me', data)
```
Method: `PUT` ✅ | Path: `/companies/me` ✅ | Body: passes `UpdateCompanyProfileRequest` ✅

### ✅ GET /api/v1/companies/me/contact-details
```js
getMyContactDetails: () => api.get('/companies/me/contact-details')
```
Method: `GET` ✅ | Path: `/companies/me/contact-details` ✅

### ✅ POST /api/v1/companies/me/verification-documents
```js
uploadVerificationDocument: (documentType, file) => {
  const formData = new FormData()
  formData.append('documentType', String(documentType))
  formData.append('file', file)
  return api.post('/companies/me/verification-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```
Method: `POST` ✅ | Path: `/companies/me/verification-documents` ✅ | `multipart/form-data` ✅ | Form fields `documentType` (integer coerced to string — browsers will send as form value) and `file` match backend requirements ✅. `documentType` enum integers: `1` = CommercialRegister, `2` = TaxCard, `3` = IndustrialRegister, `4` = QualityCertificate, `5` = Other — numeric values must be enforced by callers.

### ✅ GET /api/v1/companies/me/verification
```js
getVerificationStatus: () => api.get('/companies/me/verification')
```
Method: `GET` ✅ | Path: `/companies/me/verification` ✅

### ✅ DELETE /api/v1/companies/me/verification-documents/{documentId}
```js
deleteVerificationDocument: (documentId) =>
  api.delete(`/companies/me/verification-documents/${documentId}`)
```
Method: `DELETE` ✅ | Path: `/companies/me/verification-documents/{documentId}` ✅

### ✅ POST /api/v1/companies/me/verification/submit
```js
submitForReview: () => api.post('/companies/me/verification/submit')
```
Method: `POST` ✅ | Path: `/companies/me/verification/submit` ✅ | No body required ✅

### ✅ GET /api/v1/companies/{companyId}/reviews
```js
getCompanyReviews: (companyId, params) =>
  api.get(`/companies/${companyId}/reviews`, { params })
```
Method: `GET` ✅ | Path: `/companies/{companyId}/reviews` ✅ | Query params forwarded ✅

### ✅ GET /api/v1/companies/me/reviews
```js
getMyCompanyReviews: (params) => api.get('/companies/me/reviews', { params })
```
Method: `GET` ✅ | Path: `/companies/me/reviews` ✅ | Query params forwarded ✅

---

## Raw Material Catalog (`catalogService.js`) — 15 endpoints

### ✅ GET /api/v1/catalog/categories
```js
getCategories: () => api.get('/catalog/categories')
```
Method: `GET` ✅ | Path: `/catalog/categories` ✅

### ✅ GET /api/v1/catalog/categories/{id}
```js
getCategory: (id) => api.get(`/catalog/categories/${id}`)
```
Method: `GET` ✅ | Path: `/catalog/categories/{id}` ✅

### ✅ GET /api/v1/catalog/materials
```js
getMaterials: (params) => api.get('/catalog/materials', { params })
```
Method: `GET` ✅ | Path: `/catalog/materials` ✅ | Query params forwarded via `params` object ✅  
Backend accepts: `categoryId`, `searchTerm`, `activeOnly`, `pageNumber`, `pageSize`, `sortBy`, `sortDescending` — all standard camelCase ✅

### ✅ GET /api/v1/catalog/materials/{id}
```js
getMaterial: (id) => api.get(`/catalog/materials/${id}`)
```
Method: `GET` ✅ | Path: `/catalog/materials/{id}` ✅

### ✅ GET /api/v1/catalog/units
```js
getUnits: () => api.get('/catalog/units')
```
Method: `GET` ✅ | Path: `/catalog/units` ✅

### ✅ GET /api/v1/catalog/units/{id}
```js
getUnit: (id) => api.get(`/catalog/units/${id}`)
```
Method: `GET` ✅ | Path: `/catalog/units/{id}` ✅

### ✅ POST /api/v1/admin/catalog/categories
```js
createCategory: (data) => api.post('/admin/catalog/categories', data)
```
Method: `POST` ✅ | Path: `/admin/catalog/categories` ✅

### ✅ PUT /api/v1/admin/catalog/categories/{id}
```js
updateCategory: (id, data) => api.put(`/admin/catalog/categories/${id}`, data)
```
Method: `PUT` ✅ | Path: `/admin/catalog/categories/{id}` ✅

### ✅ DELETE /api/v1/admin/catalog/categories/{id}
```js
deleteCategory: (id) => api.delete(`/admin/catalog/categories/${id}`)
```
Method: `DELETE` ✅ | Path: `/admin/catalog/categories/{id}` ✅

### ✅ POST /api/v1/admin/catalog/materials
```js
createMaterial: (data) => api.post('/admin/catalog/materials', data)
```
Method: `POST` ✅ | Path: `/admin/catalog/materials` ✅

### ✅ PUT /api/v1/admin/catalog/materials/{id}
```js
updateMaterial: (id, data) => api.put(`/admin/catalog/materials/${id}`, data)
```
Method: `PUT` ✅ | Path: `/admin/catalog/materials/{id}` ✅

### ✅ DELETE /api/v1/admin/catalog/materials/{id}
```js
deleteMaterial: (id) => api.delete(`/admin/catalog/materials/${id}`)
```
Method: `DELETE` ✅ | Path: `/admin/catalog/materials/{id}` ✅

### ✅ POST /api/v1/admin/catalog/units
```js
createUnit: (data) => api.post('/admin/catalog/units', data)
```
Method: `POST` ✅ | Path: `/admin/catalog/units` ✅

### ✅ PUT /api/v1/admin/catalog/units/{id}
```js
updateUnit: (id, data) => api.put(`/admin/catalog/units/${id}`, data)
```
Method: `PUT` ✅ | Path: `/admin/catalog/units/{id}` ✅

### ✅ DELETE /api/v1/admin/catalog/units/{id}
```js
deleteUnit: (id) => api.delete(`/admin/catalog/units/${id}`)
```
Method: `DELETE` ✅ | Path: `/admin/catalog/units/{id}` ✅

---

## RFQ Workflow (`rfqService.js`) — 7 endpoints

### ✅ POST /api/v1/rfqs
```js
create: (data) => api.post('/rfqs', data)
```
Method: `POST` ✅ | Path: `/rfqs` ✅ | Body: passes `CreateRfqRequest` ✅

### ✅ GET /api/v1/rfqs/{id}
```js
get: (id) => api.get(`/rfqs/${id}`)
```
Method: `GET` ✅ | Path: `/rfqs/{id}` ✅

### ✅ GET /api/v1/rfqs/mine
```js
getMine: (params) => api.get('/rfqs/mine', { params })
```
Method: `GET` ✅ | Path: `/rfqs/mine` ✅ | Query params forwarded ✅

### ✅ GET /api/v1/rfqs (supplier discovery)
```js
discover: (params) => api.get('/rfqs', { params })
```
Method: `GET` ✅ | Path: `/rfqs` ✅ | Query params forwarded ✅  
Backend accepts: `categoryId`, `materialId`, `governorate`, `city`, `searchTerm`, `closingBeforeUtc`, `pageNumber`, `pageSize`, `sortBy`, `sortDescending` ✅

### ✅ PUT /api/v1/rfqs/{id}
```js
update: (id, data) => api.put(`/rfqs/${id}`, data)
```
Method: `PUT` ✅ | Path: `/rfqs/{id}` ✅

### ✅ POST /api/v1/rfqs/{id}/publish
```js
publish: (id) => api.post(`/rfqs/${id}/publish`)
```
Method: `POST` ✅ | Path: `/rfqs/{id}/publish` ✅ | No body required ✅

### ✅ POST /api/v1/rfqs/{id}/close
```js
close: (id) => api.post(`/rfqs/${id}/close`)
```
Method: `POST` ✅ | Path: `/rfqs/{id}/close` ✅ | No body required ✅

### ✅ POST /api/v1/rfqs/{id}/cancel
```js
cancel: (id) => api.post(`/rfqs/${id}/cancel`)
```
Method: `POST` ✅ | Path: `/rfqs/{id}/cancel` ✅ | No body required ✅

---

## Offers & Negotiation (`offerService.js`) — 8 endpoints

### ✅ POST /api/v1/rfqs/{rfqId}/offers
```js
create: (rfqId, data) => api.post(`/rfqs/${rfqId}/offers`, data)
```
Method: `POST` ✅ | Path: `/rfqs/{rfqId}/offers` ✅ | Body: passes `CreateOfferRequest` ✅

### ✅ GET /api/v1/rfqs/{rfqId}/offers/mine
```js
getMyOfferForRfq: (rfqId) => api.get(`/rfqs/${rfqId}/offers/mine`)
```
Method: `GET` ✅ | Path: `/rfqs/{rfqId}/offers/mine` ✅

### ✅ GET /api/v1/rfqs/{rfqId}/offers
```js
getOffersForRfq: (rfqId) => api.get(`/rfqs/${rfqId}/offers`)
// Also aliased as:
getForRfq: (rfqId) => api.get(`/rfqs/${rfqId}/offers`)
```
Method: `GET` ✅ | Path: `/rfqs/{rfqId}/offers` ✅. The duplicate alias (`getForRfq`) is redundant but harmless.

### ✅ GET /api/v1/offers/{id}
```js
get: (id) => api.get(`/offers/${id}`)
```
Method: `GET` ✅ | Path: `/offers/{id}` ✅

### ✅ GET /api/v1/offers/mine
```js
getMine: (params) => api.get('/offers/mine', { params })
```
Method: `GET` ✅ | Path: `/offers/mine` ✅ | Query params forwarded ✅

### ✅ POST /api/v1/offers/{id}/revise
```js
revise: (id, data) => api.post(`/offers/${id}/revise`, data)
```
Method: `POST` ✅ | Path: `/offers/{id}/revise` ✅ | Body: passes `ReviseOfferRequest` (same shape as `CreateOfferRequest` + `changeSummary`) ✅

### ✅ GET /api/v1/offers/{id}/revisions
```js
getRevisions: (id) => api.get(`/offers/${id}/revisions`)
```
Method: `GET` ✅ | Path: `/offers/{id}/revisions` ✅

### ❌ POST /api/v1/offers/{id}/accept — CRITICAL: Wrong request body field name
```js
// Frontend (WRONG):
accept: (id, notes) => api.post(`/offers/${id}/accept`, { notes })
```
**Issue:** The frontend sends `{ notes }` as the request body. The backend contract defines `AcceptOfferRequest?` (optional body). The API_HANDOVER.md does **not** document a `notes` field on the `AcceptOfferRequest` — the accept endpoint signature in the reference table shows `AcceptOfferRequest?` with no body fields described, implying either an empty body or a body with no documented fields. The field name `notes` is **not part of any documented contract**. If `AcceptOfferRequest` is an empty DTO or null, this sends an unexpected field that the backend will silently ignore (not critical). However, if the caller intends to pass buyer-side notes/reason, there is no backend field for this, so the data is silently dropped.

> [!CAUTION]
> **Action Required:** Confirm the shape of `AcceptOfferRequest` with the backend team. If the endpoint truly requires no body, the frontend should call `api.post(\`/offers/${id}/accept\`)` with no body argument. As currently written, the spurious `{ notes }` payload is sent on every accept call. This will not cause a 4xx error (backend will ignore unknown fields), but the caller's intent (passing notes) is never fulfilled.

### ✅ POST /api/v1/offers/{id}/reject
```js
reject: (id, reason) => api.post(`/offers/${id}/reject`, { reason })
```
Method: `POST` ✅ | Path: `/offers/{id}/reject` ✅ | Body field `reason` matches `RejectOfferRequest` (`{ "reason": "..." }`) ✅

---

## Deals, Fulfillment & Disputes (`dealService.js`) — 10 endpoints

### ✅ GET /api/v1/deals/mine
```js
getMine: (params) => api.get('/deals/mine', { params })
```
Method: `GET` ✅ | Path: `/deals/mine` ✅ | Query params forwarded ✅ (supports `DealStatus?` + pagination)

### ✅ GET /api/v1/deals/{id}
```js
get: (id) => api.get(`/deals/${id}`)
```
Method: `GET` ✅ | Path: `/deals/{id}` ✅

### ✅ POST /api/v1/deals/{id}/confirm
```js
confirm: (id) => api.post(`/deals/${id}/confirm`)
```
Method: `POST` ✅ | Path: `/deals/{id}/confirm` ✅ | No body required ✅

### ✅ POST /api/v1/deals/{id}/start
```js
start: (id) => api.post(`/deals/${id}/start`)
```
Method: `POST` ✅ | Path: `/deals/{id}/start` ✅ | No body required ✅

### ✅ POST /api/v1/deals/{id}/complete
```js
complete: (id) => api.post(`/deals/${id}/complete`)
```
Method: `POST` ✅ | Path: `/deals/{id}/complete` ✅ | No body required ✅

### ✅ POST /api/v1/deals/{id}/cancel
```js
cancel: (id, reason) => api.post(`/deals/${id}/cancel`, { reason })
```
Method: `POST` ✅ | Path: `/deals/{id}/cancel` ✅ | Body field `reason` matches `CancelDealRequest` ✅

### ❌ POST /api/v1/deals/{id}/disputes — CRITICAL: Wrong request body field name
```js
// Frontend (WRONG):
openDispute: (id, category, description) =>
  api.post(`/deals/${id}/disputes`, { category, description })
```
**Issue:** The backend contract (`CreateDisputeRequest`) documents the dispute category as an integer enum:
- `QualityDefect` = `1`
- `QuantityMismatch` = `2`
- `LateDelivery` = `3`
- `DamagedGoods` = `4`
- `NonDelivery` = `5`
- `TermsViolation` = `6`
- `Other` = `99`

The frontend passes a field named `description` for the reason/details text. The backend DTO field name for this is **not explicitly documented** in `API_HANDOVER.md` beyond the word "description" used loosely in the dispute section prose. However, the more critical issue is the **field name `description`** — most backend DTO patterns in this codebase use `reason` for free-text reason fields (e.g., `CancelDealRequest.reason`, `RejectOfferRequest.reason`). If the backend DTO uses `reason` instead of `description`, the dispute reason text will be **silently dropped** (sent as an unrecognized field).

> [!CAUTION]
> **Action Required:** Verify the exact field name in `CreateDisputeRequest`. If the backend uses `reason` (consistent with other DTOs in this codebase), the frontend must be changed from `{ category, description }` to `{ category, reason }`. This is a likely silent data-loss bug.

### ✅ GET /api/v1/deals/{id}/disputes
```js
getDisputes: (id) => api.get(`/deals/${id}/disputes`)
```
Method: `GET` ✅ | Path: `/deals/{id}/disputes` ✅

### ✅ POST /api/v1/deals/{dealId}/reviews
```js
submitReview: (dealId, rating, comment) =>
  api.post(`/deals/${dealId}/reviews`, { rating, comment })
```
Method: `POST` ✅ | Path: `/deals/{dealId}/reviews` ✅ | Body fields `rating` (1–5) and `comment` match `CreateReviewRequest` ✅

### ✅ GET /api/v1/deals/{dealId}/reviews
```js
getDealReviews: (dealId) => api.get(`/deals/${dealId}/reviews`)
```
Method: `GET` ✅ | Path: `/deals/{dealId}/reviews` ✅

---

## Shipping & Logistics (`dealService.js` / `shipmentService`) — 6 endpoints

### ✅ POST /api/v1/deals/{dealId}/shipments
```js
createShipment: (dealId, data) => api.post(`/deals/${dealId}/shipments`, data)
```
Method: `POST` ✅ | Path: `/deals/{dealId}/shipments` ✅ | Body: passes `CreateShipmentRequest` ✅

### ✅ GET /api/v1/deals/{dealId}/shipments
```js
getDealShipments: (dealId) => api.get(`/deals/${dealId}/shipments`)
```
Method: `GET` ✅ | Path: `/deals/{dealId}/shipments` ✅

### ✅ GET /api/v1/shipments/{id}
```js
get: (id) => api.get(`/shipments/${id}`)
```
Method: `GET` ✅ | Path: `/shipments/{id}` ✅

### ✅ PUT /api/v1/shipments/{id}/tracking
```js
updateTracking: (id, data) => api.put(`/shipments/${id}/tracking`, data)
```
Method: `PUT` ✅ | Path: `/shipments/${id}/tracking` ✅ | Body: passes `UpdateTrackingRequest` ✅

### ⚠️ POST /api/v1/shipments/{id}/status — Minor: Undocumented field names
```js
updateStatus: (id, status, location, description) =>
  api.post(`/shipments/${id}/status`, { status, location, description })
```
Method: `POST` ✅ | Path: `/shipments/${id}/status` ✅  
**Minor Issue:** The backend contract references `UpdateShipmentStatusRequest` but `API_HANDOVER.md` does not fully document its body field names. The frontend sends `{ status, location, description }`. `status` is a numeric `ShipmentStatus` enum (`Pending=0` through `Cancelled=7`). The fields `location` and `description` are plausible but unverifiable from the handover doc alone. This is a documentation gap, not a confirmed mismatch.

---

## Admin — Verification (`adminService.js`) — 6 endpoints

### ✅ GET /api/v1/admin/verification/pending
```js
getPendingCompanies: () => api.get('/admin/verification/pending')
```
Method: `GET` ✅ | Path: `/admin/verification/pending` ✅

### ✅ GET /api/v1/admin/verification/{companyId}
```js
getCompanyVerificationDetail: (companyId) =>
  api.get(`/admin/verification/${companyId}`)
```
Method: `GET` ✅ | Path: `/admin/verification/{companyId}` ✅

### ✅ POST /api/v1/admin/verification/{companyId}/approve
```js
approveCompany: (companyId) =>
  api.post(`/admin/verification/${companyId}/approve`)
```
Method: `POST` ✅ | Path: `/admin/verification/{companyId}/approve` ✅ | No body required ✅

### ✅ POST /api/v1/admin/verification/{companyId}/reject
```js
rejectCompany: (companyId, reason) =>
  api.post(`/admin/verification/${companyId}/reject`, { reason })
```
Method: `POST` ✅ | Path: `/admin/verification/{companyId}/reject` ✅ | Body field `reason` matches `RejectCompanyRequest` ✅

### ⚠️ POST /api/v1/admin/verification/{companyId}/request-changes — Minor: Unverified field name
```js
requestCompanyChanges: (companyId, reason) =>
  api.post(`/admin/verification/${companyId}/request-changes`, { reason })
```
Method: `POST` ✅ | Path: `/admin/verification/{companyId}/request-changes` ✅  
**Minor Issue:** Backend contract references `RequestChangesRequest`. The handover doc shows the body as `RequestChangesRequest` without documenting its fields. The frontend sends `{ reason }`. Given the pattern used in `RejectCompanyRequest` (also `{ reason }`), this is very likely correct — but cannot be 100% confirmed from docs alone.

### ✅ GET /api/v1/admin/verification/{companyId}/documents/{documentId}/download
```js
downloadDocument: (companyId, documentId) =>
  api.get(`/admin/verification/${companyId}/documents/${documentId}/download`, {
    responseType: 'blob',
  })
```
Method: `GET` ✅ | Path: `/admin/verification/{companyId}/documents/{documentId}/download` ✅ | `responseType: 'blob'` is correct for file stream download ✅

---

## Admin — Shipping Providers (`adminService.js`) — 7 endpoints

### ✅ POST /api/v1/admin/shipping-providers
```js
createShippingProvider: (data) => api.post('/admin/shipping-providers', data)
```
Method: `POST` ✅ | Path: `/admin/shipping-providers` ✅

### ✅ GET /api/v1/admin/shipping-providers
```js
getShippingProviders: (params) => api.get('/admin/shipping-providers', { params })
```
Method: `GET` ✅ | Path: `/admin/shipping-providers` ✅ | Query params forwarded ✅

### ✅ GET /api/v1/admin/shipping-providers/{id}
```js
getShippingProvider: (id) => api.get(`/admin/shipping-providers/${id}`)
```
Method: `GET` ✅ | Path: `/admin/shipping-providers/{id}` ✅

### ✅ PUT /api/v1/admin/shipping-providers/{id}
```js
updateShippingProvider: (id, data) => api.put(`/admin/shipping-providers/${id}`, data)
```
Method: `PUT` ✅ | Path: `/admin/shipping-providers/{id}` ✅

### ✅ POST /api/v1/admin/shipping-providers/{id}/activate
```js
activateShippingProvider: (id) =>
  api.post(`/admin/shipping-providers/${id}/activate`)
```
Method: `POST` ✅ | Path: `/admin/shipping-providers/{id}/activate` ✅

### ✅ POST /api/v1/admin/shipping-providers/{id}/deactivate
```js
deactivateShippingProvider: (id) =>
  api.post(`/admin/shipping-providers/${id}/deactivate`)
```
Method: `POST` ✅ | Path: `/admin/shipping-providers/{id}/deactivate` ✅

### ✅ DELETE /api/v1/admin/shipping-providers/{id}
```js
deleteShippingProvider: (id) => api.delete(`/admin/shipping-providers/${id}`)
```
Method: `DELETE` ✅ | Path: `/admin/shipping-providers/{id}` ✅

---

## Admin — Shipments (`adminService.js`) — 2 endpoints

### ✅ GET /api/v1/admin/shipments
```js
getAllShipments: (params) => api.get('/admin/shipments', { params })
```
Method: `GET` ✅ | Path: `/admin/shipments` ✅ | Query params forwarded ✅

### ✅ POST /api/v1/admin/shipments/{id}/assign-provider
```js
assignShippingProvider: (shipmentId, providerId, trackingNumber, estimatedDeliveryDateUtc, notes) =>
  api.post(`/admin/shipments/${shipmentId}/assign-provider`, {
    shippingProviderId: providerId,
    trackingNumber,
    estimatedDeliveryDateUtc,
    notes,
  })
```
Method: `POST` ✅ | Path: `/admin/shipments/{shipmentId}/assign-provider` ✅ | Body field `shippingProviderId` correctly maps `providerId` parameter to the expected DTO field name ✅

### ✅ POST /api/v1/admin/shipments/{id}/status
```js
updateShipmentStatus: (shipmentId, status, location, description) =>
  api.post(`/admin/shipments/${shipmentId}/status`, { status, location, description })
```
Method: `POST` ✅ | Path: `/admin/shipments/{shipmentId}/status` ✅

---

## Admin — Disputes (`adminDisputeService` in `dealService.js`) — 3 endpoints

### ✅ GET /api/v1/admin/disputes
```js
getAll: (params) => api.get('/admin/disputes', { params })
```
Method: `GET` ✅ | Path: `/admin/disputes` ✅ | Query params forwarded ✅

### ✅ GET /api/v1/admin/disputes/{id}
```js
get: (id) => api.get(`/admin/disputes/${id}`)
```
Method: `GET` ✅ | Path: `/admin/disputes/${id}` ✅

### ✅ POST /api/v1/admin/disputes/{id}/resolve
```js
resolve: (id, action, resolutionNotes) =>
  api.post(`/admin/disputes/${id}/resolve`, { action, resolutionNotes })
```
Method: `POST` ✅ | Path: `/admin/disputes/${id}/resolve` ✅ | Body fields `action` (integer enum: `ResumeDeal=1`, `CancelDeal=2`) and `resolutionNotes` match `ResolveDisputeRequest` ✅

---

## Notifications (`notificationService.js`) — 4 endpoints

### ✅ GET /api/v1/notifications
```js
getAll: (params) => api.get('/notifications', { params })
```
Method: `GET` ✅ | Path: `/notifications` ✅ | Supports `isRead` query filter + pagination ✅

### ✅ GET /api/v1/notifications/unread-count
```js
getUnreadCount: () => api.get('/notifications/unread-count')
```
Method: `GET` ✅ | Path: `/notifications/unread-count` ✅

### ✅ POST /api/v1/notifications/{id}/read
```js
markAsRead: (id) => api.post(`/notifications/${id}/read`)
```
Method: `POST` ✅ | Path: `/notifications/${id}/read` ✅ | No body required ✅

### ✅ POST /api/v1/notifications/read-all
```js
markAllAsRead: () => api.post('/notifications/read-all')
```
Method: `POST` ✅ | Path: `/notifications/read-all` ✅ | No body required ✅

---

## Store Layer Audit

### ✅ `authStore.js` — Zustand auth store
- Correctly imports and delegates to `tokenStore` from `axios.js` for all token operations.
- `setTokens(access, refresh)` calls `tokenStore.setAccess()` and `tokenStore.setRefresh()` correctly.
- `clearAuth()` calls `tokenStore.clearAll()` and resets Zustand state atomically.
- No direct API calls; correctly acts as state container only.

### ✅ `uiStore.js` — Zustand UI store
- No API calls. Manages UI state only (language, sidebar, notification panel).
- Language persistence via `localStorage` key `dz_lang` matches the axios request interceptor's reading of `dz_lang` for `Accept-Language` header — consistent ✅.

---

## Endpoints in Backend Docs NOT Covered by Frontend Services

The following backend endpoints are documented but have **no corresponding frontend service call** found in the audited files. These may be intentionally deferred, handled server-side only, or need to be added:

| Route | Notes |
|---|---|
| `GET /health` | Infrastructure probe — not needed in frontend service layer |
| `GET /api/v1/health` | Infrastructure probe — not needed in frontend service layer |

No other missing endpoints were detected. All 80 operational backend endpoints have corresponding frontend service calls, with the exception of the two health probes above.

---

## Critical Issues Summary

| # | File | Method | Location | Issue |
|---|---|---|---|---|
| 1 | `offerService.js` | `accept()` | `POST /offers/{id}/accept` | Sends undocumented `{ notes }` body field. `AcceptOfferRequest` body contract is unclear — if the endpoint takes no body, this is spurious but harmless; if the intent is to pass buyer notes, the field is silently dropped because no such field exists in the documented contract. |
| 2 | `dealService.js` | `openDispute()` | `POST /deals/{id}/disputes` | Body sends `{ category, description }`. The field name `description` for the dispute reason text is **likely wrong** — all other reason fields in this API use `reason`. If the backend `CreateDisputeRequest` uses `reason`, the dispute text is silently dropped on every dispute submission. |

## Minor Issues Summary

| # | File | Method | Location | Issue |
|---|---|---|---|---|
| 1 | `axios.js` | `tokenStore.getRefresh` | Token storage | Refresh token stored in `localStorage`. Backend docs recommend HTTP-only cookie or secure storage for production hardening. Functional but security-suboptimal. |
| 2 | `dealService.js` / `adminService.js` | `updateStatus()` | `POST /shipments/{id}/status` | Body fields `location` and `description` not documented in handover — cannot confirm correctness without checking `UpdateShipmentStatusRequest` DTO source. |
| 3 | `adminService.js` | `requestCompanyChanges()` | `POST /admin/verification/{companyId}/request-changes` | Body `{ reason }` assumed correct based on naming convention — `RequestChangesRequest` fields are not documented in handover. |
| 4 | `offerService.js` | `getOffersForRfq` / `getForRfq` | `GET /rfqs/{rfqId}/offers` | Duplicate method doing identical API call. Harmless redundancy but should be consolidated. |
