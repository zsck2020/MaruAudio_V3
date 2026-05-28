<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import type { ButtonVariant, ButtonSize } from '$lib/components/ui/Button.svelte';
  import PermissionBadge from '$lib/components/membership/PermissionBadge.svelte';
  import { membership, type FeatureKey } from '$lib/stores/membership.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** 关联的付费能力；未解锁时点击弹升级弹窗 */
    feature: FeatureKey;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    block?: boolean;
    prefixIcon?: string;
    /** 锁定时是否在按钮右侧附带权益徽标 */
    showBadge?: boolean;
    /** 已解锁时的真实动作 */
    onAction?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    feature,
    variant = 'default',
    size = 'md',
    disabled = false,
    block = false,
    prefixIcon,
    showBadge = true,
    onAction,
    children,
  }: Props = $props();

  let locked = $derived(!membership.canUseFeature(feature));

  function handleClick(event: MouseEvent) {
    if (locked) {
      membership.requestUpgrade(feature);
      return;
    }
    onAction?.(event);
  }
</script>

<span class="locked-action" class:block class:is-locked={locked}>
  <Button
    {variant}
    {size}
    {disabled}
    {block}
    prefixIcon={locked ? 'lock' : prefixIcon}
    onclick={handleClick}
  >
    {#if children}{@render children()}{/if}
  </Button>
  {#if showBadge && locked}
    <PermissionBadge {feature} locked compact />
  {/if}
</span>

<style>
  .locked-action {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .locked-action.block {
    display: flex;
    width: 100%;
  }
</style>
