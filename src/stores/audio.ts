import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAudioStore = defineStore('audio', () => {
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  const generationMessage = ref('')
  const currentAudioPath = ref<string | null>(null)

  function setGenerating(value: boolean) {
    isGenerating.value = value
    if (!value) {
      generationProgress.value = 0
      generationMessage.value = ''
    }
  }

  function updateProgress(progress: number, message: string) {
    generationProgress.value = progress
    generationMessage.value = message
  }

  function setCurrentAudio(path: string | null) {
    currentAudioPath.value = path
  }

  return {
    isGenerating,
    generationProgress,
    generationMessage,
    currentAudioPath,
    setGenerating,
    updateProgress,
    setCurrentAudio,
  }
})

