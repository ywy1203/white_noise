<script setup lang="ts">
import { watch } from 'vue'
import { useTimer } from '@/composables/useTimer'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const timer = useTimer()

watch(() => props.open, (v) => {
  if (!v) timer.reset()
})
</script>

<template>
  <Teleport to="body">
    <div class="panel-overlay" :class="{ open }" @click="emit('update:open', false)"></div>
    <div class="panel-sheet" :class="{ open }">
      <div class="panel-grip"></div>
      <div class="panel-hd"><h3>⏱️ 计时</h3><button @click="emit('update:open', false)">✕</button></div>
      <div class="panel-body">
        <div class="timer-modes">
          <button v-for="m in [{id:'clock',label:'🕐 时钟'},{id:'stopwatch',label:'▶ 正计时'},{id:'countdown',label:'⏳ 倒计时'},{id:'pomodoro',label:'🍅 番茄'}]" :key="m.id" class="timer-mode" :class="{ active: timer.mode.value === m.id }" @click="timer.setMode(m.id as any)">{{ m.label }}</button>
        </div>
        <div class="timer-display">{{ timer.display.value }}</div>
        <div class="timer-label">{{ timer.label.value }}</div>
        <div class="timer-actions">
          <button v-if="timer.mode.value !== 'clock'" class="primary" @click="timer.start()">{{ timer.running.value ? '⏸ 暂停' : '▶ 开始' }}</button>
          <button v-if="timer.mode.value !== 'clock'" @click="timer.reset()">↺ 重置</button>
        </div>
        <div v-if="timer.mode.value === 'countdown' || timer.mode.value === 'pomodoro'" class="timer-set">
          <input type="number" :value="25" min="1" max="120"> <span>:</span>
          <input type="number" :value="0" min="0" max="59">
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
.timer-modes{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.timer-mode{background:rgba(255,255,255,.04);border:none;color:rgba(255,255,255,.4);font-size:12px;padding:5px 12px;border-radius:12px;cursor:pointer}
.timer-mode.active{background:rgba(255,255,255,.1);color:#fff}
.timer-display{text-align:center;font-size:56px;font-weight:200;letter-spacing:4px;padding:12px 0 4px;font-variant-numeric:tabular-nums}
.timer-label{text-align:center;font-size:11px;opacity:.4;margin-bottom:12px}
.timer-actions{display:flex;justify-content:center;gap:10px;margin-bottom:8px}
.timer-actions button{background:rgba(255,255,255,.06);border:none;color:#fff;font-size:13px;padding:7px 18px;border-radius:16px;cursor:pointer}
.timer-actions button.primary{background:rgba(255,255,255,.12)}
.timer-set{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px}
.timer-set input{width:48px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:4px;color:#fff;text-align:center;font-size:16px}
</style>
