/**
 * T15.43 — 告警列表查询 alarmService
 *
 * 从 localStorage（SQLiteMirror）的 alarm_record 表中查询告警，
 * 支持按等级（alarmLevel）、状态（status）、建筑（buildingId）、关键字筛选，
 * 并关联 iot_space 带出建筑编码与名称。
 * 结果按 trigger_time 倒序排列（最新在前）。
 *
 * 导出：
 *   listAlarms(query?)  — 告警列表查询（T15.43）
 */

import { getTable } from "./sqliteMirrorRepository"

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface AlarmListQuery {
  /** 按告警等级筛选（RED / ORANGE / YELLOW / GREEN） */
  alarmLevel?:  string
  /** 按告警状态筛选（ACTIVE / PENDING / CLOSED 等） */
  status?:      string
  /** 按建筑 id 筛选 */
  buildingId?:  number
  /** 关键字：模糊匹配 alarm_title / alarm_code（不区分大小写） */
  keyword?:     string
}

export interface AlarmListItem {
  id:           number
  alarmId:      string | null
  alarmCode:    string | null
  buildingId:   number | null
  buildingCode: string | null
  buildingName: string | null
  alarmTitle:   string | null
  alarmType:    string | null
  alarmLevel:   string | null
  alarmContent: string | null
  status:       string | null
  triggerTime:  string | null
  handleTime:   string | null
  handleUser:   string | null
  createTime:   string | null
}

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

/** 按 id 索引 iot_space，带出 space_code、name */
function buildSpaceMap(): Map<number, { spaceCode: string; name: string }> {
  const spaces = getTable<{
    id: number
    space_code: string
    name: string
  }>("iot_space")

  const map = new Map<number, { spaceCode: string; name: string }>()
  for (const s of spaces) {
    map.set(s.id, { spaceCode: s.space_code, name: s.name })
  }
  return map
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 查询告警列表，支持按等级、状态、建筑、关键字筛选。
 * 结果按 trigger_time 倒序（最新在前）。
 *
 * @param query 筛选条件，全部可选；不传或空对象时返回全部告警
 */
export function listAlarms(query: AlarmListQuery = {}): AlarmListItem[] {
  const { alarmLevel, status, buildingId, keyword } = query

  const rows = getTable<{
    id:            number
    alarm_id:      string | null
    alarm_code:    string | null
    building_id:   number | null
    alarm_title:   string | null
    alarm_type:    string | null
    alarm_level:   string | null
    alarm_content: string | null
    status:        string | null
    trigger_time:  string | null
    handle_time:   string | null
    handle_user:   string | null
    create_time:   string | null
  }>("alarm_record")

  const spaceMap = buildSpaceMap()

  const kw = keyword ? keyword.toLowerCase() : null

  let filtered = rows.filter((r) => {
    if (alarmLevel  !== undefined && r.alarm_level  !== alarmLevel)  return false
    if (status      !== undefined && r.status        !== status)      return false
    if (buildingId  !== undefined && r.building_id   !== buildingId)  return false
    if (kw !== null) {
      const title = (r.alarm_title  ?? "").toLowerCase()
      const code  = (r.alarm_code   ?? "").toLowerCase()
      if (!title.includes(kw) && !code.includes(kw)) return false
    }
    return true
  })

  // 按 trigger_time 倒序
  filtered = filtered.sort((a, b) => {
    const ta = a.trigger_time ?? ""
    const tb = b.trigger_time ?? ""
    return tb > ta ? 1 : tb < ta ? -1 : 0
  })

  return filtered.map((r) => {
    const space = r.building_id != null ? (spaceMap.get(r.building_id) ?? null) : null
    return {
      id:           r.id,
      alarmId:      r.alarm_id   ?? null,
      alarmCode:    r.alarm_code ?? null,
      buildingId:   r.building_id,
      buildingCode: space ? space.spaceCode : null,
      buildingName: space ? space.name      : null,
      alarmTitle:   r.alarm_title   ?? null,
      alarmType:    r.alarm_type    ?? null,
      alarmLevel:   r.alarm_level   ?? null,
      alarmContent: r.alarm_content ?? null,
      status:       r.status        ?? null,
      triggerTime:  r.trigger_time  ?? null,
      handleTime:   r.handle_time   ?? null,
      handleUser:   r.handle_user   ?? null,
      createTime:   r.create_time   ?? null,
    }
  })
}
