# bb84

Interactive BB84 quantum key distribution simulator. Svelte + TypeScript + Vite,
built into a single self-contained `dist/index.html`.

```sh
pnpm install
pnpm dev      # dev server
pnpm build    # dist/index.html
pnpm check    # typecheck
```

## Reading the display

Each cell is a bit drawn in black (0) or white (1). The line on it is the photon
polarization, which shows the basis:

| basis | bit 0 | bit 1 |
| ----- | ----- | ----- |
| `+`   | `—`   | `\|`  |
| `×`   | `/`   | `\`   |

A cell with only `+` or `×` and no fill is a measurement setting.

States use ket notation: basis `+` = {|0⟩, |1⟩}, basis `×` = {|+⟩, |−⟩}.

## Stages

Playback is stage by stage; each stage animates all qubits at once. `stage ›`
plays the next stage, `‹ stage` undoes one, and clicking a stage in the side
panel replays it. Changing a setting keeps the completed stages, so toggling Eve
shows the same run with and without her.

| stage    | animation                               | what becomes public            |
| -------- | --------------------------------------- | ------------------------------ |
| prepare  | Alice's states appear                   | nothing                        |
| transmit | photons travel down to Bob, through Eve | nothing                        |
| sift     | mismatched bases fade out               | Bob's bases, which ones match  |
| estimate | test bits are marked, errors in red     | the test bits, error rate      |
| key      | key bits are marked, keys compared      | nothing (abort if error > 11%) |

The public channel is assumed to be authenticated: Eve can read it but not alter it.

Eve performs an intercept-resend attack on a configurable fraction of photons.
Intercepting everything gives an expected error rate of 25%.

Keys: `space` play/pause, `←`/`→` stage, `e` end, `r` restart, `n` new run.

## Layout

- `src/lib/quantum/`: protocol and physics, no UI. `photon.ts` (encoding,
  Malus's-law measurement), `bb84.ts` (full run from a config), `rng.ts`
  (seeded streams, one per party, so toggling Eve keeps Alice's and Bob's choices).
- `src/lib/ui/player.svelte.ts`: stage definitions and playback. A position in
  `[0, stages]` decides how much of a precomputed run is shown.
- `src/components/`: rendering only.
