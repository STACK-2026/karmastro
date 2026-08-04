export type PricingSource = "direct" | "oracle_app_limit" | "oracle_site_limit";

const ATTRIBUTED_PRICING_SOURCES = new Set<PricingSource>([
  "oracle_app_limit",
  "oracle_site_limit",
]);

export function pricingSourceFromSearch(search: string): PricingSource {
  const params = new URLSearchParams(search);
  const sources = params.getAll("source");
  if (sources.length !== 1) return "direct";
  return ATTRIBUTED_PRICING_SOURCES.has(sources[0] as PricingSource)
    ? sources[0] as PricingSource
    : "direct";
}

export function pricingAttributionProperties({
  source,
  locale,
  isAuthenticated,
}: {
  source: PricingSource;
  locale: string;
  isAuthenticated: boolean;
}): Record<string, unknown> {
  return {
    source,
    locale,
    is_authenticated: isAuthenticated,
    journey_version: "oracle_conversation_v1",
  };
}
