/**
 * T15.30 — 初始化基线采集值 seedTelemetry
 *
 * 测试范围：
 *   - seedTelemetry 函数可从 src/mock/seeds/seedTelemetry.ts 导入
 *   - TELEMETRY_ROWS 常量导出（数组）
 *   - 调用后 iot_telemetry 共有 483 条（69 个数据点 × 7 天）
 *   - 每个数据点 point_id（10001-10069）均有 7 条记录
 *   - 所有值处于正常状态（低于告警阈值 limit_h）
 *   - 字段符合 iot_telemetry 白名单（ts / point_id / value_num / value_str）
 *   - 幂等：重复调用不累加
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getTable, setTable } from "../src/services/sqliteMirrorRepository"
import { TableRegistry } from "../src/models/tableRegistry"
import { BUILDING_SEED_ROWS } from "../src/mock/seeds/seedBuildings"
import { DATA_POINT_ROWS } from "../src/mock/seeds/seedDataPoints"

// 与 seedDataPoints 中保持一致的阈值
const CRACK_LIMIT_H  = 2.0   // mm
const TILT_LIMIT_H   = 1.0   // °
const SETTLE_LIMIT_H = 10.0  // mm

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
  return import("../src/mock/seeds/seedTelemetry")
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.30 seedTelemetry() — 导出", () => {
  it("seedTelemetry.ts 应导出 seedTelemetry 函数", async () => {
    const mod = await importSeed()
    expect(typeof mod.seedTelemetry).toBe("function")
  })

  it("seedTelemetry.ts 应导出 TELEMETRY_ROWS 常量（数组）", async () => {
    const mod = await importSeed()
    expect(Array.isArray(mod.TELEMETRY_ROWS)).toBe(true)
  })

  it("TELEMETRY_ROWS 长度为 483（69 × 7 天）", async () => {
    const { TELEMETRY_ROWS } = await importSeed()
    expect(TELEMETRY_ROWS).toHaveLength(483)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.30 seedTelemetry() — 数据量", () => {
  it("调用后 iot_telemetry 共 483 条", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    expect(rows).toHaveLength(483)
  })

  it("每个 point_id（10001-10069）各有 7 条记录", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    for (let pid = 10001; pid <= 10069; pid++) {
      const pts = rows.filter((r) => r.point_id === pid)
      expect(pts, `point_id=${pid} 应有 7 条`).toHaveLength(7)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.30 seedTelemetry() — 值域（正常状态 < limit_h）", () => {
  it("裂缝数据点（point_id % 3 === 1）所有值低于 limit_h=2.0mm", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    // 裂缝 point_id: 10001, 10004, 10007, ... (每组第1个，即 (pid - 10001) % 3 === 0)
    const crackRows = rows.filter((r) => (r.point_id - 10001) % 3 === 0)
    expect(crackRows.length).toBeGreaterThan(0)
    expect(crackRows.every((r) => r.value_num < CRACK_LIMIT_H)).toBe(true)
  })

  it("倾角数据点所有值低于 limit_h=1.0°", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    const tiltRows = rows.filter((r) => (r.point_id - 10001) % 3 === 1)
    expect(tiltRows.length).toBeGreaterThan(0)
    expect(tiltRows.every((r) => r.value_num < TILT_LIMIT_H)).toBe(true)
  })

  it("沉降数据点所有值低于 limit_h=10.0mm", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    const settleRows = rows.filter((r) => (r.point_id - 10001) % 3 === 2)
    expect(settleRows.length).toBeGreaterThan(0)
    expect(settleRows.every((r) => r.value_num < SETTLE_LIMIT_H)).toBe(true)
  })

  it("所有值 value_num > 0", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    expect(rows.every((r) => r.value_num > 0)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.30 seedTelemetry() — 字段合法性", () => {
  it("iot_telemetry 所有字段均在白名单内", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    const allowed = TableRegistry["iot_telemetry"]
    for (const row of rows) {
      const illegal = Object.keys(row).filter((k) => !allowed.includes(k))
      expect(illegal, `非法字段：${illegal.join(", ")}`).toHaveLength(0)
    }
  })

  it("所有记录 ts 字段为 ISO 格式字符串（含日期）", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    const tsPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    expect(rows.every((r) => tsPattern.test(r.ts))).toBe(true)
  })

  it("所有记录 point_id 为 10001-10069 范围内的整数", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const rows = getTable("iot_telemetry") as any[]
    expect(rows.every((r) => r.point_id >= 10001 && r.point_id <= 10069)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.30 seedTelemetry() — 幂等性", () => {
  it("重复调用两次，iot_telemetry 数量不累加", async () => {
    const { seedTelemetry } = await importSeed()
    seedTelemetry()
    const count1 = (getTable("iot_telemetry") as any[]).length
    seedTelemetry()
    const count2 = (getTable("iot_telemetry") as any[]).length
    expect(count2).toBe(count1)
  })
})
