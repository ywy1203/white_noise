<script setup lang="ts">
/**
 * ShaderCanvas — nano-design 风格 WebGL2 全屏火焰/雨水特效
 * 纯 Fragment Shader 程序化渲染，无粒子、无纹理、无模型
 */
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  sceneId: 'campfire' | 'rain'
}>()

const container = ref<HTMLDivElement>()

let canvas: HTMLCanvasElement | null = null
let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null
let vao: WebGLVertexArrayObject | null = null
let buf: WebGLBuffer | null = null
let uTime: WebGLUniformLocation | null = null
let startTime = 0
let running = false
let rafId = 0

const VERT = `#version 300 es
in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

// Procedural campfire: FBM noise flame with layered coloring
const FRAG_FIRE = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform float uTime;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5,s=1.;
  for(int i=0;i<5;i++){v+=a*noise(p*s);s*=2.;a*=.5;}
  return v;
}

void main(){
  float cx=vUV.x-.5,cy=vUV.y,t=uTime*1.2;
  float hn=cy/3.2;
  float pw=(1.-hn)*.9;
  float tx=fbm(vec2(cx*3.+t*1.2,cy*2.5+t*.6))-fbm(vec2(cx*3.5-t*.8,cy*3.-t*.4));
  tx*=.8*(.5+hn*1.5);
  float dc=abs(cx-tx*.15);
  float ds=dc/max(pw,.001);
  float d=clamp(1.-ds,0.,1.)*(.7+.3*noise(vec2(cx*8.+t,cy*6.)));
  float vf=pow(1.-hn,.5);
  float tn=noise(vec2(cx*12.+t*.2,cy*3.));
  float tf=smoothstep(.6,1.,hn);
  float mt=1.-tf*(1.-smoothstep(.3,.6,tn));
  float tg=smoothstep(.7,.95,hn)*smoothstep(-.03,.03,abs(cx-tx*.2-tn*.1));
  vf*=mt*(1.+tg*.5);
  float fl=clamp(pow(d*vf,1.2),0.,1.);
  vec3 core=vec3(1.,.85,.5),mid=vec3(1.,.55,.1),outer=vec3(.9,.25,.05);
  vec3 col=mix(core,mid,clamp(hn*1.5,0.,1.));
  col=mix(col,outer,clamp(hn*2.5-.7,0.,1.));
  col*=1.-ds*.4;
  float glw=exp(-dc*dc*15.)*exp(-hn*hn*3.)*.6;
  col=mix(col,vec3(1.,.92,.7),glw);
  vec3 c=mix(vec3(0),col,fl);
  c*=1.+.05*noise(vec2(t*15.,0));
  c+=vec3(.8,.4,.05)*exp(-dc*2.)*exp(-hn*1.5)*.15;
  fragColor=vec4(c,1.);
}`

// Procedural rain: 200+ drops, mist, wet sheen
const FRAG_RAIN = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform float uTime;
uniform float uIntensity;
uniform float uSpeed;
uniform float uWind;
uniform float uDropLength;
uniform float uDarken;
uniform float uMistOpacity;
uniform float uWetSheen;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

