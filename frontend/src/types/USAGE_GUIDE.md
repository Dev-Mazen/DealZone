# TypeScript Types Usage Guide for JavaScript Projects

This project uses JavaScript with JSConfig, but the TypeScript type definitions provide valuable type safety and IDE support through JSDoc comments.

## 🎯 Why TypeScript Types in a JavaScript Project?

1. **IDE IntelliSense**: Get autocompletion and type hints in VS Code
2. **Type Safety**: Catch type errors during development
3. **Documentation**: Self-documenting API contracts
4. **Migration Ready**: Easy path to full TypeScript if needed

## 📖 Using Types with JSDoc

### Method 1: Import Types in JSDoc Comments

```javascript
/**
 * @typedef {import('@/types').UserProfileResponse} UserProfileResponse
 * @typedef {import('@/types').RfqDetailResponse} RfqDetailResponse
 * @typedef {import('@/types').PagedResult} PagedResult
 */

/**
 * Fetch current user profile
 * @returns {Promise<UserProfileResponse>}
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

/**
 * Fetch RFQ by ID
 * @param {string} rfqId - The RFQ ID (GUID)
 * @returns {Promise<RfqDetailResponse>}
 */
export const getRfqById = async (rfqId) => {
  const response = await apiClient.get(`/rfqs/${rfqId}`);
  return response.data;
};

/**
 * Fetch paginated RFQs
 * @param {import('@/types').MyRfqFilter} filter - Filter parameters
 * @returns {Promise<PagedResult<import('@/types').RfqSummaryResponse>>}
 */
export const getMyRfqs = async (filter) => {
  const response = await apiClient.get('/rfqs/mine', { params: filter });
  return response.data;
};
```

### Method 2: Type Parameters

```javascript
/**
 * @param {import('@/types').CreateRfqRequest} data
 * @returns {Promise<import('@/types').RfqDetailResponse>}
 */
export const createRfq = async (data) => {
  const response = await apiClient.post('/rfqs', data);
  return response.data;
};

/**
 * @param {string} rfqId
 * @param {import('@/types').UpdateRfqRequest} data
 * @returns {Promise<import('@/types').RfqDetailResponse>}
 */
export const updateRfq = async (rfqId, data) => {
  const response = await apiClient.put(`/rfqs/${rfqId}`, data);
  return response.data;
};
```

### Method 3: Type Casting in Variables

```javascript
/**
 * @type {import('@/types').UserProfileResponse | null}
 */
let currentUser = null;

/**
 * @type {import('@/types').RfqStatus}
 */
const rfqStatus = 'Published';

/**
 * @type {Array<import('@/types').RfqSummaryResponse>}
 */
const rfqList = [];
```

## 🔧 React Component Examples

### Component with Typed Props

```javascript
import { useState, useEffect } from 'react';

/**
 * @typedef {import('@/types').RfqDetailResponse} RfqDetailResponse
 */

/**
 * RFQ Detail Component
 * @param {Object} props
 * @param {string} props.rfqId - RFQ ID to display
 * @returns {JSX.Element}
 */
export const RfqDetail = ({ rfqId }) => {
  /**
   * @type {[RfqDetailResponse | null, Function]}
   */
  const [rfq, setRfq] = useState(null);

  /**
   * @type {[boolean, Function]}
   */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRfq = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/rfqs/${rfqId}`);
        /** @type {RfqDetailResponse} */
        const data = response.data;
        setRfq(data);
      } catch (error) {
        console.error('Failed to fetch RFQ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRfq();
  }, [rfqId]);

  if (loading) return <div>Loading...</div>;
  if (!rfq) return <div>Not found</div>;

  return (
    <div>
      <h1>{rfq.title}</h1>
      <p>Status: {rfq.status}</p>
      <p>Buyer: {rfq.buyerCompanyName}</p>
    </div>
  );
};
```

### Custom Hook with Types

```javascript
import { useState, useCallback } from 'react';

/**
 * @typedef {import('@/types').CreateRfqRequest} CreateRfqRequest
 * @typedef {import('@/types').RfqDetailResponse} RfqDetailResponse
 * @typedef {import('@/types').ProblemDetails} ProblemDetails
 */

/**
 * Hook for creating RFQs
 * @returns {{
 *   createRfq: (data: CreateRfqRequest) => Promise<RfqDetailResponse>,
 *   loading: boolean,
 *   error: string | null
 * }}
 */
export const useCreateRfq = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {CreateRfqRequest} data
   * @returns {Promise<RfqDetailResponse>}
   */
  const createRfq = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/rfqs', data);
      /** @type {RfqDetailResponse} */
      const result = response.data;
      return result;
    } catch (err) {
      if (err.response?.data) {
        /** @type {ProblemDetails} */
        const problem = err.response.data;
        setError(problem.detail || problem.title);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRfq, loading, error };
};
```

## 🎨 Using Enums

```javascript
/**
 * @typedef {import('@/types').RfqStatus} RfqStatus
 * @typedef {import('@/types').CompanyVerificationStatus} CompanyVerificationStatus
 */

