/** Deterministic PRNG (mulberry32) so a run can be replayed exactly. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Independent streams derived from one seed. Each party draws from its own
 * stream, so toggling Eve does not change Alice's or Bob's random choices.
 */
export function streams(seed: number) {
  const derive = (salt: number) => mulberry32((seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0);
  return {
    alice: derive(1),
    bob: derive(2),
    eve: derive(3),
    nature: derive(4), // measurement outcomes
    publicChannel: derive(5), // choice of test sample
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
