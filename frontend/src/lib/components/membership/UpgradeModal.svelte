<script lang="ts">
  import { goto } from '$app/navigation';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import { membership } from '$lib/stores/membership.svelte';
  import PermissionBadge from './PermissionBadge.svelte';

  let feature = $derived(membership.upgradeFeature);

  function close() {
    membership.closeUpgrade();
  }

  function openProfile() {
    close();
    void goto('/profile');
  }
</script>

<Modal
  open={membership.upgradeOpen}
  title={feature ? `解锁${feature.title}` : '升级权益'}
  description="一次买断本地无限生成，云端按需加购字符包"
  size="md"
  icon={feature?.icon ?? 'crown'}
  onClose={close}
>
  {#if feature}
    <div class="upgrade-body">
      <section class="feature-card">
        <div class="feature-icon">
          <Icon name={feature.icon} size={24} color="var(--color-primary)" />
        </div>
        <div class="feature-copy">
          <div class="feature-title-row">
            <strong>{feature.title}</strong>
            <PermissionBadge feature={feature.key} locked />
          </div>
          <p>{feature.description}</p>
        </div>
      </section>

      <div class="benefits">
        {#each feature.bullets as item (item)}
          <div class="benefit-item">
            <Icon name="check-circle" size={14} color="var(--color-success)" />
            <span>{item}</span>
          </div>
        {/each}
      </div>

      <section class="price-card">
        <div>
          <span class="price-label">推荐方案</span>
          <strong>旗舰版 ¥198 永久</strong>
          <p>本地轻量 + 情感双引擎无限生成，多角色、批量、无水印完整开放。</p>
        </div>
        <div class="cloud-note">
          <Icon name="cloud" size={14} color="var(--color-info)" />
          <span>云端引擎只扣云端字符，本地生成永不扣字。</span>
        </div>
      </section>
    </div>
  {/if}

  {#snippet footer()}
    <Button variant="default" onclick={close}>稍后再说</Button>
    <Button variant="primary" prefixIcon="crown" onclick={openProfile}>查看套餐</Button>
  {/snippet}
</Modal>

<style>
  .upgrade-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .feature-card,
  .price-card {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: var(--color-bg-container);
  }

  .feature-card {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    flex-shrink: 0;
  }

  .feature-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .feature-title-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .feature-title-row strong {
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  .feature-copy p,
  .price-card p,
  .cloud-note {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    line-height: 1.6;
  }

  .benefits {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-sm);
  }

  .benefit-item {
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 var(--spacing-sm);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-base);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .price-card {
    padding: var(--spacing-md);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .price-label {
    display: block;
    margin-bottom: 4px;
    color: var(--color-warning);
    font-size: var(--font-size-xs);
  }

  .price-card strong {
    display: block;
    color: var(--color-text);
    font-size: 22px;
    margin-bottom: 6px;
  }

  .cloud-note {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 190px;
  }
</style>
