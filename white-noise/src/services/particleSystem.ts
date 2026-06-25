/**
 * 粒子系统核心：Emitter + Behaviour 链 + Perlin 湍流
 * 参考 three.proton / three-nebula 架构
 */

import type { ParticleData, EmitterConfig } from '@/types/particle'

// ============================================================
//  Perlin 噪声（简易实现，用于火焰湍流）
// ============================================================

// 预置梯度向量表
const GRAD: [number, number][] = []
for (let i = 0; i < 256; i++) {
  const theta = (i / 256) * Math.PI * 2
  GRAD.push([Math.cos(theta), Math.sin(theta)])
}

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }

function dot2(g: [number, number], x: number, y: number): number {
  return g[0] * x + g[1] * y
}

// 简易 2D Perlin 噪声（只依赖噪声值，不需要外部图片）
export function perlin2(x: number, y: number): number {
  const ix = Math.floor(x) & 255
  const iy = Math.floor(y) & 255
  const fx = x - Math.floor(x)
  const fy = y - Math.floor(y)
  const u = fade(fx)
  const v = fade(fy)

  const g00 = GRAD[(ix + GRAD[iy][0] * 256) & 255]
  const g10 = GRAD[(ix + 1 + GRAD[iy][0] * 256) & 255]
  const g01 = GRAD[(ix + GRAD[(iy + 1) & 255][0] * 256) & 255]
  const g11 = GRAD[(ix + 1 + GRAD[(iy + 1) & 255][0] * 256) & 255]

  const n00 = dot2(g00, fx, fy)
  const n10 = dot2(g10, fx - 1, fy)
  const n01 = dot2(g01, fx, fy - 1)
  const n11 = dot2(g11, fx - 1, fy - 1)

  const nx0 = lerp(n00, n10, u)
  const nx1 = lerp(n01, n11, u)
  return lerp(nx0, nx1, v)
}

// ============================================================
//  发射器
// ============================================================

export class Emitter {
  config: EmitterConfig
  particles: ParticleData[]
  private spawnAccum = 0
  private rng: () => number
  private seed: number

  constructor(config: EmitterConfig, seed: number = 42) {
    this.config = config
    this.particles = []
    this.seed = seed
    this.rng = this.createRng(seed)
  }

  private createRng(s: number): () => number {
    let seed = s
    return () => {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff
      return seed / 0x7fffffff
    }
  }

  /** 初始化：预生成粒子池 */
  init(): void {
    const cfg = this.config
    this.particles = []
    for (let i = 0; i < cfg.maxParticles; i++) {
      this.particles.push(this.spawnParticle())
    }
  }

  /** 在锥形内随机采样发射位置 */
  private samplePosition(): [number, number, number] {
    const cfg = this.config
    const rng = this.rng
    if (cfg.shape === 'point') {
      return [0, 0, 0]
    }
    if (cfg.shape === 'cone') {
      // 在锥体内均匀采样：底部宽顶部窄
      const t = Math.pow(rng(), 0.6) // 偏向底部
      const y = t * cfg.coneHeight
      const radiusAtY = cfg.coneBottomRadius * (1 - t) + cfg.coneTopRadius * t
      const ang = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * radiusAtY
      return [Math.cos(ang) * r, y, Math.sin(ang) * r]
    }
    if (cfg.shape === 'box') {
      const [hx, hy, hz] = cfg.boxSize
      return [(rng() - 0.5) * hx * 2, (rng() - 0.5) * hy * 2, (rng() - 0.5) * hz * 2]
    }
    if (cfg.shape === 'sphere') {
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      const r = Math.pow(rng(), 1 / 3) * cfg.sphereRadius
      return [
        Math.sin(phi) * Math.cos(theta) * r,
        Math.sin(phi) * Math.sin(theta) * r,
        Math.cos(phi) * r,
      ]
    }
    return [0, 0, 0]
  }

  /** 生成一个全新粒子 */
  spawnParticle(): ParticleData {
    const cfg = this.config
    const rng = this.rng

    const [sx, sy, sz] = this.samplePosition()

    // 速度：向上为主，锥形散布
    const ang = rng() * Math.PI * 2
    const spread = rng() * cfg.spreadAngle
    const speed = cfg.baseSpeed + (rng() - 0.5) * cfg.speedSpread
    const vx = Math.sin(spread) * Math.cos(ang) * speed
    const vz = Math.sin(spread) * Math.sin(ang) * speed
    const vy = Math.cos(spread) * speed

    const lifespan = cfg.lifespan + (rng() - 0.5) * cfg.lifespanSpread
    const midColor = cfg.midColor

    return {
      x: sx, y: sy, z: sz,
      vx, vy, vz,
      r: cfg.startColor[0], g: cfg.startColor[1], b: cfg.startColor[2],
      a: cfg.startAlpha,
      size: cfg.startSize,
      layerId: cfg.layerId,
      phase: rng() * Math.PI * 2,
      age: rng() * lifespan * 0.3, // 错峰出生
      lifespan: Math.max(0.5, lifespan),
      startSize: cfg.startSize,
      peakSize: cfg.peakSize,
      endSize: cfg.endSize,
      startColor: cfg.startColor,
      endColor: cfg.endColor,
    }
  }

