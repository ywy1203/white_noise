import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import { PRESET_IDS, PRESET_VOL, SCENE_COUNT } from '@/config/scenes'
import { storage } from '@/services/storage'
import type { Mixes, SoundPreset } from '@/types'

export const useAudioStore = defineStore('audio', () => {
  const isMuted = ref(false)
  const mixes = reactive<Mixes>({})
  const currentScene = ref(0)

  // Init from localStorage or defaults
  function init() {
    for (let i = 0; i < SCENE_COUNT; i++) {
      const m: Record<string, SoundPreset> = {}
      PRESET_IDS[i].forEach(id => {
        const v = PRESET_VOL[i][id] ?? 0.5
        m[id] = { id, vol: v, active: v >= 0.25 }
      })
      mixes[i] = m
    }
    // Merge saved
    const ver = storage.getString('mixVersion')
    if (ver === storage.mixesVersion) {
      const saved = storage.get<Mixes>('mixes')
      if (saved) {
        for (let i = 0; i < SCENE_COUNT; i++) {
          if (saved[i]) Object.assign(mixes[i], saved[i])
        }
      }
    }
  }

  function save() {
    storage.set('mixes', mixes)
    storage.setString('mixVersion', storage.mixesVersion)
  }

  function currentMix(): Record<string, SoundPreset> {
    return mixes[currentScene.value] ?? {}
  }

  const activeSoundIds = computed<string[]>(() => {
    const m = currentMix()
    return Object.keys(m).filter(id => m[id].active)
  })

  return { isMuted, mixes, currentScene, init, save, currentMix, activeSoundIds }
})
