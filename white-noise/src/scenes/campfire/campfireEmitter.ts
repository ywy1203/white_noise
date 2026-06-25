/**
 * 篝火粒子系统 v5 · 精确排布模式
 * 330 粒稀疏克制 → 靠分层结构形成清晰火舌轮廓
 * 底部密、上部疏，下宽上窄自然收束，无中间收腰
 */

import type { ParticleData } from '@/types/particle'
import { perlin2 } from '@/services/particleSystem'

// ============================================================
//  火焰轮廓：线性渐变收束，底部宽→顶部窄，无中间收腰
// ============================================================
function flameProfile(t: number): number {
  // t: 0=底部(木柴面) → 1=最高焰尖
  // 指数 0.65 保证底部宽厚、顶部自然收尖，全程无"葫芦形"
  return Math.pow(1 - t, 0.65)
}

// ============================================================
//  粒子数据生成
// ============================================================

export interface CampfireLayers {
  flame: ParticleData[]   // 焰心 + 主体 + 外焰 合并为一个数组
  spark: ParticleData[]
}

const FLAME_HEIGHT = 3.2
const BASE_RADIUS = 0.95

export function createCampfireParticles(_isMobile: boolean = false): CampfireLayers {
  let seed = 42
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff }

  const flame: ParticleData[] = []
  const spark: ParticleData[] = []

  // ========== 焰心锚定层（55 粒）= 底部中心密集 ==========
  putLayer(flame, rng, 55, {
    heightRange: [0, 0.45],
    radiusFraction: [0, 0.28],      // 木柴中部 1/3
    sizeRange: [0.13, 0.18],        // 峰值约 1.5-1.8px
    hueRange: [0.125, 0.14],        // 暖亮黄
    alphaRange: [0.7, 0.9],
    lifespanRange: [2.2, 2.8],      // 最长寿命
    speedRange: [0.6, 0.9],         // 最慢
  })

  // ========== 火焰主体层（180 粒）= 全覆盖，随高度渐疏 ==========
  putLayer(flame, rng, 180, {
    heightRange: [0, 1.0],
    radiusFraction: [0.05, 1.0],    // 全宽度
    sizeRange: [0.25, 0.44],        // 峰值约 3.0-3.5px
    hueRange: [0.10, 0.12],         // 暖金黄
    alphaRange: [0.55, 0.75],
    lifespanRange: [1.6, 2.2],
    speedRange: [0.8, 1.2],
  })

  // ========== 外焰柔边层（75 粒）= 对称贴边，稀疏 ==========
  putLayer(flame, rng, 75, {
    heightRange: [0, 1.0],
    radiusFraction: [0.5, 1.05],    // 偏边缘
    sizeRange: [0.35, 0.56],        // 峰值约 4.0-4.5px
    hueRange: [0.07, 0.10],         // 柔和橙红
    alphaRange: [0.3, 0.5],
    lifespanRange: [1.2, 1.6],      // 最短寿命
    speedRange: [1.0, 1.5],         // 最快
  })

  // ========== 零星火星层（18 粒）= 火焰顶部低频发射 ==========
  for (let i = 0; i < 18; i++) {
    const heightRatio = 0.75 + rng() * 0.25      // 顶部 1/4
    const startY = heightRatio * FLAME_HEIGHT
    const maxR = flameProfile(heightRatio) * BASE_RADIUS * 0.35
    const angle = rng() * Math.PI * 2
    const radius = Math.sqrt(rng()) * maxR

    const [r, g] = [255, 220 + rng() * 35]
    const b = 100 + rng() * 60

    spark.push({
      x: Math.cos(angle) * radius,
      y: startY,
      z: Math.sin(angle) * radius,
      vx: (rng() - 0.5) * 0.08,
      vy: 0.15 + rng() * 0.2,
      vz: (rng() - 0.5) * 0.08,
      r, g, b,
      a: 0.6 + rng() * 0.3,
      size: 0.06 + rng() * 0.03,
      layerId: 'spark',
      phase: rng() * Math.PI * 2,
      age: rng() * 3.0,
      lifespan: 2.5 + rng() * 0.5,
      startSize: 0, peakSize: 0, endSize: 0,
      startColor: [r, g, b],
      endColor: [r, g, b],
    })
  }

  return { flame, spark }
}

// ============================================================
//  分层粒子生成辅助函数
// ============================================================
interface LayerParams {
  heightRange: [number, number]      // 沿火焰高度分布范围
  radiusFraction: [number, number]   // 在轮廓内的径向比例 [0..1]
  sizeRange: [number, number]
  hueRange: [number, number]
  alphaRange: [number, number]
  lifespanRange: [number, number]
  speedRange: [number, number]
}

