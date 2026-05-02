/**
 * T15.90 管理端采集数据页 /admin/telemetry
 *
 * 验收标准：可查看采集值并新增一条模拟采集数据
 *
 * 业务场景：
 * 管理员进入采集数据页 → 选择建筑和数据点 → 查看历史采集值列表 →
 * 输入新采集值 → 提交写入 iot_telemetry
 *
 * 设计规范要求：
 * - 沿用 PC 管理端企业浅色主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - input-pc / btn-pc-primary 表单规范
 * - 数据来源：telemetryService.listTelemetry + addTelemetry
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构
 * §3 筛选与查询区
 * §4 采集值列表区
 * §5 新增采集值区
 * §6 UI 规范符合性
 * §7 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminTelemetryView.vue"), "utf-8")
}

describe("T15.90 管理端采集数据页 /admin/telemetry", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminTelemetryView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminTelemetryView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/telemetry 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/telemetry|admin-telemetry/)
    })

    it("routes.ts 引入 AdminTelemetryView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminTelemetryView/)
    })

    it("页面包含低保真线框注释（T15.90 采集数据）", () => {
      expect(getView()).toMatch(/T15\.90|telemetry|采集数据|采集值/)
    })
  })

  // ─────────────────────────────────────────
  // §2 页面布局结构
  // ─────────────────────────────────────────
  describe("页面布局结构", () => {
    it("使用 pc-card 或 admin-card 卡片容器", () => {
      expect(getView()).toMatch(/pc-card|admin-card/)
    })

    it("使用 --pc-primary 等 pc tokens", () => {
      expect(getView()).toMatch(/--pc-primary|--pc-bg-page|--pc-border/)
    })

    it("包含页面标题（采集数据相关）", () => {
      expect(getView()).toMatch(/采集数据|实时采集|数据采集|IoT 采集|iot.*采集/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 筛选与查询区
  // ─────────────────────────────────────────
  describe("筛选与查询区", () => {
    it("包含建筑选择器或数据点选择器", () => {
      expect(getView()).toMatch(/select.*building|building.*select|select-pc|selectedBuilding|buildingId|数据点|建筑选择/)
    })

    it("包含数据点选择下拉", () => {
      expect(getView()).toMatch(/pointId|point_id|data.*point|iot_data_point|数据点/)
    })

    it("包含查询/加载按钮", () => {
      expect(getView()).toMatch(/btn-pc-primary|btn-pc-secondary|查询|加载|loadData|fetchData/)
    })

    it("包含数量限制或时间筛选", () => {
      expect(getView()).toMatch(/limit|startTime|endTime|条数|时间范围|最近/)
    })
  })

  // ─────────────────────────────────────────
  // §4 采集值列表区
  // ─────────────────────────────────────────
  describe("采集值列表区", () => {
    it("包含采集值列表展示", () => {
      expect(getView()).toMatch(/v-for.*telemetry|telemetry.*v-for|rows.*v-for|v-for.*row/)
    })

    it("展示采集时间戳", () => {
      expect(getView()).toMatch(/\.ts|timeStamp|采集时间|时间戳|ts/)
    })

    it("展示采集值", () => {
      expect(getView()).toMatch(/valueNum|value_num|采集值|测量值|\.value/)
    })

    it("空数据时有提示", () => {
      expect(getView()).toMatch(/暂无采集|v-if.*length.*0|empty|无数据/)
    })
  })

  // ─────────────────────────────────────────
  // §5 新增采集值区
  // ─────────────────────────────────────────
  describe("新增采集值区", () => {
    it("包含新增采集值的输入框", () => {
      expect(getView()).toMatch(/input-pc|newValue|input.*value|value.*input|新增采集|新增数据/)
    })

    it("包含提交新增的按钮", () => {
      expect(getView()).toMatch(/btn-pc-primary|提交|新增|addTelemetry|doAdd|handleAdd/)
    })

    it("提交成功有反馈提示", () => {
      expect(getView()).toMatch(/msg|message|feedback|success|toast|操作成功|添加成功/)
    })

    it("包含新增区域标识", () => {
      expect(getView()).toMatch(/zone.*add|add.*zone|zone.*insert|新增采集区|模拟采集/)
    })
  })

  // ─────────────────────────────────────────
  // §6 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("使用 --pc-shadow 或 box-shadow", () => {
      expect(getView()).toMatch(/--pc-shadow|box-shadow|pc-card/)
    })

    it("使用 tabular-nums 数字规范", () => {
      expect(getView()).toMatch(/tabular-nums|font-variant-numeric|font-feature-settings/)
    })

    it("使用 admin-card__title 等卡片标题规范", () => {
      expect(getView()).toMatch(/admin-card__title|admin-card__header|card.*title|card.*header|page.*title/)
    })
  })

  // ─────────────────────────────────────────
  // §7 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("引入 listTelemetry 采集值查询服务", () => {
      expect(getView()).toMatch(/listTelemetry|telemetryService/)
    })

    it("引入 addTelemetry 新增采集值服务", () => {
      expect(getView()).toMatch(/addTelemetry|telemetryService/)
    })

    it("引入 getTable 或 iot_data_point 查询数据点", () => {
      expect(getView()).toMatch(/getTable|iot_data_point|sqliteMirrorRepository|dataPoints/)
    })

    it("使用 ref( 或 reactive( 声明响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 或 watch 加载数据", () => {
      expect(getView()).toMatch(/onMounted|watch\(/)
    })
  })
})
