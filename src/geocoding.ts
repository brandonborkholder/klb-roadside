import type { CapturedLocation } from "./types";

const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const MIN_REQUEST_INTERVAL_MS = 1_100;
let lastRequestAt = 0;

export class ReverseGeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReverseGeocodingError";
  }
}

type NominatimResponse = {
  display_name?: unknown;
  error?: unknown;
  address?: { county?: unknown };
};

export type ReverseGeocodedLocation = {
  address: string;
  county: string | null;
};

export const OUTSIDE_LOUDOUN_MESSAGE =
  "This location is outside Loudoun County. Complaints can only be submitted for signs in Loudoun County.";
export const COUNTY_NOT_VERIFIED_MESSAGE =
  "We could not confirm this location's county. Retry location before submitting.";

export function isLoudounCounty(county: string | null): boolean {
  return county?.trim().toLocaleLowerCase("en-US") === "loudoun county";
}

export function buildReverseGeocodingUrl(location: CapturedLocation): URL {
  const url = new URL(REVERSE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(location.latitude));
  url.searchParams.set("lon", String(location.longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");
  url.searchParams.set("accept-language", navigator.language || "en-US");
  return url;
}

export function parseReverseGeocodingResponse(value: unknown): ReverseGeocodedLocation {
  if (!value || typeof value !== "object") {
    throw new ReverseGeocodingError("The address service returned invalid data.");
  }
  const response = value as NominatimResponse;
  if (typeof response.display_name !== "string" || !response.display_name.trim()) {
    throw new ReverseGeocodingError(
      typeof response.error === "string" ? response.error : "No nearby street address was found.",
    );
  }
  return {
    address: response.display_name.trim(),
    county: typeof response.address?.county === "string" ? response.address.county.trim() || null : null,
  };
}

export async function reverseGeocode(
  location: CapturedLocation,
  fetcher: typeof fetch = fetch,
): Promise<ReverseGeocodedLocation> {
  const delay = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
  lastRequestAt = Date.now();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetcher(buildReverseGeocodingUrl(location), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ReverseGeocodingError(`Address lookup returned HTTP ${response.status}.`);
    }
    return parseReverseGeocodingResponse(await response.json());
  } catch (error) {
    if (error instanceof ReverseGeocodingError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ReverseGeocodingError("Address lookup timed out. Enter the address manually.");
    }
    throw new ReverseGeocodingError("Could not look up the address. Enter it manually.");
  } finally {
    window.clearTimeout(timeout);
  }
}
