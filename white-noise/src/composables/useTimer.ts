import { ref, computed } from 'vue'

type TimerMode = 'clock' | 'stopwatch' | 'countdown' | 'pomodoro'

export function useTimer() {
  const mode = ref<TimerMode>('clock')
  const running = ref(false)
  const elapsed = ref(0)       // ms
  const duration = ref(0)      // ms for countdown/pomodoro
  const pomodoroCount = ref(0)

  let startTime = 0
  let tickTimer: ReturnType<typeof setInterval> | null = null

  const display = computed(() => {
    if (mode.value === 'clock') {
      const d = new Date()
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }
    let totalMs = 0
    if (mode.value === 'stopwatch') totalMs = elapsed.value
    else totalMs = Math.max(0, duration.value - elapsed.value)
    const sec = Math.floor(totalMs / 1000)
    return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`
  })

  const label = computed(() => {
    if (mode.value === 'clock') return '当前时间'
    if (mode.value === 'stopwatch') return '已过时间'
    if (mode.value === 'countdown') return '剩余时间'
    return `番茄 #${pomodoroCount.value + 1}`
  })

  function pad(n: number) { return n.toString().padStart(2, '0') }

  function start() {
    if (mode.value === 'clock') return
    running.value = !running.value
    if (running.value) {
      startTime = Date.now()
      if (mode.value === 'countdown' || mode.value === 'pomodoro') {
        if (duration.value === 0) duration.value = 25 * 60 * 1000
      }
      tickTimer = setInterval(() => {
        elapsed.value += Date.now() - startTime
        startTime = Date.now()
        if ((mode.value === 'countdown' || mode.value === 'pomodoro') && elapsed.value >= duration.value) {
          stop()
          pomodoroCount.value++
        }
      }, 200)
    } else {
      clearInterval(tickTimer!)
    }
  }

  function stop() {
    running.value = false
    if (tickTimer) clearInterval(tickTimer)
  }

  function reset() {
    stop()
    elapsed.value = 0
    duration.value = 0
  }

  function setMode(m: TimerMode) {
    stop()
    mode.value = m
    elapsed.value = 0
    if (m === 'clock') duration.value = 0
  }

  return { mode, running, elapsed, duration, pomodoroCount, display, label, start, stop, reset, setMode }
}
