/**
 * 篝火场景发射器配置
 * 三个独立发射源 + 木柴生成
 */
import type { ParticleData } from '@/types/particle'
import { Emitter, perlin2 } from '@/services/particleSystem'
import type { EmitterConfig } from '@/types/particle'

// ============================================================
//  火焰主发射器（锥形）
// ============================================================

const FLAME_CONFIG: EmitterConfig = {
  layerId: 'flame',
  maxParticles: 800,
  spawnRate: 200,
  shape: 'cone',
  coneBottomRadius: 1.2,
  coneTopRadius: 0.3,
  coneHeight: 3.0,
  boxSize: [0, 0, 0],
  sphereRadius: 0,
  baseSpeed: 1.2,
  speedSpread: 0.6,
  spreadAngle: 0.3,
  turbulenceAmp: 0.4,
  turbulenceFreq: 0.4,
  gravity: -0.3, // 轻微减速

  lifespan: 2.5,
  lifespanSpread: 1.0,

  startSize: 0.5,
  peakSize: 3.0,
  peakAgeRatio: 0.4,
  endSize: 1.0,

  // 淡蓝白 → 暖金黄 → 橙红
  startColor: [200, 220, 255],
  midColor: [255, 200, 80],
  endColor: [200, 80, 30],

  startAlpha: 0.35,
  midAlpha: 0.55,
  endAlpha: 0.10,
}

// ============================================================
//  火星发射器（点发射）
// ============================================================

const SPARK_CONFIG: EmitterConfig = {
  layerId: 'spark',
  maxParticles: 30,
  spawnRate: 5,
  shape: 'point',
  coneBottomRadius: 0,
  coneTopRadius: 0,
  coneHeight: 0,
  boxSize: [0, 0, 0],
  sphereRadius: 0,
  baseSpeed: 0.5,
  speedSpread: 0.3,
  spreadAngle: 0.4,
  turbulenceAmp: 0.1,
  turbulenceFreq: 0.2,
  gravity: -0.1, // 几乎匀速上浮

  lifespan: 5.0,
  lifespanSpread: 2.0,

  startSize: 0.3,
  peakSize: 1.2,
  peakAgeRatio: 0.3,
  endSize: 0.1,

  startColor: [255, 230, 150],
  midColor: [255, 200, 100],
  endColor: [200, 120, 40],

  startAlpha: 0.6,
  midAlpha: 0.5,
  endAlpha: 0,
}

// ============================================================
//  环境尘埃发射器（盒形，极淡）
// ============================================================

const DUST_CONFIG: EmitterConfig = {
  layerId: 'dust',
  maxParticles: 300,
  spawnRate: 30,
  shape: 'box',
  coneBottomRadius: 0,
  coneTopRadius: 0,
  coneHeight: 0,
  boxSize: [8, 5, 6],
  sphereRadius: 0,
  baseSpeed: 0.08,
  speedSpread: 0.05,
  spreadAngle: 0,
  turbulenceAmp: 0.05,
  turbulenceFreq: 0.1,
  gravity: 0, // 悬浮

  lifespan: 30,
  lifespanSpread: 10,

  startSize: 0.4,
  peakSize: 0.8,
  peakAgeRatio: 0.5,
  endSize: 0.3,

  startColor: [255, 180, 100],
  midColor: [255, 160, 80],
  endColor: [200, 120, 60],

  startAlpha: 0.02,
  midAlpha: 0.04,
  endAlpha: 0.01,
}

// ============================================================
//  生成所有篝火发射器
// ============================================================

export function createCampfireEmitters(seed: number = 42): Emitter[] {
  const flame = new Emitter(FLAME_CONFIG, seed)
  const spark = new Emitter(SPARK_CONFIG, seed + 100)
  const dust = new Emitter(DUST_CONFIG, seed + 200)

  flame.init()
  spark.init()
  dust.init()

  return [flame, spark, dust]
}

// ============================================================
//  木柴层（静态粒子，非发射器）
// ============================================================

export function generateLogs(rngSeed: number = 42): ParticleData[] {
  const s = (seed: number) => {
    let ss = seed
    return () => {
      ss = (ss * 1664525 + 1013904223) & 0x7fffffff
      return ss / 0x7fffffff
    }
  }
  const rng = s(rngSeed + 300)

  const logs: ParticleData[] = []
  const logPositions = [
    { cx: -0.5, cy: -1.8, cz: 0.2, len: 3.0, thick: 0.6 },
    { cx: 0.6, cy: -1.5, cz: -0.3, len: 2.5, thick: 0.5 },
    { cx: -0.1, cy: -1.2, cz: 0.5, len: 2.8, thick: 0.4 },
  ]

  for (const lp of logPositions) {
    const count = 500
    for (let i = 0; i < count; i++) {
      const along = (rng() - 0.5) * lp.len
      const x = lp.cx + along
      const y = lp.cy + (rng() - 0.5) * lp.thick
      const z = lp.cz + (rng() - 0.5) * lp.thick * 0.5

      let r: number, g: number, b: number
      const isFireSide = rng() < 0.25
      if (isFireSide) {
        const bb = 0.5 + rng() * 0.3
        r = 200 * bb; g = 100 * bb; b = 40 * bb
      } else {
        const d = 0.3 + rng() * 0.3
        r = 80 * d; g = 40 * d; b = 20 * d
      }

      logs.push({
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        r, g, b,
        a: 0.85 + rng() * 0.15,
        size: 3 + rng() * 5,
        layerId: 'log',
        phase: rng() * Math.PI * 2,
        age: 0,
        lifespan: 9999,
        startSize: 0, peakSize: 0, endSize: 0,
        startColor: [r, g, b],
        endColor: [r, g, b],
      })
    }
  }
  return logs
}
