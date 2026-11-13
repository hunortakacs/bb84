<script lang="ts">
  import { type Player, STAGES } from "../lib/ui/player.svelte.ts";

  let { player }: { player: Player } = $props();

  const QUBITS = [16, 32, 64, 128];
  const SPEEDS = [0.5, 1, 2, 4, 8];

  const eve = $derived(player.config.eve);
  /** Slider value while dragging; the run is recomputed on release. */
  let dragging = $state<number | null>(null);
  const rate = $derived(dragging ?? Math.round(eve.rate * 100));
</script>

<section class="panel controls">
  <div class="row">
    <button class="primary" onclick={() => player.toggle()} title="space">
      {player.playing ? "pause" : player.done ? "replay" : "play"}
    </button>

    <div class="group" role="group" aria-label="stage">
      <button
        onclick={() => player.prev()}
        disabled={player.atStart}
        title="left">‹ stage</button
      >
      <button onclick={() => player.next()} disabled={player.done} title="right"
        >stage ›</button
      >
    </div>

    <div class="group">
      <button onclick={() => player.end()} disabled={player.done} title="e"
        >end</button
      >
      <button
        onclick={() => player.restart()}
        disabled={player.atStart}
        title="r">restart</button
      >
      <button onclick={() => player.newRun()} title="n">new run</button>
    </div>

    <span class="where">
      stage {player.stage + 1}/{STAGES.length}
      <span class="name">{STAGES[player.stage].id}</span>
    </span>
  </div>

  <div class="row settings">
    <label>
      photons
      <select
        value={player.config.qubits}
        onchange={(e) => player.configure({ qubits: +e.currentTarget.value })}
      >
        {#each QUBITS as q (q)}<option value={q}>{q}</option>{/each}
      </select>
    </label>

    <label class="switch">
      <input
        type="checkbox"
        role="switch"
        checked={eve.enabled}
        onchange={(e) =>
          player.configure({
            eve: { ...eve, enabled: e.currentTarget.checked },
          })}
      />
      <span class="track" aria-hidden="true"></span>
      eve
    </label>

    <label class:disabled={!eve.enabled}>
      intercepts
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        disabled={!eve.enabled}
        value={rate}
        style:--v={rate / 100}
        oninput={(e) => (dragging = +e.currentTarget.value)}
        onchange={(e) => {
          dragging = null;
          player.configure({
            eve: { ...eve, rate: +e.currentTarget.value / 100 },
          });
        }}
      />
      <span class="val">{rate}%</span>
    </label>

    <label>
      speed
      <select bind:value={player.speed}>
        {#each SPEEDS as s (s)}<option value={s}>{s}×</option>{/each}
      </select>
    </label>

    <label>
      seed
      <input
        class="seed"
        type="text"
        inputmode="numeric"
        value={player.config.seed}
        onchange={(e) => {
          const v = Number.parseInt(e.currentTarget.value, 10);
          if (Number.isFinite(v)) player.configure({ seed: v >>> 0 });
          else e.currentTarget.value = String(player.config.seed);
        }}
      />
    </label>
  </div>
</section>

<style>
  .controls {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap) calc(2 * var(--gap));
  }
  .group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap);
  }
  .primary {
    min-width: 8ch;
  }
  .where {
    margin-left: auto;
    color: var(--muted);
  }
  .where .name {
    color: var(--text);
  }
  .settings {
    color: var(--muted);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  label.disabled {
    opacity: 0.4;
  }
  .switch {
    cursor: pointer;
    color: var(--text);
  }
  .switch input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  /* Same height and corner radius as buttons and inputs. */
  .track {
    --h: var(--control-h);
    --pad: var(--knob-pad);
    --knob: calc(var(--h) - 2 * var(--pad));
    position: relative;
    width: calc(2 * var(--h) - 2 * var(--pad));
    height: var(--h);
    border-radius: var(--radius);
    background: var(--well);
    box-shadow: var(--inset);
    transition: background-color 0.15s;
  }
  .track::after {
    content: "";
    position: absolute;
    top: var(--pad);
    left: var(--pad);
    width: var(--knob);
    height: var(--knob);
    border-radius: calc(var(--radius) - var(--pad));
    background: var(--muted);
    box-shadow: var(--shadow-1);
    transition:
      transform 0.15s,
      background-color 0.15s;
  }
  .switch input:checked + .track::after {
    transform: translateX(var(--knob));
    background: var(--one);
  }
  .switch:has(input:focus-visible) .track {
    outline: 1px solid var(--muted);
    outline-offset: 2px;
  }
  .val {
    width: 4ch;
    color: var(--text);
  }
  .seed {
    width: calc(10ch + 20px);
  }
</style>
