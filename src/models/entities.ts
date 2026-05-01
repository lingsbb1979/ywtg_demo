/**
 * 核心实体类型（T15.10）
 *
 * 规则：
 *   - 字段名与 完整SQL.md 的 CREATE TABLE 完全一致（全 snake_case）
 *   - 禁止驼峰字段名
 *   - INTEGER → number, TEXT → string, REAL → number
 *   - 可选字段用 ? 表示（Demo 阶段部分字段允许缺省）
 *   - HazardView 是运行时计算视图，不对应真实表，不受 SQL 字段约束
 *
 * 表对照：
 *   IotSpace              ← iot_space
 *   IotDataPoint          ← iot_data_point
 *   IotTelemetry          ← iot_telemetry
 *   SpaceAnalysisArchive  ← space_analysis_archive
 *   HazardView            ← 运行时计算（T15.41），不写入 localStorage
 *   AlarmRecord           ← alarm_record
 *   WorkOrder             ← work_order
 *   WorkOrderDisposal     ← work_order_disposal
 *   FieldEvidence         ← field_evidence
 */

// ── 建筑空间（iot_space）────────────────────────────────────────────────────

export interface IotSpace {
  id: number
  parent_id?: number
  space_code?: string
  name: string
  short_name?: string
  type?: string
  latitude?: number
  longitude?: number
  address_desc?: string
  is_outdoor?: number
  create_time?: string
}

// ── 数据点（iot_data_point）──────────────────────────────────────────────────

export interface IotDataPoint {
  id: number
  measure_point_id?: number
  name?: string
  tag_key?: string
  offset_address?: string
  unit_type_id?: number
  coefficient?: number
  decimal_places?: number
  is_alarm?: number
  limit_hh?: number
  limit_h?: number
  limit_l?: number
  limit_ll?: number
  create_time?: string
  space_id?: number
  factor_id?: number
  device_sn?: string
  point_name?: string
  install_date?: string
  status?: number
}

// ── 采集值（iot_telemetry）──────────────────────────────────────────────────

export interface IotTelemetry {
  ts: string
  point_id: number
  value_num?: number
  value_str?: string
}

// ── 分析结果（space_analysis_archive）──────────────────────────────────────

export interface SpaceAnalysisArchive {
  id: number
  space_id?: number
  metric_id?: number
  calc_time?: string
  value_num?: number
  risk_level?: string
  status_code?: number
  source_data_ids?: string
  create_time?: string
}

// ── 隐患运行时视图（不对应真实表，T15.41 计算生成，不写入 localStorage）──

export interface HazardView {
  /** 所属建筑 id（来自 iot_space.id） */
  space_id: number
  /** 建筑名称（来自 iot_space.name） */
  space_name: string
  /** 风险等级（来自 space_analysis_archive.risk_level） */
  risk_level: string
  /** 告警 id（来自 alarm_record.id，可能为空） */
  alarm_id?: number
  /** 关联工单 id（来自 work_order.id，可能为空） */
  work_order_id?: number
  /** 是否已闭环 */
  is_closed: boolean
}

// ── 告警记录（alarm_record）──────────────────────────────────────────────────

export interface AlarmRecord {
  id: number
  alarm_id?: number
  alarm_code?: string
  device_id?: string
  building_id?: number
  sensor_id?: number
  alarm_title?: string
  alarm_type?: string
  alarm_level?: number
  alarm_content?: string
  root_cause?: string
  aggregate_flag?: number
  raw_data?: string
  status?: number
  trigger_time?: string
  handle_time?: string
  handle_user?: number
  create_time?: string
  update_time?: string
}

// ── 工单（work_order）────────────────────────────────────────────────────────

export interface WorkOrder {
  id: number
  order_no?: string
  order_code?: string
  alarm_id?: number
  building_id?: number
  order_type?: number
  order_level?: number
  alarm_level?: number
  dispatch_type?: number
  dispatch_org_id?: number
  dispatch_user_id?: number
  dispatch_org?: string
  receive_org_id?: number
  receive_user_id?: number
  receive_org?: string
  receive_role_key?: string
  assignee_id?: number
  priority?: number
  status?: number
  current_node?: string
  source_id?: number
  source_type?: number
  dispatch_time?: string
  accept_time?: string
  finish_time?: string
  check_time?: string
  create_time?: string
  update_time?: string
}

// ── 处置记录（work_order_disposal）──────────────────────────────────────────

export interface WorkOrderDisposal {
  id: number
  order_id?: number
  user_id?: number
  gps_location?: string
  address_desc?: string
  image_urls?: string
  video_url?: string
  disposal_desc?: string
  disposal_time?: string
  create_time?: string
}

// ── 现场证据（field_evidence）────────────────────────────────────────────────

export interface FieldEvidence {
  id: number
  task_id?: number
  media_type?: string
  file_url?: string
  gps_lat?: number
  gps_lng?: number
  timestamp?: string
  watermark_text?: string
}
