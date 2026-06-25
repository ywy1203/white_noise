export interface SceneDef {
  id: string
  icon: string
  name: string
  video: string
  tone: string
}

export interface SoundPreset {
  id: string
  vol: number
  active: boolean
}

export type Mixes = Record<number, Record<string, SoundPreset>>

export interface SoundMeta {
  cat: string
  ext: string
  label: string
  icon: string
}

export interface SoundCategory {
  id: string
  name: string
  sounds?: string[]
}

export interface TimerState {
  mode: 'clock' | 'stopwatch' | 'countdown' | 'pomodoro'
  running: boolean
  elapsed: number      // ms
  duration: number     // ms (for countdown/pomodoro)
  pomodoroCount: number
}

export interface MusicTrack {
  id: number
  name: string
  artist: string
  url?: string
}
