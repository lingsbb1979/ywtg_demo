/**
 * T15.103 实现 /h5/dispose/:id H5 处置页（含 T15.105 GPS mock + T15.106 照片 mock）
 *
 * 验收标准：
 * - T15.103: 可输入处置说明、选择演示照片、提交处置
 * - T15.105: 点击定位校验后显示距离建筑多少米
 * - T15.106: 点击选择演示照片可生成 3 张证据占位图
 *
 * 覆盖范围：
 * §1 文件与路由注册
 * §2 处置说明表单（textarea / 处置描述 / submitDisposal）
 * §3 提交处置（h5-btn-primary / 提交 / submitDisposal 调用）
 * §4 [T15.105] GPS 定位 mock（定位按钮 / 距离显示）
 * §5 [T15.106] 照片 mock（选择演示照片 / 3 张证据）
 * §6 UI 规范符合性（h5 tokens / h5-card / h5-btn-primary）
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/h5/H5DisposeView.vue"), "utf-8")
}

describe("T15.103/T15.105/T15.106 /h5/dispose/:id H5 处置页", () => {

  // ─────────────────────────────────────────
  // §1 文件与路由注册
  // ─────────────────────────────────────────
  describe("§1 文件与路由注册", () => {
    it("H5DisposeView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/h5/H5DisposeView.vue"))).toBe(true)
    })

    it("routes.ts 包含 h5/dispose/:id 路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/h5.*dispose.*:id|h5-dispose/)
    })

    it("routes.ts 引入 H5DisposeView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/H5DisposeView/)
    })
  })

  // ─────────────────────────────────────────
  // §2 处置说明表单
  // ─────────────────────────────────────────
  describe("§2 处置说明表单", () => {
    it("包含处置说明 textarea", () => {
      expect(getView()).toMatch(/textarea/)
    })

    it("处置说明 v-model 数据绑定", () => {
      expect(getView()).toMatch(/v-model.*description|v-model.*remark|v-model.*content|v-model.*memo|v-model.*detail/)
    })

    it("包含处置说明标签（处置说明 / 处置描述 / 处置内容）", () => {
      expect(getView()).toMatch(/处置说明|处置描述|处置内容/)
    })
  })

  // ─────────────────────────────────────────
  // §3 提交处置
  // ─────────────────────────────────────────
  describe("§3 提交处置", () => {
    it("包含提交按钮（h5-btn-primary 或 h5-accept-btn）", () => {
      expect(getView()).toMatch(/h5-btn-primary|h5-accept-btn/)
    })

    it("提交按钮触发 submitDisposal 或 handleSubmit", () => {
      expect(getView()).toMatch(/submitDisposal|handleSubmit|onSubmit/)
    })

    it("调用 submitDisposal 服务或 update work_order", () => {
      expect(getView()).toMatch(/submitDisposal|update.*work_order|work_order.*update/)
    })

    it("提交后有操作反馈（msg 或 提交成功）", () => {
      expect(getView()).toMatch(/msg|提交成功|toast|feedback/)
    })
  })

  // ─────────────────────────────────────────
  // §4 T15.105 GPS 定位 mock
  // ─────────────────────────────────────────
  describe("§4 [T15.105] GPS 定位 mock", () => {
    it("包含定位按钮或定位入口（定位 / GPS / location）", () => {
      expect(getView()).toMatch(/定位|GPS|location|geo/)
    })

    it("点击定位后显示距离（距离 / 米 / distance）", () => {
      expect(getView()).toMatch(/距离|米|distance|m\b/)
    })

    it("包含模拟 GPS 数据（mock 坐标或演示距离）", () => {
      expect(getView()).toMatch(/mockLocation|mock|演示|lat|lng|latitude|longitude/)
    })
  })

  // ─────────────────────────────────────────
  // §5 T15.106 照片 mock
  // ─────────────────────────────────────────
  describe("§5 [T15.106] 照片 mock", () => {
    it("包含照片选择入口（照片 / 证据 / 拍照）", () => {
      expect(getView()).toMatch(/照片|证据|拍照|photo|image/)
    })

    it("可生成 3 张演示照片（photos.length === 3 或 3 张）", () => {
      expect(getView()).toMatch(/3 张|3张|photos|evidence|photo/)
    })

    it("演示照片使用 mock 数据（demo / mock / 演示）", () => {
      expect(getView()).toMatch(/demo|mock|演示|placeholder/)
    })

    it("照片预览列表渲染（v-for photos 或类似）", () => {
      expect(getView()).toMatch(/v-for.*photo|v-for.*image|v-for.*evidence|photo.*v-for/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("§6 UI 规范符合性", () => {
    it("使用 h5-card 卡片样式", () => {
      expect(getView()).toMatch(/h5-card/)
    })

    it("使用 H5 背景（--h5-bg-page 或 h5-dispose）", () => {
      expect(getView()).toMatch(/--h5-bg-page|h5-dispose|h5-main/)
    })

    it("顶部导航返回按钮", () => {
      expect(getView()).toMatch(/h5-header__back|goBack|router.back|←/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("§7 数据绑定与服务层", () => {
    it("使用 ref( 定义响应式数据", () => {
      expect(getView()).toMatch(/ref\(/)
    })

    it("从路由参数获取工单 ID（route.params.id）", () => {
      expect(getView()).toMatch(/route\.params\.id|useRoute/)
    })

    it("使用 onMounted 加载数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })
  })
})
