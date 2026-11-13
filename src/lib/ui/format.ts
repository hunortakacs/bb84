import type { Basis, Bit, Photon, QubitRecord } from "../quantum/index.ts";
import { decode, outcomeProbability } from "../quantum/index.ts";

/**
 * Text with kets kept as separate parts, so they can be drawn properly
 * (many monospace fonts render ⟩ like a parenthesis).
 */
export type Ket = { ket: string };
export type Rich = (string | Ket)[];

const NBSP = "\u00a0";
const KET_LABELS: Record<Basis, [string, string]> = {
  "+": ["0", "1"],
  x: ["+", "−"],
};

/** Ket of a BB84 state: + basis → |0⟩ |1⟩, × basis → |+⟩ |−⟩. */
export const ket = (basis: Basis, bit: Bit): Ket => ({
  ket: KET_LABELS[basis][bit],
});

export const photonKet = (p: Photon): Ket => {
  const { basis, bit } = decode(p);
  return ket(basis, bit);
};

export const basisSymbol = (b: Basis) => (b === "+" ? "+" : "×");

/** Basis with its eigenstates, e.g. × {|+⟩,|−⟩}. */
export const basisKets = (b: Basis): Rich => [
  `${basisSymbol(b)}${NBSP}{`,
  ket(b, 0),
  ",",
  ket(b, 1),
  "}",
];

/** Plain-text form, for places that cannot hold markup (tooltips). */
export const plain = (r: Rich | Ket) =>
  (Array.isArray(r) ? r : [r])
    .map((p) => (typeof p === "string" ? p : `|${p.ket}⟩`))
    .join("");

/** Inverse of `plain`: turn |x⟩ in a string back into kets. */
export const parseKets = (text: string): Rich =>
  text.split(/\|([^|⟩]+)⟩/).map((part, i) => (i % 2 ? { ket: part } : part));

/** Born-rule probability, kept on one line. */
export function probability(p: number): string {
  const v =
    Math.abs(p - 1) < 1e-9
      ? "1"
      : Math.abs(p - 0.5) < 1e-9
        ? "½"
        : p.toFixed(2);
  return `(p${NBSP}=${NBSP}${v})`;
}

export const percent = (x: number) => `${(x * 100).toFixed(1)}%`;

function aliceLine(r: QubitRecord): Rich {
  return [
    `alice: bit ${r.aliceBit} in `,
    ...basisKets(r.aliceBasis),
    ", sends ",
    ket(r.aliceBasis, r.aliceBit),
  ];
}

function eveLine(r: QubitRecord): Rich {
  if (!r.eve) return ["eve: lets it pass"];
  const p = outcomeProbability(r.sent, r.eve.basis, r.eve.bit);
  return [
    "eve: measures ",
    photonKet(r.sent),
    " in ",
    ...basisKets(r.eve.basis),
    " → ",
    ket(r.eve.basis, r.eve.bit),
    ` ${probability(p)}, resends it`,
  ];
}

function bobLine(r: QubitRecord): Rich {
  const p = outcomeProbability(r.arrived, r.bobBasis, r.bobBit);
  return [
    "bob: measures ",
    photonKet(r.arrived),
    " in ",
    ...basisKets(r.bobBasis),
    " → ",
    ket(r.bobBasis, r.bobBit),
    ` ${probability(p)}`,
  ];
}

export function describe(r: QubitRecord, eveOn: boolean): Rich[] {
  return [
    [`#${r.index + 1}`],
    aliceLine(r),
    ...(eveOn ? [eveLine(r)] : []),
    bobLine(r),
  ];
}
