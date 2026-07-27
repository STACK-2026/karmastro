export type EncryptedPendingTurn = {
  ciphertext: string;
  iv: string;
  keyVersion: number;
};

function decodeKey(secret: string, label: string): Uint8Array {
  if (!secret) throw new Error(`${label}_missing`);
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(secret), (char) => char.charCodeAt(0));
  } catch {
    throw new Error(`${label}_invalid`);
  }
  if (bytes.length !== 32) throw new Error(`${label}_invalid`);
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

export async function encryptPendingTurn(
  text: string,
  secret: string,
  keyVersion = 1,
): Promise<EncryptedPendingTurn> {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(decodeKey(secret, "pending_turn_encryption_key")),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text),
  );
  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
    iv: encodeBase64(iv),
    keyVersion,
  };
}

export async function decryptPendingTurn(
  encrypted: EncryptedPendingTurn,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(decodeKey(secret, "pending_turn_encryption_key")),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(decodeBase64(encrypted.iv)) },
    key,
    toArrayBuffer(decodeBase64(encrypted.ciphertext)),
  );
  return new TextDecoder().decode(plaintext);
}

export async function sessionHmac(
  sessionId: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(decodeKey(secret, "pending_turn_session_hmac_key")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(sessionId),
  );
  return encodeBase64(new Uint8Array(signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
