/**
 * SQLiteMirror 表注册表（T15.12）
 *
 * 规则：
 *   - 只登记 完整SQL.md 中 CREATE TABLE 已存在的真实表（共 83 张）
 *   - 每张表的字段数组与 SQL CREATE TABLE 中的字段声明顺序完全一致
 *   - 所有字段名为 snake_case
 *   - 用途：T15.23 字段白名单校验、T15.111 导出按字段顺序生成列
 *
 * 注意：PRIMARY KEY 约束不影响字段名，复合主键表（如 iot_telemetry）
 * 的字段名仍按 SQL 中出现顺序列出。
 */

export const TableRegistry: Readonly<Record<string, readonly string[]>> = {

  // ── 系统管理 ──────────────────────────────────────────────────────────────
  sys_organization: [
    "id", "org_code", "org_name", "org_type", "org_level",
    "parent_id", "org_path", "ancestors", "status", "sort_order",
  ],
  sys_user: [
    "id", "username", "login_name", "user_name", "password", "real_name",
    "org_id", "phone", "phonenumber", "email", "status", "user_type",
    "last_login_time", "create_time",
  ],
  sys_role: [
    "id", "role_name", "role_key", "org_id", "data_scope", "status", "create_time",
  ],
  sys_menu: [
    "id", "menu_name", "parent_id", "menu_type", "perms",
    "path", "component", "icon", "sort_order", "status",
  ],
  sys_user_role: ["user_id", "role_id"],
  sys_role_menu:  ["role_id", "menu_id"],
  sys_config: [
    "id", "module_code", "config_key", "config_value", "value_type",
    "effective_scope", "scope_id", "config_desc", "status", "create_time", "update_time",
  ],
  sys_dict_type: [
    "id", "dict_code", "dict_name", "module_code", "status", "remark",
  ],
  sys_dict_data: [
    "id", "dict_code", "item_code", "item_label", "item_value",
    "color", "sort_order", "status",
  ],
  biz_config_change_log: [
    "id", "module_code", "table_name", "record_id", "change_type",
    "before_json", "after_json", "operator_id", "operator_name", "create_time",
  ],

  // ── 分析模板 ──────────────────────────────────────────────────────────────
  analysis_metric_template: [
    "id", "metric_code", "metric_name", "formula_type", "formula_desc",
    "result_unit", "result_type", "is_builtin", "status",
  ],
  analysis_metric_param_def: [
    "id", "template_id", "param_key", "param_name", "value_type",
    "default_value", "unit", "min_value", "max_value", "required_flag", "description",
  ],

  // ── IoT 基础配置 ──────────────────────────────────────────────────────────
  iot_business_type: ["id", "name", "code", "create_time"],
  iot_factor_type: [
    "id", "business_id", "name", "code", "create_time",
    "factor_code", "factor_name", "unit", "data_type", "precision",
  ],
  iot_manufacturer:  ["id", "name", "code", "create_time"],
  iot_unit_type: [
    "id", "category", "name", "unit_symbol", "description", "create_time",
  ],
  iot_device_type: ["id", "parent_id", "name", "code", "create_time"],
  iot_gateway: [
    "id", "name", "code", "ip_address", "gateway_ip",
    "subnet_mask", "is_video_gw", "create_time",
  ],
  iot_driver: [
    "id", "gateway_id", "name", "code", "protocol_type", "is_enabled", "create_time",
  ],
  iot_link: [
    "id", "driver_id", "name", "code", "timeout_ms", "remote_ip_port",
    "com_port", "baud_rate", "data_bits", "stop_bits", "parity", "create_time",
  ],
  iot_device: [
    "id", "link_id", "business_id", "name", "code", "model",
    "manufacturer_id", "device_type_id", "create_time",
  ],
  iot_measure_point: [
    "id", "device_id", "point_type", "slave_address", "start_address",
    "name", "code", "data_type", "function_code", "create_time",
  ],
  iot_data_point: [
    "id", "measure_point_id", "name", "tag_key", "offset_address",
    "unit_type_id", "coefficient", "decimal_places", "is_alarm",
    "limit_hh", "limit_h", "limit_l", "limit_ll", "create_time",
    "space_id", "factor_id", "device_sn", "point_name", "install_date", "status",
  ],
  iot_data_point_factor_rel: [
    "id", "data_point_id", "factor_type_id", "create_time",
  ],
  iot_video_point: [
    "id", "gateway_id", "name", "code", "ip_address", "rtsp_url",
    "account", "password", "is_elevator", "create_time",
  ],
  iot_alarm_strategy: [
    "id", "name", "alarm_method", "contact_ids", "create_time",
  ],
  iot_alarm_linkage: [
    "id", "name", "trigger_point_id", "is_auto_handle",
    "action_do_id", "action_video_id", "create_time",
  ],

  // ── 设备与传感器（历史遗留表）────────────────────────────────────────────
  device_info: [
    "device_id", "device_name", "device_type", "manufacturer", "model_number",
    "firmware_version", "status", "location", "create_time", "update_time",
  ],
  sensor_data: [
    "data_id", "device_id", "sensor_type", "sensor_value",
    "unit", "data_status", "collect_time", "create_time",
  ],
  user_info: [
    "user_id", "username", "password", "real_name", "phone",
    "email", "user_type", "status", "create_time", "update_time",
  ],
  device_user_rel: [
    "rel_id", "device_id", "user_id", "permission_level", "create_time",
  ],
  system_log: [
    "log_id", "user_id", "operation_type", "operation_content",
    "ip_address", "user_agent", "status", "create_time",
  ],
  device_config: [
    "config_id", "device_id", "config_key", "config_value", "config_type",
    "description", "status", "create_time", "update_time",
  ],

  // ── 建筑空间与采集 ───────────────────────────────────────────────────────
  iot_space: [
    "id", "parent_id", "space_code", "name", "short_name",
    "type", "latitude", "longitude", "address_desc", "is_outdoor", "create_time",
  ],
  iot_telemetry: ["ts", "point_id", "value_num", "value_str"],

  // ── 风险分析 ──────────────────────────────────────────────────────────────
  space_analysis_config: [
    "id", "space_id", "metric_id", "calc_freq", "calc_freq_unit",
    "input_source_json", "params_json", "risk_level_json",
    "is_enabled", "create_time", "update_time",
  ],
  space_analysis_archive: [
    "id", "space_id", "metric_id", "calc_time", "value_num",
    "risk_level", "status_code", "source_data_ids", "create_time",
  ],

  // ── 告警配置 ──────────────────────────────────────────────────────────────
  alarm_level_config: [
    "id", "level_code", "level_name", "level_value", "color",
    "score_min", "score_max", "route_type", "allow_false_alarm",
    "need_confirm", "law_basis", "status",
  ],
  alarm_type_config: [
    "id", "type_code", "type_name", "related_metric_code",
    "title_template", "aggregate_flag", "status",
  ],
  alarm_rule_config: [
    "id", "rule_name", "alarm_type_id", "metric_config_id", "level_id",
    "condition_json", "debounce_count", "recover_condition_json", "status",
  ],
  notify_channel_config: [
    "id", "channel_code", "channel_name", "enabled", "provider_config_json", "remark",
  ],
  alarm_notify_policy: [
    "id", "alarm_level_id", "alarm_type_id", "channel_codes",
    "receiver_org_id", "receiver_role_key", "receiver_user_ids", "status",
  ],
  alarm_route_rule: [
    "id", "alarm_level_id", "condition_json", "route_type",
    "target_flow_code", "priority", "status",
  ],

  // ── 告警记录 ──────────────────────────────────────────────────────────────
  alarm_record: [
    "id", "alarm_id", "alarm_code", "device_id", "building_id", "sensor_id",
    "alarm_title", "alarm_type", "alarm_level", "alarm_content", "root_cause",
    "aggregate_flag", "raw_data", "status", "trigger_time", "handle_time",
    "handle_user", "create_time", "update_time",
  ],

  // ── 工单流程配置 ──────────────────────────────────────────────────────────
  work_order_flow_template: [
    "id", "flow_code", "flow_name", "apply_order_type", "status",
  ],
  work_order_node_config: [
    "id", "flow_id", "node_code", "node_name", "sort_order",
    "required_flag", "allow_role_keys", "next_node_code", "return_node_code",
  ],
  work_order_dispatch_rule: [
    "id", "alarm_level", "alarm_type", "dispatch_type",
    "receive_org_rule", "receive_org_id", "receive_role_key",
    "manual_adjust_minutes", "notify_channel_codes", "status",
  ],
  work_order_sla_policy: [
    "id", "order_level", "arrive_limit_minutes", "finish_limit_minutes",
    "overdue_notice_minutes", "upgrade_1_minutes", "upgrade_2_minutes",
    "upgrade_3_minutes", "status",
  ],
  work_order_site_rule_config: [
    "id", "order_level", "gps_radius_meter", "min_photo_count",
    "camera_only", "watermark_template", "allow_offline", "need_signature", "status",
  ],

  // ── 工单业务 ──────────────────────────────────────────────────────────────
  work_order: [
    "id", "order_no", "order_code", "alarm_id", "building_id",
    "order_type", "order_level", "alarm_level", "dispatch_type",
    "dispatch_org_id", "dispatch_user_id", "dispatch_org",
    "receive_org_id", "receive_user_id", "receive_org", "receive_role_key",
    "assignee_id", "priority", "status", "current_node",
    "source_id", "source_type", "dispatch_time", "accept_time",
    "finish_time", "check_time", "create_time", "update_time",
  ],
  work_order_log: [
    "id", "order_id", "node_type", "node_name", "operator_id",
    "operator_name", "operator", "action_desc", "action_time",
    "detail_json", "remark", "create_time",
  ],
  work_order_disposal: [
    "id", "order_id", "user_id", "gps_location", "address_desc",
    "image_urls", "video_url", "disposal_desc", "disposal_time", "create_time",
  ],
  mobile_verify_record: [
    "id", "order_id", "user_id", "verify_time",
    "gps_location", "photo_url", "verify_result",
  ],

  // ── 应急管理 ──────────────────────────────────────────────────────────────
  emergency_level_config: [
    "id", "level_code", "level_name", "score_min", "score_max",
    "trigger_condition_json", "main_subject", "need_report_province",
    "report_limit_minutes", "screen_effect_json", "status",
  ],
  emergency_plan_config: [
    "id", "plan_code", "plan_name", "level_code", "trigger_condition_json",
    "related_dept_json", "release_condition_json", "can_transfer_work_order", "status",
  ],
  emergency_flow_node_config: [
    "id", "plan_id", "node_code", "node_name", "sort_order",
    "target_role_keys", "required_material_json", "limit_minutes",
  ],
  emergency_command_type_config: [
    "id", "command_code", "command_name", "target_dept_rule",
    "need_photo", "need_signature", "status",
  ],
  emergency_incident: [
    "id", "incident_no", "source_type", "building_id", "level",
    "status", "trigger_time", "report_to_province", "evacuation_status",
  ],
  emergency_order: [
    "id", "incident_id", "order_type", "target_dept",
    "issue_time", "confirm_time", "feedback",
  ],

  // ── 数字档案 ──────────────────────────────────────────────────────────────
  archive_category_config: [
    "id", "category_code", "category_name", "required_flag",
    "allow_file_types", "status",
  ],
  archive_status_rule_config: [
    "id", "source_type", "source_condition_json", "target_status", "priority", "status",
  ],
  renovation_type_config: [
    "id", "record_type", "record_name", "required_fields_json",
    "trigger_rule_json", "status",
  ],
  digital_archive: [
    "id", "building_id", "base_info_version", "last_audit_time", "status",
  ],
  archive_relation: [
    "id", "archive_id", "source_type", "source_id", "relation_type", "create_time",
  ],
  renovation_record: [
    "id", "archive_id", "record_type", "related_order_no",
    "before_images", "after_images", "appraiser", "appraisal_time", "appraisal_result",
  ],

  // ── 督办 ──────────────────────────────────────────────────────────────────
  supervision_level_config: [
    "id", "level_code", "level_name", "reply_limit_minutes",
    "remind_interval_minutes", "ui_style_json", "status",
  ],
  supervision_flow_config: [
    "id", "node_code", "node_name", "from_level", "to_level",
    "allow_role_keys", "status",
  ],
  supervision_order: [
    "id", "supervision_no", "from_org_id", "to_org_id", "source_type",
    "related_event_id", "title", "content", "level_code", "status",
    "issue_time", "deadline",
  ],
  national_supervision_order: [
    "id", "supervision_no", "target_province", "source_type",
    "related_event_id", "title", "level", "status", "issue_time", "deadline",
  ],
  supervision_reply: [
    "id", "order_id", "reply_content", "attachments", "reply_time", "operator",
  ],
  major_event_report: [
    "id", "report_type", "province", "content_summary",
    "report_status", "report_time", "receive_confirm_time",
  ],

  // ── 大屏配置 ──────────────────────────────────────────────────────────────
  screen_metric_def: [
    "id", "code", "name", "data_type", "refresh_interval",
    "calc_sql", "result_format", "description",
  ],
  metric_variable_map: [
    "id", "metric_id", "var_key", "var_source", "source_key",
  ],
  screen_page_def: [
    "id", "page_key", "page_name", "layout_json", "bg_color",
  ],
  page_metric_bind: [
    "id", "page_id", "metric_id", "component_id", "drill_sql", "drill_params",
  ],

  // ── 值班 / 权限矩阵 ───────────────────────────────────────────────────────
  duty_alert_policy: [
    "id", "trigger_event", "ui_template", "bg_color", "text_color",
    "animation", "sound_url", "display_duration",
  ],
  user_profile_matrix: [
    "id", "role_type", "default_page", "task_scope", "alert_level_filter",
  ],

  // ── 移动端 ────────────────────────────────────────────────────────────────
  mobile_menu_config: [
    "id", "menu_code", "menu_name", "role_type", "path",
    "icon", "sort_order", "status",
  ],
  mobile_rule_config: [
    "id", "rule_code", "rule_name", "rule_json", "status",
  ],
  mobile_session: [
    "id", "token", "user_id", "expire_time",
    "last_lat", "last_lng", "device_info",
  ],
  offline_task_cache: [
    "id", "local_id", "task_type", "content_json",
    "status", "create_time", "upload_retry",
  ],
  field_evidence: [
    "id", "task_id", "media_type", "file_url",
    "gps_lat", "gps_lng", "timestamp", "watermark_text",
  ],
  mobile_operation_log: [
    "id", "user_id", "action_type", "target_id", "device_latlng", "confirm_log_id",
  ],
} as const
