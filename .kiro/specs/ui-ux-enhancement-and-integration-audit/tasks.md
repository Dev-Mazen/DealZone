# Implementation Plan: UI/UX Enhancement and Integration Audit

## Overview

This implementation plan transforms the DealZone B2B marketplace frontend from a functional application into a premium, international-standard platform through comprehensive visual modernization, responsive optimization, and verified backend integration. The plan preserves all existing workflows while delivering a polished user experience across all devices (320px to 2560px+ viewports).

**Implementation Approach:**
- **Brand-First Implementation:** Establish design system foundation before component work
- **Progressive Enhancement:** Layer improvements without breaking existing functionality
- **Audit-Verified Integration:** Source code verification of API contracts (SQL Server unavailable locally)
- **Mobile-First Responsive:** Build responsive from smallest viewport up
- **Performance-Optimized:** Core Web Vitals compliance throughout

**Technology Stack:**
- React 19.3.1 + Vite 8.3.6 + React Router 7.18.5
- TypeScript for type safety
- Tailwind CSS 4.3.4 with custom design tokens
- Zustand 5.0.16 + TanStack Query 5.106.1
- Backend: .NET 10 Web API (84 REST endpoints)

## Tasks

- [x] 1. Set up design system foundation and configuration
  - Install and configure Cairo and Inter font families (Google Fonts CDN or local)
  - Configure Tailwind CSS with DealZone design tokens (colors, typography, spacing, shadows, border radii)
  - Create design token constants in `src/styles/tokens/` (colors.ts, typography.ts, spacing.ts)
  - Set up fluid typography using clamp() functions for responsive text scaling
  - Configure responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
  - _Requirements: 1.1, 1.2, 1.3, 1.7, 7.1, 7.12_

- [x] 2. Build primitive UI component library
  - [x] 2.1 Create Button component with variants (primary, secondary, outline, ghost, danger)
    - Implement size variations (sm, md, lg) with proper spacing
    - Add loading and disabled states with visual feedback
    - Implement hover and focus transitions (max 300ms duration)
    - Support left/right icon slots
    - _Requirements: 1.1, 1.3, 3.2, 11.4_

  - [x] 2.2 Create Input component with validation states
    - Support text, email, password, number, tel input types
    - Implement label, error message, and helper text display
    - Add left/right icon slots for visual enhancement
    - Style focus states with cyan ring and border color
    - Implement disabled and required visual states
    - _Requirements: 1.1, 1.3, 1.7, 3.2_

  - [x] 2.3 Create Card component with elevation variants
    - Implement default, elevated, and bordered variants
    - Add padding size options (none, sm, md, lg)
    - Implement hover elevation effect with shadow transition
    - Apply 8px border radius and soft shadows
    - _Requirements: 1.3, 1.4, 3.2_

  - [x] 2.4 Create Badge and Tag components
    - Implement status colors (success, warning, error, info)
    - Apply full border radius (9999px) for pill shape
    - Create size variants (sm, md, lg)
    - _Requirements: 1.1, 1.3_

  - [x] 2.5 Create Alert component for notifications
    - Support success, error, warning, and info types
    - Implement dismissible variant with close button
    - Add icon based on alert type
    - Apply appropriate status colors from design tokens
    - _Requirements: 1.1, 3.4_

  - [x] 2.6 Create Modal/Dialog component
    - Implement backdrop overlay with blur effect
    - Apply 12px border radius to modal container
    - Add smooth entrance/exit animations (300ms)
    - Implement focus trap for accessibility
    - Support custom header, body, and footer slots
    - _Requirements: 1.3, 3.1, 3.2_

  - [x] 2.7 Create Skeleton loading component
    - Implement text, circular, and rectangular variants
    - Add shimmer animation with linear gradient sweep
    - Support count prop for multiple skeleton lines
    - Ensure animation respects prefers-reduced-motion
    - _Requirements: 3.3, 3.7_

  - [x] 2.8 Create Spinner loading component
    - Implement size variants (sm, md, lg)
    - Apply brand colors (primary cyan)
    - Add smooth rotation animation
    - _Requirements: 3.3_

- [x] 3. Locate and integrate official DealZone logo asset
  - Search project repository for official logo files (SVG, PNG formats)
  - Document search locations: `/public`, `/src/assets`, `/frontend/assets`, root directories
  - If found, verify original proportions and colors are preserved
  - If not found, document missing asset location in integration report
  - Create logo component wrapper for consistent usage across application
  - _Requirements: 6.1, 6.2, 6.4, 6.6, 6.7_

