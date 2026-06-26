<script setup lang="ts">
import { onMounted } from 'vue'

// Emergency test: inject fixed red box into body to verify component mount
onMounted(() => {
  const d = document.createElement('div')
  d.id = 'shader-dead-test'
  d.textContent = 'MOUNT OK'
  d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:red;color:#fff;padding:12px 20px;font:bold 16px sans-serif'
  document.body.appendChild(d)
  console.log('[ShaderCanvas] mounted, window size:', window.innerWidth, 'x', window.innerHeight)
})
</script>

<template>
  <div style="position:absolute;inset:0;background:red;z-index:100">SHADER</div>
</template>

<style scoped></style>
