/**
 * T15.116 TDD — 预留 .db 文件导出方案（P1 存根）
 *
 * 验收标准：
 *   - sqlExportService.ts 导出 exportToDbFile()
 *   - 调用时抛出包含 "P1" 的错误（表示尚未实现）
 *   - 错误消息中提到 sql.js 或 P1
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const svcPath = join(projectRoot, "src", "services", "sqlExportService.ts")

function src(): string {
  return readFileSync(svcPath, "utf-8")
}

describe("T15.116 sqlExportService — exportToDbFile 文件结构", () => {
  it("应导出 exportToDbFile 函数", () => {
    expect(src()).toMatch(/export.*function.*exportToDbFile|export.*exportToDbFile.*=/)
  })
})

describe("T15.116 exportToDbFile — P1 存根行为", () => {
  it("调用 exportToDbFile() 应抛出错误", async () => {
    const { exportToDbFile } = await import("../src/services/sqlExportService")
    expect(() => exportToDbFile()).toThrow()
  })

  it("错误消息包含 P1 或 sql.js", async () => {
    const { exportToDbFile } = await import("../src/services/sqlExportService")
    let msg = ""
    try {
      exportToDbFile()
    } catch (e: any) {
      msg = e.message ?? ""
    }
    expect(msg).toMatch(/P1|sql\.js/)
  })
})
