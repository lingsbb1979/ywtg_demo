/**
 * T15.38 — 实现新增模拟采集值 addTelemetry
 *
 * 管理端手动输入裂缝值后写入 iot_telemetry。
 *
 * 接口设计：
 *   addTelemetry({ pointId, valueNum, ts? })
 *
 *   - pointId：必填，数据点 ID（需在 iot_data_point 中存在）
 *   - valueNum：必填，采集值（数字）
 *   - ts：可选，时间戳字符串（"YYYY-MM-DD HH:mm:ss"），不传则使用当前时间
 *
 *   返回值：
 *   - 成功：{ ok: true, ts: string }  （实际写入的 ts）
 *   - 失败：{ ok: false, error: string }
 *
 * 测试范围：
 *   - addTelemetry 可从 telemetryService 导入
 *   - 写入成功返回 { ok: true, ts: string }
 *   - pointId 不存在时返回 { ok: false, error: string }
 *   - 写入后 listTelemetry 可查到新记录
 *   - 自定义 ts 写入后可用 listTelemetry 精确查到
 *   - 不传 ts 时自动填充当前时间（ts 字段不为空）
 *   - 写入后原有记录数量不变（追加而非覆盖）
 *   - valueNum 可为小数
 *   - valueNum 为 0 时也能写入
 *   - 同一 pointId 可多次写入（按 ts 升序排列）
 *   - 写入不影响其他 point 的数据
 *   - valueStr 字段默认为 null
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedDataPoints } from "../src/mock/seeds/seedDataPoints"
import { seedTelemetry } from "../src/mock/seeds/seedTelemetry"

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
  seedDataPoints()
  seedTelemetry()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/telemetryService")
}

// B001 裂缝点：10001，倾角：10002
const POINT_B001_CRACK = 10001
const POINT_B001_TILT  = 10002
// B002 裂缝点：10004
const POINT_B002_CRACK = 10004

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.38 addTelemetry() — 导出", () => {
  it("addTelemetry 可从 telemetryService 导入", async () => {
    const { addTelemetry } = await importService()
    expect(typeof addTelemetry).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.38 addTelemetry() — 写入成功", () => {
  it("写入成功返回 { ok: true }", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 10:00:00" })
    expect(result.ok).toBe(true)
  })

  it("写入成功返回的 ts 与传入一致", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 10:00:00" })
    expect(result.ok && result.ts).toBe("2024-03-08 10:00:00")
  })

  it("不传 ts 时 ok=true 且 ts 字段不为空", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 1.5 })
    expect(result.ok).toBe(true)
    expect(result.ok && result.ts.length).toBeGreaterThan(0)
  })

  it("valueNum 可为小数（2.85）", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.85, ts: "2024-03-08 11:00:00" })
    expect(result.ok).toBe(true)
  })

  it("valueNum 为 0 也能成功写入", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 0, ts: "2024-03-08 12:00:00" })
    expect(result.ok).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.38 addTelemetry() — 写入失败", () => {
  it("pointId 不存在时返回 { ok: false }", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: 99999, valueNum: 1.0, ts: "2024-03-08 10:00:00" })
    expect(result.ok).toBe(false)
  })

  it("pointId 不存在时 error 字段为字符串", async () => {
    const { addTelemetry } = await importService()
    const result = addTelemetry({ pointId: 99999, valueNum: 1.0 })
    expect(!result.ok && typeof result.error).toBe("string")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.38 addTelemetry() — 数据持久化", () => {
  it("写入后 listTelemetry 可查到（由 7 条变为 8 条）", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows).toHaveLength(8)
  })

  it("查到的新记录 ts 与写入一致", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 09:00:00" })
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    const latest = rows[rows.length - 1]
    expect(latest.ts).toBe("2024-03-08 09:00:00")
  })

  it("查到的新记录 valueNum 与写入一致", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 3.14, ts: "2024-03-08 10:00:00" })
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    const latest = rows[rows.length - 1]
    expect(latest.valueNum).toBe(3.14)
  })

  it("新记录 valueStr 默认为 null", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.0, ts: "2024-03-08 11:00:00" })
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    const latest = rows[rows.length - 1]
    expect(latest.valueStr).toBeNull()
  })

  it("同一 point 多次写入（2 条），共 9 条", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.0, ts: "2024-03-08 08:00:00" })
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.5, ts: "2024-03-09 08:00:00" })
    const rows = listTelemetry({ pointId: POINT_B001_CRACK })
    expect(rows).toHaveLength(9)
  })

  it("写入不影响其他 point 的数据", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const tiltRows = listTelemetry({ pointId: POINT_B001_TILT })
    expect(tiltRows).toHaveLength(7)  // B001 倾角点未受影响
  })

  it("写入 B001 不影响 B002 的数据", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 08:00:00" })
    const b2Rows = listTelemetry({ pointId: POINT_B002_CRACK })
    expect(b2Rows).toHaveLength(7)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.38 addTelemetry() — 场景：管理端手动录入裂缝值", () => {
  it("告警触发场景：录入 2.8mm 后 listTelemetry 可按时间筛到", async () => {
    const { addTelemetry, listTelemetry } = await importService()
    addTelemetry({ pointId: POINT_B001_CRACK, valueNum: 2.8, ts: "2024-03-08 14:30:00" })
    const rows = listTelemetry({
      pointId:   POINT_B001_CRACK,
      startTime: "2024-03-08 00:00:00",
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].valueNum).toBe(2.8)
  })
})
