# Requirements Document

## Introduction

DealZone is an Egyptian B2B industrial raw materials marketplace connecting verified buyers and suppliers through structured RFQ workflows, reverse bidding, binding commercial deals, and fulfillment tracking. This feature specification addresses comprehensive UI/UX enhancement, visual modernization, backend integration audit, responsive design optimization, and product experience refinement to transform DealZone into a premium, international-standard B2B SaaS platform.

The enhancement must preserve all existing backend integrations and functional workflows while delivering a visually engaging, interactive, and professionally polished user experience across all devices and user journeys.

## Glossary

- **System**: The DealZone web application frontend (React-based SPA)
- **Backend_API**: The DealZone .NET 10 RESTful Web API
- **User**: Any authenticated individual accessing the platform (Buyer, Supplier, or SystemAdmin)
- **Buyer_Company**: An approved company entity with procurement permissions
- **Supplier_Company**: An approved company entity with sales and offer submission permissions
- **SystemAdmin**: Platform administrator with governance rights
- **RFQ**: Request for Quotation - structured procurement request published by buyers
- **Offer**: Structured bid submitted by suppliers in response to RFQs
- **Deal**: Binding commercial contract created upon offer acceptance
- **Verification_Status**: Company compliance state (Pending, UnderReview, Approved, Rejected, ChangesRequired)
- **Navigation_Bar**: Primary horizontal navigation component present on all authenticated pages
- **Responsive_Design**: Layout adaptation across all device sizes (320px to 2560px+ viewport widths)
- **API_Integration**: Frontend data-fetching and mutation operations against Backend_API endpoints
- **Logo_Asset**: Official DealZone brand identity visual mark
- **Chart_Component**: Data visualization element (line, bar, pie, area charts)
- **Animation**: Visual motion effect (transitions, entrance effects, micro-interactions)
- **About_Page**: Public marketing page communicating platform value proposition and business model
- **Registration_Flow**: User account creation and company onboarding workflow
- **Onboarding_Process**: Post-registration company profile completion and document verification submission

## Requirements

### Requirement 1: Visual Design System Enhancement

**User Story:** As a platform user, I want DealZone to have a modern, professional, and visually engaging appearance, so that the platform feels trustworthy, premium, and competitive with international B2B SaaS platforms.

#### Acceptance Criteria

