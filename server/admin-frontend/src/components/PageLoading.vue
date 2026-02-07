<template>
  <div class="page-loading" v-if="loading">
    <el-skeleton :rows="rows" :animated="true" />
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 8
  }
})
</script>

<style scoped>
.page-loading {
  padding: 20px;
}
</style>


  <div class="page-loading" v-if="loading">
    <el-skeleton :rows="rows" :animated="true" />
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 8
  }
})
</script>

<style scoped>
.page-loading {
  padding: 20px;
}
</style>





