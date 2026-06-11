import { describe, expect, it, afterEach, beforeEach } from "vitest";
import MockDate from "mockdate";
import { RequestError } from "../src/index.ts";
import {
  getRetryAfterSeconds,
  isAuthenticationError,
  isForbiddenError,
  isNotFoundError,
  isRateLimitError,
  isRequestError,
  isSecondaryRateLimitError,
  isValidationError,
} from "../src/index.ts";

function makeRequestError(
  message: string,
  status: number,
  headers: Record<string, string> = {},
): RequestError {
  return new RequestError(message, status, {
    request: { method: "GET", url: "https://api.github.com/", headers: {} },
    response: {
      status,
      url: "https://api.github.com/",
      headers,
      data: { message },
    },
  });
}

describe("isRequestError", () => {
  it("returns true for a RequestError instance", () => {
    expect(isRequestError(makeRequestError("Not Found", 404))).toBe(true);
  });

  it("returns false for a plain Error", () => {
    expect(isRequestError(new Error("oops"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isRequestError(null)).toBe(false);
    expect(isRequestError(undefined)).toBe(false);
    expect(isRequestError("string error")).toBe(false);
    expect(isRequestError(42)).toBe(false);
  });
});

describe("isRateLimitError", () => {
  it("returns true for HTTP 429", () => {
    expect(isRateLimitError(makeRequestError("Too Many Requests", 429))).toBe(
      true,
    );
  });

  it("returns true for HTTP 403 with x-ratelimit-remaining: 0", () => {
    expect(
      isRateLimitError(
        makeRequestError("Forbidden", 403, { "x-ratelimit-remaining": "0" }),
      ),
    ).toBe(true);
  });

  it("returns false for HTTP 403 without x-ratelimit-remaining header", () => {
    expect(isRateLimitError(makeRequestError("Forbidden", 403))).toBe(false);
  });

  it("returns false for HTTP 403 with x-ratelimit-remaining > 0", () => {
    expect(
      isRateLimitError(
        makeRequestError("Forbidden", 403, { "x-ratelimit-remaining": "10" }),
      ),
    ).toBe(false);
  });

  it("returns false for HTTP 404", () => {
    expect(isRateLimitError(makeRequestError("Not Found", 404))).toBe(false);
  });

  it("returns false for non-RequestError values", () => {
    expect(isRateLimitError(new Error("oops"))).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});

describe("isSecondaryRateLimitError", () => {
  it("returns true for HTTP 403 with secondary rate message", () => {
    expect(
      isSecondaryRateLimitError(
        makeRequestError("You have exceeded a secondary rate limit", 403),
      ),
    ).toBe(true);
  });

  it("returns true for HTTP 429 with secondary rate message", () => {
    expect(
      isSecondaryRateLimitError(
        makeRequestError("secondary rate limit exceeded", 429),
      ),
    ).toBe(true);
  });

  it("is case-insensitive for the secondary rate message", () => {
    expect(
      isSecondaryRateLimitError(
        makeRequestError("SECONDARY RATE limit hit", 403),
      ),
    ).toBe(true);
  });

  it("returns false for HTTP 403 without secondary rate message", () => {
    expect(isSecondaryRateLimitError(makeRequestError("Forbidden", 403))).toBe(
      false,
    );
  });

  it("returns false for HTTP 404", () => {
    expect(isSecondaryRateLimitError(makeRequestError("Not Found", 404))).toBe(
      false,
    );
  });

  it("returns false for non-RequestError values", () => {
    expect(isSecondaryRateLimitError(new Error("secondary rate"))).toBe(false);
  });
});

describe("isNotFoundError", () => {
  it("returns true for HTTP 404", () => {
    expect(isNotFoundError(makeRequestError("Not Found", 404))).toBe(true);
  });

  it("returns false for HTTP 403", () => {
    expect(isNotFoundError(makeRequestError("Forbidden", 403))).toBe(false);
  });

  it("returns false for non-RequestError values", () => {
    expect(isNotFoundError(new Error("not found"))).toBe(false);
  });
});

describe("isAuthenticationError", () => {
  it("returns true for HTTP 401", () => {
    expect(isAuthenticationError(makeRequestError("Unauthorized", 401))).toBe(
      true,
    );
  });

  it("returns false for HTTP 403", () => {
    expect(isAuthenticationError(makeRequestError("Forbidden", 403))).toBe(
      false,
    );
  });

  it("returns false for non-RequestError values", () => {
    expect(isAuthenticationError(new Error("unauthorized"))).toBe(false);
  });
});

describe("isValidationError", () => {
  it("returns true for HTTP 422", () => {
    expect(
      isValidationError(makeRequestError("Unprocessable Entity", 422)),
    ).toBe(true);
  });

  it("returns false for HTTP 400", () => {
    expect(isValidationError(makeRequestError("Bad Request", 400))).toBe(false);
  });

  it("returns false for non-RequestError values", () => {
    expect(isValidationError(new Error("validation failed"))).toBe(false);
  });
});

describe("isForbiddenError", () => {
  it("returns true for a plain HTTP 403", () => {
    expect(isForbiddenError(makeRequestError("Forbidden", 403))).toBe(true);
  });

  it("returns false for HTTP 403 that is a primary rate limit", () => {
    expect(
      isForbiddenError(
        makeRequestError("Forbidden", 403, { "x-ratelimit-remaining": "0" }),
      ),
    ).toBe(false);
  });

  it("returns false for HTTP 403 that is a secondary rate limit", () => {
    expect(
      isForbiddenError(
        makeRequestError("You have exceeded a secondary rate limit", 403),
      ),
    ).toBe(false);
  });

  it("returns false for HTTP 401", () => {
    expect(isForbiddenError(makeRequestError("Unauthorized", 401))).toBe(false);
  });

  it("returns false for non-RequestError values", () => {
    expect(isForbiddenError(new Error("forbidden"))).toBe(false);
  });
});

describe("getRetryAfterSeconds", () => {
  beforeEach(() => {
    MockDate.set(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    MockDate.reset();
  });

  it("reads Retry-After header for secondary rate limit errors", () => {
    const error = makeRequestError(
      "You have exceeded a secondary rate limit",
      403,
      { "retry-after": "30" },
    );
    expect(getRetryAfterSeconds(error)).toBe(30);
  });

  it("reads x-ratelimit-reset header for primary rate limit errors", () => {
    const resetAt = Math.floor(Date.now() / 1000) + 60;
    const error = makeRequestError("Forbidden", 403, {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(resetAt),
    });
    expect(getRetryAfterSeconds(error)).toBe(60);
  });

  it("prefers Retry-After over x-ratelimit-reset when both are present", () => {
    const resetAt = Math.floor(Date.now() / 1000) + 60;
    const error = makeRequestError("Forbidden", 429, {
      "retry-after": "15",
      "x-ratelimit-reset": String(resetAt),
    });
    expect(getRetryAfterSeconds(error)).toBe(15);
  });

  it("returns 0 when x-ratelimit-reset is in the past", () => {
    const resetAt = Math.floor(Date.now() / 1000) - 10;
    const error = makeRequestError("Forbidden", 403, {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(resetAt),
    });
    expect(getRetryAfterSeconds(error)).toBe(0);
  });

  it("returns undefined for non-rate-limit errors", () => {
    expect(getRetryAfterSeconds(makeRequestError("Not Found", 404))).toBe(
      undefined,
    );
  });

  it("returns undefined for non-RequestError values", () => {
    expect(getRetryAfterSeconds(new Error("oops"))).toBe(undefined);
    expect(getRetryAfterSeconds(null)).toBe(undefined);
  });

  it("returns undefined when no rate-limit headers are present", () => {
    const error = makeRequestError("Too Many Requests", 429);
    expect(getRetryAfterSeconds(error)).toBe(undefined);
  });

  it("returns undefined when the response object is absent", () => {
    const error = new RequestError("Too Many Requests", 429, {
      request: { method: "GET", url: "https://api.github.com/", headers: {} },
    });
    expect(getRetryAfterSeconds(error)).toBe(undefined);
  });
});
