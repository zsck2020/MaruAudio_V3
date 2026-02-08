# 公共组件使用指南

## LoadingState 组件

统一的加载状态和空状态组件，用于替代各页面不一致的加载状态展示。

### 使用示例

```vue
<template>
  <LoadingState 
    :loading="loading" 
    :empty="!loading && items.length === 0"
    empty-text="暂无数据"
    :rows="5"
  >
    <el-table :data="items" stripe>
      <!-- 表格内容 -->
    </el-table>
  </LoadingState>
</template>

<script setup>
import { ref } from 'vue'
import LoadingState from '@/components/LoadingState.vue'

const loading = ref(false)
const items = ref([])
</script>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| loading | 是否加载中 | Boolean | false |
| empty | 是否为空状态 | Boolean | false |
| emptyText | 空状态提示文字 | String | '暂无数据' |
| rows | 骨架屏行数 | Number | 5 |
| imageSize | 空状态图片大小 | Number | 100 |
| showAction | 是否显示操作按钮 | Boolean | false |
| actionText | 操作按钮文字 | String | '刷新' |

### Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| action | 点击操作按钮时触发 | - |

## PageLoading 组件

页面级加载组件，用于整个页面的加载状态。

### 使用示例

```vue
<template>
  <PageLoading :loading="loading" :rows="8">
    <div>
      <!-- 页面内容 -->
    </div>
  </PageLoading>
</template>

<script setup>
import { ref } from 'vue'
import PageLoading from '@/components/PageLoading.vue'

const loading = ref(false)
</script>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| loading | 是否加载中 | Boolean | false |
| rows | 骨架屏行数 | Number | 8 |

## 迁移指南

### 从 v-loading 迁移

**之前：**
```vue
<el-table :data="items" stripe v-loading="loading">
  <!-- 表格内容 -->
</el-table>
```

**之后：**
```vue
<LoadingState :loading="loading" :empty="!loading && items.length === 0">
  <el-table :data="items" stripe>
    <!-- 表格内容 -->
  </el-table>
</LoadingState>
```

### 从 el-empty 迁移

**之前：**
```vue
<el-empty v-if="items.length === 0" description="暂无数据" />
<el-table v-else :data="items" stripe>
  <!-- 表格内容 -->
</el-table>
```

**之后：**
```vue
<LoadingState 
  :loading="loading" 
  :empty="!loading && items.length === 0"
  empty-text="暂无数据"
>
  <el-table :data="items" stripe>
    <!-- 表格内容 -->
  </el-table>
</LoadingState>
```



## LoadingState 组件

统一的加载状态和空状态组件，用于替代各页面不一致的加载状态展示。

### 使用示例

```vue
<template>
  <LoadingState 
    :loading="loading" 
    :empty="!loading && items.length === 0"
    empty-text="暂无数据"
    :rows="5"
  >
    <el-table :data="items" stripe>
      <!-- 表格内容 -->
    </el-table>
  </LoadingState>
</template>

<script setup>
import { ref } from 'vue'
import LoadingState from '@/components/LoadingState.vue'

const loading = ref(false)
const items = ref([])
</script>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| loading | 是否加载中 | Boolean | false |
| empty | 是否为空状态 | Boolean | false |
| emptyText | 空状态提示文字 | String | '暂无数据' |
| rows | 骨架屏行数 | Number | 5 |
| imageSize | 空状态图片大小 | Number | 100 |
| showAction | 是否显示操作按钮 | Boolean | false |
| actionText | 操作按钮文字 | String | '刷新' |

### Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| action | 点击操作按钮时触发 | - |

## PageLoading 组件

页面级加载组件，用于整个页面的加载状态。

### 使用示例

```vue
<template>
  <PageLoading :loading="loading" :rows="8">
    <div>
      <!-- 页面内容 -->
    </div>
  </PageLoading>
</template>

<script setup>
import { ref } from 'vue'
import PageLoading from '@/components/PageLoading.vue'

const loading = ref(false)
</script>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| loading | 是否加载中 | Boolean | false |
| rows | 骨架屏行数 | Number | 8 |

## 迁移指南

### 从 v-loading 迁移

**之前：**
```vue
<el-table :data="items" stripe v-loading="loading">
  <!-- 表格内容 -->
</el-table>
```

**之后：**
```vue
<LoadingState :loading="loading" :empty="!loading && items.length === 0">
  <el-table :data="items" stripe>
    <!-- 表格内容 -->
  </el-table>
</LoadingState>
```

### 从 el-empty 迁移

**之前：**
```vue
<el-empty v-if="items.length === 0" description="暂无数据" />
<el-table v-else :data="items" stripe>
  <!-- 表格内容 -->
</el-table>
```

**之后：**
```vue
<LoadingState 
  :loading="loading" 
  :empty="!loading && items.length === 0"
  empty-text="暂无数据"
>
  <el-table :data="items" stripe>
    <!-- 表格内容 -->
  </el-table>
</LoadingState>
```








