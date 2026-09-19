/** Curated set of TMDB watch-provider regions. TMDB supports ~90; these are the
 *  ones people actually ask for, kept local so the picker needs no extra round trip. */
export const REGIONS = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
] as const;

export type RegionCode = (typeof REGIONS)[number]["code"];

const CODES = new Set<string>(REGIONS.map((r) => r.code));

export const DEFAULT_REGION =
  (process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "GB").toUpperCase();

/** Accepts anything (query strings, localStorage), returns a region we can serve. */
export function normaliseRegion(input: string | null | undefined): string {
  const code = (input ?? "").trim().toUpperCase();
  if (CODES.has(code)) return code;
  return CODES.has(DEFAULT_REGION) ? DEFAULT_REGION : "GB";
}

export function regionName(code: string): string {
  return REGIONS.find((r) => r.code === code)?.name ?? code;
}
