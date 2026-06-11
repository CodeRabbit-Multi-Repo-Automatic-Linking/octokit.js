// ************************************************************
// THIS CODE IS NOT EXECUTED. IT IS JUST FOR TYPECHECKING
// ************************************************************

import { App, OAuthApp, Octokit, RequestError, VERSION } from "../src/index.ts";
import type {
  GetResponseTypeFromEndpointMethod,
  OctokitOptions,
  OctokitResponse,
  PaginateInterface,
  PaginatingEndpoints,
  RequestParameters,
  RetryOptions,
  ThrottlingOptions,
} from "../src/index.ts";

function expect<T>(what: T) {}

export async function OctokitTest() {
  const app = new App({
    appId: 1,
    privateKey: "",
  });

  expect<Octokit>(app.octokit);

  const oauthApp = new OAuthApp({
    clientId: "",
    clientSecret: "",
  });

  expect<Octokit>(oauthApp.octokit);

  const installationOctokit = await app.getInstallationOctokit(1);
  const issues = await installationOctokit.paginate(
    installationOctokit.rest.issues.listForRepo,
    {
      owner: "",
      repo: "",
    },
  );
  expect<number>(issues[0].id);

  const error = new RequestError("test", 123, {
    request: {
      method: "GET",
      url: "https://api.github.com/",
      headers: {},
    },
  });

  expect<RequestError>(error);

  // VERSION is a string
  expect<string>(VERSION);

  // OctokitOptions covers base constructor options
  const opts: OctokitOptions = {
    auth: "token",
    baseUrl: "https://api.github.com",
  };
  expect<OctokitOptions>(opts);

  // ThrottlingOptions and RetryOptions can be composed into OctokitOptions
  const throttleOpts: ThrottlingOptions = {
    onRateLimit: () => true,
    onSecondaryRateLimit: () => false,
  };
  expect<ThrottlingOptions>(throttleOpts);

  const retryOpts: RetryOptions = { doNotRetry: [400, 401] };
  expect<RetryOptions>(retryOpts);

  // GetResponseTypeFromEndpointMethod extracts response type from REST endpoints
  type RepoResponse = GetResponseTypeFromEndpointMethod<
    typeof installationOctokit.rest.repos.get
  >;
  expect<RepoResponse["data"]["full_name"]>("owner/repo");

  // OctokitResponse wraps the response body with status and headers
  type ListReposResponse = OctokitResponse<{ id: number; name: string }[]>;
  expect<ListReposResponse["status"]>(200);

  // RequestParameters type-checks arbitrary request payloads
  const params: RequestParameters = { owner: "octokit", repo: "octokit.js" };
  expect<RequestParameters>(params);

  // PaginateInterface and PaginatingEndpoints are available for typed pagination
  const paginate: PaginateInterface = installationOctokit.paginate;
  expect<PaginateInterface>(paginate);

  type Endpoints = PaginatingEndpoints;
  expect<keyof Endpoints>("GET /repos/{owner}/{repo}/issues");
}
