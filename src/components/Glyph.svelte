<!--
  One qubit/bit cell. Fill encodes the bit (black 0, white 1).
  A line on top encodes the basis via the polarization axis:
  + basis: — |0⟩, | |1⟩      × basis: / |+⟩, \ |−⟩
  With `basis` omitted it is a plain bit; with `bit` omitted only the basis
  is drawn (a measurement setting, no outcome yet).
-->
<script lang="ts">
  import type { Basis, Bit } from "../lib/quantum/index.ts";
  import { basisKets, ket, plain } from "../lib/ui/format.ts";

  interface Props {
    bit?: Bit | null;
    basis?: Basis | null;
    size?: number;
    x?: number;
    y?: number;
  }

  let { bit = null, basis = null, size = 18, x, y }: Props = $props();

  const fill = $derived(bit === null ? "var(--well)" : bit ? "var(--one)" : "var(--zero)");
  const ink = $derived(bit === null ? "var(--muted)" : bit ? "var(--zero)" : "var(--one)");
  // SVG y grows downward, so a counter-clockwise polarization angle is negative.
  const angles = $derived(
    basis === null ? [] : bit === null ? (basis === "+" ? [0, 90] : [45, 135]) : [(basis === "+" ? 0 : 45) + 90 * bit],
  );
  const label = $derived(
    basis === null ? `bit ${bit}` : bit === null ? `basis ${plain(basisKets(basis))}` : `${plain(ket(basis, bit))}, bit ${bit}`,
  );
</script>

<svg {x} {y} width={size} height={size} viewBox="0 0 20 20" role="img" aria-label={label} data-tip={label}>
  <rect width="20" height="20" rx="2.5" {fill} />
  {#each angles as a (a)}
    <line
      x1="4.5"
      y1="10"
      x2="15.5"
      y2="10"
      stroke={ink}
      stroke-width="2"
      stroke-linecap="round"
      transform="rotate({-a} 10 10)"
    />
  {/each}
</svg>

<style>
  svg {
    display: block;
    flex: none;
    overflow: visible;
  }
</style>
