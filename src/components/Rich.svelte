<!--
  Inline text with kets. The closing angle bracket is drawn, not typed:
  monospace fonts often render ⟩ like a parenthesis.
-->
<script lang="ts">
  import type { Ket, Rich } from "../lib/ui/format.ts";

  let { text }: { text: Rich | Ket } = $props();

  const parts = $derived(Array.isArray(text) ? text : [text]);
</script>

{#each parts as p, i (i)}{#if typeof p === "string"}{p}{:else}<span class="ket"
      >|{p.ket}<svg viewBox="0 0 6 20" aria-hidden="true"
        ><polyline points="1,2 5,10 1,18" /></svg
      ><span class="sr">⟩</span></span
    >{/if}{/each}

<style>
  .ket {
    white-space: nowrap;
  }
  svg {
    display: inline-block;
    width: 0.42em;
    height: 1.15em;
    vertical-align: -0.22em;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.1;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* Keeps copy-pasted text correct without showing the font's glyph. */
  .sr {
    display: inline-block;
    width: 0;
    height: 0;
    overflow: hidden;
  }
</style>
