/**
 * T15.34 / T15.35 / T15.36 — 建筑列表、建筑详情 & 风险色更新 buildingService
 *
 * 从 localStorage（SQLiteMirror）中查询 iot_space（type="2" 建筑行），
 * 并关联 space_analysis_archive（最新风险等级）、digital_archive（档案状态）、
 * sys_organization（责任单位）、work_order（关联工单）。
 *
 * 导出：
 *   listBuildings(query?)              — 按区域、关键字、风险等级筛选建筑列表（T15.34）
 *   getBuilding(id)                    — 查询单栋建筑详情（T15.35）
 *   updateBuildingRiskColor(id, level) — 更新建筑风险色，写入 space_analysis_archive（T15.36）
 */

import { getTable, setTable } from "./sqliteMirrorRepository"

// ── 区域 → 责任住建局静态映射 ─────────────────────────────────────────────────
// 来自 seedSpaceRelation（T15.28）区域节点 id 与 seedOrganization（T15.25）org id 的对应关系
// 向阳区(901)→104  前进区(902)→105  东风区(903)→106
const REGION_RESPONSIBLE_ORG: Readonly<Record<number, number>> = {
  901: 104,
  902: 105,
  903: 106,
}

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

// ══════════════════════════════════════════════════════════════════════════════
// T15.35 — 建筑详情查询
// ══════════════════════════════════════════════════════════════════════════════

export interface BuildingRisk {
  riskLevel:  string
  valueNum:   number | null
  calcTime:   string | null
  statusCode: string | null
}

export interface BuildingResponsibleOrg {
  id:      number
  orgName: string
  orgCode: string | null
}

export interface WorkOrderSummary {
  id:          number
  orderNo:     string
  status:      string
  orderLevel:  string | null
  dispatchTime:string | null
  receiveOrg:  string | null
  buildingId:  number
}

export interface BuildingDetail extends BuildingListItem {
  /** 责任单位（通过区域→住建局静态映射，sys_organization 中不存在时为 null） */
  responsibleOrg: BuildingResponsibleOrg | null
  /** 最新一次风险评估，无记录为 null */
  latestRisk:     BuildingRisk | null
  /** 关联工单摘要列表 */
  workOrders:     WorkOrderSummary[]
  /** digital_archive.id，无档案为 null */
  archiveId:      number | null
}

/**
 * 查询单栋建筑详情。
 *
 * @param id iot_space.id（建筑节点，type="2"）
 * @returns BuildingDetail，找不到时返回 null
 */
