# 一网统管 Demo 演示启动说明

## 快速启动

```bash
cd source
npm install
npm run dev
```

默认监听 http://localhost:5173

---

## 演示账号

| 角色     | 账号  | 密码  |
|---------|-------|-------|
| 管理员   | admin | admin |
| 街道工作人员 | user | 123456 |
| 外勤人员 | field | 123456 |

---

## 三端路由

| 端       | 路由               | 说明                      |
|---------|--------------------|--------------------------|
| 大屏端   | http://localhost:5173/screen/home       | 一体化综合监管大屏         |
| 大屏应急 | http://localhost:5173/screen/emergency  | 应急管理页面               |
| 后台管理 | http://localhost:5173/admin/dashboard   | 管理后台主页               |
| 后台工单 | http://localhost:5173/admin/work-orders | 工单列表管理               |
| 后台告警 | http://localhost:5173/admin/alarms      | 告警管理                   |
| 后台督办 | http://localhost:5173/admin/supervision | 督办管理                   |
| 移动端   | http://localhost:5173/h5/work-orders    | H5 移动端工单处置          |
| 演示控制台 | http://localhost:5173/admin/demo-console | 演示场景控制台（重置/触发）|

---

## 演示控制台使用说明

访问 `/admin/demo-console`，可以：

1. **重置演示数据**（调用 `resetDemo()`）：清空所有表并还原为种子数据
2. **触发橙色裂缝告警**：模拟 B003 历史建筑 C 出现裂缝超限
3. **触发红色倾斜告警**：模拟 L 栋倾斜超限紧急事件
4. **触发超时督办**：模拟一条 200 分钟前未处置的工单，系统生成督办单

---

## SQLiteMirror 存储说明

所有业务数据存储于 localStorage，键格式为：

```
ywtg.sqlite.<tableName>
```

示例：
- `ywtg.sqlite.iot_space` — 建筑空间表
- `ywtg.sqlite.alarm_record` — 告警记录表
- `ywtg.sqlite.work_order` — 工单表
- `ywtg.sqlite.supervision_order` — 督办单表

UI 状态（演示角色等）使用 `ywtg.ui.*` 前缀，登录态使用 `ywtg.session.*`，不受重置影响。

---

## SQL 导出

当前演示数据可导出为 SQL INSERT 语句，方便后续迁移到真实数据库：

```typescript
import { exportToSql } from "@/services/sqlExportService"

// 导出全部表
const sql = exportToSql()

// 仅导出指定表
const partial = exportToSql({ tableNames: ["alarm_record", "work_order"] })
```

---

## 演示场景一：橙色裂缝闭环

完整流程：触发告警 → 确认告警 → 派单 → H5 接单 → H5 提交处置 → PC 核查销号 → 大屏闭环率更新

```
1. 进入 /admin/demo-console → 点击「重置演示数据」（resetDemo）
2. 点击「触发橙色裂缝告警」
3. 进入 /admin/alarms → 确认告警 → 派单
4. 切换 H5 端 /h5/work-orders → 接单 → 提交处置照片
5. 回到后台 /admin/work-orders → 核查通过
6. 查看大屏 /screen/home → 工单闭环率上升
```

## 演示场景二：超时督办

```
1. 重置演示数据
2. 触发「超时督办」场景
3. 查看 /admin/supervision → 出现新督办单
4. 大屏 KPI 超时工单数 > 0
```

## 演示场景三：手动录入裂缝数据重新计算风险

```
1. 重置演示数据
2. 进入 /admin/telemetry → 手动录入建筑 A 的裂缝宽度（例如 15.5mm）
3. 系统重新计算风险等级 → 由 GREEN 变 ORANGE
4. 大屏 /screen/home → 隐患数量更新
```

---

## 技术栈说明

- **前端框架**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **数据存储**：SQLiteMirror（localStorage 镜像，字段与后端 SQL 完全一致）
- **UI 规范**：参见 `docs/UI规范/`
- **测试框架**：Vitest

## 运行测试

```bash
cd source
npx vitest run
```


---


