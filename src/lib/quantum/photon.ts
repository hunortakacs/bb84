import type { Rng } from "./rng.ts";

export type Bit = 0 | 1;
/** "+" = rectilinear (0°/90°), "x" = diagonal (45°/135°). */
export type Basis = "+" | "x";

/** A single-photon polarization state, described by its angle in degrees. */
export interface Photon {
  readonly angle: number;
}

export interface Measurement {
  bit: Bit;
  /** Post-measurement state: the photon collapses onto the measured axis. */
  after: Photon;
  /** Probability of the outcome that occurred. */
  probability: number;
}

const BASIS_OFFSET: Record<Basis, number> = { "+": 0, x: 45 };

/** BB84 encoding: + → 0:0° 1:90°, x → 0:45° 1:135°. */
export function encode(bit: Bit, basis: Basis): Photon {
  return { angle: BASIS_OFFSET[basis] + 90 * bit };
}

/**
 * Born rule for a linearly polarized photon: P(0) = cos²(θ − φ), where φ is
 * the basis' 0-axis (Malus's law). Same basis → 1 or 0, conjugate basis → ½.
 */
export function outcomeProbability(
  photon: Photon,
  basis: Basis,
  bit: Bit,
): number {
  const rad = ((photon.angle - BASIS_OFFSET[basis]) * Math.PI) / 180;
  const p0 = clamp01(Math.cos(rad) ** 2);
  return bit === 0 ? p0 : 1 - p0;
}

/** Projective measurement: draw an outcome, collapse onto its state. */
export function measure(photon: Photon, basis: Basis, rng: Rng): Measurement {
  const p0 = outcomeProbability(photon, basis, 0);
  const bit: Bit = rng() < p0 ? 0 : 1;
  return {
    bit,
    after: encode(bit, basis),
    probability: bit === 0 ? p0 : 1 - p0,
  };
}

/** Recover (basis, bit) for one of the four BB84 states. */
export function decode(photon: Photon): { basis: Basis; bit: Bit } {
  const a = ((Math.round(photon.angle) % 180) + 180) % 180;
  const basis: Basis = a % 90 === 0 ? "+" : "x";
  const bit: Bit = a - BASIS_OFFSET[basis] === 0 ? 0 : 1;
  return { basis, bit };
}

export function randomBit(rng: Rng): Bit {
  return rng() < 0.5 ? 0 : 1;
}

export function randomBasis(rng: Rng): Basis {
  return rng() < 0.5 ? "+" : "x";
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
