import { NextResponse } from "next/server";
import { tmdb, TmdbError, hasCredentials } from "@/lib/tmdb";
import { rankSuggestions, toSuggestion, type RawMovie } from "@/lib/providers";
import type { ApiError, Suggestion } from "@/lib/types";

export const runtime = "nodejs";

/** GET /api/search?q=blade+runner — autocomplete feed. */
export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json<{ results: Suggestion[] }>({ results: [] });
  }
  if (!hasCredentials()) {
    return NextResponse.json<ApiError>(
      { error: "TMDB credentials are not configured.", code: "no_credentials" },
      { status: 503 },
    );
  }

  try {
    const data = await tmdb<{ results?: RawMovie[] }>(
      "/search/movie",
      { query, include_adult: "false", language: "en-US", page: "1" },
      60 * 5,
    );
    const results = rankSuggestions(data.results ?? [], query).slice(0, 8).map(toSuggestion);
    return NextResponse.json({ results });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof TmdbError) {
    return NextResponse.json<ApiError>({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json<ApiError>(
    { error: "Could not reach the film database.", code: "upstream" },
    { status: 502 },
  );
}
