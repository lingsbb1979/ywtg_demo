/**
 * Seed — 用户数据初始化（T15.26）
 *
 * 向 sys_user 写入 Demo 演示所需的固定账号：
 *   admin     — 系统管理员 / 市级值班员视角，归属佳木斯市住建局（org_id=101）
 *   street01  — 街道外勤视角，归属向阳区建国街道办事处（org_id=107）
 *   leader01  — 领导参观视角，归属佳木斯市住建局（org_id=101）
 *
 * 规则：
 *   - user_type=1 表示系统管理员账号（admin），0 表示普通业务用户
 *   - password 在 Demo 中存储明文用于前端演示，不使用真实 BCrypt 哈希
 *   - status=1 表示正常启用
 *   - 幂等：每次调用直接覆盖 sys_user 全表（演示用户固定，不需保留外部数据）
 *   - 所有字段通过 T15.23 白名单校验（sys_user 字段集）
 *
 * 字段说明（对应 完整SQL.md sys_user 表）：
 *   id, username, login_name, user_name, password, real_name,
 *   org_id, phone, phonenumber, email, status, user_type,
 *   last_login_time, create_time
 *
 * 演示账号 / 角色对照：
 *   id=1  admin     → demoRole: DUTY_OFFICER（市级值班员），user_type=1
 *   id=2  street01  → demoRole: FIELD_WORKER（街道外勤），user_type=0
 *   id=3  leader01  → demoRole: LEADER（领导参观），user_type=0
 */
import { setTable } from "../../services/sqliteMirrorRepository"

/** T15.26 演示用户数据 */
export const USER_SEED_ROWS = [
  {
    id:              1,
    username:        "admin",
    login_name:      "admin",
    user_name:       "admin",
    password:        "admin",
    real_name:       "系统管理员",
    org_id:          101,          // 佳木斯市住房和城乡建设局
    phone:           "13800000001",
    phonenumber:     "13800000001",
    email:           "admin@jms-demo.local",
    status:          1,
    user_type:       1,            // 1 = 系统管理员账号
    last_login_time: null as unknown as string,
    create_time:     "2025-01-01 00:00:00",
  },
  {
    id:              2,
    username:        "street01",
    login_name:      "street01",
    user_name:       "street01",
    password:        "street01",
    real_name:       "张建国（向阳街道）",
    org_id:          107,          // 向阳区建国街道办事处
    phone:           "13800000002",
    phonenumber:     "13800000002",
    email:           "street01@jms-demo.local",
    status:          1,
    user_type:       0,            // 0 = 普通业务用户
    last_login_time: null as unknown as string,
    create_time:     "2025-01-01 00:00:00",
  },
  {
    id:              3,
    username:        "leader01",
    login_name:      "leader01",
    user_name:       "leader01",
    password:        "leader01",
    real_name:       "王建国（佳木斯市住建局局长）",
    org_id:          101,          // 佳木斯市住房和城乡建设局
    phone:           "13800000003",
    phonenumber:     "13800000003",
    email:           "leader01@jms-demo.local",
    status:          1,
    user_type:       0,
    last_login_time: null as unknown as string,
    create_time:     "2025-01-01 00:00:00",
  },
]

/**
 * seedUser — 初始化演示用户数据
 *
 * 直接覆盖 sys_user 全表，每次调用结果相同（幂等）。
 * 若后续需追加用户，将新行加入 USER_SEED_ROWS 即可。
 */
export function seedUser(): void {
  setTable("sys_user", USER_SEED_ROWS)
}
