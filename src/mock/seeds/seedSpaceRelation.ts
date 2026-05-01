/**
 * Seed — 建筑空间关系初始化（T15.28）
 *
 * 在 seedBuildings（T15.27）之后执行，建立以下三种关联：
 *
 * 1. 区域节点追加：在 iot_space 中追加向阳区/前进区/东风区三个区域节点（type="1"），
 *    id 段 901-903，作为 23 栋建筑的父空间节点。
 *
 * 2. 建筑父子关联：更新 23 栋建筑的 parent_id，指向对应区域节点：
 *    B001-B008 (1001-1008) → 向阳区 (id=901)
 *    B009-B016 (1009-1016) → 前进区 (id=902)
 *    B017-B023 (1017-1023) → 东风区 (id=903)
 *
 * 3. 档案编号关联：在 digital_archive 中为每栋建筑创建 1 条初始档案记录，
 *    building_id = iot_space.id (1001-1023)，status=10（安全），一建筑一档。
 *
 * 规则：
 *   - 幂等：重复调用结果相同（先清除区域节点和旧 parent_id，再重建）
 *   - 依赖 seedBuildings 先执行（iot_space 已有 23 栋建筑）
 *   - 所有字段通过 T15.23 白名单校验
 *
 * 责任组织关联说明：
 *   建筑→责任组织的映射（如 B001 → 向阳区住建局 org_id=104）
 *   为运行时派单逻辑（T15.46 工单派遣），不在 iot_space 静态存储，
 *   通过 address_desc 中区名在运行时查找 sys_organization 确定。
 *
 * digital_archive.status 枚举：
 *   10=安全  20=关注（有黄单）  30=警示（有橙单）  40=危险（红色应急中）
 */
import { getTable, setTable } from "../../services/sqliteMirrorRepository"

// ── 区域节点常量 ──────────────────────────────────────────────────────────────

/** 区域节点 id（iot_space，type="1"），id 段 901-903 */
export const SPACE_REGION_XIANGYANG_ID = 901
export const SPACE_REGION_QIANJIN_ID   = 902
export const SPACE_REGION_DONGFENG_ID  = 903

/** iot_space 区域节点行 */
const REGION_SPACE_ROWS = [
  {
    id:           SPACE_REGION_XIANGYANG_ID,
    parent_id:    null,
    space_code:   "REGION-XY",
    name:         "向阳区历史建筑区域",
    short_name:   "向阳区",
    type:         "1",
    latitude:     46.8300,
    longitude:    130.3520,
    address_desc: "黑龙江省佳木斯市向阳区",
    is_outdoor:   1,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           SPACE_REGION_QIANJIN_ID,
    parent_id:    null,
    space_code:   "REGION-QJ",
    name:         "前进区历史建筑区域",
    short_name:   "前进区",
    type:         "1",
    latitude:     46.8200,
    longitude:    130.3760,
    address_desc: "黑龙江省佳木斯市前进区",
    is_outdoor:   1,
    create_time:  "2025-01-01 00:00:00",
  },
  {
    id:           SPACE_REGION_DONGFENG_ID,
    parent_id:    null,
    space_code:   "REGION-DF",
    name:         "东风区历史建筑区域",
    short_name:   "东风区",
    type:         "1",
    latitude:     46.8090,
    longitude:    130.3930,
    address_desc: "黑龙江省佳木斯市东风区",
    is_outdoor:   1,
    create_time:  "2025-01-01 00:00:00",
  },
]

/**
 * 根据 space_code 编号（B001-B023）确定所属区域节点 id
 * B001-B008 → 向阳区, B009-B016 → 前进区, B017-B023 → 东风区
 */
function getRegionId(spaceCode: string): number {
  const n = parseInt(spaceCode.replace("B", ""), 10)
  if (n >= 1 && n <= 8)  return SPACE_REGION_XIANGYANG_ID
  if (n >= 9 && n <= 16) return SPACE_REGION_QIANJIN_ID
  return SPACE_REGION_DONGFENG_ID
}

/**
 * seedSpaceRelation — 建立建筑空间关系并初始化档案
 *
 * 执行顺序：
 *   1. 读取 iot_space 现有数据（type="2" 的建筑行）
 *   2. 追加 3 个区域节点（type="1"），去重处理保证幂等
 *   3. 更新每栋建筑的 parent_id 指向对应区域节点
 *   4. 写回 iot_space
 *   5. 向 digital_archive 写入 23 条初始档案（直接覆盖保证幂等）
 */
export function seedSpaceRelation(): void {
  // ── 步骤 1-4：更新 iot_space ─────────────────────────────────────────────
  const existing = getTable("iot_space") as any[]

  // 保留 type="2" 建筑行，剔除旧的区域节点（type="1"），重建
  const buildingRows = existing.filter((r) => r.type !== "1")

  // 更新建筑 parent_id
  const updatedBuildings = buildingRows.map((row) => ({
    ...row,
    parent_id: getRegionId(row.space_code as string),
  }))

  // 合并区域节点 + 建筑行
  setTable("iot_space", [...REGION_SPACE_ROWS, ...updatedBuildings])

  // ── 步骤 5：初始化 digital_archive ──────────────────────────────────────
  const archiveRows = updatedBuildings.map((b, idx) => ({
    id:                   2001 + idx,
    building_id:          b.id as number,
    base_info_version:    "1.0",
    last_audit_time:      null as unknown as string,
    status:               10,              // 10=安全
  }))

  setTable("digital_archive", archiveRows)
}
