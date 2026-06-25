<script setup lang="ts">
import { inject } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useAudioStore } from '@/stores/audioStore'
import { useUserStore } from '@/stores/userStore'

const emit = defineEmits<{
  hide: []
  openSound: []
  openTimer: []
}>()
defineProps<{ visible: boolean }>()

const sceneStore = useSceneStore()
const audioStore = useAudioStore()
const userStore = useUserStore()
const audio = inject<any>('audio')!

function toggleMute() {
  audioStore.isMuted = !audioStore.isMuted
}

function switchScene(idx: number) {
  sceneStore.switchTo(idx)
  emit('hide')
}
</script>

<template>
  <div class="ctrl-layer" :class="{ show: visible }">
    <button class="ctrl-close" @click="emit('hide')">✕</button>
    <button class="ctrl-arrow left" @click.stop="sceneStore.prev(); emit('hide')">◀</button>
    <button class="ctrl-arrow right" @click.stop="sceneStore.next(); emit('hide')">▶</button>

    <div class="ctrl-bar">
      <button v-for="(s, i) in sceneStore.scenes" :key="i" class="ctrl-scene-icon" :class="{ active: i === sceneStore.current }" @click="switchScene(i)">{{ s.icon }}</button>
      <div class="ctrl-spacer"></div>

      <button class="ctrl-btn" :title="audioStore.isMuted ? '取消静音' : '静音'" @click.stop="toggleMute">{{ audioStore.isMuted ? '🔇' : '🔊' }}</button>
      <button class="ctrl-btn" @click.stop="userStore.toggleDim()">{{ ['🌓','🌘','🌒','🌕'][userStore.dimLevel] }}</button>
      <button class="ctrl-btn" :style="{ opacity: userStore.focusMode ? 1 : .5 }" @click.stop="userStore.toggleFocus()">{{ ['◎','◉','○'][userStore.focusMode] }}</button>
      <button class="ctrl-btn" @click.stop="emit('openTimer')">⏱️</button>
      <button class="ctrl-btn" @click.stop="emit('openSound')">🎵</button>
    </div>
  </div>
</template>

<style scoped>
.ctrl-layer{position:fixed;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;pointer-events:none;background:rgba(0,0,0,0);transition:background .5s}
.ctrl-layer.show{pointer-events:auto;background:rgba(0,0,0,.2)}
.ctrl-close{position:fixed;top:48px;right:48px;background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.5);font-size:13px;padding:4px 10px;border-radius:12px;cursor:pointer}
.ctrl-arrow{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6);font-size:24px;width:50px;height:50px;border-radius:50%;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ctrl-arrow.left{left:24px}.ctrl-arrow.right{right:24px}
.ctrl-bar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,.5);backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);border:1px solid rgba(255,255,255,.1)}
.ctrl-scene-icon{background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.5);font-size:14px;width:32px;height:32px;border-radius:10px;cursor:pointer}
.ctrl-scene-icon.active{background:rgba(255,255,255,.15);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
.ctrl-spacer{width:8px}
.ctrl-btn{background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.6);font-size:13px;width:30px;height:30px;border-radius:10px;cursor:pointer}
</style>
