<!--
  Protocol stages and their outcomes. Clicking a stage replays it.
-->
<script lang="ts">
  import { type Player, STAGES } from "../lib/ui/player.svelte.ts";
  import { percent } from "../lib/ui/format.ts";
  import Glyph from "./Glyph.svelte";

  let { player }: { player: Player } = $props();

  const r = $derived(player.result);
  const n = $derived(r.config.qubits);
  const eveOn = $derived(r.config.eve.enabled);
  const complete = (i: number) => player.progress(i) >= 1;
</script>

<section class="panel stages">
  <ol>
    {#each STAGES as s, i (s.id)}
      <li class:now={i === player.stage} class:ahead={i > player.stage}>
        <button class="title" onclick={() => player.goTo(i)} title="play this stage">
          <span>{i + 1} {s.id}</span>
          {#if i === player.stage}
            <span class="bar" style:--p={player.progress(i)}></span>
          {/if}
        </button>

        <!-- Always rendered so its space is reserved; revealed when the stage completes. -->
        <div class="body" class:hidden={!complete(i)}>
          {#if s.id === "prepare"}
            <p class="out">{n} states: {r.rectilinear} in +, {n - r.rectilinear} in ×</p>
          {:else if s.id === "transmit"}
            <p class="out">
              {n} photons measured{#if eveOn}; eve intercepted {r.intercepted}, changed the state of {r.disturbed}{/if}
            </p>
          {:else if s.id === "sift"}
            <p class="out">{r.sifted.length} of {n} kept</p>
          {:else if s.id === "estimate"}
            <p class="out" class:bad={r.aborted}>
              {r.testErrors} of {r.test.length} differ, error rate {percent(r.qber)}: {r.aborted ? "abort" : "continue"}
            </p>
          {:else if r.aborted}
            <p class="out bad">no key: eavesdropping suspected, everything is discarded</p>
          {:else}
            <div class="keys">
              <div class="keyrow">
                <span class="who">alice</span>
                {#each r.aliceKey as b, j (j)}<Glyph bit={b} size={14} />{/each}
              </div>
              <div class="keyrow">
                <span class="who">bob</span>
                {#each r.bobKey as b, j (j)}
                  <span class:mismatch={b !== r.aliceKey[j]}><Glyph bit={b} size={14} /></span>
                {/each}
              </div>
            </div>
            <p class="out">
              {r.key.length}-bit key, {r.keyMismatches} undetected mismatches{#if eveOn}; eve's guess matches
                {r.eveKnownKeyBits} of {r.key.length} bits{/if}
            </p>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</section>

<style>
  /* Rows run edge to edge; the panel's corners clip them. */
  .stages {
    overflow: hidden;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
  }
  li {
    position: relative;
    padding: 12px 16px;
    transition: background-color 0.15s;
  }
  li:hover {
    background: var(--hover);
  }
  li.now {
    background: var(--raised);
    box-shadow: var(--shadow-1);
  }
  li.ahead {
    color: var(--dim);
  }
  .title {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    cursor: pointer;
    color: var(--muted);
  }
  /* The whole row is the click target, so hover and click cover the same area. */
  .title::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  /* Keep the global button hover/press styles off this text button. */
  .title:hover:not(:disabled),
  .title:active:not(:disabled) {
    background: none;
    box-shadow: none;
    transform: none;
  }
  li:hover .title,
  li.now .title {
    color: var(--text);
  }
  .title:focus-visible {
    outline: none;
  }
  .title:focus-visible::after {
    outline: 1px solid var(--muted);
    outline-offset: -1px;
  }
  .bar {
    width: 64px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(var(--muted), var(--muted)) left / calc(var(--p) * 100%) 100% no-repeat var(--well);
  }
  .body {
    transition: opacity 0.3s;
  }
  .body.hidden {
    visibility: hidden;
    opacity: 0;
  }
  p {
    margin: 6px 0 0;
  }
  .out {
    color: var(--text);
  }
  li:not(.now) .out {
    color: var(--muted);
  }
  .bad,
  li:not(.now) .bad {
    color: var(--err);
  }
  .keys {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }
  .keyrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    min-height: 16px;
  }
  .who {
    width: 44px;
    color: var(--muted);
  }
  .keyrow > span:not(.who) {
    display: block;
    border-radius: 3px;
  }
  .mismatch {
    box-shadow: 0 0 0 2px var(--err);
  }
</style>
