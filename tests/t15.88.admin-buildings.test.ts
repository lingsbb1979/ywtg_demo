/**
 * T15.88 管理端建筑列表 /admin/buildings
 *
 * 验收标准：可筛选、查看 23 栋建筑，点击进入详情
 *
 * 业务场景：
 * 演示步骤 18：管理员查看建筑档案 → 筛选 B003 → 进入建筑详情
 *
 * 设计规范要求：
 * - 沿用 AdminDashboardView PC 管理端浅色企业主题
 * - pc-card / admin-card 卡片容器
 * - pc tokens（--pc-primary / --pc-bg-page / --pc-border）
 * - 筛选工具栏（筛选等级 + 搜索输入框）
 * - 建筑卡片列表或 table-pc 表格
 * - 风险等级颜色点（risk-dot）
 * - 点击建筑进入详情路由
 * - SQLiteMirror：从 buildingService.listBuildings() 读取
 *
 * 覆盖范围：
 * §1 路由与文件存在性
 * §2 页面布局结构
 * §3 筛选工具栏
 * §4 建筑列表展示
 * §5 建筑卡片/行内容
 * §6 点击进入详情
 * §7 UI 规范符合性
 * §8 数据绑定与服务层
 */

import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SRC    = resolve(__dirname, "../src")
const ROUTES = resolve(SRC, "router/routes.ts")

function getView() {
  return readFileSync(resolve(SRC, "views/admin/AdminBuildingsView.vue"), "utf-8")
}

describe("T15.88 管理端建筑列表 /admin/buildings", () => {

  // ─────────────────────────────────────────
  // §1 路由与文件存在性
  // ─────────────────────────────────────────
  describe("路由与文件存在性", () => {
    it("AdminBuildingsView.vue 文件存在", () => {
      expect(existsSync(resolve(SRC, "views/admin/AdminBuildingsView.vue"))).toBe(true)
    })

    it("routes.ts 包含 /admin/buildings 路由路径", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/\/admin\/buildings|admin-buildings/)
    })

    it("routes.ts 引入 AdminBuildingsView", () => {
      expect(readFileSync(ROUTES, "utf-8")).toMatch(/AdminBuildingsView/)
    })

    it("页面包含低保真线框注释（T15.88 建筑列表）", () => {
      expect(getView()).toMatch(/T15\.88|buildings|建筑列表|建筑管理/)
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

    it("包含页面标题（建筑列表/建筑管理/建筑档案）", () => {
      expect(getView()).toMatch(/建筑列表|建筑管理|建筑档案|历史建筑/)
    })

    it("使用 data-zone 属性标注功能区域", () => {
      expect(getView()).toMatch(/data-zone=/)
    })
  })

  // ─────────────────────────────────────────
  // §3 筛选工具栏
  // ─────────────────────────────────────────
  describe("筛选工具栏", () => {
    it("包含搜索输入框（input-pc 或 admin-search-input）", () => {
      expect(getView()).toMatch(/input-pc|admin-search-input|admin-search|search.*input|input.*search/)
    })

    it("包含风险等级筛选（RED/ORANGE/YELLOW 或 全部）", () => {
      expect(getView()).toMatch(/RED|ORANGE|YELLOW|全部|风险等级|admin-filter-tab/)
    })

    it("包含筛选标签（admin-filter-tab 或 filter）", () => {
      expect(getView()).toMatch(/admin-filter-tab|filter-tab|filter.*btn|btn.*filter/)
    })

    it("包含建筑总数或筛选结果数量显示", () => {
      expect(getView()).toMatch(/共.*栋|total|\.length|totalCount|filteredBuildings/)
    })
  })

  // ─────────────────────────────────────────
  // §4 建筑列表展示
  // ─────────────────────────────────────────
  describe("建筑列表展示", () => {
    it("使用 v-for 遍历建筑列表", () => {
      expect(getView()).toMatch(/v-for.*building|v-for.*build|buildings.*v-for/)
    })

    it("使用卡片列表（admin-building-card 或 building-card 或 table-pc）", () => {
      expect(getView()).toMatch(/building-card|admin-building|table-pc|building.*grid|building.*list/)
    })

    it("包含空状态提示", () => {
      expect(getView()).toMatch(/暂无建筑|v-if.*length.*===.*0|v-if.*!.*buildings|empty|无数据/)
    })
  })

  // ─────────────────────────────────────────
  // §5 建筑卡片/行内容
  // ─────────────────────────────────────────
  describe("建筑卡片/行内容", () => {
    it("展示建筑名称（name 字段）", () => {
      expect(getView()).toMatch(/\.name|buildingName|building\.name|item\.name/)
    })

    it("展示建筑编码（spaceCode 或 space_code）", () => {
      expect(getView()).toMatch(/spaceCode|space_code|\.code|buildingCode/)
    })

    it("展示风险等级颜色点（risk-dot 或 latestRiskLevel）", () => {
      expect(getView()).toMatch(/risk-dot|latestRiskLevel|riskLevel|risk.*level/)
    })

    it("展示地址或区域信息（addressDesc 或 address）", () => {
      expect(getView()).toMatch(/addressDesc|address_desc|address|区域/)
    })
  })

  // ─────────────────────────────────────────
  // §6 点击进入详情
  // ─────────────────────────────────────────
  describe("点击进入详情", () => {
    it("包含 router-link 或 router.push 进入建筑详情", () => {
      expect(getView()).toMatch(/router-link|router\.push|useRouter/)
    })

    it("详情路由包含 /admin/buildings/:id 或 building.*id", () => {
      expect(getView()).toMatch(/\/admin\/buildings\/|buildings.*id|building.*detail/)
    })
  })

  // ─────────────────────────────────────────
  // §7 UI 规范符合性
  // ─────────────────────────────────────────
  describe("UI 规范符合性", () => {
    it("风险等级使用正确 CSS 类（risk-dot--red / risk-dot--orange）", () => {
      expect(getView()).toMatch(/risk-dot--|riskLevel|latestRiskLevel/)
    })

    it("使用 --pc-shadow-sm 或卡片阴影", () => {
      expect(getView()).toMatch(/--pc-shadow|box-shadow|pc-card/)
    })

    it("包含响应式状态指示（绿色/橙色/红色/黄色对应安全/关注/危险）", () => {
      expect(getView()).toMatch(/GREEN|ORANGE|RED|YELLOW|green|orange|risk/)
    })
  })

  // ─────────────────────────────────────────
  // §8 数据绑定与服务层
  // ─────────────────────────────────────────
  describe("数据绑定与服务层", () => {
    it("从 buildingService 导入 listBuildings", () => {
      expect(getView()).toMatch(/listBuildings|buildingService/)
    })

    it("使用 ref() 或 reactive() 响应式状态", () => {
      expect(getView()).toMatch(/ref\(|reactive\(/)
    })

    it("使用 onMounted 初始化数据", () => {
      expect(getView()).toMatch(/onMounted/)
    })

    it("包含 computed 计算属性（筛选结果）", () => {
      expect(getView()).toMatch(/computed\(/)
    })
  })
})
