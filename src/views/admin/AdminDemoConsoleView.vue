<template>
  <!--
    T15.86 管理端演示控制台 /admin/demo-console
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌──────────── 页面标题：演示控制台 ─────────────────────────┐
    │  ⚙️ 演示控制台       当前 localStorage 数据状态           │
    ├──────────── zone:status ───────────────────────────────────┤
    │  [建筑] N 条  [告警] N 条  [工单] N 条  [督办] N 条       │
    ├──────────── zone:reset ────────────────────────────────────┤
    │  ▌ 重置演示数据                                            │
    │  重置后所有 localStorage 数据恢复到固定演示初始状态         │
    │  [⚠ 重置演示数据（全部清空重建）]                          │
    ├──────────── zone:scenarios ─────────────────────────────────┤
    │  ▌ 场景触发                                               │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │  🟠 触发橙色裂缝隐患                                  │  │
    │  │  B003 杏林路民国砖楼 | 裂缝宽度超阈值 | ORANGE        │  │
    │  │  [触发橙色裂缝隐患]                                   │  │
    │  ├─────────────────────────────────────────────────────┤  │
    │  │  🔴 触发红色倾斜告警                                  │  │
    │  │  B012 前进路俄式民居 | 倾斜角超红线 | RED 应急占位     │  │
    │  │  [触发红色告警]                                       │  │
    │  ├─────────────────────────────────────────────────────┤  │
    │  │  ⏰ 触发超时督办                                      │  │
    │  │  B001 历史建筑 | 派单 200 分钟前 | 超出 SLA           │  │
    │  │  [触发超时督办]                                       │  │
    │  ├─────────────────────────────────────────────────────┤  │
    │  │  🟢 模拟数据回稳                                      │  │
    │  │  将 B003 裂缝活跃告警标记为 CLOSED（测试恢复流程）     │  │
    │  │  [模拟数据回稳]                                       │  │
    │  └─────────────────────────────────────────────────────┘  │
    ├──────────── zone:shortcut ──────────────────────────────────┤
    │  ▌ 快捷跳转                                               │
    │  [打开大屏]  [打开 H5 移动端]  [告警中心]  [工单中心]     │
    ├──────────── zone:action-log ────────────────────────────────┤
    │  ▌ 操作日志                                               │
    │  [14:20:01] 已重置演示数据                                 │
    │  [14:22:05] 触发橙色裂缝隐患：B003                        │
    └────────────────────────────────────────────────────────────┘

    数据来源：scenarioService（resetDemo / triggerOrangeCrack / triggerRedAlert /
              triggerTimeoutSupervision / simulateDataRecovery）
    UI 规范：沿用 PC 管理端企业浅色主题
      - pc-card / admin-card 卡片容器
      - --pc-primary / --pc-bg-page / --pc-border tokens
      - btn-pc-primary / btn-pc-secondary / btn-pc-danger 按钮
  -->

  <div class="admin-demo-console" style="background:var(--pc-bg-page,#F0F4F9)">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">⚙️ 演示控制台</h2>
      <span class="admin-page-subtitle">{{ currentDate }} · localStorage 演示模式</span>
    </div>

    <!-- ① 数据状态栏（zone:status）-->
    <div class="pc-card admin-card admin-status-bar" data-zone="status">
      <div class="admin-status-bar__title">当前 localStorage 数据状态</div>
      <div class="admin-status-grid">
        <div class="admin-status-item">
          <span class="admin-status-item__label">iot_space 建筑</span>
          <span class="admin-status-item__count tabular-nums">{{ stats.spaces }}</span>
          <span class="admin-status-item__unit">条</span>
        </div>
        <div class="admin-status-item">
          <span class="admin-status-item__label">alarm_record 告警</span>
          <span class="admin-status-item__count tabular-nums" :class="stats.alarms > 0 ? 'text-danger' : ''">{{ stats.alarms }}</span>
          <span class="admin-status-item__unit">条</span>
        </div>
        <div class="admin-status-item">
          <span class="admin-status-item__label">work_order 工单</span>
          <span class="admin-status-item__count tabular-nums" :class="stats.orders > 0 ? 'text-warning' : ''">{{ stats.orders }}</span>
          <span class="admin-status-item__unit">条</span>
        </div>
        <div class="admin-status-item">
          <span class="admin-status-item__label">supervision_order 督办</span>
          <span class="admin-status-item__count tabular-nums">{{ stats.supervisions }}</span>
          <span class="admin-status-item__unit">条</span>
        </div>
      </div>
      <button class="btn-pc-secondary btn-sm" @click="loadStats">↻ 刷新状态</button>
    </div>

    <!-- ② 重置数据区（zone:reset）-->
    <div class="pc-card admin-card admin-console-section" data-zone="reset">
      <div class="admin-console-section__header">
        <span class="admin-console-section__title">🔄 重置演示数据</span>
        <span class="admin-console-section__desc">清空所有 localStorage 数据，重建固定演示初始状态（幂等）</span>
      </div>
      <div class="admin-console-section__body">
        <div class="admin-scenario-card admin-scenario-card--reset">
          <div class="admin-scenario-card__info">
            <div class="admin-scenario-card__title">全量重置</div>
            <div class="admin-scenario-card__detail">
              重置后：3 栋建筑 · 活跃告警 0 条 · 在处工单 0 条 · 督办清空（含 2 条已销号历史工单）
            </div>
            <div class="admin-scenario-card__warning">
              ⚠️ 重置演示数据（全部清空重建），此操作不可撤销
            </div>
          </div>
          <button
            class="btn-pc-danger"
            :disabled="loading === 'reset'"
            @click="doReset"
          >
            {{ loading === 'reset' ? '重置中...' : '⚠ 重置演示数据' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ③ 场景触发区（zone:scenarios）-->
    <div class="pc-card admin-card admin-console-section" data-zone="scenarios">
      <div class="admin-console-section__header">
        <span class="admin-console-section__title">🎬 场景触发</span>
        <span class="admin-console-section__desc">逐步触发演示场景，验证业务闭环流程</span>
      </div>
      <div class="admin-console-section__body admin-scenarios-grid">

        <!-- 场景 1：触发橙色裂缝隐患 -->
        <div class="admin-scenario-card admin-scenario-card--orange">
          <div class="admin-scenario-card__badge" style="background:#FEF3C7;color:#D97706">
            <span class="risk-dot risk-dot--orange" style="display:inline-block"></span>
            ORANGE
          </div>
          <div class="admin-scenario-card__title">触发橙色裂缝隐患</div>
          <div class="admin-scenario-card__detail">
            <strong>B003</strong> 杏林路民国砖楼<br>
            裂缝宽度超出橙色阈值，生成分析结果和告警
          </div>
          <button
            class="btn-pc-primary"
            :disabled="loading === 'crack'"
            @click="doOrangeCrack"
          >
            {{ loading === 'crack' ? '触发中...' : '🟠 触发橙色裂缝隐患' }}
          </button>
        </div>

        <!-- 场景 2：触发红色告警 -->
        <div class="admin-scenario-card admin-scenario-card--red">
          <div class="admin-scenario-card__badge" style="background:#FEE2E2;color:#DC2626">
            <span class="risk-dot risk-dot--red" style="display:inline-block"></span>
            RED
          </div>
          <div class="admin-scenario-card__title">触发红色倾斜告警</div>
          <div class="admin-scenario-card__detail">
            <strong>B012</strong> 前进路俄式民居<br>
            倾斜角超出红色阈值，生成应急占位告警和工单
          </div>
          <button
            class="btn-pc-primary btn-pc-primary--red"
            style="background:var(--color-danger,#EF4444);border-color:var(--color-danger,#EF4444)"
            :disabled="loading === 'red'"
            @click="doRedAlert"
          >
            {{ loading === 'red' ? '触发中...' : '🔴 触发红色告警' }}
          </button>
        </div>

        <!-- 场景 3：超时督办 -->
        <div class="admin-scenario-card admin-scenario-card--timeout">
          <div class="admin-scenario-card__badge" style="background:#EDE9FE;color:#7C3AED">
            <span>⏰</span>
            TIMEOUT
          </div>
          <div class="admin-scenario-card__title">触发超时督办</div>
          <div class="admin-scenario-card__detail">
            <strong>B001</strong> 历史建筑 A<br>
            工单派单时间提前 200 分钟，超出 SLA（120 分钟），生成督办单
          </div>
          <button
            class="btn-pc-secondary"
            :disabled="loading === 'timeout'"
            @click="doTimeoutSupervision"
          >
            {{ loading === 'timeout' ? '触发中...' : '⏰ 触发超时督办' }}
          </button>
        </div>

        <!-- 场景 4：模拟数据回稳 -->
        <div class="admin-scenario-card admin-scenario-card--recovery">
          <div class="admin-scenario-card__badge" style="background:#D1FAE5;color:#059669">
            <span class="risk-dot risk-dot--green" style="display:inline-block"></span>
            RECOVERY
          </div>
          <div class="admin-scenario-card__title">模拟数据回稳</div>
          <div class="admin-scenario-card__detail">
            <strong>B003</strong> 裂缝数据恢复正常<br>
            将 B003 活跃裂缝告警标记为 CLOSED，用于演示数据恢复流程
          </div>
          <button
            class="btn-pc-secondary btn-pc-secondary--success"
            style="color:var(--color-success,#10B981);border-color:var(--color-success,#10B981)"
            :disabled="loading === 'recovery'"
            @click="doDataRecovery"
          >
            {{ loading === 'recovery' ? '恢复中...' : '🟢 模拟数据回稳' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ④ 快捷跳转（zone:shortcut）-->
    <div class="pc-card admin-card admin-console-section" data-zone="shortcut">
      <div class="admin-console-section__header">
        <span class="admin-console-section__title">🔗 快捷跳转</span>
        <span class="admin-console-section__desc">触发场景后快速切换到对应页面验证效果</span>
      </div>
      <div class="admin-console-section__body admin-shortcut-grid">
        <router-link class="admin-shortcut-btn" to="/screen/home" target="_blank">
          <span class="admin-shortcut-btn__icon">📺</span>
          <div>
            <div class="admin-shortcut-btn__label">打开大屏</div>
            <div class="admin-shortcut-btn__desc">查看建筑点位和隐患态势</div>
          </div>
        </router-link>
        <router-link class="admin-shortcut-btn" to="/h5/work-orders" target="_blank">
          <span class="admin-shortcut-btn__icon">📱</span>
          <div>
            <div class="admin-shortcut-btn__label">打开 H5 移动端</div>
            <div class="admin-shortcut-btn__desc">外勤接单处置演示</div>
          </div>
        </router-link>
        <router-link class="admin-shortcut-btn" to="/admin/alarms" target="_blank">
          <span class="admin-shortcut-btn__icon">🚨</span>
          <div>
            <div class="admin-shortcut-btn__label">告警中心</div>
            <div class="admin-shortcut-btn__desc">确认告警 · 自动派单</div>
          </div>
        </router-link>
        <router-link class="admin-shortcut-btn" to="/admin/work-orders" target="_blank">
          <span class="admin-shortcut-btn__icon">📝</span>
          <div>
            <div class="admin-shortcut-btn__label">工单中心</div>
            <div class="admin-shortcut-btn__desc">核查工单 · 销号闭环</div>
          </div>
        </router-link>
        <router-link class="admin-shortcut-btn" to="/admin/buildings" target="_blank">
          <span class="admin-shortcut-btn__icon">🏚</span>
          <div>
            <div class="admin-shortcut-btn__label">建筑档案</div>
            <div class="admin-shortcut-btn__desc">23 栋历史建筑列表</div>
          </div>
        </router-link>
        <router-link class="admin-shortcut-btn" to="/admin/dashboard" target="_blank">
          <span class="admin-shortcut-btn__icon">📊</span>
          <div>
            <div class="admin-shortcut-btn__label">工作台</div>
            <div class="admin-shortcut-btn__desc">查看整体数据看板</div>
          </div>
        </router-link>
        <!-- T15.117 — 当前工单详情（动态跳转到最新待处理工单） -->
        <button
          class="admin-shortcut-btn admin-shortcut-btn--dynamic"
          @click="goToOrder"
          :title="currentOrderId ? `跳转到工单 #${currentOrderId}` : '暂无待处理工单'"
        >
          <span class="admin-shortcut-btn__icon">🗂</span>
          <div>
            <div class="admin-shortcut-btn__label">当前工单详情</div>
            <div class="admin-shortcut-btn__desc tabular-nums">
              {{ currentOrderId ? `工单 #${currentOrderId}` : '暂无待处理工单' }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ⑤ 操作日志（zone:action-log）-->
    <div class="pc-card admin-card admin-console-section" data-zone="action-log">
      <div class="admin-console-section__header">
        <span class="admin-console-section__title">📋 操作日志</span>
        <button class="btn-pc-secondary btn-sm" @click="clearLog">清空日志</button>
      </div>
      <div class="admin-action-log">
        <div v-if="actionLog.length === 0" class="admin-action-log__empty">
          暂无操作记录，触发场景后会显示操作日志
        </div>
        <div v-for="(msg, i) in actionLog" :key="i" class="admin-action-log__item">
          <span class="admin-action-log__time tabular-nums">{{ msg.time }}</span>
          <span
            class="admin-action-log__content"
            :class="msg.type === 'success' ? 'text-success' : msg.type === 'error' ? 'text-danger' : ''"
          >
            {{ msg.text }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  resetDemo,
  triggerOrangeCrack,
  triggerRedAlert,
  triggerTimeoutSupervision,
  simulateDataRecovery,
} from "@/services/scenarioService"
import { getTable } from "@/services/sqliteMirrorRepository"

// ── 当前日期 ──────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, "0") }
const d = new Date()
const currentDate = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const loading = ref("")
const stats = ref({
  spaces:       0,
  alarms:       0,
  orders:       0,
  supervisions: 0,
})

interface LogEntry {
  time: string
  text: string
  type: "info" | "success" | "error"
}
const actionLog = ref([] as LogEntry[])

// ── 辅助：追加日志 ─────────────────────────────────────────────────────────────

function log(text: string, type: LogEntry["type"] = "info") {
  const now = new Date()
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  actionLog.value.unshift({ time, text, type })
  if (actionLog.value.length > 50) actionLog.value.splice(50)
}

function clearLog() {
  actionLog.value = []
}

// ── 辅助：刷新状态统计 ─────────────────────────────────────────────────────────

function loadStats() {
  const alarmRows = getTable<{ status?: string }>("alarm_record")
  const orderRows = getTable<{ status?: string }>("work_order")
  stats.value = {
    spaces:       getTable("iot_space").length,
    alarms:       alarmRows.filter((r) => r.status === "ACTIVE").length,
    orders:       orderRows.filter((r) => r.status !== "CLOSED").length,
    supervisions: getTable("supervision_order").length,
  }
}

// ── 操作处理 ──────────────────────────────────────────────────────────────────

function doReset() {
  loading.value = "reset"
  try {
    resetDemo()
    loadStats()
    log("✓ 已重置演示数据：23 栋建筑 · 2 条告警 · 2 条工单", "success")
  } catch (e) {
    log(`✗ 重置失败：${e}`, "error")
  } finally {
    loading.value = ""
  }
}

function doOrangeCrack() {
  loading.value = "crack"
  try {
    triggerOrangeCrack()
    loadStats()
    log("✓ 触发橙色裂缝隐患：B003 杏林路民国砖楼 | ORANGE 级告警已写入 alarm_record", "success")
  } catch (e) {
    log(`✗ 触发失败：${e}`, "error")
  } finally {
    loading.value = ""
  }
}

function doRedAlert() {
  loading.value = "red"
  try {
    triggerRedAlert()
    loadStats()
    log("✓ 触发红色倾斜告警：B012 前进路俄式民居 | RED 级告警 + PENDING 工单已写入", "success")
  } catch (e) {
    log(`✗ 触发失败：${e}`, "error")
  } finally {
    loading.value = ""
  }
}

function doTimeoutSupervision() {
  loading.value = "timeout"
  try {
    triggerTimeoutSupervision()
    loadStats()
    log("✓ 触发超时督办：B001 | 派单时间提前 200 分钟 | 督办单已写入 supervision_order", "success")
  } catch (e) {
    log(`✗ 触发失败：${e}`, "error")
  } finally {
    loading.value = ""
  }
}

function doDataRecovery() {
  loading.value = "recovery"
  try {
    simulateDataRecovery()
    loadStats()
    log("✓ 模拟数据回稳：B003 裂缝活跃告警已标记为 CLOSED", "success")
  } catch (e) {
    log(`✗ 回稳失败：${e}`, "error")
  } finally {
    loading.value = ""
  }
}

// ── T15.117 当前工单详情快捷跳转 ─────────────────────────────────────────────

const router = useRouter()

/** 当前最新待处理工单的 id：优先取 PENDING > PROCESSING > CHECKING */
const currentOrderId = computed(() => {
  const orders = getTable<{ id: number; status: string }>("work_order")
  const active = orders.find(
    (o) => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "CHECKING",
  )
  return active?.id ?? null
})

function goToOrder() {
  if (currentOrderId.value != null) {
    window.open(`/admin/work-orders/${currentOrderId.value}`, "_blank")
  } else {
    window.open("/admin/work-orders", "_blank")
  }
}

// ── 初始化 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-demo-console {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  background: var(--pc-bg-page, #F0F4F9);
}

/* 页面标题 */
.admin-page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(to right, var(--pc-primary, #1B6FE8), transparent 60%);
  background-position: bottom;
  background-size: 100% 2px;
  background-repeat: no-repeat;
}
.admin-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
  margin: 0;
}
.admin-page-subtitle {
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== pc-card 基础卡片 ===== */
.pc-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}
.admin-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}

/* ===== 数据状态栏 ===== */
.admin-status-bar {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.admin-status-bar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.admin-status-item {
  background: var(--pc-bg-page, #F0F4F9);
  border-radius: var(--radius-md, 8px);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-status-item__label {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  flex: 1;
}
.admin-status-item__count {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-status-item__unit {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}

/* ===== 控制台区块通用 ===== */
.admin-console-section {
  display: flex;
  flex-direction: column;
}
.admin-console-section__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  flex-shrink: 0;
}
.admin-console-section__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-console-section__desc {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  flex: 1;
}
.admin-console-section__body {
  padding: 16px 20px;
}

/* ===== 场景卡片网格 ===== */
.admin-scenarios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.admin-scenario-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--pc-border, #E2E8F0);
  background: var(--pc-bg-page, #F8FAFC);
}
.admin-scenario-card--orange { border-left: 4px solid var(--risk-orange, #FF8A3D); }
.admin-scenario-card--red    { border-left: 4px solid var(--color-danger, #EF4444); }
.admin-scenario-card--timeout{ border-left: 4px solid #8B5CF6; }
.admin-scenario-card--recovery{ border-left: 4px solid var(--color-success, #10B981); }
.admin-scenario-card--reset  { border-left: 4px solid var(--color-danger, #EF4444); }

.admin-scenario-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}
.admin-scenario-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-scenario-card__detail {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  line-height: 1.6;
  flex: 1;
}
.admin-scenario-card__warning {
  font-size: 12px;
  color: var(--color-danger, #EF4444);
  padding: 8px 10px;
  background: #FEE2E2;
  border-radius: var(--radius-sm, 6px);
}

/* 重置区布局 */
.admin-console-section__body .admin-scenario-card--reset {
  flex-direction: row;
  align-items: center;
  background: #fff;
  gap: 20px;
}
.admin-scenario-card--reset .admin-scenario-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== 快捷跳转 ===== */
.admin-shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.admin-shortcut-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--pc-border, #E2E8F0);
  background: var(--pc-bg-page, #F8FAFC);
  text-decoration: none;
  color: inherit;
  transition: all var(--duration-micro, 150ms) ease;
  cursor: pointer;
}
.admin-shortcut-btn:hover {
  background: #EFF6FF;
  border-color: var(--pc-primary, #1B6FE8);
  box-shadow: var(--pc-shadow-sm, 0 2px 8px rgba(27,111,232,0.10));
}
.admin-shortcut-btn__icon { font-size: 22px; }
.admin-shortcut-btn__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-shortcut-btn__desc {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  margin-top: 2px;
}

/* ===== 操作日志 ===== */
.admin-action-log {
  padding: 0 20px 16px;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.admin-action-log__empty {
  padding: 24px 0;
  text-align: center;
  color: var(--pc-text-muted, #94A3B8);
  font-size: 13px;
}
.admin-action-log__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--pc-border, #E2E8F0);
  background: var(--pc-bg-page, #F8FAFC);
}
.admin-action-log__time {
  color: var(--pc-text-muted, #94A3B8);
  flex-shrink: 0;
  font-size: 12px;
  padding-top: 1px;
}
.admin-action-log__content {
  flex: 1;
  color: var(--pc-text-body, #374151);
  line-height: 1.5;
}

/* ===== 按钮 ===== */
.btn-pc-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--pc-primary, #1B6FE8);
  color: #fff;
  border: 1px solid var(--pc-primary, #1B6FE8);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-micro, 150ms) ease;
  text-align: center;
  white-space: nowrap;
}
.btn-pc-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-pc-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-pc-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: #fff;
  color: var(--pc-text-body, #374151);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-micro, 150ms) ease;
  white-space: nowrap;
}
.btn-pc-secondary:hover:not(:disabled) {
  border-color: var(--pc-primary, #1B6FE8);
  color: var(--pc-primary, #1B6FE8);
}
.btn-pc-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-pc-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  background: var(--color-danger, #EF4444);
  color: #fff;
  border: 1px solid var(--color-danger, #EF4444);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-micro, 150ms) ease;
  white-space: nowrap;
}
.btn-pc-danger:hover:not(:disabled) { opacity: 0.9; }
.btn-pc-danger:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-sm { padding: 5px 12px; font-size: 12px; }

/* ===== 颜色辅助 ===== */
.text-danger  { color: var(--color-danger,  #EF4444); }
.text-warning { color: var(--risk-orange,   #FF8A3D); }
.text-success { color: var(--color-success, #10B981); }

/* ===== risk-dot ===== */
.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red,    #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FACC15); }
.risk-dot--green  { background: var(--risk-green,  #10B981); }
</style>
