import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  decryptPendingTurn,
  encryptPendingTurn,
  sessionHmac,
} from "./pending-turn-crypto.ts";

const ENCRYPTION_KEY = "ERERERERERERERERERERERERERERERERERERERERERE=";
const HMAC_KEY = "IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiI=";

Deno.test("pending question is encrypted with a random nonce and can be decrypted", async () => {
  const text = "Je veux comprendre pourquoi cette décision me bloque.";
  const first = await encryptPendingTurn(text, ENCRYPTION_KEY);
  const second = await encryptPendingTurn(text, ENCRYPTION_KEY);

  assertNotEquals(first.ciphertext, text);
  assertNotEquals(first.ciphertext, second.ciphertext);
  assertNotEquals(first.iv, second.iv);
  assertEquals(await decryptPendingTurn(first, ENCRYPTION_KEY), text);
});

Deno.test("tampered pending ciphertext is rejected", async () => {
  const encrypted = await encryptPendingTurn("Question confidentielle", ENCRYPTION_KEY);
  const bytes = Uint8Array.from(atob(encrypted.ciphertext), (char) => char.charCodeAt(0));
  bytes[0] ^= 1;
  const tampered = {
    ...encrypted,
    ciphertext: btoa(String.fromCharCode(...bytes)),
  };

  await assertRejects(() => decryptPendingTurn(tampered, ENCRYPTION_KEY));
});

Deno.test("session HMAC is deterministic and never returns the raw session", async () => {
  const sessionId = "anon-session-123";
  const first = await sessionHmac(sessionId, HMAC_KEY);
  const second = await sessionHmac(sessionId, HMAC_KEY);

  assertEquals(first, second);
  assertEquals(first.includes(sessionId), false);
});

Deno.test("missing or invalid secrets fail closed", async () => {
  await assertRejects(() => encryptPendingTurn("Question", ""));
  await assertRejects(() => encryptPendingTurn("Question", "not-base64"));
  await assertRejects(() => sessionHmac("anon-session-123", ""));
});
