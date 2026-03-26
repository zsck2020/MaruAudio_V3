import type { MenuKey } from '$lib/types';

export const MENU_ROUTES: Record<MenuKey, string> = {
  home: '/',
  dubbing: '/dubbing',
  project: '/project',
  video: '/video',
  copywriting: '/copywriting',
  resource: '/resource',
  cover: '/cover',
  setting: '/setting',
  about: '/about',
};

export const ROUTE_TO_MENU: Record<string, MenuKey> = Object.fromEntries(
  Object.entries(MENU_ROUTES).map(([key, route]) => [route, key as MenuKey])
) as Record<string, MenuKey>;

export const MENU_LABELS: Record<MenuKey, string> = {
  home: '首页',
  dubbing: '配音',
  project: '多角色配音',
  video: '对轴',
  copywriting: '字幕',
  resource: '音库',
  cover: '文件',
  setting: '设置',
  about: '关于',
};

export function getMenuKeyFromPath(pathname: string): MenuKey {
  return ROUTE_TO_MENU[pathname] ?? 'home';
}
