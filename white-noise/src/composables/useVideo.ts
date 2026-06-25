import { ref, shallowRef } from 'vue'
import { SCENES, SCENE_COUNT, VIDEO_LOOP_SEC } from '@/config/scenes'

export function useVideo() {
  const canvases = shallowRef<HTMLCanvasElement[]>([])
  const ctxs = shallowRef<CanvasRenderingContext2D[]>([])
  const videos = shallowRef<HTMLVideoElement[]>([])
  const loading = ref(true)
  let drawReq = 0

  function init() {
    const cvs: HTMLCanvasElement[] = []
    const cs: CanvasRenderingContext2D[] = []
    const vids: HTMLVideoElement[] = []

    for (let i = 0; i < SCENE_COUNT; i++) {
      const v = document.createElement('video')
      v.loop = false
      v.muted = true
      v.playsInline = true
      v.preload = 'metadata'
      v.src = SCENES[i].video as string
      v.addEventListener('timeupdate', () => {
        if (v.currentTime >= VIDEO_LOOP_SEC && !v.loop) v.currentTime = 0
      })
      vids.push(v)

      const c = document.createElement('canvas')
      c.width = Math.round(window.innerWidth)
      c.height = Math.round(window.innerHeight)
      cvs.push(c)
      cs.push(c.getContext('2d')!)
    }

    canvases.value = cvs
    ctxs.value = cs
    videos.value = vids
    loading.value = false
  }

  function resize() {
    const w = Math.round(window.innerWidth)
    const h = Math.round(window.innerHeight)
    canvases.value.forEach(c => { c.width = w; c.height = h })
  }

  function coverScale(cw: number, ch: number, vw: number, vh: number) {
    const s = Math.max(cw / vw, ch / vh)
    return { x: (cw - vw * s) / 2, y: (ch - vh * s) / 2, w: vw * s, h: vh * s }
  }

  function draw(idx: number) {
    const v = videos.value[idx]
    if (!v || v.readyState < 2 || v.paused) return
    const c = canvases.value[idx]
    const ctx = ctxs.value[idx]
    if (!c || !ctx || !v.videoWidth) return
    const d = coverScale(c.width, c.height, v.videoWidth, v.videoHeight)
    ctx.drawImage(v, d.x, d.y, d.w, d.h)
  }

  function startLoop() {
    function frame() {
      // Only draw the first video that's playing (index managed externally via watcher)
      for (let i = 0; i < SCENE_COUNT; i++) {
        const v = videos.value[i]
        if (v && v.readyState >= 2 && !v.paused) {
          draw(i)
          break // only draw active scene
        }
      }
      drawReq = requestAnimationFrame(frame)
    }
    drawReq = requestAnimationFrame(frame)
  }

  function stopLoop() {
    cancelAnimationFrame(drawReq)
  }

  function play(idx: number) {
    const v = videos.value[idx]
    if (!v) return
    if (!v.src || !v.src.includes(SCENES[idx].video as string)) {
      v.src = SCENES[idx].video as string
      v.load()
    }
    v.play().catch(() => {})
  }

  function drawStill(idx: number) {
    const v = videos.value[idx]
    if (!v || v.readyState < 2) return
    const c = canvases.value[idx]
    if (!c || !v.videoWidth) return
    const d = coverScale(c.width, c.height, v.videoWidth, v.videoHeight)
    ctxs.value[idx].drawImage(v, d.x, d.y, d.w, d.h)
  }

  function preloadAdjacent(idx: number) {
    const adj = [(idx - 1 + SCENE_COUNT) % SCENE_COUNT, (idx + 1) % SCENE_COUNT]
    adj.forEach(i => {
      const v = videos.value[i]
      if (v && (!v.src || !v.src.includes(SCENES[i].video as string))) {
        v.src = SCENES[i].video as string
        v.load()
      }
    })
  }

  return {
    canvases, ctxs, videos, loading,
    init, resize, draw, drawStill, play, preloadAdjacent,
    startLoop, stopLoop, coverScale,
  }
}
