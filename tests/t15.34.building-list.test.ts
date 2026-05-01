/**
 * T15.34 — 实现建筑列表查询 listBuildings
 *
 * 管理端可按风险等级、区域、关键字查询 iot_space 中的历史建筑。
 * 服务从 localStorage 读取：
 *   - iot_space（type="2" 建筑行）
 *   - space_analysis_archive（取每栋建筑最新计算结果的 risk_level）
 *   - digital_archive（取每栋建筑的档案状态 status）
 *
 * 测试范围：
 *   - listBuildings 函数可从 buildingService 导入
 *   - 无参数时返回全部 23 栋建筑，不含区域节点（type="1"）
 *   - 按 regionId 筛选（向阳区 8 栋、前进区 8 栋、东风区 7 栋）
 *   - 按 keyword 筛选（name / short_name 不区分大小写）
 *   - 按 riskLevel 筛选（来自 space_analysis_archive 最新记录）
 *   - 组合筛选：regionId + keyword
 *   - 无匹配时返回空数组
 *   - 每条结果含 id / spaceCode / name / latestRiskLevel / archiveStatus 字段
 *   - latestRiskLevel：无分析记录时为 null
 *   - archiveStatus：无档案时为 null
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { setTable } from "../src/services/sqliteMirrorRepository"
import { seedBuildings } from "../src/mock/seeds/seedBuildings"
import { seedSpaceRelation, SPACE_REGION_XIANGYANG_ID, SPACE_REGION_QIANJIN_ID, SPACE_REGION_DONGFENG_ID }
  from "../src/mock/seeds/seedSpaceRelation"

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
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

async function importService() {
  return import("../src/services/buildingService")
}

// ── 注入辅助数据 ──────────────────────────────────────────────────────────────

/** 向 space_analysis_archive 注入若干风险记录 */
function injectAnalysisArchive(rows: object[]) {
  setTable("space_analysis_archive", rows)
}

