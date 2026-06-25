/** 粒子层配置 */
export interface ParticleLayerDef {
  /** 层标识 */
  id: string
  /** 粒子数（占该场景总数的比例 0-1） */
  ratio: number
  /** 分布策略 */
  strategy: 'image_sample' | 'procedural' | 'edge'
  /** 色相范围（HSV） */
  hueRange?: [number, number]
  /** 亮度范围 0-1 */
  brightnessRange?: [number, number]
  /** 粒子尺寸范围 [min, max] */
  sizeRange: [number, number]
  /** 初始透明度 0-1 */
  opacity: number
  /** Z 轴基准偏移 */
  zBase: number
  /** Z 轴浮动幅度 */
  zAmplitude: number
  /** 基础行为 */
  behavior: ParticleBehavior
}

export interface ParticleBehavior {
  /** 运动类型 */
  type: 'static' | 'float' | 'flicker' | 'rise' | 'drift' | 'orbit' | 'sway'
  /** 运动速度 0-1 */
  speed: number
  /** 运动幅度 */
  amplitude: number
  /** 音频绑定参数名（对应 audioBindings 中的 key） */
  audioParam?: string
  /** 音频影响系数 */
  audioInfluence?: number
}

/** 音频律动绑定 */
export interface AudioBinding {
  lowFreq: string     // 低频控制的目标参数名
  midFreq: string
  highFreq: string
}

/** 交互配置 */
export interface InteractionDef {
  touch: 'ripple' | 'attract' | 'repel' | 'swipe' | 'wipe' | 'none'
  click: 'burst' | 'flash' | 'none'
  longPress: 'amplify' | 'gather' | 'scatter' | 'none'
}

/** 随机事件定义 */
export interface RandomEventDef {
  name: string
  /** 触发间隔范围（秒） */
  intervalRange: [number, number]
  /** 持续时长（秒） */
  duration: number
  /** 效果参数（引擎内部读取） */
  params: Record<string, number>
}

/** 完整粒子场景配置 */
export interface ParticleSceneConfig {
  id: string
  icon: string
  name: string
  /** 参考图片路径 */
  refImage: string
  /** 场景主色调 */
  tone: string
  /** 粒子总数 */
  particleCount: number
  /** 移动端降级粒子倍数（0-1） */
  mobileRatio: number
  /** 环境光色 */
  ambientLight: string
  /** 粒子层 */
  layers: ParticleLayerDef[]
  /** 音频绑定 */
  audioBindings: AudioBinding
  /** 交互配置 */
  interaction: InteractionDef
  /** 时间效果开关 */
  timeEffects: {
    pomodoro: boolean
    dayNight: boolean
    accumulation: boolean
    randomEvents: boolean
  }
  /** 随机事件定义 */
  randomEventDefs?: RandomEventDef[]
}

/** 运行时粒子实例数据 */
export interface ParticleData {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  r: number
  g: number
  b: number
  a: number
  size: number
  /** 所属层 id */
  layerId: string
  /** 相位偏移 */
  phase: number
  /** 年龄（秒），到期后重生 */
  age: number
  /** 总寿命（秒） */
  lifespan: number
  /** 出生时尺寸 */
  startSize: number
  /** 生命周期中最大尺寸 */
  peakSize: number
  /** 临终尺寸 */
  endSize: number
  /** 出生颜色 [r,g,b] 0-255 */
  startColor: [number, number, number]
  /** 临终颜色 [r,g,b] 0-255 */
  endColor: [number, number, number]
}

/** 音频频谱数据 */
export interface SpectrumData {
  low: number    // 0-1
  mid: number    // 0-1
  high: number   // 0-1
}

/** 时间效果运行时状态 */
export interface TimeEffectState {
  /** 番茄钟状态 0=专注 1=休息 */
  pomodoroState: number
  /** 昼夜系数 0=夜 → 1=昼 */
  dayNightFactor: number
  /** 累积系数 1.0 → 1.5 */
  accumulationFactor: number
  /** 随机事件进行中 */
  randomEventActive: boolean
  randomEventTimer: number
}

/** 发射器配置 */
export interface EmitterConfig {
  layerId: string
  maxParticles: number
  spawnRate: number           // 每秒发射数
  shape: 'cone' | 'point' | 'box' | 'sphere'
  // 锥形参数
  coneBottomRadius: number
  coneTopRadius: number
  coneHeight: number
  boxSize: [number, number, number]
  sphereRadius: number

  // 运动
  baseSpeed: number
  speedSpread: number         // 速度随机散布 ±
  spreadAngle: number         // 锥形散布角
  turbulenceAmp: number       // 湍流幅度
  turbulenceFreq: number      // 湍流频率
  gravity: number             // 重力 (向上为正)

  // 生命周期
  lifespan: number
  lifespanSpread: number

  // 尺寸: 出生→峰值(在寿命比例)→临终
  startSize: number
  peakSize: number
  peakAgeRatio: number        // 峰值出现时寿命占比 0-1
  endSize: number

  // 颜色
  startColor: [number, number, number]
  midColor: [number, number, number]    // 50% 寿命时
  endColor: [number, number, number]
  startAlpha: number
  midAlpha: number
  endAlpha: number
}
