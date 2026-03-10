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
