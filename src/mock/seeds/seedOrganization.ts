/**
 * Seed — 功能组织数据初始化（T15.25）
 *
 * 向 sys_organization 追加住建局、街道办、城管局、应急管理局等演示功能组织。
 *
 * 规则：
 *   - org_type = 2 表示功能组织（与 T15.24 行政区域 org_type=1 区分）
 *   - id 段从 100 开始，不与区域数据（id 1-99）重叠
 *   - org_level: 4=市级功能机构 5=区级功能机构/街道
 *   - parent_id: 市级功能组织 → 佳木斯市(id=3)；区级 → 对应区(id=4/5/6)
 *   - 幂等：先移除现有 org_type=2 的行，再写入新行，不影响 org_type=1 区域数据
 *   - 所有字段通过 T15.23 白名单校验
 *
 * 演示组织说明：
 *   市级机构（parent_id=3, org_level=4）
 *     101 佳木斯市住房和城乡建设局（住建局）  → 负责工单派遣、核查
 *     102 佳木斯市城市管理行政执法局（城管局） → 协同处置
 *     103 佳木斯市应急管理局（应急局）         → 红色告警应急占位
 *   区级机构（parent_id=4/5/6, org_level=5）
 *     104 向阳区住房和城乡建设局
 *     105 前进区住房和城乡建设局
 *     106 东风区住房和城乡建设局
 *   街道办事处（parent_id=4/5/6, org_level=5）
 *     107 向阳区建国街道办事处                → 外勤接单演示
 *     108 前进区长安街道办事处
 *     109 东风区东风街道办事处
 */
import { getTable, setTable } from "../../services/sqliteMirrorRepository"

/** 功能组织类型常量 */
export const ORG_TYPE_FUNCTIONAL = 2

/** T15.25 功能组织演示数据 */
const FUNCTIONAL_ORG_ROWS = [
  // ── 市级功能机构（parent_id=3 佳木斯市，org_level=4）──────────────────
  {
    id:         101,
    org_code:   "230800-ZJJZ",
    org_name:   "佳木斯市住房和城乡建设局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/101",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 1,
  },
  {
    id:         102,
    org_code:   "230800-CGZF",
    org_name:   "佳木斯市城管行政执法局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/102",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 2,
  },
  {
    id:         103,
    org_code:   "230800-YJGL",
    org_name:   "佳木斯市应急管理局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  4,
    parent_id:  3,
    org_path:   "/1/2/3/103",
    ancestors:  "1,2,3",
    status:     1,
    sort_order: 3,
  },
  // ── 区级住建（parent_id=4/5/6，org_level=5）──────────────────────────
  {
    id:         104,
    org_code:   "230803-ZJJZ",
    org_name:   "向阳区住房和城乡建设局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  4,
    org_path:   "/1/2/3/4/104",
    ancestors:  "1,2,3,4",
    status:     1,
    sort_order: 1,
  },
  {
    id:         105,
    org_code:   "230804-ZJJZ",
    org_name:   "前进区住房和城乡建设局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  5,
    org_path:   "/1/2/3/5/105",
    ancestors:  "1,2,3,5",
    status:     1,
    sort_order: 1,
  },
  {
    id:         106,
    org_code:   "230805-ZJJZ",
    org_name:   "东风区住房和城乡建设局",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  6,
    org_path:   "/1/2/3/6/106",
    ancestors:  "1,2,3,6",
    status:     1,
    sort_order: 1,
  },
  // ── 街道办事处（parent_id=4/5/6，org_level=5）────────────────────────
  {
    id:         107,
    org_code:   "230803-JGJ",
    org_name:   "向阳区建国街道办事处",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  4,
    org_path:   "/1/2/3/4/107",
    ancestors:  "1,2,3,4",
    status:     1,
    sort_order: 2,
  },
  {
    id:         108,
    org_code:   "230804-CAJ",
    org_name:   "前进区长安街道办事处",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  5,
    org_path:   "/1/2/3/5/108",
    ancestors:  "1,2,3,5",
    status:     1,
    sort_order: 2,
  },
  {
    id:         109,
    org_code:   "230805-DFJ",
    org_name:   "东风区东风街道办事处",
    org_type:   ORG_TYPE_FUNCTIONAL,
    org_level:  5,
    parent_id:  6,
    org_path:   "/1/2/3/6/109",
    ancestors:  "1,2,3,6",
    status:     1,
    sort_order: 2,
  },
]

/**
 * 初始化功能组织数据（T15.25）
 *
 * 追加住建局、城管局、应急管理局、街道办事处等演示功能组织到 sys_organization。
 * 幂等：先移除现有 org_type=2 的行，再写入，不影响 T15.24 写入的区域数据。
 */
export function seedOrganization(): void {
  // 保留区域数据（org_type=1），移除旧功能组织（org_type=2），再追加新功能组织
  const existing = getTable("sys_organization") as any[]
  const regionRows = existing.filter((r) => r.org_type !== ORG_TYPE_FUNCTIONAL)
  setTable("sys_organization", [...regionRows, ...FUNCTIONAL_ORG_ROWS])
}
