<template>
  <a-layout-sider
    :width="200"
    class="sidebar"
    :collapsed="false"
    :collapsible="false"
    theme="light"
  >
    <a-menu
      :selected-keys="selectedKeys"
      mode="inline"
      :inline-collapsed="false"
      @select="handleSelect"
      class="sidebar-menu"
    >
      <a-menu-item key="/voice-clone">
        <template #icon>
          <AudioOutlined />
        </template>
        <span>配音生成</span>
      </a-menu-item>
      <a-menu-item key="/sample-library">
        <template #icon>
          <DatabaseOutlined />
        </template>
        <span>样音库</span>
      </a-menu-item>
      <a-menu-item key="/subtitle">
        <template #icon>
          <FileTextOutlined />
        </template>
        <span>字幕生成</span>
      </a-menu-item>
      <a-menu-item key="/file-manager">
        <template #icon>
          <FolderOutlined />
        </template>
        <span>文件管理</span>
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  AudioOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FolderOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const selectedKeys = computed(() => [route.path])

const handleSelect = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}
</style>

