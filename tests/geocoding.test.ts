import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildReverseGeocodingUrl,
  isLoudounCounty,
  parseReverseGeocodingResponse,
  reverseGeocode,
  ReverseGeocodingError,
} from "../src/geocoding";

const location = {
  latitude: 39.041586,
  longitude: -77.520375,
  accuracyMeters: 12,
  capturedAt: "2026-08-31T00:00:00.000Z",
};

beforeEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { language: "en-US" },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { setTimeout, clearTimeout },
  });
});

describe("reverse geocoding", () => {
  it("builds an address-only Nominatim request", () => {
    const url = buildReverseGeocodingUrl(location);
    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("lat")).toBe("39.041586");
    expect(url.searchParams.get("lon")).toBe("-77.520375");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("layer")).toBe("address");
    expect(buildReverseGeocodingUrl(location, 8).searchParams.get("zoom")).toBe("8");
  });

  it("returns the trimmed display address and county", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({
        display_name: "  21040 Sycolin Rd, Ashburn, VA 20147  ",
        address: { county: "Loudoun County" },
      })),
    );
    await expect(reverseGeocode(location, fetcher as typeof fetch)).resolves.toStrictEqual(
      { address: "21040 Sycolin Rd, Ashburn, VA 20147", county: "Loudoun County" },
    );
  });

  it("accepts only the county reported as Loudoun County", () => {
    expect(isLoudounCounty(" Loudoun County ")).toBe(true);
    expect(isLoudounCounty("Loudoun")).toBe(true);
    expect(isLoudounCounty("Fairfax County")).toBe(false);
    expect(isLoudounCounty(null)).toBe(false);
  });

  it("uses the state district when Nominatim omits the county field", () => {
    expect(parseReverseGeocodingResponse({
      display_name: "21040 Sycolin Rd, Ashburn, VA 20147",
      address: { state_district: "Loudoun County" },
    })).toStrictEqual({
      address: "21040 Sycolin Rd, Ashburn, VA 20147",
      county: "Loudoun County",
    });
  });

  it("looks up the county boundary when the street response has no county", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        display_name: "21040 Sycolin Rd, Ashburn, VA 20147",
        address: { road: "Sycolin Rd" },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        display_name: "Loudoun County, Virginia, United States",
        address: { county: "Loudoun County" },
      })));

    await expect(reverseGeocode(location, fetcher as typeof fetch)).resolves.toStrictEqual({
      address: "21040 Sycolin Rd, Ashburn, VA 20147",
      county: "Loudoun County",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetcher.mock.calls[1]![0])).searchParams.get("zoom")).toBe("8");
  });

  it("marks a response without county data as unverified", () => {
    expect(parseReverseGeocodingResponse({ display_name: "123 Main St" })).toStrictEqual({
      address: "123 Main St",
      county: null,
    });
  });

  it("rejects responses without an address", () => {
    expect(() => parseReverseGeocodingResponse({ error: "Unable to geocode" })).toThrowError(
      new ReverseGeocodingError("Unable to geocode"),
    );
  });
});
