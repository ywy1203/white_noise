import type { SceneDef, SoundCategory, SoundMeta } from '@/types'

export const SCENES: SceneDef[] = [
  { id: 'fireplace', icon: '🔥', name: '壁炉 · 冬夜', video: '/videos/fireplace.mp4', tone: '#ff8c42' },
  { id: 'rain', icon: '🏞️', name: '山涧溪流', video: '/videos/rain.mp4', tone: '#7eb8a0' },
  { id: 'ocean', icon: '🌊', name: '海浪沙滩', video: '/videos/ocean.mp4', tone: '#3a7bd5' },
  { id: 'snow', icon: '🌅', name: '雪地夕阳', video: '/videos/snow.mp4', tone: '#8b6b9e' },
  { id: 'forest', icon: '❄️', name: '森林雪夜', video: '/videos/forest.mp4', tone: '#4a6fa5' },
  { id: 'cafe', icon: '☕', name: '角落咖啡', video: '/videos/cafe.mp4', tone: '#8d6e63' },
  { id: 'cafe_rain', icon: '☔', name: '雨中咖啡', video: '/videos/cafe_rain.mp4', tone: '#5b7b9a' },
]

export const SCENE_COUNT = SCENES.length

export const VIDEO_LOOP_SEC = 5

export const CATS: SoundCategory[] = [
  { id: 'preset', name: '⭐ 当前场景音效' },
  { id: 'rain', name: '🌧️ 雨声', sounds: ['light-rain', 'heavy-rain', 'rain-on-window', 'rain-on-leaves', 'rain-on-tent', 'rain-on-umbrella', 'rain-on-car-roof', 'thunder'] },
  { id: 'nature', name: '🌿 自然', sounds: ['campfire', 'wind', 'howling-wind', 'wind-in-trees', 'river', 'waterfall', 'waves', 'walk-on-leaves', 'walk-on-snow', 'walk-on-gravel', 'droplets', 'jungle'] },
  { id: 'animals', name: '🐾 动物', sounds: 'birds seagulls crickets wolf owl frog cat-purring whale beehive chickens cows crows dog-barking horse-gallop sheep woodpecker'.split(' ') },
  { id: 'urban', name: '🏙️ 城市', sounds: ['busy-street', 'road', 'traffic', 'highway', 'crowd', 'fireworks', 'ambulance-siren'] },
  { id: 'places', name: '🏛️ 场所', sounds: ['cafe', 'library', 'office', 'restaurant', 'church', 'supermarket', 'subway-station', 'construction-site', 'airport', 'crowded-bar', 'laboratory', 'laundry-room', 'night-village', 'temple', 'underwater', 'carousel'] },
  { id: 'transport', name: '🚗 交通', sounds: ['train', 'inside-a-train', 'airplane', 'sailboat', 'rowing-boat', 'submarine'] },
  { id: 'things', name: '🔧 物品', sounds: 'clock typewriter keyboard washing-machine ceiling-fan dryer boiling-water bubbles paper vinyl-effect wind-chimes slide-projector tuning-radio morse-code windshield-wipers singing-bowl'.split(' ') },
  { id: 'noise', name: '📡 噪声', sounds: ['white-noise', 'pink-noise', 'brown-noise'] },
  { id: 'binaural', name: '🧠 双耳节拍', sounds: ['binaural-alpha', 'binaural-beta', 'binaural-delta', 'binaural-gamma', 'binaural-theta'] },
]

