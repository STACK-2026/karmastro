import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isOracleAutomatedUserAgent,
} from "./oracle-bot-policy.ts";

Deno.test("rejects declared search, AI and headless crawlers", () => {
  const automated = [
    "Mozilla/5.0 (Linux; Android 6.0.1) AppleWebKit/537.36 Chrome/41.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    "Mozilla/5.0 HeadlessChrome/126.0.0.0 Safari/537.36",
    "curl/8.7.1",
  ];

  for (const userAgent of automated) {
    assertEquals(isOracleAutomatedUserAgent(userAgent), true, userAgent);
  }
});

Deno.test("allows real browsers, including device names containing bot", () => {
  const browsers = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; CUBOT KINGKONG 9) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36 WhatsApp/2.24.14.81",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
  ];

  for (const userAgent of browsers) {
    assertFalse(isOracleAutomatedUserAgent(userAgent), userAgent);
  }
});

Deno.test("rejects requests without a user-agent", () => {
  assertEquals(isOracleAutomatedUserAgent(null), true);
  assertEquals(isOracleAutomatedUserAgent("  "), true);
});