1. THE System SHALL implement the official DealZone color palette throughout all UI components (Primary: #06245B Navy, #00D9F5 Cyan, #1266D6 Growth Blue; Secondary: #EAF4FF Ice Blue, #F4F7FB Cloud Gray, #64748B Slate Gray; Status: #10B981 Success, #F59E0B Warning, #EF4444 Error, #3B82F6 Info)
2. THE System SHALL use Cairo font family for Arabic text and Inter font family for Latin text with the specified typography scale (H1: Bold 32px/40px, H2: Semibold 24px/32px, H3: Semibold 20px/28px, Body: Regular 16px/24px)
3. THE System SHALL apply consistent border radii (8px for inputs/cards, 12px for modals/containers, 9999px for pill buttons/badges)
4. THE System SHALL implement soft diffuse shadows for elevation (0 4px 20px -2px rgba(6, 36, 91, 0.08))
5. THE System SHALL maintain 60-30-10 color distribution rule (60% Canvas/White backgrounds, 30% Brand Navy/Slate text/structure, 10% Cyan/Action accents)
6. THE System SHALL replace all generic or incorrect color schemes with the official brand identity colors
7. THE System SHALL ensure visual hierarchy through proper spacing, typography weights, and color contrast meeting WCAG AA standards

### Requirement 2: High-Quality Visual Assets Integration

**User Story:** As a platform user, I want to see relevant, professional images and visual elements throughout the platform, so that the experience feels polished, engaging, and contextually appropriate for B2B industrial procurement.

#### Acceptance Criteria

1. WHEN displaying marketing sections, THE System SHALL use high-quality images depicting B2B trading, suppliers, manufacturers, procurement workflows, industrial products, and raw materials
2. THE System SHALL implement modern illustrations for empty states, onboarding flows, and feature explanations
3. THE System SHALL use appropriate vector icons throughout the interface for actions, categories, statuses, and navigation items
4. THE System SHALL optimize all image assets for web delivery (WebP format, appropriate resolutions, lazy loading)
5. THE System SHALL NOT use generic stock photos that appear unrelated to industrial B2B procurement
6. THE System SHALL maintain consistent illustration style and icon design language across all visual assets
7. WHERE images cannot be sourced, THE System SHALL use tasteful gradients, geometric patterns, or color blocks rather than low-quality placeholders

### Requirement 3: Animation and Micro-Interaction System

**User Story:** As a platform user, I want smooth, purposeful animations and interactive feedback, so that the interface feels responsive, modern, and provides clear visual cues for my actions.

#### Acceptance Criteria

1. THE System SHALL implement scroll-triggered entrance animations for content sections with stagger effects
2. WHEN hovering over interactive elements, THE System SHALL display smooth state transitions (buttons, cards, links, navigation items)
3. WHEN data loads, THE System SHALL display skeleton loading states rather than blank screens or spinners
4. WHEN user actions succeed or fail, THE System SHALL provide immediate visual feedback (success animations, error shakes, confirmation checkmarks)
5. THE System SHALL implement smooth page transitions between route changes
6. THE System SHALL use CSS transitions and transforms for animations with maximum 300ms duration
7. THE System SHALL respect prefers-reduced-motion media query and disable animations when user preference indicates motion sensitivity
8. THE System SHALL ensure animations do not negatively impact page performance or Core Web Vitals metrics

### Requirement 4: Navigation Bar Complete Redesign

**User Story:** As a platform user, I want an intuitive, visually attractive, and highly functional navigation bar, so that I can easily access all platform features across any device.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL feature a complete visual redesign with modern layout, improved spacing, and professional typography
2. THE Navigation_Bar SHALL display the official DealZone Logo_Asset on the left side with proper proportions and brand colors
3. THE Navigation_Bar SHALL implement clear visual hierarchy with primary navigation items, user profile menu, and notification badge
4. WHEN hovering over navigation items, THE Navigation_Bar SHALL display smooth interactive states with color transitions
5. THE Navigation_Bar SHALL include appropriate icons for each navigation item (Dashboard, RFQs, Offers, Deals, Catalog, Profile)
6. THE Navigation_Bar SHALL implement smooth dropdown menus for nested navigation with proper z-index layering
7. THE Navigation_Bar SHALL display a clear active page indicator with visual distinction from inactive items
8. ON mobile devices (viewport width < 768px), THE Navigation_Bar SHALL transform into a mobile-optimized menu with hamburger icon and slide-out drawer
9. THE Navigation_Bar SHALL preserve all existing navigation routes and functionality without breaking links
10. THE Navigation_Bar SHALL maintain consistent height and positioning across all pages with fixed or sticky behavior

### Requirement 5: Data Visualization and Analytics Integration

**User Story:** As a platform user, I want to see meaningful charts, statistics, and visual data representations, so that I can understand platform activity, business metrics, and transaction trends at a glance.

#### Acceptance Criteria

1. WHEN displaying dashboard pages, THE System SHALL render Chart_Components for platform statistics, KPIs, and activity metrics
2. THE System SHALL implement charts for: RFQ publication trends, offer submission rates, deal completion statistics, company growth indicators, category-wise transaction volumes
3. THE System SHALL use a lightweight, well-maintained charting library (Recharts, Chart.js, or ApexCharts) compatible with React
4. WHEN Chart_Components display data, THE System SHALL use actual Backend_API data where available
5. WHERE actual data is unavailable, THE System SHALL use clearly labeled demo or mock data with visual indicators stating "Sample Data" or "Demo Mode"
6. THE System SHALL NOT create fake analytics or misleading statistics that misrepresent actual platform activity
7. Chart_Components SHALL support responsive layouts and adapt to different screen sizes without horizontal overflow
8. Chart_Components SHALL include tooltips, legends, axis labels, and loading states
9. Chart_Components SHALL maintain visual consistency with the DealZone color palette (using brand colors for data series)
10. THE System SHALL implement proper error boundaries to handle chart rendering failures gracefully

### Requirement 6: Official Logo Asset Implementation

**User Story:** As a platform stakeholder, I want the exact official DealZone logo displayed consistently throughout the platform, so that brand identity is preserved and professionally represented.

#### Acceptance Criteria

1. THE System SHALL locate and use the original official DealZone Logo_Asset files from the project repository
2. THE System SHALL replace every incorrect, recreated, or approximated logo version throughout the website
3. THE System SHALL display the official Logo_Asset in: Navigation_Bar, footer, authentication pages (login, registration), loading screens, dashboards, email templates
4. THE System SHALL preserve original logo proportions, colors, and visual appearance without modifications
5. THE System SHALL NOT recreate, redesign, approximate, or generate similar logo variations
6. THE System SHALL use appropriate logo file formats (SVG for scalability, PNG with transparency where necessary)
7. IF the original Logo_Asset cannot be located in the repository, THE System SHALL report the missing asset and document the search locations attempted

### Requirement 7: Comprehensive Responsive Design Optimization

**User Story:** As a platform user on any device, I want every page and component to function perfectly and look professional on my screen size, so that I can access DealZone seamlessly from desktops, tablets, or smartphones.

#### Acceptance Criteria

1. THE System SHALL support responsive layouts for all viewport widths from 320px (small smartphones) to 2560px+ (large desktop monitors)
2. ON all pages, THE System SHALL prevent horizontal overflow and horizontal scrollbars
3. THE System SHALL ensure no layout breakage, overlapping elements, or clipped text/images at any viewport size
4. THE System SHALL implement responsive typography with fluid sizing using clamp() or media queries
5. THE System SHALL use Flexbox and CSS Grid for flexible, adaptive layouts
6. THE System SHALL make data tables responsive with horizontal scrolling containers or mobile-optimized card layouts
7. THE System SHALL implement responsive dashboard layouts with column stacking on smaller screens
8. THE System SHALL ensure charts and images scale proportionally without distortion
9. ON mobile devices (viewport width < 768px), THE System SHALL provide touch-friendly interactive elements with minimum 44x44px tap targets
10. THE System SHALL test responsive behavior using Chrome DevTools device emulation for: iPhone SE (375px), iPhone 14 (390px), iPad Mini (768px), iPad Pro (1024px), Desktop HD (1920px)
11. THE System SHALL maintain consistent spacing, padding, and margins across all breakpoints
12. THE System SHALL implement appropriate breakpoints at 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)

