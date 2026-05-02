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
| 大屏端   | /screen/home       | 一体化综合监管大屏         |
| 大屏应急 | /screen/emergency  | 应急管理页面               |
| 后台管理 | /admin/dashboard   | 管理后台主页               |
| 后台工单 | /admin/work-orders | 工单列表管理               |
| 后台告警 | /admin/alarms      | 告警管理                   |
| 后台督办 | /admin/supervision | 督办管理                   |
| 移动端   | /h5/work-orders    | H5 移动端工单处置          |
| 演示控制台 | /admin/demo-console | 演示场景控制台（重置/触发）|

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
