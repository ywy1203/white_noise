import { ref } from 'vue'
import type { SpectrumData } from '@/types/particle'

/**
 * 音频频谱分析桥接层
 * 负责从 Web Audio Context 读取频谱数据，
 * 拆分为低/中/高三频段，供粒子引擎消费。
 *
 * 当前 useAudio.ts 使用 AudioBufferSourceNode → GainNode → destination
 * 此模块在中间插入 AnalyserNode 做频谱分析。
 */
export function useAudioReactivity() {
  const analyser = ref<AnalyserNode | null>(null)
  const spectrum = ref<SpectrumData>({ low: 0, mid: 0, high: 0 })
  const dataArray = ref<Uint8Array | null>(null)
  const enabled = ref(false)

  let animFrameId = 0
  let callback: ((spec: SpectrumData) => void) | null = null

  /** 初始化 AnalyserNode */
  function init(ctx: AudioContext) {
    const an = ctx.createAnalyser()
    an.fftSize = 256  // 128 bins，降低计算量
    an.smoothingTimeConstant = 0.8  // 平滑，让粒子运动更自然
    analyser.value = an
    dataArray.value = new Uint8Array(an.frequencyBinCount)  // 128
    enabled.value = true
  }

  /** 获取 AnalyserNode 插入点（在 connect destination 前） */
  function getAnalyser(): AnalyserNode | null {
    return analyser.value
  }

  /** 开始频谱分析循环 */
  function start(cb?: (spec: SpectrumData) => void) {
    if (!analyser.value || !enabled.value) return
    if (cb) callback = cb

    function analyze() {
      if (!analyser.value || !dataArray.value) return
      analyser.value.getByteFrequencyData(dataArray.value)
      const data = dataArray.value
      const len = data.length  // 128

      // 拆三频段
      // 低频 0-6   (约0-170Hz)  - 燃烧底噪、海浪节奏
      // 中频 7-31  (约170-850Hz) - 嘶嘶声、风声
      // 高频 32-127 (约850-3400Hz) - 噼啪爆音
      let lowSum = 0, midSum = 0, highSum = 0
      const lowCount = 7, midCount = 25, highCount = 96

      for (let i = 0; i < lowCount; i++) lowSum += data[i]
      for (let i = lowCount; i < lowCount + midCount; i++) midSum += data[i]
      for (let i = lowCount + midCount; i < len; i++) highSum += data[i]

      const low = lowSum / (lowCount * 255)
      const mid = midSum / (midCount * 255)
      const high = highSum / (highCount * 255)

      spectrum.value = { low, mid, high }

      if (callback) callback(spectrum.value)

      animFrameId = requestAnimationFrame(analyze)
    }
    analyze()
  }

  /** 停止分析 */
  function stop() {
    cancelAnimationFrame(animFrameId)
  }

  /** 设置外部回调（供粒子引擎订阅） */
  function onSpectrum(cb: (spec: SpectrumData) => void) {
    callback = cb
  }

  return {
    analyser, spectrum, enabled,
    init, getAnalyser, start, stop, onSpectrum,
  }
}
