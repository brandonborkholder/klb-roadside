import { describe, expect, it } from "vitest";
import { formatCoordinates, getLocationReadiness, latestNearbyReport, locationQuality } from "../src/location";

describe("location helpers", () => {
  it("formats coordinates without excessive precision", () => {
    expect(
      formatCoordinates({
        latitude: 39.0415860503,
        longitude: -77.5203749074,
        accuracyMeters: 12,
        capturedAt: "2026-08-31T00:00:00.000Z",
      }),
    ).toBe("39.041586, -77.520375");
  });

  it("warns when accuracy is worse than 100 meters", () => {
    expect(locationQuality(100)).toBe("good");
    expect(locationQuality(101)).toBe("warning");
  });
});

describe("location readiness", () => {
  it("reports blocked location permission", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        geolocation: {},
        permissions: { query: async () => ({ state: "denied" }) },
      },
    });
    await expect(getLocationReadiness()).resolves.toBe("blocked");
  });
});

describe("nearby report history", () => {
  const location = { latitude: 39, longitude: -77 };
  const older = { ...location, submittedAt: "2026-11-20T12:00:00Z" };
  const newer = { ...older, latitude: 39.00137, submittedAt: "2026-11-21T12:00:00Z" };
  const outside = { ...newer, latitude: 39.00138, submittedAt: "2026-11-22T12:00:00Z" };

  it("returns the most recent report within 500 feet, even if an older one is closer", () => {
    expect(latestNearbyReport(location, [outside, newer, older])).toEqual(newer);
  });

  it("returns no match for empty history or reports outside 500 feet", () => {
    expect(latestNearbyReport(location, [])).toBeUndefined();
    expect(latestNearbyReport(location, [outside])).toBeUndefined();
  });
});
