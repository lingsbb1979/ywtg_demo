// Minimal SQLiteMirror repository for tests and demo.
// Uses global localStorage when available (jsdom/browser), otherwise falls back to an in-memory store.

type Row = Record<string, any>

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function getStore(): Record<string, string> {
  if (typeof localStorage !== "undefined") {
    return {
      getItem(key: string) {
        return localStorage.getItem(key)
      },
      setItem(key: string, value: string) {
        localStorage.setItem(key, value)
      }
    } as unknown as Record<string, string>
  }

  // Node / test fallback
  if (!(globalThis as any)[MEM_KEY]) {
    ;(globalThis as any)[MEM_KEY] = {}
  }

  return (globalThis as any)[MEM_KEY]
}

export function readTable<T = Row>(tableName: string): T[] {
  const key = `ywtg.sqlite.${tableName}`
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      return JSON.parse(raw) as T[]
    }

    const store = getStore()
    const raw = store[key]
    if (!raw) return []
    return JSON.parse(raw) as T[]
  } catch (e) {
    return []
  }
}

export function writeTable<T = Row>(tableName: string, rows: T[]): void {
  const key = `ywtg.sqlite.${tableName}`
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(rows))
      return
    }

    const store = getStore()
    store[key] = JSON.stringify(rows)
  } catch (e) {
    // noop
  }
}

export async function readTableAsync<T = Row>(tableName: string): Promise<T[]> {
  return readTable<T>(tableName)
}

export async function writeTableAsync<T = Row>(tableName: string, rows: T[]): Promise<void> {
  return writeTable<T>(tableName, rows)
}

export default {
  readTable,
  writeTable,
  readTableAsync,
  writeTableAsync
}
