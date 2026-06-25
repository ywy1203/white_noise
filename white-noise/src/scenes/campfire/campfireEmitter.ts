/**
 * 篝火场景发射器配置 v3
 * 三层粒子分级 + 高密度 + isMobile 降级
 */
import type { ParticleData, EmitterConfig } from '@/types/particle'
import { Emitter } from '@/services/particleSystem'

// ============================================================
//  核心层（焰心）：暖亮黄，小尺寸，慢速
// ============================================================
function coreConfig(isMobile: boolean): EmitterConfig {
  const n = isMobile ? 0.5 : 1
  return {
    layerId: 'flame',
    maxParticles: Math.round(800 * n),
    spawnRate: Math.round(300 * n),
    shape: 'cone',
    coneBottomRadius: 0.1, coneTopRadius: 0.05, coneHeight: 0.1,
    boxSize: [0, 0, 0], sphereRadius: 0,
    baseSpeed: 0.8, speedSpread: 0.3,
    spreadAngle: 0.1, turbulenceAmp: 0.15, turbulenceFreq: 0.3, gravity: -0.2,
    lifespan: 1.5, lifespanSpread: 0.5,
    startSize: 0.5, peakSize: 1.5, peakAgeRatio: 0.3, endSize: 0.5,
    startColor: [255, 235, 180], midColor: [255, 220, 120], endColor: [255, 180, 80],
    startAlpha: 0.8, midAlpha: 0.9, endAlpha: 0.3,
  }
}

// ============================================================
//  主体层（火焰主体）：暖金黄，中尺寸
// ============================================================
function bodyConfig(isMobile: boolean): EmitterConfig {
  const n = isMobile ? 0.5 : 1
  return {
    layerId: 'flame',
    maxParticles: Math.round(3500 * n),
    spawnRate: Math.round(800 * n),
    shape: 'cone',
    coneBottomRadius: 0.2, coneTopRadius: 0.05, coneHeight: 0.15,
    boxSize: [0, 0, 0], sphereRadius: 0,
    baseSpeed: 1.2, speedSpread: 0.4,
    spreadAngle: 0.15, turbulenceAmp: 0.3, turbulenceFreq: 0.35, gravity: -0.15,
    lifespan: 2.0, lifespanSpread: 0.6,
    startSize: 1.0, peakSize: 3.0, peakAgeRatio: 0.4, endSize: 1.0,
    startColor: [255, 210, 100], midColor: [255, 180, 60], endColor: [220, 120, 40],
    startAlpha: 0.6, midAlpha: 0.7, endAlpha: 0.15,
  }
}

// ============================================================
//  外层（外焰）：橙红半透明，大尺寸，快速
// ============================================================
function outerConfig(isMobile: boolean): EmitterConfig {
  const n = isMobile ? 0.5 : 1
  return {
    layerId: 'flame',
    maxParticles: Math.round(800 * n),
    spawnRate: Math.round(300 * n),
    shape: 'cone',
    coneBottomRadius: 0.25, coneTopRadius: 0.08, coneHeight: 0.2,
    boxSize: [0, 0, 0], sphereRadius: 0,
    baseSpeed: 1.8, speedSpread: 0.5,
    spreadAngle: 0.25, turbulenceAmp: 0.4, turbulenceFreq: 0.3, gravity: -0.1,
    lifespan: 2.5, lifespanSpread: 0.8,
    startSize: 2.0, peakSize: 5.0, peakAgeRatio: 0.5, endSize: 2.0,
    startColor: [255, 140, 50], midColor: [230, 100, 40], endColor: [180, 60, 20],
    startAlpha: 0.25, midAlpha: 0.35, endAlpha: 0.05,
  }
}

