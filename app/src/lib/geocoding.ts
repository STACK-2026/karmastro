// Geocoding via Nominatim (OpenStreetMap, gratuit, pas de clé)
// Policy : max 1 req/sec, User-Agent obligatoire.
// Doc : https://nominatim.org/release-docs/latest/api/Search/

export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  country: string | null;
  countryCode: string | null;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1&accept-language=fr`;
    const resp = await fetch(url, {
      headers: {
        // Nominatim requires a custom User-Agent (browser sends its own, which is OK)
        Accept: "application/json",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const r = data[0];
    return {
      displayName: r.display_name || q,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      country: r.address?.country || null,
      countryCode: r.address?.country_code || null,
    };
  } catch (e) {
    console.warn("[geocoding] failed", e);
    return null;
  }
}

/**
 * Debounced hook-style wrapper — appelle le callback après delayMs ms d'inactivité.
 * Usage:
 *   const debounced = useDebounced((q) => geocodePlace(q).then(setGeoResult), 500);
 *   <Input onChange={e => debounced(e.target.value)} />
 */
export function createDebouncer<T extends (...args: any[]) => void>(fn: T, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
