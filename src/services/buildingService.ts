/**
 * T15.34 — 建筑列表查询 buildingService
 *
 * 从 localStorage（SQLiteMirror）中查询 iot_space（type="2" 建筑行），
 * 并关联 space_analysis_archive（最新风险等级）和 digital_archive（档案状态）。
 *
 * 导出：
 *   listBuildings(query?)  — 按区域、关键字、风险等级筛选建筑列表
 */

import { getTable } from "./sqliteMirrorRepository"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface BuildingListQuery {
  /** 按区域节点 id 筛选（iot_space.parent_id） */
  regionId?: number
  /** 关键字：模糊匹配 name / short_name（不区分大小写） */
  keyword?: string
  /** 按最新分析风险等级筛选（来自 space_analysis_archive.risk_level） */
  riskLevel?: string
}

export interface BuildingListItem {
  id:               number
  spaceCode:        string
  name:             string
  shortName:        string | null
  latitude:         number | null
  longitude:        number | null
  addressDesc:      string | null
  parentId:         number | null
  createTime:       string | null
  /** 最新一次 space_analysis_archive 的 risk_level，无记录为 null */
  latestRiskLevel:  string | null
  /** digital_archive.status，无档案为 null */
  archiveStatus:    number | null
}

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

/** 按 space_id 聚合最新 risk_level（取 calc_time 最大的记录） */
function buildRiskMap(): Map<number, string> {
  const archives = getTable("space_analysis_archive") as Array<{
    space_id: number
    calc_time: string | null
    risk_level: string
  }>

  // 按 space_id 分组，每组取 calc_time 最大的 risk_level
  const map = new Map<number, { calc_time: string; risk_level: string }>()
  for (const row of archives) {
    const ct = String(row.calc_time ?? "")
    const existing = map.get(row.space_id)
    if (!existing || ct > existing.calc_time) {
      map.set(row.space_id, { calc_time: ct, risk_level: row.risk_level })
    }
  }

  const result = new Map<number, string>()
  map.forEach((v, k) => result.set(k, v.risk_level))
  return result
}

/** 按 building_id 索引 digital_archive.status */
function buildArchiveStatusMap(): Map<number, number> {
  const archives = getTable("digital_archive") as Array<{
    building_id: number
    status: number
  }>
  const map = new Map<number, number>()
  for (const row of archives) {
    map.set(row.building_id, row.status)
  }
  return map
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 查询建筑列表，支持按区域、关键字、风险等级筛选。
 *
 * @param query 筛选条件，全部可选；不传或空对象时返回全部 23 栋建筑
 */
export function listBuildings(query: BuildingListQuery = {}): BuildingListItem[] {
  const spaces = getTable("iot_space") as Array<{
    id: number
    parent_id: number | null
    space_code: string
    name: string
    short_name: string | null
    type: string
    latitude: number | null
    longitude: number | null
    address_desc: string | null
    is_outdoor: number
    create_time: string | null
  }>

  // 只取建筑节点（type="2"），排除区域节点（type="1"）
  const buildings = spaces.filter((r) => r.type === "2")

  const riskMap         = buildRiskMap()
  const archiveStatusMap = buildArchiveStatusMap()

  let result: BuildingListItem[] = buildings.map((b) => ({
    id:              b.id,
    spaceCode:       b.space_code,
    name:            b.name,
    shortName:       b.short_name ?? null,
    latitude:        b.latitude ?? null,
    longitude:       b.longitude ?? null,
    addressDesc:     b.address_desc ?? null,
    parentId:        b.parent_id ?? null,
    createTime:      b.create_time ?? null,
    latestRiskLevel: riskMap.get(b.id) ?? null,
    archiveStatus:   archiveStatusMap.get(b.id) ?? null,
  }))

  // ── 筛选 ─────────────────────────────────────────────────────────────────

  if (query.regionId !== undefined) {
    result = result.filter((b) => b.parentId === query.regionId)
  }

  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    result = result.filter(
      (b) =>
        b.name.toLowerCase().includes(kw) ||
        (b.shortName ?? "").toLowerCase().includes(kw)
    )
  }

  if (query.riskLevel !== undefined) {
    result = result.filter((b) => b.latestRiskLevel === query.riskLevel)
  }

  return result
}
