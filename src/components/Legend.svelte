<!--
  Key to the symbols, grouped the way they are read: each basis with its two
  states and the bit they carry, then the marks added after transmission.
-->
<script lang="ts">
  import type { Basis, Bit } from "../lib/quantum/index.ts";
  import { basisSymbol, ket } from "../lib/ui/format.ts";
  import Glyph from "./Glyph.svelte";
  import Rich from "./Rich.svelte";

  const BASES: Basis[] = ["+", "x"];
  const BITS: Bit[] = [0, 1];
</script>

<div class="legend">
  {#each BASES as b (b)}
    <div class="group">
      <span class="title"
        ><Glyph basis={b} size={16} /> {basisSymbol(b)} bázis</span
      >
      {#each BITS as bit (bit)}
        <span class="item"
          ><Glyph {bit} basis={b} size={16} /><Rich text={ket(b, bit)} />
          <span class="muted">= {bit}</span></span
        >
      {/each}
    </div>
  {/each}

  <div class="group">
    <span class="item"><b>=</b> egyező bázis, <b>≠</b> eltérő bázis</span>
    <span class="item"><b>t</b> tesztbit, <b>k</b> kulcsbit</span>
    <span class="item"><b class="err">piros</b> Bob bitje eltér Alice-étól</span
    >
  </div>

  <p class="note">
    A cella kitöltése a bit (fekete 0, fehér 1), a vonal a polarizáció iránya.
    Üres cella kereszttel: Bob mérési bázisa, még eredmény nélkül.
  </p>
</div>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 40px;
    padding: 4px 4px 0;
    color: var(--muted);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .item :global(svg) {
    flex: none;
  }
  b {
    font-weight: normal;
    color: var(--text);
  }
  b.err {
    color: var(--err);
  }
  .note {
    flex-basis: 100%;
    margin: 0;
    color: var(--dim);
  }
</style>