export function getBuilding(id: number): BuildingDetail | null {
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

  const space = spaces.find((r) => r.type === "2" && r.id === id)
  if (!space) return null

  // ── 责任单位 ─────────────────────────────────────────────────────────────
  const regionId = space.parent_id
  let responsibleOrg: BuildingResponsibleOrg | null = null
  if (regionId !== null) {
    const targetOrgId = REGION_RESPONSIBLE_ORG[regionId]
    if (targetOrgId !== undefined) {
      const orgs = getTable("sys_organization") as Array<{
        id: number
        org_name: string
        org_code: string | null
      }>
      const org = orgs.find((o) => o.id === targetOrgId)
      if (org) {
        responsibleOrg = { id: org.id, orgName: org.org_name, orgCode: org.org_code ?? null }
      }
    }
  }

  // ── 最新风险 ─────────────────────────────────────────────────────────────
  const analysisRows = getTable("space_analysis_archive") as Array<{
    space_id: number
    calc_time: string | null
    value_num: number | null
    risk_level: string
    status_code: string | null
  }>

  const myAnalysis = analysisRows.filter((r) => r.space_id === id)
  let latestRisk: BuildingRisk | null = null
  if (myAnalysis.length > 0) {
    const latest = myAnalysis.reduce((best, cur) =>
      String(cur.calc_time ?? "") > String(best.calc_time ?? "") ? cur : best
    )
    latestRisk = {
      riskLevel:  latest.risk_level,
      valueNum:   latest.value_num ?? null,
      calcTime:   latest.calc_time ?? null,
      statusCode: latest.status_code ?? null,
    }
  }

  // ── 关联工单 ─────────────────────────────────────────────────────────────
  const allOrders = getTable("work_order") as Array<{
    id: number
    order_no: string
    building_id: number
    status: string
    order_level: string | null
    dispatch_time: string | null
    receive_org: string | null
  }>

  const workOrders: WorkOrderSummary[] = allOrders
    .filter((o) => o.building_id === id)
    .map((o) => ({
      id:           o.id,
      orderNo:      o.order_no,
      status:       o.status,
      orderLevel:   o.order_level ?? null,
      dispatchTime: o.dispatch_time ?? null,
      receiveOrg:   o.receive_org ?? null,
      buildingId:   o.building_id,
    }))

  // ── 数字档案 ─────────────────────────────────────────────────────────────
  const digitalArchives = getTable("digital_archive") as Array<{
    id: number
    building_id: number
    status: number
  }>

  const archive = digitalArchives.find((a) => a.building_id === id)

  // ── 合并返回 ─────────────────────────────────────────────────────────────
  const riskMap          = buildRiskMap()
  const archiveStatusMap = buildArchiveStatusMap()

  return {
    id:              space.id,
    spaceCode:       space.space_code,
    name:            space.name,
    shortName:       space.short_name ?? null,
    latitude:        space.latitude ?? null,
    longitude:       space.longitude ?? null,
    addressDesc:     space.address_desc ?? null,
    parentId:        space.parent_id ?? null,
    createTime:      space.create_time ?? null,
    latestRiskLevel: riskMap.get(id) ?? null,
    archiveStatus:   archive?.status ?? null,
    responsibleOrg,
    latestRisk,
    workOrders,
    archiveId:       archive?.id ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// T15.36 — 建筑风险色更新
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 风险色 → digital_archive.status 映射：
 *   GREEN  → 10（安全）
 *   YELLOW → 20（关注）
 *   ORANGE → 30（警示）
 *   RED    → 40（危险）
 */
const RISK_LEVEL_TO_ARCHIVE_STATUS: Readonly<Record<string, number>> = {
  GREEN:  10,
  YELLOW: 20,
  ORANGE: 30,
  RED:    40,
}

/**
 * 更新指定建筑的风险色。
 *
 * 通过向 space_analysis_archive 追加一条带当前（或指定）时间戳的记录，
 * 使 listBuildings / getBuilding 立即反映新颜色。
 * 同时联动更新 digital_archive.status（若档案存在）。
 *
 * @param buildingId   iot_space.id（必须是 type="2" 建筑节点）
 * @param riskLevel    新风险色：GREEN / YELLOW / ORANGE / RED
 * @param calcTime     可选；默认使用 ISO 格式当前时间
 * @returns true 成功，false 建筑不存在
 */
export function updateBuildingRiskColor(
  buildingId: number,
  riskLevel: string,
  calcTime?: string,
): boolean {
  // ── 校验建筑存在（type="2"）─────────────────────────────────────────────
  const spaces = getTable("iot_space") as Array<{ id: number; type: string }>
  const building = spaces.find((r) => r.type === "2" && r.id === buildingId)
  if (!building) return false

  // ── 写入 space_analysis_archive ──────────────────────────────────────────
  const existing = getTable("space_analysis_archive") as Array<{
    id: number
    space_id: number
    metric_id: number
    calc_time: string | null
    value_num: number | null
    risk_level: string
    status_code: string | null
    source_data_ids: string | null
    create_time: string
  }>

  const maxId = existing.reduce((m, r) => Math.max(m, r.id), 0)
  const ts = calcTime ?? new Date().toISOString().replace("T", " ").slice(0, 19)

  const newRow = {
    id:              maxId + 1,
    space_id:        buildingId,
    metric_id:       0,           // 0 表示人工/场景触发
    calc_time:       ts,
    value_num:       null as number | null,
    risk_level:      riskLevel,
    status_code:     riskLevel,
    source_data_ids: null as string | null,
    create_time:     ts,
  }

  setTable("space_analysis_archive", [...existing, newRow])

  // ── 联动更新 digital_archive.status ────────────────────────────────────
  const archiveStatus = RISK_LEVEL_TO_ARCHIVE_STATUS[riskLevel]
  if (archiveStatus !== undefined) {
    const archives = getTable("digital_archive") as Array<{
      id: number
      building_id: number
      base_info_version: string
      last_audit_time: string | null
      status: number
    }>
    const updated = archives.map((a) =>
      a.building_id === buildingId ? { ...a, status: archiveStatus } : a
    )
    setTable("digital_archive", updated)
  }

  return true
}
