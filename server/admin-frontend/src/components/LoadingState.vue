<template>
  <div class="loading-state" v-if="loading">
    <el-skeleton :rows="rows" :animated="true" />
  </div>
  <div v-else-if="empty" class="empty-state">
    <el-empty :description="emptyText" :image-size="imageSize">
      <el-button v-if="showAction" type="primary" @click="$emit('action')">
        {{ actionText }}
      </el-button>
    </el-empty>
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  empty: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  rows: {
    type: Number,
    default: 5
  },
  imageSize: {
    type: Number,
    default: 100
  },
  showAction: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    default: '刷新'
  }
})

defineEmits(['action'])
</script>

<style scoped>
.loading-state {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}
</style>


  <div class="loading-state" v-if="loading">
    <el-skeleton :rows="rows" :animated="true" />
  </div>
  <div v-else-if="empty" class="empty-state">
    <el-empty :description="emptyText" :image-size="imageSize">
      <el-button v-if="showAction" type="primary" @click="$emit('action')">
        {{ actionText }}
      </el-button>
    </el-empty>
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  empty: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  rows: {
    type: Number,
    default: 5
  },
  imageSize: {
    type: Number,
    default: 100
  },
  showAction: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    default: '刷新'
  }
})

defineEmits(['action'])
</script>

<style scoped>
.loading-state {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}
</style>








