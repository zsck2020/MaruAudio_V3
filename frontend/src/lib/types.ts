export type MenuKey =
  | 'home'
  | 'video'
  | 'copywriting'
  | 'dubbing'
  | 'cover'
  | 'resource'
  | 'project'
  | 'setting'
  | 'about';

export interface MenuItemConfig {
  key: MenuKey;
  icon: string;
  label: string;
  tooltip: string;
}

export interface BannerItem {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  link_type: 'none' | 'url' | 'page';
}