/** 向 digital_archive 注入（替换）若干档案状态记录 */
function injectDigitalArchive(rows: object[]) {
  setTable("digital_archive", rows)
}

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 导出", () => {
  it("listBuildings 可从 buildingService 导入", async () => {
    const { listBuildings } = await importService()
    expect(typeof listBuildings).toBe("function")
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 全量查询", () => {
  it("无参数时返回 23 条记录", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows).toHaveLength(23)
  })

  it("不含区域节点（type='1'）", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => r.spaceCode.startsWith("B"))).toBe(true)
  })

  it("所有记录含 id 字段", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => typeof r.id === "number")).toBe(true)
  })

  it("所有记录含 spaceCode 字段", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => typeof r.spaceCode === "string")).toBe(true)
  })

  it("所有记录含 name 字段（非空字符串）", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => typeof r.name === "string" && r.name.length > 0)).toBe(true)
  })

  it("无分析记录时 latestRiskLevel 均为 null", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => r.latestRiskLevel === null)).toBe(true)
  })

  it("seedSpaceRelation 已写入档案时 archiveStatus 为数字", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    // seedSpaceRelation 写入了 digital_archive，status=10（安全）
    expect(rows.every(r => r.archiveStatus === 10)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 按区域筛选", () => {
  it("向阳区（regionId=901）返回 8 栋", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_XIANGYANG_ID })
    expect(rows).toHaveLength(8)
  })

  it("前进区（regionId=902）返回 8 栋", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_QIANJIN_ID })
    expect(rows).toHaveLength(8)
  })

  it("东风区（regionId=903）返回 7 栋", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_DONGFENG_ID })
    expect(rows).toHaveLength(7)
  })

  it("向阳区 8 栋的 parentId 均为 901", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_XIANGYANG_ID })
    expect(rows.every(r => r.parentId === SPACE_REGION_XIANGYANG_ID)).toBe(true)
  })

  it("不存在的 regionId 返回空数组", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: 999 })
    expect(rows).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 按关键字筛选", () => {
  it("keyword='向阳路' 匹配 B001（向阳路1号历史建筑）", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ keyword: "向阳路" })
    expect(rows.some(r => r.spaceCode === "B001")).toBe(true)
  })

  it("keyword='中山' 匹配 B002（中山街旧址建筑）", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ keyword: "中山" })
    expect(rows.some(r => r.spaceCode === "B002")).toBe(true)
  })

  it("keyword='历史公寓' 可通过 name 匹配 B007", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ keyword: "历史公寓" })
    expect(rows.some(r => r.spaceCode === "B007")).toBe(true)
  })

  it("keyword='向阳1号' 可通过 short_name 匹配 B001", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ keyword: "向阳1号" })
    expect(rows.some(r => r.spaceCode === "B001")).toBe(true)
  })

  it("keyword 不存在时返回空数组", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ keyword: "不存在的建筑XYZ" })
    expect(rows).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 按风险等级筛选", () => {
  it("注入 ORANGE 记录后按 riskLevel='ORANGE' 可筛出 B001", async () => {
    injectAnalysisArchive([
      {
        id: 1, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-07 08:00:00", value_num: 2.8,
        risk_level: "ORANGE", status_code: "H",
        source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
      },
    ])
    const { listBuildings } = await importService()
    const rows = listBuildings({ riskLevel: "ORANGE" })
    expect(rows).toHaveLength(1)
    expect(rows[0].spaceCode).toBe("B001")
    expect(rows[0].latestRiskLevel).toBe("ORANGE")
  })

  it("注入 RED 记录后按 riskLevel='RED' 可筛出 B002", async () => {
    injectAnalysisArchive([
      {
        id: 2, space_id: 1002, metric_id: 2,
        calc_time: "2024-03-07 09:00:00", value_num: 3.5,
        risk_level: "RED", status_code: "HH",
        source_data_ids: "[10005]", create_time: "2024-03-07 09:00:00",
      },
    ])
    const { listBuildings } = await importService()
    const rows = listBuildings({ riskLevel: "RED" })
    expect(rows).toHaveLength(1)
    expect(rows[0].spaceCode).toBe("B002")
    expect(rows[0].latestRiskLevel).toBe("RED")
  })

  it("多建筑多记录时取最新 calc_time 的 risk_level", async () => {
    injectAnalysisArchive([
      // B001 旧记录 ORANGE
      {
        id: 1, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-06 08:00:00", value_num: 2.8,
        risk_level: "ORANGE", status_code: "H",
        source_data_ids: "[10001]", create_time: "2024-03-06 08:00:00",
      },
      // B001 最新记录 GREEN（已恢复）
      {
        id: 2, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-07 08:00:00", value_num: 0.5,
        risk_level: "GREEN", status_code: "NORMAL",
        source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
      },
    ])
    const { listBuildings } = await importService()
    const all = listBuildings()
    const b001 = all.find(r => r.spaceCode === "B001")!
    expect(b001.latestRiskLevel).toBe("GREEN")
  })

  it("riskLevel='GREEN' 无匹配时返回空数组（无注入数据时）", async () => {
    const { listBuildings } = await importService()
    // 无任何分析记录，latestRiskLevel 均为 null，GREEN 不匹配
    const rows = listBuildings({ riskLevel: "GREEN" })
    expect(rows).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 组合筛选", () => {
  it("regionId + keyword 组合：向阳区 + '中山' → 匹配 B002", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_XIANGYANG_ID, keyword: "中山" })
    expect(rows.some(r => r.spaceCode === "B002")).toBe(true)
    expect(rows.every(r => r.parentId === SPACE_REGION_XIANGYANG_ID)).toBe(true)
  })

  it("regionId + keyword 无交集时返回空数组", async () => {
    const { listBuildings } = await importService()
    // 向阳区内不可能有前进区的建筑名
    const rows = listBuildings({ regionId: SPACE_REGION_XIANGYANG_ID, keyword: "煤炭" })
    expect(rows).toHaveLength(0)
  })

  it("regionId + riskLevel 组合：前进区 + ORANGE → 只含 B009-B016 中风险为 ORANGE 的", async () => {
    injectAnalysisArchive([
      // B001 向阳区 ORANGE
      {
        id: 1, space_id: 1001, metric_id: 1,
        calc_time: "2024-03-07 08:00:00", value_num: 2.8,
        risk_level: "ORANGE", status_code: "H",
        source_data_ids: "[10001]", create_time: "2024-03-07 08:00:00",
      },
      // B009 前进区 ORANGE
      {
        id: 2, space_id: 1009, metric_id: 1,
        calc_time: "2024-03-07 08:00:00", value_num: 3.1,
        risk_level: "ORANGE", status_code: "H",
        source_data_ids: "[10025]", create_time: "2024-03-07 08:00:00",
      },
    ])
    const { listBuildings } = await importService()
    const rows = listBuildings({ regionId: SPACE_REGION_QIANJIN_ID, riskLevel: "ORANGE" })
    // 只有 B009（前进区且 ORANGE）
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(1009)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
describe("T15.34 listBuildings() — 返回结构", () => {
  it("每条记录含 parentId 字段", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => "parentId" in r)).toBe(true)
  })

  it("每条记录含 latestRiskLevel 字段", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => "latestRiskLevel" in r)).toBe(true)
  })

  it("每条记录含 archiveStatus 字段", async () => {
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => "archiveStatus" in r)).toBe(true)
  })

  it("无档案记录时 archiveStatus 为 null", async () => {
    // 清空 digital_archive
    setTable("digital_archive", [])
    const { listBuildings } = await importService()
    const rows = listBuildings()
    expect(rows.every(r => r.archiveStatus === null)).toBe(true)
  })
})
