<script setup lang="ts">
import { computed, inject } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useAudioStore } from '@/stores/audioStore'
import { CATS, PRESET_IDS, SMAP } from '@/config/scenes'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const sceneStore = useSceneStore()
const audioStore = useAudioStore()
const audio = inject<any>('audio')!

const categories = computed(() => CATS.map(cat => ({ ...cat, ids: cat.id === 'preset' ? PRESET_IDS[sceneStore.current] : (cat.sounds || []) })))

function toggleSound(id: string) {
  const mix = audioStore.mixes[sceneStore.current]!
  if (!mix[id]) mix[id] = { id, vol: 0.5, active: false }
  mix[id].active = !mix[id].active
  audio.applyMix(sceneStore.current)
  audioStore.save()
}

function setVolume(id: string, vol: number) {
  const mix = audioStore.mixes[sceneStore.current]!
  if (!mix[id]) mix[id] = { id, vol, active: vol >= 0.25 }
  mix[id].vol = vol
  mix[id].active = vol >= 0.25
  audio.setVolume(id, vol)
  audioStore.save()
}
</script>

<template>
  <Teleport to="body">
    <div class="panel-overlay" :class="{ open }" @click="emit('update:open', false)"></div>
    <div class="panel-sheet" :class="{ open }">
      <div class="panel-grip"></div>
      <div class="panel-hd"><h3>🎵 白噪音</h3><button @click="emit('update:open', false)">✕</button></div>
      <div class="panel-body">
        <div v-for="cat in categories" :key="cat.id">
          <div class="cat-label">{{ cat.name }}</div>
          <div class="sound-grid">
            <div v-for="id in cat.ids" :key="id" class="sound-item" :class="{ active: audioStore.mixes[sceneStore.current]?.[id]?.active }" @click="toggleSound(id)">
              <div class="si-icon">{{ SMAP[id]?.icon || '🔊' }}</div>
              <div class="si-label">{{ SMAP[id]?.label || id }}</div>
              <input type="range" min="0" max="1" step=".05" :value="audioStore.mixes[sceneStore.current]?.[id]?.vol ?? 0.5" @input="setVolume(id, parseFloat(($event.target as HTMLInputElement).value))" @click.stop>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.panel-overlay{position:fixed;inset:0;z-index:8;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .35s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.panel-overlay.open{opacity:1;pointer-events:auto}
.panel-sheet{position:fixed;bottom:0;left:0;right:0;z-index:9;max-height:70vh;background:rgba(18,18,22,.92);backdrop-filter:blur(40px) saturate(1.3);-webkit-backdrop-filter:blur(40px) saturate(1.3);border-radius:20px 20px 0 0;transform:translateY(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);overflow-y:auto}
.panel-sheet.open{transform:translateY(0)}
.panel-grip{width:36px;height:4px;border-radius:4px;background:rgba(255,255,255,.15);margin:8px auto}
.panel-hd{display:flex;justify-content:space-between;align-items:center;padding:2px 20px 8px;border-bottom:1px solid rgba(255,255,255,.05)}
.panel-hd h3{font-size:15px;font-weight:500;letter-spacing:.5px}
.panel-hd button{background:none;border:none;color:rgba(255,255,255,.3);font-size:18px;cursor:pointer}
.panel-body{padding:12px 16px 24px}
.cat-label{font-size:12px;opacity:.4;margin:10px 0 4px 2px}
.sound-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:7px}
.sound-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;border-radius:12px;background:rgba(255,255,255,.03);cursor:pointer;border:1px solid transparent}
.sound-item.active{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.06)}
.sound-item .si-icon{font-size:18px}
.sound-item .si-label{font-size:9px;opacity:.6;text-align:center;word-break:break-all;line-height:1.2}
input[type=range]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.1);height:3px;border-radius:3px;outline:none;width:100%}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer}
</style>
