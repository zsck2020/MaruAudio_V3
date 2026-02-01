<template>
  <div class="title-bar" data-tauri-drag-region>
    <div class="title-bar-left">
      <img src="/logo.svg" alt="丸子配音" class="title-bar-logo" />
      <span class="title-bar-title">丸子配音</span>
    </div>
    <div class="title-bar-right">
      <a-button
        type="text"
        size="small"
        class="title-bar-button"
        @click="handleMinimize"
        title="最小化"
      >
        <template #icon>
          <MinusOutlined />
        </template>
      </a-button>
      <a-button
        type="text"
        size="small"
        class="title-bar-button"
        @click="handleMaximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <template #icon>
          <CompressOutlined v-if="isMaximized" />
          <ExpandOutlined v-else />
        </template>
      </a-button>
      <a-button
        type="text"
        size="small"
        class="title-bar-button title-bar-button-close"
        @click="handleClose"
        title="关闭"
      >
        <template #icon>
          <CloseOutlined />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  MinusOutlined,
  ExpandOutlined,
  CompressOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'

const isMaximized = ref(false)
let appWindow: any = null

onMounted(async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    appWindow = getCurrentWindow()
    
    isMaximized.value = await appWindow.isMaximized()
    
    appWindow.onResized(async () => {
      isMaximized.value = await appWindow.isMaximized()
    })
  } catch (error) {
    console.warn('Tauri window API not available (running in browser):', error)
  }
})

const handleMinimize = async () => {
  if (!appWindow) return
  try {
    await appWindow.minimize()
  } catch (error) {
    console.error('Failed to minimize window:', error)
  }
}

const handleMaximize = async () => {
  if (!appWindow) return
  try {
    await appWindow.toggleMaximize()
    isMaximized.value = await appWindow.isMaximized()
  } catch (error) {
    console.error('Failed to toggle maximize:', error)
  }
}

const handleClose = async () => {
  if (!appWindow) return
  try {
    await appWindow.close()
  } catch (error) {
    console.error('Failed to close window:', error)
  }
}
</script>

<style scoped>
.title-bar {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  user-select: none;
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;
  background-color: var(--ant-color-bg-container);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  -webkit-app-region: drag;
}

.title-bar-logo {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.title-bar-title {
  font-size: var(--ant-font-size);
  font-weight: 500;
  color: var(--ant-color-text);
  white-space: nowrap;
}

.title-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.title-bar-button {
  width: 46px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0;
}

.title-bar-button :deep(.anticon) {
  font-size: 12px;
}

.title-bar-button-close:hover {
  background-color: var(--ant-color-error);
  color: #ffffff;
}

.title-bar-button-close:hover :deep(.anticon) {
  color: #ffffff;
}
</style>
