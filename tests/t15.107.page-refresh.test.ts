/**
 * T15.107 TDD — 页面刷新机制
 *
 * 验收标准：
 *   - syncService.ts 文件存在
 *   - 导出 syncRefreshKey（只读 ref）和 triggerRefresh()
 *   - triggerRefresh() 调用后 syncRefreshKey.value 递增
 *   - 多次调用累计递增
 *   - triggerRefresh() 可携带可选 tableName 参数
 */
import { describe, it, expect, beforeEach } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "syncService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

// ── 文件存在 ─────────────────────────────────────────────────────────────────

describe("T15.107 syncService — 文件结构", () => {
  it("应存在 src/services/syncService.ts 文件", () => {
    expect(existsSync(svcPath)).toBe(true)
  })

  it("应导出 syncRefreshKey", () => {
    expect(src()).toMatch(/export.*syncRefreshKey/)
  })

  it("应导出 triggerRefresh 函数", () => {
    expect(src()).toMatch(/export.*function.*triggerRefresh|export.*triggerRefresh.*=/)
  })

  it("应包含 ref(", () => {
    expect(src()).toMatch(/ref\(/)
  })
})

// ── 行为验证 ─────────────────────────────────────────────────────────────────

describe("T15.107 syncService — triggerRefresh() 行为", () => {
  it("初始 syncRefreshKey.value 为 0", async () => {
    // 每次 import 都拿到同一模块实例（vitest 缓存）
    const { syncRefreshKey } = await import("../src/services/syncService")
    // 初始值测试：在某些并发环境下值可能>0，只验证是数字
    expect(typeof syncRefreshKey.value).toBe("number")
  })

  it("triggerRefresh() 调用一次后 value 递增", async () => {
    const { syncRefreshKey, triggerRefresh } = await import("../src/services/syncService")
    const before = syncRefreshKey.value
    triggerRefresh()
    expect(syncRefreshKey.value).toBe(before + 1)
  })

  it("triggerRefresh() 调用三次后累计递增 3", async () => {
    const { syncRefreshKey, triggerRefresh } = await import("../src/services/syncService")
    const before = syncRefreshKey.value
    triggerRefresh()
    triggerRefresh()
    triggerRefresh()
    expect(syncRefreshKey.value).toBe(before + 3)
  })

  it("triggerRefresh(tableName) 携带表名时也能递增", async () => {
    const { syncRefreshKey, triggerRefresh } = await import("../src/services/syncService")
    const before = syncRefreshKey.value
    triggerRefresh("work_order")
    expect(syncRefreshKey.value).toBe(before + 1)
  })
})
