<script lang="ts">
  import type { Bb84Config } from "../lib/quantum/index.ts";
  import FixedInput from "./FixedInput.svelte";
  import { type Player, STAGES } from "../lib/ui/player.svelte.ts";

  let { player }: { player: Player } = $props();

  const QUBITS = [16, 32, 64, 128];
  const SPEEDS = [0.5, 1, 2, 4, 8];

  const eve = $derived(player.config.eve);
  /** Slider value while dragging; the run is recomputed on release. */
  let dragging = $state<number | null>(null);
  const rate = $derived(dragging ?? Math.round(eve.rate * 100));

  // ---- manual bit/basis input ----

  type Field = keyof NonNullable<Bb84Config["overrides"]>;
  type Normalize = (c: string) => string | null;
  const bit: Normalize = (c) => (c === "0" || c === "1" ? c : null);
  const basis: Normalize = (c) =>
    c === "+" ? "+" : /^[xX×]$/.test(c) ? "x" : null;

  const FIELDS: {
    key: Field;
    label: string;
    normalize: Normalize;
    hint: string;
  }[] = [
    {
      key: "aliceBits",
      label: "alice bitjei",
      normalize: bit,
      hint: "0 vagy 1",
    },
    {
      key: "aliceBases",
      label: "alice bázisai",
      normalize: basis,
      hint: "+ vagy x",
    },
    {
      key: "bobBases",
      label: "bob bázisai",
      normalize: basis,
      hint: "+ vagy x",
    },
    {
      key: "eveBases",
      label: "eve bázisai",
      normalize: basis,
      hint: "+ vagy x; a - jelű fotonokat Eve átengedi",
    },
  ];

  const actual = $derived.by(() => {
    const rs = player.result.records;
    return {
      aliceBits: rs.map((r) => r.aliceBit).join(""),
      aliceBases: rs.map((r) => r.aliceBasis).join(""),
      bobBases: rs.map((r) => r.bobBasis).join(""),
      // "-": Eve lets this photon pass, so there is no basis to choose.
      eveBases: rs.map((r) => r.eve?.basis ?? "-").join(""),
    } satisfies Record<Field, string>;
  });

  const eveLocked = (i: number) => actual.eveBases[i] === "-";

  function apply(key: Field, v: string) {
    player.configure({ overrides: { ...player.config.overrides, [key]: v } });
  }
</script>

<section class="panel controls">
  <div class="row">
    <button class="primary" onclick={() => player.toggle()} title="szóköz">
      {player.playing ? "szünet" : player.done ? "újra" : "lejátszás"}
    </button>

    <div class="group" role="group" aria-label="léptetés">
      <button onclick={() => player.prev()} disabled={player.atStart} title="←"
        >‹ előző</button
      >
      <button onclick={() => player.next()} disabled={player.done} title="→"
        >következő ›</button
      >
    </div>

    <div class="group">
      <button onclick={() => player.end()} disabled={player.done} title="e"
        >végére</button
      >
      <button
        onclick={() => player.restart()}
        disabled={player.atStart}
        title="r">elejére</button
      >
      <button onclick={() => player.newRun()} title="n">új futás</button>
    </div>

    <span class="where">
      {player.stage + 1}/{STAGES.length}
      <span class="name">{STAGES[player.stage].name}</span>
    </span>
  </div>

  <div class="row settings">
    <label>
      fotonszám
      <select
        value={player.config.qubits}
        onchange={(e) =>
          player.configure({
            qubits: +e.currentTarget.value,
            overrides: undefined,
          })}
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
      lehallgató (Eve)
    </label>

    <label class:disabled={!eve.enabled}>
      elfogott fotonok
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
      sebesség
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

  <div class="manual">
    {#each FIELDS as f (f.key)}
      {@const off = f.key === "eveBases" && !eve.enabled}
      <label class:disabled={off}>
        <span>{f.label}</span>
        <FixedInput
          value={actual[f.key]}
          normalize={f.normalize}
          locked={f.key === "eveBases" ? eveLocked : undefined}
          disabled={off}
          title={f.hint}
          onchange={(v) => apply(f.key, v)}
        />
      </label>
    {/each}
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
  .manual {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px 12px;
    color: var(--muted);
  }
  .manual label {
    display: contents;
  }
  .manual label > span {
    align-self: center;
  }
  .manual label.disabled > :global(*) {
    opacity: 0.4;
  }
</style>
