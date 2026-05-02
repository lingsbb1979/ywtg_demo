/**
 * T15.113 TDD — 导出时非法字段拦截
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 assertNoIllegalFields()
 *   - 出现 SQL 表不存在的字段时抛出 Error
 *   - 错误消息包含表名和非法字段名
 *   - 字段全合法时不抛出
 *   - 未在 TableRegistry 注册的表名跳过校验（不抛出）
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.113 sqlExportService — assertNoIllegalFields 文件结构", () => {
  it("应导出 assertNoIllegalFields 函数", () => {
    expect(src()).toMatch(/export.*function.*assertNoIllegalFields|export.*assertNoIllegalFields.*=/)
  })
})

describe("T15.113 assertNoIllegalFields — 行为验证", () => {
  it("合法字段时不抛出", async () => {
    const { assertNoIllegalFields } = await import("../src/services/sqlExportService")
    expect(() => assertNoIllegalFields("alarm_record", { id: 1, status: "ACTIVE" })).not.toThrow()
  })

  it("出现非法字段时抛出 Error", async () => {
    const { assertNoIllegalFields } = await import("../src/services/sqlExportService")
    expect(() =>
      assertNoIllegalFields("alarm_record", { id: 1, fakeField: "bad" })
    ).toThrow()
  })

  it("错误消息包含表名", async () => {
    const { assertNoIllegalFields } = await import("../src/services/sqlExportService")
    let msg = ""
    try {
      assertNoIllegalFields("alarm_record", { id: 1, fakeField: "bad" })
    } catch (e: any) {
      msg = e.message ?? ""
    }
    expect(msg).toContain("alarm_record")
  })

  it("错误消息包含非法字段名", async () => {
    const { assertNoIllegalFields } = await import("../src/services/sqlExportService")
    let msg = ""
    try {
      assertNoIllegalFields("work_order", { id: 1, illegal_custom_col: "x" })
    } catch (e: any) {
      msg = e.message ?? ""
    }
    expect(msg).toContain("illegal_custom_col")
  })

  it("未注册的表名不抛出（跳过校验）", async () => {
    const { assertNoIllegalFields } = await import("../src/services/sqlExportService")
    expect(() =>
      assertNoIllegalFields("unknown_table_xyz", { id: 1, anyField: "ok" })
    ).not.toThrow()
  })
})
