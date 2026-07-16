export type OracleMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OracleProfileContext = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  lifePath?: string;
  expression?: string;
  soulUrge?: string;
  personalYear?: number | string;
  personalMonth?: number | string;
  personalDay?: number | string;
  karmicDebts?: string;
  northNode?: string;
};

export type DatabaseOracleProfile = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  birth_latitude?: number | string | null;
  birth_longitude?: number | string | null;
};

export type NormalizedChatRequest = {
  messages: OracleMessage[];
  profile: OracleProfileContext;
  guideKey: string;
  sessionId: string | null;
  conversationId: string | null;
  priorSummary: string | null;
};

export class OracleRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OracleRequestError";
    this.status = status;
  }
}

const SESSION_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 12_000;

function asTrimmedString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function asFiniteNumber(value: unknown, min: number, max: number): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1800 || year > new Date().getUTCFullYear() || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function normalizeBirthDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const input = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  const french = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  if (iso) {
    [, year, month, day] = iso.map(Number);
  } else if (french) {
    day = Number(french[1]);
    month = Number(french[2]);
    year = Number(french[3]);
  } else {
    return undefined;
  }

  if (!isRealDate(year, month, day)) return undefined;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeBirthTime(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return `${match[1]}:${match[2]}`;
}

function normalizeClientProfile(value: unknown): OracleProfileContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const profile = value as Record<string, unknown>;
  const output: OracleProfileContext = {};
  const addString = (key: keyof OracleProfileContext, max = 160) => {
    const next = asTrimmedString(profile[key], max);
    if (next !== undefined) (output as Record<string, unknown>)[key] = next;
  };

  addString("firstName", 60);
  addString("lastName", 60);
  addString("birthPlace", 160);
  addString("sunSign", 80);
  addString("moonSign", 80);
  addString("ascendant", 80);
  addString("lifePath", 100);
  addString("expression", 100);
  addString("soulUrge", 100);
  addString("karmicDebts", 200);
  addString("northNode", 200);

  const birthDate = normalizeBirthDate(profile.birthDate);
  if (birthDate) output.birthDate = birthDate;
  const birthTime = normalizeBirthTime(profile.birthTime);
  if (birthTime) output.birthTime = birthTime;

  const latitude = asFiniteNumber(profile.latitude, -90, 90);
  if (latitude !== undefined) output.latitude = latitude;
  const longitude = asFiniteNumber(profile.longitude, -180, 180);
  if (longitude !== undefined) output.longitude = longitude;

  for (const key of ["personalYear", "personalMonth", "personalDay"] as const) {
    const next = profile[key];
    if (typeof next === "number" && Number.isFinite(next)) output[key] = next;
    else {
      const text = asTrimmedString(next, 40);
      if (text) output[key] = text;
    }
  }

  return output;
}

export function normalizeChatRequest(value: unknown): NormalizedChatRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OracleRequestError("invalid_body");
  }
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    throw new OracleRequestError("invalid_messages");
  }

  let totalLength = 0;
  const messages = body.messages.map((raw): OracleMessage => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new OracleRequestError("invalid_message");
    }
    const message = raw as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") {
      throw new OracleRequestError("invalid_message_role");
    }
    if (typeof message.content !== "string" || !message.content.trim()) {
      throw new OracleRequestError("invalid_message_content");
    }
    const content = message.content.trim();
    if (content.length > MAX_MESSAGE_LENGTH) throw new OracleRequestError("message_too_long", 413);
    totalLength += content.length;
    return { role: message.role, content };
  });
  if (totalLength > MAX_TOTAL_LENGTH) throw new OracleRequestError("conversation_too_long", 413);
  if (messages[messages.length - 1].role !== "user") {
    throw new OracleRequestError("last_message_must_be_user");
  }

  let sessionId: string | null = null;
  if (body.sessionId !== undefined && body.sessionId !== null && body.sessionId !== "") {
    if (typeof body.sessionId !== "string" || !SESSION_ID_RE.test(body.sessionId.trim())) {
      throw new OracleRequestError("invalid_session_id");
    }
    sessionId = body.sessionId.trim();
  }

  let conversationId: string | null = null;
  if (body.conversationId !== undefined && body.conversationId !== null && body.conversationId !== "") {
    if (typeof body.conversationId !== "string" || !UUID_RE.test(body.conversationId.trim())) {
      throw new OracleRequestError("invalid_conversation_id");
    }
    conversationId = body.conversationId.trim();
  }

  const guideKey = asTrimmedString(body.guide, 32) || "oracle";
  const priorSummary = asTrimmedString(body.priorSummary, 4_000) || null;

  return {
    messages,
    profile: normalizeClientProfile(body.profile),
    guideKey,
    sessionId,
    conversationId,
    priorSummary,
  };
}

export function mergeProfileContext(
  clientProfile: OracleProfileContext | null | undefined,
  databaseProfile: DatabaseOracleProfile | null | undefined,
): OracleProfileContext {
  const merged = normalizeClientProfile(clientProfile || {});
  if (!databaseProfile) return merged;

  const firstName = asTrimmedString(databaseProfile.first_name, 60);
  if (firstName) merged.firstName = firstName;
  const lastName = asTrimmedString(databaseProfile.last_name, 60);
  if (lastName) merged.lastName = lastName;
  const birthDate = normalizeBirthDate(databaseProfile.birth_date);
  if (birthDate) merged.birthDate = birthDate;
  const birthTime = normalizeBirthTime(databaseProfile.birth_time);
  if (birthTime) merged.birthTime = birthTime;
  const birthPlace = asTrimmedString(databaseProfile.birth_place, 160);
  if (birthPlace) merged.birthPlace = birthPlace;

  const latitude = asFiniteNumber(databaseProfile.birth_latitude, -90, 90);
  if (latitude !== undefined) merged.latitude = latitude;
  const longitude = asFiniteNumber(databaseProfile.birth_longitude, -180, 180);
  if (longitude !== undefined) merged.longitude = longitude;

  return merged;
}

export function conversationBelongsToIdentity(
  conversation: { user_id?: string | null; session_id?: string | null } | null | undefined,
  userId: string | null,
  sessionId: string | null,
): boolean {
  if (!conversation) return false;
  if (userId) return conversation.user_id === userId;
  return !conversation.user_id && Boolean(sessionId) && conversation.session_id === sessionId;
}

export function sanitizeOracleTypography(value: string): string {
  return value
    .replace(/\u2014/g, ", ")
    .replace(/\u2013/g, "-")
    .replace(/\u2015/g, ", ")
    .replace(/\uFE58/g, "-")
    .replace(/\uFF0D/g, "-")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}
