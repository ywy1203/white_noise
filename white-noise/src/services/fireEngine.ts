/**
 * Fire Shader Engine (WebGL2)
 * Procedural campfire — no particles, pure fragment shader.
 * Fullscreen quad + noise-based flame synthesis.
 * Architecture follows nano-design pattern.
 */

const VERT_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const FRAG_SHADER = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform float uTime;
uniform float uIntensity;     // 0..1
uniform float uFlameHeight;   // 1.5..4.0
uniform float uFlameWidth;    // 0.5..1.5
uniform float uTurbulence;    // 0.3..1.5
uniform float uSwaySpeed;     // 0.5..2.0
uniform vec3 uColorCore;      // warm yellow
uniform vec3 uColorMid;       // golden
uniform vec3 uColorOuter;     // orange-red

// ---- Hash / Noise ----
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  float s = 1.0;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p * s);
    s *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Normalized coordinates: centered horizontally, bottom at y=0
  float cx = vUV.x - 0.5;
  float cy = vUV.y;

  float time = uTime * uSwaySpeed;

  // ── Flame base position (centered at bottom) ──
  // The flame rises from the bottom center; use cy as height

  // ── Flame profile ──
  // Width narrows with height using a power curve
  float heightNorm = cy / uFlameHeight;
  float profileWidth = (1.0 - heightNorm) * uFlameWidth;
  // Add wobble to the width curve for natural flame shape
  profileWidth *= 1.0 + 0.25 * (1.0 - heightNorm) * noise(vec2(heightNorm * 5.0, time * 0.3));

  // ── Turbulence ──
  // Lateral displacement from Perlin noise
  float turbX = fbm(vec2(cx * 3.0 + time * 1.2, cy * 2.5 + time * 0.6))
              - fbm(vec2(cx * 3.5 - time * 0.8, cy * 3.0 - time * 0.4));
  turbX *= uTurbulence * (0.5 + heightNorm * 1.5);  // more sway at top

  float distFromCenter = abs(cx - turbX * 0.15);

  // ── Flame density ──
  // Dense at center, falls off to edges
  float density = 1.0 - distFromCenter / max(profileWidth, 0.001);
  density = clamp(density, 0.0, 1.0);
  // Add organic detail via noise
  density *= 0.7 + 0.3 * noise(vec2(cx * 8.0 + time, cy * 6.0));

  // ── Vertical falloff ──
  // Bright bottom, dark top
  float vertFalloff = 1.0 - heightNorm;
  vertFalloff = pow(vertFalloff, 0.5);

  // ── Multi-flame-tip effect ──
  // At top, break into multiple tips
  float tipNoise = noise(vec2(cx * 12.0 + time * 0.2, cy * 3.0));
  float tipFactor = smoothstep(0.6, 1.0, heightNorm);
  float multiTip = 1.0 - tipFactor * (1.0 - smoothstep(0.3, 0.6, tipNoise));
  // Also create occasional flame tongues reaching higher
  float tongue = smoothstep(0.7, 0.95, heightNorm)
               * smoothstep(-0.03, 0.03, abs(cx - turbX * 0.2 - tipNoise * 0.1));
  vertFalloff *= multiTip * (1.0 + tongue * 0.5);

  // ── Overall flame value ──
  float flame = density * vertFalloff;
  flame = clamp(pow(flame, 1.2), 0.0, 1.0);

  // ── Layered coloring ──
  // Core (bottom/center): bright → use highest density
  float coreMask = smoothstep(0.1, 0.0, distFromScreen) * smoothstep(0.3, 0.0, heightNorm);
  float outerMask = smoothstep(0.4, 0.7, heightNorm) * smoothstep(0.5, 1.0, distFromScreen);
  float midMask = 1.0 - coreMask - outerMask;

  // Color blending
  float distFromScreen = distFromCenter / max(profileWidth, 0.001);

  // Height-based color: bottom=yellow, top=orange-red
  float colorMixHeight = heightNorm;  // 0..1
  vec3 heightColor = mix(uColorCore, uColorMid, clamp(colorMixHeight * 1.5, 0.0, 1.0));
  heightColor = mix(heightColor, uColorOuter, clamp(colorMixHeight * 2.5 - 0.7, 0.0, 1.0));

  // Edge darkening
  heightColor *= 1.0 - distFromScreen * 0.4;

  // ── Hot core glow ──
  float coreGlow = exp(-distFromCenter * distFromCenter * 15.0)
                 * exp(-heightNorm * heightNorm * 3.0);
  coreGlow *= 0.6;

  vec3 coreColor = vec3(1.0, 0.92, 0.7);  // nearly white-hot
  vec3 flameColor = mix(heightColor, coreColor, coreGlow);

  // ── Base dark area ──
  float fireAlpha = flame * uIntensity;
  vec3 bg = vec3(0.0, 0.0, 0.0);
  vec3 color = mix(bg, flameColor, fireAlpha);

  // ── Flicker ──
  float flicker = 1.0 + 0.05 * noise(vec2(time * 15.0, 0.0));
  color *= flicker;

  // ── Glow halo around flame ──
  float halo = exp(-distFromCenter * 2.0) * exp(-heightNorm * 1.5) * uIntensity * 0.15;
  color += vec3(0.8, 0.4, 0.05) * halo;

  fragColor = vec4(color, 1.0);
}`

// ── Engine ──

export interface FireParams {
  intensity: number     // 0..1
  flameHeight: number    // 1.5..4.0
  flameWidth: number     // 0.5..1.5
  turbulence: number      // 0.3..1.5
  swaySpeed: number       // 0.5..2.0
  colorCore: [number, number, number]   // warm yellow
  colorMid: [number, number, number]    // golden
  colorOuter: [number, number, number]  // orange-red
}

export interface FireEngine {
  canvas: HTMLCanvasElement
  resize: (w: number, h: number) => void
  render: (params: FireParams) => void
  destroy: () => void
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Fire shader compile:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createFireEngine(): FireEngine | null {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none'

  const _gl = canvas.getContext('webgl2', { premultipliedAlpha: false })
  if (!_gl) return null
  const gl = _gl

  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER)
  if (!vert || !frag) return null

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Fire program link:', gl.getProgramInfoLog(program))
    return null
  }

  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const loc = {
    uTime: gl.getUniformLocation(program, 'uTime'),
    uIntensity: gl.getUniformLocation(program, 'uIntensity'),
    uFlameHeight: gl.getUniformLocation(program, 'uFlameHeight'),
    uFlameWidth: gl.getUniformLocation(program, 'uFlameWidth'),
    uTurbulence: gl.getUniformLocation(program, 'uTurbulence'),
    uSwaySpeed: gl.getUniformLocation(program, 'uSwaySpeed'),
    uColorCore: gl.getUniformLocation(program, 'uColorCore'),
    uColorMid: gl.getUniformLocation(program, 'uColorMid'),
    uColorOuter: gl.getUniformLocation(program, 'uColorOuter'),
  }

  let startTime = performance.now()

  function resize(w: number, h: number) {
    canvas.width = w
    canvas.height = h
  }

  function render(params: FireParams) {
    const elapsed = (performance.now() - startTime) / 1000

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.uniform1f(loc.uTime, elapsed)
    gl.uniform1f(loc.uIntensity, params.intensity)
    gl.uniform1f(loc.uFlameHeight, params.flameHeight)
    gl.uniform1f(loc.uFlameWidth, params.flameWidth)
    gl.uniform1f(loc.uTurbulence, params.turbulence)
    gl.uniform1f(loc.uSwaySpeed, params.swaySpeed)
    gl.uniform3f(loc.uColorCore, params.colorCore[0], params.colorCore[1], params.colorCore[2])
    gl.uniform3f(loc.uColorMid, params.colorMid[0], params.colorMid[1], params.colorMid[2])
    gl.uniform3f(loc.uColorOuter, params.colorOuter[0], params.colorOuter[1], params.colorOuter[2])

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
