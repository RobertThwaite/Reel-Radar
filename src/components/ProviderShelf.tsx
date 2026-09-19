import Image from "next/image";
import { tmdbImage } from "@/lib/format";
import type { OfferGroup } from "@/lib/types";

const ACCENT: Record<OfferGroup["kind"], string> = {
  stream: "text-gold",
  free: "text-emerald-300",
  rent: "text-sky-300",
  buy: "text-haze",
};

/**
 * One row of services for a given way of watching. The whole row is a link out
 * to JustWatch when TMDB gives us a deep link — TMDB's terms require that
 * attribution anyway, and it's where the actual "watch now" button lives.
 */
export function ProviderShelf({ group, link }: { group: OfferGroup; link: string | null }) {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline gap-3">
        <h3 className={`marquee text-sm ${ACCENT[group.kind]}`}>{group.label}</h3>
        <span className="hidden text-xs text-haze sm:inline">{group.blurb}</span>
      </header>

      <ul className="flex flex-wrap gap-2.5">
        {group.offers.map((offer) => {
          const logo = tmdbImage(offer.logoPath, "w92");
          const body = (
            <>
              <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-edge">
                {logo ? (
                  <Image src={logo} alt="" width={36} height={36} className="size-full object-cover" unoptimized />
                ) : (
                  <span className="marquee flex size-full items-center justify-center text-[10px] text-haze">
                    {offer.name.slice(0, 2)}
                  </span>
                )}
              </span>
              <span className="truncate text-sm font-medium text-bone">{offer.name}</span>
            </>
          );

          const shared =
            "flex items-center gap-2.5 rounded-2xl border border-bone/10 bg-bone/[0.04] py-1.5 pl-1.5 pr-3.5 transition";

          return (
            <li key={offer.providerId} className="min-w-0 max-w-full">
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={`Open ${offer.name} options on JustWatch`}
                  className={`${shared} hover:-translate-y-0.5 hover:border-gold/40 hover:bg-bone/[0.09]`}
                >
                  {body}
                </a>
              ) : (
                <span className={shared}>{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
