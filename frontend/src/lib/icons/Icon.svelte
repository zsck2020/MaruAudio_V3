<script module lang="ts">
  import { addCollection } from '@iconify/svelte';

  // 注册 Ant Design 图标集（离线使用，适配 Tauri 桌面端）
  // @ts-ignore - Vite 原生支持 JSON 导入
  import antDesignIcons from '@iconify-json/ant-design/icons.json';
  addCollection(antDesignIcons);
</script>

<script lang="ts">
  import IconifyIcon from '@iconify/svelte';

  let { name, size = 20, color = 'currentColor' }: {
    name: string;
    size?: number;
    color?: string;
  } = $props();

  // 短名称 → Ant Design Iconify 全名映射
  const ICON_MAP: Record<string, string> = {
    // 侧边栏菜单图标
    'home': 'ant-design:home-outlined',
    'dubbing': 'ant-design:audio-outlined',
    'project': 'ant-design:team-outlined',
    'video': 'ant-design:align-left-outlined',
    'copywriting': 'ant-design:file-text-outlined',
    'resource': 'ant-design:sound-outlined',
    'cover': 'ant-design:folder-outlined',
    'setting': 'ant-design:setting-outlined',
    'about': 'ant-design:info-circle-outlined',

    // 顶部栏图标
    'avatar': 'ant-design:user-outlined',
    'tutorial': 'ant-design:read-outlined',
    'bell': 'ant-design:bell-outlined',
    'minimize': 'ant-design:minus-outlined',
    'maximize': 'ant-design:border-outlined',
    'restore': 'ant-design:switcher-outlined',
    'close': 'ant-design:close-outlined',

    // 其他图标
    'document': 'ant-design:file-outlined',
    'microphone': 'ant-design:audio-outlined',
    'image': 'ant-design:picture-outlined',
    'help': 'ant-design:question-circle-outlined',
    'scissor': 'ant-design:scissor-outlined',
    'pause': 'ant-design:pause-circle-outlined',
    'font-size': 'ant-design:font-size-outlined',
    'number': 'ant-design:number-outlined',
    'play': 'ant-design:play-circle-outlined',
    'play-fill': 'ant-design:play-circle-filled',
    'pause-fill': 'ant-design:pause-circle-filled',
    'clock': 'ant-design:clock-circle-outlined',
    'download': 'ant-design:download-outlined',
    'upload': 'ant-design:upload-outlined',
    'import': 'ant-design:import-outlined',
    'sliders': 'ant-design:sliders-outlined',
    'heart': 'ant-design:heart-outlined',
    'sound': 'ant-design:sound-outlined',
    'thunderbolt': 'ant-design:thunderbolt-outlined',
    'experiment': 'ant-design:experiment-outlined',
    'cloud': 'ant-design:cloud-outlined',
    'redo': 'ant-design:redo-outlined',
    'file-text': 'ant-design:file-text-outlined',
    'delete': 'ant-design:delete-outlined',
    'plus': 'ant-design:plus-outlined',
    'check-circle': 'ant-design:check-circle-outlined',
    'check-circle-fill': 'ant-design:check-circle-filled',
    'build': 'ant-design:build-outlined',
    'down': 'ant-design:down-outlined',

    'search': 'ant-design:search-outlined',
    'filter': 'ant-design:filter-outlined',
    'sort': 'ant-design:swap-outlined',
    'sync': 'ant-design:sync-outlined',
    'refresh': 'ant-design:reload-outlined',
    'refresh-cw': 'ant-design:reload-outlined',
    'edit': 'ant-design:edit-outlined',
    'copy': 'ant-design:copy-outlined',
    'save': 'ant-design:save-outlined',
    'more': 'ant-design:more-outlined',
    'ellipsis': 'ant-design:ellipsis-outlined',
    'eye': 'ant-design:eye-outlined',
    'eye-invisible': 'ant-design:eye-invisible-outlined',
    'close-circle': 'ant-design:close-circle-outlined',
    'plus-circle': 'ant-design:plus-circle-outlined',
    'minus-circle': 'ant-design:minus-circle-outlined',
    'info': 'ant-design:info-circle-outlined',
    'warning': 'ant-design:warning-outlined',
    'info-circle': 'ant-design:info-circle-outlined',
    'star': 'ant-design:star-outlined',
    'star-fill': 'ant-design:star-filled',
    'heart-fill': 'ant-design:heart-filled',
    'gift': 'ant-design:gift-outlined',
    'crown': 'ant-design:crown-outlined',
    'rocket': 'ant-design:rocket-outlined',
    'fire': 'ant-design:fire-outlined',
    'bell-fill': 'ant-design:bell-filled',
    'mail': 'ant-design:mail-outlined',
    'message': 'ant-design:message-outlined',
    'smile': 'ant-design:smile-outlined',
    'frown': 'ant-design:frown-outlined',
    'meh': 'ant-design:meh-outlined',
    'alert-circle': 'ant-design:warning-outlined',
    'x-circle': 'ant-design:close-circle-outlined',
    'cloud-rain': 'ant-design:cloud-outlined',
    'zap': 'ant-design:thunderbolt-outlined',
    'moon': 'ant-design:moon-outlined',
    'type': 'ant-design:font-size-outlined',
    'mic': 'ant-design:audio-outlined',
    'x': 'ant-design:close-outlined',
    'link': 'ant-design:link-outlined',
    'share': 'ant-design:share-alt-outlined',
    'qrcode': 'ant-design:qrcode-outlined',
    'wallet': 'ant-design:wallet-outlined',
    'credit-card': 'ant-design:credit-card-outlined',
    'bar-chart': 'ant-design:bar-chart-outlined',
    'line-chart': 'ant-design:line-chart-outlined',
    'pie-chart': 'ant-design:pie-chart-outlined',
    'project-box': 'ant-design:project-outlined',
    'team': 'ant-design:team-outlined',
    'user-add': 'ant-design:user-add-outlined',
    'usergroup': 'ant-design:usergroup-add-outlined',
    'desktop': 'ant-design:desktop-outlined',
    'mobile': 'ant-design:mobile-outlined',
    'tablet': 'ant-design:tablet-outlined',
    'apple': 'ant-design:apple-outlined',
    'windows': 'ant-design:windows-outlined',
    'wifi': 'ant-design:wifi-outlined',
    'cloud-upload': 'ant-design:cloud-upload-outlined',
    'cloud-download': 'ant-design:cloud-download-outlined',
    'cloud-sync': 'ant-design:cloud-sync-outlined',
    'cloud-server': 'ant-design:cloud-server-outlined',
    'database': 'ant-design:database-outlined',
    'hdd': 'ant-design:hdd-outlined',
    'thunder-fill': 'ant-design:thunderbolt-filled',
    'lock': 'ant-design:lock-outlined',
    'unlock': 'ant-design:unlock-outlined',
    'key': 'ant-design:key-outlined',
    'safety': 'ant-design:safety-certificate-outlined',
    'shield': 'ant-design:safety-outlined',
    'logout': 'ant-design:poweroff-outlined',
    'translation': 'ant-design:translation-outlined',
    'subtitle': 'ant-design:file-text-outlined',
    'snippets': 'ant-design:snippets-outlined',
    'audio-mute': 'ant-design:audio-muted-outlined',
    'volume-up': 'ant-design:sound-outlined',
    'fast-forward': 'ant-design:fast-forward-outlined',
    'fast-backward': 'ant-design:fast-backward-outlined',
    'step-forward': 'ant-design:step-forward-outlined',
    'step-backward': 'ant-design:step-backward-outlined',
    'zoom-in': 'ant-design:zoom-in-outlined',
    'zoom-out': 'ant-design:zoom-out-outlined',
    'fullscreen': 'ant-design:fullscreen-outlined',
    'fullscreen-exit': 'ant-design:fullscreen-exit-outlined',
    'merge-cells': 'ant-design:merge-cells-outlined',
    'split-cells': 'ant-design:split-cells-outlined',
    'swap': 'ant-design:swap-outlined',
    'retweet': 'ant-design:retweet-outlined',
    'drag': 'ant-design:drag-outlined',
    'menu': 'ant-design:menu-outlined',
    'appstore': 'ant-design:appstore-outlined',
    'bars': 'ant-design:bars-outlined',
    'github': 'ant-design:github-outlined',
    'global': 'ant-design:global-outlined',
    'phone': 'ant-design:phone-outlined',
    'customer-service': 'ant-design:customer-service-outlined',
    'tag': 'ant-design:tag-outlined',
    'tags': 'ant-design:tags-outlined',
    'history': 'ant-design:history-outlined',
    'right': 'ant-design:right-outlined',
    'left': 'ant-design:left-outlined',
    'up': 'ant-design:up-outlined',
    'arrow-right': 'ant-design:arrow-right-outlined',
    'arrow-up': 'ant-design:arrow-up-outlined',
    'arrow-down': 'ant-design:arrow-down-outlined',
    'arrow-left': 'ant-design:arrow-left-outlined',
    'plus-square': 'ant-design:plus-square-outlined',
    'folder-add': 'ant-design:folder-add-outlined',
    'folder-open': 'ant-design:folder-open-outlined',
    'file-audio': 'ant-design:file-outlined',
    'file-video': 'ant-design:video-camera-outlined',
    'file-zip': 'ant-design:file-zip-outlined',
    'video-camera': 'ant-design:video-camera-outlined',
    'inbox': 'ant-design:inbox-outlined',
    'export': 'ant-design:export-outlined',
    'idcard': 'ant-design:idcard-outlined',
    'gateway': 'ant-design:gateway-outlined',
    'aim': 'ant-design:aim-outlined',
    'flag': 'ant-design:flag-outlined',
    'compass': 'ant-design:compass-outlined',
    'control': 'ant-design:control-outlined',
    'dashboard': 'ant-design:dashboard-outlined',
    'environment': 'ant-design:environment-outlined',
    'library': 'ant-design:database-outlined',
    'sound-fill': 'ant-design:sound-filled',
  };

  // 支持短名称和完整 iconify 名称（含 ":"）
  const iconName = $derived(ICON_MAP[name] || name);

  $effect(() => {
    if (!ICON_MAP[name] && !name.includes(':') && import.meta.env.DEV) {
      console.warn(`Icon "${name}" not found in ICON_MAP, using as-is`);
    }
  });
</script>

<IconifyIcon
  icon={iconName}
  width={size}
  height={size}
  {color}
  style="display: block; vertical-align: middle; flex-shrink: 0;"
/>
