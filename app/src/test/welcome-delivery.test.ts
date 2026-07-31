import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deliverWelcome,
  type WelcomeDeliveryStore,
} from "../../supabase/functions/_shared/welcome-delivery";

const NOW = Date.parse("2026-07-31T14:00:00.000Z");
const user = {
  id: "user-1",
  email: "reader@example.test",
  createdAt: "2026-07-31T13:55:00.000Z",
  metadata: { given_name: "MetadataName" },
};

const createStore = (): WelcomeDeliveryStore => ({
  getProfile: vi.fn().mockResolvedValue({ firstName: "Ari", language: "fr" }),
  getDelivery: vi.fn().mockResolvedValue(null),
  createClaim: vi.fn().mockResolvedValue("created"),
  reclaimDelivery: vi.fn().mockResolvedValue(true),
  updateProfileLocale: vi.fn().mockResolvedValue(true),
  sendWelcome: vi.fn().mockResolvedValue(undefined),
  markSent: vi.fn().mockResolvedValue(true),
  markFailed: vi.fn().mockResolvedValue(undefined),
});

describe("welcome delivery orchestration", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("resolves the recipient from the auth user and sends once in the requested locale", async () => {
    const store = createStore();
    const result = await deliverWelcome({ user, requestedLocale: "es-MX", store, nowMs: NOW });

    expect(result).toEqual({ status: "sent", locale: "es-MX", httpStatus: 200 });
    expect(store.createClaim).toHaveBeenCalledWith({
      userId: "user-1",
      locale: "es-MX",
      firstName: "Ari",
      claimedAt: "2026-07-31T14:00:00.000Z",
    });
    expect(store.sendWelcome).toHaveBeenCalledWith({
      to: "reader@example.test",
      firstName: "Ari",
      locale: "es-MX",
      idempotencyKey: "welcome-user/user-1",
    });
    expect(store.updateProfileLocale).toHaveBeenCalledWith("user-1", "es");
    expect(store.markSent).toHaveBeenCalledTimes(1);
  });

  it("does not call the provider for an already delivered account", async () => {
    const store = createStore();
    vi.mocked(store.getDelivery).mockResolvedValue({
      locale: "en-US",
      firstName: "Ari",
      status: "sent",
      claimedAt: "2026-07-31T13:50:00.000Z",
      attempts: 1,
    });

    const result = await deliverWelcome({ user, requestedLocale: "fr", store, nowMs: NOW });
    expect(result).toEqual({ status: "already_sent", httpStatus: 200 });
    expect(store.sendWelcome).not.toHaveBeenCalled();
  });

  it("reuses the original payload on retry so the provider key stays idempotent", async () => {
    const store = createStore();
    vi.mocked(store.getDelivery).mockResolvedValue({
      locale: "de-DE",
      firstName: "Ursula",
      status: "failed",
      claimedAt: "2026-07-31T13:58:00.000Z",
      attempts: 1,
    });

    const result = await deliverWelcome({ user, requestedLocale: "es", store, nowMs: NOW });
    expect(result).toEqual({ status: "sent", locale: "de-DE", httpStatus: 200 });
    expect(store.sendWelcome).toHaveBeenCalledWith({
      to: "reader@example.test",
      firstName: "Ursula",
      locale: "de-DE",
      idempotencyKey: "welcome-user/user-1",
    });
  });

  it("rejects old accounts before reading or mutating delivery state", async () => {
    const store = createStore();
    const result = await deliverWelcome({
      user: { ...user, createdAt: "2026-07-29T13:55:00.000Z" },
      requestedLocale: "en",
      store,
      nowMs: NOW,
    });

    expect(result).toEqual({ status: "ineligible", httpStatus: 200 });
    expect(store.getProfile).not.toHaveBeenCalled();
    expect(store.sendWelcome).not.toHaveBeenCalled();
  });

  it("records a bounded failure when the protected sender fails", async () => {
    const store = createStore();
    vi.mocked(store.sendWelcome).mockRejectedValue(new Error("provider detail"));

    const result = await deliverWelcome({ user, requestedLocale: "en", store, nowMs: NOW });
    expect(result).toEqual({ error: "welcome_delivery_failed", httpStatus: 502 });
    expect(store.markFailed).toHaveBeenCalledWith(
      "user-1",
      "2026-07-31T14:00:00.000Z",
      "provider detail",
    );
  });
});
