import type { ParticleData, ParticleSceneConfig } from '@/types/particle'

/**
 * 根据场景配置生成粒子数据
 * 篝火场景已迁移到 Emitter 系统（useParticleEngine 直接调用）
 * 其他场景使用旧生成路径
 */
export function generateParticles(
  config: ParticleSceneConfig,
  _isMobile: boolean = false,
): ParticleData[] {
  // 篝火已使用新发射器系统，此路径不再调用
  // 返回空数组（引擎会特殊处理 campfire）
  if (config.id === 'campfire') return []

  // 其他场景暂返回空（将来迁移）
  return []
}
