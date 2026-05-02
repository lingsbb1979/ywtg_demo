/**
 * T15.99 实现 /screen/emergency 占位页
 *
 * 验收标准：红色告警可跳转到应急占位说明
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 占位页面内容（应急管理 / 建设中）
 * §3 UI 规范符合性（大屏风格）
 * §4 链接（返回首页 / 告警入口）
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getEmergencyView() {
  return readFileSync(resolve(SRC, "views/screen/ScreenEmergencyView.vue"), "utf-8")
}

describe("T15.99 /screen/emergency 应急管理占位页", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("ScreenEmergencyView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/screen/ScreenEmergencyView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /screen/emergency 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/screen\/emergency|screen-emergency/)
    })

    it("routes.ts 引入 ScreenEmergencyView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/ScreenEmergencyView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 占位页面内容
  // ─────────────────────────────────────────
  describe("§2 占位页面内容", () => {
    it("包含应急管理相关文字（应急 / 应急管理）", () => {
      expect(getEmergencyView()).toMatch(/应急/)
    })

    it("包含建设说明（建设中 / 规划中 / 即将上线 / 待实现）", () => {
      expect(getEmergencyView()).toMatch(/建设中|规划中|即将上线|待实现|开发中/)
    })

    it("包含返回首页的链接", () => {
      expect(getEmergencyView()).toMatch(/\/screen\/home|screen\/home/)
    })
  })

  // ─────────────────────────────────────────
  // §3 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§3 UI 规范符合性", () => {
    it("使用大屏背景风格（screen-root / screen-bg / --screen-bg）", () => {
      expect(getEmergencyView()).toMatch(/screen-root|screen-bg|--screen-bg/)
    })

    it("使用 screen-glass-card 玻璃卡片", () => {
      expect(getEmergencyView()).toMatch(/screen-glass-card/)
    })
  })
})
