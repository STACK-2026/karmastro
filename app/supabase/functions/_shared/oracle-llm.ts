// INDÉPENDANCE FOURNISSEUR de l'Oracle.
//
// Gemini (tier gratuit) reste le moteur PRIMAIRE. Quand Gemini échoue de
// façon récupérable (quota épuisé / 429 / RESOURCE_EXHAUSTED / 5xx / timeout
// réseau / réponse vide sans candidates), on bascule automatiquement sur
// Anthropic Claude (claude-haiku-4-5, rapide et peu cher) pour que l'Oracle
// ne tombe jamais à cause d'un seul fournisseur. [2026-07-30]
//
// `env` et `fetchImpl` sont injectables : en production ils retombent sur
// Deno.env / fetch. En test, on injecte des doublures pour ne jamais avoir
// besoin de --allow-env / --allow-net (convention déjà suivie ailleurs dans
// _shared/, cf. reading-generator.ts dont generateReading() n'est jamais
// exercée par les tests).

import {
  FALLBACK_GEMINI_MODEL,
  geminiGenerationConfig,
  PRIMARY_GEMINI_MODEL,
} from "./oracle-conversation-policy.ts";

export type OracleLlmProvider = "gemini" | "anthropic";

export type OracleLlmMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OracleLlmGenerationConfig = {
  maxOutputTokens: number;
  temperature: number;
  thinkingConfig?: { thinkingBudget: number };
};

export type OracleLlmReply = {
  text: string;
  provider: OracleLlmProvider;
};

// Minimal seam over Deno.env — structurally compatible, so `Deno.env` itself
// satisfies this type without a wrapper.
export type OracleLlmEnv = { get(name: string): string | undefined };

export type GenerateOracleReplyParams = {
  systemPrompt: string;
  messages: OracleLlmMessage[];
  generationConfig: OracleLlmGenerationConfig;
  /** Injectable for tests. Defaults to Deno.env. */
  env?: OracleLlmEnv;
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

export const ANTHROPIC_FALLBACK_MODEL = "claude-haiku-4-5-20251001";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const GEMINI_TIMEOUT_MS = 20_000;
const ANTHROPIC_TIMEOUT_MS = 25_000;

// Recoverable Gemini/network conditions that justify moving on to the next
// model/provider. Anything else (e.g. HTTP 400 malformed body) propagates
// immediately — never silently retried on a different provider.
class OracleLlmRecoverableError extends Error {
  readonly reason: string;
  constructor(reason: string, message: string) {
    super(message);
    this.reason = reason;
  }
}

function logOracleLlm(
  provider: OracleLlmProvider,
  detail: string,
  isWarning = false,
): void {
  // No PII, no secrets: only provider name + a short machine reason string.
  const line = `oracle-llm provider=${provider} ${detail}`;
  if (isWarning) console.warn(line);
  else console.log(line);
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function isRecoverableGeminiStatus(status: number, bodyText: string): boolean {
  if (status === 429) return true;
  if (status >= 500) return true;
  if (/RESOURCE_EXHAUSTED/i.test(bodyText)) return true;
  return false;
}

async function callGeminiModel(
  model: string,
  systemPrompt: string,
  messages: OracleLlmMessage[],
  fetchImpl: typeof fetch,
  apiKey: string,
): Promise<string> {
  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let response: Response;
  try {
    response = await fetchWithTimeout(
      fetchImpl,
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          // gemini-2.5-flash is a "thinking" model. With no thinkingConfig its
          // (dynamic, unbounded) reasoning tokens are billed against
          // maxOutputTokens, so on high-thinking draws the visible answer is
          // truncated mid-sentence and the ---SUGGESTIONS--- block never
          // appears (root cause of the "réponses nulles" reported 31/05).
          // Cap thinking at 512 and raise the output ceiling so the answer
          // always has >=2560 tokens of headroom. [2026-05-31]
          generationConfig: geminiGenerationConfig(model),
        }),
      },
      GEMINI_TIMEOUT_MS,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new OracleLlmRecoverableError(
      "network_or_timeout",
      `gemini fetch failed (${model}): ${message}`,
    );
  }

  if (!response.ok) {
    const bodyText = await safeText(response);
    if (isRecoverableGeminiStatus(response.status, bodyText)) {
      throw new OracleLlmRecoverableError(
        `http_${response.status}`,
        `gemini ${model} recoverable error ${response.status}: ${bodyText.slice(0, 300)}`,
      );
    }
    throw new Error(
      `gemini ${model} non-recoverable error ${response.status}: ${bodyText.slice(0, 300)}`,
    );
  }

  const data = await response.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p?.text || "")
    .join("");
  if (!text) {
    throw new OracleLlmRecoverableError(
      "empty_response",
      `gemini ${model} returned no candidates/text`,
    );
  }
  return text;
}