### Requirement 8: Backend API Integration Audit and Verification

**User Story:** As a development team member, I want comprehensive verification that frontend API integrations match backend contracts, so that the application will function correctly when deployed with the live database.

#### Acceptance Criteria

1. THE System SHALL audit all API endpoint calls against the Backend_API specification documented in backend/docs/API_HANDOVER.md
2. THE System SHALL verify API base URL configuration matches environment variables and deployment targets
3. THE System SHALL verify all request payload structures match Backend_API DTO contracts (property names, data types, required fields)
4. THE System SHALL verify all response handling matches Backend_API response DTOs (property names, nullable fields, enum values)
5. THE System SHALL verify authentication header implementation includes Bearer token in Authorization header
6. THE System SHALL verify token refresh logic handles 401 responses with proper token rotation and retry
7. THE System SHALL verify Axios interceptors implement proper error handling for all HTTP status codes (400, 401, 403, 404, 409, 500)
8. THE System SHALL verify role-based access control logic matches Backend_API authorization rules (Owner, Admin, ProcurementManager, SalesManager, Member)
9. THE System SHALL verify form submissions include all required fields and proper validation before API calls
10. THE System SHALL verify file upload implementations match Backend_API multipart/form-data requirements (document types, size limits, file extensions)
11. THE System SHALL verify pagination, filtering, and sorting parameters match Backend_API query string formats
12. THE System SHALL verify error response handling matches RFC 7807 ProblemDetails structure (type, title, status, detail, traceId, errors object)
13. THE System SHALL document all verified integrations, discovered issues, issues fixed, potential runtime risks, and items requiring Backend_API runtime verification in a detailed integration report
14. THE System SHALL NOT introduce fake API integrations, mock data replacements, or hardcoded responses during the audit
15. THE System SHALL NOT modify Backend_API endpoint structures or payloads without explicit backend contract verification

### Requirement 9: About Page Complete Reconstruction

**User Story:** As a potential platform user or stakeholder, I want a comprehensive, modern About page that clearly explains what DealZone is and how it works, so that I can understand the platform's value proposition and business model.

#### Acceptance Criteria

