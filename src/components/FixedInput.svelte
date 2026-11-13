<!--
  Fixed-length input in overwrite mode, like a one-time-code field: the length
  never changes, typing replaces the highlighted character and moves on, and
  only characters accepted by `normalize` get in.
-->
<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    value: string;
    /** Canonical form of a typed character, or null to reject it. */
    normalize: (c: string) => string | null;
    /** Positions that cannot be edited; the cursor skips them. */
    locked?: (i: number) => boolean;
    disabled?: boolean;
    title?: string;
    onchange: (value: string) => void;
  }

  let {
    value,
    normalize,
    locked = () => false,
    disabled = false,
    title,
    onchange,
  }: Props = $props();

  let el: HTMLInputElement;
  let rejected = $state(false);
  let timer = 0;

  const n = $derived(value.length);

  /** First editable position at or after i (n when there is none). */
  function editable(i: number) {
    while (i < n && locked(i)) i++;
    return i;
  }

  /** Next editable position in a direction; stays put at the start. */
  function move(from: number, dir: 1 | -1) {
    let i = from + dir;
    while (i >= 0 && i < n && locked(i)) i += dir;
    return i < 0 ? from : Math.min(i, n);
  }

  /** Highlight the character at i, so it reads as a block cursor. */
  function select(i: number) {
    el.setSelectionRange(i, Math.min(n, i + 1));
  }

  function flash() {
    rejected = true;
    clearTimeout(timer);
    timer = window.setTimeout(() => (rejected = false), 300);
  }

  function write(text: string) {
    const chars = [...value];
    let i = editable(el.selectionStart ?? 0);
    for (const c of text) {
      if (/\s/.test(c)) continue;
      const v = normalize(c);
      if (v === null) {
        flash();
        continue;
      }
      if (i >= n) break;
      chars[i] = v;
      i = editable(i + 1);
    }
    const next = chars.join("");
    if (next !== value) onchange(next);
    // The new value re-renders the input, which resets the cursor.
    tick().then(() => select(i));
  }

  function onbeforeinput(e: InputEvent) {
    e.preventDefault();
    const pos = el.selectionStart ?? 0;
    switch (e.inputType) {
      case "insertText":
      case "insertFromPaste":
      case "insertFromDrop":
        write(e.data ?? e.dataTransfer?.getData("text/plain") ?? "");
        break;
      // Nothing can be deleted: backspace and delete only move the cursor.
      case "deleteContentBackward":
        select(move(pos, -1));
        break;
      case "deleteContentForward":
        select(move(pos, 1));
        break;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.shiftKey) return;
    const pos = el.selectionStart ?? 0;
    const to =
      e.key === "ArrowLeft"
        ? move(pos, -1)
        : e.key === "ArrowRight"
          ? move(pos, 1)
          : e.key === "Home"
            ? editable(0)
            : e.key === "End"
              ? n
              : null;
    if (to === null) return;
    e.preventDefault();
    select(to);
  }

  /** After a click or focus, snap the cursor onto one editable character. */
  function snap() {
    requestAnimationFrame(() => {
      if (document.activeElement === el)
        select(editable(el.selectionStart ?? 0));
    });
  }
</script>

<input
  bind:this={el}
  type="text"
  spellcheck="false"
  autocomplete="off"
  {disabled}
  {title}
  {value}
  class:rejected
  {onbeforeinput}
  {onkeydown}
  onpointerup={snap}
  onfocus={snap}
/>

<style>
  input {
    width: 100%;
    letter-spacing: 0.08em;
    caret-color: transparent;
    transition: box-shadow 0.15s;
  }
  input::selection {
    background: var(--one);
    color: var(--zero);
  }
  input.rejected {
    box-shadow:
      var(--inset),
      0 0 0 1px var(--err);
  }
</style>
