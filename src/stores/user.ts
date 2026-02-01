import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserData {
  id: string
  email: string
  username: string
  user_group: 'free' | 'trial' | 'monthly' | 'yearly' | 'permanent'
  max_chars: number
}

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const userData = ref<UserData | null>(null)
  const token = ref<string | null>(null)

  function setUser(data: UserData, authToken: string) {
    userData.value = data
    token.value = authToken
    isLoggedIn.value = true
  }

  function clearUser() {
    userData.value = null
    token.value = null
    isLoggedIn.value = false
  }

  function getMaxChars(): number {
    if (!userData.value) return 500
    return userData.value.max_chars
  }

  return {
    isLoggedIn,
    userData,
    token,
    setUser,
    clearUser,
    getMaxChars,
  }
})

