import { describe, expect, it } from "vitest";

import {
  Webhooks,
  createWebhooksNodeMiddleware,
  createWebhooksWebMiddleware,
  isWebhookEventName,
  webhookEventNames,
} from "../src/index.ts";

describe("Webhooks class", () => {
  it("is exported and can be instantiated", () => {
    const webhooks = new Webhooks({ secret: "test-secret" });
    expect(webhooks).toBeDefined();
    expect(typeof webhooks.on).toBe("function");
    expect(typeof webhooks.receive).toBe("function");
    expect(typeof webhooks.sign).toBe("function");
    expect(typeof webhooks.verify).toBe("function");
  });

  it("registers and calls event listeners", async () => {
    const webhooks = new Webhooks({ secret: "test-secret" });
    const payloads: unknown[] = [];

    webhooks.onAny(({ name, payload }) => {
      payloads.push({ name, payload });
    });

    await webhooks.receive({
      id: "1",
      name: "push",
      payload: { commits: [] } as any,
    });

    expect(payloads).toHaveLength(1);
    expect((payloads[0] as any).name).toBe("push");
  });

  it("registers error handlers", () => {
    const webhooks = new Webhooks({ secret: "test-secret" });
    expect(() => webhooks.onError(() => {})).not.toThrow();
  });
});

describe("createWebhooksNodeMiddleware", () => {
  it("is exported and returns a function", () => {
    const webhooks = new Webhooks({ secret: "test-secret" });
    const middleware = createWebhooksNodeMiddleware(webhooks);
    expect(typeof middleware).toBe("function");
  });
});

describe("createWebhooksWebMiddleware", () => {
  it("is exported and returns a function", () => {
    const webhooks = new Webhooks({ secret: "test-secret" });
    const handler = createWebhooksWebMiddleware(webhooks);
    expect(typeof handler).toBe("function");
  });
});

describe("webhookEventNames", () => {
  it("is a non-empty array of strings", () => {
    expect(Array.isArray(webhookEventNames)).toBe(true);
    expect(webhookEventNames.length).toBeGreaterThan(0);
  });

  it("includes common GitHub event names", () => {
    expect(webhookEventNames).toContain("push");
    expect(webhookEventNames).toContain("pull_request");
    expect(webhookEventNames).toContain("issues");
    expect(webhookEventNames).toContain("issue_comment");
    expect(webhookEventNames).toContain("create");
    expect(webhookEventNames).toContain("delete");
    expect(webhookEventNames).toContain("release");
    expect(webhookEventNames).toContain("workflow_run");
  });

  it("includes dotted sub-event names", () => {
    expect(webhookEventNames).toContain("pull_request.opened");
    expect(webhookEventNames).toContain("issues.opened");
    expect(webhookEventNames).toContain("pull_request.closed");
  });
});

describe("isWebhookEventName", () => {
  it("returns true for known event names", () => {
    expect(isWebhookEventName("push")).toBe(true);
    expect(isWebhookEventName("pull_request")).toBe(true);
    expect(isWebhookEventName("pull_request.opened")).toBe(true);
    expect(isWebhookEventName("issues.closed")).toBe(true);
    expect(isWebhookEventName("workflow_run")).toBe(true);
  });

  it("returns false for unknown event names", () => {
    expect(isWebhookEventName("not_a_real_event")).toBe(false);
    expect(isWebhookEventName("")).toBe(false);
    expect(isWebhookEventName("PUSH")).toBe(false);
    expect(isWebhookEventName("push.unknown_action")).toBe(false);
  });

  it("narrows the type for use in typed webhook handlers", () => {
    const unknownEventName: string = "push";
    if (isWebhookEventName(unknownEventName)) {
      // TypeScript should accept this without error
      const webhooks = new Webhooks({ secret: "s" });
      expect(() => webhooks.on(unknownEventName, () => {})).not.toThrow();
    }
  });

  it("every entry in webhookEventNames passes the guard", () => {
    for (const name of webhookEventNames) {
      expect(isWebhookEventName(name)).toBe(true);
    }
  });
});
