const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;

export function normalizeEmailIdempotencyKey(
  value: string | null | undefined,
): string | null {
  const key = String(value || "").trim();
  return IDEMPOTENCY_KEY_RE.test(key) ? key : null;
}
