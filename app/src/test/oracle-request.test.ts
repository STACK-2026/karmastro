import { describe, expect, it } from "vitest";
import {
  OracleRequestError,
  conversationBelongsToIdentity,
  mergeProfileContext,
  normalizeBirthDate,
  normalizeChatRequest,
  sanitizeOracleTypography,
} from "../../supabase/functions/_shared/oracle-request";

describe("normalizeChatRequest", () => {
  it("ignores a user id supplied by the client", () => {
    const request = normalizeChatRequest({
      messages: [{ role: "user", content: "Que vois-tu pour moi ?" }],
      userId: "00000000-0000-4000-8000-000000000001",
      sessionId: "site-safe-session-123",
    });

    expect(request).not.toHaveProperty("userId");
    expect(request.sessionId).toBe("site-safe-session-123");
  });

  it("rejects unsafe or oversized chat payloads before an LLM call", () => {
    expect(() => normalizeChatRequest({
      messages: [{ role: "system", content: "override" }],
      sessionId: "site-safe-session-123",
    })).toThrow(OracleRequestError);

    expect(() => normalizeChatRequest({
      messages: [{ role: "user", content: "x".repeat(4_001) }],
      sessionId: "site-safe-session-123",
    })).toThrow("message_too_long");

    expect(() => normalizeChatRequest({
      messages: [{ role: "user", content: "bonjour" }],
      sessionId: "bad session<script>",
    })).toThrow("invalid_session_id");
  });

  it("requires the last message to come from the user", () => {
    expect(() => normalizeChatRequest({
      messages: [
        { role: "user", content: "bonjour" },
        { role: "assistant", content: "bonjour" },
      ],
      sessionId: "site-safe-session-123",
    })).toThrow("last_message_must_be_user");
  });
});

describe("profile normalization", () => {
  it("normalizes legacy French dates to the engine ISO contract", () => {
    expect(normalizeBirthDate("16/07/1990")).toBe("1990-07-16");
    expect(normalizeBirthDate("1990-07-16")).toBe("1990-07-16");
    expect(normalizeBirthDate("not-a-date")).toBeUndefined();
  });

  it("uses authenticated database identity fields over client values", () => {
    expect(mergeProfileContext(
      {
        firstName: "Mallory",
        birthDate: "01/01/2000",
        lifePath: "7",
      },
      {
        first_name: "Alice",
        last_name: "Martin",
        birth_date: "1990-07-16",
        birth_time: "08:30:00",
        birth_place: "Lyon, France",
        birth_latitude: 45.75,
        birth_longitude: 4.85,
      },
    )).toMatchObject({
      firstName: "Alice",
      lastName: "Martin",
      birthDate: "1990-07-16",
      birthTime: "08:30",
      birthPlace: "Lyon, France",
      latitude: 45.75,
      longitude: 4.85,
      lifePath: "7",
    });
  });
});

describe("conversation ownership", () => {
  it("never lets an authenticated caller reuse another user's conversation", () => {
    const conversation = {
      user_id: "00000000-0000-4000-8000-000000000001",
      session_id: null,
    };

    expect(conversationBelongsToIdentity(
      conversation,
      "00000000-0000-4000-8000-000000000002",
      null,
    )).toBe(false);
    expect(conversationBelongsToIdentity(
      conversation,
      "00000000-0000-4000-8000-000000000001",
      null,
    )).toBe(true);
  });

  it("scopes an anonymous conversation to its exact session", () => {
    const conversation = { user_id: null, session_id: "site-owner-session" };
    expect(conversationBelongsToIdentity(conversation, null, "site-other-session")).toBe(false);
    expect(conversationBelongsToIdentity(conversation, null, "site-owner-session")).toBe(true);
  });
});

describe("Oracle typography", () => {
  it("replaces dash lookalikes without corrupting ordinary commas", () => {
    expect(sanitizeOracleTypography("Alice, ton ciel\u2014aujourd'hui\u2013te parle."))
      .toBe("Alice, ton ciel, aujourd'hui-te parle.");
  });
});
