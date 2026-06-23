<script lang="ts">
  interface Props {
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    disabled?: boolean;
    marks?: Record<number, string>;
    showValue?: boolean;
    formatValue?: (v: number) => string;
    ariaLabel?: string;
    onchange?: (value: number) => void;
  }

  let {
    min = 0,
    max = 100,
    step = 1,
    value = $bindable(0),
    disabled = false,
    marks,
    showValue = false,
    formatValue,
    ariaLabel,
    onchange,
  }: Props = $props();

  let percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100);

  function handleInput(event: Event) {
    if (disabled) return;
    const target = event.target as HTMLInputElement;
    const next = Number(target.value);
    value = next;
    onchange?.(next);
  }

  let sortedMarks = $derived(
    marks
      ? Object.entries(marks)
          .map(([k, label]) => ({ pos: Number(k), label }))
          .sort((a, b) => a.pos - b.pos)
      : [],
  );

  function markPercent(pos: number): number {
    if (max === min) return 0;
    return ((pos - min) / (max - min)) * 100;
  }
</script>

<div class="ui-slider" class:disabled>
  <div class="track-wrap">
    <div class="track" aria-hidden="true">
      <div class="fill" style="width: {percent}%"></div>
    </div>
    <input
      type="range"
      class="range"
      style="--progress: {percent}%"
      {min}
      {max}
      {step}
      {value}
      {disabled}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      oninput={handleInput}
    />
  </div>

  {#if showValue}
    <span class="value-display">
      {formatValue ? formatValue(value) : value}
    </span>
  {/if}

  {#if sortedMarks.length > 0}
    <div class="marks" aria-hidden="true">
      {#each sortedMarks as mark (mark.pos)}
        <span class="mark" style="left: {markPercent(mark.pos)}%">{mark.label}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ui-slider {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .ui-slider.disabled {
    opacity: 0.55;
    pointer-events: none;
  }

  .track-wrap {
    position: relative;
    height: 18px;
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .track {
    position: absolute;
    inset: auto 0;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.20);
    border-radius: 2px;
    pointer-events: none;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 2px;
    transition: width var(--motion-duration-fast) linear;
  }

  .range {
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }

  .range:focus-visible {
    outline: none;
  }
  .range:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 4px var(--color-focus-ring);
  }

  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: grab;
    transition: transform var(--motion-duration-fast) var(--motion-ease-base);
  }

  .range:hover::-webkit-slider-thumb {
    transform: scale(1.12);
    border-color: var(--color-primary-hover);
  }

  .range:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.2);
    border-color: var(--color-primary-active);
  }

  .range:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: grab;
  }

  .range:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .value-display {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    align-self: flex-end;
  }

  .marks {
    position: relative;
    height: 16px;
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
  }

  .mark {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .mark:first-child {
    transform: translateX(0);
  }
  .mark:last-child {
    transform: translateX(-100%);
  }
</style>