- [x] 4. Implement animation and micro-interaction system
  - [-] 4.1 Create PageTransition wrapper component
    - Implement fade-in animation (opacity 0 → 1, 200ms)
    - Add slide-up animation (translateY 10px → 0, 200ms)
    - Respect prefers-reduced-motion media query
    - Apply to route-level page components
    - _Requirements: 3.5, 3.6, 3.7_

  - [-] 4.2 Create EntranceAnimation component with Intersection Observer
    - Implement direction variants (up, down, left, right, fade)
    - Add stagger delay support for sequential animations
    - Trigger animations when element enters viewport
    - Respect prefers-reduced-motion media query
    - Apply to content sections with stagger effects
    - _Requirements: 3.1, 3.7_

  - [x] 4.3 Implement hover state transitions on interactive elements
    - Apply smooth color transitions to buttons (300ms)
    - Add scale and shadow transitions to cards
    - Implement link hover states with color change
    - Add navigation item hover effects
    - _Requirements: 3.2, 3.6_

  - [x] 4.4 Implement success and error micro-interactions
    - Create success checkmark animation for form submissions
    - Create error shake animation for validation failures
    - Add toast notification entrance/exit animations
    - _Requirements: 3.4_

- [x] 5. Build composite components
  - [x] 5.1 Create responsive DataTable component
    - Implement desktop table view with proper headers and data cells
    - Transform to mobile card layout for viewports < 768px
    - Add sortable column headers with visual indicators
    - Implement loading state with skeleton loaders
    - Support pagination controls
    - _Requirements: 7.6, 7.9, 11.4_

  - [x] 5.2 Create SearchBar component
    - Implement debounced search input (300ms delay)
    - Add search icon and clear button
    - Style with border radius 8px and focus states
    - _Requirements: 1.3, 3.2_

  - [x] 5.3 Create FilterPanel component
    - Implement collapsible filter sections
    - Add checkbox and radio filter groups
    - Apply consistent spacing and typography
    - _Requirements: 1.2, 1.3_

  - [~] 5.4 Create FileUpload component
    - Support drag-and-drop file upload
    - Display file preview and validation status
    - Show upload progress indicator
    - Implement file type and size validation
    - Style with border dashed on drag-over state
    - _Requirements: 8.10, 10.9_

- [x] 6. Create responsive Container component
  - Implement size variants (sm, md, lg, xl, full) with max-width constraints
  - Apply centered alignment with mx-auto
  - Add responsive horizontal padding (px-4 sm:px-6 lg:px-8)
  - _Requirements: 7.1, 7.11_

- [x] 7. Design and implement desktop navigation bar
  - [x] 7.1 Create DesktopNav component structure
    - Implement fixed/sticky positioning (sticky top-0 z-50)
    - Apply primary navy background with white text
    - Set consistent height (h-16 = 64px)
    - Create flexbox layout for logo, nav items, and user menu
    - _Requirements: 4.1, 4.2, 4.10_

  - [x] 7.2 Integrate official DealZone logo in navigation
    - Place logo on left side with proper proportions
    - Make logo clickable linking to dashboard
    - Ensure logo colors match brand identity
    - _Requirements: 4.2, 6.3_

  - [x] 7.3 Implement primary navigation items with icons
    - Add navigation items: Dashboard, RFQs, Offers, Deals, Catalog, Profile
    - Include appropriate icons for each navigation item
    - Apply clear visual hierarchy with spacing
    - Implement active page indicator with visual distinction
    - _Requirements: 4.3, 4.5, 4.7_

  - [~] 7.4 Add hover states to navigation items
    - Implement smooth color transitions on hover
    - Apply hover background color change
    - Ensure transitions are 300ms or less
    - _Requirements: 4.4, 3.6_

  - [~] 7.5 Create user profile dropdown menu
    - Implement dropdown trigger with user name and avatar
    - Add dropdown panel with profile actions (settings, logout)
    - Implement proper z-index layering for dropdown
    - Add smooth dropdown entrance animation
    - _Requirements: 4.3, 4.6_

  - [~] 7.6 Add notification bell with unread count badge
    - Display notification icon in navigation
    - Show unread count as badge when > 0
    - Style badge with error red background and white text
    - Make bell clickable to notifications page
    - _Requirements: 4.3_

  - [~] 7.7 Preserve all existing navigation routes and functionality
    - Verify no navigation links are broken
    - Test routing to all pages
    - _Requirements: 4.9_

- [x] 8. Design and implement mobile navigation
  - [~] 8.1 Create MobileNav component with hamburger menu
    - Implement fixed top bar with logo, hamburger icon, notification bell
    - Add hamburger menu icon (three horizontal lines)
    - Apply mobile breakpoint display logic (< 768px)
    - _Requirements: 4.8_

  - [~] 8.2 Implement slide-out navigation drawer
    - Create overlay backdrop with bg-black/50 backdrop-blur-sm
    - Implement drawer panel with bg-white w-80
    - Add slide-in animation from left side
    - Implement drawer close on overlay click
    - _Requirements: 4.8_

  - [~] 8.3 Add navigation items to mobile drawer
    - Display full-width navigation buttons with icons
    - Add user profile section at top of drawer
    - Place logout button at bottom of drawer
    - Ensure touch-friendly tap targets (≥44x44px)
    - _Requirements: 4.8, 7.9_

