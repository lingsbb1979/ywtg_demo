/**
 * Seed — 23 栋历史建筑数据初始化（T15.27）
 *
 * 向 iot_space 写入佳木斯市 23 处历史建筑演示数据。
 *
 * 规则：
 *   - id 段 1001-1023，不与其他空间节点冲突
 *   - space_code: B001-B023（演示场景中用于快速引用）
 *   - type = "2"（建筑物）
 *   - parent_id = null（根级建筑节点，T15.28 负责建立区域/组织关联）
 *   - is_outdoor = 0（历史建筑为室内/有顶建筑）
 *   - latitude/longitude：佳木斯市域真实坐标范围（46.6-47.1°N, 130.1-130.7°E）
 *   - 分布：向阳区 8 栋（B001-B008），前进区 8 栋（B009-B016），东风区 7 栋（B017-B023）
 *   - 幂等：直接覆盖 iot_space 全表
 *   - 所有字段通过 T15.23 白名单校验（iot_space 字段集）
 *
 * 佳木斯市历史建筑说明：
 *   佳木斯市现存 23 处历史建筑，多为民国及 1950-60 年代建筑，
 *   受高寒冻融、基础沉降等因素影响存在结构安全隐患，为本平台核心监测对象。
 *
 * 注：risk_color（风险色）为运行时计算结果，不存入 iot_space 表；
 *     归属区域通过 address_desc 标注，正式关联由 T15.28 seedSpaceRelation 建立。
 */
import { setTable } from "../../services/sqliteMirrorRepository"

