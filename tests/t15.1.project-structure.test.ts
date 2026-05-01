import { describe, expect, it } from "vitest"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const projectRoot = process.cwd()

function pathExists(...segments: string[]) {
  return existsSync(join(projectRoot, ...segments))
}

function readJson<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(join(projectRoot, ...segments), "utf-8")) as T
}

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry)
    if (statSync(fullPath).isDirectory()) {
      return listFiles(fullPath)
    }

    return [relative(projectRoot, fullPath).replace(/\\/g, "/")]
  })
}

describe("T15.1 Vue Demo 工程基础结构", () => {
  it("在 source/src 下创建第十五章要求的核心目录", () => {
    const requiredDirectories = ["router", "stores", "mock", "services", "views", "layouts"]

    for (const directory of requiredDirectories) {
      expect(pathExists("src", directory), `缺少目录 src/${directory}`).toBe(true)
    }
  })

  it("提供 Vite + Vue + TypeScript 的最小应用入口", () => {
    expect(pathExists("index.html"), "缺少 Vite 入口 index.html").toBe(true)
    expect(pathExists("vite.config.ts"), "缺少 Vite 配置 vite.config.ts").toBe(true)
    expect(pathExists("src", "main.ts"), "缺少 Vue 应用入口 src/main.ts").toBe(true)
    expect(pathExists("src", "App.vue"), "缺少根组件 src/App.vue").toBe(true)
  })

  it("package.json 对齐 mock 技术栈和 TDD 测试命令", () => {
    const packageJson = readJson<{
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }>("package.json")

    expect(packageJson.scripts.test).toBe("vitest run")
    expect(packageJson.dependencies.vue).toBeDefined()
    expect(packageJson.dependencies.vite).toBeDefined()
    expect(packageJson.dependencies["vue-router"]).toBeDefined()
    expect(packageJson.dependencies.pinia).toBeDefined()
    expect(packageJson.devDependencies.vitest).toBeDefined()
    expect(packageJson.devDependencies.typescript).toBeDefined()
  })

  it("本期工程不得出现 Python 后端或真实后端入口", () => {
    const files = listFiles(projectRoot)
    const forbiddenFiles = files.filter((file) => {
      const normalized = file.toLowerCase()
      return (
        normalized.endsWith(".py") ||
        normalized.startsWith("backend/") ||
        normalized.startsWith("server/") ||
        normalized.includes("fastapi") ||
        normalized.includes("sqlalchemy")
      )
    })

    expect(forbiddenFiles).toEqual([])
  })
})