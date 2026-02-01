import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Engine {
  id: string
  name: string
  description: string
}

export const useEngineStore = defineStore('engine', () => {
  const currentEngine = ref<string>('lightweight')
  const engines = ref<Engine[]>([
    { id: 'lightweight', name: '快速模式', description: '轻量级引擎，快速响应' },
    { id: 'emotion', name: '标准模式', description: '情感表达丰富，适合长文本' },
    { id: 'cloud', name: '高质量模式', description: '云端引擎，高质量输出' },
  ])

  function switchEngine(engineId: string) {
    currentEngine.value = engineId
  }

  function getCurrentEngine(): Engine | undefined {
    return engines.value.find((e) => e.id === currentEngine.value)
  }

  return {
    currentEngine,
    engines,
    switchEngine,
    getCurrentEngine,
  }
})

