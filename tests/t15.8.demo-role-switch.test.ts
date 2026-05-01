/**
 * T15.8 TDD — 实现演示角色切换
 *
 * 验收标准：可切换市级值班员、街道外勤、领导参观视角
 * 架构约束（技术栈-mock.md / 第十五章）：
 *   - 角色切换只影响 UI 视角和默认筛选，不写入 ywtg.sqlite.* 业务表
 *   - UI 状态持久化到 ywtg.ui.demoRole（与 SQLiteMirror 数据隔离）
 *   - 三个核心视角各有默认跳转路径 defaultPath
 *   - 每个视角有对应可见菜单集合 visibleMenus
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { readFileSync } from "fs"
import { join } from "path"

const projectRoot = join(__dirname, "..")

// ────────────────────────────── 辅助：fake localStorage ──────────────────────────────

/** Node 测试环境下的内存 localStorage stub */
function createFakeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (i) => Object.keys(store)[i] ?? null,
  } as Storage
}

let fakeStorage: Storage

beforeEach(() => {
  fakeStorage = createFakeStorage()
  ;(globalThis as any).localStorage = fakeStorage
  setActivePinia(createPinia())
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

// ────────────────────────────── 源码检查 ──────────────────────────────

describe("T15.8 演示角色切换 — 源码约束", () => {
  it("demoRole.ts 不使用 ywtg.sqlite.* 键（角色状态不进业务表）", () => {
    const content = readFileSync(join(projectRoot, "src", "stores", "demoRole.ts"), "utf-8")
    expect(content.includes("ywtg.sqlite.")).toBe(false)
  })

  it("demoRole.ts 使用 ywtg.ui.* 键持久化 UI 状态", () => {
    const content = readFileSync(join(projectRoot, "src", "stores", "demoRole.ts"), "utf-8")
    expect(content.includes("ywtg.ui.")).toBe(true)
  })

  it("demoRole.ts 暴露 defaultPath 计算属性或方法", () => {
    const content = readFileSync(join(projectRoot, "src", "stores", "demoRole.ts"), "utf-8")
    expect(content.includes("defaultPath")).toBe(true)
  })

  it("demoRole.ts 暴露 visibleMenus 计算属性或方法", () => {
    const content = readFileSync(join(projectRoot, "src", "stores", "demoRole.ts"), "utf-8")
    expect(content.includes("visibleMenus")).toBe(true)
  })
})

// ────────────────────────────── 三个核心视角 defaultPath ──────────────────────────────

describe("T15.8 演示角色切换 — 各视角默认跳转路径", () => {
  it("DUTY_OFFICER（市级值班员）默认路径为 /admin/dashboard", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("DUTY_OFFICER")
    expect(store.defaultPath).toBe("/admin/dashboard")
  })

  it("FIELD_WORKER（街道外勤）默认路径为 /h5/work-orders", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("FIELD_WORKER")
    expect(store.defaultPath).toBe("/h5/work-orders")
  })

  it("LEADER（领导参观）默认路径为 /screen/home", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("LEADER")
    expect(store.defaultPath).toBe("/screen/home")
  })

  it("PROVINCIAL（省级监管）默认路径包含 screen 或 admin", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("PROVINCIAL")
    expect(store.defaultPath.startsWith("/screen") || store.defaultPath.startsWith("/admin")).toBe(true)
  })
})

// ────────────────────────────── visibleMenus 视角菜单 ──────────────────────────────

describe("T15.8 演示角色切换 — 各视角可见菜单", () => {
  it("DUTY_OFFICER 可见菜单包含告警中心和工单中心", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("DUTY_OFFICER")
    const menus = store.visibleMenus
    expect(Array.isArray(menus)).toBe(true)
    expect(menus.length).toBeGreaterThan(0)
    // 值班员必须能看到工单和告警相关菜单
    const hasAlarmOrOrder = menus.some(
      (m) => m.path.includes("alarm") || m.path.includes("work-order") || m.path.includes("dashboard")
    )
    expect(hasAlarmOrOrder).toBe(true)
  })

  it("FIELD_WORKER 可见菜单包含 H5 待办路径", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("FIELD_WORKER")
    const menus = store.visibleMenus
    expect(Array.isArray(menus)).toBe(true)
    const hasH5 = menus.some((m) => m.path.includes("/h5") || m.path.includes("work-orders"))
    expect(hasH5).toBe(true)
  })

  it("LEADER 可见菜单包含大屏首页路径", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("LEADER")
    const menus = store.visibleMenus
    expect(Array.isArray(menus)).toBe(true)
    const hasScreen = menus.some((m) => m.path.includes("/screen") || m.path.includes("screen"))
    expect(hasScreen).toBe(true)
  })

  it("每个菜单项都有 path 和 label 属性", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    for (const role of ["DUTY_OFFICER", "FIELD_WORKER", "LEADER"] as const) {
      store.setRole(role)
      store.visibleMenus.forEach((m) => {
        expect(typeof m.path).toBe("string")
        expect(typeof m.label).toBe("string")
      })
    }
  })
})

// ────────────────────────────── UI 状态持久化 ──────────────────────────────

describe("T15.8 演示角色切换 — UI 状态持久化（ywtg.ui.*）", () => {
  it("setRole 后角色持久化到 ywtg.ui.demoRole", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("LEADER")
    const stored = fakeStorage.getItem("ywtg.ui.demoRole")
    expect(stored).toBe("LEADER")
  })

  it("重新创建 store 时从 ywtg.ui.demoRole 恢复角色", async () => {
    fakeStorage.setItem("ywtg.ui.demoRole", "FIELD_WORKER")
    // 重置 pinia 让 store 重新初始化
    setActivePinia(createPinia())
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    expect(store.currentRole).toBe("FIELD_WORKER")
  })

  it("ywtg.ui.demoRole 中存储的值不含 ywtg.sqlite 前缀", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("DUTY_OFFICER")
    const key = "ywtg.ui.demoRole"
    const wrongKey = "ywtg.sqlite.demoRole"
    expect(fakeStorage.getItem(key)).toBeTruthy()
    expect(fakeStorage.getItem(wrongKey)).toBeNull()
  })
})

// ────────────────────────────── 切换响应式 ──────────────────────────────

describe("T15.8 演示角色切换 — 切换响应式行为", () => {
  it("setRole 后 currentRole 立即更新", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("LEADER")
    expect(store.currentRole).toBe("LEADER")
    store.setRole("FIELD_WORKER")
    expect(store.currentRole).toBe("FIELD_WORKER")
    store.setRole("DUTY_OFFICER")
    expect(store.currentRole).toBe("DUTY_OFFICER")
  })

  it("setRole 后 defaultPath 随角色立即变化", async () => {
    const { useDemoRoleStore } = await import("../src/stores/demoRole")
    const store = useDemoRoleStore()
    store.setRole("LEADER")
    expect(store.defaultPath).toBe("/screen/home")
    store.setRole("DUTY_OFFICER")
    expect(store.defaultPath).toBe("/admin/dashboard")
    store.setRole("FIELD_WORKER")
    expect(store.defaultPath).toBe("/h5/work-orders")
  })

  it("DEMO_ROLE_OPTIONS 包含三个核心视角的配置项", async () => {
    const { DEMO_ROLE_OPTIONS } = await import("../src/stores/demoRole")
    const values = DEMO_ROLE_OPTIONS.map((o) => o.value)
    expect(values).toContain("DUTY_OFFICER")
    expect(values).toContain("FIELD_WORKER")
    expect(values).toContain("LEADER")
  })
})
