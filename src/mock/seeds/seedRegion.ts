/**
 * Seed — 区域数据初始化（T15.24）
 *
 * 向 sys_organization 写入国家、省、市三级行政区域演示数据。
 *
 * 规则：
 *   - org_type = 1 表示行政区域（与 T15.25 功能组织 org_type=2 区分）
 *   - org_level: 1=国家 2=省 3=市 4=区/县（后续 T15.25/T15.28 可补充）
 *   - parent_id 按层级链接
 *   - org_path: "/1" "/1/2" "/1/2/3" 格式
 *   - ancestors: 父级 id 逗号拼接（不含自身）
 *   - 幂等：先调用 setTable 整表覆盖，不累加
 *   - 只写 sys_organization 的合法字段（受 T15.23 白名单保护）
 */
import { setTable } from "../../services/sqliteMirrorRepository"

/** 行政区域组织类型常量（T15.25 功能组织用 ORG_TYPE_FUNCTIONAL = 2） */
export const ORG_TYPE_REGION = 1

/** T15.24 区域演示数据 —— 国家、省、市三级 */
const REGION_SEED_ROWS = [
  // ── 国家级 ─────────────────────────────────────────────────────────────
  {
    id:         1,
    org_code:   "100000",
    org_name:   "中华人民共和国",
    org_type:   ORG_TYPE_REGION,
    org_level:  1,
    parent_id:  null,
    org_path:   "/1",
    ancestors:  "",
    status:     1,
    sort_order: 1,
  },
  // ── 省级 ───────────────────────────────────────────────────────────────
  {
    id:         2,
    org_code:   "230000",
    org_name:   "黑龙江省",
    org_type:   ORG_TYPE_REGION,
    org_level:  2,
    parent_id:  1,
    org_path:   "/1/2",
    ancestors:  "1",
    status:     1,
    sort_order: 1,
  },
  // ── 市级 ───────────────────────────────────────────────────────────────
  {
    id:         3,
    org_code:   "230800",
    org_name:   "佳木斯市",
    org_type:   ORG_TYPE_REGION,
    org_level:  3,
    parent_id:  2,
    org_path:   "/1/2/3",
    ancestors:  "1,2",
    status:     1,
    sort_order: 1,
  },
  // ── 区/县级（P0 演示建筑所属区）──────────────────────────────────────
  {
    id:         4,
    org_code:   "230803",
    org_name:   "向阳区",
    org_type:   ORG_TYPE_REGION,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/4",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 1,
  },
  {
    id:         5,
    org_code:   "230804",
    org_name:   "前进区",
    org_type:   ORG_TYPE_REGION,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/5",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 2,
  },
  {
    id:         6,
    org_code:   "230805",
    org_name:   "东风区",
    org_type:   ORG_TYPE_REGION,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/6",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 3,
  },
]

/**
 * 初始化区域数据（T15.24）
 *
 * 将国家、省、市、区三级行政区域演示数据写入 sys_organization。
 * 幂等：重复调用覆盖写入，不累加行数。
 * 注意：只写区域类型（org_type=1）的数据；功能组织（住建局、街道等）
 * 由 T15.25 的 seedOrganization() 追加写入，id 段从 100 开始不重叠。
 */
export function seedRegion(): void {
  setTable("sys_organization", REGION_SEED_ROWS)
}
