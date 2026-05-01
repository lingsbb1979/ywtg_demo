/**
 * 状态枚举（T15.11）
 *
 * 规则：
 *   - 枚举值来源于 完整需求.md（第八、九、十章）和 完整SQL.md 业务规则
 *   - 命名：PascalCase 枚举名，SCREAMING_SNAKE_CASE 成员
 *   - DemoScenario 只作为代码常量，禁止写入 localStorage 业务数据表
 *   - AlarmStatus / WorkOrderStatus 的整数值与 alarm_record.status /
 *     work_order.status 字段存储值保持一致，方便后续迁移 SQLite
 */

// ── 风险等级（来自需求 8.4 节：大屏点位颜色映射）─────────────────────────

export enum RiskLevel {
  /** 绿色：稳定 / 低风险，S ≤ 30 */
  GREEN       = "GREEN",
  /** 黄色：关注 / 缓慢发展，30 < S ≤ 60 */
  YELLOW      = "YELLOW",
  /** 橙色：警示 / 扩展，较重隐患或 S 接近高危 */
  ORANGE      = "ORANGE",
  /** 红色：危险 / 快速恶化，S > 60 或 v > V2 */
  RED         = "RED",
  /** 红色闪烁：特别紧急，S > 95 或坍塌 / 伤亡 */
  RED_FLASH   = "RED_FLASH",
}

// ── 告警状态（来自需求 9.x 节：告警生命周期）────────────────────────────────

export enum AlarmStatus {
  /** 待确认：告警刚触发，值班员尚未处理 */
  PENDING     = 0,
  /** 已确认：值班员确认告警有效 */
  CONFIRMED   = 1,
  /** 已派单：已生成工单，告警与工单关联 */
  DISPATCHED  = 2,
  /** 已处置：工单销号后告警关闭 */
  RESOLVED    = 3,
  /** 误报关闭：标记为误报并归档复盘 */
  FALSE_ALARM = 9,
}

// ── 工单状态（来自需求 10.2 节：工单状态机）──────────────────────────────────

export enum WorkOrderStatus {
  /** 待接单：工单已派发，等待外勤接单 */
  PENDING_ACCEPT  = 0,
  /** 处理中：外勤已接单，正在现场处置 */
  PROCESSING      = 1,
  /** 待核查：外勤已提交处置记录，等待 PC 端核查 */
  PENDING_CHECK   = 2,
  /** 已销号：核查通过，风险消除，工单闭环 */
  CLOSED          = 3,
  /** 已退回：核查不通过，退回外勤补充处置 */
  RETURNED        = 4,
  /** 已超时：超过 SLA 限时未完成 */
  TIMEOUT         = 5,
}

// ── 现场证据类型（来自需求 10.3 节 + field_evidence.media_type 字段）────────

export enum EvidenceType {
  /** 照片：H5 拍照上传，含自动水印 */
  PHOTO       = "PHOTO",
  /** 视频：现场录像 */
  VIDEO       = "VIDEO",
  /** GPS签到：签到打卡，记录坐标 */
  GPS_CHECKIN = "GPS_CHECKIN",
  /** 文字说明：处置备注 */
  TEXT        = "TEXT",
}

// ── 演示场景（来自需求 T15.33 / T15.64-T15.68）────────────────────────────
// 注意：DemoScenario 只作为代码常量，禁止写入 localStorage 任何业务数据表

export enum DemoScenario {
  /** 初始 / 正常状态：23 栋建筑均为绿色 */
  NORMAL                = "NORMAL",
  /** 橙色裂缝：B003 触发橙色裂缝隐患、分析结果和告警（T15.65） */
  ORANGE_CRACK          = "ORANGE_CRACK",
  /** 红色倾斜：B012 触发红色倾斜告警和应急占位提醒（T15.66） */
  RED_TILT              = "RED_TILT",
  /** 超时督办：生成一条超时工单和督办建议（T15.67） */
  TIMEOUT_SUPERVISION   = "TIMEOUT_SUPERVISION",
  /** 数据恢复：核查前把裂缝 / 风险数据恢复到安全区间（T15.68） */
  DATA_RECOVERY         = "DATA_RECOVERY",
}
