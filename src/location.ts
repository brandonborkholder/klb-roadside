import type { CapturedLocation, ReportHistoryEntry } from "./types";

export class LocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationError";
  }
}

export type LocationReadiness = "ready" | "prompt" | "blocked" | "unsupported";

export async function getLocationReadiness(): Promise<LocationReadiness> {
  if (!("geolocation" in navigator)) return "unsupported";
  if (!("permissions" in navigator)) return "prompt";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted") return "ready";
    if (status.state === "denied") return "blocked";
    return "prompt";
  } catch {
    return "prompt";
  }
}

export function getCurrentLocation(): Promise<CapturedLocation> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new LocationError("This browser does not provide location access."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: Math.round(coords.accuracy),
          capturedAt: new Date(timestamp).toISOString(),
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow it in Chrome site settings and retry.",
          2: "Turn on Android Location, then tap Retry location.",
          3: "Location took too long. Retry when the phone has a clearer GPS signal.",
        };
        reject(new LocationError(messages[error.code] ?? "Could not determine location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 30_000,
      },
    );
  });
}

export function formatCoordinates(location: CapturedLocation): string {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

export function locationQuality(accuracyMeters: number): "good" | "warning" {
  return accuracyMeters <= 100 ? "good" : "warning";
}

export function latestNearbyReport(
  location: Pick<CapturedLocation, "latitude" | "longitude">,
  history: readonly ReportHistoryEntry[],
): ReportHistoryEntry | undefined {
  const radians = Math.PI / 180;
  // The haversine formula gives the straight-line surface distance.
  const radiusMeters = 6_371_000;
  const withinMeters = 500 * 0.3048;
  let latest: ReportHistoryEntry | undefined;
  for (const entry of history) {
    const latitudeDelta = (entry.latitude - location.latitude) * radians;
    const longitudeDelta = (entry.longitude - location.longitude) * radians;
    const haversine = Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(location.latitude * radians) * Math.cos(entry.latitude * radians) *
      Math.sin(longitudeDelta / 2) ** 2;
    const distance = 2 * radiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
    if (distance <= withinMeters && (!latest || entry.submittedAt > latest.submittedAt)) {
      latest = entry;
    }
  }
  return latest;
}
