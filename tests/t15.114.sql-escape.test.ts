/**
 * T15.114 TDD — SQL 值转义
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 escapeSqlValue()
 *   - null / undefined → NULL（不加引号）
 *   - 数字 → 原始数值字符串
 *   - boolean → 1 / 0
 *   - 普通字符串 → 单引号包裹
 *   - 含单引号的字符串 → '' 转义
 *   - 含换行的字符串 → \n 转义
 *   - JSON 对象字符串可正确导出
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.114 sqlExportService — 文件结构", () => {
  it("应存在 src/services/sqlExportService.ts 文件", () => {
    expect(existsSync(svcPath)).toBe(true)
  })

  it("应导出 escapeSqlValue 函数", () => {
    expect(src()).toMatch(/export.*function.*escapeSqlValue|export.*escapeSqlValue.*=/)
  })
})

describe("T15.114 escapeSqlValue — 值类型处理", () => {
  it("null → 'NULL'（无引号）", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(null)).toBe("NULL")
  })

  it("undefined → 'NULL'（无引号）", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(undefined)).toBe("NULL")
  })

  it("整数 42 → '42'", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(42)).toBe("42")
  })

  it("浮点数 3.14 → '3.14'", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(3.14)).toBe("3.14")
  })

  it("boolean true → '1'", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(true)).toBe("1")
  })

  it("boolean false → '0'", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue(false)).toBe("0")
  })

  it("普通字符串 → 单引号包裹", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue("hello")).toBe("'hello'")
  })

  it("含单引号的字符串 → '' 转义", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    expect(escapeSqlValue("it's ok")).toBe("'it''s ok'")
  })

  it("含换行的字符串 → \\n 转义", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    const result = escapeSqlValue("line1\nline2")
    expect(result).toBe("'line1\\nline2'")
  })

  it("JSON 对象字符串可正确转义", async () => {
    const { escapeSqlValue } = await import("../src/services/sqlExportService")
    const json = JSON.stringify({ key: "val'ue" })
    const result = escapeSqlValue(json)
    expect(result).toContain("''")  // single quote is escaped
    expect(result.startsWith("'")).toBe(true)
    expect(result.endsWith("'")).toBe(true)
  })
})
