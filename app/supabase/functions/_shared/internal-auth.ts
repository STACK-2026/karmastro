const BEARER_RE = /^Bearer\s+(.+)$/i;

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function isAuthorizedServiceRequest(
  authorizationHeader: string | null | undefined,
  configuredSecret: string | null | undefined,
): boolean {
  if (!configuredSecret) return false;

  const match = (authorizationHeader?.trim() || "").match(BEARER_RE);
  const token = match?.[1];
  if (!token) return false;

  return timingSafeEqual(token, configuredSecret);
}
