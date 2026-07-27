export const ORACLE_ACTIVATION_JOURNEY_VERSION = "oracle_activation_v1";

export type OracleLimitSurface =
  | "anonymous_signup_wall_v1"
  | "authenticated_interim_limit_v1";

export type OracleLimitState = {
  surface: OracleLimitSurface;
  nextAvailableAt: string;
  pendingTurnId: string;
};

const LIMIT_SURFACES = new Set<OracleLimitSurface>([
  "anonymous_signup_wall_v1",
  "authenticated_interim_limit_v1",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assignPendingTurnId<T extends { pendingTurnId?: string }>(
  items: readonly T[],
  pendingTurnId: string,
  targetIndex: number,
): T[] {
  return items.map((item, index) => {
    if (index === targetIndex) return { ...item, pendingTurnId };
    if (item.pendingTurnId !== pendingTurnId) return item;
    const { pendingTurnId: _removed, ...withoutPendingTurnId } = item;
    return withoutPendingTurnId as T;
  });
}

export function normalizeOracleLimitResponse(value: unknown): OracleLimitState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    data.pending_turn !== true
    || typeof data.surface !== "string"
    || !LIMIT_SURFACES.has(data.surface as OracleLimitSurface)
    || typeof data.next_available_at !== "string"
    || !Number.isFinite(Date.parse(data.next_available_at))
    || typeof data.pending_turn_id !== "string"
    || !UUID_RE.test(data.pending_turn_id)
  ) {
    return null;
  }
  return {
    surface: data.surface as OracleLimitSurface,
    nextAvailableAt: data.next_available_at,
    pendingTurnId: data.pending_turn_id,
  };
}

function localDateKey(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatOracleAvailability(
  nextAvailableAt: string,
  locale: string,
  now = new Date(),
): { relation: "today" | "tomorrow" | "later"; time: string } {
  const next = new Date(nextAvailableAt);
  const today = localDateKey(now, locale);
  const tomorrow = localDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), locale);
  const target = localDateKey(next, locale);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(next);
  return {
    relation: target === today ? "today" : target === tomorrow ? "tomorrow" : "later",
    time,
  };
}
