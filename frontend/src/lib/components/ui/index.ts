/**
 * V3 统一组件库导出（受 V2 设计规范启发，基于 V3 设计令牌）
 *
 * 路径约定：`$lib/components/ui/<ComponentName>`
 *
 * 使用：
 *   import { Button, IconButton, Switch, Slider, Input, Card, Tag, Empty, Spin } from '$lib/components/ui';
 */

export { default as Button } from './Button.svelte';
export type { ButtonVariant, ButtonSize } from './Button.svelte';

export { default as IconButton } from './IconButton.svelte';
export type { IconButtonVariant, IconButtonSize, IconButtonShape } from './IconButton.svelte';

export { default as Switch } from './Switch.svelte';
export type { SwitchSize } from './Switch.svelte';

export { default as Slider } from './Slider.svelte';

export { default as Input } from './Input.svelte';
export type { InputSize, InputType } from './Input.svelte';

export { default as Card } from './Card.svelte';
export type { CardSize } from './Card.svelte';

export { default as Tag } from './Tag.svelte';
export type { TagColor, TagSize } from './Tag.svelte';

export { default as Empty } from './Empty.svelte';
export type { EmptySize } from './Empty.svelte';

export { default as Spin } from './Spin.svelte';
export type { SpinSize } from './Spin.svelte';

export { default as Select } from './Select.svelte';
export type { SelectOption } from './Select.svelte';

export { default as Segmented } from './Segmented.svelte';
export type { SegmentOption } from './Segmented.svelte';
