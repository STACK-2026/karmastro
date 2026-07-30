import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ANTHROPIC_FALLBACK_MODEL,
  generateOracleReply,
  type OracleLlmEnv,
  type OracleLlmMessage,
} from "./oracle-llm.ts";

// These tests never touch real Deno.env or the network: generateOracleReply()
// accepts an injectable `env` + `fetchImpl`, so the whole suite runs without
// --allow-env / --allow-net (same convention as reading-generator.test.ts,
// which never exercises the Deno.env-calling generateReading()).

function fakeEnv(vars: Record<string, string | undefined>): OracleLlmEnv {
  return { get: (name: string) => vars[name] };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(status: number, body: string): Response {
  return new Response(body, { status });
}

type Call = { url: string; init: RequestInit };

function fetchQueue(responses: Response[]): { fetchImpl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  let i = 0;
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    const response = responses[i];
    i += 1;
    if (!response) {
      throw new Error(`fetchQueue exhausted after ${calls.length} calls`);
    }
    return Promise.resolve(response);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const messages: OracleLlmMessage[] = [
  { role: "user", content: "Bonjour" },
];

const generationConfig = { maxOutputTokens: 3072, temperature: 0.9 };

Deno.test("Gemini OK -> provider gemini, une seule requête", async () => {
  const { fetchImpl, calls } = fetchQueue([
    jsonResponse(200, {
      candidates: [{ content: { parts: [{ text: "Reponse Gemini" }] } }],
    }),
  ]);
  const env = fakeEnv({ GOOGLE_API_KEY: "goog-key", ANTHROPIC_API_KEY: "anthropic-key" });

  const reply = await generateOracleReply({
    systemPrompt: "system",
    messages,
    generationConfig,
    env,
    fetchImpl,
  });

  assertEquals(reply.provider, "gemini");
  assertEquals(reply.text, "Reponse Gemini");
  assertEquals(calls.length, 1);
  assertEquals(calls[0].url.includes("generativelanguage.googleapis.com"), true);
});

Deno.test("Gemini 429 sur les deux modeles -> bascule Anthropic", async () => {
  const { fetchImpl, calls } = fetchQueue([
    textResponse(429, JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED" } })),
    textResponse(429, JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED" } })),
    jsonResponse(200, { content: [{ type: "text", text: "Reponse Claude" }] }),
  ]);
  const env = fakeEnv({ GOOGLE_API_KEY: "goog-key", ANTHROPIC_API_KEY: "anthropic-key" });

  const reply = await generateOracleReply({
    systemPrompt: "system",
    messages,
    generationConfig,
    env,
    fetchImpl,
  });

  assertEquals(reply.provider, "anthropic");
  assertEquals(reply.text, "Reponse Claude");
  assertEquals(calls.length, 3);
  assertEquals(calls[2].url, "https://api.anthropic.com/v1/messages");
  const anthropicBody = JSON.parse(String(calls[2].init.body));
  assertEquals(anthropicBody.model, ANTHROPIC_FALLBACK_MODEL);
  assertEquals(anthropicBody.system, "system");
  assertEquals(anthropicBody.max_tokens, generationConfig.maxOutputTokens);
  assertEquals(anthropicBody.temperature, generationConfig.temperature);
  const headers = calls[2].init.headers as Record<string, string>;
  assertEquals(headers["x-api-key"], "anthropic-key");
  assertEquals(headers["anthropic-version"], "2023-06-01");
});

Deno.test("Gemini 400 (requete invalide) -> propage sans fallback", async () => {
  const { fetchImpl, calls } = fetchQueue([
    textResponse(400, JSON.stringify({ error: { message: "invalid request" } })),
  ]);
  const env = fakeEnv({ GOOGLE_API_KEY: "goog-key", ANTHROPIC_API_KEY: "anthropic-key" });

  await assertRejects(
    () =>
      generateOracleReply({
        systemPrompt: "system",
        messages,
        generationConfig,
        env,
        fetchImpl,
      }),
    Error,
    "non-recoverable error 400",
  );
  // Non-recoverable: no retry on the Gemini fallback model, no Anthropic call.
  assertEquals(calls.length, 1);
});

Deno.test("ANTHROPIC_API_KEY absente -> pas de fallback, l'erreur Gemini remonte", async () => {
  const { fetchImpl, calls } = fetchQueue([
    textResponse(429, "quota exceeded"),
    textResponse(429, "quota exceeded"),
  ]);
  const env = fakeEnv({ GOOGLE_API_KEY: "goog-key" }); // no ANTHROPIC_API_KEY

  await assertRejects(
    () =>
      generateOracleReply({
        systemPrompt: "system",
        messages,
        generationConfig,
        env,
        fetchImpl,
      }),
    Error,
    "recoverable error 429",
  );
  // Both Gemini models tried, but no third (Anthropic) call was attempted.
  assertEquals(calls.length, 2);
});

Deno.test("ORACLE_LLM_FALLBACK vide -> desactive le fallback meme si la clef existe", async () => {
  const { fetchImpl, calls } = fetchQueue([
    textResponse(500, "server error"),
    textResponse(500, "server error"),
  ]);
  const env = fakeEnv({
    GOOGLE_API_KEY: "goog-key",
    ANTHROPIC_API_KEY: "anthropic-key",
    ORACLE_LLM_FALLBACK: "",
  });

  await assertRejects(
    () =>
      generateOracleReply({
        systemPrompt: "system",
        messages,
        generationConfig,
        env,
        fetchImpl,
      }),
    Error,
  );
  assertEquals(calls.length, 2);
});

Deno.test("reponse Gemini vide (candidates absents) -> bascule Anthropic", async () => {
  const { fetchImpl, calls } = fetchQueue([
    jsonResponse(200, { candidates: [] }),
    jsonResponse(200, { candidates: [] }),
    jsonResponse(200, { content: [{ type: "text", text: "Reponse Claude" }] }),
  ]);
  const env = fakeEnv({ GOOGLE_API_KEY: "goog-key", ANTHROPIC_API_KEY: "anthropic-key" });

  const reply = await generateOracleReply({
    systemPrompt: "system",
    messages,
    generationConfig,
    env,
    fetchImpl,
  });

  assertEquals(reply.provider, "anthropic");
  assertEquals(calls.length, 3);
});
