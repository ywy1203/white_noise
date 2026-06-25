<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore()
</script>

<template>
  <div class="dim-overlay" :class="{ on: userStore.dimLevel > 0 }" :style="{ opacity: [0, .3, .6][userStore.dimLevel] }"></div>
</template>

<style scoped>
.dim-overlay{position:fixed;inset:0;z-index:1;background:#000;opacity:0;pointer-events:none;transition:opacity .4s}
.dim-overlay.on{pointer-events:auto}
</style>
