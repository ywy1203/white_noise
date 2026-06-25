/**
 * 篝火场景 · 粒子系统 v4
 * 火焰曲面排布模式：粒子沿火焰轮廓函数密集排列，形成连贯火体
 * 而非随机散射的离散光点
 */
import type { ParticleData } from '@/types/particle'
import { perlin2 } from '@/services/particleSystem'

// ============================================================
//  火焰轮廓函数 —— 定义火舌外形
// ============================================================
// 类高斯外形：底部宽、中间微收、顶部尖
function flameProfile(t: number): number {
  // t: 0=底部 1=火焰最高点
  const bell = Math.exp(-t * t * 2.5)  // 底部=1, 顶部≈0
  const tip = Math.max(0, 1 - t * 2.0)   // 上半部收尖
  return t < 0.6 ? bell : tip * bell
}

// ============================================================
//  生成火焰粒子（密集曲面排布）
// ============================================================
function createFlameParticles(
  count: number,
  flameHeight: number,
  baseRadius: number,
  seed: number,
): ParticleData[] {
  let s = seed
  const rng = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }

  const particles: ParticleData[] = []

  for (let i = 0; i < count; i++) {
    // 沿高度分布：偏底部（对数分布）
    const t = Math.pow(rng(), 0.45)
    const y = t * flameHeight
    const maxR = flameProfile(t) * baseRadius

    // 在圆截面内：高斯分布（中心密、边缘疏）
    const gaussR = Math.sqrt(-2 * Math.log(Math.max(0.01, rng()))) * 0.5  // 高斯 falloff
    const radius = Math.min(maxR, gaussR * maxR)
    const angle = rng() * Math.PI * 2

    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // 微小位置抖动（0.02 单位）
    const jitter = 0.02
    const px = x + (rng() - 0.5) * jitter
    const py = y + (rng() - 0.5) * jitter
    const pz = z + (rng() - 0.5) * jitter

    // 每帧的运动：垂直上升 + 水平渐扩
    const riseSpeed = 1.0 + rng() * 0.8
    const spread = radius / (flameHeight * 0.5 + 1)

    // 颜色：底部暖亮 → 顶部橙红
    const hue = 0.12 + t * 0.07           // 黄→橙
    const sat = 1.0
    const val = 1.0 - t * 0.5             // 亮→暗
    const [r, g, b] = hsvToRgb(hue, sat, val)

    // Alpha: 密度分布 中心亮 边缘淡
    const alpha = 0.55 + (1 - gaussR) * 0.35

    particles.push({
      x: px, y: py, z: pz,
      vx: spread * riseSpeed * (rng() - 0.5) * 0.1,
      vy: riseSpeed,
      vz: spread * riseSpeed * (rng() - 0.5) * 0.1,
      r, g, b,
      a: alpha,
      size: 2.5 + rng() * 4,
      layerId: 'flame',
      phase: rng() * Math.PI * 2,
      age: rng() * 2.5,       // 错峰出生
      lifespan: 1.5 + rng() * 1.0,
      startSize: 1.5, peakSize: 4.0, endSize: 1.0,
      startColor: [r, g, b],
      endColor: [r, g, b],
    })
  }
  return particles
}

// ============================================================
//  生成火星（从火焰顶部区域出发）
// ============================================================
function createSparkParticles(
  count: number,
  flameHeight: number,
  baseRadius: number,
  seed: number,
): ParticleData[] {
  let s = seed
  const rng = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }

  const particles: ParticleData[] = []
  for (let i = 0; i < count; i++) {
    const t = 0.7 + rng() * 0.3           // 从火焰中上段出发
    const startY = t * flameHeight
    const maxR = flameProfile(t) * baseRadius * 0.8
    const angle = rng() * Math.PI * 2
    const radius = Math.sqrt(rng()) * maxR

    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    const [r, g, b] = [255, 220 + rng() * 35, 100 + rng() * 80]

    particles.push({
      x, y: startY, z,
      vx: (rng() - 0.5) * 0.3,
      vy: 0.3 + rng() * 0.5,
      vz: (rng() - 0.5) * 0.3,
      r, g, b,
      a: 0.7,
      size: 0.5 + rng() * 1.0,
      layerId: 'spark',
      phase: rng() * Math.PI * 2,
      age: rng() * 4.0,
      lifespan: 3.0 + rng() * 2.0,
      startSize: 0.3, peakSize: 1.0, endSize: 0.1,
      startColor: [r, g, b],
      endColor: [r, g, b],
    })
  }
  return particles
}

// ============================================================
//  主创建函数：不再使用 Emitter 类
//  而是直接生成火焰曲面粒子 + 火星 + 木柴
//  每帧在引擎中通过 TurbulenceField 更新
// ============================================================

export interface CampfireLayers {
  flame: ParticleData[]
  spark: ParticleData[]
  dust: ParticleData[]
  log: ParticleData[]
}

export function createCampfireParticles(isMobile: boolean = false): CampfireLayers {
  const m = isMobile ? 0.4 : 1
  const flameCount = Math.round(10000 * m)
  const sparkCount = Math.round(60 * m)
  const dustCount = Math.round(300 * m)

  const flameHeight = 3.5
  const baseRadius = 1.0

  return {
    flame: createFlameParticles(flameCount, flameHeight, baseRadius, 42),
    spark: createSparkParticles(sparkCount, flameHeight, baseRadius, 420),
    dust: [],
    log: [],
  }
}

