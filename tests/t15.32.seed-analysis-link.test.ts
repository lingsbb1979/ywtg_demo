/**
 * T15.32 — 初始化分析配置 seedAnalysisLink
 *
 * 在 T15.31 模板基础上，让 space_analysis_config 每条记录的
 * input_source_json 明确包含具体的 point_id 数组，
 * 把建筑（space_id）、数据点（point_ids）、公式（params_json）关联起来。
 *
 * 测试范围：
 *   - seedAnalysisLink 函数可导入
 *   - ANALYSIS_LINK_ROWS 常量导出（数组，69 条）
 *   - 调用后 space_analysis_config 共 69 条
 *   - 每条记录 input_source_json 包含 point_ids 数组
 *   - 裂缝配置（metric_id=1）point_ids 只含 crack point_id
 *   - 倾角配置（metric_id=2）point_ids 只含 tilt point_id
 *   - 综合评分配置（metric_id=3）point_ids 含 crack/tilt/settle 三个 point_id
 *   - 所有 point_ids 均在 iot_data_point 范围内（10001-10069）
 *   - 字段符合 space_analysis_config 白名单
 *   - 幂等：重复调用不累加
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"
import { TableRegistry } from "../src/models/tableRegistry"
import { BUILDING_SEED_ROWS } from "../src/mock/seeds/seedBuildings"
import { DATA_POINT_ROWS } from "../src/mock/seeds/seedDataPoints"

// ── fake localStorage ────────────────────────────────────────────────────────

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
  setTable("iot_space", BUILDING_SEED_ROWS)
  setTable("iot_data_point", DATA_POINT_ROWS)
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importSeed() {
  return import("../src/mock/seeds/seedAnalysisLink")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.32 seedAnalysisLink() — 导出", () => {
  it("应导出 seedAnalysisLink 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedAnalysisLink).toBe("function")
  })

  it("应导出 ANALYSIS_LINK_ROWS 数组", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.ANALYSIS_LINK_ROWS)).toBe(true)
  })

  it("ANALYSIS_LINK_ROWS 长度为 69（23 栋 × 3 指标）", async () => {
    const { ANALYSIS_LINK_ROWS } = await importSeed()
    expect(ANALYSIS_LINK_ROWS).toHaveLength(69)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.32 seedAnalysisLink() — input_source_json 关联", () => {
  it("每条记录 input_source_json 包含 point_ids 数组", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    for (const row of rows) {
      const src = JSON.parse(row.input_source_json)
      expect(Array.isArray(src.point_ids), `id=${row.id} 缺少 point_ids`).toBe(true)
      expect(src.point_ids.length, `id=${row.id} point_ids 为空`).toBeGreaterThan(0)
    }
  })

  it("裂缝配置（metric_id=1）point_ids 只含 1 个 crack 数据点", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    const crackRows = rows.filter((r) => r.metric_id === 1)
    for (const row of crackRows) {
      const src = JSON.parse(row.input_source_json)
      expect(src.point_ids).toHaveLength(1)
      // crack point_ids: 10001, 10004, 10007, ... (index % 3 === 0 from 10001)
      const pid = src.point_ids[0]
      expect((pid - 10001) % 3, `crack point_id=${pid} 不是裂缝传感器`).toBe(0)
    }
  })

  it("倾角配置（metric_id=2）point_ids 只含 1 个 tilt 数据点", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    const tiltRows = rows.filter((r) => r.metric_id === 2)
    for (const row of tiltRows) {
      const src = JSON.parse(row.input_source_json)
      expect(src.point_ids).toHaveLength(1)
      const pid = src.point_ids[0]
      expect((pid - 10001) % 3, `tilt point_id=${pid} 不是倾角传感器`).toBe(1)
    }
  })

  it("综合评分配置（metric_id=3）point_ids 含 3 个数据点（crack/tilt/settle）", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    const scoreRows = rows.filter((r) => r.metric_id === 3)
    for (const row of scoreRows) {
      const src = JSON.parse(row.input_source_json)
      expect(src.point_ids).toHaveLength(3)
    }
  })

  it("所有 point_ids 均在 10001-10069 范围内", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    for (const row of rows) {
      const src = JSON.parse(row.input_source_json)
      for (const pid of src.point_ids) {
        expect(pid >= 10001 && pid <= 10069, `point_id=${pid} 越界`).toBe(true)
      }
    }
  })

  it("每栋建筑 metric_id=3 的 point_ids 与该建筑 metric_id=1/2 的 point_ids 完全对应", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    for (let spaceId = 1001; spaceId <= 1023; spaceId++) {
      const crackRow  = rows.find((r) => r.space_id === spaceId && r.metric_id === 1)
      const tiltRow   = rows.find((r) => r.space_id === spaceId && r.metric_id === 2)
      const settleRow = rows.find((r) => r.space_id === spaceId && r.metric_id === 3)
      const crackPid  = JSON.parse(crackRow.input_source_json).point_ids[0]
      const tiltPid   = JSON.parse(tiltRow.input_source_json).point_ids[0]
      const scorePids = JSON.parse(settleRow.input_source_json).point_ids
      expect(scorePids).toContain(crackPid)
      expect(scorePids).toContain(tiltPid)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.32 seedAnalysisLink() — 字段合法性", () => {
  it("所有字段均在白名单内", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    const allowed = TableRegistry["space_analysis_config"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有配置 is_enabled=1", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const rows = getTable("space_analysis_config") as any[]
    expect(rows.every((r) => r.is_enabled === 1)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.32 seedAnalysisLink() — 幂等性", () => {
  it("重复调用两次，space_analysis_config 数量不累加", async () => {
    const { seedAnalysisLink } = await importSeed()
    seedAnalysisLink()
    const count1 = (getTable("space_analysis_config") as any[]).length
    seedAnalysisLink()
    const count2 = (getTable("space_analysis_config") as any[]).length
    expect(count2).toBe(count1)
  })
})
