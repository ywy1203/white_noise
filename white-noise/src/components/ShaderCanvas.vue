<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  sceneId: 'campfire' | 'rain'
}>()

const container = ref<HTMLDivElement>()
const status = ref('')

let running = false, rafId = 0

onMounted(() => {
  const el = container.value
  if (!el) { status.value = 'no container'; return }

  const w = el.clientWidth || innerWidth
  const h = el.clientHeight || innerHeight
  status.value = `size ${w}x${h}`

  // ── Plain 2D Canvas Test ──
  const cv = document.createElement('canvas')
  cv.style.cssText = 'position:absolute;inset:0'
  el.appendChild(cv)

  if (!cv.getContext) { status.value += ' | no canvas API'; return }
  const c2 = cv.getContext('2d')!
  cv.width = w; cv.height = h

  // Step 1: draw red rect immediately
  c2.fillStyle = '#ff0000'
  c2.fillRect(0, 0, w, h)
  c2.fillStyle = '#fff'
  c2.font = '20px sans-serif'
  c2.fillText('2D CANVAS OK', 20, 40)

  status.value += ' | 2D drawn'

  // Step 2: try WebGL2
  const glCv = document.createElement('canvas')
  glCv.style.cssText = 'position:absolute;inset:0'
  const gl = glCv.getContext('webgl2', { premultipliedAlpha: false })
  if (!gl) {
    c2.fillStyle = '#ff0'; c2.fillText('NO WebGL2', 20, 70)
    return
  }
  c2.fillStyle = '#0f0'; c2.fillText('WebGL2 OK', 20, 70)

  // Step 3: compile simple frag shader
  const vs = `#version 300 es
in vec2 aPosition;out vec2 vUV;
void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0,1);}`

  const fs = `#version 300 es
precision highp float;in vec2 vUV;out vec4 fragColor;
void main(){
  // Simple orange gradient
  vec3 col=mix(vec3(1,.4,0),vec3(.9,.2,.05),vUV.y);
  fragColor=vec4(col,1);
}`

  const compile = (t:number,s:string) => {
    const sh = gl.createShader(t)!
    gl.shaderSource(sh,s);gl.compileShader(sh)
    return gl.getShaderParameter(sh,gl.COMPILE_STATUS) ? sh : (console.error(gl.getShaderInfoLog(sh)),null)
  }

  const v = compile(gl.VERTEX_SHADER, vs)
  const f = compile(gl.FRAGMENT_SHADER, fs)
  if(!v||!f){c2.fillStyle='#f00';c2.fillText('SHADER FAIL',20,100);return}
  c2.fillStyle='#0f0';c2.fillText('SHADER COMPILED',20,100)

  const prog = gl.createProgram()!
  gl.attachShader(prog,v);gl.attachShader(prog,f);gl.linkProgram(prog)
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){c2.fillStyle='#f00';c2.fillText('LINK FAIL',20,130);return}

  const q = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])
  const vao = gl.createVertexArray();gl.bindVertexArray(vao)
  const buf = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,q,gl.STATIC_DRAW)
  const aP = gl.getAttribLocation(prog,'aPosition')
  gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,2,gl.FLOAT,false,0,0)

  // Step 4: draw WebGL (replaces 2D canvas)
  el.removeChild(cv)
  el.appendChild(glCv)
  glCv.width=w;glCv.height=h

  gl.viewport(0,0,w,h)
  gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(prog)
  gl.drawArrays(gl.TRIANGLES,0,6)

  status.value += ' | DONE'
})

onUnmounted(() => { running=false; cancelAnimationFrame(rafId) })
</script>

<template>
  <div ref="container" class="shader-canvas">
    <div class="debug-label">{{ status }}</div>
  </div>
</template>

<style scoped>
.shader-canvas{position:absolute;inset:0;overflow:hidden;background:#000}
.debug-label{position:absolute;top:4px;left:4px;color:#0f0;font:11px monospace;z-index:99;background:rgba(0,0,0,.7);padding:2px 6px}
</style>
