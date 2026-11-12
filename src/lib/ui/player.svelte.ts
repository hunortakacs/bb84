import { type Bb84Config, type Bb84Result, DEFAULT_CONFIG, randomSeed, runBb84 } from "../quantum/index.ts";

/**
 * The protocol as a sequence of stages. Each stage is one animation that
 * acts on every qubit at once.
 */
export const STAGES = [
  { id: "prepare", ms: 700 },
  { id: "transmit", ms: 2600 },
  { id: "sift", ms: 900 },
  { id: "estimate", ms: 1000 },
  { id: "key", ms: 900 },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

const N = STAGES.length;
const STAGE_PAUSE_MS = 700;

/**
 * Playback over a precomputed BB84 run. `runBb84` computes the physics once;
 * this class only decides how much of it is shown.
 *
 * Position is a single number in [0, N]: `pos = k` means stages 0..k-1 are
 * complete, and a fractional part is the progress of stage `floor(pos)`.
 */
export class Player {
  config = $state<Bb84Config>({ ...DEFAULT_CONFIG, seed: randomSeed() });
  result = $state.raw<Bb84Result>(runBb84($state.snapshot(this.config)));

  pos = $state(0);
  playing = $state(false);
  speed = $state(1);

  /** Position being animated towards, if any. */
  #target: number | null = null;
  /** Remaining pause before the next stage while playing. */
  #hold = 0;
  #raf = 0;
  #last = 0;

  /** Progress 0..1 of a stage. */
  progress(stage: number) {
    return Math.min(1, Math.max(0, this.pos - stage));
  }

  /** Stage being animated, else the last completed one (the first at the start). */
  get stage() {
    if (this.pos === 0) return 0;
    return this.pos % 1 > 0 ? Math.floor(this.pos) : this.pos - 1;
  }

  get atStart() {
    return this.pos === 0;
  }

  get done() {
    return this.pos >= N;
  }

  // ---- configuration ----

  /** New run with the same set of completed stages, so settings can be compared directly. */
  configure(patch: Partial<Bb84Config>) {
    this.pause();
    this.config = { ...this.config, ...patch };
    this.result = runBb84($state.snapshot(this.config));
    this.pos = Math.floor(this.pos);
  }

  newRun() {
    this.configure({ seed: randomSeed() });
  }

  // ---- stage stepping ----

  /** Animate the next stage. While one is animating, finish it at once. */
  next() {
    const target = this.#target;
    this.pause();
    if (target !== null) this.pos = target;
    else if (this.pos % 1 > 0) this.#animateTo(Math.ceil(this.pos));
    else if (!this.done) this.#animateTo(this.pos + 1);
  }

  /** Undo the current stage (or the last completed one), without animation. */
  prev() {
    this.pause();
    this.pos = Math.max(0, Math.ceil(this.pos) - 1);
  }

  /** Show everything before a stage, then animate that stage. */
  goTo(stage: number) {
    this.pause();
    this.pos = Math.max(0, Math.min(N - 1, stage));
    this.#animateTo(this.pos + 1);
  }

  // ---- transport ----

  play() {
    if (this.done) this.pos = 0;
    this.playing = true;
    this.#animateTo(Math.floor(this.pos) + 1);
  }

  pause() {
    this.playing = false;
    this.#target = null;
    this.#hold = 0;
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  restart() {
    this.pause();
    this.pos = 0;
  }

  end() {
    this.pause();
    this.pos = N;
  }

  destroy() {
    this.pause();
  }

  // ---- internals ----

  #animateTo(target: number) {
    this.#target = target;
    if (this.#raf) return;
    this.#last = performance.now();
    const tick = (now: number) => {
      // The first frame's timestamp can precede #last; never run time backwards.
      const dt = Math.max(0, Math.min(now - this.#last, 100)) * this.speed;
      this.#last = now;
      this.#raf = this.#advance(dt) ? requestAnimationFrame(tick) : 0;
    };
    this.#raf = requestAnimationFrame(tick);
  }

  /** Move time forward by dt; returns whether to keep animating. */
  #advance(dt: number): boolean {
    if (this.#hold > 0) {
      this.#hold -= dt;
      return true;
    }
    if (this.#target === null) return false;

    const stage = Math.max(0, Math.min(Math.floor(this.pos), N - 1));
    this.pos = Math.min(this.#target, this.pos + dt / STAGES[stage].ms);
    if (this.pos < this.#target) return true;

    if (this.playing && this.pos < N) {
      this.#target = this.pos + 1;
      this.#hold = STAGE_PAUSE_MS;
      return true;
    }
    this.#target = null;
    this.playing = false;
    return false;
  }
}