export const ICONS: Record<string, string> = {
  'light-rain': '🌦️', 'heavy-rain': '🌧️', 'rain-on-window': '🪟', 'rain-on-leaves': '🍃',
  'rain-on-tent': '⛺', 'rain-on-umbrella': '☂️', 'rain-on-car-roof': '🚗', 'thunder': '⛈️',
  'campfire': '🔥', 'wind': '💨', 'howling-wind': '💨', 'wind-in-trees': '🌲',
  'river': '💧', 'waterfall': '🏞️', 'waves': '🌊', 'walk-on-leaves': '🍂',
  'walk-on-snow': '❄️', 'walk-on-gravel': '🪨', 'droplets': '💧', 'jungle': '🌴',
  'birds': '🐦', 'seagulls': '🕊️', 'crickets': '🦗', 'wolf': '🐺', 'owl': '🦉',
  'frog': '🐸', 'cat-purring': '😺', 'whale': '🐋', 'beehive': '🐝',
  'chickens': '🐔', 'cows': '🐄', 'crows': '🐦‍⬛', 'dog-barking': '🐕',
  'horse-gallop': '🐎', 'sheep': '🐑', 'woodpecker': '🪶',
  'busy-street': '🚦', 'road': '🛣️', 'traffic': '🚗', 'highway': '🛣️',
  'crowd': '👥', 'fireworks': '🎆', 'ambulance-siren': '🚑',
  'cafe': '☕', 'library': '📚', 'office': '💼', 'restaurant': '🍽️',
  'church': '⛪', 'supermarket': '🏪', 'subway-station': '🚇', 'construction-site': '🏗️',
  'airport': '✈️', 'crowded-bar': '🍻', 'laboratory': '🧪', 'laundry-room': '🫧',
  'night-village': '🌙', 'temple': '🛕', 'underwater': '🤿', 'carousel': '🎠',
  'train': '🚆', 'inside-a-train': '🚆', 'airplane': '✈️', 'sailboat': '⛵',
  'rowing-boat': '🚣', 'submarine': '🔬',
  'clock': '🕐', 'typewriter': '📠', 'keyboard': '⌨️', 'washing-machine': '🫧',
  'ceiling-fan': '🌀', 'dryer': '💨', 'boiling-water': '🫧', 'bubbles': '🫧',
  'paper': '📄', 'vinyl-effect': '💿', 'wind-chimes': '🎐', 'slide-projector': '📽️',
  'tuning-radio': '📻', 'morse-code': '📟', 'windshield-wipers': '🚗', 'singing-bowl': '🪷',
  'white-noise': '📡', 'pink-noise': '📡', 'brown-noise': '📡',
  'binaural-alpha': '🧠', 'binaural-beta': '🧠', 'binaural-delta': '🧠',
  'binaural-gamma': '🧠', 'binaural-theta': '🧠',
}

export function buildSoundMetaMap(): Record<string, SoundMeta> {
  const map: Record<string, SoundMeta> = {}
  CATS.forEach(c => {
    if (!c.sounds) return
    c.sounds.forEach(id => {
      map[id] = {
        cat: c.id,
        ext: (c.id === 'noise' || c.id === 'binaural') ? '.wav' : '.mp3',
        label: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: ICONS[id] || '🔊',
      }
    })
  })
  return map
}

export const SMAP = buildSoundMetaMap()

export function soundPath(id: string): string {
  const m = SMAP[id]
  if (!m) return ''
  return `/sounds/${m.cat}/${id}${m.ext}`
}

export const PRESET_IDS: string[][] = [
  ['campfire', 'wind', 'clock', 'cat-purring', 'rain-on-window', 'cafe', 'typewriter', 'brown-noise'],
  ['river', 'birds', 'wind-in-trees', 'walk-on-leaves', 'waterfall', 'campfire', 'brown-noise', 'droplets'],
  ['waves', 'underwater', 'wind', 'seagulls', 'sailboat', 'wind-in-trees', 'white-noise', 'river'],
  ['underwater', 'wind-in-trees', 'seagulls', 'sailboat', 'waves', 'white-noise', 'pink-noise', 'wind'],
  ['wind', 'wind-in-trees', 'brown-noise', 'campfire', 'white-noise', 'walk-on-leaves', 'river', 'owl'],
  ['campfire', 'river', 'cafe', 'clock', 'typewriter', 'white-noise', 'wind-in-trees'],
  ['rain-on-window', 'cafe', 'typewriter', 'white-noise'],
]

export const PRESET_VOL: Record<string, number>[] = [
  { campfire: .7, wind: .2, clock: .3, 'cat-purring': .35, 'rain-on-window': .25, cafe: .15, typewriter: .25, 'brown-noise': .1 },
  { river: .6, birds: .35, 'wind-in-trees': .2, 'walk-on-leaves': .15, waterfall: .45, campfire: .15, 'brown-noise': .08, droplets: .15 },
  { waves: .65, underwater: .3, wind: .25, seagulls: .2, sailboat: .08, 'wind-in-trees': .15, 'white-noise': .08, river: .2 },
  { underwater: .45, 'wind-in-trees': .3, seagulls: .25, sailboat: .08, waves: .25, 'white-noise': .1, 'pink-noise': .1, wind: .15 },
  { wind: .35, 'wind-in-trees': .3, 'brown-noise': .12, campfire: .15, 'white-noise': .08, 'walk-on-leaves': .25, river: .08, owl: .25 },
  { campfire: .35, river: .5, cafe: .35, clock: .25, typewriter: .25, 'white-noise': .08, 'wind-in-trees': .1 },
  { 'rain-on-window': .5, cafe: .4, typewriter: .2, 'white-noise': .05 },
]
