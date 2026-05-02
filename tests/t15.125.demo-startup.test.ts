/**
 * T15.125 TDD — Demo 启动说明文档（DEMO.md）验收
 *
 * 验收标准：
 *   DEMO.md 存在且包含完整的演示启动说明
 *
 * 测试项：
 *   - DEMO.md 文件存在于 source/ 根目录
 *   - 包含启动命令（npm run dev 或 npm install）
 *   - 包含演示账号（admin）
 *   - 包含三端路由（/screen/home、/admin/dashboard、/h5/）
 *   - 包含演示控制台地址（/admin/demo-console）
 *   - 包含 SQLiteMirror 存储键前缀（ywtg.sqlite）
 *   - 包含 SQL 导出相关说明
 *   - 包含 resetDemo 或重置说明
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const demoMdPath = join(projectRoot, "DEMO.md")

describe("T15.125 DEMO.md — Demo 启动说明文档", () => {
  it("DEMO.md 文件应存在于 source/ 根目录", () => {
    expect(existsSync(demoMdPath)).toBe(true)
  })

  it("包含启动命令（npm run dev 或 npm install）", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/npm run dev|npm install/)
  })

  it("包含演示账号 admin", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/admin/)
  })

  it("包含大屏三端路由 /screen/home", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/\/screen\/home/)
  })

  it("包含后台路由 /admin/dashboard", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/\/admin\/dashboard/)
  })

  it("包含移动端路由 /h5/", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/\/h5\//)
  })

  it("包含演示控制台地址 /admin/demo-console", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/\/admin\/demo-console/)
  })

  it("包含 SQLiteMirror 存储键前缀 ywtg.sqlite", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/ywtg\.sqlite/)
  })

  it("包含 SQL 导出相关说明（exportToSql 或 sql.*export）", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/exportToSql|sql.*export|SQL.*导出/i)
  })

  it("包含 resetDemo 或重置说明", () => {
    const content = readFileSync(demoMdPath, "utf-8")
    expect(content).toMatch(/resetDemo|重置|reset demo/i)
  })
})