// Import enum values
import { RfqStatus, CompanyVerificationStatus } from '@/types/common.types';

/**
 * Check if RFQ is active
 * @param {RfqStatus | string} status
 * @returns {boolean}
 */
export const isRfqActive = (status) => {
  return status === RfqStatus.Published || status === 'Published';
};

/**
 * Check if company can perform commercial activities
 * @param {CompanyVerificationStatus | string} verificationStatus
 * @returns {boolean}
 */
export const canPerformCommercialActivities = (verificationStatus) => {
  return verificationStatus === CompanyVerificationStatus.Approved || 
         verificationStatus === 'Approved';
};

/**
 * Get status badge color
 * @param {RfqStatus | string} status
 * @returns {string}
 */
export const getRfqStatusColor = (status) => {
  switch (status) {
    case RfqStatus.Draft:
      return 'gray';
    case RfqStatus.Published:
      return 'green';
    case RfqStatus.Closed:
      return 'blue';
    case RfqStatus.Cancelled:
      return 'red';
    default:
      return 'gray';
  }
};
```

## 🌐 API Service Layer Example

```javascript
/**
 * @typedef {import('@/types').LoginRequest} LoginRequest
 * @typedef {import('@/types').AuthResponse} AuthResponse
 * @typedef {import('@/types').UserProfileResponse} UserProfileResponse
 * @typedef {import('@/types').RegisterRequest} RegisterRequest
 */

import { apiClient } from '@/utils/apiClient';

export const authService = {
  /**
   * @param {LoginRequest} credentials
   * @returns {Promise<AuthResponse>}
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * @param {RegisterRequest} data
   * @returns {Promise<import('@/types').RegisterResponse>}
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * @returns {Promise<UserProfileResponse>}
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * @param {string} refreshToken
   * @returns {Promise<AuthResponse>}
   */
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};
```

## 📦 Zustand Store with Types

```javascript
import { create } from 'zustand';

/**
 * @typedef {import('@/types').UserProfileResponse} UserProfileResponse
 */

/**
 * @typedef {Object} AuthState
 * @property {UserProfileResponse | null} user
 * @property {string | null} accessToken
 * @property {string | null} refreshToken
 * @property {boolean} isAuthenticated
 * @property {(user: UserProfileResponse) => void} setUser
 * @property {(accessToken: string, refreshToken: string) => void} setTokens
 * @property {() => void} clearAuth
 */

/**
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<AuthState>>}
 */
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  
  setTokens: (accessToken, refreshToken) => 
    set({ accessToken, refreshToken }),
  
  clearAuth: () => 
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false 
    }),
}));
```

## 🛡️ Error Handling with Types

```javascript
/**
 * @typedef {import('@/types').ProblemDetails} ProblemDetails
 */

import { formatProblemDetails } from '@/types/error.types';

/**
 * Handle API errors consistently
 * @param {unknown} error
 * @returns {string}
 */
export const handleApiError = (error) => {
  if (error?.response?.data) {
    /** @type {ProblemDetails} */
    const problem = error.response.data;
    return formatProblemDetails(problem);
  }
  
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred.';
};
```

## 📝 Form Validation with Types

```javascript
import { z } from 'zod';

/**
 * @typedef {import('@/types').CreateRfqRequest} CreateRfqRequest
 */

// Define Zod schema matching the CreateRfqRequest type
export const createRfqSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional().nullable(),
  targetCategoryId: z.string().uuid('Invalid category').optional().nullable(),
  deliveryGovernorate: z.string().min(1, 'Governorate is required'),
  deliveryCity: z.string().min(1, 'City is required'),
  deliveryAddress: z.string().min(1, 'Address is required'),
  closingDateUtc: z.string().refine(
    (val) => new Date(val) > new Date(),
    'Closing date must be in the future'
  ),
  requiredDeliveryDateUtc: z.string().optional().nullable(),
  targetBudget: z.number().positive().optional().nullable(),
  currency: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  publishImmediately: z.boolean(),
  items: z.array(
    z.object({
      categoryId: z.string().uuid(),
      materialId: z.string().uuid().optional().nullable(),
      materialName: z.string().min(1),
      specifications: z.string().min(1),
      quantity: z.number().positive(),
      unitOfMeasureId: z.string().uuid().optional().nullable(),
      targetPricePerUnit: z.number().positive().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
});
```

## 🔍 VS Code Setup

To get the best IntelliSense experience:

1. **Install VS Code Extensions**:
   - JavaScript and TypeScript Nightly
   - Path Intellisense

2. **Enable Type Checking** (optional):
   Add to the top of any JavaScript file:
   ```javascript
   // @ts-check
   ```

3. **Workspace Settings** (`.vscode/settings.json`):
   ```json
   {
     "javascript.suggest.autoImports": true,
     "javascript.validate.enable": true,
     "js/ts.implicitProjectConfig.checkJs": true
   }
   ```

## ✅ Benefits

- ✨ Full IntelliSense and autocomplete
- 🔍 Type checking during development
- 📚 Self-documenting code
- 🐛 Catch errors before runtime
- 🚀 Easy migration path to TypeScript

## 🎓 Learn More

- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
