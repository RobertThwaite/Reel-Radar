import Image from "next/image";
import { formatRuntime, tmdbImage } from "@/lib/format";
import { regionName } from "@/lib/regions";
import type { MovieDetail } from "@/lib/types";
import { ProviderShelf } from "./ProviderShelf";
import { ArrowIcon, StarIcon, TicketIcon } from "./Icons";

export function MoviePanel({ movie }: { movie: MovieDetail }) {
  const poster = tmdbImage(movie.posterPath, "w500");
  const runtime = formatRuntime(movie.runtime);
  const meta = [movie.year, runtime, movie.certification].filter(Boolean) as string[];

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
                  alt={`${movie.title} poster`}
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
            <h2 className="marquee text-balance text-3xl leading-[1.05] text-bone sm:text-4xl lg:text-5xl">
              {movie.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-haze">
              {meta.map((item, i) => (
                <span key={item} className="flex items-center gap-3">
                  {i > 0 && <span className="text-edge">•</span>}
                  <span className={item === movie.certification ? "rounded border border-bone/25 px-1.5 text-xs text-bone" : ""}>
                    {item}
                  </span>
                </span>
              ))}
              {movie.rating ? (
                <span className="flex items-center gap-1.5 text-bone">
                  <StarIcon className="size-3.5 text-gold" />
                  <span className="font-medium">{movie.rating.toFixed(1)}</span>
                  <span className="text-xs text-haze">/10</span>
                </span>
              ) : null}
            </div>

            {movie.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {movie.genres.map((genre) => (
                  <li key={genre} className="rounded-full border border-bone/10 px-2.5 py-0.5 text-xs text-haze">
                    {genre}
                  </li>
                ))}
              </ul>
            )}

            {movie.tagline && (
              <p className="mt-5 text-pretty font-medium italic text-gold/90">“{movie.tagline}”</p>
            )}

            {movie.overview && (
              <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-bone/80">{movie.overview}</p>
            )}

            {(movie.director || movie.cast.length > 0) && (
              <dl className="mt-5 space-y-1.5 text-sm">
                {movie.director && (
                  <div className="flex gap-2">
                    <dt className="marquee w-16 shrink-0 text-[11px] leading-5 text-haze">Director</dt>
                    <dd className="text-bone/85">{movie.director}</dd>
                  </div>
                )}
                {movie.cast.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="marquee w-16 shrink-0 text-[11px] leading-5 text-haze">Starring</dt>
                    <dd className="text-bone/85">{movie.cast.join(", ")}</dd>
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
            <span className="text-xs text-haze">in {regionName(movie.region)}</span>
          </div>

          {movie.groups.length > 0 ? (
            <>
              <div className="space-y-7">
                {movie.groups.map((group) => (
                  <ProviderShelf key={group.kind} group={group} link={movie.justWatchLink} />
                ))}
              </div>
              {movie.justWatchLink && (
                <a
                  href={movie.justWatchLink}
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
            <NoOffers movie={movie} />
          )}
        </div>
      </div>
    </article>
  );
}

function NoOffers({ movie }: { movie: MovieDetail }) {
  return (
    <div className="rounded-2xl border border-dashed border-bone/15 px-5 py-8 text-center">
      <p className="marquee text-base text-bone">Not streaming in {regionName(movie.region)}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-haze">
        No subscription, rental or purchase listing right now. It may be in cinemas, between licensing
        deals, or only available on disc — try another country above.
      </p>
      {movie.justWatchLink && (
        <a
          href={movie.justWatchLink}
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
