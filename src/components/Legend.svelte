<script lang="ts">
  import type { Basis, Bit } from "../lib/quantum/index.ts";
  import { basisKets, ket } from "../lib/ui/format.ts";
  import Glyph from "./Glyph.svelte";
  import Rich from "./Rich.svelte";

  const STATES: { basis: Basis; bit: Bit; line: string }[] = [
    { basis: "+", bit: 0, line: "—" },
    { basis: "+", bit: 1, line: "|" },
    { basis: "x", bit: 0, line: "/" },
    { basis: "x", bit: 1, line: "\\" },
  ];
</script>

<div class="legend">
  {#each STATES as s (s.line)}
    <span
      ><Glyph bit={s.bit} basis={s.basis} size={16} /><span
        ><Rich text={ket(s.basis, s.bit)} /> {s.line}</span
      ></span
    >
  {/each}
  <span
    ><Glyph basis="+" size={16} /><span
      >basis <Rich text={basisKets("+")} /></span
    ></span
  >
  <span
    ><Glyph basis="x" size={16} /><span
      >basis <Rich text={basisKets("x")} /></span
    ></span
  >
  <span>fill: black 0, white 1 · line: polarization</span>
  <span>= bases match · t test bit · k key bit</span>
</div>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 22px;
    padding: 0 4px;
    color: var(--muted);
  }
  .legend > span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: pre;
  }
</style>
