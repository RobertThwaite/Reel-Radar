import { describe, expect, it } from "vitest";
import { formatRuntime, highlight, tmdbImage } from "../format";

describe("formatRuntime", () => {
  it("formats hours and minutes", () => {
    expect(formatRuntime(163)).toBe("2h 43m");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(47)).toBe("47m");
  });

  it("returns null when there is no usable runtime", () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(-5)).toBeNull();
  });
});

describe("tmdbImage", () => {
  it("builds a sized CDN url", () => {
    expect(tmdbImage("/abc.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
  });

  it("returns null without a path", () => {
    expect(tmdbImage(null, "w500")).toBeNull();
    expect(tmdbImage(undefined, "w92")).toBeNull();
  });
});

describe("highlight", () => {
  it("splits the title around a case-insensitive match", () => {
    expect(highlight("Blade Runner 2049", "runner")).toEqual(["Blade ", "Runner", " 2049"]);
  });

  it("matches from the start of the title", () => {
    expect(highlight("Heat", "hea")).toEqual(["", "Hea", "t"]);
  });

  it("leaves the title whole when there is no match", () => {
    expect(highlight("Heat", "zzz")).toEqual(["Heat", "", ""]);
    expect(highlight("Heat", "   ")).toEqual(["Heat", "", ""]);
  });
});