- [~] 9. Checkpoint - Navigation and design system validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Conduct comprehensive backend API integration audit
  - [~] 10.1 Audit authentication API endpoints
    - Review `/api/v1/auth/register` endpoint: verify RegisterRequest matches backend DTO (email, password, fullName, phoneNumber)
    - Review `/api/v1/auth/confirm-email`: verify ConfirmEmailRequest structure
    - Review `/api/v1/auth/login`: verify LoginRequest and LoginResponse structures (accessToken, refreshToken, expiresIn, tokenType)
    - Review `/api/v1/auth/refresh`: verify RefreshTokenRequest and token rotation logic
    - Review `/api/v1/auth/logout`: verify refresh token inclusion in request
    - Review `/api/v1/auth/me`: verify UserProfileResponse structure matches backend (id, email, fullName, phoneNumber, isEmailConfirmed, isSystemAdmin, company object)
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [~] 10.2 Audit company management endpoints
    - Review `POST /api/v1/companies`: verify CreateCompanyRequest includes all required fields (legalName, tradeName, industrySector, city, governorate, taxIdNumber, commercialRegistrationNumber, corporateEmail, corporatePhone, addressLine1, addressLine2, postalCode)
    - Review `GET /api/v1/companies/me`: verify CompanyResponse structure
    - Review `PUT /api/v1/companies/me`: verify UpdateCompanyProfileRequest allowed fields
    - Review `GET /api/v1/companies/me/contact-details`: verify private data isolation
    - _Requirements: 8.1, 8.3, 8.4_

  - [~] 10.3 Audit verification document upload endpoint
    - Review `POST /api/v1/companies/me/verification-documents`: verify multipart/form-data handling
    - Verify documentType enum values (CommercialRegister=1, TaxCard=2, IndustrialRegister=3, QualityCertificate=4, Other=5)
    - Verify file upload supports PDF, JPEG, PNG with 10MB size limit
    - _Requirements: 8.10, 10.9_

  - [~] 10.4 Audit RFQ endpoints
    - Review `POST /api/v1/rfqs`: verify CreateRfqRequest structure (title, description, targetCategoryId, deliveryGovernorate, deliveryCity, deliveryAddress, closingDateUtc, requiredDeliveryDateUtc, targetBudget, currency, notes, publishImmediately, items array)
    - Review `GET /api/v1/rfqs`: verify RfqDiscoveryFilter query parameters
    - Review `GET /api/v1/rfqs/mine`: verify MyRfqFilter and status parameter
    - Review `GET /api/v1/rfqs/{id}`: verify RfqDetailResponse structure
    - Review `PUT /api/v1/rfqs/{id}`: verify UpdateRfqRequest
    - Review status transition endpoints: publish, close, cancel
    - Verify RfqStatus enum values (Draft=0, Published=1, Closed=2, Cancelled=3)
    - _Requirements: 8.1, 8.3, 8.4, 8.11_

  - [~] 10.5 Audit offer endpoints
    - Review `POST /api/v1/rfqs/{rfqId}/offers`: verify CreateOfferRequest structure (deliveryLeadTimeDays, shippingIncluded, paymentTerms, validityDateUtc, currency, notes, items)
    - Review `GET /api/v1/offers/{id}`: verify OfferDetailResponse structure
    - Review `GET /api/v1/offers/mine`: verify OfferFilter parameters
    - Review `POST /api/v1/offers/{id}/revise`: verify ReviseOfferRequest
    - Review `POST /api/v1/offers/{id}/accept`: verify AcceptOfferRequest
    - Review `POST /api/v1/offers/{id}/reject`: verify RejectOfferRequest (reason field)
    - Verify OfferStatus enum values (Submitted=0, UnderReview=1, Accepted=2, Rejected=3, Superseded=4, Withdrawn=5, Expired=6)
    - _Requirements: 8.1, 8.3, 8.4, 8.11_

  - [~] 10.6 Audit deal endpoints
    - Review `GET /api/v1/deals/mine`: verify DealStatus filter and pagination
    - Review `GET /api/v1/deals/{id}`: verify DealDetailResponse structure
    - Review `POST /api/v1/deals/{id}/confirm`: verify confirmation logic for both parties
    - Review `POST /api/v1/deals/{id}/start`: verify supplier-only access
    - Review `POST /api/v1/deals/{id}/complete`: verify completion logic
    - Review `POST /api/v1/deals/{id}/cancel`: verify CancelDealRequest (reason field)
    - Review `POST /api/v1/deals/{id}/disputes`: verify CreateDisputeRequest structure
    - Verify DealStatus enum values (AwaitingConfirmation=0, Confirmed=1, InProgress=2, Completed=3, Disputed=4, Cancelled=5)
    - _Requirements: 8.1, 8.3, 8.4, 8.11_

  - [~] 10.7 Audit catalog endpoints
    - Review `GET /api/v1/catalog/categories`: verify hierarchical category structure (parentCategoryId, code, nameAr, nameEn, subCategories)
    - Review `GET /api/v1/catalog/materials`: verify CatalogMaterialFilter parameters (categoryId, searchTerm, activeOnly, pageNumber, pageSize, sortBy, sortDescending)
    - Review `GET /api/v1/catalog/units`: verify unit of measure structure
    - _Requirements: 8.1, 8.3, 8.11_

  - [~] 10.8 Audit shipment and review endpoints
    - Review `POST /api/v1/deals/{dealId}/shipments`: verify CreateShipmentRequest
    - Review `GET /api/v1/shipments/{id}`: verify ShipmentDetailResponse and tracking events
    - Review `POST /api/v1/shipments/{id}/status`: verify UpdateShipmentStatusRequest
    - Review `POST /api/v1/deals/{dealId}/reviews`: verify CreateReviewRequest (rating 1-5, comment)
    - Review `GET /api/v1/companies/{companyId}/reviews`: verify public review response
    - _Requirements: 8.1, 8.3, 8.4_

  - [~] 10.9 Audit notification endpoints
    - Review `GET /api/v1/notifications`: verify pagination and isRead filter
    - Review `GET /api/v1/notifications/unread-count`: verify response structure
    - Review `POST /api/v1/notifications/{id}/read`: verify mark as read
    - Review `POST /api/v1/notifications/read-all`: verify bulk mark as read
    - _Requirements: 8.1, 8.3_

  - [~] 10.10 Verify API client configuration
    - Verify API base URL configuration using environment variables (VITE_API_BASE_URL)
    - Verify Axios instance timeout is set (30000ms default)
    - Verify Content-Type header is application/json
    - _Requirements: 8.2_

  - [~] 10.11 Verify authentication header implementation
    - Verify Authorization header includes Bearer token in all protected requests
    - Verify request interceptor attaches token from auth store
    - _Requirements: 8.5_

  - [~] 10.12 Verify token refresh logic and retry mechanism
    - Verify response interceptor handles 401 Unauthorized responses
    - Verify refresh token endpoint call on token expiration
    - Verify original request retry with new token after successful refresh
    - Verify auth store clear and redirect to login on refresh failure
    - Verify single retry to prevent infinite loops
    - _Requirements: 8.6_

  - [~] 10.13 Verify error handling for all HTTP status codes
    - Verify 400 Bad Request: extract validation errors from ProblemDetails.errors object
    - Verify 401 Unauthorized: trigger token refresh flow
    - Verify 403 Forbidden: display permission denied message without redirect to login
    - Verify 404 Not Found: display resource not found message
    - Verify 409 Conflict: display concurrency conflict message
    - Verify 500 Internal Server Error: display generic error with traceId
    - _Requirements: 8.7, 8.12_

  - [~] 10.14 Verify role-based access control implementation
    - Verify route guards check user.company.role against required roles
    - Verify Owner, Admin, ProcurementManager, SalesManager, Member role checks
    - Verify canPerformCommercialActivities flag prevents actions for unapproved companies
    - _Requirements: 8.8, 10.11, 10.12_

  - [~] 10.15 Verify form validation before API calls
    - Verify all required fields are validated client-side before submission
    - Verify email, phone, URL format validation
    - Verify date validation (closing date in future, etc.)
    - _Requirements: 8.9_

  - [~] 10.16 Verify pagination, filtering, and sorting parameters
    - Verify pageNumber, pageSize query string parameters
    - Verify sortBy, sortDescending query string parameters
    - Verify filter parameters match backend expectations
    - _Requirements: 8.11_

  - [~] 10.17 Create comprehensive integration audit report
    - Document all verified endpoints with ✅ status
    - Document issues found and fixed with ⚠️ status
    - Document potential runtime risks with ❌ status
    - Document items requiring backend runtime verification with 📝 status
    - Save report as `docs/integration_audit_report.md`
    - _Requirements: 8.13, 8.14, 8.15_

