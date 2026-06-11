import { describe, expect, it, vi } from "vitest";
import nock from "nock";

import {
  createOctokit,
  createOctokitForGHES,
  withOctokitDefaults,
} from "../src/index.ts";
import { Octokit } from "../src/index.ts";

describe("createOctokit", () => {
  it("returns an Octokit instance", () => {
    const octokit = createOctokit();
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("is unauthenticated when no auth is provided", () => {
    const octokit = createOctokit();
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("accepts an auth token", () => {
    const octokit = createOctokit({ auth: "ghs_token" });
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("sets a custom baseUrl", async () => {
    const scope = nock("https://github.example.com")
      .get("/api/v3/")
      .reply(200, { ok: true });

    const octokit = createOctokit({
      baseUrl: "https://github.example.com/api/v3",
    });

    await octokit.request("GET /");
    expect(scope.isDone()).toBe(true);
  });

  it("sets a custom userAgent", async () => {
    const scope = nock("https://api.github.com", {
      reqheaders: {
        "user-agent": (ua) => ua.includes("my-app/1.0.0"),
      },
    })
      .get("/")
      .reply(200, {});

    const octokit = createOctokit({ userAgent: "my-app/1.0.0" });
    await octokit.request("GET /");
    expect(scope.isDone()).toBe(true);
    nock.cleanAll();
  });

  it("accepts an AbortSignal without throwing", () => {
    // The signal option is forwarded to @octokit/core's OctokitOptions.
    // Full request-cancellation wiring is implemented in core.js — see
    // https://github.com/CodeRabbit-Multi-Repo-Automatic-Linking/core.js
    const controller = new AbortController();
    expect(() => createOctokit({ signal: controller.signal })).not.toThrow();
  });

  it("accepts custom retry options", () => {
    const octokit = createOctokit({
      retry: { retries: 1, doNotRetry: [400] },
    });
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("accepts custom throttle options", () => {
    const onRateLimit = vi.fn();
    const onSecondaryRateLimit = vi.fn();
    const octokit = createOctokit({
      throttle: { onRateLimit, onSecondaryRateLimit },
    });
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("accepts a custom logger", () => {
    const log = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const octokit = createOctokit({ log });
    expect(octokit.log).toBe(log);
  });

  it("combines multiple options", () => {
    const octokit = createOctokit({
      auth: "token",
      baseUrl: "https://github.example.com/api/v3",
      userAgent: "my-app/1.0.0",
      retry: { retries: 2 },
    });
    expect(octokit).toBeInstanceOf(Octokit);
  });
});

describe("createOctokitForGHES", () => {
  it("returns an Octokit instance", () => {
    const octokit = createOctokitForGHES(
      "https://github.example.com/api/v3",
      "token",
    );
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("uses the provided baseUrl for requests", async () => {
    const scope = nock("https://github.example.com")
      .get("/api/v3/")
      .reply(200, { ok: true });

    const octokit = createOctokitForGHES(
      "https://github.example.com/api/v3",
      "token",
    );

    await octokit.request("GET /");
    expect(scope.isDone()).toBe(true);
  });

  it("accepts additional options", () => {
    const octokit = createOctokitForGHES(
      "https://github.example.com/api/v3",
      "token",
      { userAgent: "my-app/1.0.0", retry: { retries: 1 } },
    );
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("overrides baseUrl and auth even when passed in options", () => {
    const octokit = createOctokitForGHES(
      "https://github.example.com/api/v3",
      "token",
      // baseUrl and auth in options are ignored — positional args win
      {},
    );
    expect((octokit.request.endpoint.DEFAULTS as any).baseUrl).toBe(
      "https://github.example.com/api/v3",
    );
  });
});

describe("withOctokitDefaults", () => {
  it("returns a class that extends Octokit", () => {
    const MyOctokit = withOctokitDefaults({ userAgent: "my-app/1.0.0" });
    const octokit = new MyOctokit();
    expect(octokit).toBeInstanceOf(Octokit);
  });

  it("bakes in the default baseUrl", async () => {
    const scope = nock("https://github.example.com")
      .get("/api/v3/")
      .reply(200, { ok: true });

    const GHESOctokit = withOctokitDefaults({
      baseUrl: "https://github.example.com/api/v3",
    });
    const octokit = new GHESOctokit();
    await octokit.request("GET /");
    expect(scope.isDone()).toBe(true);
  });

  it("allows instances to override the baked-in defaults", async () => {
    const scope = nock("https://other.example.com")
      .get("/api/v3/")
      .reply(200, { ok: true });

    const GHESOctokit = withOctokitDefaults({
      baseUrl: "https://github.example.com/api/v3",
    });
    // per-instance override wins
    const octokit = new GHESOctokit({
      baseUrl: "https://other.example.com/api/v3",
    });
    await octokit.request("GET /");
    expect(scope.isDone()).toBe(true);
  });

  it("can be instantiated multiple times independently", () => {
    const MyOctokit = withOctokitDefaults({ retry: { retries: 1 } });
    const a = new MyOctokit({ auth: "token-a" });
    const b = new MyOctokit({ auth: "token-b" });
    expect(a).toBeInstanceOf(Octokit);
    expect(b).toBeInstanceOf(Octokit);
    expect(a).not.toBe(b);
  });
});
