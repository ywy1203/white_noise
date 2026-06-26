<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  sceneId: 'campfire' | 'rain'
}>()

const container = ref<HTMLDivElement>()
const status = ref('...')
const ok = ref(false)

let engine: ReturnType<typeof createTestEngine> | null = null
let running = false
let rafId = 0

// Minimal temp engine that just draws red → verifies pipeline
function createTestEngine() {
  const c = document.createElement('canvas')
  c.style.cssText = 'position:absolute;inset:0;pointer-events:none'
  const gl = c.getContext('webgl2', { premultipliedAlpha: false })
  if (!gl) return null

  const vs = `#version 300 es
    in vec2 aPosition;
    out vec2 vUV;
    void main() {
      vUV = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`

  const fs = `#version 300 es
    precision highp float;
    in vec2 vUV;
    out vec4 fragColor;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
    }
    float fbm(vec2 p) { float v=0.,a=.5,s=1.; for(int i=0;i<5;i++){v+=a*noise(p*s);s*=2.;a*=.5;} return v; }

    uniform float uTime;

    void main() {
      float cx = vUV.x - 0.5;
      float cy = vUV.y;
      float t = uTime * 1.2;

      // Flame profile
      float heightNorm = cy / 3.2;
      float profileWidth = (1.0 - heightNorm) * 0.9;
      float turbX = fbm(vec2(cx*3.+t*1.2, cy*2.5+t*0.6)) - fbm(vec2(cx*3.5-t*0.8, cy*3.-t*0.4));
      turbX *= 0.8 * (0.5 + heightNorm * 1.5);
      float distFromCenter = abs(cx - turbX * 0.15);
      float distFromScreen = distFromCenter / max(profileWidth, 0.001);

      float density = 1.0 - distFromScreen;
      density = clamp(density, 0., 1.) * (0.7 + 0.3 * noise(vec2(cx*8.+t, cy*6.)));

      float vertFalloff = pow(1.0 - heightNorm, 0.5);
      float tipNoise = noise(vec2(cx*12.+t*0.2, cy*3.));
      float tipFactor = smoothstep(0.6, 1.0, heightNorm);
      float multiTip = 1.0 - tipFactor*(1.0-smoothstep(0.3,0.6,tipNoise));
      float tongue = smoothstep(0.7,0.95,heightNorm)*smoothstep(-0.03,0.03,abs(cx-turbX*0.2-tipNoise*0.1));
      vertFalloff *= multiTip * (1.+tongue*0.5);

      float flame = clamp(pow(density*vertFalloff, 1.2), 0., 1.);

      // Color gradient
      vec3 core = vec3(1.0,0.85,0.5), mid = vec3(1.0,0.55,0.1), outer = vec3(0.9,0.25,0.05);
      vec3 col = mix(core, mid, clamp(heightNorm*1.5,0.,1.));
      col = mix(col, outer, clamp(heightNorm*2.5-0.7,0.,1.));
      col *= 1.0 - distFromScreen * 0.4;

      float glow = exp(-distFromCenter*distFromCenter*15.)*exp(-heightNorm*heightNorm*3.)*0.6;
      col = mix(col, vec3(1.,0.92,0.7), glow);

      vec3 bg = vec3(0.0);
      float alpha = flame * 1.0;
      vec3 color = mix(bg, col, alpha);

      // flicker + halo
      color *= 1.0 + 0.05*noise(vec2(t*15.,0.));
      color += vec3(0.8,0.4,0.05)*exp(-distFromCenter*2.)*exp(-heightNorm*1.5)*0.15;

      fragColor = vec4(color, 1.0);
    }`

  const compile = (t: number, src: string) => {
    const s = gl.createShader(t)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('SHADER COMPILE ERROR:', gl.getShaderInfoLog(s))
      return null
    }
    return s
  }

  const v = compile(gl.VERTEX_SHADER, vs)
  const f = compile(gl.FRAGMENT_SHADER, fs)
  if (!v || !f) { gl.deleteShader(v); gl.deleteShader(f); return null }

  const prog = gl.createProgram()!
  gl.attachShader(prog, v); gl.attachShader(prog, f)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('LINK ERROR:', gl.getProgramInfoLog(prog)); return null }

  const quad = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPosition')
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const uTime = gl.getUniformLocation(prog, 'uTime')
  const start = performance.now()

  return {
    canvas: c,
    render() {
      const t = (performance.now() - start) / 1000
      gl.viewport(0, 0, c.width, c.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(prog)
      gl.uniform1f(uTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    },
    resize(w: number, h: number) { c.width = w; c.height = h },
    destroy() { gl.deleteProgram(prog); gl.deleteShader(v); gl.deleteShader(f); gl.deleteBuffer(buf); if(vao)gl.deleteVertexArray(vao) },
  }
}

function init() {
  status.value = 'init...'
  const el = container.value
  if (!el) { status.value = 'NO CONTAINER'; return }

  const w = el.clientWidth || window.innerWidth
  const h = el.clientHeight || window.innerHeight
  status.value = `container ${w}x${h}`

  engine = createTestEngine()
  if (!engine) { status.value += ' | ENGINE NULL'; return }
  status.value += ' | engine created'

  el.appendChild(engine.canvas)
  engine.resize(w, h)
  status.value += ` | canvas ${engine.canvas.width}x${engine.canvas.height} | rendering...`
  ok.value = true

  if (running) return
  running = true
  function loop() {
    if (!running) return
    engine?.render()
    rafId = requestAnimationFrame(loop)
  }
  loop()
}

function stop() {
  running = false
  cancelAnimationFrame(rafId)
  engine?.destroy()
  engine = null
}

onMounted(init)
onUnmounted(stop)
</script>

<template>
  <div ref="container" class="shader-canvas">
    <div class="debug-label">{{ status }}</div>
  </div>
</template>

<style scoped>
.shader-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
}
.debug-label {
  position: absolute; top: 8px; left: 8px;
  color: #0f0; font: 12px monospace;
  z-index: 99; background: rgba(0,0,0,.7); padding: 4px 8px;
}
</style>
