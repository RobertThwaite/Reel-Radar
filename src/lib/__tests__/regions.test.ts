import { describe, expect, it } from "vitest";
import { normaliseRegion, regionName, REGIONS } from "../regions";

describe("normaliseRegion", () => {
  it("accepts a supported code in any case, with padding", () => {
    expect(normaliseRegion("us")).toBe("US");
    expect(normaliseRegion("  gb ")).toBe("GB");
  });

  it("falls back to the default for anything unsupported", () => {
    expect(normaliseRegion("XX")).toBe("GB");
    expect(normaliseRegion(null)).toBe("GB");
    expect(normaliseRegion("")).toBe("GB");
  });
});

describe("regionName", () => {
  it("names a known region and echoes an unknown one", () => {
    expect(regionName("GB")).toBe("United Kingdom");
    expect(regionName("ZZ")).toBe("ZZ");
  });
});

describe("REGIONS", () => {
  it("has no duplicate codes", () => {
    const codes = REGIONS.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
