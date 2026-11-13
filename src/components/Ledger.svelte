<!--
  All qubits side by side, one column each. Every stage animates all columns
  at once: Alice's states appear, photons travel down through Eve to Bob,
  then sifting, testing and key selection mark the columns.
-->
<script lang="ts">
  import { type Bb84Result, decode } from "../lib/quantum/index.ts";
  import { describe } from "../lib/ui/format.ts";
  import Glyph from "./Glyph.svelte";
  import Rich from "./Rich.svelte";

  interface Props {
    result: Bb84Result;
    /** Progress 0..1 of each stage: prepare, transmit, sift, estimate, key. */
    progress: number[];
    eveOn: boolean;
  }

  let { result, progress, eveOn }: Props = $props();

  // Geometry (px): a station row, then a gap the photons cross.
  const ROW = 24;
  const GAP = 30;
  const HOP = ROW + GAP;
  // Transmission timeline with Eve: reach her at 0.4, leave at 0.6.
  const AT_EVE = 0.4;
  const LEAVE_EVE = 0.6;

  const clamp = (u: number) => Math.min(1, Math.max(0, u));
  const ease = (u: number) => u * u * (3 - 2 * u);
  const span = (u: number, a: number, b: number) =>
    ease(clamp((u - a) / (b - a)));

  const [prep, flight, sift, test, key] = $derived(progress);

  const flying = $derived(flight > 0 && flight < 1);
  const atEve = $derived(eveOn && flight >= AT_EVE);
  const pastEve = $derived(eveOn && flight >= LEAVE_EVE);
  const flyY = $derived(
    eveOn
      ? (span(flight, 0, AT_EVE) + span(flight, LEAVE_EVE, 1)) * HOP
      : span(flight, 0, 1) * HOP,
  );
  // With Eve the photon pauses on her row; hide it there unless it passes through.
  const holding = $derived(atEve && !pastEve);

  const isTest = $derived(new Set(result.test));
  const isKey = $derived(new Set(result.key));

  let hover = $state<number | null>(null);
  const lines = $derived(
    hover !== null && flight >= 1 ? describe(result.records[hover], eveOn) : [],
  );
</script>

<section class="panel ledger">
  <div class="head">
    <span>qubits</span>
    <span class="muted"
      >{result.records.length} photons, hover a column to follow one</span
    >
  </div>

  <div
    class="grid"
    style:--prep={prep}
    style:--eve={clamp((flight - AT_EVE) / 0.1)}
    style:--sift={sift}
    style:--test={test}
    style:--key={key}
    style:--fly="{flyY}px"
  >
    <div class="labels">
      <span class="num"></span>
      <span>alice</span>
      <span class="gap">channel</span>
      {#if eveOn}
        <span>eve</span>
        <span class="gap">channel</span>
      {/if}
      <span>bob</span>
      <span>bases</span>
      <span>use</span>
    </div>

    <div class="cols" onmouseleave={() => (hover = null)} role="presentation">
      {#each result.records as r (r.index)}
        {@const err =
          r.error &&
          ((isTest.has(r.index) && test > 0) ||
            (isKey.has(r.index) && key > 0))}
        <div
          class="col"
          class:dropped={!r.basesMatch && sift > 0}
          class:hover={r.index === hover}
          onmouseenter={() => (hover = r.index)}
          role="presentation"
        >
          <span class="num">{r.index % 4 === 0 ? r.index + 1 : ""}</span>
          <span class="prep"
            >{#if prep > 0}<Glyph
                bit={r.aliceBit}
                basis={r.aliceBasis}
              />{/if}</span
          >
          <span class="gap"></span>
          {#if eveOn}
            <span class="evecell">
              {#if atEve}
                {#if r.eve}<Glyph
                    bit={r.eve.bit}
                    basis={r.eve.basis}
                  />{:else}<i class="pass">·</i>{/if}
              {/if}
            </span>
            <span class="gap"></span>
          {/if}
          <span class="bob" class:err class:errtest={isTest.has(r.index)}>
            {#if flight >= 1}
              <Glyph bit={r.bobBit} basis={r.bobBasis} />
            {:else if flying}
              <Glyph basis={r.bobBasis} />
            {/if}
          </span>
          <span class="mark sift"
            >{sift > 0 ? (r.basesMatch ? "=" : "≠") : ""}</span
          >
          <span class="mark" class:bad={err}>
            {#if isTest.has(r.index) && test > 0}<b class="test">t</b>
            {:else if isKey.has(r.index) && key > 0}<b class="key">k</b>{/if}
          </span>

          {#if flying && !(holding && r.eve)}
            {@const s = decode(pastEve ? r.arrived : r.sent)}
            <div class="photon"><Glyph bit={s.bit} basis={s.basis} /></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="inspect">
    {#if lines.length}
      {#each lines as l, i (i)}<span><Rich text={l} /></span>{/each}
    {:else}
      <span class="hint"
        >{flight >= 1
          ? "hover a column to see what happened to that photon"
          : ""}</span
      >
    {/if}
  </div>
</section>

<style>
  /* The description box runs edge to edge; the panel's corners clip it. */
  .ledger {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px 0;
  }
  .grid {
    display: flex;
    padding: 10px 0 10px 16px;
  }
  .labels,
  .col {
    display: flex;
    flex-direction: column;
  }
  .labels span,
  .col span {
    height: 24px;
    display: flex;
    align-items: center;
  }
  .labels .gap,
  .col .gap {
    height: 30px;
  }
  .labels {
    flex: none;
    width: 60px;
    color: var(--muted);
  }
  .labels .gap {
    font-size: 10px;
    color: var(--dim);
  }
  .labels .num,
  .col .num {
    height: 16px;
    font-size: 10px;
    color: var(--dim);
  }
  .cols {
    display: flex;
    overflow-x: auto;
    padding: 0 16px 6px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--raised) transparent;
  }
  .col {
    position: relative;
    flex: none;
    width: 22px;
    align-items: center;
    border-radius: var(--radius);
    transition: background-color 0.15s;
  }
  .col.hover {
    background: var(--hover);
  }
  .col.dropped {
    opacity: calc(1 - 0.82 * var(--sift));
  }
  .col span {
    justify-content: center;
    width: 100%;
  }
  /* The wire each photon travels along. */
  .col .gap {
    background: linear-gradient(var(--dim), var(--dim)) center / 1px 100%
      no-repeat;
    opacity: 0.35;
  }
  .prep {
    opacity: var(--prep);
    transform: scale(calc(0.6 + 0.4 * var(--prep)));
  }
  .evecell {
    opacity: var(--eve);
  }
  .photon {
    position: absolute;
    top: 16px;
    left: 2px;
    transform: translateY(var(--fly));
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.5));
  }
  .bob {
    position: relative;
  }
  .bob.err::after {
    content: "";
    position: absolute;
    left: 2px;
    right: 2px;
    bottom: 0;
    height: 2px;
    background: var(--err);
    opacity: var(--key);
  }
  .bob.err.errtest::after {
    opacity: var(--test);
  }
  .mark {
    color: var(--muted);
  }
  .mark b {
    font-weight: normal;
  }
  .sift {
    opacity: var(--sift);
  }
  .test {
    opacity: var(--test);
  }
  .key {
    opacity: var(--key);
  }
  .bad {
    color: var(--err);
  }
  .pass {
    font-style: normal;
    color: var(--dim);
  }
  .inspect {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 12px 16px;
    min-height: 6em;
    background: var(--raised);
    color: var(--muted);
    /* One line per party at any width, so hovering never changes the height. */
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
  }
  .inspect span:first-child:not(.hint) {
    color: var(--text);
  }
</style>
