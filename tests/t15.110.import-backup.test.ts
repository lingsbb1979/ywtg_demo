/**
 * T15.110 TDD — 导入 SQLiteMirror 备份（P1）
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 importFromBackup()
 *   - 接受 JSON 字符串（{ tableName: rows[] } 格式）
 *   - 恢复后 getTable(tableName) 返回导入的数据
 *   - 键名可带或不带 ywtg.sqlite. 前缀
 *   - 非法 JSON 时抛出可识别的错误
 */
import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.110 sqlExportService — importFromBackup 文件结构", () => {
  it("应导出 importFromBackup 函数", () => {
    expect(src()).toMatch(/export.*function.*importFromBackup|export.*importFromBackup.*=/)
  })
})

describe("T15.110 importFromBackup — 行为验证", () => {
  beforeEach(resetMem)

  it("不带前缀的键名可正常导入", async () => {
    const { importFromBackup } = await import("../src/services/sqlExportService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const backup = JSON.stringify({
      "alarm_record": [
        { id: 99, alarm_code: "IMPORTED-001", status: "ACTIVE" },
      ],
    })
    importFromBackup(backup)
    const rows = getTable("alarm_record")
    expect(rows.some((r: any) => r.id === 99)).toBe(true)
  })

  it("带 ywtg.sqlite. 前缀的键名可正常导入", async () => {
    const { importFromBackup } = await import("../src/services/sqlExportService")
    const { getTable } = await import("../src/services/sqliteMirrorRepository")
    const backup = JSON.stringify({
      "ywtg.sqlite.work_order": [
        { id: 88, order_no: "WO-IMPORT-001", status: "PENDING" },
      ],
    })
    importFromBackup(backup)
    const rows = getTable("work_order")
    expect(rows.some((r: any) => r.id === 88)).toBe(true)
  })

  it("非法 JSON 时抛出错误", async () => {
    const { importFromBackup } = await import("../src/services/sqlExportService")
    expect(() => importFromBackup("{invalid json}")).toThrow()
  })
})
