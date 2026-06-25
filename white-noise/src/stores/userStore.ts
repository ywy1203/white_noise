import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@/services/storage'

export const useUserStore = defineStore('user', () => {
  const dimLevel = ref(0)     // 0=off, 1=30%, 2=60%
  const focusMode = ref(0)    // 0=off, 1=card, 2=float
  const loggedIn = ref(false)

  function init() {
    dimLevel.value = storage.get<number>('dimLevel') ?? 0
    focusMode.value = storage.get<number>('focusMode') ?? 0
  }

  watch(dimLevel, v => storage.set('dimLevel', v))
  watch(focusMode, v => storage.set('focusMode', v))

  function toggleDim() {
    dimLevel.value = (dimLevel.value + 1) % 4
  }

  function toggleFocus() {
    focusMode.value = (focusMode.value + 1) % 3
  }

  return { dimLevel, focusMode, loggedIn, init, toggleDim, toggleFocus }
})
