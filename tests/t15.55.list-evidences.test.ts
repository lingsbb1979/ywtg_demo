/**
 * T15.55 — 实现证据列表查询 listEvidences
 *
 * PC 工单详情侧边栏可查看 H5 提交的全部证据记录（work_order_disposal 按时间升序）。
 *
 * 业务规则：
 *   - listEvidences(orderId) 返回该工单所有 work_order_disposal 行
 *   - 按 disposal_time 升序排列
 *   - 无记录时返回空数组
 *   - orderId 不存在的工单也允许查询（透传空数组）
 *   - 返回字段：id, orderId, userId, gpsLocation, addressDesc,
 *               imageUrls, videoUrl, evidenceDesc, evidenceTime, createTime
 *
 * 测试范围：
 *   - listEvidences 可从 workOrderService 导入
 *   - 无证据时返回空数组
 *   - 返回的是数组
 *   - 有 2 条记录时返回 2 条
 *   - 按 disposal_time 升序排列
 *   - 每条记录含 id
 *   - 每条含 orderId
 *   - 每条含 imageUrls
 *   - 每条含 gpsLocation
 *   - 每条含 evidenceDesc
 *   - 每条含 evidenceTime
 *   - orderId 不匹配返回空数组
 *   - 只返回属于该 orderId 的记录
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
  setTable("work_order_disposal", [])
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/workOrderService")
}

const ROW1 = {
  id: 1, order_id: 101, user_id: 201,
  gps_location: "31.23,121.47",
  address_desc: "南侧外墙",
  image_urls: '["a.jpg"]',
  video_url: null,
  disposal_desc: "裂缝 2mm",
  disposal_time: "2024-03-08 10:00:00",
  create_time:   "2024-03-08 10:00:00",
}

const ROW2 = {
  id: 2, order_id: 101, user_id: 201,
  gps_location: "31.24,121.48",
  address_desc: "北侧外墙",
  image_urls: '["b.jpg"]',
  video_url: null,
  disposal_desc: "渗水迹象",
  disposal_time: "2024-03-08 11:00:00",
  create_time:   "2024-03-08 11:00:00",
}

const ROW_OTHER = {
  id: 3, order_id: 999, user_id: 202,
  gps_location: null,
  address_desc: null,
  image_urls: null,
  video_url: null,
  disposal_desc: "其他工单证据",
  disposal_time: "2024-03-08 09:00:00",
  create_time:   "2024-03-08 09:00:00",
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.55 listEvidences() — 导出", () => {
  it("listEvidences 可从 workOrderService 导入", async () => {
    const { listEvidences } = await importService()
    expect(typeof listEvidences).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.55 listEvidences() — 空数据", () => {
  it("无证据时返回空数组", async () => {
    const { listEvidences } = await importService()
    expect(listEvidences(101)).toEqual([])
  })

  it("返回结果是数组", async () => {
    const { listEvidences } = await importService()
    expect(Array.isArray(listEvidences(101))).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.55 listEvidences() — 正常查询", () => {
  beforeEach(() => setTable("work_order_disposal", [ROW1, ROW2]))

  it("有 2 条记录时返回 2 条", async () => {
    const { listEvidences } = await importService()
    expect(listEvidences(101).length).toBe(2)
  })

  it("按 disposal_time 升序排列", async () => {
    // ROW2 在前存入，ROW1 第一 → 已升序
    setTable("work_order_disposal", [ROW2, ROW1])
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].evidenceTime).toBe("2024-03-08 10:00:00")
    expect(list[1].evidenceTime).toBe("2024-03-08 11:00:00")
  })

  it("每条记录含 id", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(typeof list[0].id).toBe("number")
  })

  it("每条含 orderId", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].orderId).toBe(101)
  })

  it("每条含 imageUrls", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].imageUrls).toBe('["a.jpg"]')
  })

  it("每条含 gpsLocation", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].gpsLocation).toBe("31.23,121.47")
  })

  it("每条含 evidenceDesc", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].evidenceDesc).toBe("裂缝 2mm")
  })

  it("每条含 evidenceTime", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].evidenceTime).toBe("2024-03-08 10:00:00")
  })

  it("每条含 userId", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list[0].userId).toBe(201)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.55 listEvidences() — 过滤", () => {
  beforeEach(() => setTable("work_order_disposal", [ROW1, ROW2, ROW_OTHER]))

  it("orderId 不匹配返回空数组", async () => {
    const { listEvidences } = await importService()
    expect(listEvidences(9999)).toEqual([])
  })

  it("只返回属于 orderId=101 的记录（共 2 条）", async () => {
    const { listEvidences } = await importService()
    expect(listEvidences(101).length).toBe(2)
  })

  it("不含 orderId=999 的记录", async () => {
    const { listEvidences } = await importService()
    const list = listEvidences(101)
    expect(list.every((r) => r.orderId === 101)).toBe(true)
  })
})
