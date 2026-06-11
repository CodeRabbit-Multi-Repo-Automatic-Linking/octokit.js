import { RequestError } from "@octokit/request-error";
import type { ResponseHeaders } from "@octokit/types";

/**
 * Returns true if `error` is an instance of the `RequestError` class from
 * `@octokit/request-error`. Useful as a discriminant before accessing
 * HTTP-specific properties like `status` or `response`.
 */
export function isRequestError(error: unknown): error is RequestError {
  return error instanceof RequestError;
}

/**
 * Returns true if the request failed because GitHub's primary rate limit was
 * exceeded. GitHub signals this with:
 *  - HTTP 429 (standard Too Many Requests), or
 *  - HTTP 403 with `x-ratelimit-remaining: 0`
 *
 * The same header inspection is used internally by `@octokit/plugin-throttling`
 * to decide whether to trigger the `onRateLimit` handler.
 *
 * @see https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
 */
export function isRateLimitError(error: unknown): error is RequestError {
  if (!isRequestError(error)) return false;
  if (error.status === 429) return true;
  if (error.status !== 403) return false;
  const remaining = (error.response?.headers as ResponseHeaders | undefined)?.[
    "x-ratelimit-remaining"
  ];
  return remaining === "0";
}

/**
 * Returns true if the request failed because GitHub's secondary rate limit was
 * triggered. GitHub returns HTTP 403 or 429 with a message that contains
 * "secondary rate".
 *
 * `@octokit/plugin-throttling` uses the same `/\bsecondary rate\b/i` pattern
 * to route these errors to the `onSecondaryRateLimit` handler.
 *
 * @see https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api#about-secondary-rate-limits
 */
export function isSecondaryRateLimitError(
  error: unknown,
): error is RequestError {
  if (!isRequestError(error)) return false;
  if (error.status !== 403 && error.status !== 429) return false;
  return /\bsecondary rate\b/i.test(error.message);
}

/**
 * Returns true if the resource was not found (HTTP 404).
 */
export function isNotFoundError(error: unknown): error is RequestError {
  return isRequestError(error) && error.status === 404;
}

/**
 * Returns true if the request was rejected due to missing or invalid
 * credentials (HTTP 401).
 */
export function isAuthenticationError(error: unknown): error is RequestError {
  return isRequestError(error) && error.status === 401;
}

/**
 * Returns true if the request payload failed GitHub's validation rules
 * (HTTP 422 Unprocessable Entity).
 */
export function isValidationError(error: unknown): error is RequestError {
  return isRequestError(error) && error.status === 422;
}

/**
 * Returns true if the action is explicitly forbidden for the authenticated
 * user (HTTP 403) and the error is not a rate limit or secondary rate limit.
 */
export function isForbiddenError(error: unknown): error is RequestError {
  return (
    isRequestError(error) &&
    error.status === 403 &&
    !isRateLimitError(error) &&
    !isSecondaryRateLimitError(error)
  );
}

/**
 * For rate limit errors, returns how many seconds to wait before the next
 * request should be attempted. Reads headers in the same priority order used
 * by `@octokit/plugin-throttling`:
 *
 * 1. `Retry-After` — present on secondary rate limit responses
 * 2. `x-ratelimit-reset` — Unix timestamp when the primary quota resets
 *
 * Returns `undefined` if the error is not a rate limit error, or if neither
 * header is present.
 */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (!isRateLimitError(error) && !isSecondaryRateLimitError(error)) {
    return undefined;
  }

  const headers = (error as RequestError).response?.headers as
    | ResponseHeaders
    | undefined;
  if (!headers) return undefined;

  if (headers["retry-after"]) {
    return Number(headers["retry-after"]);
  }

  if (headers["x-ratelimit-reset"]) {
    const resetMs = Number(headers["x-ratelimit-reset"]) * 1000;
    return Math.max(Math.ceil((resetMs - Date.now()) / 1000), 0);
  }

  return undefined;
}
