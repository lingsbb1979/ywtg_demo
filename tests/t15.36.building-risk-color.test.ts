/**
 * T15.36 — 实现建筑风险色更新 updateBuildingRiskColor
 *
 * 场景触发后，将指定建筑的风险色（GREEN/YELLOW/ORANGE/RED）写入
 * space_analysis_archive，使 listBuildings / getBuilding 立即反映新颜色。
 *
 * 实现策略：
 *   风险色存储在 space_analysis_archive.risk_level。
 *   updateBuildingRiskColor 向该表追加一条最新记录（calc_time 使用传入值或当前时间）；
 *   因 listBuildings/getBuilding 取最新 calc_time 的记录，追加即可实现覆盖效果。
 *
 * 测试范围：
 *   - updateBuildingRiskColor 可从 buildingService 导入，类型为 function
 *   - 返回值：建筑存在时返回 true，建筑不存在时返回 false
 *   - 调用后 space_analysis_archive 新增 1 条记录（building_id=buildingId）
 *   - 调用后 listBuildings({riskLevel:'ORANGE'}) 可找到该建筑
 *   - 调用后 getBuilding(id).latestRiskLevel 等于新颜色
 *   - 多次调用时取最新 calc_time 的颜色（最后一次覆盖前一次）
 *   - 绿色更新：RED 之后再更新 GREEN，latestRiskLevel 变回 GREEN
 *   - 不存在的 buildingId 返回 false，且不写入 space_analysis_archive
 *   - 支持同时更新多栋建筑各自独立
 *   - 调用后 digital_archive.status 可联动更新（GREEN→10, ORANGE→30, RED→40）
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedSpaceRelation } from "../src/mock/seeds/seedSpaceRelation"

// ── fake localStorage ─────────────────────────────────────────────────────────

function createFakeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear:      () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key:        (i) => Object.keys(store)[i] ?? null,
  } as Storage
}

beforeEach(() => {
  ;(globalThis as any).localStorage = createFakeStorage()
  seedBuildings()
  seedSpaceRelation()
  // space_analysis_archive 初始为空（不依赖 seedTelemetry）
  setTable("space_analysis_archive", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/buildingService")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — 导出", () => {
  it("updateBuildingRiskColor 可从 buildingService 导入", async () => {
    const { updateBuildingRiskColor } = await importService()
    expect(typeof updateBuildingRiskColor).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — 返回值", () => {
  it("建筑存在时返回 true", async () => {
    const { updateBuildingRiskColor } = await importService()
    expect(updateBuildingRiskColor(1001, "ORANGE")).toBe(true)
  })

  it("buildingId 不存在时返回 false", async () => {
    const { updateBuildingRiskColor } = await importService()
    expect(updateBuildingRiskColor(9999, "ORANGE")).toBe(false)
  })

  it("buildingId 为区域节点（type='1'）时返回 false", async () => {
    const { updateBuildingRiskColor } = await importService()
    // 901 是区域节点，不是建筑
    expect(updateBuildingRiskColor(901, "ORANGE")).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — 写入 space_analysis_archive", () => {
  it("调用后 space_analysis_archive 新增 1 条记录", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    const rows = getTable("space_analysis_archive") as any[]
    expect(rows).toHaveLength(1)
  })

  it("新记录 space_id 为 buildingId", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    const rows = getTable("space_analysis_archive") as any[]
    expect(rows[0].space_id).toBe(1001)
  })

  it("新记录 risk_level 为传入颜色", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "RED")
    const rows = getTable("space_analysis_archive") as any[]
    expect(rows[0].risk_level).toBe("RED")
  })

  it("不存在的 buildingId 不写入 space_analysis_archive", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(9999, "ORANGE")
    const rows = getTable("space_analysis_archive") as any[]
    expect(rows).toHaveLength(0)
  })

  it("两次调用后 space_analysis_archive 有 2 条记录", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "ORANGE", "2024-03-07 08:00:00")
    updateBuildingRiskColor(1001, "RED",    "2024-03-07 09:00:00")
    const rows = getTable("space_analysis_archive") as any[]
    expect(rows).toHaveLength(2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — listBuildings 效果", () => {
  it("更新 ORANGE 后 listBuildings({riskLevel:'ORANGE'}) 包含 B001", async () => {
    const { updateBuildingRiskColor, listBuildings } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    const rows = listBuildings({ riskLevel: "ORANGE" })
    expect(rows.some(r => r.id === 1001)).toBe(true)
  })

  it("更新 RED 后 listBuildings({riskLevel:'RED'}) 包含 B002", async () => {
    const { updateBuildingRiskColor, listBuildings } = await importService()
    updateBuildingRiskColor(1002, "RED")
    const rows = listBuildings({ riskLevel: "RED" })
    expect(rows.some(r => r.id === 1002)).toBe(true)
  })

  it("RED→GREEN 后 listBuildings({riskLevel:'RED'}) 不再包含该建筑", async () => {
    const { updateBuildingRiskColor, listBuildings } = await importService()
    updateBuildingRiskColor(1001, "RED",   "2024-03-07 08:00:00")
    updateBuildingRiskColor(1001, "GREEN", "2024-03-07 09:00:00")
    const rows = listBuildings({ riskLevel: "RED" })
    expect(rows.every(r => r.id !== 1001)).toBe(true)
  })

  it("多栋建筑可独立更新不互相影响", async () => {
    const { updateBuildingRiskColor, listBuildings } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    updateBuildingRiskColor(1002, "RED")
    const orangeRows = listBuildings({ riskLevel: "ORANGE" })
    const redRows    = listBuildings({ riskLevel: "RED" })
    expect(orangeRows.some(r => r.id === 1001)).toBe(true)
    expect(redRows.some(r => r.id === 1002)).toBe(true)
    // B001 不在 RED 列表，B002 不在 ORANGE 列表
    expect(redRows.every(r => r.id !== 1001)).toBe(true)
    expect(orangeRows.every(r => r.id !== 1002)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — getBuilding 效果", () => {
  it("更新 ORANGE 后 getBuilding(1001).latestRiskLevel 为 'ORANGE'", async () => {
    const { updateBuildingRiskColor, getBuilding } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    expect(getBuilding(1001)!.latestRiskLevel).toBe("ORANGE")
  })

  it("更新 RED 后 getBuilding(1001).latestRisk.riskLevel 为 'RED'", async () => {
    const { updateBuildingRiskColor, getBuilding } = await importService()
    updateBuildingRiskColor(1001, "RED")
    expect(getBuilding(1001)!.latestRisk!.riskLevel).toBe("RED")
  })

  it("最新 calc_time 的颜色胜出（第二次 GREEN 覆盖第一次 ORANGE）", async () => {
    const { updateBuildingRiskColor, getBuilding } = await importService()
    updateBuildingRiskColor(1001, "ORANGE", "2024-03-07 08:00:00")
    updateBuildingRiskColor(1001, "GREEN",  "2024-03-07 09:00:00")
    expect(getBuilding(1001)!.latestRiskLevel).toBe("GREEN")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.36 updateBuildingRiskColor() — digital_archive 联动", () => {
  it("ORANGE 更新后 digital_archive.status 变为 30", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "ORANGE")
    const archives = getTable("digital_archive") as any[]
    const rec = archives.find((a: any) => a.building_id === 1001)
    expect(rec?.status).toBe(30)
  })

  it("RED 更新后 digital_archive.status 变为 40", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "RED")
    const archives = getTable("digital_archive") as any[]
    const rec = archives.find((a: any) => a.building_id === 1001)
    expect(rec?.status).toBe(40)
  })

  it("GREEN 更新后 digital_archive.status 变为 10（安全）", async () => {
    const { updateBuildingRiskColor } = await importService()
    updateBuildingRiskColor(1001, "RED",   "2024-03-07 08:00:00")
    updateBuildingRiskColor(1001, "GREEN", "2024-03-07 09:00:00")
    const archives = getTable("digital_archive") as any[]
    const rec = archives.find((a: any) => a.building_id === 1001)
    expect(rec?.status).toBe(10)
  })

  it("无档案记录时更新 ORANGE 不抛出异常", async () => {
    setTable("digital_archive", [])
    const { updateBuildingRiskColor } = await importService()
    expect(() => updateBuildingRiskColor(1001, "ORANGE")).not.toThrow()
  })
})
