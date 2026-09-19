"use client";

import { REGIONS } from "@/lib/regions";
import { GlobeIcon } from "./Icons";

/** Native select under a styled shell — on mobile that means the OS wheel picker,
 *  which beats any custom dropdown we could build. */
export function RegionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const current = REGIONS.find((r) => r.code === value);

  return (
    <div className="plate relative flex items-center gap-2 rounded-full py-2 pl-3 pr-2.5 transition focus-within:ring-1 focus-within:ring-gold/70">
      <GlobeIcon className="size-4 shrink-0 text-gold" />
      <span aria-hidden="true" className="text-sm tabular-nums text-bone">
        {current?.flag} {value}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Country for streaming availability"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {REGIONS.map((region) => (
          <option key={region.code} value={region.code} className="bg-ink-soft text-bone">
            {region.flag} {region.name}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 text-haze" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