- [-] 11. Create TypeScript type definitions for all backend DTOs
  - Create `src/types/auth.types.ts` with UserProfile, CompanyMembership, LoginRequest, LoginResponse, RegisterRequest, VerificationStatus enum, CompanyRole enum
  - Create `src/types/company.types.ts` with CreateCompanyRequest, CompanyResponse, UpdateCompanyProfileRequest, DocumentType enum
  - Create `src/types/rfq.types.ts` with CreateRfqRequest, UpdateRfqRequest, RfqDetailResponse, RfqStatus enum
  - Create `src/types/offer.types.ts` with CreateOfferRequest, OfferDetailResponse, ReviseOfferRequest, AcceptOfferRequest, RejectOfferRequest, OfferStatus enum
  - Create `src/types/deal.types.ts` with DealDetailResponse, CancelDealRequest, CreateDisputeRequest, DealStatus enum
  - Create `src/types/catalog.types.ts` with CategoryDto, MaterialDto, UnitOfMeasureDto
  - Create `src/types/shipment.types.ts` with CreateShipmentRequest, ShipmentDetailResponse, UpdateShipmentStatusRequest
  - Create `src/types/review.types.ts` with CreateReviewRequest, ReviewResponse
  - Create `src/types/notification.types.ts` with NotificationResponse
  - Create `src/types/pagination.types.ts` with PagedResult<T>, PaginationParams
  - Create `src/types/error.types.ts` with ProblemDetails interface
  - _Requirements: 8.3, 8.4_

