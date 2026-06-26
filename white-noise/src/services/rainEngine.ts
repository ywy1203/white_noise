/**
 * Rain Shader Engine (WebGL2)
 * Architecture inspired by nano-design: single fullscreen quad + frag shader.
 * No Three.js dependency — renders directly to a standalone <canvas>.
 */

// ── Vertex Shader: fullscreen triangle (no buffer needed) ──
const VERT_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

// ── Fragment Shader: procedural rain ──
const FRAG_SHADER = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform float uTime;
uniform float uIntensity;       // 0..1, controls drop count
uniform float uSpeed;           // vertical speed multiplier
uniform float uWind;            // horizontal wind drift
uniform float uDropLength;
uniform float uDarken;          // how much to darken the scene
uniform float uMistOpacity;
uniform float uWetSheen;        // surface reflection
uniform sampler2D uSceneTex;    // optional: blend over scene

// ---- hash / noise ----
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash13(vec3 p) {
  return fract(sin(p.x * 91.3458 + p.y * 56.7812 + p.z * 13.4567) * 47539.2823);
}

// ---- drop rendering ----
float drawDrop(vec2 uv, vec2 dropPos, float dropAge, float dropLength) {
  vec2 delta = uv - dropPos;
  float dist = length(delta);

  // Thin vertical streak
  float streak = 0.0;
  if (abs(delta.x) < 0.003) {
    float yDist = uv.y - dropPos.y;
    float tailY = dropPos.y - dropLength * 0.8;
    streak = smoothstep(tailY, dropPos.y, uv.y)
           * smoothstep(dropPos.y + 0.05, dropPos.y, uv.y)
           * (1.0 - abs(delta.x) / 0.003);
  }

  // Bright head
  float head = exp(-dist * dist * 8000.0) * 0.6;

  return streak * 0.5 + head;
}

void main() {
  float t = uTime * uSpeed;

  // ── Background darkening ──
  float darken = 1.0 - uDarken * 0.6;
  vec3 bg = vec3(0.02, 0.03, 0.06) * darken;

  // ── Rain drops ──
  float rain = 0.0;
  int drops = int(60.0 + uIntensity * 200.0);  // 60..260 drops visible

  for (int i = 0; i < 260; i++) {
    if (i >= drops) break;

    // Seeded pseudo-random position & timing
    float fi = float(i);
    vec3 seed = vec3(fi * 0.789, fi * 0.431 + 0.2, 0.0);

    // Horizontal lane (wrapped for looping)
    float lane = fract(hash(vec2(fi, 0.0)) + t * 0.02 * uWind);
    // Rain falls vertically; use time to scroll
    float fall = fract(fi * 0.073 + t * (0.6 + hash(vec2(fi, 1.0)) * 0.8));
    // Depth: 0=close/big, 1=far/small
    float depth = hash(vec2(fi, 2.0));
    float scale = 1.0 - depth * 0.6;       // far drops smaller

    // Wind shifts lane with depth (parallax)
    float windOffset = t * uWind * depth * 0.3;
    float xPos = fract(lane + windOffset);

    // Drop head position
    vec2 dropPos = vec2(xPos, fall);
    // Drop length shorter for far drops
    float effectiveLen = uDropLength * scale;

    // Draw the drop
    float dropVal = drawDrop(vUV, dropPos, fi, effectiveLen);

    // Fade out drops near edges for seamless wrap
    float edgeFade = smoothstep(0.0, 0.08, fall) * (1.0 - smoothstep(0.92, 1.0, fall));
    // Fade by depth (far drops are dimmer)
    float depthFade = scale * scale;

    rain += dropVal * edgeFade * depthFade * 0.9;
  }

  // ── Mist at bottom ──
  float mist = smoothstep(0.15, 0.0, vUV.y) * uMistOpacity * 0.25;
  bg += vec3(0.08, 0.09, 0.10) * mist;

  // ── Wet sheen (surface reflection) ──
  float sheen = smoothstep(0.1, 0.0, vUV.y) * uWetSheen * 0.08;
  bg += vec3(0.1, 0.11, 0.12) * sheen;

  // ── Compose ──
  // Rain drops glow white
  vec3 dropColor = vec3(0.85, 0.88, 0.95);
  float finalRain = clamp(rain * uIntensity, 0.0, 1.0);
  vec3 color = mix(bg, dropColor, finalRain);

  // Slight blue tint when raining hard
  color += vec3(0.02, 0.04, 0.08) * uIntensity * 0.4;

  fragColor = vec4(color, 1.0);
}`

// ── Engine ──

export interface RainParams {
  intensity: number    // 0..1
  speed: number         // 1.0 = normal
  wind: number          // -1..1 (negative = left)
  dropLength: number    // 0.05..0.3
  darken: number        // 0..1
  mistOpacity: number   // 0..1
  wetSheen: number      // 0..1
}

export interface RainEngine {
  canvas: HTMLCanvasElement
  resize: (w: number, h: number) => void
  render: (params: RainParams) => void
  destroy: () => void
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Rain shader compile:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createRainEngine(): RainEngine | null {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2'

  const _gl = canvas.getContext('webgl2', { premultipliedAlpha: false })
  if (!_gl) return null
  const gl = _gl

  // ── Shaders ──
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER)
  if (!vert || !frag) return null

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Rain program link:', gl.getProgramInfoLog(program))
    return null
  }

  // ── Fullscreen quad (2 triangles) ──
  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

  const aPos = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  // ── Uniform locations ──
  const loc = {
    uTime: gl.getUniformLocation(program, 'uTime'),
    uIntensity: gl.getUniformLocation(program, 'uIntensity'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    uWind: gl.getUniformLocation(program, 'uWind'),
    uDropLength: gl.getUniformLocation(program, 'uDropLength'),
    uDarken: gl.getUniformLocation(program, 'uDarken'),
    uMistOpacity: gl.getUniformLocation(program, 'uMistOpacity'),
    uWetSheen: gl.getUniformLocation(program, 'uWetSheen'),
  }

  let startTime = performance.now()

  function resize(w: number, h: number) {
    canvas.width = w
    canvas.height = h
  }

  function render(params: RainParams) {
    const elapsed = (performance.now() - startTime) / 1000

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.uniform1f(loc.uTime, elapsed)
    gl.uniform1f(loc.uIntensity, params.intensity)
    gl.uniform1f(loc.uSpeed, params.speed)
    gl.uniform1f(loc.uWind, params.wind)
    gl.uniform1f(loc.uDropLength, params.dropLength)
    gl.uniform1f(loc.uDarken, params.darken)
    gl.uniform1f(loc.uMistOpacity, params.mistOpacity)
    gl.uniform1f(loc.uWetSheen, params.wetSheen)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  function destroy() {
    gl.deleteProgram(program)
    gl.deleteShader(vert)
    gl.deleteShader(frag)
    gl.deleteBuffer(vbo)
    if (vao) gl.deleteVertexArray(vao)
  }

  return { canvas, resize, render, destroy }
}
