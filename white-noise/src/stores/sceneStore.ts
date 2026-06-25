import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SCENES, SCENE_COUNT } from '@/config/scenes'

export const useSceneStore = defineStore('scene', () => {
  const current = ref(0)
  const switching = ref(false)

  function switchTo(idx: number) {
    if (idx === current.value || switching.value) return
    current.value = idx
  }

  function next() {
    switchTo((current.value + 1) % SCENE_COUNT)
  }

  function prev() {
    switchTo((current.value - 1 + SCENE_COUNT) % SCENE_COUNT)
  }

  return { current, switching, switchTo, next, prev, scenes: SCENES }
})
