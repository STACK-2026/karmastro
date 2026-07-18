export const POST_AUTH_PATH_KEY = "karmastro_post_auth_path";
export const ORACLE_HANDOFF_SESSION_KEY = "karmastro_oracle_session";

const ALLOWED_POST_AUTH_PATHS = new Set(["/dashboard", "/oracle", "/astral", "/pricing"]);

export function sanitizePostAuthPath(value: string | null | undefined): string {
  if (!value || !ALLOWED_POST_AUTH_PATHS.has(value)) return "/dashboard";
  return value;
}

export function storePostAuthPath(value: string | null | undefined): string {
  const path = sanitizePostAuthPath(value);
  localStorage.setItem(POST_AUTH_PATH_KEY, path);
  return path;
}

export function getPostAuthPath(): string {
  return sanitizePostAuthPath(localStorage.getItem(POST_AUTH_PATH_KEY));
}

export function clearPostAuthPath(): void {
  localStorage.removeItem(POST_AUTH_PATH_KEY);
}