1. THE About_Page SHALL communicate: what DealZone is, the problem being solved, platform vision and mission, how the platform works
2. THE About_Page SHALL explain: B2B ecosystem structure, supplier/manufacturer relationships, RFQ and reverse-bidding system, transaction workflows, key features and competitive advantages
3. THE About_Page SHALL reference content and structure from the previous About page (https://deal-zone-two.vercel.app/about) for information architecture guidance
4. THE About_Page SHALL update all content according to the latest DealZone project concept documented in backend/docs/API_HANDOVER.md and backend/docs/BACKEND_READINESS.md
5. THE About_Page SHALL use current project information as the primary authoritative source
6. THE About_Page SHALL include relevant images, illustrations, icons, and animations for visual engagement
7. THE About_Page SHALL organize content into well-structured sections with clear hierarchy and spacing
8. THE About_Page SHALL NOT invent company facts, partnerships, achievements, statistics, or features not verified in official project documentation
9. THE About_Page SHALL maintain consistent visual design with the overall platform design system
10. THE About_Page SHALL be fully responsive and function perfectly on all device sizes

### Requirement 10: Registration and Onboarding Flow Optimization

**User Story:** As a new user, I want a clear, simple, and guided registration and onboarding process, so that I can quickly create an account, complete my company profile, and start using the platform with the appropriate permissions.

#### Acceptance Criteria

1. THE System SHALL implement basic user registration with minimal required fields (email, password, full name, phone number)
2. AFTER successful registration, THE System SHALL redirect the user to a structured post-registration onboarding flow
3. THE Onboarding_Process SHALL include steps: role selection (Buyer or Supplier), company information collection, company details entry, verification document uploads, submission for review
4. WHEN selecting role during onboarding, THE System SHALL store the selection according to Backend_API company and role structures
5. THE System SHALL validate that role selection and company type align with Backend_API Company entity and CompanyRole enum values
6. THE System SHALL track onboarding completion status and allow users to resume incomplete onboarding
7. THE System SHALL prevent users from accessing unauthorized features until onboarding is complete and company Verification_Status is Approved
8. WHEN Verification_Status is Pending or UnderReview, THE System SHALL display appropriate status messages and prevent commercial activities (creating RFQs, submitting offers)
9. THE System SHALL ensure document upload functionality connects to Backend_API endpoint POST /api/v1/companies/me/verification-documents with proper multipart/form-data handling
10. THE System SHALL display clear verification status representations for: Pending, UnderReview, Approved, Rejected, ChangesRequired states
11. THE System SHALL implement proper authorization guards preventing access to buyer-specific dashboards for suppliers and supplier-specific dashboards for buyers
12. THE System SHALL validate that the registration and onboarding flow matches Backend_API authentication, company registration, and verification workflows without conflicts

### Requirement 11: Performance Optimization and Code Quality

**User Story:** As a platform user, I want fast page loads, smooth interactions, and excellent performance, so that I can work efficiently without delays or frustration.

#### Acceptance Criteria

1. THE System SHALL maintain Core Web Vitals scores: Largest Contentful Paint (LCP) < 2.5s, First Input Delay (FID) < 100ms, Cumulative Layout Shift (CLS) < 0.1
2. THE System SHALL implement lazy loading for images using native loading="lazy" attribute or React lazy loading libraries
3. THE System SHALL implement code splitting for route-based chunks to reduce initial bundle size
4. THE System SHALL optimize React component re-renders using React.memo, useMemo, and useCallback where appropriate
5. THE System SHALL avoid excessive third-party dependencies that inflate bundle size
6. THE System SHALL maintain reusable component architecture following DRY principles
7. THE System SHALL follow existing project conventions for file structure, naming, and code style
8. THE System SHALL avoid duplicated code by extracting common logic into shared utilities and hooks
9. THE System SHALL respect existing technology stack versions without introducing breaking changes or unnecessary migrations
10. THE System SHALL pass existing linting rules and automated tests without introducing new warnings or errors

## Parser and Serializer Requirements

THE System does not include custom parser or serializer implementations requiring round-trip testing. All data serialization is handled by standard JSON serialization libraries (Axios for HTTP requests, native JSON.parse/JSON.stringify for storage operations).

## Integration and Infrastructure Requirements

THE System integrates exclusively with the Backend_API RESTful HTTP endpoints documented in backend/docs/API_HANDOVER.md. No additional external services, databases, or APIs are required for this enhancement feature.
