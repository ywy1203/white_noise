<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject } from 'vue'
import { useParticleEngine } from '@/composables/useParticleEngine'
import { useAudioReactivity } from '@/composables/useAudioReactivity'
import { PARTICLE_SCENE_MAP } from '@/config/particleScenes'
import type { ParticleSceneConfig } from '@/types/particle'

const props = defineProps<{
  sceneId: string | null
}>()

const emit = defineEmits<{
  loaded: []
}>()

const container = ref<HTMLDivElement>()
const engine = useParticleEngine()
const audioReactivity = useAudioReactivity()
const errorMsg = ref('')

// 尝试注入 audio，如果失败则静默处理
let audio: any = null
try {
  audio = inject<any>('audio')!
} catch {
  // 没有 audio provider，静默继续
}

// 判断移动端
const isMobile = ref(window.innerWidth < 768)

let currentConfig: ParticleSceneConfig | null = null
let isInteractive = false
let touchTimer: ReturnType<typeof setTimeout> | null = null
let isLongPress = false

onMounted(() => {
  // DEBUG: 确认组件挂载
  const debugEl = document.createElement('div')
  debugEl.id = 'particle-debug'
  debugEl.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;color:#ff0;font:12px monospace;background:#000;padding:4px 8px'
  debugEl.textContent = 'mounting...'
  document.body.appendChild(debugEl)

  try {
    const el = container.value
    if (!el) {
      errorMsg.value = 'container ref is null'
      debugEl.textContent = 'ERR: no container'
      return
    }

    // 初始化引擎
    engine.init(el)
    debugEl.textContent = 'init ok'

    // 可选：初始化音频分析
    try {
      if (audio && audio.ctx) {
        audioReactivity.init(audio.ctx)
      }
    } catch {
      // 音频分析初始化失败不阻塞渲染
    }

    // 监听频谱
    audioReactivity.onSpectrum((spec) => {
      engine.updateSpectrum(spec)
    })

    // 启动频谱分析
    audioReactivity.start()

    // 窗口自适应
    window.addEventListener('resize', onResize)

    // 加载场景
    if (props.sceneId) {
      loadScene(props.sceneId)
    }
  } catch (e: any) {
    console.error('ParticleCanvas init error:', e)
    errorMsg.value = e?.message || 'unknown error'
  }
})

onUnmounted(() => {
  engine.dispose()
  audioReactivity.stop()
  window.removeEventListener('resize', onResize)
})

watch(() => props.sceneId, (newId) => {
  if (newId) loadScene(newId)
})

function loadScene(id: string) {
  const config = PARTICLE_SCENE_MAP.get(id)
  if (!config) { console.warn('unknown scene id:', id); return }
  currentConfig = config

  try {
    engine.loadScene(config, isMobile.value)
    engine.start()
    emit('loaded')
  } catch (e: any) {
    console.error('loadScene error:', e)
    errorMsg.value = e?.message || 'scene load error'
  }
}

function onResize() {
  const el = container.value
  if (!el) return
  engine.resize(el.clientWidth, el.clientHeight)
  isMobile.value = window.innerWidth < 768
}

// ========== 交互事件 ==========

function onPointerDown(e: PointerEvent) {
  isInteractive = true
  isLongPress = false
  const el = container.value
  if (!el) return
  touchTimer = setTimeout(() => {
    isLongPress = true
    engine.handleInteraction('longPress', e.clientX, e.clientY, el)
  }, 500)
}

function onPointerMove(e: PointerEvent) {
  if (!isInteractive) return
  const el = container.value
  if (!el) return
  engine.handleInteraction('touch', e.clientX, e.clientY, el)
}

function onPointerUp(e: PointerEvent) {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
  if (!isLongPress) {
    const el = container.value
    if (el) {
      engine.handleInteraction('click', e.clientX, e.clientY, el)
    }
  }
  isInteractive = false
  isLongPress = false
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    onPointerDown(new PointerEvent('pointerdown', {
      clientX: t.clientX, clientY: t.clientY, pointerType: 'touch',
    }))
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    onPointerMove(new PointerEvent('pointermove', {
      clientX: t.clientX, clientY: t.clientY, pointerType: 'touch',
    }))
  }
  e.preventDefault()
}

function onTouchEnd(e: TouchEvent) {
  onPointerUp(new PointerEvent('pointerup'))
  e.preventDefault()
}
</script>

<template>
  <div
    ref="container"
    class="particle-container"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @touchstart.prevent="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend.prevent="onTouchEnd"
  >
    <div v-if="errorMsg" class="error-overlay">
      <p>错误: {{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.particle-container {
  position: fixed; inset: 0; z-index: 0;
  overflow: hidden; cursor: grab;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
.particle-container:active { cursor: grabbing; }
.error-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.8); color: #ff6b6b;
  font-size: 14px; padding: 20px;
}
</style>
