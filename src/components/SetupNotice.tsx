/** Shown when the server has no TMDB credentials — the one failure a visitor
 *  can't fix but the operator can, so it says exactly what to do. */
export function SetupNotice() {
  return (
    <div className="plate animate-fade-up rounded-card p-6 sm:p-8">
      <h2 className="marquee text-xl text-gold">One step left</h2>
      <p className="mt-3 text-sm leading-relaxed text-bone/80">
        Reel Radar needs a free TMDB credential to look films up. Add one to the environment and restart:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-bone/10 bg-black/40 p-4 text-xs leading-relaxed text-bone/90">
        <code>{`# .env.local\nTMDB_ACCESS_TOKEN=your-tmdb-v4-read-access-token`}</code>
      </pre>
      <p className="mt-4 text-sm text-haze">
        Get one in about a minute at{" "}
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noreferrer noopener"
          className="text-gold underline underline-offset-4 hover:text-bone"
        >
          themoviedb.org/settings/api
        </a>
        . It&rsquo;s free for non-commercial use.
      </p>
    </div>
  );
}
