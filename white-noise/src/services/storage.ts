const MIX_VERSION = '3'

export const storage = {
  get<T = string>(key: string): T | null {
    try {
      const v = localStorage.getItem(key)
      return v !== null ? (JSON.parse(v) as T) : null
    } catch { return null }
  },

  set(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
  },

  getString(key: string, fallback = ''): string {
    try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
  },

  setString(key: string, value: string): void {
    try { localStorage.setItem(key, value) } catch { /* quota */ }
  },

  get mixesVersion(): string { return MIX_VERSION },
}