void main(){
  float t=uTime*uSpeed;

  // Dark background
  float dk=1.-uDarken*.6;
  vec3 bg=vec3(.02,.03,.06)*dk;

  // Rain drops
  float rain=0.;
  int drops=int(60.+uIntensity*200.);
  for(int i=0;i<260;i++){
    if(i>=drops)break;
    float fi=float(i);
    float lane=fract(hash(vec2(fi,0.))+t*.02*uWind);
    float fall=fract(fi*.073+t*(.6+hash(vec2(fi,1.))*.8));
    float depth=hash(vec2(fi,2.));
    float scale=1.-depth*.6;
    float wo=t*uWind*depth*.3;
    float xp=fract(lane+wo);
    vec2 dp=vec2(xp,fall);
    float el=uDropLength*scale;
    vec2 delta=vUV-dp;
    float streak=0.;
    if(abs(delta.x)<.003){
      float ty=dp.y-el*.8;
      streak=smoothstep(ty,dp.y,vUV.y)*smoothstep(dp.y+.05,dp.y,vUV.y)*(1.-abs(delta.x)/.003);
    }
    float head=exp(-dot(delta,delta)*8e3)*.6;
    float ef=smoothstep(0.,.08,fall)*(1.-smoothstep(.92,1.,fall));
    float df=scale*scale;
    rain+=(streak*.5+head)*ef*df*.9;
  }

  // Mist at bottom
  float mist=smoothstep(.15,0.,vUV.y)*uMistOpacity*.25;
  bg+=vec3(.08,.09,.1)*mist;

  // Wet sheen
  float sheen=smoothstep(.1,0.,vUV.y)*uWetSheen*.08;
  bg+=vec3(.1,.11,.12)*sheen;

  vec3 dc=vec3(.85,.88,.95);
  float fr=clamp(rain*uIntensity,0.,1.);
  vec3 color=mix(bg,dc,fr);
  color+=vec3(.02,.04,.08)*uIntensity*.4;
  fragColor=vec4(color,1.);
}`

function compileShader(type: number, source: string): WebGLShader | null {
  const g = gl!
  const s = g.createShader(type)
  if (!s) return null
  g.shaderSource(s, source)
  g.compileShader(s)
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
    console.error('SHADER ERR:', g.getShaderInfoLog(s))
    g.deleteShader(s)
    return null
  }
  return s
}

function initEngine(isRain: boolean): boolean {
  const c = document.createElement('canvas')
  c.style.cssText = 'position:absolute;inset:0;pointer-events:none'

  const g = c.getContext('webgl2', { premultipliedAlpha: false })
  if (!g) return false
  gl = g

  const vs = compileShader(gl.VERTEX_SHADER, VERT)
  const fs = compileShader(gl.FRAGMENT_SHADER, isRain ? FRAG_RAIN : FRAG_FIRE)
  if (!vs || !fs) return false

  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('LINK ERR:', gl.getProgramInfoLog(prog))
    return false
  }
  program = prog

  const quad = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])
  vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  uTime = gl.getUniformLocation(prog, 'uTime')
  canvas = c
  startTime = performance.now()
  return true
}

function init() {
  const el = container.value
  if (!el) return

  const w = el.clientWidth || window.innerWidth
  const h = el.clientHeight || window.innerHeight

  if (!initEngine(props.sceneId === 'rain')) {
    el.textContent = 'WebGL2 not available'
    el.style.cssText += ';color:#f00;display:flex;align-items:center;justify-content:center;font:16px sans-serif'
    return
  }

  el.appendChild(canvas!)
  canvas!.width = w
  canvas!.height = h

  if (running) return
  running = true

  const isRain = props.sceneId === 'rain'
  const locs: Record<string, WebGLUniformLocation | null> = {}
  if (isRain && program) {
    locs.uIntensity = gl!.getUniformLocation(program, 'uIntensity')
    locs.uSpeed = gl!.getUniformLocation(program, 'uSpeed')
    locs.uWind = gl!.getUniformLocation(program, 'uWind')
    locs.uDropLength = gl!.getUniformLocation(program, 'uDropLength')
    locs.uDarken = gl!.getUniformLocation(program, 'uDarken')
    locs.uMistOpacity = gl!.getUniformLocation(program, 'uMistOpacity')
    locs.uWetSheen = gl!.getUniformLocation(program, 'uWetSheen')
  }

  function loop() {
    if (!running) return
    const g = gl!
    const t = (performance.now() - startTime) / 1000

    g.viewport(0, 0, canvas!.width, canvas!.height)
    g.clearColor(0, 0, 0, 1)
    g.clear(g.COLOR_BUFFER_BIT)
    g.useProgram(program!)

    g.uniform1f(uTime, t)
    if (isRain) {
      g.uniform1f(locs.uIntensity, 0.8)
      g.uniform1f(locs.uSpeed, 1.0)
      g.uniform1f(locs.uWind, 0.1)
      g.uniform1f(locs.uDropLength, 0.12)
      g.uniform1f(locs.uDarken, 0.7)
      g.uniform1f(locs.uMistOpacity, 0.5)
      g.uniform1f(locs.uWetSheen, 0.3)
    }

    g.drawArrays(g.TRIANGLES, 0, 6)
    rafId = requestAnimationFrame(loop)
  }
  loop()
}

function stop() {
  running = false
  cancelAnimationFrame(rafId)
  if (gl && program) {
    gl.deleteProgram(program)
    if (buf) gl.deleteBuffer(buf)
    if (vao) gl.deleteVertexArray(vao)
  }
}

onMounted(init)
onUnmounted(stop)
</script>

<template>
  <div ref="container" class="shader-canvas" />
</template>

<style scoped>
.shader-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
}
</style>