| 端 | 地址 | 是否需要登录 | 账号 |
|---|---|---|---|
| 大屏端 | /screen/home | **不需要** | 直接访问 |
| 大屏应急 | /screen/emergency | **不需要** | 直接访问 |
| 后台管理 | /admin/dashboard | 需要 | **admin / admin** |
| 后台工单 | /admin/work-orders | 需要 | **admin / admin** |
| 后台告警 | /admin/alarms | 需要 | **admin / admin** |
| 后台督办 | /admin/supervision | 需要 | **admin / admin** |
| 演示控制台 | /admin/demo-console | 需要 | **admin / admin** |
| 移动端 | /h5/work-orders | 需要 | **field / 123456** |


**说明：**

- `/screen/*` 在路由里没有 `requiresAuth: true`，无需登录，直接访问
- 所有 `/admin/*` 共用一个 admin 账号，登录一次就通
- `/h5/*` 理论上也是 admin 账号能进，但演示语义上用 `field`（外勤人员）更合理，右上角切到"街道外勤"视角会自动帮你切到 field 账号并跳转

**现在登录体验已修复**：改用 `localStorage` 后，登录一次就永久生效，直接点 URL 不再要求重新登录。

### 角色
领导参观
市级值班员
街道外勤
省级监管
国家监管

### 演示账号

| 端       | 路由               | 说明                      |
|---------|--------------------|--------------------------|
| 大屏端   | http://localhost:5173/screen/home       | 一体化综合监管大屏         |
| 大屏应急 | http://localhost:5173/screen/emergency  | 应急管理页面               |
| 后台管理 | http://localhost:5173/admin/dashboard   | 管理后台主页               |
| 后台工单 | http://localhost:5173/admin/work-orders | 工单列表管理               |
| 后台告警 | http://localhost:5173/admin/alarms      | 告警管理                   |
| 后台督办 | http://localhost:5173/admin/supervision | 督办管理                   |
| 移动端   | http://localhost:5173/h5/work-orders    | H5 移动端工单处置          |
| 演示控制台 | http://localhost:5173/admin/demo-console | 演示场景控制台（重置/触发）|

**H5 为什么不提示登录**：因为你已经用 admin 登录了，auth 只检查"是否有人登录"，不检查是谁。H5 路由有 `requiresAuth` 但 admin 账号满足条件，所以直接放行。这是正确行为——切到"街道外勤"视角后，自动换成 field 账号，再访问 H5 就是 field 身份。

**大屏为什么不需要登录**：`/screen/*` 路由没有 `requiresAuth`，这是故意的——大屏一般是投影在会议室/指挥中心的专用屏，一直开着不需要每次登录。两种用途都适用：值班员盯屏不用登录，领导参观直接看。这个设计没问题，不需要改。

**账号规划建议**，3个账号对应3个真实角色，去掉"省级/国家监管"这两个占位的鸡肋选项：

| 角色 | 账号 | 密码 | 默认落地页 |
|---|---|---|---|
| 市级值班员 | admin | admin | /admin/dashboard |
| 领导参观 | leader | 123456 | /screen/home |
| 街道外勤 | field | 123456 | /admin/demo-console → H5 |

**账号体系（最终版，3个账号）**

| 演示视角 | 账号 | 密码 | 切换后跳转 |
|---|---|---|---|
| 市级值班员 | `admin` | `admin` | /admin/dashboard |
| 领导参观 | `leader` | `123456` | /screen/home |
| 街道外勤 | `field` | `123456` | /admin/demo-console |
| 省级督办 | `admin` | `admin` | /admin/supervision 督办管理、建筑档案、大屏、演示控制台 |
| 演示控制台 | `admin` | `admin` | /admin/demo-console 督办管理、建筑档案、大屏、演示控制台 |

- 原来 `user` 账号去掉了（没有对应角色，是多余的）
- `leader` 是新增账号，之前领导参观也用 admin，现在区分开

**右上角从鸡肋变成有用的**

之前：只有一个"演示视角"下拉，什么都不显示

现在：`市级值班员 · admin  [切换 ▾]`
- 左边白色粗体显示当前角色名
- 蓝色等宽字体显示当前账号（一眼能认出）
- 下拉选项也变成 `市级值班员（admin）` 格式，切换前就知道会换成哪个账号

**省级监管/国家监管从下拉移除**，就 3 个真实演示选项，不拖泥带水。