function putLayer(
  out: ParticleData[],
  rng: () => number,
  count: number,
  p: LayerParams,
): void {
  for (let i = 0; i < count; i++) {
    // 高度：偏底部（用幂分布让底部粒子更多）
    const tRaw = Math.pow(rng(), 0.55)
    const t = p.heightRange[0] + tRaw * (p.heightRange[1] - p.heightRange[0])
    const y = t * FLAME_HEIGHT

    // 径向：在火焰轮廓内
    const maxR = flameProfile(t) * BASE_RADIUS
    const rf = p.radiusFraction[0] + rng() * (p.radiusFraction[1] - p.radiusFraction[0])
    const radius = rf * maxR
    const angle = rng() * Math.PI * 2

    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // 颜色（HSV → RGB）
    const hue = p.hueRange[0] + rng() * (p.hueRange[1] - p.hueRange[0])
    const sat = 1.0
    const val = 0.95 + rng() * 0.05
    const [r, g, b] = hsvToRgb(hue, sat, val)

    // 尺寸
    const size = p.sizeRange[0] + rng() * (p.sizeRange[1] - p.sizeRange[0])

    // 透明度
    const alpha = p.alphaRange[0] + rng() * (p.alphaRange[1] - p.alphaRange[0])

    // 寿命
    const lifespan = p.lifespanRange[0] + rng() * (p.lifespanRange[1] - p.lifespanRange[0])

    // 初始垂直速度
    const baseSpeed = p.speedRange[0] + rng() * (p.speedRange[1] - p.speedRange[0])

    out.push({
      x, y, z,
      vx: 0, vy: baseSpeed, vz: 0,
      r, g, b,
      a: alpha,
      size,      // gl_PointSize = size * (80/distance), 如 size=0.2 → ~1.6px
      layerId: 'flame',
      phase: rng() * Math.PI * 2,
      age: rng() * lifespan,   // 随机出生点（错峰）
      lifespan,
      startSize: size, peakSize: size, endSize: size,
      startColor: [r, g, b],
      endColor: [r, g, b],
    })
  }
}

// ============================================================
//  木柴生成（三段居中堆叠）
// ============================================================
export function generateLogs(_isMobile: boolean = false): ParticleData[] {
  const rng = (() => {
    let s = 542
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
  })()

  const logs: ParticleData[] = []
  const logPositions = [
    { cx: -0.5, cy: -1.6, cz: 0.2, len: 2.5, thick: 0.45 },
    { cx: 0.6, cy: -1.35, cz: -0.2, len: 2.0, thick: 0.35 },
    { cx: -0.1, cy: -1.1, cz: 0.4, len: 2.2, thick: 0.3 },
  ]

  for (const lp of logPositions) {
    for (let i = 0; i < 500; i++) {
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
        a: 0.85 + rng() * 0.15,
        size: 1.5 + rng() * 3,
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
//  HSV → RGB
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
//  每帧更新函数
// ============================================================

export function updateFlameParticles(
  particles: ParticleData[],
  dt: number,
  time: number,
): void {
  for (const p of particles) {
    p.age += dt

    // 寿命到 → 在底部重生
    if (p.age >= p.lifespan) {
      p.age -= p.lifespan
      p.y = 0
      const maxR = flameProfile(0) * BASE_RADIUS
      const radius = Math.sqrt(Math.random()) * maxR * 0.5
      const angle = Math.random() * Math.PI * 2
      p.x = Math.cos(angle) * radius
      p.z = Math.sin(angle) * radius
      p.vy = 0.8 + Math.random() * 0.6
      p.lifespan = p.lifespan  // keep original lifespan
    }

    const t = p.y / FLAME_HEIGHT
    const profileRadius = flameProfile(Math.max(0, Math.min(1, t))) * BASE_RADIUS

    // 上升：速度随高度衰减（easeOutQuad）
    const speedDecay = 1 - t * t
    p.y += p.vy * speedDecay * dt

    // 微小横向扩张
    const dist = Math.sqrt(p.x * p.x + p.z * p.z)
    if (dist > 0.001 && dist < profileRadius * 1.2) {
      const expand = 0.02 * dt
      p.x *= (1 + expand)
      p.z *= (1 + expand)
    }

    // Perlin 扰动（空间相关，邻近粒子行为一致）
    const nx = perlin2(p.x * 0.6 + time * 0.3, p.y * 0.4 + p.phase)
    const nz = perlin2(p.z * 0.6 + time * 0.3, p.y * 0.4 + p.phase + 5)
    // 扰动幅度随高度递增：底部≤0.3px等效，顶部≤2px等效
    const perturbScale = 0.005 + t * t * 0.06
    p.x += nx * perturbScale * dt
    p.z += nz * perturbScale * dt

    // 约束在轮廓内（加10%余量）
    const d = Math.sqrt(p.x * p.x + p.z * p.z)
    if (d > profileRadius * 1.15 && d > 0.001) {
      const clamp = profileRadius * 1.1
      p.x *= clamp / d
      p.z *= clamp / d
    }

    // 超出高度上限 → 底部重生
    if (p.y > FLAME_HEIGHT * 1.05) {
      p.y = 0
      const radius = Math.sqrt(Math.random()) * BASE_RADIUS * 0.2
      const angle = Math.random() * Math.PI * 2
      p.x = Math.cos(angle) * radius
      p.z = Math.sin(angle) * radius
      p.vy = 0.8 + Math.random() * 0.6
    }
  }
}

export function updateSparkParticles(
  particles: ParticleData[],
  dt: number,
  _time: number,
): void {
  for (const p of particles) {
    p.age += dt
    if (p.age >= p.lifespan) {
      p.age = 0
      p.y = FLAME_HEIGHT * (0.75 + Math.random() * 0.2)
      const maxR = flameProfile(p.y / FLAME_HEIGHT) * BASE_RADIUS * 0.3
      p.x = (Math.random() - 0.5) * maxR * 2
      p.z = (Math.random() - 0.5) * maxR * 2
      p.vy = 0.12 + Math.random() * 0.25
      p.a = 0.6 + Math.random() * 0.3
    }
    p.y += p.vy * dt
    p.x += (Math.random() - 0.5) * 0.02 * dt
    p.z += (Math.random() - 0.5) * 0.02 * dt
    p.vy -= 0.02 * dt  // 轻微减速

    const lifeRatio = p.age / p.lifespan
    if (lifeRatio > 0.5) {
      p.a = (0.6 + Math.random() * 0.3) * (1 - (lifeRatio - 0.5) / 0.5)
    }
  }
}
