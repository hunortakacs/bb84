<!--
  One shared tooltip for any element with a data-tip attribute. Replaces the
  browser's native title tooltip, which cannot be styled.
-->
<script lang="ts">
  import { parseKets } from "../lib/ui/format.ts";
  import Rich from "./Rich.svelte";

  let tip = $state<{ text: string; x: number; y: number } | null>(null);

  function onpointerover(e: PointerEvent) {
    const el = (e.target as Element).closest?.("[data-tip]");
    if (!el) return void (tip = null);
    const r = el.getBoundingClientRect();
    tip = { text: el.getAttribute("data-tip") ?? "", x: r.left + r.width / 2, y: r.top };
  }
</script>

<svelte:window {onpointerover} onscroll={() => (tip = null)} onblur={() => (tip = null)} />

{#if tip}
  <div class="tip" style:left="{tip.x}px" style:top="{tip.y}px" role="tooltip"><Rich text={parseKets(tip.text)} /></div>
{/if}

<style>
  .tip {
    position: fixed;
    z-index: 10;
    transform: translate(-50%, calc(-100% - 8px));
    padding: 4px 10px;
    border-radius: var(--radius);
    background: var(--raised);
    box-shadow: var(--shadow-2);
    color: var(--text);
    white-space: nowrap;
    pointer-events: none;
  }
</style>
