import { describe, expect, it, vi } from "vitest";
import {
  applyCameraZoom,
  applyPreferredZoom,
  CameraError,
  calculateContainSize,
  calculatePinchZoom,
  calculateReducedSize,
  calculateZoomCrop,
  MAX_PHOTO_BYTES,
} from "../src/camera";

describe("calculateContainSize", () => {
  it("keeps a smaller image at its original dimensions", () => {
    expect(calculateContainSize(1200, 900)).toEqual({ width: 1200, height: 900 });
  });

  it("reduces landscape and portrait photos to a 1600px long edge", () => {
    expect(calculateContainSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(calculateContainSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it("rejects invalid camera dimensions", () => {
    expect(() => calculateContainSize(0, 100)).toThrowError(CameraError);
  });
});

describe("calculateReducedSize", () => {
  it("reduces image area enough to target an upload below 800 KB", () => {
    const size = calculateReducedSize(1600, 1200, 1_600_000);
    expect(size.width).toBe(1074);
    expect(size.height).toBe(806);
    expect(size.width * size.height).toBeLessThan(1600 * 1200 * (MAX_PHOTO_BYTES / 1_600_000));
  });

  it("always makes progress when an encoder reports a small overage", () => {
    expect(calculateReducedSize(1600, 1200, 800_001)).toEqual({ width: 1440, height: 1080 });
  });
});

describe("calculateZoomCrop", () => {
  it("centers a two-times crop", () => {
    expect(calculateZoomCrop(4000, 3000, 2)).toEqual({
      x: 1000,
      y: 750,
      width: 2000,
      height: 1500,
    });
  });
});

describe("calculatePinchZoom", () => {
  it("scales zoom with finger distance", () => {
    expect(calculatePinchZoom(2, 100, 150)).toBe(3);
    expect(calculatePinchZoom(2, 100, 50)).toBe(1);
  });

  it("clamps zoom to the camera range", () => {
    expect(calculatePinchZoom(2, 100, 1000)).toBe(8);
    expect(calculatePinchZoom(2, 100, 10)).toBe(1);
  });
});

describe("applyPreferredZoom", () => {
  it("requests exact two-times hardware zoom when supported", async () => {
    const applyConstraints = vi.fn(async () => undefined);
    const track = {
      getCapabilities: () => ({ zoom: { min: 1, max: 8, step: 0.1 } }),
      applyConstraints,
    } as unknown as MediaStreamTrack;
    await expect(applyPreferredZoom(track)).resolves.toBe(true);
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 2 }] });
  });

  it("uses the digital fallback when hardware cannot reach two-times zoom", async () => {
    const track = {
      getCapabilities: () => ({ zoom: { min: 1, max: 1.5, step: 0.1 } }),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack;
    await expect(applyPreferredZoom(track)).resolves.toBe(false);
  });
});

describe("applyCameraZoom", () => {
  it("clamps and applies zoom through the camera track", async () => {
    const applyConstraints = vi.fn(async () => undefined);
    const track = {
      getCapabilities: () => ({ zoom: { min: 1, max: 5, step: 0.1 } }),
      applyConstraints,
    } as unknown as MediaStreamTrack;

    await expect(applyCameraZoom(track, 8)).resolves.toBe(5);
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 5 }] });
  });

  it("reports when native camera zoom is unavailable", async () => {
    const track = {
      getCapabilities: () => ({}),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack;

    await expect(applyCameraZoom(track, 2)).resolves.toBeNull();
  });
});
