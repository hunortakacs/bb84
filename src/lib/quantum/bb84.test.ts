import assert from "node:assert/strict";
import { test } from "node:test";
import { type Bb84Config, DEFAULT_CONFIG, runBb84 } from "./bb84.ts";
import { encode, measure } from "./photon.ts";
import { mulberry32 } from "./rng.ts";

const config = (patch: Partial<Bb84Config>): Bb84Config => ({
  ...DEFAULT_CONFIG,
  seed: 12345,
  ...patch,
});

test("without Eve: QBER is 0 and the keys are equal", () => {
  const r = runBb84(config({ qubits: 2000 }));
  assert.equal(r.qber, 0);
  assert.equal(r.aborted, false);
  assert.ok(r.aliceKey.length > 0);
  assert.deepEqual(r.bobKey, r.aliceKey);
});

test("full intercept-resend: QBER is about 25%", () => {
  const r = runBb84(config({ qubits: 4000, eve: { enabled: true, rate: 1 } }));
  assert.ok(r.qber >= 0.2 && r.qber <= 0.3, `qber ${r.qber}`);
  assert.equal(r.aborted, true);
});

test("sifting keeps between 40% and 60% of the qubits", () => {
  const n = 2000;
  const r = runBb84(config({ qubits: n }));
  const kept = r.sifted.length / n;
  assert.ok(kept >= 0.4 && kept <= 0.6, `kept ${kept}`);
});

test("same config gives an identical result", () => {
  const c = config({ qubits: 500, eve: { enabled: true, rate: 0.5 } });
  assert.deepEqual(runBb84(c), runBb84(c));
});

test("overrides replace the random choices", () => {
  const overrides = {
    aliceBits: "10110100",
    aliceBases: "++xx+x×+",
    bobBases: "+x+x+x+x",
    eveBases: "xxxx++++",
  };
  const r = runBb84(
    config({ qubits: 8, eve: { enabled: true, rate: 1 }, overrides }),
  );
  const col = (f: (x: (typeof r.records)[number]) => unknown) =>
    r.records.map(f).join("");
  assert.equal(
    col((x) => x.aliceBit),
    overrides.aliceBits,
  );
  assert.equal(
    col((x) => x.aliceBasis),
    "++xx+xx+",
  );
  assert.equal(
    col((x) => x.bobBasis),
    overrides.bobBases,
  );
  assert.equal(
    col((x) => x.eve?.basis),
    overrides.eveBases,
  );
});

test("invalid override characters keep the random choice", () => {
  const plain = runBb84(config({ qubits: 4 }));
  const r = runBb84(config({ qubits: 4, overrides: { aliceBits: "1?-0" } }));
  assert.equal(r.records[0].aliceBit, 1);
  assert.equal(r.records[1].aliceBit, plain.records[1].aliceBit);
  assert.equal(r.records[2].aliceBit, plain.records[2].aliceBit);
  assert.equal(r.records[3].aliceBit, 0);
});

test("measuring in the encoding basis returns the encoded bit", () => {
  const rng = mulberry32(7);
  for (const basis of ["+", "x"] as const) {
    for (const bit of [0, 1] as const) {
      for (let i = 0; i < 100; i++) {
        const m = measure(encode(bit, basis), basis, rng);
        assert.equal(m.bit, bit);
        assert.equal(m.probability, 1);
      }
    }
  }
});

test("measuring in the conjugate basis is about 50/50", () => {
  const rng = mulberry32(7);
  const n = 4000;
  let ones = 0;
  for (let i = 0; i < n; i++) {
    const m = measure(encode(0, "+"), "x", rng);
    assert.ok(Math.abs(m.probability - 0.5) < 1e-9);
    ones += m.bit;
  }
  assert.ok(ones / n > 0.45 && ones / n < 0.55, `ones ${ones / n}`);
});
