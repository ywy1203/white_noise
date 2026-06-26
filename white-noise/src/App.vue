<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, provide, nextTick } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useAudioStore } from '@/stores/audioStore'
import { useUserStore } from '@/stores/userStore'
import { useVideo } from '@/composables/useVideo'
import { useAudio } from '@/composables/useAudio'
import { useOrientation } from '@/composables/useOrientation'
import ShaderCanvas from '@/components/ShaderCanvas.vue'
// import VideoCanvas from '@/components/VideoCanvas.vue'
import CtrlBar from '@/components/CtrlBar.vue'
import IdleLayer from '@/components/IdleLayer.vue'
import FocusCard from '@/components/FocusCard.vue'
import DimOverlay from '@/components/DimOverlay.vue'
import SoundPanel from '@/components/SoundPanel.vue'
import TimerPanel from '@/components/TimerPanel.vue'

const sceneStore = useSceneStore()
const audioStore = useAudioStore()
const userStore = useUserStore()
const video = useVideo()
const audio = useAudio()
const { lockLandscape } = useOrientation()

provide('video', video)
provide('audio', audio)

// Init stores & video immediately
audioStore.init()
userStore.init()
video.init()

// Apply first scene audio immediately
audio.applyMix(0)
audioStore.currentScene = 0

// Panel controls
const soundOpen = ref(false)
const timerOpen = ref(false)

function openSound() { soundOpen.value = true }
function openTimer() { timerOpen.value = true }

// CtrlBar: always visible by default, tap toggles it off/on
const ctrlVisible = ref(true)

function toggleCtrl() {
  ctrlVisible.value = !ctrlVisible.value
}

function hideCtrl() {
  ctrlVisible.value = false
}

onMounted(() => {
  nextTick(() => {
    video.play(0)
    video.preloadAdjacent(0)
    video.startLoop()

    // First interaction: unlock audio + lock orientation
    const unlock = () => {
      audio.unlock()
      lockLandscape()
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click', unlock)
    }
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('click', unlock, { once: true })
  })

  window.addEventListener('resize', video.resize)
})

onUnmounted(() => {
  video.stopLoop()
  window.removeEventListener('resize', video.resize)
})

watch(() => sceneStore.current, (idx, oldIdx) => {
  console.log(`switch scene: ${oldIdx} -> ${idx}`)
  video.drawStill(idx)
  video.play(idx)
  video.preloadAdjacent(idx)
  audio.applyMix(idx)
  audioStore.currentScene = idx
  audioStore.save()
})
</script>

<template>
  <div class="app-root">
    <div class="vignette"></div>
    <DimOverlay />
    <!-- <VideoCanvas /> -->
    <ShaderCanvas scene-id="campfire" />
    <FocusCard />
    <IdleLayer :visible="!ctrlVisible" />
    <div class="tap-layer" @click="toggleCtrl"></div>
    <CtrlBar
      :visible="ctrlVisible"
      @hide="hideCtrl"
      @open-sound="openSound"
      @open-timer="openTimer"
    />
    <SoundPanel v-model:open="soundOpen" />
    <TimerPanel v-model:open="timerOpen" />
  </div>
</template>

<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#1a0a00;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;user-select:none;-webkit-user-select:none;overscroll-behavior:none}
body{background:radial-gradient(ellipse at center,#3a1a00 0%,#0a0500 100%)}
.app-root{width:100%;height:100%;position:relative;overflow:hidden}
.vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,.15) 0%,rgba(0,0,0,.4) 100%)}
.tap-layer{position:fixed;inset:0;z-index:3}
</style>
