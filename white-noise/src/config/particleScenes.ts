import type { ParticleSceneConfig } from '@/types/particle'

export const PARTICLE_SCENES: ParticleSceneConfig[] = [
  {
    id: 'campfire',
    icon: '🔥',
    name: '篝火 · 冬夜',
    refImage: '/images/ref-campfire.jpg',
    tone: '#ff8c42',
    particleCount: 20000,
    mobileRatio: 0.6,
    ambientLight: '#1a1a2e',
    layers: [
      // 1. 底层木柴堆
      { id: 'wood-bottom', ratio: 0.10, strategy: 'procedural', sizeRange: [6, 18], opacity: 1,
        zBase: -3, zAmplitude: 0.3, behavior: { type: 'static', speed: 0, amplitude: 0 },
        hueRange: [10, 30], brightnessRange: [0.1, 0.3] },
      // 2. 中层斜搭木柴
      { id: 'wood-mid', ratio: 0.08, strategy: 'procedural', sizeRange: [4, 12], opacity: 1,
        zBase: -1, zAmplitude: 0.5, behavior: { type: 'static', speed: 0, amplitude: 0 },
        hueRange: [15, 35], brightnessRange: [0.2, 0.4] },
      // 3. 表层枯枝
      { id: 'wood-top', ratio: 0.04, strategy: 'procedural', sizeRange: [2, 6], opacity: 0.9,
        zBase: 0, zAmplitude: 0.3, behavior: { type: 'static', speed: 0, amplitude: 0 },
        hueRange: [20, 40], brightnessRange: [0.3, 0.5] },
      // 4. 灰烬层
      { id: 'ash', ratio: 0.03, strategy: 'procedural', sizeRange: [1, 3], opacity: 0.4,
        zBase: -4, zAmplitude: 0.1, behavior: { type: 'drift', speed: 0.1, amplitude: 0.2 },
        hueRange: [0, 0], brightnessRange: [0.05, 0.15] },
      // 5. 内核高温白芯
      { id: 'flame-core', ratio: 0.05, strategy: 'procedural', sizeRange: [1, 3], opacity: 1,
        zBase: 0, zAmplitude: 2, behavior: { type: 'flicker', speed: 0.8, amplitude: 0.3,
          audioParam: 'lowFreq', audioInfluence: 0.6 },
        hueRange: [0, 30], brightnessRange: [0.8, 1.0] },
      // 6. 内层明火
      { id: 'flame-inner', ratio: 0.10, strategy: 'procedural', sizeRange: [3, 6], opacity: 0.9,
        zBase: 0, zAmplitude: 4, behavior: { type: 'flicker', speed: 0.6, amplitude: 0.5,
          audioParam: 'lowFreq', audioInfluence: 0.7 },
        hueRange: [20, 40], brightnessRange: [0.7, 0.9] },
      // 7. 中层焰体
      { id: 'flame-mid', ratio: 0.15, strategy: 'procedural', sizeRange: [4, 8], opacity: 0.7,
        zBase: -1, zAmplitude: 5, behavior: { type: 'flicker', speed: 0.5, amplitude: 0.6,
          audioParam: 'lowFreq', audioInfluence: 0.8 },
        hueRange: [10, 30], brightnessRange: [0.5, 0.8] },
      // 8. 外层光晕
      { id: 'flame-outer', ratio: 0.08, strategy: 'procedural', sizeRange: [6, 12], opacity: 0.3,
        zBase: -2, zAmplitude: 6, behavior: { type: 'flicker', speed: 0.3, amplitude: 0.7,
          audioParam: 'lowFreq', audioInfluence: 0.9 },
        hueRange: [5, 25], brightnessRange: [0.3, 0.6] },
      // 9. 火星（持续上浮）
      { id: 'spark-rise', ratio: 0.08, strategy: 'procedural', sizeRange: [1, 3], opacity: 0.8,
        zBase: 2, zAmplitude: 8, behavior: { type: 'rise', speed: 0.4, amplitude: 2,
          audioParam: 'midFreq', audioInfluence: 0.5 },
        hueRange: [30, 50], brightnessRange: [0.6, 1.0] },
      // 10. 火星（爆音迸发）
      { id: 'spark-burst', ratio: 0.05, strategy: 'procedural', sizeRange: [2, 5], opacity: 0.9,
        zBase: 1, zAmplitude: 10, behavior: { type: 'rise', speed: 0.8, amplitude: 5,
          audioParam: 'highFreq', audioInfluence: 1.0 },
        hueRange: [20, 40], brightnessRange: [0.7, 1.0] },
      // 11. 余烬
      { id: 'ember', ratio: 0.03, strategy: 'procedural', sizeRange: [1, 2], opacity: 0.5,
        zBase: -2, zAmplitude: 1, behavior: { type: 'drift', speed: 0.1, amplitude: 0.5 },
        hueRange: [0, 15], brightnessRange: [0.2, 0.4] },
      // 12. 近场浓烟
      { id: 'smoke-near', ratio: 0.08, strategy: 'procedural', sizeRange: [5, 10], opacity: 0.3,
        zBase: 2, zAmplitude: 6, behavior: { type: 'rise', speed: 0.2, amplitude: 3,
          audioParam: 'midFreq', audioInfluence: 0.4 },
        hueRange: [0, 0], brightnessRange: [0.2, 0.4] },
      // 13. 远场淡烟
      { id: 'smoke-far', ratio: 0.06, strategy: 'procedural', sizeRange: [8, 16], opacity: 0.15,
        zBase: 6, zAmplitude: 8, behavior: { type: 'drift', speed: 0.15, amplitude: 4,
          audioParam: 'lowFreq', audioInfluence: 0.3 },
        hueRange: [0, 0], brightnessRange: [0.3, 0.5] },
      // 14. 地面光影
      { id: 'ground-light', ratio: 0.02, strategy: 'procedural', sizeRange: [20, 40], opacity: 0.2,
        zBase: -4, zAmplitude: 0.5, behavior: { type: 'flicker', speed: 0.5, amplitude: 0.5,
          audioParam: 'lowFreq', audioInfluence: 0.8 },
        hueRange: [20, 40], brightnessRange: [0.4, 0.7] },
    ],
    audioBindings: {
      lowFreq: 'flame-height,brightness,ground-size',
      midFreq: 'flicker-speed,smoke-twist',
      highFreq: 'spark-burst,flame-expand',
    },
    interaction: { touch: 'repel', click: 'burst', longPress: 'amplify' },
    timeEffects: { pomodoro: true, dayNight: true, accumulation: true, randomEvents: true },
    randomEventDefs: [
      { name: 'wood-collapse', intervalRange: [900, 1500], duration: 8,
        params: { flameBurst: 2, sparkRain: 3 } },
    ],
  },
  {
    id: 'ocean',
    icon: '🌊',
    name: '海浪 · 沙滩',
    refImage: '/images/ref-ocean.jpg',
    tone: '#3a7bd5',
    particleCount: 18000,
    mobileRatio: 0.6,
    ambientLight: '#0a1628',
    layers: [
      // 1. 海底深蓝（静止基底）
      { id: 'sea-bed', ratio: 0.15, strategy: 'procedural', sizeRange: [3, 6], opacity: 0.6,
        zBase: -6, zAmplitude: 0.5, behavior: { type: 'sway', speed: 0.05, amplitude: 0.3 },
        hueRange: [210, 240], brightnessRange: [0.1, 0.3] },
      // 2. 中层海水（横向涌动）
      { id: 'sea-mid', ratio: 0.25, strategy: 'procedural', sizeRange: [2, 5], opacity: 0.7,
        zBase: -2, zAmplitude: 3, behavior: { type: 'sway', speed: 0.3, amplitude: 2,
          audioParam: 'lowFreq', audioInfluence: 0.7 },
        hueRange: [200, 220], brightnessRange: [0.3, 0.5] },
      // 3. 表层浪花白沫
      { id: 'sea-foam', ratio: 0.12, strategy: 'procedural', sizeRange: [2, 4], opacity: 0.8,
        zBase: 1, zAmplitude: 2, behavior: { type: 'flicker', speed: 0.6, amplitude: 1.5,
          audioParam: 'highFreq', audioInfluence: 0.8 },
        hueRange: [180, 200], brightnessRange: [0.7, 1.0] },
      // 4. 海面反光
      { id: 'sea-glint', ratio: 0.08, strategy: 'procedural', sizeRange: [1, 3], opacity: 0.9,
        zBase: 0, zAmplitude: 2.5, behavior: { type: 'flicker', speed: 0.8, amplitude: 1,
          audioParam: 'midFreq', audioInfluence: 0.5 },
        hueRange: [40, 60], brightnessRange: [0.8, 1.0] },
      // 5. 空中水雾
      { id: 'sea-mist', ratio: 0.08, strategy: 'procedural', sizeRange: [6, 12], opacity: 0.2,
        zBase: 3, zAmplitude: 4, behavior: { type: 'drift', speed: 0.2, amplitude: 3,
          audioParam: 'midFreq', audioInfluence: 0.4 },
        hueRange: [200, 220], brightnessRange: [0.4, 0.6] },
      // 6. 潮汐线泡沫
      { id: 'tide-foam', ratio: 0.08, strategy: 'procedural', sizeRange: [3, 6], opacity: 0.6,
        zBase: -1, zAmplitude: 2, behavior: { type: 'drift', speed: 0.2, amplitude: 1 },
        hueRange: [190, 210], brightnessRange: [0.6, 0.9] },
    ],
    audioBindings: {
      lowFreq: 'wave-height,tide-speed',
      midFreq: 'mist-drift,glint-flicker',
      highFreq: 'foam-burst,glint-flash',
    },
    interaction: { touch: 'ripple', click: 'burst', longPress: 'amplify' },
    timeEffects: { pomodoro: true, dayNight: true, accumulation: true, randomEvents: true },
    randomEventDefs: [
      { name: 'strong-wind', intervalRange: [1200, 1800], duration: 10,
        params: { waveSurge: 2.5, mistBurst: 2 } },
    ],
  },
  {
    id: 'rainy-window',
    icon: '🌧️',
    name: '雨窗 · 咖啡',
    refImage: '/images/ref-rainy-window.jpg',
    tone: '#5b7b9a',
    particleCount: 16000,
    mobileRatio: 0.55,
    ambientLight: '#1a1a2e',
    layers: [
      // 1. 窗外雨丝
      { id: 'rain-streak', ratio: 0.20, strategy: 'procedural', sizeRange: [1, 2], opacity: 0.6,
        zBase: -2, zAmplitude: 0.5, behavior: { type: 'rise', speed: 0.7, amplitude: 0.2,
          audioParam: 'lowFreq', audioInfluence: 0.4 },
        hueRange: [200, 220], brightnessRange: [0.4, 0.6] },
      // 2. 玻璃水珠
      { id: 'raindrop', ratio: 0.12, strategy: 'procedural', sizeRange: [2, 5], opacity: 0.7,
        zBase: 0, zAmplitude: 1, behavior: { type: 'drift', speed: 0.15, amplitude: 0.5,
          audioParam: 'highFreq', audioInfluence: 0.6 },
        hueRange: [190, 210], brightnessRange: [0.5, 0.8] },
      // 3. 玻璃雾气
      { id: 'fog-glass', ratio: 0.15, strategy: 'procedural', sizeRange: [8, 20], opacity: 0.2,
        zBase: 0.5, zAmplitude: 0.3, behavior: { type: 'float', speed: 0.05, amplitude: 0.2,
          audioParam: 'midFreq', audioInfluence: 0.3 },
        hueRange: [200, 220], brightnessRange: [0.3, 0.5] },
      // 4. 窗外城市光斑
      { id: 'city-light', ratio: 0.08, strategy: 'procedural', sizeRange: [4, 10], opacity: 0.5,
        zBase: -3, zAmplitude: 0.2, behavior: { type: 'flicker', speed: 0.2, amplitude: 0.2 },
        hueRange: [40, 60], brightnessRange: [0.6, 0.9] },
      // 5. 闪电闪烁
      { id: 'lightning', ratio: 0.02, strategy: 'procedural', sizeRange: [15, 30], opacity: 0,
        zBase: 0, zAmplitude: 0, behavior: { type: 'flicker', speed: 0, amplitude: 1,
          audioParam: 'highFreq', audioInfluence: 1.0 },
        hueRange: [0, 0], brightnessRange: [0.9, 1.0] },
    ],
    audioBindings: {
      lowFreq: 'rain-density,rain-angle',
      midFreq: 'fog-density,drop-speed',
      highFreq: 'lightning-flash,drop-splash',
    },
    interaction: { touch: 'wipe', click: 'flash', longPress: 'none' },
    timeEffects: { pomodoro: true, dayNight: true, accumulation: true, randomEvents: true },
    randomEventDefs: [
      { name: 'lightning-strike', intervalRange: [1500, 2100], duration: 12,
        params: { flashIntensity: 1, rainSurge: 2 } },
    ],
  },
  {
    id: 'forest',
    icon: '🍃',
    name: '森林 · 萤火',
    refImage: '/images/ref-forest.jpg',
    tone: '#4a6fa5',
    particleCount: 15000,
    mobileRatio: 0.5,
    ambientLight: '#0a1a0a',
    layers: [
      // 1. 月光光柱
      { id: 'moon-beam', ratio: 0.10, strategy: 'procedural', sizeRange: [6, 15], opacity: 0.15,
        zBase: -2, zAmplitude: 3, behavior: { type: 'sway', speed: 0.1, amplitude: 1.5,
          audioParam: 'lowFreq', audioInfluence: 0.3 },
        hueRange: [40, 60], brightnessRange: [0.4, 0.7] },
      // 2. 萤火虫
      { id: 'firefly', ratio: 0.12, strategy: 'procedural', sizeRange: [2, 4], opacity: 0.9,
        zBase: 1, zAmplitude: 4, behavior: { type: 'drift', speed: 0.2, amplitude: 3,
          audioParam: 'midFreq', audioInfluence: 0.6 },
        hueRange: [45, 55], brightnessRange: [0.7, 1.0] },
      // 3. 地面苔藓微光
      { id: 'moss-glow', ratio: 0.08, strategy: 'procedural', sizeRange: [2, 5], opacity: 0.3,
        zBase: -4, zAmplitude: 0.2, behavior: { type: 'static', speed: 0, amplitude: 0 },
        hueRange: [120, 150], brightnessRange: [0.1, 0.3] },
      // 4. 飘浮花粉/尘埃
      { id: 'pollen', ratio: 0.10, strategy: 'procedural', sizeRange: [1, 3], opacity: 0.4,
        zBase: 0, zAmplitude: 5, behavior: { type: 'drift', speed: 0.08, amplitude: 4 },
        hueRange: [50, 70], brightnessRange: [0.3, 0.5] },
      // 5. 树冠剪影（静止）
      { id: 'canopy', ratio: 0.08, strategy: 'procedural', sizeRange: [10, 25], opacity: 0.1,
        zBase: 6, zAmplitude: 1, behavior: { type: 'sway', speed: 0.05, amplitude: 0.5 },
        hueRange: [120, 160], brightnessRange: [0.05, 0.15] },
    ],
    audioBindings: {
      lowFreq: 'beam-sway,ambient-brightness',
      midFreq: 'firefly-flicker,pollen-drift',
      highFreq: 'firefly-burst,firefly-flash',
    },
    interaction: { touch: 'attract', click: 'flash', longPress: 'scatter' },
    timeEffects: { pomodoro: true, dayNight: true, accumulation: true, randomEvents: true },
    randomEventDefs: [
      { name: 'wind-gust', intervalRange: [900, 1200], duration: 10,
        params: { fireflyBright: 2, pollenSurge: 2 } },
    ],
  },
]

export const PARTICLE_SCENE_MAP = new Map(PARTICLE_SCENES.map(s => [s.id, s]))
