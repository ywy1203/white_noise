import { reactive } from 'vue'
import { soundPath } from '@/config/scenes'
import { useAudioStore } from '@/stores/audioStore'

interface SoundNode {
  source: AudioBufferSourceNode
  gain: GainNode
}

export function useAudio() {
  let ctx: AudioContext | null = null
  const bufCache = new Map<string, AudioBuffer>()
  const activeNodes = reactive<Record<string, SoundNode | 'loading'>>({})
  let unlocked = false

  function ensureCtx(): AudioContext {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  async function loadSound(id: string): Promise<AudioBuffer> {
    const cached = bufCache.get(id)
    if (cached) return cached

    const path = soundPath(id)
    if (!path) throw new Error(`no path for ${id}`)

    const resp = await fetch(path)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    const ab = await resp.arrayBuffer()
    const ctx = ensureCtx()
    const decoded = await ctx.decodeAudioData(ab)
    bufCache.set(id, decoded)
    return decoded
  }

  function playSound(id: string, vol: number) {
    const existing = activeNodes[id]
    if (existing && existing !== 'loading') {
      existing.gain.gain.value = vol * (store.isMuted ? 0 : 1)
      return
    }
    if (existing === 'loading') return

    activeNodes[id] = 'loading'
    loadSound(id).then(buf => {
      if (activeNodes[id] === 'stopped') return

      const c = ensureCtx()
      const src = c.createBufferSource()
      src.buffer = buf
      src.loop = true

      const g = c.createGain()
      g.gain.value = vol * (store.isMuted ? 0 : 1)

      src.connect(g).connect(c.destination)
      src.start(0)
      activeNodes[id] = { source: src, gain: g }
    }).catch(() => {
      // Sound file unavailable
      if (activeNodes[id] === 'loading') delete activeNodes[id]
    })
  }

  function stopSound(id: string) {
    const node = activeNodes[id]
    if (!node || node === 'loading' || node === 'stopped') return
    try { node.source.stop() } catch { /* already stopped */ }
    delete activeNodes[id]
  }

  function setVolume(id: string, vol: number) {
    const node = activeNodes[id]
    if (node && node !== 'loading') {
      node.gain.gain.value = vol * (store.isMuted ? 0 : 1)
    }
  }

  function applyMix(sceneIdx: number) {
    const m = store.mixes[sceneIdx] ?? {}
    // Stop removed sounds
    Object.keys(activeNodes).forEach(id => {
      if (!m[id] || !m[id].active) stopSound(id)
    })
    // Start / update active sounds
    Object.keys(m).forEach(id => {
      if (m[id].active) playSound(id, m[id].vol)
    })
  }

  function stopAll() {
    Object.keys(activeNodes).forEach(stopSound)
  }

  function unlock() {
    if (unlocked) return
    unlocked = true
    ensureCtx()
    applyMix(store.currentScene)
  }

  const store = useAudioStore()

  return {
    ctx,
    activeNodes,
    unlocked,
    ensureCtx,
    loadSound,
    playSound,
    stopSound,
    setVolume,
    applyMix,
    stopAll,
    unlock,
  }
}
