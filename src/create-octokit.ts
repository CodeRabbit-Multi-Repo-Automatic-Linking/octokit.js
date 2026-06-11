import type { OctokitOptions } from "@octokit/core";
import type { ThrottlingOptions } from "@octokit/plugin-throttling";
import type { RetryOptions } from "@octokit/plugin-retry";
import type { RequestError } from "@octokit/request-error";

import { Octokit } from "./octokit.js";

// ---------------------------------------------------------------------------
// OctokitConfig
// ---------------------------------------------------------------------------

/**
 * Unified configuration interface for creating a pre-configured Octokit
 * instance. Combines constructor options from four packages into a single,
 * discoverable surface:
 *
 * - Base options: `@octokit/core` (`OctokitOptions`)
 * - Throttling:   `@octokit/plugin-throttling` (`ThrottlingOptions`)
 * - Retries:      `@octokit/plugin-retry` (`RetryOptions`)
 * - Auth/errors:  `@octokit/request-error` (informs the `onRateLimit` types)
 *
 * All fields are optional — omitted fields fall back to the built-in defaults
 * set by the bundled plugins.
 */
export interface OctokitConfig {
  // -------------------------------------------------------------------------
  // Authentication (@octokit/core → OctokitOptions.auth)
  // -------------------------------------------------------------------------

  /**
   * GitHub authentication credential. Can be:
   * - A personal access token string
   * - An `@octokit/auth-*` strategy instance
   * - An async function returning an auth object
   *
   * @example "ghp_YourPersonalAccessToken"
   */
  auth?: OctokitOptions["auth"];

  // -------------------------------------------------------------------------
  // Networking (@octokit/core → OctokitOptions)
  // -------------------------------------------------------------------------

  /**
   * Base URL of the GitHub API. Override this for GitHub Enterprise Server.
   *
   * @default "https://api.github.com"
   * @example "https://github.example.com/api/v3"
   */
  baseUrl?: string;

  /**
   * Custom user-agent string. Prepended to the default
   * `"octokit.js/{version}"` user-agent trail.
   *
   * @example "my-app/2.0.0"
   */
  userAgent?: string;

  /**
   * An `AbortSignal` that cancels **all** requests made by this instance.
   * Wired through `@octokit/core`'s `signal` constructor option added in
   * {@link https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/core.js core.js}.
   *
   * Per-request signals can still be passed via
   * `octokit.request("GET /", { request: { signal } })` and will take
   * precedence over the instance-level signal.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * const octokit = createOctokit({ signal: controller.signal });
   * setTimeout(() => controller.abort(), 10_000);
   * ```
   */
  signal?: AbortSignal;

  /**
   * Low-level request options passed directly to `@octokit/request`.
   * Useful for setting a custom `fetch` implementation, a proxy agent,
   * or a request timeout.
   */
  request?: OctokitOptions["request"];

  // -------------------------------------------------------------------------
  // Logging (@octokit/core → OctokitOptions.log)
  // -------------------------------------------------------------------------

  /**
   * Custom logger. Must implement `debug`, `info`, `warn`, and `error`.
   * Defaults to `console.*` (with `debug` silenced).
   *
   * @example
   * ```ts
   * import pino from "pino";
   * const octokit = createOctokit({ log: pino() });
   * ```
   */
  log?: OctokitOptions["log"];

  // -------------------------------------------------------------------------
  // Throttling (@octokit/plugin-throttling → ThrottlingOptions)
  // -------------------------------------------------------------------------

  /**
   * Rate-limit throttling options for `@octokit/plugin-throttling`.
   *
   * When omitted, the default handlers from `octokit.js` are used:
   * - `onRateLimit`: logs a warning and retries once.
   * - `onSecondaryRateLimit`: logs a warning and retries once.
   *
   * Pass custom handlers to change retry behaviour or integrate with your
   * own telemetry. The `retryCount` argument (4th parameter) tells you how
   * many times the request has already been retried; return `true` to retry
   * again or `false`/`undefined` to surface the error to the caller.
   *
   * @example
   * ```ts
   * const octokit = createOctokit({
   *   throttle: {
   *     onRateLimit: (retryAfter, options, octokit, retryCount) => {
   *       octokit.log.warn(`Rate limited on ${options.url}`);
   *       return retryCount < 3; // retry up to 3 times
   *     },
   *     onSecondaryRateLimit: (_retryAfter, options, octokit) => {
   *       octokit.log.error(`Secondary rate limit on ${options.url}`);
   *       // do not retry secondary rate limits
   *     },
   *   },
   * });
   * ```
   */
  throttle?: ThrottlingOptions;