- [~] 12. Checkpoint - Backend integration audit validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement responsive design optimizations
  - [~] 13.1 Audit all pages for horizontal overflow issues
    - Check every page at 320px, 375px, 640px, 768px, 1024px, 1280px, 1920px, 2560px viewports
    - Fix any horizontal scrollbars or overflow
    - Ensure no elements break container boundaries
    - _Requirements: 7.2, 7.3_

  - [~] 13.2 Implement responsive typography scaling
    - Apply fluid typography using clamp() to all headings and body text
    - Verify text remains readable at all viewport sizes
    - Ensure line heights maintain proper readability
    - _Requirements: 7.4_

  - [~] 13.3 Convert rigid layouts to flexible layouts
    - Replace fixed widths with percentage, vw, or flex-based widths
    - Implement CSS Grid for complex layouts with auto-fit columns
    - Use Flexbox for one-dimensional flexible layouts
    - _Requirements: 7.5_

  - [~] 13.4 Implement responsive image scaling
    - Apply max-width: 100% and height: auto to all images
    - Use object-fit: cover for hero images
    - Ensure images never distort or overflow containers
    - _Requirements: 7.8_

  - [~] 13.5 Implement responsive chart scaling
    - Wrap chart components in responsive containers with percentage widths
    - Ensure charts adapt to parent container width
    - Test charts at all breakpoints without horizontal overflow
    - _Requirements: 7.7_

  - [~] 13.6 Implement mobile-optimized dashboard layouts
    - Transform multi-column dashboard layouts to single column on mobile
    - Stack cards vertically on small screens
    - Maintain proper spacing and padding at all breakpoints
    - _Requirements: 7.7_

  - [~] 13.7 Ensure touch-friendly interactive elements
    - Verify all buttons, links, and controls are ≥44x44px on mobile
    - Increase tap target sizes where necessary
    - Add adequate spacing between adjacent interactive elements
    - _Requirements: 7.9_

  - [~] 13.8 Test responsive behavior across all breakpoints
    - Test using Chrome DevTools device emulation
    - Verify iPhone SE (375px), iPhone 14 (390px), iPad Mini (768px), iPad Pro (1024px), Desktop HD (1920px)
    - Document any remaining issues or edge cases
    - _Requirements: 7.10_

- [x] 14. Source and integrate high-quality visual assets
  - [~] 14.1 Source B2B industrial images
    - Find images depicting: B2B trading, suppliers, manufacturers, procurement workflows, industrial products, raw materials
    - Prioritize images relevant to Egyptian industrial context where possible
    - Ensure images are high-resolution and professional quality
    - _Requirements: 2.1_

  - [~] 14.2 Optimize images for web delivery
    - Convert images to WebP format for better compression
    - Generate multiple resolutions for responsive images (small, medium, large)
    - Implement lazy loading with loading="lazy" attribute
    - Compress images without visible quality loss
    - _Requirements: 2.4_

  - [~] 14.3 Create or source illustration set
    - Find modern illustrations for: empty states, onboarding flows, feature explanations
    - Ensure illustration style is consistent across all visuals
    - Verify illustrations are relevant to B2B industrial context
    - _Requirements: 2.2, 2.6_

  - [~] 14.4 Integrate icon library
    - Install lucide-react or heroicons icon library
    - Create icon wrapper component for consistent sizing and colors
    - Apply brand colors to icons throughout interface
    - _Requirements: 2.3_

  - [~] 14.5 Apply visual assets to UI components
    - Replace generic placeholders with high-quality images
    - Add illustrations to empty states and onboarding screens
    - Integrate icons into navigation, buttons, and feature cards
    - _Requirements: 2.5, 2.7_

- [x] 15. Integrate charting library and implement analytics
  - [~] 15.1 Install and configure Recharts
    - Install recharts package: `npm install recharts`
    - Verify package compatibility with React 19.3.1
    - _Requirements: 5.3_

  - [~] 15.2 Create Chart wrapper component
    - Implement Chart component with line, bar, pie, area chart types
    - Apply DealZone brand colors to chart data series
    - Implement responsive container with percentage-based width
    - Add loading state with skeleton loader
    - Implement demo data badge when isDemoData prop is true
    - Style tooltips and legends to match design system
    - _Requirements: 5.1, 5.3, 5.8, 5.9_

  - [~] 15.3 Create DashboardStatsCard component
    - Display title, large numeric value, trend indicator
    - Add icon in brand color circle
    - Implement trend arrows and percentage change display
    - Apply green for positive trends, red for negative, gray for neutral
    - Add hover elevation effect
    - _Requirements: 5.1_

  - [~] 15.4 Implement dashboard analytics charts
    - Create chart for RFQ publication trends over time
    - Create chart for offer submission rates
    - Create chart for deal completion statistics
    - Create chart for category-wise transaction volumes
    - Use actual backend data where available via TanStack Query
    - _Requirements: 5.2, 5.4_

  - [~] 15.5 Clearly label demo data
    - Add "Sample Data" or "Demo Mode" badge to charts using mock data
    - Ensure users can distinguish between real and demo data
    - Never create misleading statistics
    - _Requirements: 5.5, 5.6_