/** T15.27 建筑种子数据 */
export const BUILDING_SEED_ROWS = [
  // ── 向阳区（B001-B008）——————————————————————————————————————————————————
  // 真实坐标：佳木斯市向阳区，历史建筑集中于向阳路/光复路/中山街/解放路一带
  // 中心参考：向阳区政府 46.8335°N 130.3481°E
  {
    id:           1001,
    parent_id:    null,
    space_code:   "B001",
    name:         "向阳路1号历史建筑",
    short_name:   "向阳1号",
    type:         "2",
    latitude:     46.8328,
    longitude:    130.3468,
    address_desc: "黑龙江省佳木斯市向阳区向阳路1号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1002,
    parent_id:    null,
    space_code:   "B002",
    name:         "中山街旧址建筑",
    short_name:   "中山旧址",
    type:         "2",
    latitude:     46.8291,
    longitude:    130.3562,
    address_desc: "黑龙江省佳木斯市向阳区中山街15号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1003,
    parent_id:    null,
    space_code:   "B003",
    name:         "光复路老宅院",
    short_name:   "光复老宅",
    type:         "2",
    latitude:     46.8352,
    longitude:    130.3492,
    address_desc: "黑龙江省佳木斯市向阳区光复路33号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1004,
    parent_id:    null,
    space_code:   "B004",
    name:         "兴国街民国建筑",
    short_name:   "兴国民国楼",
    type:         "2",
    latitude:     46.8305,
    longitude:    130.3573,
    address_desc: "黑龙江省佳木斯市向阳区兴国街22号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1005,
    parent_id:    null,
    space_code:   "B005",
    name:         "红旗路苏联援建楼",
    short_name:   "红旗苏援楼",
    type:         "2",
    latitude:     46.8318,
    longitude:    130.3456,
    address_desc: "黑龙江省佳木斯市向阳区红旗路8号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1006,
    parent_id:    null,
    space_code:   "B006",
    name:         "解放路旧式办公楼",
    short_name:   "解放办公楼",
    type:         "2",
    latitude:     46.8274,
    longitude:    130.3532,
    address_desc: "黑龙江省佳木斯市向阳区解放路47号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1007,
    parent_id:    null,
    space_code:   "B007",
    name:         "建设街历史公寓",
    short_name:   "建设历史公寓",
    type:         "2",
    latitude:     46.8361,
    longitude:    130.3508,
    address_desc: "黑龙江省佳木斯市向阳区建设街56号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1008,
    parent_id:    null,
    space_code:   "B008",
    name:         "文化路砖木结构楼",
    short_name:   "文化砖木楼",
    type:         "2",
    latitude:     46.8283,
    longitude:    130.3487,
    address_desc: "黑龙江省佳木斯市向阳区文化路12号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },

  // ── 前进区（B009-B016）——————————————————————————————————————————————————
  // 真实坐标：佳木斯市前进区，历史建筑集中于前进大街/保卫路/长安街/和平路一带
  // 中心参考：前进区政府 46.8195°N 130.3745°E
  {
    id:           1009,
    parent_id:    null,
    space_code:   "B009",
    name:         "前进大街历史楼",
    short_name:   "前进历史楼",
    type:         "2",
    latitude:     46.8208,
    longitude:    130.3745,
    address_desc: "黑龙江省佳木斯市前进区前进大街3号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1010,
    parent_id:    null,
    space_code:   "B010",
    name:         "保卫路民国院落",
    short_name:   "保卫民国院",
    type:         "2",
    latitude:     46.8227,
    longitude:    130.3772,
    address_desc: "黑龙江省佳木斯市前进区保卫路19号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1011,
    parent_id:    null,
    space_code:   "B011",
    name:         "长安街旧时商铺",
    short_name:   "长安旧商铺",
    type:         "2",
    latitude:     46.8178,
    longitude:    130.3796,
    address_desc: "黑龙江省佳木斯市前进区长安街66号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1012,
    parent_id:    null,
    space_code:   "B012",
    name:         "和平路苏式建筑",
    short_name:   "和平苏式楼",
    type:         "2",
    latitude:     46.8244,
    longitude:    130.3718,
    address_desc: "黑龙江省佳木斯市前进区和平路28号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1013,
    parent_id:    null,
    space_code:   "B013",
    name:         "黎明街历史公建",
    short_name:   "黎明公建",
    type:         "2",
    latitude:     46.8213,
    longitude:    130.3754,
    address_desc: "黑龙江省佳木斯市前进区黎明街41号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1014,
    parent_id:    null,
    space_code:   "B014",
    name:         "富锦路老式宿舍楼",
    short_name:   "富锦老宿舍",
    type:         "2",
    latitude:     46.8189,
    longitude:    130.3781,
    address_desc: "黑龙江省佳木斯市前进区富锦路7号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1015,
    parent_id:    null,
    space_code:   "B015",
    name:         "教育街历史校舍",
    short_name:   "教育老校舍",
    type:         "2",
    latitude:     46.8236,
    longitude:    130.3731,
    address_desc: "黑龙江省佳木斯市前进区教育街93号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1016,
    parent_id:    null,
    space_code:   "B016",
    name:         "永红路砖混结构楼",
    short_name:   "永红砖混楼",
    type:         "2",
    latitude:     46.8165,
    longitude:    130.3808,
    address_desc: "黑龙江省佳木斯市前进区永红路55号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },

  // ── 东风区（B017-B023）——————————————————————————————————————————————————
  // 真实坐标：佳木斯市东风区，历史建筑集中于东风大街/民主路/松江路一带
  // 中心参考：东风区政府 46.8103°N 130.3941°E
  {
    id:           1017,
    parent_id:    null,
    space_code:   "B017",
    name:         "东风大街历史建筑",
    short_name:   "东风历史楼",
    type:         "2",
    latitude:     46.8094,
    longitude:    130.3921,
    address_desc: "黑龙江省佳木斯市东风区东风大街2号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1018,
    parent_id:    null,
    space_code:   "B018",
    name:         "民主路旧工厂附属楼",
    short_name:   "民主旧厂楼",
    type:         "2",
    latitude:     46.8117,
    longitude:    130.3942,
    address_desc: "黑龙江省佳木斯市东风区民主路34号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1019,
    parent_id:    null,
    space_code:   "B019",
    name:         "松江路民国别墅",
    short_name:   "松江民国墅",
    type:         "2",
    latitude:     46.8079,
    longitude:    130.3961,
    address_desc: "黑龙江省佳木斯市东风区松江路16号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1020,
    parent_id:    null,
    space_code:   "B020",
    name:         "三道街历史公寓楼",
    short_name:   "三道历史公寓",
    type:         "2",
    latitude:     46.8102,
    longitude:    130.3927,
    address_desc: "黑龙江省佳木斯市东风区三道街78号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1021,
    parent_id:    null,
    space_code:   "B021",
    name:         "江滨路苏联专家楼",
    short_name:   "江滨专家楼",
    type:         "2",
    latitude:     46.8068,
    longitude:    130.3982,
    address_desc: "黑龙江省佳木斯市东风区江滨路5号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1022,
    parent_id:    null,
    space_code:   "B022",
    name:         "团结路旧式医院楼",
    short_name:   "团结旧医院",
    type:         "2",
    latitude:     46.8131,
    longitude:    130.3908,
    address_desc: "黑龙江省佳木斯市东风区团结路23号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           1023,
    parent_id:    null,
    space_code:   "B023",
    name:         "创业街百年老宅",
    short_name:   "创业百年宅",
    type:         "2",
    latitude:     46.8056,
    longitude:    130.3969,
    address_desc: "黑龙江省佳木斯市东风区创业街107号",
    is_outdoor:   0,
    create_time:  "2025-01-01 00:00:00",
  },
]

/**
 * seedBuildings — 初始化 23 栋历史建筑数据
 *
 * 直接覆盖 iot_space 全表，每次调用结果相同（幂等）。
 * risk_color 为运行时计算结果（不存入此表）；
 * 建筑与区域、组织的关联由 T15.28 seedSpaceRelation 负责建立。
 */
export function seedBuildings(): void {
  setTable("iot_space", BUILDING_SEED_ROWS)
}
