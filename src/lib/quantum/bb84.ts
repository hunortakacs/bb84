import {
  type Basis,
  type Bit,
  type Photon,
  decode,
  encode,
  measure,
  randomBasis,
  randomBit,
} from "./photon.ts";
import { type Rng, streams } from "./rng.ts";

export interface Bb84Config {
  /** Number of photons Alice sends. */
  qubits: number;
  seed: number;
  eve: {
    enabled: boolean;
    /** Fraction of photons Eve intercepts, 0..1. */
    rate: number;
  };
  /** Fraction of the sifted bits sacrificed to estimate the error rate. */
  sampleFraction: number;
  /** Abort if the estimated QBER exceeds this. ~11% for BB84. */
  threshold: number;
  /**
   * Manual choices, one character per photon: bits 0/1, bases + or x (× also
   * accepted). Any other character keeps the random choice at that index.
   */
  overrides?: {
    aliceBits?: string;
    aliceBases?: string;
    bobBases?: string;
    eveBases?: string;
  };
}

export const DEFAULT_CONFIG: Bb84Config = {
  qubits: 32,
  seed: 1,
  eve: { enabled: false, rate: 1 },
  sampleFraction: 0.5,
  threshold: 0.11,
};

/** Intercept-resend attack: measure in a random basis, send a fresh photon. */
export interface EveAction {
  basis: Basis;
  bit: Bit;
  resent: Photon;
}

export type Role = "discard" | "test" | "key";

export interface QubitRecord {
  index: number;
  aliceBit: Bit;
  aliceBasis: Basis;
  sent: Photon;
  /** null when Eve is off or let this photon pass. */
  eve: EveAction | null;
  /** The photon as it reaches Bob. */
  arrived: Photon;
  bobBasis: Basis;
  bobBit: Bit;
  /** Bob measured in a basis different from the arriving photon's: outcome was a coin flip. */
  bobRandom: boolean;
  basesMatch: boolean;
  role: Role;
  /** Sifted bit where Bob disagrees with Alice. */
  error: boolean;
  /** Eve's recorded bit equals Alice's (whether or not she can tell). */
  eveCorrect: boolean;
}

export interface Bb84Result {
  config: Bb84Config;
  records: QubitRecord[];
  sifted: number[];
  test: number[];
  key: number[];
  testErrors: number;
  /** Estimated quantum bit error rate from the test sample. */
  qber: number;
  aborted: boolean;
  aliceKey: Bit[];
  bobKey: Bit[];
  /** Errors left in the unpublished key bits (only knowable to the simulator). */
  keyMismatches: number;
  /** Key bits where Eve's guess matches Alice. */
  eveKnownKeyBits: number;
  /** Photons Alice encoded in the + basis. */
  rectilinear: number;
  /** Photons Eve measured. */
  intercepted: number;
  /** Intercepted photons Eve measured in the wrong basis, replacing their state. */
  disturbed: number;
}

/** Run the full protocol. Pure: same config → same result. */
export function runBb84(config: Bb84Config): Bb84Result {
  const rng = streams(config.seed);
  const records: QubitRecord[] = [];

  // 1. Quantum transmission, photon by photon.
  for (let i = 0; i < config.qubits; i++) {
    records.push(transmit(i, config, rng));
  }

  // 2. Sifting: bases are announced publicly; mismatched positions are dropped.
  const sifted = records.filter((r) => r.basesMatch).map((r) => r.index);

  // 3. Parameter estimation: publish a random subset of sifted bits.
  const testCount = sampleSize(sifted.length, config.sampleFraction);
  const testSet = new Set(pick(sifted, testCount, rng.publicChannel));
  for (const r of records) {
    r.role = !r.basesMatch ? "discard" : testSet.has(r.index) ? "test" : "key";
  }

  const test = sifted.filter((i) => testSet.has(i));
  const key = sifted.filter((i) => !testSet.has(i));
  const testErrors = test.filter((i) => records[i].error).length;
  const qber = test.length ? testErrors / test.length : 0;

  return {
    config,
    records,
    sifted,
    test,
    key,
    testErrors,
    qber,
    aborted: qber > config.threshold,
    aliceKey: key.map((i) => records[i].aliceBit),
    bobKey: key.map((i) => records[i].bobBit),
    keyMismatches: key.filter((i) => records[i].error).length,
    eveKnownKeyBits: key.filter((i) => records[i].eveCorrect).length,
    rectilinear: records.filter((r) => r.aliceBasis === "+").length,
    intercepted: records.filter((r) => r.eve).length,
    disturbed: records.filter((r) => r.eve && r.eve.basis !== r.aliceBasis)
      .length,
  };
}

function transmit(
  index: number,
  config: Bb84Config,
  rng: ReturnType<typeof streams>,
): QubitRecord {
  // Every party draws from its own stream on every round so that the
  // sequence of choices is independent of whether Eve is active. Overrides
  // replace a draw after it is made, keeping the streams aligned.
  const o = config.overrides;
  const aliceBit = bitAt(o?.aliceBits, index, randomBit(rng.alice));
  const aliceBasis = basisAt(o?.aliceBases, index, randomBasis(rng.alice));
  const bobBasis = basisAt(o?.bobBases, index, randomBasis(rng.bob));
  const eveBasis = basisAt(o?.eveBases, index, randomBasis(rng.eve));
  const eveRoll = rng.eve();

  const sent = encode(aliceBit, aliceBasis);
  let inFlight = sent;
  let eve: EveAction | null = null;

  if (config.eve.enabled && eveRoll < config.eve.rate) {
    const m = measure(inFlight, eveBasis, rng.nature);
    eve = { basis: eveBasis, bit: m.bit, resent: encode(m.bit, eveBasis) };
    inFlight = eve.resent;
  }

  const arrived = inFlight;
  const bob = measure(arrived, bobBasis, rng.nature);
  const basesMatch = aliceBasis === bobBasis;

  return {
    index,
    aliceBit,
    aliceBasis,
    sent,
    eve,
    arrived,
    bobBasis,
    bobBit: bob.bit,
    bobRandom: decode(arrived).basis !== bobBasis,
    basesMatch,
    role: "discard",
    error: basesMatch && bob.bit !== aliceBit,
    eveCorrect: eve !== null && eve.bit === aliceBit,
  };
}

function bitAt(s: string | undefined, i: number, drawn: Bit): Bit {
  const c = s?.[i];
  return c === "0" ? 0 : c === "1" ? 1 : drawn;
}

function basisAt(s: string | undefined, i: number, drawn: Basis): Basis {
  const c = s?.[i];
  return c === "+" ? "+" : c === "x" || c === "×" ? "x" : drawn;
}

function sampleSize(n: number, fraction: number): number {
  if (n < 2) return 0;
  return Math.min(n - 1, Math.max(1, Math.round(n * fraction)));
}

/** k distinct elements of xs, uniformly at random (partial Fisher–Yates). */
function pick<T>(xs: readonly T[], k: number, rng: Rng): T[] {
  const a = xs.slice();
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}
