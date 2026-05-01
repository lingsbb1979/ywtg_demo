/**
 * T15.11 TDD — 定义状态枚举
 *
 * 验收标准：
 *   - 完成风险等级、告警状态、工单状态、证据类型、演示场景枚举
 *   - 枚举值来源于 完整需求.md（第八、九、十章）和完整SQL.md
 *   - 枚举命名规范：PascalCase 枚举名，SCREAMING_SNAKE_CASE 成员
 *   - 所有枚举从 src/models/enums.ts 导出
 *   - 演示场景枚举（DemoScenario）只作为代码常量，不写入 localStorage 业务表
 *
 * 枚举映射：
 *   RiskLevel        → 风险等级（5 色：GREEN/YELLOW/ORANGE/RED/RED_FLASH）
 *   AlarmStatus      → 告警状态（待确认/已确认/已派单/已处置/误报关闭）
 *   WorkOrderStatus  → 工单状态机（派单→待接单→处理中→待核查→已销号 + 异常态）
 *   EvidenceType     → 现场证据类型（照片/视频/GPS签到/文字说明）
 *   DemoScenario     → 演示场景（正常/橙色裂缝/红色倾斜/超时督办/数据恢复）
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const enumsPath = join(projectRoot, "src", "models", "enums.ts")

function src(): string {
  return readFileSync(enumsPath, "utf-8")
}

// ── 文件存在 ─────────────────────────────────────────────────────────────────

describe("T15.11 状态枚举 — 文件结构", () => {
  it("应存在 src/models/enums.ts 文件", () => {
    expect(existsSync(enumsPath), "缺少 src/models/enums.ts").toBe(true)
  })

  it("应导出 RiskLevel 枚举（风险等级）", () => {
    expect(src()).toMatch(/export\s+(const\s+enum|enum)\s+RiskLevel\b/)
  })

  it("应导出 AlarmStatus 枚举（告警状态）", () => {
    expect(src()).toMatch(/export\s+(const\s+enum|enum)\s+AlarmStatus\b/)
  })

  it("应导出 WorkOrderStatus 枚举（工单状态）", () => {
    expect(src()).toMatch(/export\s+(const\s+enum|enum)\s+WorkOrderStatus\b/)
  })

  it("应导出 EvidenceType 枚举（证据类型）", () => {
    expect(src()).toMatch(/export\s+(const\s+enum|enum)\s+EvidenceType\b/)
  })

  it("应导出 DemoScenario 枚举（演示场景）", () => {
    expect(src()).toMatch(/export\s+(const\s+enum|enum)\s+DemoScenario\b/)
  })
})

// ── RiskLevel 风险等级 ────────────────────────────────────────────────────────

describe("T15.11 RiskLevel — 5 个风险等级", () => {
  it("应包含 GREEN（绿色/稳定）", () => { expect(src()).toContain("GREEN") })
  it("应包含 YELLOW（黄色/关注）", () => { expect(src()).toContain("YELLOW") })
  it("应包含 ORANGE（橙色/警示）", () => { expect(src()).toContain("ORANGE") })
  it("应包含 RED（红色/危险）", () => { expect(src()).toContain("RED") })
  it("应包含 RED_FLASH（红色闪烁/特别紧急）", () => { expect(src()).toContain("RED_FLASH") })
})

// ── AlarmStatus 告警状态 ──────────────────────────────────────────────────────

describe("T15.11 AlarmStatus — 告警生命周期状态", () => {
  it("应包含 PENDING（待确认）", () => { expect(src()).toContain("PENDING") })
  it("应包含 CONFIRMED（已确认）", () => { expect(src()).toContain("CONFIRMED") })
  it("应包含 DISPATCHED（已派单）", () => { expect(src()).toContain("DISPATCHED") })
  it("应包含 RESOLVED（已处置）", () => { expect(src()).toContain("RESOLVED") })
  it("应包含 FALSE_ALARM（误报关闭）", () => { expect(src()).toContain("FALSE_ALARM") })
})

// ── WorkOrderStatus 工单状态 ──────────────────────────────────────────────────

describe("T15.11 WorkOrderStatus — 工单状态机（需求第十章）", () => {
  it("应包含 PENDING_ACCEPT（待接单）", () => { expect(src()).toContain("PENDING_ACCEPT") })
  it("应包含 PROCESSING（处理中）", () => { expect(src()).toContain("PROCESSING") })
  it("应包含 PENDING_CHECK（待核查）", () => { expect(src()).toContain("PENDING_CHECK") })
  it("应包含 CLOSED（已销号）", () => { expect(src()).toContain("CLOSED") })
  it("应包含 RETURNED（已退回）", () => { expect(src()).toContain("RETURNED") })
  it("应包含 TIMEOUT（已超时）", () => { expect(src()).toContain("TIMEOUT") })
})

// ── EvidenceType 证据类型 ─────────────────────────────────────────────────────

describe("T15.11 EvidenceType — 现场证据类型", () => {
  it("应包含 PHOTO（照片）", () => { expect(src()).toContain("PHOTO") })
  it("应包含 VIDEO（视频）", () => { expect(src()).toContain("VIDEO") })
  it("应包含 GPS_CHECKIN（GPS签到）", () => { expect(src()).toContain("GPS_CHECKIN") })
  it("应包含 TEXT（文字说明）", () => { expect(src()).toContain("TEXT") })
})

// ── DemoScenario 演示场景 ─────────────────────────────────────────────────────

describe("T15.11 DemoScenario — 演示场景常量（不写入 localStorage 业务表）", () => {
  it("应包含 NORMAL（正常/初始状态）", () => { expect(src()).toContain("NORMAL") })
  it("应包含 ORANGE_CRACK（橙色裂缝，T15.65 依赖）", () => { expect(src()).toContain("ORANGE_CRACK") })
  it("应包含 RED_TILT（红色倾斜，T15.66 依赖）", () => { expect(src()).toContain("RED_TILT") })
  it("应包含 TIMEOUT_SUPERVISION（超时督办，T15.67 依赖）", () => { expect(src()).toContain("TIMEOUT_SUPERVISION") })
  it("应包含 DATA_RECOVERY（数据恢复，T15.68 依赖）", () => { expect(src()).toContain("DATA_RECOVERY") })

  it("enums.ts 注释中不使用 ywtg.sqlite.* 键（演示场景不写业务表）", () => {
    expect(src().includes("ywtg.sqlite.")).toBe(false)
  })
})
