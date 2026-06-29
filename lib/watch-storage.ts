const STORAGE_KEY = "weekends-plan:watch"

export const watchStorage = {
  getWatchedIds(): string[] {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error("Error reading watch ids from localStorage", e)
      return []
    }
  },

  saveWatchedIds(ids: string[]): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch (e) {
      console.error("Error writing watch ids to localStorage", e)
    }
  },

  watchEvent(id: string): void {
    const ids = this.getWatchedIds()
    if (!ids.includes(id)) {
      ids.push(id)
      this.saveWatchedIds(ids)
    }
  },

  unwatchEvent(id: string): void {
    const ids = this.getWatchedIds()
    const index = ids.indexOf(id)
    if (index > -1) {
      ids.splice(index, 1)
      this.saveWatchedIds(ids)
    }
  },

  isWatched(id: string): boolean {
    return this.getWatchedIds().includes(id)
  },

  cleanWatchedIds(apiIds: string[]): string[] {
    if (typeof window === "undefined") return []
    const ids = this.getWatchedIds()
    const apiSet = new Set(apiIds)
    const validIds = ids.filter(id => apiSet.has(id))
    if (validIds.length !== ids.length) {
      this.saveWatchedIds(validIds)
    }
    return validIds
  }
}
