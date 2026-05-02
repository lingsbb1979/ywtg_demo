/**
 * tests/setupGlobals.ts — Vitest 全局测试环境 polyfill
 *
 * 为 Node.js 测试环境补充浏览器 API 存根，使与浏览器事件系统相关的测试
 * 能在非 jsdom 环境下正常运行（主要用于 vi.spyOn 能够挂载）。
 */

// ── addEventListener / removeEventListener ──────────────────────────────────

if (typeof (globalThis as any).addEventListener === "undefined") {
  ;(globalThis as any).addEventListener = function(
    _type: string,
    _handler: unknown,
  ): void { /* stub */ }
}

if (typeof (globalThis as any).removeEventListener === "undefined") {
  ;(globalThis as any).removeEventListener = function(
    _type: string,
    _handler: unknown,
  ): void { /* stub */ }
}

// ── StorageEvent ─────────────────────────────────────────────────────────────

if (typeof (globalThis as any).StorageEvent === "undefined") {
  ;(globalThis as any).StorageEvent = class StorageEvent {
    readonly type: string
    readonly key: string | null
    readonly newValue: string | null
    readonly oldValue: string | null
    readonly storageArea: unknown
    readonly url: string

    constructor(
      type: string,
      init?: {
        key?: string | null
        newValue?: string | null
        oldValue?: string | null
        storageArea?: unknown
        url?: string
      },
    ) {
      this.type = type
      this.key = init?.key ?? null
      this.newValue = init?.newValue ?? null
      this.oldValue = init?.oldValue ?? null
      this.storageArea = init?.storageArea ?? null
      this.url = init?.url ?? ""
    }
  }
}
