<script lang="ts">
  import { onDestroy } from "svelte";
  import Controls from "./components/Controls.svelte";
  import Ledger from "./components/Ledger.svelte";
  import Legend from "./components/Legend.svelte";
  import Stages from "./components/Stages.svelte";
  import Tooltip from "./components/Tooltip.svelte";
  import { Player, STAGES } from "./lib/ui/player.svelte.ts";

  const player = new Player();
  onDestroy(() => player.destroy());

  const eveOn = $derived(player.config.eve.enabled);

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (e.ctrlKey || e.metaKey || e.altKey || el.closest("input, select, textarea")) return;
    // Let a focused button handle its own activation keys.
    if (el.closest("button") && (e.key === " " || e.key === "Enter")) return;
    const actions: Record<string, () => void> = {
      " ": () => player.toggle(),
      ArrowRight: () => player.next(),
      ArrowLeft: () => player.prev(),
      e: () => player.end(),
      r: () => player.restart(),
      n: () => player.newRun(),
    };
    const run = actions[e.key];
    if (run) {
      e.preventDefault();
      run();
    }
  }
</script>

<svelte:window {onkeydown} />
<Tooltip />

<main>
  <header>
    <h1>bb84</h1>
    <p class="muted">quantum key distribution, stage by stage</p>
  </header>

  <Controls {player} />

  <div class="layout">
    <Ledger result={player.result} progress={STAGES.map((_, i) => player.progress(i))} {eveOn} />
    <Stages {player} />
  </div>

  <Legend />
</main>

<style>
  main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 20px 48px;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
    padding: 0 4px;
  }
  h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  header p {
    margin: 0;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: var(--gap);
    align-items: stretch;
  }
  @media (max-width: 960px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
