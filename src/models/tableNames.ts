/**
 * SQLite 真实表名常量（T15.9）
 *
 * 规则：
 *   - 只登记 完整SQL.md 中 CREATE TABLE 已存在的真实表（共 83 个）
 *   - key 为 SCREAMING_SNAKE_CASE，value 为 SQL 中的原始 snake_case 表名
 *   - 禁止出现 SQL 中不存在的自造表名
 *   - 禁止驼峰表名
 *
 * 用于 sqliteMirrorRepository 的类型约束，确保 localStorage key
 * ywtg.sqlite.<tableName> 中的表名与 SQLite CREATE TABLE 完全一致。
 */

export const TableNames = {
  // ── 系统管理 ──────────────────────────────────────────────────────────────
  SYS_ORGANIZATION:            "sys_organization",
  SYS_USER:                    "sys_user",
  SYS_ROLE:                    "sys_role",
  SYS_MENU:                    "sys_menu",
  SYS_USER_ROLE:               "sys_user_role",
  SYS_ROLE_MENU:               "sys_role_menu",
  SYS_CONFIG:                  "sys_config",
  SYS_DICT_TYPE:               "sys_dict_type",
  SYS_DICT_DATA:               "sys_dict_data",
  BIZ_CONFIG_CHANGE_LOG:       "biz_config_change_log",

  // ── 分析模板 ──────────────────────────────────────────────────────────────
  ANALYSIS_METRIC_TEMPLATE:    "analysis_metric_template",
  ANALYSIS_METRIC_PARAM_DEF:   "analysis_metric_param_def",

  // ── IoT 基础配置 ──────────────────────────────────────────────────────────
  IOT_BUSINESS_TYPE:           "iot_business_type",
  IOT_FACTOR_TYPE:             "iot_factor_type",
  IOT_MANUFACTURER:            "iot_manufacturer",
  IOT_UNIT_TYPE:               "iot_unit_type",
  IOT_DEVICE_TYPE:             "iot_device_type",
  IOT_GATEWAY:                 "iot_gateway",
  IOT_DRIVER:                  "iot_driver",
  IOT_LINK:                    "iot_link",
  IOT_DEVICE:                  "iot_device",
  IOT_MEASURE_POINT:           "iot_measure_point",
  IOT_DATA_POINT:              "iot_data_point",
  IOT_DATA_POINT_FACTOR_REL:   "iot_data_point_factor_rel",
  IOT_VIDEO_POINT:             "iot_video_point",
  IOT_ALARM_STRATEGY:          "iot_alarm_strategy",
  IOT_ALARM_LINKAGE:           "iot_alarm_linkage",

  // ── 设备与传感器（历史遗留表）────────────────────────────────────────────
  DEVICE_INFO:                 "device_info",
  SENSOR_DATA:                 "sensor_data",
  USER_INFO:                   "user_info",
  DEVICE_USER_REL:             "device_user_rel",
  SYSTEM_LOG:                  "system_log",
  DEVICE_CONFIG:               "device_config",

  // ── 建筑空间与采集 ───────────────────────────────────────────────────────
  IOT_SPACE:                   "iot_space",
  IOT_TELEMETRY:               "iot_telemetry",

  // ── 风险分析 ──────────────────────────────────────────────────────────────
  SPACE_ANALYSIS_CONFIG:       "space_analysis_config",
  SPACE_ANALYSIS_ARCHIVE:      "space_analysis_archive",

  // ── 告警配置 ──────────────────────────────────────────────────────────────
  ALARM_LEVEL_CONFIG:          "alarm_level_config",
  ALARM_TYPE_CONFIG:           "alarm_type_config",
  ALARM_RULE_CONFIG:           "alarm_rule_config",
  NOTIFY_CHANNEL_CONFIG:       "notify_channel_config",
  ALARM_NOTIFY_POLICY:         "alarm_notify_policy",
  ALARM_ROUTE_RULE:            "alarm_route_rule",

  // ── 告警记录 ──────────────────────────────────────────────────────────────
  ALARM_RECORD:                "alarm_record",

  // ── 工单流程配置 ──────────────────────────────────────────────────────────
  WORK_ORDER_FLOW_TEMPLATE:    "work_order_flow_template",
  WORK_ORDER_NODE_CONFIG:      "work_order_node_config",
  WORK_ORDER_DISPATCH_RULE:    "work_order_dispatch_rule",
  WORK_ORDER_SLA_POLICY:       "work_order_sla_policy",
  WORK_ORDER_SITE_RULE_CONFIG: "work_order_site_rule_config",

  // ── 工单业务 ──────────────────────────────────────────────────────────────
  WORK_ORDER:                  "work_order",
  WORK_ORDER_LOG:              "work_order_log",
  WORK_ORDER_DISPOSAL:         "work_order_disposal",
  MOBILE_VERIFY_RECORD:        "mobile_verify_record",

  // ── 应急管理 ──────────────────────────────────────────────────────────────
  EMERGENCY_LEVEL_CONFIG:      "emergency_level_config",
  EMERGENCY_PLAN_CONFIG:       "emergency_plan_config",
  EMERGENCY_FLOW_NODE_CONFIG:  "emergency_flow_node_config",
  EMERGENCY_COMMAND_TYPE_CONFIG: "emergency_command_type_config",
  EMERGENCY_INCIDENT:          "emergency_incident",
  EMERGENCY_ORDER:             "emergency_order",

  // ── 数字档案 ──────────────────────────────────────────────────────────────
  ARCHIVE_CATEGORY_CONFIG:     "archive_category_config",
  ARCHIVE_STATUS_RULE_CONFIG:  "archive_status_rule_config",
  RENOVATION_TYPE_CONFIG:      "renovation_type_config",
  DIGITAL_ARCHIVE:             "digital_archive",
  ARCHIVE_RELATION:            "archive_relation",
  RENOVATION_RECORD:           "renovation_record",

  // ── 督办 ──────────────────────────────────────────────────────────────────
  SUPERVISION_LEVEL_CONFIG:    "supervision_level_config",
  SUPERVISION_FLOW_CONFIG:     "supervision_flow_config",
  SUPERVISION_ORDER:           "supervision_order",
  NATIONAL_SUPERVISION_ORDER:  "national_supervision_order",
  SUPERVISION_REPLY:           "supervision_reply",
  MAJOR_EVENT_REPORT:          "major_event_report",

  // ── 大屏配置 ──────────────────────────────────────────────────────────────
  SCREEN_METRIC_DEF:           "screen_metric_def",
  METRIC_VARIABLE_MAP:         "metric_variable_map",
  SCREEN_PAGE_DEF:             "screen_page_def",
  PAGE_METRIC_BIND:            "page_metric_bind",

  // ── 值班 / 权限矩阵 ───────────────────────────────────────────────────────
  DUTY_ALERT_POLICY:           "duty_alert_policy",
  USER_PROFILE_MATRIX:         "user_profile_matrix",

  // ── 移动端 ────────────────────────────────────────────────────────────────
  MOBILE_MENU_CONFIG:          "mobile_menu_config",
  MOBILE_RULE_CONFIG:          "mobile_rule_config",
  MOBILE_SESSION:              "mobile_session",
  OFFLINE_TASK_CACHE:          "offline_task_cache",
  FIELD_EVIDENCE:              "field_evidence",
  MOBILE_OPERATION_LOG:        "mobile_operation_log",
} as const

/**
 * TableName 联合类型
 * 用于 Repository 接口的泛型约束，防止传入不存在于 SQL 的表名。
 */
export type TableName = (typeof TableNames)[keyof typeof TableNames]