  // -------------------------------------------------------------------------
  // Retries (@octokit/plugin-retry → RetryOptions)
  // -------------------------------------------------------------------------

  /**
   * Automatic retry options for `@octokit/plugin-retry`.
   *
   * @default
   * ```ts
   * {
   *   retries: 3,
   *   doNotRetry: [400, 401, 403, 404, 410, 422, 451],
   * }
   * ```
   *
   * @example Reduce retries and skip 500s
   * ```ts
   * const octokit = createOctokit({
   *   retry: { retries: 1, doNotRetry: [400, 401, 403, 404, 500] },
   * });
   * ```
   *
   * @example Custom shouldRetry predicate (requires plugin-retry ≥ next)
   * ```ts
   * import { isRateLimitError } from "octokit";
   * const octokit = createOctokit({
   *   retry: {
   *     // Let plugin-throttling handle rate limits; only retry network errors
   *     shouldRetry: (error: RequestError) => !isRateLimitError(error),
   *   },
   * });
   * ```
   */
  retry?: RetryOptions;
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

/**
 * Creates a pre-configured `Octokit` instance.
 *
 * This is a typed wrapper around `new Octokit(options)` that surfaces every
 * available plugin option through a single, documented interface —
 * eliminating the need to know which option belongs to which sub-package.
 *
 * @param config - Configuration options. All fields are optional.
 * @returns A fully initialised `Octokit` instance.
 *
 * @example Minimal — unauthenticated
 * ```ts
 * const octokit = createOctokit();
 * ```
 *
 * @example Authenticated
 * ```ts
 * const octokit = createOctokit({ auth: process.env.GITHUB_TOKEN });
 * ```
 *
 * @example With request cancellation
 * ```ts
 * const controller = new AbortController();
 * const octokit = createOctokit({
 *   auth: process.env.GITHUB_TOKEN,
 *   signal: controller.signal,
 * });
 * ```
 */
export function createOctokit(
  config: OctokitConfig = {},
): InstanceType<typeof Octokit> {
  return new Octokit(config);
}

/**
 * Creates a pre-configured `Octokit` instance pointed at a **GitHub
 * Enterprise Server** instance.
 *
 * Equivalent to `createOctokit({ auth, baseUrl, ...options })` but promotes
 * `baseUrl` to a required first argument so it cannot be accidentally omitted
 * when targeting GHES.
 *
 * The base URL must be the REST API root of your GHES installation, which is
 * typically `https://<hostname>/api/v3`.
 *
 * @param baseUrl - REST API root URL of the GHES instance.
 * @param auth - Authentication credential (token or auth strategy).
 * @param options - Additional options forwarded to `createOctokit`.
 *
 * @example
 * ```ts
 * const octokit = createOctokitForGHES(
 *   "https://github.example.com/api/v3",
 *   process.env.GITHUB_TOKEN,
 * );
 * const { data } = await octokit.rest.repos.get({ owner: "org", repo: "repo" });
 * ```
 */
export function createOctokitForGHES(
  baseUrl: string,
  auth: OctokitConfig["auth"],
  options: Omit<OctokitConfig, "baseUrl" | "auth"> = {},
): InstanceType<typeof Octokit> {
  return createOctokit({ ...options, auth, baseUrl });
}

/**
 * Creates an `Octokit` sub-class with baked-in defaults. The returned class
 * can be instantiated multiple times; each instance inherits the defaults but
 * can override any of them.
 *
 * Wraps `Octokit.defaults()` from `@octokit/core` with the typed
 * `OctokitConfig` surface so the defaults are discoverable via IDE
 * auto-complete rather than requiring knowledge of the underlying plugin APIs.
 *
 * @param defaults - Default options applied to every instance of the returned class.
 * @returns An `Octokit` sub-class with the provided defaults baked in.
 *
 * @example
 * ```ts
 * const MyOctokit = withOctokitDefaults({
 *   baseUrl: "https://github.example.com/api/v3",
 *   userAgent: "my-app/1.0.0",
 *   retry: { retries: 1 },
 * });
 *
 * // Each instance can still override individual options:
 * const octokit = new MyOctokit({ auth: process.env.GITHUB_TOKEN });
 * ```
 */
export function withOctokitDefaults(defaults: OctokitConfig): typeof Octokit {
  return Octokit.defaults(defaults) as typeof Octokit;
}
