<template>
  <router-view />
  <SensitiveVerify ref="sensitiveVerifyRef" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SensitiveVerify from './components/SensitiveVerify.vue'
import { setSensitiveVerifyRef } from './utils/sensitiveVerify'

const sensitiveVerifyRef = ref(null)

onMounted(() => {
  setSensitiveVerifyRef(sensitiveVerifyRef.value)
})
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
