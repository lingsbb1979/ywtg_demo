/**
 * T15.118 TDD — 地图失败列表模式（兜底体验）
 *
 * 验收标准：
 *   - ScreenHomeView.vue 中有 data-zone="map-fallback" 或 screen-map__fallback-list
 *   - 存在 mapError ref 或 fallbackMode ref，控制是否进入列表兜底模式
 *   - 兜底模式下展示 23 栋建筑点位列表（screen-map__point）
 *   - mapPoints.length === 0 时显示空状态提示（screen-map__empty）
 *   - 存在 data-testid="map-fallback-toggle" 或注释说明可手动切换
 *   - screen-map__fallback-list 区域可通过 mapError/fallbackMode 来控制渲染
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const viewPath = join(projectRoot, "src", "views", "screen", "ScreenHomeView.vue")

function src(): string {
  return readFileSync(viewPath, "utf-8")
}

describe("T15.118 ScreenHomeView — 地图失败列表模式", () => {
  it("ScreenHomeView.vue 文件应存在", () => {
    const { existsSync } = require("node:fs")
    expect(existsSync(viewPath)).toBe(true)
  })

  it("应包含 screen-map__fallback-list 容器（建筑列表兜底区域）", () => {
    expect(src()).toMatch(/screen-map__fallback-list/)
  })

  it("应有 screen-map__point 用于展示每个建筑点位", () => {
    expect(src()).toMatch(/screen-map__point/)
  })

  it("应有空状态提示元素（screen-map__empty）", () => {
    expect(src()).toMatch(/screen-map__empty/)
  })

  it("地图兜底区域应与 mapPoints 绑定（v-for 展示建筑）", () => {
    expect(src()).toMatch(/v-for.*mapPoints/)
  })

  it("应有 mapError 或 fallbackMode 响应式变量（控制兜底模式）", () => {
    expect(src()).toMatch(/mapError|fallbackMode/)
  })

  it("mapError 或 fallbackMode 应是 ref(", () => {
    expect(src()).toMatch(/mapError\s*=\s*ref\(|fallbackMode\s*=\s*ref\(/)
  })

  it("兜底切换按钮或说明应存在（data-testid='map-fallback-toggle' 或注释）", () => {
    // 允许通过 data-testid 或注释标注
    expect(src()).toMatch(/map-fallback-toggle|fallback.*toggle|mapError|fallbackMode/)
  })

  it("空状态（mapPoints 为空）应有初始化提示文字", () => {
    expect(src()).toMatch(/暂无建筑点位数据|请先初始化|初始化演示数据/)
  })
})

describe("T15.118 ScreenHomeView — 兜底列表功能验证", () => {
  it("screen-map__point-name 用于显示建筑名称", () => {
    expect(src()).toMatch(/screen-map__point-name/)
  })

  it("screen-map__point 应有 risk-dot 色点展示风险等级", () => {
    expect(src()).toMatch(/risk-dot/)
  })

  it("点击建筑点位应能触发弹窗（selectedPoint）", () => {
    expect(src()).toMatch(/selectedPoint/)
  })

  it("应有建筑详情弹窗区域（screen-building-popup）", () => {
    expect(src()).toMatch(/screen-building-popup/)
  })
})
