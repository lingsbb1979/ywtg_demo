/**
 * T15.37 — 实现采集值列表查询 listTelemetry
 *
 * 可查看某建筑某数据点的历史采集值（来自 iot_telemetry）。
 *
 * 接口设计：
 *   listTelemetry({ pointId, buildingId?, startTime?, endTime?, limit? })
 *
 *   - pointId：必填，对应 iot_data_point.id
 *   - buildingId：可选，当传入时检查该数据点是否属于该建筑（space_id），
 *                 若不匹配返回空数组
 *   - startTime / endTime：可选，按 ts 字段范围筛选（字符串比较，格式 "YYYY-MM-DD HH:mm:ss"）
 *   - limit：可选，限制返回条数（取最新 N 条，按 ts 降序）
 *
 * 测试范围：
 *   - listTelemetry 可从 telemetryService 导入
 *   - 传入有效 pointId 返回该点所有记录
 *   - 传入无效 pointId 返回空数组
 *   - 按 startTime 筛选（>= startTime）
 *   - 按 endTime 筛选（<= endTime）
 *   - startTime + endTime 组合筛选
 *   - limit 限制返回条数（取最新 N 条）
 *   - buildingId 匹配时正常返回
 *   - buildingId 不匹配时返回空数组
 *   - 返回记录含 ts / pointId / valueNum 字段
 *   - 结果默认按 ts 升序排列
 *   - pointId 不存在时返回空数组（不抛出异常）
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedDataPoints, DATA_POINT_ROWS } from "../src/mock/seeds/seedDataPoints"
import { seedTelemetry, TELEMETRY_ROWS } from "../src/mock/seeds/seedTelemetry"

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
  seedDataPoints()   // 写入 iot_data_point（69 条）
  seedTelemetry()    // 写入 iot_telemetry（483 条）
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/telemetryService")
}

// ── B001 裂缝点 id ─────────────────────────────────────────────────────────────
// point_id = 10001 + 0×3 + 0 = 10001
const POINT_B001_CRACK  = 10001
const POINT_B001_TILT   = 10002
const POINT_B001_SETTLE = 10003
// B002 倾角：10001 + 1×3 + 1 = 10005
const POINT_B002_TILT   = 10005

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — 导出", () => {
  it("listTelemetry 可从 telemetryService 导入", async () => {
    const { listTelemetry } = await importService()
    expect(typeof listTelemetry).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — 基础查询", () => {
  it("pointId=10001 返回 7 条记录（7 天基线数据）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows).toHaveLength(7)
  })

  it("无效 pointId 返回空数组（不抛出异常）", async () => {
    const { listTelemetry } = await importService()
    expect(listTelemetry({ pointId: 99999 })).toEqual([])
  })

  it("每条记录含 ts 字段（字符串）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows.every(r => typeof r.ts === "string")).toBe(true)
  })

  it("每条记录含 pointId 字段，等于查询参数", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows.every(r => r.pointId === POINT_B001_CRACK)).toBe(true)
  })

  it("每条记录含 valueNum 字段（数字）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows.every(r => typeof r.valueNum === "number")).toBe(true)
  })

  it("结果默认按 ts 升序排列", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].ts >= rows[i - 1].ts).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — 时间范围筛选", () => {
  it("startTime='2024-03-05 00:00:00' 返回 3 条（3/5、3/6、3/7）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, startTime: "2024-03-05 00:00:00" })
    expect(rows).toHaveLength(3)
  })

  it("endTime='2024-03-03 23:59:59' 返回 3 条（3/1、3/2、3/3）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, endTime: "2024-03-03 23:59:59" })
    expect(rows).toHaveLength(3)
  })

  it("startTime + endTime 组合：3/03~3/05 返回 3 条", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({
      pointId:   POINT_B001_CRACK,
      startTime: "2024-03-03 00:00:00",
      endTime:   "2024-03-05 23:59:59",
    })
    expect(rows).toHaveLength(3)
  })

  it("startTime > 所有数据返回空数组", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, startTime: "2025-01-01 00:00:00" })
    expect(rows).toHaveLength(0)
  })

  it("endTime < 所有数据返回空数组", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, endTime: "2023-01-01 00:00:00" })
    expect(rows).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — limit 限制", () => {
  it("limit=3 返回最新 3 条", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, limit: 3 })
    expect(rows).toHaveLength(3)
  })

  it("limit=3 返回的是最新的 3 条（ts 最大的 3 条）", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, limit: 3 })
    // 最新 3 条应包含 2024-03-07
    expect(rows.some(r => r.ts.startsWith("2024-03-07"))).toBe(true)
    // 不应包含 2024-03-01
    expect(rows.every(r => !r.ts.startsWith("2024-03-01"))).toBe(true)
  })

  it("limit=1 返回最新 1 条", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, limit: 1 })
    expect(rows).toHaveLength(1)
    expect(rows[0].ts.startsWith("2024-03-07")).toBe(true)
  })

  it("limit 超过总数时返回全部", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, limit: 100 })
    expect(rows).toHaveLength(7)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — buildingId 校验", () => {
  it("buildingId=1001 且 point 属于 B001，正常返回数据", async () => {
    const { listTelemetry } = await importService()
    // POINT_B001_CRACK (10001) 的 space_id=1001
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, buildingId: 1001 })
    expect(rows).toHaveLength(7)
  })

  it("buildingId=1002 但 point 属于 B001，返回空数组", async () => {
    const { listTelemetry } = await importService()
    // POINT_B001_CRACK (10001) 的 space_id=1001，与 buildingId=1002 不匹配
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, buildingId: 1002 })
    expect(rows).toHaveLength(0)
  })

  it("buildingId=1002 且 point 属于 B002，正常返回数据", async () => {
    const { listTelemetry } = await importService()
    // POINT_B002_TILT (10005) 的 space_id=1002
    const rows = listTelemetry({ pointId: POINT_B002_TILT, buildingId: 1002 })
    expect(rows).toHaveLength(7)
  })

  it("buildingId=9999（不存在）返回空数组", async () => {
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK, buildingId: 9999 })
    expect(rows).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — 不同数据点独立", () => {
  it("不同因子的 point 互不干扰", async () => {
    const { listTelemetry } = await importService()
    const crackRows  = listTelemetry({ pointId: POINT_B001_CRACK })
    const tiltRows   = listTelemetry({ pointId: POINT_B001_TILT })
    const settleRows = listTelemetry({ pointId: POINT_B001_SETTLE })
    expect(crackRows).toHaveLength(7)
    expect(tiltRows).toHaveLength(7)
    expect(settleRows).toHaveLength(7)
    // 各点的 valueNum 不同（因子类型不同）
    expect(crackRows[0].valueNum).not.toBe(tiltRows[0].valueNum)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.37 listTelemetry() — 新增采集值可查询", () => {
  it("向 iot_telemetry 追加新记录后 listTelemetry 可查到", async () => {
    // 先追加一条高值记录（模拟告警触发后的采集值）
    const existing = [...TELEMETRY_ROWS]
    setTable("iot_telemetry", [
      ...existing,
      { ts: "2024-03-08 08:00:00", point_id: POINT_B001_CRACK, value_num: 2.8, value_str: null },
    ])
    const { listTelemetry } = await importService()
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows).toHaveLength(8)
    const latest = rows[rows.length - 1]
    expect(latest.ts).toBe("2024-03-08 08:00:00")
    expect(latest.valueNum).toBe(2.8)
  })
})
