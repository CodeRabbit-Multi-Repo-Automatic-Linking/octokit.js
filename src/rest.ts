/**
 * REST API type utilities.
 *
 * Re-exports the typed parameter/response surfaces from
 * @octokit/plugin-rest-endpoint-methods and @octokit/types and adds a pair
 * of convenience utility types that make it easier to extract the types for
 * a specific endpoint without reaching into sub-packages.
 */

import type { Endpoints } from "@octokit/types";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

// ---------------------------------------------------------------------------
// Direct re-exports
// ---------------------------------------------------------------------------

/**
 * A map of every REST endpoint's typed parameter and response shapes, keyed
 * by scope (e.g. `"repos"`) and method name (e.g. `"get"`). Sourced from
 * `@octokit/plugin-rest-endpoint-methods`.
 *
 * This is the canonical way to type REST API calls in TypeScript without
 * importing from the sub-package directly.
 *
 * @example
 * ```ts
 * import type { RestEndpointMethodTypes } from "octokit";
 *
 * type GetRepoParams = RestEndpointMethodTypes["repos"]["get"]["parameters"];
 * type GetRepoResponse = RestEndpointMethodTypes["repos"]["get"]["response"];
 * type Repo = GetRepoResponse["data"];
 * ```
 */
export type { RestEndpointMethodTypes };

/**
 * The full GitHub REST API endpoint map from `@octokit/types`. Each key is a
 * route string like `"GET /repos/{owner}/{repo}"` and the value holds the
 * typed `parameters` and `response` for that route.
 *
 * Prefer `RestEndpointMethodTypes` for named-method access and `Endpoints`
 * when working directly with route strings.
 *
 * @example
 * ```ts
 * import type { Endpoints } from "octokit";
 *
 * type Repo = Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];
 * ```
 */
export type { Endpoints };

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

/**
 * Extracts the **parameters** type for a specific REST endpoint method.
 *
 * `TScope` is the REST API scope (e.g. `"repos"`, `"issues"`, `"pulls"`).
 * `TMethod` is the camelCase method name within that scope.
 *
 * Equivalent to `RestEndpointMethodTypes[TScope][TMethod]["parameters"]`
 * but easier to discover and less verbose at call sites.
 *
 * @example
 * ```ts
 * import type { RestParameters } from "octokit";
 *
 * async function getRepo(params: RestParameters<"repos", "get">) {
 *   // params is { owner: string; repo: string; … }
 * }
 * ```
 */
export type RestParameters<
  TScope extends keyof RestEndpointMethodTypes,
  TMethod extends keyof RestEndpointMethodTypes[TScope],
> = RestEndpointMethodTypes[TScope][TMethod] extends {
  parameters: infer P;
}
  ? P
  : never;

/**
 * Extracts the **response data** type for a specific REST endpoint method —
 * i.e. the type of `response.data`, not the full `OctokitResponse` wrapper.
 *
 * `TScope` is the REST API scope (e.g. `"repos"`, `"issues"`, `"pulls"`).
 * `TMethod` is the camelCase method name within that scope.
 *
 * Equivalent to
 * `RestEndpointMethodTypes[TScope][TMethod]["response"]["data"]` but
 * more concise and discoverable.
 *
 * @example
 * ```ts
 * import type { RestResponseData } from "octokit";
 *
 * type Repo = RestResponseData<"repos", "get">;
 * // { id: number; name: string; full_name: string; … }
 *
 * type Issue = RestResponseData<"issues", "get">;
 * // { id: number; title: string; body: string | null; … }
 *
 * type Issues = RestResponseData<"issues", "listForRepo">;
 * // Array<{ id: number; title: string; … }>
 * ```
 */
export type RestResponseData<
  TScope extends keyof RestEndpointMethodTypes,
  TMethod extends keyof RestEndpointMethodTypes[TScope],
> = RestEndpointMethodTypes[TScope][TMethod] extends {
  response: { data: infer D };
}
  ? D
  : never;

/**
 * Extracts the full `OctokitResponse` type (including `status`, `headers`,
 * and `url` alongside `data`) for a specific REST endpoint method.
 *
 * Use `RestResponseData` when you only need the payload. Use this type when
 * you need access to response metadata such as the HTTP status code or
 * rate-limit headers from `@octokit/types`.
 *
 * @example
 * ```ts
 * import type { RestResponse } from "octokit";
 *
 * type Response = RestResponse<"repos", "get">;
 * // OctokitResponse<{ id: number; name: string; … }, 200>
 *
 * declare const response: RestResponse<"repos", "get">;
 * console.log(response.status);  // number
 * console.log(response.headers); // ResponseHeaders
 * console.log(response.data.full_name); // string
 * ```
 */
export type RestResponse<
  TScope extends keyof RestEndpointMethodTypes,
  TMethod extends keyof RestEndpointMethodTypes[TScope],
> = RestEndpointMethodTypes[TScope][TMethod] extends {
  response: infer R;
}
  ? R
  : never;
