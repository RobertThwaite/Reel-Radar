import { describe, expect, it } from "vitest";
import { buildGroups, pickCertification, rankSuggestions, toSuggestion, toYear, type RawMovie } from "../providers";

const provider = (id: number, name: string, priority?: number) => ({
  provider_id: id,
  provider_name: name,
  logo_path: `/${id}.jpg`,
  display_priority: priority,
});

describe("toYear", () => {
  it("pulls the year from a release date", () => {
    expect(toYear("1999-03-31")).toBe("1999");
  });

  it("returns null for missing or malformed dates", () => {
    expect(toYear(null)).toBeNull();
    expect(toYear("")).toBeNull();
    expect(toYear("soon")).toBeNull();
  });
});

describe("toSuggestion", () => {
  it("rounds the rating to one decimal place", () => {
    const s = toSuggestion({ id: 1, title: "Heat", release_date: "1995-12-15", vote_average: 7.943 });
    expect(s).toEqual({ id: 1, title: "Heat", year: "1995", posterPath: null, rating: 7.9 });
  });

  it("treats an absent or zero rating as null", () => {
    expect(toSuggestion({ id: 2, title: "Unrated" }).rating).toBeNull();
    expect(toSuggestion({ id: 3, title: "Zero", vote_average: 0 }).rating).toBeNull();
  });
});

describe("rankSuggestions", () => {
  const movies: RawMovie[] = [
    { id: 1, title: "Heat and Dust", popularity: 90 },
    { id: 2, title: "Heat", popularity: 5 },
    { id: 3, title: "Dead Heat", popularity: 50 },
    { id: 4, title: "Unrelated", popularity: 500 },
  ];

  it("puts an exact title match first even when it is unpopular", () => {
    expect(rankSuggestions(movies, "heat").map((m) => m.id)).toEqual([2, 1, 3, 4]);
  });

  it("breaks ties on popularity", () => {
    const tied: RawMovie[] = [
      { id: 1, title: "The Thing", popularity: 10 },
      { id: 2, title: "The Thing", popularity: 99 },
    ];
    expect(rankSuggestions(tied, "the thing").map((m) => m.id)).toEqual([2, 1]);
  });

  it("does not mutate the input array", () => {
    const input = [...movies];
    rankSuggestions(input, "heat");
    expect(input.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("buildGroups", () => {
  it("returns an empty list when the region has no offers", () => {
    expect(buildGroups(undefined)).toEqual([]);
    expect(buildGroups({})).toEqual([]);
  });

  it("orders groups stream, free, rent, buy and drops empty ones", () => {
    const groups = buildGroups({
      buy: [provider(1, "Apple TV")],
      flatrate: [provider(2, "Netflix")],
    });
    expect(groups.map((g) => g.kind)).toEqual(["stream", "buy"]);
  });

  it("merges TMDB's free and ads buckets, de-duplicating services", () => {
    const groups = buildGroups({
      free: [provider(10, "ITVX", 2)],
      ads: [provider(10, "ITVX", 2), provider(11, "Pluto TV", 1)],
    });
    const free = groups.find((g) => g.kind === "free");
    expect(free?.offers.map((o) => o.name)).toEqual(["Pluto TV", "ITVX"]);
  });

  it("sorts by display priority, then alphabetically", () => {
    const groups = buildGroups({
      flatrate: [provider(1, "Zed", 5), provider(2, "Alpha", 1), provider(3, "Beta", 1)],
    });
    expect(groups[0].offers.map((o) => o.name)).toEqual(["Alpha", "Beta", "Zed"]);
  });

  it("defaults a missing display priority to the back of the row", () => {
    const groups = buildGroups({ flatrate: [provider(1, "Unknown"), provider(2, "Known", 3)] });
    expect(groups[0].offers.map((o) => o.name)).toEqual(["Known", "Unknown"]);
  });
});

describe("pickCertification", () => {
  const releaseDates = {
    results: [
      { iso_3166_1: "US", release_dates: [{ certification: "R" }] },
      { iso_3166_1: "GB", release_dates: [{ certification: "" }, { certification: "15" }] },
    ],
  };

  it("returns the classification for the requested region", () => {
    expect(pickCertification(releaseDates, "GB")).toBe("15");
    expect(pickCertification(releaseDates, "US")).toBe("R");
  });

  it("returns null when the region is absent or unclassified", () => {
    expect(pickCertification(releaseDates, "FR")).toBeNull();
    expect(pickCertification(undefined, "GB")).toBeNull();
  });
});
