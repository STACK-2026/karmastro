// Keep this list precise. A generic /bot/i check would reject real Android
// devices whose model name contains "CUBOT".
const AUTOMATED_USER_AGENT_RE = /(?:Googlebot|GoogleOther|Google-InspectionTool|Google-Read-Aloud|AdsBot-Google|Mediapartners-Google|bingbot|BingPreview|DuckDuckBot|YandexBot|Baiduspider|Sogou|Slurp|Applebot|PetalBot|SemrushBot|AhrefsBot|MJ12bot|DotBot|GPTBot|ChatGPT-User|OAI-SearchBot|Google-Extended|ClaudeBot|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Bytespider|CCBot|cohere-ai|Diffbot|Amazonbot|YouBot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|TelegramBot|HeadlessChrome|Chrome-Lighthouse|Lighthouse|PageSpeed|PhantomJS|Playwright|Puppeteer|curl\/|Wget\/|python-requests|python-httpx|aiohttp|node-fetch|undici)/i;

export function isOracleAutomatedUserAgent(
  userAgent: string | null | undefined,
): boolean {
  const normalized = userAgent?.trim() || "";
  if (!normalized) return true;
  return AUTOMATED_USER_AGENT_RE.test(normalized);
}
