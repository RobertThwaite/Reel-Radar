import Image from "next/image";
import { formatRuntime, tmdbImage } from "@/lib/format";
import { regionName } from "@/lib/regions";
import type { TitleDetail } from "@/lib/types";
import { ProviderShelf } from "./ProviderShelf";
import { ArrowIcon, StarIcon, TicketIcon } from "./Icons";

/** Films and series share this panel; the meta line and credits differ. */
export function TitlePanel({ title: item }: { title: TitleDetail }) {
  const poster = tmdbImage(item.posterPath, "w500");
  const isSeries = item.kind === "tv";

  const meta = [runYears(item), lengthLabel(item), item.certification].filter(Boolean) as string[];
  const credits = isSeries
    ? { label: "Creator", people: item.creators }
    : { label: "Director", people: item.director ? [item.director] : [] };

  return (
    <article className="animate-fade-up">
      <div className="plate overflow-hidden rounded-card">
        <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          {/* Poster */}
          <div className="mx-auto w-32 shrink-0 sm:w-40 md:mx-0 md:w-full">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-edge shadow-2xl shadow-black/70 ring-1 ring-bone/15">
              {poster ? (
                <Image
                  src={poster}
                  alt={`${item.title} poster`}
                  fill
                  sizes="(max-width: 768px) 160px, 220px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <span className="marquee absolute inset-0 flex items-center justify-center text-xs text-haze">
                  No poster
                </span>
              )}
            </div>
          </div>

          {/* Headline block */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <KindBadge kind={item.kind} />
              {isSeries && item.status && <StatusBadge status={item.status} />}
            </div>

            <h2 className="marquee mt-2.5 text-balance text-3xl leading-[1.05] text-bone sm:text-4xl lg:text-5xl">
              {item.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-haze">
              {meta.map((entry, i) => (
                <span key={entry} className="flex items-center gap-3">
                  {i > 0 && <span className="text-edge">•</span>}
                  <span
                    className={
                      entry === item.certification
                        ? "rounded border border-bone/25 px-1.5 text-xs text-bone"
                        : ""
                    }
                  >
                    {entry}
                  </span>
                </span>
              ))}
              {item.rating ? (
                <span className="flex items-center gap-1.5 text-bone">
                  <StarIcon className="size-3.5 text-gold" />
                  <span className="font-medium">{item.rating.toFixed(1)}</span>
                  <span className="text-xs text-haze">/10</span>
                </span>
              ) : null}
            </div>

            {item.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {item.genres.map((genre) => (
                  <li key={genre} className="rounded-full border border-bone/10 px-2.5 py-0.5 text-xs text-haze">
                    {genre}
                  </li>
                ))}
              </ul>
            )}

            {item.tagline && (
              <p className="mt-5 text-pretty font-medium italic text-gold/90">&ldquo;{item.tagline}&rdquo;</p>
            )}

            {item.overview && (
              <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-bone/80">{item.overview}</p>
            )}

            {(credits.people.length > 0 || item.cast.length > 0) && (
              <dl className="mt-5 space-y-1.5 text-sm">
                {credits.people.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="marquee w-16 shrink-0 text-[11px] leading-5 text-haze">{credits.label}</dt>
                    <dd className="text-bone/85">{credits.people.join(", ")}</dd>
                  </div>
                )}
                {item.cast.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="marquee w-16 shrink-0 text-[11px] leading-5 text-haze">Starring</dt>
                    <dd className="text-bone/85">{item.cast.join(", ")}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>

        <div className="gold-rule h-px" />

        {/* Where to watch */}
        <div className="space-y-7 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="marquee flex items-center gap-2 text-lg text-bone">
              <TicketIcon className="size-5 text-gold" />
              Where to watch
            </h3>
            <span className="text-xs text-haze">in {regionName(item.region)}</span>
          </div>

          {item.groups.length > 0 ? (
            <>
              <div className="space-y-7">
                {item.groups.map((group) => (
                  <ProviderShelf key={group.kind} group={group} link={item.justWatchLink} />
                ))}
              </div>
              {item.justWatchLink && (
                <a
                  href={item.justWatchLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-gold transition hover:text-bone"
                >
                  See prices and open on JustWatch
                  <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              )}
            </>
          ) : (
            <NoOffers item={item} />
          )}
        </div>
      </div>
    </article>
  );
}

/** "2017" for a film; "2022–2025" or "2022–present" for a series. */
function runYears(item: TitleDetail): string | null {
  if (!item.year) return null;
  if (item.kind === "movie") return item.year;
  const ongoing = item.status === "Returning Series" || item.status === "In Production";
  if (ongoing) return `${item.year}–present`;
  if (item.endYear && item.endYear !== item.year) return `${item.year}–${item.endYear}`;
  return item.year;
}

/** Films report a runtime; series are better described by how much there is. */
function lengthLabel(item: TitleDetail): string | null {
  if (item.kind === "movie") return formatRuntime(item.runtime);
  const parts: string[] = [];
  if (item.seasons) parts.push(`${item.seasons} season${item.seasons === 1 ? "" : "s"}`);
  if (item.episodes) parts.push(`${item.episodes} episode${item.episodes === 1 ? "" : "s"}`);
  if (parts.length === 0) return null;
  const length = parts.join(" · ");
  const each = formatRuntime(item.episodeRuntime);
  return each ? `${length} · ~${each} each` : length;
}

function KindBadge({ kind }: { kind: TitleDetail["kind"] }) {
  return (
    <span className="marquee rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold">
      {kind === "tv" ? "Series" : "Film"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ongoing = status === "Returning Series" || status === "In Production";
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-haze">
      <span
        className={`size-1.5 rounded-full ${ongoing ? "bg-emerald-400" : "bg-haze/60"}`}
        aria-hidden="true"
      />
      {status === "Returning Series" ? "Still running" : status}
    </span>
  );
}

function NoOffers({ item }: { item: TitleDetail }) {
  const noun = item.kind === "tv" ? "series" : "film";
  return (
    <div className="rounded-2xl border border-dashed border-bone/15 px-5 py-8 text-center">
      <p className="marquee text-base text-bone">Not streaming in {regionName(item.region)}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-haze">
        No subscription, rental or purchase listing right now. This {noun} may be between licensing
        deals, or only available on disc — try another country above.
      </p>
      {item.justWatchLink && (
        <a
          href={item.justWatchLink}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-bone"
        >
          Check JustWatch directly
          <ArrowIcon className="size-4" />
        </a>
      )}
    </div>
  );
}
