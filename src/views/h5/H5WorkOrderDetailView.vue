<template>
  <!--
    T15.84 H5 工单详情页 /h5/work-orders/:id
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌─────────────── h5-header（深蓝渐变，56px sticky）──────────┐
    │  ← 返回        工单详情              [通知图标]             │
    ├─────────────── zone:kpi-banner ────────────────────────────┤
    │  [告警等级徽章]  [工单状态]  [逾期标记]                    │
    │  建筑名称：永庆坊历史建筑                                   │
    │  告警描述：裂缝宽度超过阈值...                              │
    ├─────────────── zone:detail-card ───────────────────────────┤
    │  ┌── 工单信息 ─────────────────────────────────────────┐   │
    │  │  工单编号   │  WO-2026050200001                     │   │
    │  │  建筑编码   │  B003                                  │   │
    │  │  派单时间   │  2026-05-02 12:30  [SLA标记]           │   │
    │  │  接单时间   │  2026-05-02 12:45                     │   │
    │  │  当前状态   │  ● 处理中                              │   │
    │  └──────────────────────────────────────────────────── ┘   │
    ├─────────────── zone:metrics ───────────────────────────────┤
    │  ┌── 关键指标 ─────────────────────────────────────────┐   │
    │  │  ● 告警等级  ORANGE    ● 工单等级  ORANGE            │   │
    │  │  ● SLA 剩余: 45 分钟   ● 逾期: 否                    │   │
    │  └──────────────────────────────────────────────────── ┘   │
    ├─────────────── zone:actions ───────────────────────────────┤
    │  [接单（PENDING 时显示）]                                    │
    │  [去处置 + 上传现场证据（PROCESSING 时显示）]                │
    ├─────────────── zone:disposal-entry ────────────────────────┤
    │  处置说明 / 现场证据 / 位置签到入口                          │
    └────────────────────────────────────────────────────────────┘
    （底部 tabbar 由 H5Layout 提供）

    ─────────────────────────────────────────────────────────────
    数据来源：
      - workOrderService.getWorkOrder(id)  → work_order 表
      - update("work_order", id, {})       → 状态变更
    UI 规范：
      - 沿用 H5WorkOrdersView H5 移动端卡片主题
      - h5-header 深蓝渐变顶栏
      - h5-card / h5-sla / h5-accept-btn / badge / risk-dot
      - h5 tokens：--h5-primary / --h5-bg-card / --h5-border / --h5-shadow-card
  -->

  <div class="h5-work-order-detail h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- ===== 顶部导航栏（h5-header）===== -->
    <header class="h5-header">
      <button class="h5-header__back" @click="goBack">←</button>
      <span class="h5-header__title">工单详情</span>
      <div class="h5-header__actions">
        <span style="font-size:18px">🔔</span>
      </div>
    </header>

    <!-- ===== 加载中 / 无数据 ===== -->
    <div v-if="loading" class="h5-detail-loading">
      <span style="color:var(--h5-text-muted,#94A3B8)">加载中...</span>
    </div>

    <div v-else-if="!order" class="h5-detail-empty">
      <span class="h5-empty-icon">📭</span>
      <p>暂无工单数据，未找到对应工单</p>
      <button class="h5-accept-btn" @click="goBack">返回列表</button>
    </div>

    <div v-else class="h5-detail-content">

      <!-- ===== 顶部 Banner（zone:kpi-banner）===== -->
      <div class="h5-detail-banner" data-zone="kpi-banner"
        :class="`h5-detail-banner--${(order.alarmLevel ?? 'normal').toLowerCase()}`">
        <!-- 等级 + 状态徽章行 -->
        <div class="h5-detail-banner__badges">
          <span
            class="badge h5-risk-level--badge"
            :class="`h5-risk-level--${(order.alarmLevel ?? 'normal').toLowerCase()}`"
          >
            {{ order.alarmLevel ?? '普通' }} 级
          </span>
          <span class="badge" :class="statusBadgeClass(order.status)">
            {{ STATUS_LABEL[order.status ?? ''] ?? order.status ?? '—' }}
          </span>
          <span v-if="isOverdue(order.dispatchTime)" class="badge badge--overdue">逾期</span>
        </div>

        <!-- 建筑名称 -->
        <div class="h5-detail-banner__building">
          {{ order.buildingName ?? `建筑 #${order.buildingId}` }}
        </div>

        <!-- 告警描述 -->
        <div class="h5-detail-banner__alarm">
          {{ order.alarmTitle ?? order.alarmId ?? '待处理告警' }}
        </div>
      </div>

      <!-- ===== 工单信息卡片（zone:detail-card）===== -->
      <div class="h5-card h5-detail-card" data-zone="detail-card">
        <div class="h5-detail-card__title">工单信息</div>
        <div class="h5-detail-fields">
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">工单编号</span>
            <span class="h5-detail-field__value tabular-nums">{{ order.orderNo ?? order.orderCode ?? `WO-${order.id}` }}</span>
          </div>
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">建筑编码</span>
            <span class="h5-detail-field__value tabular-nums">{{ order.buildingCode ?? '—' }}</span>
          </div>
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">工单类型</span>
            <span class="h5-detail-field__value">{{ order.orderType ?? '—' }}</span>
          </div>
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">派单时间</span>
            <span class="h5-detail-field__value tabular-nums">
              {{ order.dispatchTime?.slice(0, 16) ?? '—' }}
              <span v-if="isOverdue(order.dispatchTime)" class="h5-sla h5-sla--overdue">逾期</span>
            </span>
          </div>
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">接单时间</span>
            <span class="h5-detail-field__value tabular-nums">{{ order.acceptTime?.slice(0, 16) ?? '—' }}</span>
          </div>
          <div class="h5-detail-field">
            <span class="h5-detail-field__label">当前状态</span>
            <span class="h5-detail-field__value">
              <span class="risk-dot" :class="statusDotClass(order.status)"></span>
              {{ STATUS_LABEL[order.status ?? ''] ?? order.status ?? '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ===== 关键指标（zone:metrics）===== -->
      <div class="h5-card h5-detail-card" data-zone="metrics">
        <div class="h5-detail-card__title">关键指标</div>
        <div class="h5-metrics-grid">
          <div class="h5-metric-item">
            <span class="h5-metric-item__label">告警等级</span>
            <div class="h5-metric-item__value">
              <span class="risk-dot" :class="riskDotClass(order.alarmLevel)"></span>
              <span>{{ order.alarmLevel ?? '—' }}</span>
            </div>
          </div>
          <div class="h5-metric-item">
            <span class="h5-metric-item__label">工单优先级</span>
            <div class="h5-metric-item__value">{{ order.orderLevel ?? '—' }}</div>
          </div>
          <div class="h5-metric-item">
            <span class="h5-metric-item__label">SLA 剩余</span>
            <div class="h5-metric-item__value tabular-nums">
              <span class="h5-sla" :class="isOverdue(order.dispatchTime) ? 'h5-sla--overdue' : ''">
                {{ slaRemain(order.dispatchTime) }}
              </span>
            </div>
          </div>
          <div class="h5-metric-item">
            <span class="h5-metric-item__label">是否逾期</span>
            <div class="h5-metric-item__value">
              <span :style="{ color: isOverdue(order.dispatchTime) ? 'var(--risk-red,#FF4444)' : 'var(--risk-green,#10B981)' }">
                {{ isOverdue(order.dispatchTime) ? '已逾期' : '未逾期' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 操作按钮区（zone:actions）===== -->
      <div class="h5-card h5-detail-actions" data-zone="actions">
        <!-- 接单按钮（PENDING 状态时显示）-->
        <button
          v-if="order.status === 'PENDING'"
          class="h5-accept-btn"
          data-testid="h5-accept-btn"
          style="min-height:44px"
          @click="acceptOrder"
        >
          接单 — 开始处置
        </button>

        <!-- 去处置按钮（PROCESSING 时显示）-->
        <button
          v-else-if="order.status === 'PROCESSING'"
          class="h5-accept-btn h5-accept-btn--processing"
          style="min-height:44px"
          @click="goDispose"
        >
          去处置
        </button>

        <!-- 其他状态提示 -->
        <div v-else class="h5-detail-status-hint">
          <span class="badge" :class="statusBadgeClass(order.status)">
            {{ STATUS_LABEL[order.status ?? ''] ?? '已完成' }}
          </span>
          <span style="font-size:13px;color:var(--h5-text-muted,#94A3B8);margin-left:8px">
            当前状态不可操作
          </span>
        </div>

        <!-- 操作反馈 -->
        <div v-if="actionMsg" class="h5-action-msg">{{ actionMsg }}</div>
      </div>

      <!-- ===== 处置入口（zone:disposal-entry）===== -->
      <div v-if="order.status === 'PROCESSING'" class="h5-card h5-disposal-entry" data-zone="disposal-entry">
        <div class="h5-detail-card__title">处置与证据</div>
        <div class="h5-disposal-actions">
          <!-- 处置入口链接 -->
          <router-link
            :to="`/h5/dispose/${order.id}`"
            class="h5-disposal-btn"
          >
            <span class="h5-disposal-btn__icon">📝</span>
            <div class="h5-disposal-btn__text">
              <span class="h5-disposal-btn__label">提交处置说明</span>
              <span class="h5-disposal-btn__sub">填写处置描述和备注</span>
            </div>
            <span class="h5-disposal-btn__arrow">›</span>
          </router-link>

          <!-- 上传现场证据 -->
          <div class="h5-evidence-entry h5-disposal-btn" @click="handleEvidence">
            <span class="h5-disposal-btn__icon">📷</span>
            <div class="h5-disposal-btn__text">
              <span class="h5-disposal-btn__label">上传现场证据</span>
              <span class="h5-disposal-btn__sub">拍照或选择演示照片</span>
            </div>
            <span class="h5-disposal-btn__arrow">›</span>
          </div>
        </div>
      </div>

      <!-- ===== 流程时间轴（zone:timeline）===== -->
      <div class="h5-card h5-detail-card" data-zone="timeline">
        <div class="h5-detail-card__title">处置时间轴</div>
        <ul class="h5-timeline">
          <li v-for="evt in timelineEvents" :key="evt.key" class="h5-timeline-item">
            <div class="h5-timeline-dot" :class="evt.dotClass"></div>
            <div class="h5-timeline-content">
              <span class="h5-timeline-content__title">{{ evt.title }}</span>
              <span v-if="evt.sub" class="h5-timeline-content__sub" style="display:block;font-size:12px;color:var(--h5-text-muted,#94A3B8);margin-top:2px">{{ evt.sub }}</span>
              <span class="h5-timeline-content__time tabular-nums">{{ evt.time }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getWorkOrder, type WorkOrderDetail } from "@/services/workOrderService"
import { update } from "@/services/sqliteMirrorRepository"

// ── 路由 ──────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

// ── 常量 ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待接单",
  PROCESSING: "处理中",
  CHECKING:   "待核查",
  FINISHED:   "已销号",
  CLOSED:     "已关闭",
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const order     = ref(null as WorkOrderDetail | null)
const loading   = ref(true)
const actionMsg = ref("")

// ── 时间轴事件（动态合并所有节点）─────────────────────────────────────────────

/** 统一时间格式：去掉 T 和毫秒，保留 "YYYY-MM-DD HH:mm" */
function normalizeTime(t: string | null | undefined): string {
  if (!t) return ""
  return t.replace("T", " ").replace(/\.\d+Z?$/, "").slice(0, 16)
}

interface TimelineEvent {
  key:      string
  title:    string
  sub?:     string
  time:     string
  dotClass: string
  sortKey:  string
}

const timelineEvents = computed((): TimelineEvent[] => {
  if (!order.value) return []
  const o = order.value
  const events: TimelineEvent[] = []

  // 1. 工单创建
  events.push({
    key:      "create",
    title:    "告警触发 · 工单创建",
    time:     normalizeTime(o.dispatchTime) || "—",
    dotClass: "h5-timeline-dot--done",
    sortKey:  normalizeTime(o.dispatchTime),
  })

  // 2. 外勤接单
  if (o.acceptTime) {
    events.push({
      key:      "accept",
      title:    "外勤接单",
      time:     normalizeTime(o.acceptTime),
      dotClass: "h5-timeline-dot--done",
      sortKey:  normalizeTime(o.acceptTime),
    })
  }

  // 3. 处置记录（来自 work_order_disposal）
  o.disposals?.forEach((d, i) => {
    const t = normalizeTime(d.disposalTime ?? d.createTime)
    events.push({
      key:      `disposal-${d.id}`,
      title:    `提交处置记录 #${i + 1}`,
      sub:      d.disposalDesc ?? undefined,
      time:     t,
      dotClass: "h5-timeline-dot--done",
      sortKey:  t,
    })
  })

  // 4. work_order_log 中的重要节点（FINISH / REJECT / VERIFY）
  const LOG_NODE: Record<string, { title: string; dotClass: string }> = {
    FINISH: { title: "处置完成 · 提交核查",   dotClass: "h5-timeline-dot--done"    },
    REJECT: { title: "⚠ 退回重办",            dotClass: "h5-timeline-dot--warning"  },
    VERIFY: { title: "✓ 核查通过 · 销号",      dotClass: "h5-timeline-dot--success"  },
  }
  o.logs?.forEach((l) => {
    const cfg = LOG_NODE[l.nodeType ?? ""]
    if (!cfg) return
    const t = normalizeTime(l.actionTime ?? l.createTime)
    events.push({
      key:      `log-${l.id}`,
      title:    cfg.title,
      sub:      l.remark ?? undefined,
      time:     t,
      dotClass: cfg.dotClass,
      sortKey:  t,
    })
  })

  // 5. 如果 finishTime 存在但 log 里没有 FINISH 节点（兼容旧数据）
  const hasFinishLog = o.logs?.some((l) => l.nodeType === "FINISH")
  if (o.finishTime && !hasFinishLog) {
    const t = normalizeTime(o.finishTime)
    events.push({
      key:      "finish-fallback",
      title:    "处置完成 · 待核查",
      time:     t,
      dotClass: "h5-timeline-dot--done",
      sortKey:  t,
    })
  }

  // 6. checkTime 兼容（log VERIFY 优先）
  const hasVerifyLog = o.logs?.some((l) => l.nodeType === "VERIFY")
  if (o.checkTime && !hasVerifyLog) {
    const t = normalizeTime(o.checkTime)
    events.push({
      key:      "check-fallback",
      title:    "核查通过 · 销号",
      time:     t,
      dotClass: "h5-timeline-dot--success",
      sortKey:  t,
    })
  }

  // 按时间升序
  const sorted = events.sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  // 最后一个"普通"节点标为蓝色（当前所在步骤），warning/success 保持原色
  const KEEP_CLASS = new Set(["h5-timeline-dot--warning", "h5-timeline-dot--success"])
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (!KEEP_CLASS.has(sorted[i].dotClass)) {
      sorted[i] = { ...sorted[i], dotClass: "h5-timeline-dot--active" }
      break
    }
  }

  return sorted
})

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function isOverdue(dispatchTime: string | null): boolean {
  if (!dispatchTime) return false
  const slaMs = 2 * 60 * 60 * 1000 // SLA 2小时
  return Date.now() - new Date(dispatchTime).getTime() > slaMs
}

function slaRemain(dispatchTime: string | null): string {
  if (!dispatchTime) return "—"
  const elapsedMs  = Date.now() - new Date(dispatchTime).getTime()
  const slaMs      = 2 * 60 * 60 * 1000
  const remainMs   = slaMs - elapsedMs
  if (remainMs <= 0) return "已逾期"
  const mins = Math.floor(remainMs / 60000)
  const hrs  = Math.floor(mins / 60)
  return hrs > 0 ? `${hrs}h ${mins % 60}min` : `${mins} min`
}

function riskDotClass(level: string | null): string {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? ""] ?? "risk-dot--green"
}

function statusDotClass(status: string | null): string {
  const map: Record<string, string> = {
    PENDING:    "risk-dot--yellow",
    PROCESSING: "risk-dot--orange",
    CHECKING:   "risk-dot--yellow",
    FINISHED:   "risk-dot--green",
    CLOSED:     "risk-dot--green",
  }
  return map[status ?? ""] ?? "risk-dot--green"
}

function statusBadgeClass(status: string | null): string {
  const map: Record<string, string> = {
    PENDING:    "badge--warning",
    PROCESSING: "badge--primary",
    CHECKING:   "badge--info",
    FINISHED:   "badge--success",
    CLOSED:     "badge--muted",
  }
  return map[status ?? ""] ?? ""
}

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function goBack() {
  router.back()
}

function acceptOrder() {
  if (!order.value) return
  const id = order.value.id
  update("work_order", id, { status: "PROCESSING", accept_time: new Date().toISOString() })
  loadOrder()
  actionMsg.value = "✓ 已接单，请尽快前往现场处置"
  setTimeout(() => { actionMsg.value = "" }, 4000)
}

function goDispose() {
  if (!order.value) return
  router.push(`/h5/dispose/${order.value.id}`)
}

function handleEvidence() {
  actionMsg.value = "📷 演示模式：选择证据照片..."
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function loadOrder() {
  const idParam = route.params.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (!Number.isNaN(id) && id > 0) {
    order.value = getWorkOrder(id)
  }
}

onMounted(() => {
  loadOrder()
  loading.value = false
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.h5-work-order-detail {
  min-height: 100vh;
  background: var(--h5-bg-page, #F7F9FC);
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + env(safe-area-inset-bottom) + 16px);
}

/* ===== 顶部导航栏 ===== */
.h5-header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--h5-header-height, 56px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(135deg, #0E3875 0%, #1B6FE8 100%);
  color: #fff;
}
.h5-header__back {
  width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -12px;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  border: none;
  background: transparent;
  font-size: 18px;
}
.h5-header__title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}
.h5-header__actions {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-height: 44px;
}

/* ===== 空/加载状态 ===== */
.h5-detail-loading,
.h5-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
  gap: 12px;
  text-align: center;
}
.h5-empty-icon { font-size: 48px; }

/* ===== 顶部 Banner ===== */
.h5-detail-banner {
  padding: 20px 16px 16px;
  background: var(--h5-gradient-banner, linear-gradient(135deg, #0E3875 0%, #1B6FE8 100%));
  color: #fff;
}
.h5-detail-banner--red    { background: linear-gradient(135deg, #7F1D1D, #EF4444); }
.h5-detail-banner--orange { background: linear-gradient(135deg, #7C2D12, #EA580C); }
.h5-detail-banner--yellow { background: linear-gradient(135deg, #78350F, #F59E0B); }

.h5-detail-banner__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.h5-detail-banner__building {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}
.h5-detail-banner__alarm {
  font-size: 14px;
  color: rgba(255,255,255,0.80);
  line-height: 1.5;
}

/* ===== 卡片通用 ===== */
.h5-card {
  background: var(--h5-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--h5-border, #EEF2F7);
  box-shadow: var(--h5-shadow-card, 0 2px 8px rgba(0,0,0,0.06));
  margin: 8px 16px 0;
}

.h5-detail-card {
  padding: 16px;
}
.h5-detail-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--h5-border, #EEF2F7);
}

/* ===== 详情字段列表 ===== */
.h5-detail-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.h5-detail-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--h5-border, #EEF2F7);
  font-size: 14px;
  min-height: var(--h5-touch-min, 44px);
}
.h5-detail-field:last-child { border-bottom: none; }
.h5-detail-field__label {
  color: var(--h5-text-muted, #94A3B8);
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 13px;
}
.h5-detail-field__value {
  color: var(--h5-text-body, #374151);
  font-weight: 500;
  text-align: right;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

/* ===== 指标网格 ===== */
.h5-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.h5-metric-item {
  background: var(--h5-bg-page, #F7F9FC);
  border-radius: var(--radius-md, 8px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.h5-metric-item__label {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-metric-item__value {
  font-size: 15px;
  font-weight: 600;
  color: var(--h5-text-h2, #1C2B4A);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===== SLA 标记 ===== */
.h5-sla {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--h5-primary, #1B6FE8);
}
.h5-sla--overdue { color: var(--risk-red, #FF4444); font-weight: 700; }

/* ===== 操作按钮区 ===== */
.h5-detail-actions {
  padding: 16px;
}
.h5-accept-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 12px 20px;
  background: var(--h5-primary, #1B6FE8);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg, 12px);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
  text-align: center;
}
.h5-accept-btn:active { opacity: 0.9; }
.h5-accept-btn--processing {
  background: linear-gradient(135deg, #F97316, #EF4444);
}

.h5-detail-status-hint {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--h5-bg-page, #F7F9FC);
  border-radius: var(--radius-md, 8px);
}

/* 操作反馈 */
.h5-action-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(16,185,129,0.10);
  border: 1px solid rgba(16,185,129,0.30);
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  color: #10B981;
}

/* ===== 处置入口 ===== */
.h5-disposal-entry {
  padding: 16px;
}
.h5-disposal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.h5-disposal-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--h5-bg-page, #F7F9FC);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--h5-border, #EEF2F7);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  min-height: 44px;
  transition: background 150ms ease;
}
.h5-disposal-btn:active { background: var(--h5-border, #EEF2F7); }
.h5-disposal-btn__icon { font-size: 22px; }
.h5-disposal-btn__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.h5-disposal-btn__label {
  font-size: 15px;
  font-weight: 500;
  color: var(--h5-text-h2, #1C2B4A);
}
.h5-disposal-btn__sub {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-disposal-btn__arrow {
  font-size: 20px;
  color: var(--h5-text-muted, #94A3B8);
}

/* ===== 处置时间轴 ===== */
.h5-timeline {
  padding: 0;
  margin: 0;
  list-style: none;
}
.h5-timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  position: relative;
}
.h5-timeline-item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  bottom: 0;
  width: 1px;
  background: var(--h5-border, #EEF2F7);
}
.h5-timeline-item:last-child::before { display: none; }
.h5-timeline-item:last-child { padding-bottom: 0; }

.h5-timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid;
  background: #fff;
  flex-shrink: 0;
  margin-top: 1px;
  position: relative;
  z-index: 1;
}
.h5-timeline-dot--active { border-color: var(--h5-primary, #1B6FE8); background: rgba(27,111,232,0.12); }
.h5-timeline-dot--done   { border-color: #10B981; background: rgba(16,185,129,0.12); }
.h5-timeline-dot--success { border-color: #10B981; background: #10B981; }
.h5-timeline-dot--warning { border-color: #F59E0B; background: #F59E0B; }

.h5-timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.h5-timeline-content__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--h5-text-h2, #1C2B4A);
}
.h5-timeline-content__time {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}

/* ===== risk-dot ===== */
.risk-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red, #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FACC15); }
.risk-dot--green  { background: var(--risk-green, #10B981); }

/* ===== badge ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.badge--warning { background: #FEF3C7; color: #F59E0B; }
.badge--primary { background: #DBEAFE; color: var(--h5-primary, #1B6FE8); }
.badge--info    { background: #EDE9FE; color: #8B5CF6; }
.badge--success { background: #D1FAE5; color: #10B981; }
.badge--muted   { background: #F1F5F9; color: #94A3B8; }
.badge--overdue { background: #FEE2E2; color: #EF4444; }

.h5-risk-level--badge { font-size: 12px; padding: 3px 10px; }
.h5-risk-level--red    { background: rgba(255,68,68,0.15);  color: #EF4444; }
.h5-risk-level--orange { background: rgba(249,115,22,0.15); color: #F97316; }
.h5-risk-level--yellow { background: rgba(245,158,11,0.15); color: #F59E0B; }
.h5-risk-level--normal { background: rgba(100,116,139,0.12); color: #64748B; }
</style>
