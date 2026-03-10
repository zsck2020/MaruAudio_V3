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
