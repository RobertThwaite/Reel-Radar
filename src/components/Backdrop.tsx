"use client";

import { useState } from "react";
import { tmdbImage } from "@/lib/format";

/**
 * The full-bleed blurred still behind everything.
 *
 * The incoming image is rendered transparent and only fades in once the browser
 * reports it loaded, over a layer still holding the previous still — so moving
 * between films dissolves instead of flashing black on a slow connection.
 */
export function Backdrop({ path }: { path: string | null }) {
  const url = tmdbImage(path, "w1280");
  /** The last still that finished loading; stays on screen under the incoming one. */
  const [settled, setSettled] = useState<string | null>(null);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#1a1526_0%,#070709_62%)]" />

      {settled && settled !== url && <Layer src={settled} visible />}

      {url && (
        <Layer
          key={url}
          src={url}
          visible={settled === url}
          onLoad={() => setSettled(url)}
        />
      )}
    </div>
  );
}

function Layer({ src, visible, onLoad }: { src: string; visible: boolean; onLoad?: () => void }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative layer; we need the raw load event to time the dissolve
    <img
      src={src}
      alt=""
      onLoad={onLoad}
      className={`absolute inset-0 size-full scale-[1.18] object-cover transition-opacity duration-[1200ms] ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ filter: "blur(36px) saturate(0.55) brightness(0.22)" }}
    />
  );
}