  /** 每帧更新粒子 pool：发射新粒子 + 更新存活粒子 */
  update(dt: number, time: number, audioLow: number, audioMid: number, audioHigh: number): void {
    const cfg = this.config
    const rng = this.rng

    // 1. 发射新粒子（填满到 maxParticles）
    this.spawnAccum += dt * cfg.spawnRate
    const toSpawn = Math.min(
      Math.floor(this.spawnAccum),
      cfg.maxParticles - this.particles.length,
    )
    this.spawnAccum -= toSpawn
    for (let i = 0; i < toSpawn; i++) {
      this.particles.push(this.spawnParticle())
    }

    // 2. 更新存活粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.age += dt

      // 死亡 → 重生（保持 pool 满）
      if (p.age >= p.lifespan) {
        // 从头重生
        const [sx, sy, sz] = this.samplePosition()
        const ang = rng() * Math.PI * 2
        const spread = rng() * cfg.spreadAngle
        const speed = cfg.baseSpeed + (rng() - 0.5) * cfg.speedSpread
        p.x = sx; p.y = sy; p.z = sz
        p.vx = Math.sin(spread) * Math.cos(ang) * speed
        p.vz = Math.sin(spread) * Math.sin(ang) * speed
        p.vy = Math.cos(spread) * speed
        p.r = cfg.startColor[0]; p.g = cfg.startColor[1]; p.b = cfg.startColor[2]
        p.a = cfg.startAlpha
        p.size = cfg.startSize
        p.age = 0
        p.lifespan = cfg.lifespan + (rng() - 0.5) * cfg.lifespanSpread
        p.phase = rng() * Math.PI * 2
        p.startSize = cfg.startSize
        p.peakSize = cfg.peakSize
        p.endSize = cfg.endSize
        p.startColor = cfg.startColor
        p.endColor = cfg.endColor
        continue
      }

      // 存活 → 更新位置/颜色/大小
      const lifeRatio = p.age / p.lifespan  // 0~1

      // 速度（受重力影响）
      p.vy += cfg.gravity * dt

      // 湍流（Perlin 噪声扰动）
      if (cfg.turbulenceAmp > 0) {
        const nx = perlin2(p.x * cfg.turbulenceFreq + time * 0.3, p.y * cfg.turbulenceFreq + p.phase)
        const nz = perlin2(p.y * cfg.turbulenceFreq + time * 0.3, p.z * cfg.turbulenceFreq + p.phase + 10)
        p.vx += nx * cfg.turbulenceAmp * dt
        p.vz += nz * cfg.turbulenceAmp * dt
      }

      // 位置
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt

      // 尺寸：起始→峰值→临终
      if (lifeRatio < cfg.peakAgeRatio) {
        // 上升阶段：start → peak
        const t = lifeRatio / cfg.peakAgeRatio
        p.size = p.startSize + (p.peakSize - p.startSize) * t
      } else {
        // 衰减阶段：peak → end
        const t = (lifeRatio - cfg.peakAgeRatio) / (1 - cfg.peakAgeRatio)
        p.size = p.peakSize + (p.endSize - p.peakSize) * t
      }

      // 颜色：start (0%) → mid (50%) → end (100%)
      if (lifeRatio < 0.5) {
        const t = lifeRatio * 2
        const mc = cfg.midColor
        p.r = p.startColor[0] + (mc[0] - p.startColor[0]) * t
        p.g = p.startColor[1] + (mc[1] - p.startColor[1]) * t
        p.b = p.startColor[2] + (mc[2] - p.startColor[2]) * t
      } else {
        const t = (lifeRatio - 0.5) * 2
        p.r = cfg.midColor[0] + (p.endColor[0] - cfg.midColor[0]) * t
        p.g = cfg.midColor[1] + (p.endColor[1] - cfg.midColor[1]) * t
        p.b = cfg.midColor[2] + (p.endColor[2] - cfg.midColor[2]) * t
      }

      // Alpha：start → mid → end
      if (lifeRatio < 0.3) {
        p.a = cfg.startAlpha + (cfg.midAlpha - cfg.startAlpha) * (lifeRatio / 0.3)
      } else if (lifeRatio < 0.7) {
        p.a = cfg.midAlpha
      } else {
        p.a = cfg.midAlpha + (cfg.endAlpha - cfg.midAlpha) * ((lifeRatio - 0.7) / 0.3)
      }

      // 音频调制
      if (audioLow > 0) {
        p.vy += audioLow * 0.5 * dt
        p.a = Math.min(1, p.a + audioLow * 0.05)
      }
    }
  }

  /** 获取该发射器所有粒子的 map（供引擎写入 Three.js buffer） */
  getLayerMap(): Map<string, ParticleData[]> {
    const map = new Map<string, ParticleData[]>()
    map.set(this.config.layerId, this.particles)
    return map
  }

  dispose(): void {
    this.particles.length = 0
  }
}
