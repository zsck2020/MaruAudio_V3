import { describe, it, expect } from 'vitest';
import { MENU_ROUTES, ROUTE_TO_MENU, MENU_LABELS, getMenuKeyFromPath } from './navigation';
import type { MenuKey } from '$lib/types';

describe('navigation utils', () => {
  describe('MENU_ROUTES', () => {
    it('should have routes for all menu keys', () => {
      expect(MENU_ROUTES.home).toBe('/');
      expect(MENU_ROUTES.dubbing).toBe('/dubbing');
      expect(MENU_ROUTES.project).toBe('/project');
      expect(MENU_ROUTES.video).toBe('/video');
      expect(MENU_ROUTES.copywriting).toBe('/copywriting');
      expect(MENU_ROUTES.resource).toBe('/resource');
      expect(MENU_ROUTES.cover).toBe('/cover');
      expect(MENU_ROUTES.setting).toBe('/setting');
      expect(MENU_ROUTES.about).toBe('/about');
    });

    it('should have all routes start with /', () => {
      Object.values(MENU_ROUTES).forEach((route) => {
        expect(route).toMatch(/^\//);
      });
    });
  });

  describe('ROUTE_TO_MENU', () => {
    it('should be inverse mapping of MENU_ROUTES', () => {
      Object.entries(MENU_ROUTES).forEach(([key, route]) => {
        expect(ROUTE_TO_MENU[route]).toBe(key);
      });
    });

    it('should map all routes back to menu keys', () => {
      expect(ROUTE_TO_MENU['/']).toBe('home');
      expect(ROUTE_TO_MENU['/dubbing']).toBe('dubbing');
      expect(ROUTE_TO_MENU['/project']).toBe('project');
      expect(ROUTE_TO_MENU['/video']).toBe('video');
      expect(ROUTE_TO_MENU['/copywriting']).toBe('copywriting');
      expect(ROUTE_TO_MENU['/resource']).toBe('resource');
      expect(ROUTE_TO_MENU['/cover']).toBe('cover');
      expect(ROUTE_TO_MENU['/setting']).toBe('setting');
      expect(ROUTE_TO_MENU['/about']).toBe('about');
    });
  });

  describe('MENU_LABELS', () => {
    it('should have Chinese labels for all menu keys', () => {
      expect(MENU_LABELS.home).toBe('首页');
      expect(MENU_LABELS.dubbing).toBe('配音');
      expect(MENU_LABELS.project).toBe('多角色配音');
      expect(MENU_LABELS.video).toBe('对轴');
      expect(MENU_LABELS.copywriting).toBe('字幕');
      expect(MENU_LABELS.resource).toBe('音库');
      expect(MENU_LABELS.cover).toBe('文件');
      expect(MENU_LABELS.setting).toBe('设置');
      expect(MENU_LABELS.about).toBe('关于');
    });

    it('should have labels for all menu keys in MENU_ROUTES', () => {
      Object.keys(MENU_ROUTES).forEach((key) => {
        expect(MENU_LABELS[key as MenuKey]).toBeDefined();
        expect(typeof MENU_LABELS[key as MenuKey]).toBe('string');
        expect(MENU_LABELS[key as MenuKey].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getMenuKeyFromPath', () => {
    it('should return correct menu key for valid paths', () => {
      expect(getMenuKeyFromPath('/')).toBe('home');
      expect(getMenuKeyFromPath('/dubbing')).toBe('dubbing');
      expect(getMenuKeyFromPath('/project')).toBe('project');
      expect(getMenuKeyFromPath('/video')).toBe('video');
      expect(getMenuKeyFromPath('/copywriting')).toBe('copywriting');
      expect(getMenuKeyFromPath('/resource')).toBe('resource');
      expect(getMenuKeyFromPath('/cover')).toBe('cover');
      expect(getMenuKeyFromPath('/setting')).toBe('setting');
      expect(getMenuKeyFromPath('/about')).toBe('about');
    });

    it('should return home for unknown paths', () => {
      expect(getMenuKeyFromPath('/unknown')).toBe('home');
      expect(getMenuKeyFromPath('/not-exist')).toBe('home');
      expect(getMenuKeyFromPath('')).toBe('home');
    });

    it('should handle paths with trailing slashes', () => {
      expect(getMenuKeyFromPath('/dubbing/')).toBe('home'); // Not in ROUTE_TO_MENU
    });

    it('should handle nested paths', () => {
      expect(getMenuKeyFromPath('/dubbing/edit')).toBe('home'); // Not in ROUTE_TO_MENU
    });
  });
});
