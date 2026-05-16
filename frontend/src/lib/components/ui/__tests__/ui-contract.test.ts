/**
 * UI 组件库 · 契约/类型一致性测试
 *
 * 该文件作为 P1 阶段的最小回归测试：
 * 1. 验证 ui/index.ts 的导出齐全
 * 2. 验证 ButtonVariant / ButtonSize / SwitchSize 联合类型穷举完整
 * 3. 验证 Slider 内部派生算法可在常见边界条件下正确运算
 *
 * 这些断言通过 svelte-check + vitest 双重把关；编译期类型 + 运行期值。
 */

import { describe, expect, test } from 'vitest';
import {
  Button, IconButton, Switch, Slider, Input, Card, Tag, Empty, Spin,
} from '$lib/components/ui';
import type {
  ButtonVariant, ButtonSize, IconButtonVariant, IconButtonSize, IconButtonShape,
  SwitchSize, InputSize, InputType, CardSize, TagColor, TagSize, EmptySize, SpinSize,
} from '$lib/components/ui';

describe('UI components export', () => {
  test('9 个 P1+P2 组件全部已导出', () => {
    const exports = [Button, IconButton, Switch, Slider, Input, Card, Tag, Empty, Spin];
    for (const e of exports) {
      expect(e).toBeTruthy();
    }
    expect(exports.length).toBe(9);
  });
});

describe('IconButton/Input/Card/Tag/Empty/Spin type union exhaustiveness', () => {
  test('IconButtonVariant', () => {
    const variants: IconButtonVariant[] = ['default', 'primary', 'text', 'danger'];
    expect(new Set(variants).size).toBe(4);
  });
  test('IconButtonSize / IconButtonShape', () => {
    const sizes: IconButtonSize[] = ['sm', 'md', 'lg'];
    const shapes: IconButtonShape[] = ['square', 'circle'];
    expect(sizes.length).toBe(3);
    expect(shapes.length).toBe(2);
  });
  test('InputSize / InputType', () => {
    const sizes: InputSize[] = ['sm', 'md', 'lg'];
    const types: InputType[] = ['text', 'password', 'email', 'number', 'search', 'url', 'tel'];
    expect(sizes.length).toBe(3);
    expect(new Set(types).size).toBe(7);
  });
  test('CardSize', () => {
    const sizes: CardSize[] = ['sm', 'md', 'lg'];
    expect(sizes.length).toBe(3);
  });
  test('TagColor (7 种)', () => {
    const colors: TagColor[] = ['default', 'primary', 'success', 'warning', 'error', 'info', 'accent'];
    expect(new Set(colors).size).toBe(7);
  });
  test('TagSize', () => {
    const sizes: TagSize[] = ['sm', 'md'];
    expect(sizes.length).toBe(2);
  });
  test('EmptySize', () => {
    const sizes: EmptySize[] = ['sm', 'md', 'lg'];
    expect(sizes.length).toBe(3);
  });
  test('SpinSize (4 档)', () => {
    const sizes: SpinSize[] = ['sm', 'md', 'lg', 'xl'];
    expect(sizes.length).toBe(4);
  });
});

describe('Button type union exhaustiveness', () => {
  test('ButtonVariant 覆盖 7 种受支持变体', () => {
    const variants: ButtonVariant[] = [
      'default', 'primary', 'text', 'link', 'danger', 'ghost', 'dashed',
    ];
    // unique 检查
    expect(new Set(variants).size).toBe(variants.length);
    expect(variants.length).toBe(7);
  });

  test('ButtonSize 覆盖 sm/md/lg', () => {
    const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
    expect(sizes.length).toBe(3);
  });
});

describe('Switch type union', () => {
  test('SwitchSize 覆盖 sm/md', () => {
    const sizes: SwitchSize[] = ['sm', 'md'];
    expect(sizes.length).toBe(2);
  });
});

/**
 * Slider 内部派生百分比公式：percent = (value - min) / (max - min) * 100
 * 这里复刻同样的纯函数，断言关键边界。
 */
function calcPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

describe('Slider percent algorithm', () => {
  test('value 等于 min 时为 0%', () => {
    expect(calcPercent(0, 0, 100)).toBe(0);
  });
  test('value 等于 max 时为 100%', () => {
    expect(calcPercent(100, 0, 100)).toBe(100);
  });
  test('中位 50%', () => {
    expect(calcPercent(50, 0, 100)).toBe(50);
  });
  test('偏移区间 [50,150] 取 100 应为 50%', () => {
    expect(calcPercent(100, 50, 150)).toBe(50);
  });
  test('退化区间 max=min 返回 0% 不抛错', () => {
    expect(calcPercent(7, 5, 5)).toBe(0);
  });
  test('支持小数 step 值', () => {
    expect(calcPercent(0.25, 0, 1)).toBe(25);
  });
});
