import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ref, shallowRef } from 'vue'
import type { ParticleSceneConfig, ParticleData, SpectrumData, TimeEffectState } from '@/types/particle'
import { generateParticles } from '@/services/particleSampler'
import { Emitter } from '@/services/particleSystem'
import { createCampfireEmitters, generateLogs } from '@/scenes/campfire/campfireEmitter'

export function useParticleEngine() {
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const pointsMeshes = shallowRef<Map<string, THREE.Points>>(new Map())
  const controls = shallowRef<OrbitControls | null>(null)
  const running = ref(false)
  const animFrameId = ref(0)

  let emitters: Emitter[] = []
  let staticLayers: Map<string, ParticleData[]> = new Map()
  let currentConfig: ParticleSceneConfig | null = null
  let currentParticles: Map<string, ParticleData[]> = new Map()
  let currentSpectrum: SpectrumData = { low: 0, mid: 0, high: 0 }
  const timeState: TimeEffectState = {
    pomodoroState: 0, dayNightFactor: 0.5, accumulationFactor: 1.0,
    randomEventActive: false, randomEventTimer: 0,
  }
  let clock = new THREE.Clock()
  const positionBuffers = new Map<string, Float32Array>()
  const colorBuffers = new Map<string, Float32Array>()
  const sizeBuffers = new Map<string, Float32Array>()

  // ========== INIT ==========
  function init(container: HTMLElement) {
    const s = new THREE.Scene()
    scene.value = s

    // Camera
    const aspect = container.clientWidth / container.clientHeight
    const cam = new THREE.PerspectiveCamera(60, aspect, 0.1, 100)
    cam.position.set(0, 2, 12)
    cam.lookAt(0, 0, 0)
    camera.value = cam

    // Renderer - pure black background per requirement
    const r = new THREE.WebGLRenderer({
      antialias: window.innerWidth > 768,
      alpha: false,
      powerPreference: 'high-performance',
    })
    r.setSize(container.clientWidth, container.clientHeight)
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    r.setClearColor(0x000000, 1)
    container.appendChild(r.domElement)
    renderer.value = r

    // Controls
    const ctrl = new OrbitControls(cam, r.domElement)
    ctrl.enableDamping = true
    ctrl.dampingFactor = 0.08
    ctrl.minDistance = 4
    ctrl.maxDistance = 30
    ctrl.maxPolarAngle = Math.PI / 2.2
    ctrl.target.set(0, 1, 0)
    controls.value = ctrl
  }

  // ========== LOAD SCENE ==========
  function loadScene(config: ParticleSceneConfig, isMobile: boolean = false) {
    dispose()
    currentConfig = config
    clock = new THREE.Clock()
    const s = scene.value
    if (!s) return

    if (config.id === 'campfire') {
      // New emitter system
      emitters = createCampfireEmitters()
      currentParticles = new Map()
      for (const em of emitters) {
        const map = em.getLayerMap()
        for (const [k, v] of map) currentParticles.set(k, v)
      }
      const logs = generateLogs()
      staticLayers.set('log', logs)
      currentParticles.set('log', logs)
    } else {
      // Legacy generation for other scenes
      const particles = generateParticles(config, isMobile)
      const layerMap = new Map<string, ParticleData[]>()
      for (const p of particles) {
        const list = layerMap.get(p.layerId)
        if (list) list.push(p)
        else layerMap.set(p.layerId, [p])
      }
      currentParticles = layerMap
    }

    for (const [layerId, data] of currentParticles) {
      createPointsForLayer(layerId, data)
    }
  }

  // ========== SHADERS ==========
  const vertexShader = `
    attribute float size; attribute float alpha; attribute vec3 color;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      vColor = color; vAlpha = alpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(1.0, size * (80.0 / -mvPosition.z));
      gl_Position = projectionMatrix * mvPosition;
    }
  `
  const fragmentShader = `
    varying vec3 vColor; varying float vAlpha;
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;
      float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
      falloff = falloff * falloff * (2.0 - falloff);
      gl_FragColor = vec4(vColor, falloff * vAlpha);
    }
  `

  // ========== CREATE POINTS ==========
  function createPointsForLayer(layerId: string, data: ParticleData[]) {
    const s = scene.value
    if (!s) return

    const count = data.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const p = data[i]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      colors[i * 3] = p.r / 255
      colors[i * 3 + 1] = p.g / 255
      colors[i * 3 + 2] = p.b / 255
      sizes[i] = p.size
      alphas[i] = p.a
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.computeBoundingSphere()

    const isLog = layerId === 'log'
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      transparent: true,
      depthWrite: isLog,
      blending: isLog ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthTest: true,
    })

    const points = new THREE.Points(geometry, material)
    points.name = layerId
    s.add(points)
    pointsMeshes.value.set(layerId, points)
    positionBuffers.set(layerId, positions)
    colorBuffers.set(layerId, colors)
    sizeBuffers.set(layerId, sizes)
  }

  // ========== UPDATE ==========
  function updateParticles(time: number, delta: number, spectrum?: SpectrumData) {
    if (!currentConfig) return
    if (spectrum) currentSpectrum = spectrum
    if (emitters.length > 0) {
      for (const em of emitters) {
        em.update(delta, time, currentSpectrum.low, currentSpectrum.mid, currentSpectrum.high)
      }
    }
    for (const [layerId, data] of currentParticles) {
      const points = pointsMeshes.value.get(layerId)
      if (!points) continue
      const geo = points.geometry
      const pos = geo.attributes.position as THREE.BufferAttribute
      const col = geo.attributes.color as THREE.BufferAttribute
      const sz = geo.attributes.size as THREE.BufferAttribute
      const alp = geo.attributes.alpha as THREE.BufferAttribute
      if (!pos) continue
      for (let i = 0; i < data.length; i++) {
        const p = data[i]; const idx = i * 3
        pos.array[idx] = p.x; pos.array[idx + 1] = p.y; pos.array[idx + 2] = p.z
        if (col) { col.array[idx] = p.r / 255; col.array[idx + 1] = p.g / 255; col.array[idx + 2] = p.b / 255 }
        if (sz) sz.array[i] = p.size
        if (alp) alp.array[i] = p.a
      }
      pos.needsUpdate = true
      if (col) col.needsUpdate = true
      if (sz) sz.needsUpdate = true
      if (alp) alp.needsUpdate = true
    }
  }

  // ========== START / STOP ==========
  function start() {
    if (running.value) return
    running.value = true
    clock.start()
    function animate() {
      if (!running.value) return
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      updateParticles(elapsed, delta)
      if (renderer.value && scene.value && camera.value) {
        controls.value?.update()
        renderer.value.render(scene.value, camera.value)
      }
      animFrameId.value = requestAnimationFrame(animate)
    }
    animate()
  }

  function stop() { running.value = false; cancelAnimationFrame(animFrameId.value) }

  function dispose() {
    stop()
    controls.value?.dispose(); controls.value = null
    for (const em of emitters) em.dispose(); emitters = []
    const s = scene.value
    if (s) {
      while (s.children.length > 0) {
        const child = s.children[0]
        if (child instanceof THREE.Points) { child.geometry.dispose(); (child.material as THREE.Material).dispose() }
        s.remove(child)
      }
    }
    pointsMeshes.value.clear(); positionBuffers.clear(); colorBuffers.clear(); sizeBuffers.clear()
    currentParticles.clear(); staticLayers.clear(); currentConfig = null; clock = new THREE.Clock()
  }

  function resize(w: number, h: number) {
    if (camera.value) { camera.value.aspect = w / h; camera.value.updateProjectionMatrix() }
    if (renderer.value) renderer.value.setSize(w, h)
  }

  function updateSpectrum(spec: SpectrumData) { currentSpectrum = spec }
  function handleInteraction() {}

  return {
    scene, camera, renderer, running, pointsMeshes,
    init, loadScene, start, stop, dispose, resize,
    handleInteraction, updateSpectrum,
  }
}
