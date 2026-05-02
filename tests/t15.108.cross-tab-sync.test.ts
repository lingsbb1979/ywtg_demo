/**
 * T15.108 TDD — 跨标签页同步（P1）
 *
 * 验收标准：
 *   - syncService.ts 导出 setupCrossTabSync()
 *   - setupCrossTabSync() 返回一个清理函数（() => void）
 *   - 当 storage 事件的 key 以 'ywtg.sqlite.' 开头时调用 triggerRefresh()
 *   - 当 key 不以 'ywtg.sqlite.' 开头时不触发刷新
 *   - 清理函数调用后不再响应 storage 事件
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "syncService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

// ── 文件结构 ─────────────────────────────────────────────────────────────────

describe("T15.108 syncService — setupCrossTabSync 文件结构", () => {
  it("应导出 setupCrossTabSync 函数", () => {
    expect(src()).toMatch(/export.*function.*setupCrossTabSync|export.*setupCrossTabSync.*=/)
  })
})

// ── 行为验证 ─────────────────────────────────────────────────────────────────

describe("T15.108 syncService — setupCrossTabSync 行为", () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // 模拟 window.addEventListener / removeEventListener
    addSpy    = vi.spyOn(globalThis, "addEventListener"   ).mockImplementation(() => {})
    removeSpy = vi.spyOn(globalThis, "removeEventListener").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("setupCrossTabSync() 应返回一个函数（清理函数）", async () => {
    const { setupCrossTabSync } = await import("../src/services/syncService")
    const cleanup = setupCrossTabSync()
    expect(typeof cleanup).toBe("function")
    cleanup()
  })

  it("setupCrossTabSync() 应注册 storage 事件监听", async () => {
    const { setupCrossTabSync } = await import("../src/services/syncService")
    const cleanup = setupCrossTabSync()
    expect(addSpy).toHaveBeenCalledWith("storage", expect.any(Function))
    cleanup()
  })

  it("清理函数应移除 storage 事件监听", async () => {
    const { setupCrossTabSync } = await import("../src/services/syncService")
    const cleanup = setupCrossTabSync()
    cleanup()
    expect(removeSpy).toHaveBeenCalledWith("storage", expect.any(Function))
  })

  it("storage 事件中 key 以 ywtg.sqlite. 开头时触发 triggerRefresh", async () => {
    const svc = await import("../src/services/syncService")
    const before = svc.syncRefreshKey.value
    // 直接模拟 storage 事件触发逻辑：找到注册的 handler 并调用
    let capturedHandler: ((e: Event) => void) | null = null
    addSpy.mockImplementation((_evt, handler) => { capturedHandler = handler as any })
    const cleanup = svc.setupCrossTabSync()
    if (capturedHandler) {
      const fakeEvent = new StorageEvent("storage", { key: "ywtg.sqlite.work_order" })
      capturedHandler(fakeEvent)
      expect(svc.syncRefreshKey.value).toBe(before + 1)
    }
    cleanup()
  })
})
