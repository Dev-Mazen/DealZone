/**
 * Error Type Definitions
 * Maps to RFC 7807 ProblemDetails standard used by the backend API
 */

// ============================================================================
// ProblemDetails - RFC 7807 Standard Error Response
// ============================================================================

export interface ProblemDetails {
  /**
   * URI reference that identifies the problem type
   * @example "https://tools.ietf.org/html/rfc7231#section-6.5.1"
   */
  type: string;

  /**
   * Short, human-readable summary of the problem type
   * @example "One or more validation errors occurred."
   */
  title: string;

  /**
   * HTTP status code
   * @example 400
   */
  status: number;

  /**
   * Human-readable explanation specific to this occurrence of the problem
   * @example "The request contains invalid data."
   */
  detail: string;

  /**
   * URI reference that identifies the specific occurrence of the problem
   * @example "/api/v1/rfqs"
   */
  instance: string;

  /**
   * Trace ID for correlating logs and requests
   * @example "0HMVFE92K3QA1:00000001"
   */
  traceId: string;

  /**
   * Validation errors dictionary (field name -> error messages)
   * Present in 400 Bad Request responses with validation failures
   * @example { "Title": ["The Title field is required."], "Items": ["At least one item is required."] }
   */
  errors?: Record<string, string[]>;
}

// ============================================================================
// Common Error Response Types
// ============================================================================

export interface ValidationError {
  field: string;
  messages: string[];
}

export interface ApiError {
  message: string;
  statusCode: number;
  traceId?: string;
  validationErrors?: ValidationError[];
}

// ============================================================================
// Error Helper Functions
// ============================================================================

/**
 * Converts ProblemDetails to a user-friendly error message
 */
export const formatProblemDetails = (problem: ProblemDetails): string => {
  if (problem.errors && Object.keys(problem.errors).length > 0) {
    // Format validation errors
    const errorMessages = Object.entries(problem.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return errorMessages;
  }

  // Return detail or title
  return problem.detail || problem.title || 'An unexpected error occurred';
};

/**
 * Converts ProblemDetails to structured ApiError
 */
export const problemDetailsToApiError = (problem: ProblemDetails): ApiError => {
  const validationErrors: ValidationError[] = problem.errors
    ? Object.entries(problem.errors).map(([field, messages]) => ({
        field,
        messages,
      }))
    : [];

  return {
    message: problem.detail || problem.title,
    statusCode: problem.status,
    traceId: problem.traceId,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  };
};

/**
 * Extracts validation errors as a flat array of field-message pairs
 */
export const extractValidationErrors = (
  problem: ProblemDetails
): Array<{ field: string; message: string }> => {
  if (!problem.errors) return [];

  return Object.entries(problem.errors).flatMap(([field, messages]) =>
    messages.map((message) => ({ field, message }))
  );
};

// ============================================================================
// HTTP Status Code Constants
// ============================================================================

export const HttpStatusCode = {
  OK: 200,
  Created: 201,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  InternalServerError: 500,
  ServiceUnavailable: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatusCode)[keyof typeof HttpStatusCode];
