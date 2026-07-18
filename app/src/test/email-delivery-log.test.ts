import { describe, expect, it, vi } from "vitest";
import {
  completeEmailLogEntry,
  createEmailLogEntry,
} from "../../supabase/functions/_shared/email-delivery-log";

describe("email delivery log", () => {
  it("records a pending attempt then marks the same row as sent", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "log-123" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ insert, update }) };

    const id = await createEmailLogEntry(client, {
      recipient: "reader@example.test",
      type: "welcome",
      subject: "Bienvenue",
      status: "pending",
    });
    await completeEmailLogEntry(client, id, "sent");

    expect(insert).toHaveBeenCalledWith({
      recipient: "reader@example.test",
      type: "welcome",
      subject: "Bienvenue",
      status: "pending",
    });
    expect(update).toHaveBeenCalledWith({ status: "sent", error: null });
    expect(eq).toHaveBeenCalledWith("id", "log-123");
  });

  it("marks an attempted email as failed with a bounded error", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ update }) };

    await completeEmailLogEntry(client, "log-456", "failed", "x".repeat(600));

    expect(update).toHaveBeenCalledWith({ status: "failed", error: "x".repeat(500) });
    expect(eq).toHaveBeenCalledWith("id", "log-456");
  });
});
