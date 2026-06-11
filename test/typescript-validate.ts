// ************************************************************
// THIS CODE IS NOT EXECUTED. IT IS JUST FOR TYPECHECKING
// ************************************************************

import { App, OAuthApp, Octokit, RequestError } from "../src/index.ts";
import type {
  Endpoints,
  RestEndpointMethodTypes,
  RestParameters,
  RestResponse,
  RestResponseData,
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

  // RestEndpointMethodTypes — keyed by scope and method name
  type GetRepoParams = RestEndpointMethodTypes["repos"]["get"]["parameters"];
  type GetRepoResponse =
    RestEndpointMethodTypes["repos"]["get"]["response"]["data"];
  expect<GetRepoParams>({ owner: "octokit", repo: "octokit.js" });
  expect<GetRepoResponse["full_name"]>("octokit/octokit.js");

  // Endpoints — keyed by route string
  type RouteRepo = Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];
  expect<RouteRepo["id"]>(1);

  // RestParameters utility type
  type ListIssuesParams = RestParameters<"issues", "listForRepo">;
  expect<ListIssuesParams>({ owner: "octokit", repo: "octokit.js" });

  // RestResponseData utility type
  type IssueData = RestResponseData<"issues", "get">;
  expect<IssueData["title"]>("my issue");

  type IssueListData = RestResponseData<"issues", "listForRepo">;
  expect<IssueListData[0]["id"]>(1);

  // RestResponse utility type (full OctokitResponse)
  type GetRepoFullResponse = RestResponse<"repos", "get">;
  expect<GetRepoFullResponse["status"]>(200);
}