- [x] 16. Reconstruct About page with accurate content
  - [~] 16.1 Review previous About page structure
    - Review https://deal-zone-two.vercel.app/about for information architecture guidance
    - Extract structural patterns (sections, content flow, hierarchy)
    - Do not copy outdated information
    - _Requirements: 9.3_

  - [~] 16.2 Extract accurate project information from documentation
    - Review backend/docs/API_HANDOVER.md for platform features and business model
    - Review backend/docs/BACKEND_READINESS.md for technical capabilities
    - Extract: what DealZone is, problems solved, platform vision, RFQ workflows, transaction processes
    - _Requirements: 9.4, 9.5_

  - [~] 16.3 Design About page sections
    - Create "What is DealZone" section explaining the platform
    - Create "How It Works" section explaining RFQ and reverse-bidding system
    - Create "Key Features" section highlighting platform capabilities
    - Create "For Buyers" section explaining buyer benefits
    - Create "For Suppliers" section explaining supplier benefits
    - Organize with clear hierarchy and spacing
    - _Requirements: 9.1, 9.2, 9.7_

  - [~] 16.4 Write compelling and accurate copy
    - Write clear, benefit-focused copy for each section
    - Explain B2B ecosystem structure and supplier/manufacturer relationships
    - Describe RFQ workflows, reverse bidding, and deal execution
    - Highlight transaction tracking and fulfillment features
    - Do not invent facts, partnerships, or achievements
    - _Requirements: 9.2, 9.8_

  - [~] 16.5 Add visual elements to About page
    - Integrate relevant images depicting B2B trading and industrial materials
    - Add illustrations for workflow explanations
    - Include icons for feature highlights
    - Implement entrance animations for sections
    - _Requirements: 9.6_

  - [~] 16.6 Ensure About page is fully responsive
    - Test About page at all breakpoints
    - Ensure images and illustrations scale properly
    - Verify text readability on mobile devices
    - Fix any layout issues
    - _Requirements: 9.10_

- [x] 17. Optimize registration and onboarding flow
  - [~] 17.1 Implement streamlined registration form
    - Create registration form with minimal fields: email, password, fullName, phoneNumber
    - Implement client-side validation with clear error messages
    - Style form with design system components
    - Add loading state during submission
    - Display success message and redirect to email confirmation prompt
    - _Requirements: 10.1_

  - [~] 17.2 Create post-registration onboarding wizard
    - Design multi-step onboarding flow with progress indicator
    - Create step 1: Role selection (Buyer or Supplier)
    - Create step 2: Company information collection (legalName, tradeName, industrySector)
    - Create step 3: Company details entry (city, governorate, addresses, tax numbers)
    - Create step 4: Verification document uploads (Commercial Register, Tax Card)
    - Create step 5: Submission for review confirmation
    - _Requirements: 10.2, 10.3_

  - [~] 17.3 Implement role selection logic
    - Create role selection UI with clear buyer vs supplier options
    - Store role selection according to backend Company and CompanyRole structures
    - Verify role selection aligns with backend enum values (Owner=1, Admin=2, ProcurementManager=3, SalesManager=4, Member=5)
    - _Requirements: 10.4, 10.5_

  - [~] 17.4 Create onboarding progress tracking
    - Implement progress indicator showing current step (1 of 5, 2 of 5, etc.)
    - Allow users to navigate back to previous steps
    - Persist onboarding data in form state or local storage
    - Allow users to resume incomplete onboarding
    - _Requirements: 10.6_

  - [~] 17.5 Create company verification status dashboard
    - Display current verification status (Pending, UnderReview, Approved, Rejected, ChangesRequired)
    - Show appropriate status messages for each state
    - Display list of uploaded documents with upload dates
    - Show admin feedback if status is Rejected or ChangesRequired
    - _Requirements: 10.8, 10.10_

  - [~] 17.6 Implement authorization guards for commercial activities
    - Prevent creating RFQs if company verification status is not Approved
    - Prevent submitting offers if company verification status is not Approved
    - Display "Verification Required" message when user attempts unauthorized actions
    - Verify canPerformCommercialActivities flag before showing commercial features
    - _Requirements: 10.7_

  - [~] 17.7 Implement role-based dashboard access guards
    - Create route guard preventing buyers from accessing supplier-specific dashboards
    - Create route guard preventing suppliers from accessing buyer-specific dashboards
    - Redirect unauthorized access attempts to appropriate dashboard or access denied page
    - _Requirements: 10.11_

  - [~] 17.8 Verify onboarding matches backend workflows
    - Test complete registration flow end-to-end
    - Verify company creation request structure matches backend expectations
    - Verify document upload multipart/form-data format
    - Verify verification submission triggers status change
    - _Requirements: 10.12_

