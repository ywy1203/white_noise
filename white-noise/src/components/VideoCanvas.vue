<script setup lang="ts">
import { inject, onMounted, watch, ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { SCENE_COUNT } from '@/config/scenes'

const sceneStore = useSceneStore()
const video = inject<any>('video')!

const container = ref<HTMLDivElement>()

// Watch scene changes to toggle canvas visibility
watch(() => sceneStore.current, (idx) => {
  console.log(`VideoCanvas: scene -> ${idx}`)
  video.canvases.value.forEach((c: HTMLCanvasElement, i: number) => {
    c.classList.toggle('active', i === idx)
  })
})

onMounted(() => {
  const el = container.value
  if (!el) return
  video.canvases.value.forEach((c: HTMLCanvasElement) => {
    c.classList.add('scene-canvas')
    el.appendChild(c)
  })
  // Sync initial state
  video.canvases.value.forEach((c: HTMLCanvasElement, i: number) => {
    c.classList.toggle('active', i === sceneStore.current)
  })
})
</script>

<template>
  <div ref="container" class="video-container"></div>
</template>

<style scoped>
.video-container{position:fixed;inset:0;z-index:0}
.scene-canvas{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;transition:opacity .8s ease;pointer-events:none}
.scene-canvas.active{opacity:1}
</style>
