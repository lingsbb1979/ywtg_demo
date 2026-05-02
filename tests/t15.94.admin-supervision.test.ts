/**
 * T15.94 实现 /admin/supervision — 督办列表与填写回复
 *
 * 验收标准（P1 可简化）：可查看督办列表和填写回复
 *
 * 业务场景：
 * 管理员进入督办管理 → 查看超时督办列表 → 填写督办回复并提交
 *
 * 功能要求（P1 简化版）：
 * - 督办列表：从 supervision_order 表读取数据，展示列表
 * - 填写回复：表单输入 + 提交，将 reply 写回 supervision_order 表
 * - 使用 getTable/setTable 直接操作 SQLiteMirror
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 页面布局结构
 * §3 督办列表渲染
 * §4 填写回复表单
 * §5 UI 规范符合性
 * §6 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminSupervisionView.vue"), "utf-8")
}

describe("T15.94 /admin/supervision 督办管理", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("AdminSupervisionView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminSupervisionView.vue"))).toBe(true)
    })

    it("routes.ts 包含 supervision 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/path.*supervision|admin-supervision/)
    })

    it("routes.ts 引入 AdminSupervisionView 组件", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminSupervisionView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构
  // ─────────────────────────────────────────
  describe("§2 页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 PC 设计 token（--pc-primary / --pc-bg-page / --pc-border）", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（督办管理 / 督办列表）", () => {
      expect(getView()).toMatch(/督办管理|督办列表|督办/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 督办列表渲染
  // ─────────────────────────────────────────
  describe("§3 督办列表渲染", () => {
    it("使用 v-for 遍历督办记录", () => {
      expect(getView()).toMatch(/v-for.*supervision|v-for.*order|v-for.*item/)
    })

    it("数据来源为 supervision_order 表", () => {
      expect(getView()).toMatch(/supervision_order/)
    })

    it("展示督办状态", () => {
      expect(getView()).toMatch(/status|状态/)
    })

    it("展示建筑或工单信息", () => {
      expect(getView()).toMatch(/buildingName|building_name|order_no|orderNo|建筑|工单/)
    })
  })

  // ─────────────────────────────────────────
  // §4 填写回复表单
  // ─────────────────────────────────────────
  describe("§4 填写回复表单", () => {
    it("包含 textarea 或 input 回复输入框", () => {
      expect(getView()).toMatch(/textarea|v-model.*reply/)
    })

    it("回复相关变量或标识（reply 或 回复）", () => {
      expect(getView()).toMatch(/reply|回复/)
    })

    it("提交回复按钮（btn-pc-primary 或 提交）", () => {
      expect(getView()).toMatch(/btn-pc-primary|提交|submit/)
    })

    it("回复写入 supervision_order 表（setTable 或 update）", () => {
      expect(getView()).toMatch(/setTable|update.*supervision|supervision.*update/)
    })
  })

  // ─────────────────────────────────────────
  // §5 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§5 UI 规范符合性", () => {
    it("tabular-nums 数字等宽显示", () => {
      expect(getView()).toMatch(/tabular-nums/)
    })

    it("使用 badge 或 admin-badge 状态徽章", () => {
      expect(getView()).toMatch(/admin-badge|badge/)
    })

    it("使用 btn-pc-primary 按钮样式", () => {
      expect(getView()).toMatch(/btn-pc-primary/)
    })
  })

  // ─────────────────────────────────────────
  // §6 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§6 数据绑定与服务层", () => {
    it("使用 getTable 从 SQLiteMirror 读取数据", () => {
      expect(getView()).toMatch(/getTable/)
    })

    it("使用 ref 或 reactive 管理响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 加载初始数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })
  })
})