- [x] 18. Apply brand identity throughout application
  - [~] 18.1 Audit all pages for color palette compliance
    - Review every page and component for color usage
    - Replace any non-brand colors with official palette colors
    - Verify primary colors (Navy #06245B, Cyan #00D9F5, Growth Blue #1266D6)
    - Verify secondary colors (Ice Blue #EAF4FF, Cloud Gray #F4F7FB, Slate Gray #64748B)
    - Verify status colors (Success #10B981, Warning #F59E0B, Error #EF4444, Info #3B82F6)
    - _Requirements: 1.1, 1.6_

  - [~] 18.2 Verify 60-30-10 color distribution rule
    - Ensure 60% Canvas/White backgrounds across pages
    - Ensure 30% Brand Navy/Slate text and structure elements
    - Ensure 10% Cyan/Action accents for CTAs and highlights
    - _Requirements: 1.5_

  - [~] 18.3 Ensure official logo usage consistency
    - Verify logo appears in: navigation bar, footer, login page, registration page, loading screens, dashboards
    - Ensure logo proportions and colors are preserved everywhere
    - Replace any recreated or approximate logo versions
    - _Requirements: 6.3, 6.4_

  - [~] 18.4 Verify typography consistency
    - Ensure Cairo font is used for Arabic text
    - Ensure Inter font is used for Latin text
    - Verify typography scale compliance (H1 Bold 32px, H2 Semibold 24px, H3 Semibold 20px, Body Regular 16px)
    - _Requirements: 1.2_

  - [~] 18.5 Verify visual hierarchy and spacing
    - Ensure proper spacing between sections and components
    - Verify typography weights create clear hierarchy
    - Test color contrast meets WCAG AA standards
    - _Requirements: 1.7_

- [x] 19. Implement performance optimizations
  - [~] 19.1 Implement route-based code splitting
    - Apply React.lazy() to all route-level page components
    - Wrap routes in Suspense with PageSkeleton fallback
    - Verify bundle splits per route in production build
    - _Requirements: 11.3_

  - [~] 19.2 Implement image lazy loading
    - Add loading="lazy" attribute to all images
    - Implement Intersection Observer for images above the fold
    - Verify images load progressively as user scrolls
    - _Requirements: 11.2_

  - [~] 19.3 Optimize React component re-renders
    - Apply React.memo to expensive components (DataTable, Chart)
    - Use useMemo for expensive computations (sorting, filtering)
    - Use useCallback for callbacks passed to child components
    - _Requirements: 11.4_

  - [~] 19.4 Configure manual chunks for vendor libraries
    - Split React core libraries (react, react-dom, react-router-dom) into separate chunk
    - Split data libraries (axios, @tanstack/react-query) into separate chunk
    - Split UI libraries (lucide-react, recharts) into separate chunk
    - Configure in vite.config.js rollupOptions
    - _Requirements: 11.5_

  - [~] 19.5 Audit and remove unused dependencies
    - Review package.json for unused packages
    - Remove any packages not actively imported in code
    - Verify bundle size reduction after cleanup
    - _Requirements: 11.5_

  - [~] 19.6 Follow existing project conventions
    - Match file structure patterns used in existing codebase
    - Follow naming conventions for files and components
    - Apply code style consistent with existing code
    - Avoid duplicating logic by extracting to shared utilities
    - _Requirements: 11.6, 11.7, 11.8_

- [x] 20. Run comprehensive testing and validation
  - [~] 20.1 Run Lighthouse performance audit
    - Run Lighthouse on key pages: Home, Dashboard, RFQ List, Deal Details
    - Verify Largest Contentful Paint (LCP) < 2.5s
    - Verify First Input Delay (FID) < 100ms
    - Verify Cumulative Layout Shift (CLS) < 0.1
    - Document performance scores and any issues
    - _Requirements: 11.1_

  - [~] 20.2 Test responsive design on all target devices
    - Test on iPhone SE (375px width)
    - Test on iPhone 14 (390px width)
    - Test on iPad Mini (768px width)
    - Test on iPad Pro (1024px width)
    - Test on Desktop HD (1920px width)
    - Test on large Desktop (2560px width)
    - Document any layout issues or overflow problems
    - _Requirements: 7.10_

  - [~] 20.3 Test animation system
    - Verify page transitions work smoothly
    - Verify scroll-triggered entrance animations trigger correctly
    - Verify hover states on all interactive elements
    - Verify skeleton loaders appear during data loading
    - Test with prefers-reduced-motion enabled - verify animations are disabled
    - _Requirements: 3.7, 3.8_

  - [~] 20.4 Test navigation functionality
    - Verify desktop navigation displays correctly and all links work
    - Verify mobile navigation hamburger menu opens/closes correctly
    - Verify mobile drawer slide animation works smoothly
    - Verify active page indicator shows on correct navigation item
    - Verify notification bell displays unread count
    - _Requirements: 4.9, 4.10_

  - [~] 20.5 Verify visual design compliance
    - Audit 10 random pages for brand color compliance
    - Verify official logo appears correctly on all pages where required
    - Verify typography scale is applied consistently
    - Verify border radii and shadows match design tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3_

  - [~] 20.6 Test API integration with backend (if available)
    - If backend is running locally, test authentication flow end-to-end
    - Test company registration and verification document upload
    - Test RFQ creation and discovery
    - Test offer submission and acceptance
    - Document any runtime integration issues discovered
    - _Requirements: 8.13, 8.14_

  - [~] 20.7 Run existing test suites
    - Run all existing unit tests: `npm run test`
    - Run all existing integration tests if available
    - Fix any test failures introduced by UI changes
    - Verify no new ESLint warnings or errors
    - _Requirements: 11.10_

  - [~] 20.8 Validate accessibility
    - Run axe DevTools accessibility scan on key pages
    - Verify keyboard navigation works on all interactive elements
    - Verify focus indicators are visible on all focusable elements
    - Verify ARIA labels exist for icon-only buttons
    - Test screen reader compatibility on critical flows
    - _Requirements: 1.7_

- [x] 21. Final checkpoint and documentation
  - [~] 21.1 Create integration audit report documentation
    - Compile integration_audit_report.md with all findings
    - Document all verified endpoints with ✅ status
    - Document all issues found and fixed with ⚠️ status
    - Document potential runtime risks with ❌ status
    - Document items requiring backend runtime testing with 📝 status
    - _Requirements: 8.13_

  - [~] 21.2 Document performance metrics
    - Record Lighthouse scores for key pages
    - Document bundle sizes (total and per chunk)
    - Record Core Web Vitals measurements
    - Document any performance optimization recommendations
    - _Requirements: 11.1_

  - [~] 21.3 Document responsive design validation
    - Create checklist of tested devices and viewports
    - Document any remaining responsive design edge cases
    - Provide screenshots of key pages at different breakpoints
    - _Requirements: 7.10_

  - [~] 21.4 Create visual design compliance report
    - Document logo usage across application
    - Provide color palette usage summary
    - Document typography scale implementation
    - Include screenshots demonstrating brand identity compliance
    - _Requirements: 1.1, 1.2, 6.2_

  - [~] 21.5 Final user validation checkpoint
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- **SQL Server Constraint:** Backend database is unavailable locally; API integration verification must be performed through source-code audit only, comparing frontend code against backend documentation (API_HANDOVER.md)
- **No Fake Data:** Do not create misleading analytics or statistics; clearly label demo data with badges
- **Brand Identity Priority:** Official DealZone logo and color palette must be used exactly as specified; no approximations or recreations
- **Responsive-First:** All components must be responsive from 320px to 2560px+ viewports; test thoroughly at all breakpoints
- **Performance Budget:** Maintain Core Web Vitals compliance (LCP < 2.5s, FID < 100ms, CLS < 0.1) throughout implementation
- **Existing Functionality Preservation:** Do not break any existing workflows; all current features must continue working
- **Accessibility:** Implement WCAG AA compliance; respect prefers-reduced-motion; ensure keyboard navigation
- **Testing Optional Tasks:** Testing and validation tasks in section 20 are marked for thoroughness but can be prioritized based on project timeline
- **Documentation Tasks:** Final documentation tasks in section 21 ensure knowledge transfer and future maintainability

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "3"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "6"]
    },
    {
      "id": 2,
      "tasks": ["2.7", "2.8", "4.1", "4.2", "7.1", "11"]
    },
    {
      "id": 3,
      "tasks": ["4.3", "4.4", "5.1", "5.2", "5.3", "7.2", "7.3"]
    },
    {
      "id": 4,
      "tasks": ["5.4", "7.4", "7.5", "7.6", "7.7"]
    },
    {
      "id": 5,
      "tasks": ["8.1", "8.2"]
    },
    {
      "id": 6,
      "tasks": ["8.3"]
    },
    {
      "id": 7,
      "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9"]
    },
    {
      "id": 8,
      "tasks": ["10.10", "10.11", "10.12", "10.13", "10.14", "10.15", "10.16"]
    },
    {
      "id": 9,
      "tasks": ["10.17"]
    },
    {
      "id": 10,
      "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"]
    },
    {
      "id": 11,
      "tasks": ["13.7", "13.8", "14.1", "14.2", "14.3", "14.4"]
    },
    {
      "id": 12,
      "tasks": ["14.5", "15.1"]
    },
    {
      "id": 13,
      "tasks": ["15.2", "15.3"]
    },
    {
      "id": 14,
      "tasks": ["15.4", "15.5", "16.1", "16.2"]
    },
    {
      "id": 15,
      "tasks": ["16.3", "16.4"]
    },
    {
      "id": 16,
      "tasks": ["16.5", "16.6", "17.1"]
    },
    {
      "id": 17,
      "tasks": ["17.2", "17.3", "17.4"]
    },
    {
      "id": 18,
      "tasks": ["17.5", "17.6", "17.7", "17.8"]
    },
    {
      "id": 19,
      "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5"]
    },
    {
      "id": 20,
      "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6"]
    },
    {
      "id": 21,
      "tasks": ["20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8"]
    },
    {
      "id": 22,
      "tasks": ["21.1", "21.2", "21.3", "21.4", "21.5"]
    }
  ]
}
```