// ============================================================
//  木柴生成（作为静态层，不随粒子更新循环）
// ============================================================
export function generateLogs(isMobile: boolean = false, rngSeed: number = 42): ParticleData[] {
  const rng = (() => {
    let s = rngSeed + 500
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
  })()

  const logs: ParticleData[] = []
  const perLog = isMobile ? 1000 : 1800
  const logPositions = [
    { cx: -0.5, cy: -1.6, cz: 0.2, len: 2.8, thick: 0.5 },
    { cx: 0.6, cy: -1.3, cz: -0.2, len: 2.2, thick: 0.4 },
    { cx: -0.1, cy: -1.0, cz: 0.4, len: 2.5, thick: 0.35 },
  ]

  for (const lp of logPositions) {
    for (let i = 0; i < perLog; i++) {
      const along = (rng() - 0.5) * lp.len
      const ang = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * lp.thick * 0.5
      const x = lp.cx + along
      const y = lp.cy + Math.cos(ang) * r
      const z = lp.cz + Math.sin(ang) * r

      let rc: number, gc: number, bc: number
      const isFireSide = rng() < 0.2
      if (isFireSide) {
        const bb = 0.4 + rng() * 0.3
        rc = 200 * bb; gc = 100 * bb; bc = 40 * bb
      } else {
        const d = 0.2 + rng() * 0.25
        rc = 70 * d; gc = 35 * d; bc = 15 * d
      }

      logs.push({
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        r: rc, g: gc, b: bc,
        a: 0.9 + rng() * 0.1,
        size: 2 + rng() * 4,
        layerId: 'log',
        phase: rng() * Math.PI * 2,
        age: 0, lifespan: 9999,
        startSize: 0, peakSize: 0, endSize: 0,
        startColor: [rc, gc, bc],
        endColor: [rc, gc, bc],
      })
    }
  }
  return logs
}

// ============================================================
//  工具：HSV → RGB
// ============================================================
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r: number, g: number, b: number
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    default: r = v; g = p; b = q; break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// ============================================================
//  火焰更新函数：每帧调用，处理火焰粒子运动
//  （替代原来的 Emitter.update）
// ============================================================
export function updateFlameParticles(
  particles: ParticleData[],
  dt: number,
  time: number,
): void {
  const flameHeight = 3.5
  const baseRadius = 1.0

  for (const p of particles) {
    p.age += dt

    // 寿命到，重生
    if (p.age >= p.lifespan) {
      p.age -= p.lifespan
      const t = Math.random()
      const y = t * flameHeight * 0.3                   // 只在底部 30% 重生
      const maxR = flameProfile(t * 0.3) * baseRadius
      const radius = Math.sqrt(Math.random()) * maxR
      const angle = Math.random() * Math.PI * 2
      p.x = Math.cos(angle) * radius
      p.y = y
      p.z = Math.sin(angle) * radius
      p.vy = 1.0 + Math.random() * 0.8
      p.a = 0.55 + Math.random() * 0.35
      p.lifespan = 1.5 + Math.random() * 1.0
    }

    const t = p.y / flameHeight
    const maxR = flameProfile(t) * baseRadius

    // 升起
    p.y += p.vy * dt

    // 高度超过上限 → 重生
    if (p.y > flameHeight * 1.1) {
      p.y = 0
      const radius = Math.sqrt(Math.random()) * flameProfile(0) * baseRadius * 0.3
      const angle = Math.random() * Math.PI * 2
      p.x = Math.cos(angle) * radius
      p.z = Math.sin(angle) * radius
      p.vy = 1.0 + Math.random() * 0.8
      p.lifespan = 1.5 + Math.random() * 1.0
    }

    // 微小向外扩张
    if (Math.abs(p.x) > 0.01) p.x *= (1 + 0.01 * dt)
    if (Math.abs(p.z) > 0.01) p.z *= (1 + 0.01 * dt)

    // Perlin 噪声湍流（空间相关，保证邻近粒子行为一致）
    const nx = perlin2(p.x * 0.3 + time * 0.4, p.y * 0.2 + p.phase)
    const nz = perlin2(p.z * 0.3 + time * 0.4, p.y * 0.2 + p.phase + 5)
    p.x += nx * 0.3 * dt
    p.z += nz * 0.3 * dt

    // 保持在火焰轮廓内（拉回）
    const dist = Math.sqrt(p.x * p.x + p.z * p.z)
    if (dist > maxR * 1.3 && dist > 0.01) {
      const clamp = maxR * 1.2
      const scale = clamp / dist
      p.x *= scale
      p.z *= scale
    }

    // Alpha 沿寿命衰减
    const lifeRatio = p.age / p.lifespan
    if (lifeRatio < 0.2) p.a = 0.2 + lifeRatio * 3.0 * 0.55
    else if (lifeRatio < 0.7) p.a = 0.55 + Math.random() * 0.05
    else p.a = 0.55 * (1 - (lifeRatio - 0.7) / 0.3) * 0.8
  }
}

export function updateSparkParticles(
  particles: ParticleData[],
  dt: number,
  time: number,
): void {
  for (const p of particles) {
    p.age += dt
    if (p.age >= p.lifespan) {
      p.age -= p.lifespan
      p.y = 2.5 + Math.random()                    // 火焰顶部重生
      p.x = (Math.random() - 0.5) * 0.4
      p.z = (Math.random() - 0.5) * 0.4
      p.vy = 0.3 + Math.random() * 0.5
      p.a = 0.7
    }
    p.y += p.vy * dt
    p.x += (Math.random() - 0.5) * 0.1 * dt
    p.z += (Math.random() - 0.5) * 0.1 * dt
    p.vy -= 0.05 * dt    // 轻微减速

    const lifeRatio = p.age / p.lifespan
    if (lifeRatio > 0.5) p.a = 0.7 * (1 - (lifeRatio - 0.5) / 0.5)
  }
}
