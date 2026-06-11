import { describe, expect, it } from "vitest";
import { Octokit } from "../src/index.ts";

// ---------------------------------------------------------------------------
// Runtime checks — confirm the Octokit.rest object has the expected shape,
// which validates that @octokit/plugin-rest-endpoint-methods is wired in.
// The type-level assertions for RestEndpointMethodTypes, Endpoints,
// RestParameters, RestResponseData and RestResponse live in
// test/typescript-validate.ts (compile-time only).
// ---------------------------------------------------------------------------

describe("octokit.rest endpoint method structure", () => {
  let octokit: InstanceType<typeof Octokit>;

  it("creates an Octokit instance with rest endpoints", () => {
    octokit = new Octokit();
    expect(octokit.rest).toBeDefined();
  });

  it("has top-level REST scopes matching RestEndpointMethodTypes keys", () => {
    octokit = new Octokit();
    // Spot-check a representative set of scopes that RestEndpointMethodTypes
    // covers — these must all exist at runtime on octokit.rest
    const expectedScopes = [
      "actions",
      "apps",
      "billing",
      "checks",
      "gists",
      "git",
      "gitignore",
      "interactions",
      "issues",
      "licenses",
      "markdown",
      "meta",
      "migrations",
      "orgs",
      "packages",
      "projects",
      "pulls",
      "reactions",
      "repos",
      "search",
      "teams",
      "users",
    ];

    for (const scope of expectedScopes) {
      expect(
        octokit.rest,
        `expected octokit.rest.${scope} to exist`,
      ).toHaveProperty(scope);
    }
  });

  it("repos scope has expected methods", () => {
    octokit = new Octokit();
    expect(typeof octokit.rest.repos.get).toBe("function");
    expect(typeof octokit.rest.repos.listForOrg).toBe("function");
    expect(typeof octokit.rest.repos.createForAuthenticatedUser).toBe(
      "function",
    );
    expect(typeof octokit.rest.repos.delete).toBe("function");
  });

  it("issues scope has expected methods", () => {
    octokit = new Octokit();
    expect(typeof octokit.rest.issues.get).toBe("function");
    expect(typeof octokit.rest.issues.listForRepo).toBe("function");
    expect(typeof octokit.rest.issues.create).toBe("function");
    expect(typeof octokit.rest.issues.addLabels).toBe("function");
  });

  it("pulls scope has expected methods", () => {
    octokit = new Octokit();
    expect(typeof octokit.rest.pulls.get).toBe("function");
    expect(typeof octokit.rest.pulls.list).toBe("function");
    expect(typeof octokit.rest.pulls.create).toBe("function");
    expect(typeof octokit.rest.pulls.merge).toBe("function");
  });

  it("each method has endpoint and defaults properties", () => {
    octokit = new Octokit();
    const method = octokit.rest.repos.get;
    expect(typeof method.endpoint).toBe("function");
    expect(typeof method.defaults).toBe("function");
  });
});
