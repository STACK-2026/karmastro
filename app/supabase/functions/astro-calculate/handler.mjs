const ALLOWED_OPERATIONS = new Set([
  "natal-chart",
  "compatibility",
  "transits",
]);
const ALLOWED_ORIGINS = new Set([
  "https://karmastro.com",
  "https://www.karmastro.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);
const PAGES_PREVIEW_ORIGIN =
  /^https:\/\/[a-z0-9-]+\.karmastro-site\.pages\.dev$/;
const MAX_REQUEST_BYTES = 16_384;
const DEFAULT_TIMEOUT_MS = 15_000;

function isAllowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin) ||
    PAGES_PREVIEW_ORIGIN.test(origin);
}

function responseHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeBirthData(value) {
  if (!isPlainObject(value)) return null;

  const { year, month, day, hour, latitude, longitude } = value;
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < 1800 || year > currentYear) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  if (!isFiniteNumber(hour) || hour < 0 || hour >= 24) return null;
  if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) return null;
  if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }

  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) return null;

  return { year, month, day, hour, latitude, longitude };
}

function normalizePayload(operation, value) {
  if (operation === "compatibility") {
    if (!isPlainObject(value)) return null;
    const person1 = normalizeBirthData(value.person1);
    const person2 = normalizeBirthData(value.person2);
    return person1 && person2 ? { person1, person2 } : null;
  }

  return normalizeBirthData(value);
}

async function readLimitedBody(request) {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RangeError("request_too_large");
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_REQUEST_BYTES) {
        throw new RangeError("request_too_large");
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } finally {
    reader.releaseLock();
  }
}

export async function handleAstroRequest(request, options = {}) {
  const origin = request.headers.get("Origin") || "";

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return jsonResponse({ error: "forbidden_origin" }, 403, origin);
    }
    const headers = responseHeaders(origin);
    headers["Access-Control-Max-Age"] = "86400";
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  }
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: "forbidden_origin" }, 403, origin);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return jsonResponse({ error: "json_required" }, 415, origin);
  }

  let rawBody;
  try {
    rawBody = await readLimitedBody(request);
  } catch (error) {
    if (error instanceof RangeError) {
      return jsonResponse({ error: "request_too_large" }, 413, origin);
    }
    return jsonResponse({ error: "invalid_request" }, 400, origin);
  }

  let requestBody;
  try {
    requestBody = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, origin);
  }

  if (
    !isPlainObject(requestBody) ||
    !ALLOWED_OPERATIONS.has(requestBody.operation)
  ) {
    return jsonResponse({ error: "astro_operation_not_found" }, 404, origin);
  }

  const normalizedBody = normalizePayload(
    requestBody.operation,
    requestBody.payload,
  );
  if (!normalizedBody) {
    return jsonResponse({ error: "invalid_birth_data" }, 400, origin);
  }

  const engineUrl = String(options.engineUrl || "").replace(/\/+$/, "");
  if (!engineUrl) {
    return jsonResponse({ error: "astro_engine_unavailable" }, 503, origin);
  }

  const fetchImpl = options.fetchImpl || fetch;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  try {
    const upstream = await fetchImpl(`${engineUrl}/${requestBody.operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedBody),
      redirect: "error",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return jsonResponse({ error: "astro_engine_unavailable" }, 502, origin);
    }

    let result;
    try {
      result = await upstream.json();
    } catch {
      return jsonResponse(
        { error: "astro_engine_invalid_response" },
        502,
        origin,
      );
    }

    return jsonResponse(result, 200, origin);
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return jsonResponse(
      { error: timedOut ? "astro_engine_timeout" : "astro_engine_unavailable" },
      timedOut ? 504 : 502,
      origin,
    );
  } finally {
    clearTimeout(timeout);
  }
}
