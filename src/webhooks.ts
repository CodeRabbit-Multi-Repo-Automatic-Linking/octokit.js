/**
 * Webhook and GitHub App utilities.
 *
 * Re-exports the parts of @octokit/webhooks and @octokit/app that App users
 * commonly need beyond what the top-level `octokit` package already surfaces.
 */

import {
  Webhooks,
  createNodeMiddleware as _createNodeMiddleware,
  createWebMiddleware as _createWebMiddleware,
  emitterEventNames,
} from "@octokit/webhooks";
import type {
  EmitterWebhookEvent,
  EmitterWebhookEventName,
  WebhookError,
} from "@octokit/webhooks";
import type {
  EachInstallationInterface,
  EachRepositoryInterface,
  EachRepositoryQuery,
  GetInstallationOctokitInterface,
} from "@octokit/app";

// ---------------------------------------------------------------------------
// Webhook class + middleware
// ---------------------------------------------------------------------------

/**
 * The `Webhooks` class from `@octokit/webhooks`, re-exported for users who
 * need a standalone webhook handler without the full `App` wrapper.
 *
 * @see https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/webhooks.js
 *
 * @example
 * ```ts
 * import { Webhooks } from "octokit";
 *
 * const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET });
 * webhooks.on("push", ({ payload }) => console.log(payload.commits));
 * ```
 */
export { Webhooks };

/**
 * Creates a Node.js `http`/`https` compatible request handler for GitHub
 * webhook events. A thin wrapper around the `createNodeMiddleware` export
 * from `@octokit/webhooks` / `@octokit/app`.
 *
 * Re-exported here so that `createNodeMiddleware` (already on `App`) and this
 * standalone variant are both accessible from a single `octokit` import.
 *
 * @see https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/webhooks.js
 */
export { _createNodeMiddleware as createWebhooksNodeMiddleware };

/**
 * Creates a [Fetch API `Request`/`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * compatible handler for GitHub webhook events. Use this instead of
 * `createNodeMiddleware` when deploying to edge runtimes (Cloudflare Workers,
 * Deno Deploy, Bun, etc.) or in browser-based testing.
 *
 * Unlike `createNodeMiddleware`, this function is **not** re-exported from
 * `@octokit/app` — `octokit` is the only top-level package that surfaces it.
 *
 * @see https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/webhooks.js
 *
 * @example Cloudflare Worker
 * ```ts
 * import { App, createWebhooksWebMiddleware } from "octokit";
 *
 * const app = new App({ appId, privateKey, webhooks: { secret } });
 * app.webhooks.on("issues.opened", ({ payload }) => console.log(payload));
 *
 * export default {
 *   fetch: createWebhooksWebMiddleware(app.webhooks),
 * };
 * ```
 */
export { _createWebMiddleware as createWebhooksWebMiddleware };

// ---------------------------------------------------------------------------
// Webhook event names
// ---------------------------------------------------------------------------

/**
 * A runtime array of every valid GitHub webhook event name string, sourced
 * from `@octokit/webhooks`. Useful for validation and building event menus.
 *
 * @example
 * ```ts
 * import { webhookEventNames } from "octokit";
 *
 * console.log(webhookEventNames.includes("push")); // true
 * ```
 */
export const webhookEventNames = emitterEventNames;

/**
 * Returns `true` if `name` is a valid `EmitterWebhookEventName`, narrowing
 * the type accordingly. Uses the runtime `emitterEventNames` list from
 * `@octokit/webhooks` as the source of truth.
 *
 * @example
 * ```ts
 * import { isWebhookEventName } from "octokit";
 *
 * function handleEvent(name: string) {
 *   if (!isWebhookEventName(name)) {
 *     throw new Error(`Unknown webhook event: ${name}`);
 *   }
 *   // name is now EmitterWebhookEventName
 * }
 * ```
 */
export function isWebhookEventName(
  name: string,
): name is EmitterWebhookEventName {
  return (emitterEventNames as readonly string[]).includes(name);
}

// ---------------------------------------------------------------------------
// Webhook type re-exports
// ---------------------------------------------------------------------------

export type { EmitterWebhookEvent, EmitterWebhookEventName, WebhookError };

// ---------------------------------------------------------------------------
// App interface type re-exports (@octokit/app)
// ---------------------------------------------------------------------------

/**
 * Callback options passed to `app.eachInstallation()`.
 * Re-exported from `@octokit/app` so callers don't need a direct dependency.
 *
 * @see https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/app.js (via octokit/app)
 *
 * @example
 * ```ts
 * import { App, type EachInstallationInterface } from "octokit";
 *
 * const app = new App({ appId, privateKey });
 * const iterate: EachInstallationInterface<Octokit> = app.eachInstallation;
 * ```
 */
export type { EachInstallationInterface };

/**
 * Callback options passed to `app.eachRepository()`.
 * Re-exported from `@octokit/app`.
 */
export type { EachRepositoryInterface };

/**
 * Query parameters accepted by `app.eachRepository.iterator()` to filter
 * repositories by installation or visibility.
 * Re-exported from `@octokit/app`.
 */
export type { EachRepositoryQuery };

/**
 * Interface of `app.getInstallationOctokit()`.
 * Re-exported from `@octokit/app`.
 */
export type { GetInstallationOctokitInterface };
