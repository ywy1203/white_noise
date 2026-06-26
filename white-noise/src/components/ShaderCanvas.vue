<script setup lang="ts">
/**
 * ShaderCanvas — nano-design 风格 WebGL2 全屏特效
 * 不需要 Three.js，直接用 shader 渲染火焰/雨水
 */
import { ref, onMounted, onUnmounted } from 'vue'
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
  console.log('[ShaderCanvas] init, el:', !!el, 'sceneId:', props.sceneId)
  if (!el) return

  const w = el.clientWidth || window.innerWidth
  const h = el.clientHeight || window.innerHeight
  console.log('[ShaderCanvas] size:', w, 'x', h)

  if (props.sceneId === 'campfire') {
    fireEngine = createFireEngine()
    console.log('[ShaderCanvas] fireEngine:', !!fireEngine)
    if (fireEngine) {
      el.appendChild(fireEngine.canvas)
      fireEngine.resize(w, h)
      console.log('[ShaderCanvas] fire canvas appended, size=', fireEngine.canvas.width, 'x', fireEngine.canvas.height)
    } else {
      el.textContent = 'WebGL2 not available'
      el.style.cssText += ';color:#f00;display:flex;align-items:center;justify-content:center;font:16px sans-serif'
      return
    }
  } else if (props.sceneId === 'rain') {
    rainEngine = createRainEngine()
    console.log('[ShaderCanvas] rainEngine:', !!rainEngine)
    if (rainEngine) {
      el.appendChild(rainEngine.canvas)
      rainEngine.resize(w, h)
    } else {
      el.textContent = 'WebGL2 not available'
      el.style.cssText += ';color:#f00;display:flex;align-items:center;justify-content:center;font:16px sans-serif'
      return
    }
  }

  start()
}

function start() {
  if (running) return
  running = true
  console.log('[ShaderCanvas] animation loop starting')

  function loop() {
    if (!running) return
    fireEngine?.render(fireParams)
    rainEngine?.render(rainParams)
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
  const w = el.clientWidth
  const h = el.clientHeight
  fireEngine?.resize(w, h)
  rainEngine?.resize(w, h)
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
