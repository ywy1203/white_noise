<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore()
</script>

<template>
  <div class="focus-card" :class="{ on: userStore.focusMode >= 1, 'style-b': userStore.focusMode === 2 }" @click="userStore.toggleFocus()">
    <div class="focus-time">{{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
  </div>
</template>

<style scoped>
.focus-card{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.96);z-index:2;padding:48px 72px;border-radius:28px;background:rgba(0,0,0,.12);backdrop-filter:blur(40px) saturate(1.1);-webkit-backdrop-filter:blur(40px) saturate(1.1);border:1px solid rgba(255,255,255,.06);box-shadow:0 4px 24px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.04);opacity:0;pointer-events:auto;cursor:pointer;transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1)}
.focus-card.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.focus-card:active{transform:translate(-50%,-50%) scale(.96)}
.focus-card.style-b{padding:56px 80px}
.focus-time{font-size:88px;font-weight:300;letter-spacing:4px;text-shadow:0 2px 12px rgba(0,0,0,.5)}.focus-card.style-b .focus-time{font-size:112px}
</style>
