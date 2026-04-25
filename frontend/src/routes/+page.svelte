<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import BannerCarousel from '$lib/components/BannerCarousel.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { BannerItem } from '$lib/types';
  import { MENU_ROUTES } from '$lib/utils/navigation';
  import type { MenuKey } from '$lib/types';

  const fallbackBanners: BannerItem[] = [
    { id: 1, title: '丸子配音 · 智能语音创作平台', image_url: '/banner-1.svg', link_url: '', link_type: 'none' },
    { id: 2, title: '多角色配音 · 一键生成对话', image_url: '/banner-2.svg', link_url: '', link_type: 'none' },
    { id: 3, title: '智能字幕 · 精准对轴', image_url: '/banner-3.svg', link_url: '', link_type: 'none' },
  ];

  let banners: BannerItem[] = $state(fallbackBanners);

  async function loadBanners() {
    try {
      const data = await invoke<BannerItem[]>('get_banners');
      if (Array.isArray(data) && data.length > 0) {
        banners = data.map((b) => ({
          id: b.id,
          title: b.title,
          image_url: b.image_url?.startsWith('http') ? b.image_url : `https://auth.wzagent.cn${b.image_url?.startsWith('/') ? '' : '/'}${b.image_url}`,
          link_url: b.link_url || '',
          link_type: b.link_type || 'none',
        }));
      }
    } catch (e) {
      console.warn('加载远程Banner失败，使用本地默认Banner', e);
    }
  }

  async function handleBannerClick(banner: BannerItem) {
    if (banner.link_type === 'url' && banner.link_url) {
      let url = banner.link_url;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } else if (banner.link_type === 'page' && banner.link_url) {
      const route = MENU_ROUTES[banner.link_url as MenuKey];
      if (route) goto(route);
    }
  }

  let bannerPointerStart = { x: 0, y: 0, time: 0 };

  function handleBannerPointerDown(e: PointerEvent) {
    bannerPointerStart = { x: e.clientX, y: e.clientY, time: Date.now() };
  }

  function handleBannerPointerUp(e: PointerEvent, banner: BannerItem) {
    const dx = Math.abs(e.clientX - bannerPointerStart.x);
    const dy = Math.abs(e.clientY - bannerPointerStart.y);
    const dt = Date.now() - bannerPointerStart.time;
    if (dx < 6 && dy < 6 && dt < 400) {
      handleBannerClick(banner);
    }
  }

  onMount(() => {
    loadBanners();
  });
</script>

<div class="carousel-container">
  <BannerCarousel items={banners} autoplayDuration={5000} duration={500}>
    {#snippet children(banner)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="carousel-item"
        class:clickable={banner.link_type !== 'none'}
        role={banner.link_type !== 'none' ? 'button' : 'img'}
        tabindex={banner.link_type !== 'none' ? 0 : -1}
        onpointerdown={handleBannerPointerDown}
        onpointerup={(e) => handleBannerPointerUp(e, banner as BannerItem)}
        onkeydown={(e) => e.key === 'Enter' && handleBannerClick(banner as BannerItem)}
      >
        <img src={(banner as BannerItem).image_url} alt={(banner as BannerItem).title} class="carousel-image" />
      </div>
    {/snippet}
  </BannerCarousel>
</div>

<style>
  .carousel-container {
    margin-left: 20px;
    margin-right: 20px;
    margin-top: 11px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--color-border-secondary);
  }

  @media (max-width: 768px) {
    .carousel-container {
      margin-left: 12px;
      margin-right: 12px;
    }
  }

  .carousel-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .carousel-item.clickable {
    cursor: pointer;
  }

  .carousel-image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
  }
</style>
