<script setup lang="ts">
import { useSceneStore } from '@/stores/sceneStore'

const props = defineProps<{ visible: boolean }>()
const sceneStore = useSceneStore()
</script>

<template>
  <div class="idle-time" :class="{ on: visible }">{{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
  <div class="idle-scene" :class="{ on: visible }">{{ sceneStore.scenes[sceneStore.current].icon }} {{ sceneStore.scenes[sceneStore.current].name }}</div>
  <div class="idle-dot" :class="{ on: visible }"></div>
</template>

<style scoped>
.idle-time{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:2;font-size:14px;font-weight:400;letter-spacing:1px;opacity:0;transition:opacity .8s;color:rgba(255,255,255,.7);text-shadow:0 1px 4px rgba(0,0,0,.3)}
.idle-time.on{opacity:1}
.idle-scene{position:fixed;bottom:52px;left:50%;transform:translateX(-50%);z-index:2;font-size:13px;letter-spacing:1px;opacity:0;transition:opacity .8s;color:rgba(255,255,255,.6);text-shadow:0 1px 4px rgba(0,0,0,.3);white-space:nowrap}
.idle-scene.on{opacity:1}
.idle-dot{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:2;width:5px;height:5px;border-radius:50%;background:rgba(74,222,128,.7);opacity:0;transition:opacity .6s}
.idle-dot.on{opacity:1}
</style>