// ============================================================
//  火星（从火焰顶部缓慢飘出）
// ============================================================
function sparkConfig(isMobile: boolean): EmitterConfig {
  const n = isMobile ? 0.6 : 1
  return {
    layerId: 'spark',
    maxParticles: Math.round(80 * n),
    spawnRate: Math.round(12 * n),
    shape: 'cone',
    coneBottomRadius: 0.4, coneTopRadius: 0.2, coneHeight: 2.5,
    boxSize: [0, 0, 0], sphereRadius: 0,
    baseSpeed: 0.4, speedSpread: 0.2,
    spreadAngle: 0.2, turbulenceAmp: 0.1, turbulenceFreq: 0.2, gravity: -0.05,
    lifespan: 4.0, lifespanSpread: 1.5,
    startSize: 0.3, peakSize: 1.0, peakAgeRatio: 0.3, endSize: 0.1,
    startColor: [255, 230, 150], midColor: [255, 190, 90], endColor: [200, 120, 40],
    startAlpha: 0.6, midAlpha: 0.4, endAlpha: 0,
  }
}

// ============================================================
//  环境尘埃（极淡悬浮）
// ============================================================
function dustConfig(isMobile: boolean): EmitterConfig {
  const n = isMobile ? 0.5 : 1
  return {
    layerId: 'dust',
    maxParticles: Math.round(400 * n),
    spawnRate: Math.round(30 * n),
    shape: 'box',
    coneBottomRadius: 0, coneTopRadius: 0, coneHeight: 0,
    boxSize: [6, 4, 5], sphereRadius: 0,
    baseSpeed: 0.05, speedSpread: 0.03,
    spreadAngle: 0, turbulenceAmp: 0.03, turbulenceFreq: 0.08, gravity: 0,
    lifespan: 40, lifespanSpread: 15,
    startSize: 0.3, peakSize: 0.6, peakAgeRatio: 0.5, endSize: 0.2,
    startColor: [255, 180, 100], midColor: [255, 160, 80], endColor: [200, 120, 60],
    startAlpha: 0.015, midAlpha: 0.03, endAlpha: 0.005,
  }
}

// ============================================================
//  主创建函数
// ============================================================

export function createCampfireEmitters(isMobile: boolean = false, seed: number = 42): Emitter[] {
  const core = new Emitter(coreConfig(isMobile), seed)
  const body = new Emitter(bodyConfig(isMobile), seed + 100)
  const outer = new Emitter(outerConfig(isMobile), seed + 200)
  const spark = new Emitter(sparkConfig(isMobile), seed + 300)
  const dust = new Emitter(dustConfig(isMobile), seed + 400)

  core.init()
  body.init()
  outer.init()
  spark.init()
  dust.init()

  return [core, body, outer, spark, dust]
}

// ============================================================
//  木柴生成
// ============================================================

export function generateLogs(isMobile: boolean = false, rngSeed: number = 42): ParticleData[] {
  const rng = (() => {
    let s = rngSeed + 500
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
  })()

  const logs: ParticleData[] = []
  const logPositions = [
    { cx: -0.5, cy: -1.6, cz: 0.2, len: 2.8, thick: 0.5 },
    { cx: 0.6, cy: -1.3, cz: -0.2, len: 2.2, thick: 0.4 },
    { cx: -0.1, cy: -1.0, cz: 0.4, len: 2.5, thick: 0.35 },
  ]

  const perLog = isMobile ? 1200 : 2000
  for (const lp of logPositions) {
    for (let i = 0; i < perLog; i++) {
      const along = (rng() - 0.5) * lp.len
      const ang = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * lp.thick * 0.5
      const x = lp.cx + along
      const y = lp.cy + Math.cos(ang) * r
      const z = lp.cz + Math.sin(ang) * r

      let rC: number, gC: number, bC: number
      const isFireSide = rng() < 0.2
      if (isFireSide) {
        const bb = 0.4 + rng() * 0.3
        rC = 200 * bb; gC = 100 * bb; bC = 40 * bb
      } else {
        const d = 0.2 + rng() * 0.25
        rC = 70 * d; gC = 35 * d; bC = 15 * d
      }

      logs.push({
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        r: rC, g: gC, b: bC,
        a: 0.9 + rng() * 0.1,
        size: 2 + rng() * 4,
        layerId: 'log',
        phase: rng() * Math.PI * 2,
        age: 0, lifespan: 9999,
        startSize: 0, peakSize: 0, endSize: 0,
        startColor: [rC, gC, bC],
        endColor: [rC, gC, bC],
      })
    }
  }
  return logs
}
