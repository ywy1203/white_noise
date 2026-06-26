<script setup lang="ts">
/**
 * ShaderCanvas — nano-design 风格 WebGL2 全屏特效
 * 不需要 Three.js，直接用 shader 渲染火焰/雨水
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { createFireEngine, type FireEngine, type FireParams } from '@/services/fireEngine'
import { createRainEngine, type RainEngine, type RainParams } from '@/services/rainEngine'

const props = defineProps<{
  sceneId: 'campfire' | 'rain'
}>()

const container = ref<HTMLDivElement>()

let fireEngine: FireEngine | null = null
let rainEngine: RainEngine | null = null
let running = false
let rafId = 0
let isMobile = false

// Default params for fire
const fireParams: FireParams = {
  intensity: 1.0,
  flameHeight: 3.2,
  flameWidth: 0.9,
  turbulence: 0.8,
  swaySpeed: 1.2,
  colorCore: [1.0, 0.85, 0.5],
  colorMid: [1.0, 0.55, 0.1],
  colorOuter: [0.9, 0.25, 0.05],
}

// Default params for rain
const rainParams: RainParams = {
  intensity: 0.8,
  speed: 1.0,
  wind: 0.1,
  dropLength: 0.12,
  darken: 0.7,
  mistOpacity: 0.5,
  wetSheen: 0.3,
}

function init() {
  const el = container.value
  if (!el) return

  isMobile = window.innerWidth < 768
  if (isMobile) {
    rainParams.intensity = 0.5
    rainParams.dropLength = 0.08
  }

  if (props.sceneId === 'campfire') {
    fireEngine = createFireEngine()
    if (fireEngine) {
      el.appendChild(fireEngine.canvas)
      fireEngine.resize(el.clientWidth, el.clientHeight)
    }
  } else if (props.sceneId === 'rain') {
    rainEngine = createRainEngine()
    if (rainEngine) {
      el.appendChild(rainEngine.canvas)
      rainEngine.resize(el.clientWidth, el.clientHeight)
    }
  }

  start()
}

function start() {
  if (running) return
  running = true

  function loop() {
    if (!running) return
    if (fireEngine) fireEngine.render(fireParams)
    if (rainEngine) rainEngine.render(rainParams)
    rafId = requestAnimationFrame(loop)
  }
  loop()
}

function stop() {
  running = false
  cancelAnimationFrame(rafId)
  fireEngine?.destroy()
  fireEngine = null
  rainEngine?.destroy()
  rainEngine = null
}

function onResize() {
  const el = container.value
  if (!el) return
  fireEngine?.resize(el.clientWidth, el.clientHeight)
  rainEngine?.resize(el.clientWidth, el.clientHeight)
}

onMounted(init)
onUnmounted(stop)

window.addEventListener('resize', onResize)
</script>

<template>
  <div ref="container" class="shader-canvas" />
</template>

<style scoped>
.shader-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
}
</style>
