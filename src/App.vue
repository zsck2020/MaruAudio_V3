<template>
  <a-config-provider :theme="themeConfig">
    <a-layout class="app-container">
      <TitleBar />
      <a-layout class="app-body">
        <Sidebar />
        <a-layout-content class="app-content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import TitleBar from '@/components/common/TitleBar.vue'
import Sidebar from '@/components/common/Sidebar.vue'

const themeConfig = ref<ThemeConfig>({
  token: {
    // 主色系 - 极光蓝色系
    colorPrimary: '#2F54EB',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#2F54EB',
    
    // 文本色
    colorText: 'rgba(0, 0, 0, 0.85)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
    
    // 背景色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#fafafa',
    colorBgSpotlight: '#f5f5f5',
    
    // 边框色
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    lineHeight: 1.5715,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02)',
    boxShadowTertiary: '0 1px 2px rgba(0, 0, 0, 0.03)',
    
    // 动画
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    motionEaseIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  },
  components: {
    Layout: {
      bodyBg: '#ffffff',
      headerBg: '#ffffff',
      headerHeight: 50,
      headerPadding: '0 12px',
      siderBg: '#ffffff',
      footerBg: '#fafafa',
      footerPadding: '16px 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#fafafa',
      itemSelectedColor: '#2F54EB',
      itemHoverBg: '#f5f5f5',
      itemActiveBg: '#F0F5FF',
      itemMarginInline: 0,
      itemMarginBlock: 0,
      itemBorderRadius: 4,
      horizontalItemBorderRadius: 4,
      subMenuItemBorderRadius: 4,
      iconSize: 14,
      iconMarginInlineEnd: 12,
      collapsedIconSize: 16,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingInline: 15,
      paddingInlineLG: 19,
      paddingInlineSM: 7,
      fontWeight: 400,
      primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
    },
    Typography: {
      titleMarginBottom: '0.5em',
      titleMarginTop: '1.2em',
      fontWeightStrong: 600,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingInline: 11,
      paddingInlineLG: 15,
      paddingInlineSM: 7,
    },
  },
  hashed: false,
  algorithm: undefined,
})
</script>

<style>
/* 引入全局样式 */
@import '@/assets/styles/main.css';

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  min-width: 320px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.app-body {
  height: calc(100vh - 50px);
  overflow: hidden;
}

.app-content {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
  #app {
    overflow-x: hidden;
  }
}
</style>