async function callAnthropic(
  systemPrompt: string,
  messages: OracleLlmMessage[],
  generationConfig: OracleLlmGenerationConfig,
  fetchImpl: typeof fetch,
  apiKey: string,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      fetchImpl,
      ANTHROPIC_API_URL,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: ANTHROPIC_FALLBACK_MODEL,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: generationConfig.maxOutputTokens,
          temperature: generationConfig.temperature,
        }),
      },
      ANTHROPIC_TIMEOUT_MS,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`anthropic fetch failed: ${message}`);
  }

  if (!response.ok) {
    const bodyText = await safeText(response);
    throw new Error(`anthropic error ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = (data?.content ?? [])
    .filter((block: { type?: string }) => block?.type === "text")
    .map((block: { text?: string }) => block?.text || "")
    .join("");
  if (!text) {
    throw new Error("anthropic returned no text content");
  }
  return text;
}

/**
 * Generate the Oracle's next reply. Tries Gemini (primary model, then the
 * stable fallback model) exactly like before this change. If both Gemini
 * attempts fail RECOVERABLY (quota/429/RESOURCE_EXHAUSTED/5xx/timeout/empty
 * response), bascule automatically onto Anthropic — unless disabled via
 * ORACLE_LLM_FALLBACK or ANTHROPIC_API_KEY is not configured, in which case
 * the original Gemini failure propagates (Gemini-only behavior, unchanged).
 *
 * Non-recoverable errors (e.g. HTTP 400 malformed request) propagate
 * immediately without trying any other model or provider.
 */
export async function generateOracleReply(
  params: GenerateOracleReplyParams,
): Promise<OracleLlmReply> {
  const { systemPrompt, messages, generationConfig } = params;
  const env: OracleLlmEnv = params.env ?? Deno.env;
  const fetchImpl: typeof fetch = params.fetchImpl ?? fetch;

  const googleApiKey = env.get("GOOGLE_API_KEY") || "";
  if (!googleApiKey) throw new Error("GOOGLE_API_KEY non configurée");

  let lastRecoverableError: unknown = null;
  for (const model of [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL]) {
    try {
      const text = await callGeminiModel(model, systemPrompt, messages, fetchImpl, googleApiKey);
      logOracleLlm("gemini", `model=${model} ok`);
      return { text, provider: "gemini" };
    } catch (err) {
      if (!(err instanceof OracleLlmRecoverableError)) {
        // Non-recoverable: propagate immediately. No Gemini-fallback-model
        // attempt, no Anthropic bascule — matches pre-existing behavior
        // (only 429 ever triggered the Gemini->Gemini-fallback retry).
        throw err;
      }
      lastRecoverableError = err;
      logOracleLlm("gemini", `model=${model} reason=${err.reason}`, true);
    }
  }

  // Both Gemini attempts failed recoverably: bascule sur Anthropic.
  const fallbackMode = env.get("ORACLE_LLM_FALLBACK") ?? "anthropic";
  if (fallbackMode !== "anthropic") {
    logOracleLlm("gemini", "fallback disabled via ORACLE_LLM_FALLBACK", true);
    throw lastRecoverableError;
  }

  const anthropicApiKey = env.get("ANTHROPIC_API_KEY") || "";
  if (!anthropicApiKey) {
    logOracleLlm("gemini", "ANTHROPIC_API_KEY absente, pas de fallback possible", true);
    throw lastRecoverableError;
  }

  const text = await callAnthropic(systemPrompt, messages, generationConfig, fetchImpl, anthropicApiKey);
  logOracleLlm("anthropic", "served after gemini exhausted");
  return { text, provider: "anthropic" };
}
