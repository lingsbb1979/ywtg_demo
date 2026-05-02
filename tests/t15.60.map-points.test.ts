/**
 * T15.60 — 实现地图点位选择器 selectMapPoints
 *
 * 输出 23 栋建筑的点位信息、风险等级、颜色和弹窗摘要，用于大屏中央地图渲染。
 *
 * 函数签名：
 *   selectMapPoints(): MapPoint[]
 *
 * 逻辑：
 *   - 取 iot_space.type="2" 的全部建筑
 *   - 对每栋建筑，统计 alarm_record 中 building_id 匹配且 status ≠ CLOSED/CANCELLED 的告警
 *   - 风险等级 = 未销号告警中最高 alarm_level（RED > ORANGE > YELLOW，无告警→GREEN）
 *   - 颜色映射：RED→"red", ORANGE→"orange", YELLOW→"yellow", GREEN→"green"
 *   - summary：有告警时 "{n} 条未销号告警"，无告警时 "安全"
 *
 * 返回字段（每条）：
 *   id, spaceCode, name, latitude, longitude, riskLevel, color, openCount, summary
 *
 * 测试范围（22 条）：
 *   - 导出检查
 *   - 无数据时返回空数组
 *   - 返回数组长度=建筑数
 *   - 只返回 type="2" 的建筑
 *   - 含字段 id / spaceCode / name / latitude / longitude
 *   - 无告警建筑 riskLevel="GREEN", color="green", openCount=0, summary="安全"
 *   - 有 YELLOW 告警时 riskLevel="YELLOW", color="yellow"
 *   - 有 ORANGE 告警时 riskLevel="ORANGE", color="orange"
 *   - 有 RED 告警时 riskLevel="RED", color="red"
 *   - 多级告警取最高级（ORANGE+YELLOW→ORANGE）
 *   - CLOSED 告警不影响风险等级
 *   - openCount 统计非 CLOSED/CANCELLED 的告警数
 *   - summary 有告警时含告警数
 *   - 不同建筑独立计算（互不影响）
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"

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
  setTable("iot_space",    [])
  setTable("alarm_record", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/screenKpiService")
}

const SPACE_A = { id: 1001, space_code: "B001", name: "建筑A", type: "2", latitude: 46.82, longitude: 130.36 }
const SPACE_B = { id: 1002, space_code: "B002", name: "建筑B", type: "2", latitude: 46.83, longitude: 130.37 }
const SPACE_STREET = { id: 1, space_code: "D001", name: "某街道", type: "1", latitude: null, longitude: null }

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 导出", () => {
  it("selectMapPoints 可从 screenKpiService 导入", async () => {
    const { selectMapPoints } = await importService()
    expect(typeof selectMapPoints).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 空数据", () => {
  it("无建筑时返回空数组", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()).toEqual([])
  })

  it("只有非建筑空间时返回空数组", async () => {
    setTable("iot_space", [SPACE_STREET])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 点位基础信息", () => {
  beforeEach(() => setTable("iot_space", [SPACE_A, SPACE_B]))

  it("返回 2 条点位", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints().length).toBe(2)
  })

  it("含 id 字段", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].id).toBe(1001)
  })

  it("含 spaceCode 字段", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].spaceCode).toBe("B001")
  })

  it("含 name 字段", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].name).toBe("建筑A")
  })

  it("含 latitude 字段", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].latitude).toBe(46.82)
  })

  it("含 longitude 字段", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].longitude).toBe(130.36)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 无告警建筑", () => {
  beforeEach(() => setTable("iot_space", [SPACE_A]))

  it("riskLevel='GREEN'", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].riskLevel).toBe("GREEN")
  })

  it("color='green'", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].color).toBe("green")
  })

  it("openCount=0", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].openCount).toBe(0)
  })

  it("summary='安全'", async () => {
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].summary).toBe("安全")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 风险等级映射", () => {
  beforeEach(() => setTable("iot_space", [SPACE_A]))

  it("YELLOW 告警 → riskLevel=YELLOW, color=yellow", async () => {
    setTable("alarm_record", [{ id: 1, building_id: 1001, alarm_level: "YELLOW", status: "ACTIVE" }])
    const { selectMapPoints } = await importService()
    const pt = selectMapPoints()[0]
    expect(pt.riskLevel).toBe("YELLOW")
    expect(pt.color).toBe("yellow")
  })

  it("ORANGE 告警 → riskLevel=ORANGE, color=orange", async () => {
    setTable("alarm_record", [{ id: 1, building_id: 1001, alarm_level: "ORANGE", status: "ACTIVE" }])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].riskLevel).toBe("ORANGE")
    expect(selectMapPoints()[0].color).toBe("orange")
  })

  it("RED 告警 → riskLevel=RED, color=red", async () => {
    setTable("alarm_record", [{ id: 1, building_id: 1001, alarm_level: "RED", status: "ACTIVE" }])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].riskLevel).toBe("RED")
    expect(selectMapPoints()[0].color).toBe("red")
  })

  it("ORANGE+YELLOW 取最高 ORANGE", async () => {
    setTable("alarm_record", [
      { id: 1, building_id: 1001, alarm_level: "YELLOW", status: "ACTIVE" },
      { id: 2, building_id: 1001, alarm_level: "ORANGE", status: "PENDING" },
    ])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].riskLevel).toBe("ORANGE")
  })

  it("CLOSED 告警不影响风险等级", async () => {
    setTable("alarm_record", [{ id: 1, building_id: 1001, alarm_level: "RED", status: "CLOSED" }])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].riskLevel).toBe("GREEN")
  })

  it("openCount 统计非 CLOSED/CANCELLED 告警数", async () => {
    setTable("alarm_record", [
      { id: 1, building_id: 1001, alarm_level: "ORANGE", status: "ACTIVE"    },
      { id: 2, building_id: 1001, alarm_level: "YELLOW", status: "PENDING"   },
      { id: 3, building_id: 1001, alarm_level: "RED",    status: "CLOSED"    },
      { id: 4, building_id: 1001, alarm_level: "RED",    status: "CANCELLED" },
    ])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].openCount).toBe(2)
  })

  it("summary 有告警时包含数量", async () => {
    setTable("alarm_record", [
      { id: 1, building_id: 1001, alarm_level: "ORANGE", status: "ACTIVE" },
      { id: 2, building_id: 1001, alarm_level: "YELLOW", status: "ACTIVE" },
    ])
    const { selectMapPoints } = await importService()
    expect(selectMapPoints()[0].summary).toContain("2")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.60 selectMapPoints() — 多建筑独立计算", () => {
  it("不同建筑独立计算风险等级", async () => {
    setTable("iot_space", [SPACE_A, SPACE_B])
    setTable("alarm_record", [
      { id: 1, building_id: 1001, alarm_level: "RED",    status: "ACTIVE" },
      { id: 2, building_id: 1002, alarm_level: "YELLOW", status: "ACTIVE" },
    ])
    const { selectMapPoints } = await importService()
    const ptA = selectMapPoints().find((p: any) => p.id === 1001)
    const ptB = selectMapPoints().find((p: any) => p.id === 1002)
    expect(ptA!.riskLevel).toBe("RED")
    expect(ptB!.riskLevel).toBe("YELLOW")
  })
})
