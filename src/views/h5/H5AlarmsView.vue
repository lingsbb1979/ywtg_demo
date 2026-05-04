<template>
  <!--
    H5 告警中心 /h5/alerts
    ─────────────────────────────────────────────────────────
    流程完整复用 PC AdminAlarmsView 的接口逻辑：
      listAlarms()   → 列表
      getAlarm(id)   → 详情 + 处置建议
      confirmAlarm() → 确认告警（PENDING → CONFIRMED）
      dispatchAlarm() → 派单（生成工单，状态→DISPATCHED）
    ─────────────────────────────────────────────────────────
    布局：
    ┌── sticky 顶栏（标题 + 搜索图标）──────────────────────┐
    ├── KPI 横向滚动卡片（活跃/已确认/已派单/已关闭）────────┤
    ├── 状态筛选标签（全部/活跃/已确认/已派单/已关闭）────────┤
    ├── 告警卡片列表（无限滚动）────────────────────────────┤
    └── 底部弹层（点击卡片弹出：详情 + 时间轴 + 操作按钮）──┘
  -->
  <div class="h5-alarms">
    <!-- ===== sticky 顶栏 ===== -->
    <div class="h5-alarms__header">
      <span class="h5-alarms__title">告警中心</span>
      <button
        class="h5-alarms__search-btn"
        type="button"
        :class="{ 'h5-alarms__search-btn--active': showSearch }"
        @click="showSearch = !showSearch"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>

    <!-- 搜索栏（展开时显示）-->
    <Transition name="h5-slide-down">
      <div v-if="showSearch" class="h5-alarms__search-bar">
        <input
          v-model="keyword"
          class="h5-alarms__search-input"
          type="search"
          placeholder="搜索告警ID / 建筑名称..."
          autofocus
        />
      </div>
    </Transition>

    <!-- ===== KPI 横向滚动卡片 ===== -->
    <div class="h5-alarms__kpi-scroll">
      <div class="h5-alarms__kpi-card h5-alarms__kpi-card--red">
        <div class="h5-alarms__kpi-val">{{ kpi.active }}</div>
        <div class="h5-alarms__kpi-label">活跃告警</div>
      </div>
      <div class="h5-alarms__kpi-card h5-alarms__kpi-card--blue">
        <div class="h5-alarms__kpi-val">{{ kpi.confirmed }}</div>
        <div class="h5-alarms__kpi-label">已确认</div>
      </div>
      <div class="h5-alarms__kpi-card h5-alarms__kpi-card--green">
        <div class="h5-alarms__kpi-val">{{ kpi.dispatched }}</div>
        <div class="h5-alarms__kpi-label">已派单</div>
      </div>
      <div class="h5-alarms__kpi-card h5-alarms__kpi-card--gray">
        <div class="h5-alarms__kpi-val">{{ kpi.closed }}</div>
        <div class="h5-alarms__kpi-label">已关闭</div>
      </div>
    </div>

    <!-- ===== 状态筛选标签 ===== -->
    <div class="h5-filter-tabs">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="h5-filter-tab"
        :class="{ 'h5-filter-tab--active': activeStatus === tab.value }"
        @click="activeStatus = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="h5-filter-tab__badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ===== 告警卡片列表 ===== -->
    <ul class="h5-alarms__list" data-testid="h5-alarm-list">
      <li
        v-for="alarm in filteredAlarms"
        :key="alarm.id"
        class="h5-alarm-card"
        :class="`h5-alarm-card--${(alarm.alarmLevel ?? 'green').toLowerCase()}`"
        @click="openSheet(alarm)"
      >
        <!-- 卡片顶：等级徽章 + 状态 + 告警码 -->
        <div class="h5-alarm-card__top">
          <span
            class="h5-alarm-level-badge"
            :class="`h5-alarm-level-badge--${(alarm.alarmLevel ?? 'green').toLowerCase()}`"
          >{{ alarm.alarmLevel ?? '—' }}</span>
          <span
            class="h5-alarm-status-tag"
            :class="statusTagClass(alarm.status)"
          >{{ STATUS_LABEL[alarm.status ?? ''] ?? alarm.status }}</span>
          <span class="h5-alarm-card__code tabular-nums">{{ alarm.alarmCode ?? alarm.alarmId ?? `#${alarm.id}` }}</span>
        </div>
        <!-- 卡片体：建筑 + 告警内容 -->
        <div class="h5-alarm-card__body">
          <div class="h5-alarm-card__building">{{ alarm.buildingName ?? `建筑 #${alarm.buildingId}` }}</div>
          <div class="h5-alarm-card__desc">{{ alarm.alarmTitle ?? alarm.alarmContent ?? '—' }}</div>
        </div>
        <!-- 卡片底：触发时间 + 箭头 -->
        <div class="h5-alarm-card__foot">
          <span class="h5-alarm-card__time tabular-nums">{{ alarm.triggerTime?.slice(0, 16) ?? '—' }}</span>
          <span class="h5-alarm-card__arrow">›</span>
        </div>
      </li>
    </ul>

    <!-- 空状态 -->
    <div v-if="filteredAlarms.length === 0" class="h5-alarms__empty" data-testid="h5-alarm-empty">
      <div class="h5-alarms__empty-icon">🔔</div>
      <div class="h5-alarms__empty-text">暂无告警数据</div>
      <div class="h5-alarms__empty-sub">请先触发演示场景或初始化数据</div>
    </div>

    <!-- ===== 底部弹层（Bottom Sheet）===== -->
    <Teleport to="body">
      <Transition name="h5-sheet-overlay">
        <div v-if="sheetVisible" class="h5-sheet-overlay" @click="closeSheet" />
      </Transition>
      <Transition name="h5-sheet">
        <div v-if="sheetVisible" class="h5-alarm-sheet" role="dialog" aria-modal="true">
          <!-- 拖拽指示条 -->
          <div class="h5-sheet-handle" />

          <div v-if="currentAlarm" class="h5-alarm-sheet__content">
            <!-- 头部：等级 + 状态 + 标题 -->
            <div class="h5-alarm-sheet__head">
              <div class="h5-alarm-sheet__head-row">
                <span
                  class="h5-alarm-level-badge h5-alarm-level-badge--lg"
                  :class="`h5-alarm-level-badge--${(currentAlarm.alarmLevel ?? 'green').toLowerCase()}`"
                >{{ currentAlarm.alarmLevel ?? '—' }}</span>
                <span
                  class="h5-alarm-status-tag"
                  :class="statusTagClass(currentAlarm.status)"
                >{{ STATUS_LABEL[currentAlarm.status ?? ''] ?? currentAlarm.status }}</span>
              </div>
              <div class="h5-alarm-sheet__alarm-title">
                {{ currentAlarm.alarmTitle ?? currentAlarm.alarmContent ?? '告警详情' }}
              </div>
            </div>

            <!-- 基础信息键值对 -->
            <div class="h5-alarm-sheet__grid">
              <div class="h5-alarm-sheet__item">
                <span class="h5-alarm-sheet__item-label">告警编号</span>
                <span class="h5-alarm-sheet__item-val tabular-nums">{{ currentAlarm.alarmCode ?? currentAlarm.alarmId ?? '—' }}</span>
              </div>
              <div class="h5-alarm-sheet__item">
                <span class="h5-alarm-sheet__item-label">建筑名称</span>
                <span class="h5-alarm-sheet__item-val">{{ currentAlarm.buildingName ?? '—' }}</span>
              </div>
              <div class="h5-alarm-sheet__item">
                <span class="h5-alarm-sheet__item-label">告警类型</span>
                <span class="h5-alarm-sheet__item-val">{{ currentAlarm.alarmType ?? '—' }}</span>
              </div>
              <div class="h5-alarm-sheet__item">
                <span class="h5-alarm-sheet__item-label">触发时间</span>
                <span class="h5-alarm-sheet__item-val tabular-nums">{{ currentAlarm.triggerTime ?? '—' }}</span>
              </div>
              <div v-if="currentAlarmDetail?.alarmContent" class="h5-alarm-sheet__item h5-alarm-sheet__item--full">
                <span class="h5-alarm-sheet__item-label">告警内容</span>
                <span class="h5-alarm-sheet__item-val">{{ currentAlarmDetail.alarmContent }}</span>
              </div>
            </div>

            <!-- 处置进度时间轴 -->
            <div class="h5-alarm-sheet__timeline">
              <div class="h5-alarm-sheet__section-title">处置进度</div>
              <ul class="h5-timeline">
                <li class="h5-timeline__item">
                  <div class="h5-timeline__dot h5-timeline__dot--danger" />
                  <div class="h5-timeline__body">
                    <div class="h5-timeline__label">告警触发</div>
                    <div class="h5-timeline__time tabular-nums">{{ currentAlarm.triggerTime ?? '—' }}</div>
                  </div>
                </li>
                <li
                  v-if="currentAlarm.status === 'CONFIRMED' || currentAlarm.status === 'DISPATCHED' || currentAlarm.status === 'CLOSED'"
                  class="h5-timeline__item"
                >
                  <div class="h5-timeline__dot h5-timeline__dot--primary" />
                  <div class="h5-timeline__body">
                    <div class="h5-timeline__label">已确认告警</div>
                    <div class="h5-timeline__time tabular-nums">{{ currentAlarm.handleTime ?? '—' }}</div>
                  </div>
                </li>
                <li
                  v-if="currentAlarm.status === 'DISPATCHED' || currentAlarm.status === 'CLOSED'"
                  class="h5-timeline__item"
                >
                  <div class="h5-timeline__dot h5-timeline__dot--success" />
                  <div class="h5-timeline__body">
                    <div class="h5-timeline__label">已派单处置</div>
                    <div class="h5-timeline__time">
                      {{ dispatchedOrderNo ? `工单号：${dispatchedOrderNo}` : '工单已生成，可到工单中心查看' }}
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- 处置建议 -->
            <div
              v-if="currentAlarmDetail?.disposalSuggestion"
              class="h5-alarm-sheet__suggestion"
              :class="`h5-alarm-sheet__suggestion--${(currentAlarm.alarmLevel ?? 'green').toLowerCase()}`"
            >
              <div class="h5-alarm-sheet__suggestion-title">处置建议</div>
              <div class="h5-alarm-sheet__suggestion-text">{{ currentAlarmDetail.disposalSuggestion }}</div>
            </div>

            <!-- 操作反馈 -->
            <Transition name="h5-fade">
              <div v-if="actionMsg" class="h5-alarm-sheet__action-msg" :class="actionMsgType">
                {{ actionMsg }}
              </div>
            </Transition>
          </div>

          <!-- 底部操作按钮 -->
          <div v-if="currentAlarm" class="h5-alarm-sheet__footer">
            <button
              class="h5-btn h5-btn--secondary"
              :disabled="currentAlarm.status !== 'PENDING'"
              @click="onConfirmAlarm"
            >确认告警</button>
            <button
              class="h5-btn h5-btn--primary"
              :class="{ 'h5-btn--danger': currentAlarm.alarmLevel === 'RED' }"
              :disabled="currentAlarm.status !== 'CONFIRMED'"
              @click="onDispatchAlarm"
            >{{ currentAlarm.alarmLevel === 'RED' ? '大屏应急' : '立即派单' }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  listAlarms,
  getAlarm,
  confirmAlarm as serviceConfirmAlarm,
  dispatchAlarm as serviceDispatchAlarm,
  type AlarmListItem,
  type AlarmDetail,
} from "@/services/alarmService"

// ── 常量 ─────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待确认",
  CONFIRMED:  "已确认",
  DISPATCHED: "已派单",
  CLOSED:     "已关闭",
}

// ── 状态 ─────────────────────────────────────────────────────────────────────

const alarms             = ref<AlarmListItem[]>([])
const activeStatus       = ref("ALL")
const keyword            = ref("")
const showSearch         = ref(false)
const sheetVisible       = ref(false)
const currentAlarm       = ref<AlarmListItem | null>(null)
const currentAlarmDetail = ref<AlarmDetail | null>(null)
const actionMsg          = ref("")
const actionMsgType      = ref("") // "" | "h5-alarm-sheet__action-msg--success" | "h5-alarm-sheet__action-msg--error"
const dispatchedOrderNo  = ref("")
const router = useRouter()

// ── KPI 统计 ─────────────────────────────────────────────────────────────────

const kpi = computed(() => ({
  active:     alarms.value.filter(a => a.status === "PENDING").length,
  confirmed:  alarms.value.filter(a => a.status === "CONFIRMED").length,
  dispatched: alarms.value.filter(a => a.status === "DISPATCHED").length,
  closed:     alarms.value.filter(a => a.status === "CLOSED").length,
}))

// ── 状态筛选标签 ──────────────────────────────────────────────────────────────

const statusTabs = computed(() => [
  { label: "全部",   value: "ALL",        count: alarms.value.length },
  { label: "活跃",   value: "PENDING",    count: kpi.value.active },
  { label: "已确认", value: "CONFIRMED",  count: kpi.value.confirmed },
  { label: "已派单", value: "DISPATCHED", count: kpi.value.dispatched },
  { label: "已关闭", value: "CLOSED",     count: kpi.value.closed },
])

// ── 筛选列表 ─────────────────────────────────────────────────────────────────

const filteredAlarms = computed(() => {
  let list = alarms.value
  if (activeStatus.value !== "ALL") {
    list = list.filter(a => a.status === activeStatus.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(a =>
      (a.alarmCode ?? "").toLowerCase().includes(kw) ||
      (a.alarmId   ?? "").toLowerCase().includes(kw) ||
      (a.buildingName ?? "").toLowerCase().includes(kw)
    )
  }
  return list
})

// ── 样式辅助 ─────────────────────────────────────────────────────────────────

function statusTagClass(status: string | null) {
  const map: Record<string, string> = {
    PENDING:    "h5-alarm-status-tag--active",
    CONFIRMED:  "h5-alarm-status-tag--pending",
    DISPATCHED: "h5-alarm-status-tag--dispatched",
    CLOSED:     "h5-alarm-status-tag--closed",
  }
  return map[status ?? ""] ?? ""
}

// ── 弹层操作 ─────────────────────────────────────────────────────────────────

function openSheet(alarm: AlarmListItem) {
  currentAlarm.value = alarm
  sheetVisible.value = true
  actionMsg.value = ""
  dispatchedOrderNo.value = ""
  const result = getAlarm(alarm.id)
  currentAlarmDetail.value = result.ok ? result.data : null
  // 禁止页面滚动
  document.body.style.overflow = "hidden"
}

function closeSheet() {
  sheetVisible.value = false
  actionMsg.value = ""
  document.body.style.overflow = ""
}

// ── 确认告警 ─────────────────────────────────────────────────────────────────

function onConfirmAlarm() {
  if (!currentAlarm.value) return
  const result = serviceConfirmAlarm(currentAlarm.value.id)
  if (result.ok) {
    loadData()
    showMsg(`✓ 告警已确认`, "success")
  } else {
    showMsg(`✗ ${result.error}`, "error")
  }
}

// ── 立即派单 ─────────────────────────────────────────────────────────────────

function onDispatchAlarm() {
  if (!currentAlarm.value) return
  const alarm = currentAlarm.value
  // RED 级别告警→显示提示，不跳转（手机端无法操作大屏）
  if (alarm.alarmLevel === "RED") {
    showMsg("请去大屏打开应急页面处理", "success")
    return
  }
  const result = serviceDispatchAlarm(alarm.id)
  if (result.ok) {
    dispatchedOrderNo.value = result.orderNo ?? ""
    loadData()
    showMsg(`✓ 派单成功，工单号：${result.orderNo}`, "success")
  } else {
    showMsg(`✗ ${result.error}`, "error")
  }
}

function showMsg(msg: string, type: "success" | "error") {
  actionMsg.value = msg
  actionMsgType.value = type === "success"
    ? "h5-alarm-sheet__action-msg--success"
    : "h5-alarm-sheet__action-msg--error"
  setTimeout(() => { actionMsg.value = "" }, 3500)
}

// ── 数据加载 ─────────────────────────────────────────────────────────────────

function loadData() {
  alarms.value = listAlarms()
  // 若抽屉已打开，同步更新当前详情
  if (currentAlarm.value) {
    const updated = alarms.value.find(a => a.id === currentAlarm.value!.id)
    if (updated) {
      currentAlarm.value = updated
      const r = getAlarm(updated.id)
      currentAlarmDetail.value = r.ok ? r.data : null
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ===== 页面根 ===== */
.h5-alarms {
  background: var(--h5-bg-page, #F0F4F9);
  min-height: 100%;
  padding-bottom: 24px;
}

/* ===== 顶栏 ===== */
.h5-alarms__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: var(--h5-primary, #1B6FE8);
  color: #fff;
}
.h5-alarms__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.h5-alarms__search-btn {
  background: transparent;
  border: none;
  padding: 6px;
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}
.h5-alarms__search-btn--active,
.h5-alarms__search-btn:active {
  background: rgba(255,255,255,0.15);
  color: #fff;
}

/* ===== 搜索栏 ===== */
.h5-alarms__search-bar {
  background: var(--h5-primary, #1B6FE8);
  padding: 0 16px 10px;
}
.h5-alarms__search-input {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.95);
  padding: 0 12px;
  font-size: 14px;
  color: #1C2B4A;
  outline: none;
}

/* ===== KPI 横向滚动 ===== */
.h5-alarms__kpi-scroll {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.h5-alarms__kpi-scroll::-webkit-scrollbar { display: none; }

.h5-alarms__kpi-card {
  flex: 0 0 80px;
  scroll-snap-align: start;
  border-radius: 10px;
  padding: 10px 12px;
  text-align: center;
  min-width: 80px;
}
.h5-alarms__kpi-card--red    { background: #FEF2F2; border: 1px solid #FECACA; }
.h5-alarms__kpi-card--blue   { background: #EFF6FF; border: 1px solid #BFDBFE; }
.h5-alarms__kpi-card--green  { background: #F0FDF4; border: 1px solid #BBF7D0; }
.h5-alarms__kpi-card--gray   { background: #F8FAFC; border: 1px solid #E2E8F0; }
.h5-alarms__kpi-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--h5-text-h1, #1C2B4A);
  line-height: 1;
  margin-bottom: 4px;
}
.h5-alarms__kpi-label {
  font-size: 11px;
  color: var(--h5-text-muted, #64748B);
  white-space: nowrap;
}

/* ===== 告警卡片列表 ===== */
.h5-alarms__list {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-alarm-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 14px 12px;
  border-left: 4px solid #D1D5DB;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.h5-alarm-card:active { transform: scale(0.985); box-shadow: 0 1px 2px rgba(0,0,0,0.04); }

.h5-alarm-card--red    { border-left-color: #EF4444; }
.h5-alarm-card--orange { border-left-color: #F97316; }
.h5-alarm-card--yellow { border-left-color: #EAB308; }
.h5-alarm-card--green  { border-left-color: #22C55E; }

.h5-alarm-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.h5-alarm-card__code {
  margin-left: auto;
  font-size: 11px;
  color: var(--h5-text-muted, #64748B);
}
.h5-alarm-card__body {
  margin-bottom: 8px;
}
.h5-alarm-card__building {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 3px;
}
.h5-alarm-card__desc {
  font-size: 13px;
  color: var(--h5-text-body, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.h5-alarm-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.h5-alarm-card__time {
  font-size: 12px;
  color: var(--h5-text-muted, #64748B);
}
.h5-alarm-card__arrow {
  font-size: 16px;
  color: var(--h5-text-muted, #64748B);
}

/* ===== 等级徽章 ===== */
.h5-alarm-level-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #fff;
}
.h5-alarm-level-badge--lg { font-size: 13px; padding: 3px 10px; }
.h5-alarm-level-badge--red    { background: #EF4444; }
.h5-alarm-level-badge--orange { background: #F97316; }
.h5-alarm-level-badge--yellow { background: #EAB308; color: #fff; }
.h5-alarm-level-badge--green  { background: #22C55E; }

/* ===== 状态标签 ===== */
.h5-alarm-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.h5-alarm-status-tag--active     { background: #FEF2F2; color: #EF4444; }
.h5-alarm-status-tag--pending    { background: #FFF7ED; color: #EA580C; }
.h5-alarm-status-tag--dispatched { background: #EFF6FF; color: var(--h5-primary, #1B6FE8); }
.h5-alarm-status-tag--closed     { background: #F0FDF4; color: #15803D; }

/* ===== 空状态 ===== */
.h5-alarms__empty {
  text-align: center;
  padding: 60px 24px 40px;
  color: var(--h5-text-muted, #64748B);
}
.h5-alarms__empty-icon { font-size: 48px; margin-bottom: 12px; }
.h5-alarms__empty-text { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.h5-alarms__empty-sub  { font-size: 13px; }

/* ===== 底部弹层遮罩 ===== */
.h5-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
}

/* ===== 底部弹层主体 —— 限宽并居中，辺留界不充满PC屏幕 ===== */
.h5-alarm-sheet {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 301;
  background: #fff;
  border-radius: 18px 18px 0 0;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  max-width: 414px;
}

.h5-sheet-handle {
  width: 40px;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
}

.h5-alarm-sheet__content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 8px;
  -webkit-overflow-scrolling: touch;
}

/* 弹层头部 */
.h5-alarm-sheet__head {
  margin-bottom: 14px;
}
.h5-alarm-sheet__head-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.h5-alarm-sheet__alarm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  line-height: 1.4;
}

/* 键值对网格 */
.h5-alarm-sheet__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
  margin-bottom: 16px;
  background: #F8FAFC;
  border-radius: 10px;
  padding: 12px;
}
.h5-alarm-sheet__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.h5-alarm-sheet__item--full {
  grid-column: 1 / -1;
}
.h5-alarm-sheet__item-label {
  font-size: 11px;
  color: var(--h5-text-muted, #64748B);
}
.h5-alarm-sheet__item-val {
  font-size: 13px;
  color: var(--h5-text-body, #374151);
  font-weight: 500;
  word-break: break-all;
}

/* 时间轴 */
.h5-alarm-sheet__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 10px;
}
.h5-alarm-sheet__timeline { margin-bottom: 14px; }
.h5-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}
.h5-timeline::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 14px;
  bottom: 10px;
  width: 2px;
  background: #E2E8F0;
}
.h5-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 14px;
  position: relative;
}
.h5-timeline__dot {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: #fff;
  position: relative;
  z-index: 1;
}
.h5-timeline__dot--danger  { color: #EF4444; background: #FEF2F2; }
.h5-timeline__dot--primary { color: var(--h5-primary, #1B6FE8); background: #EFF6FF; }
.h5-timeline__dot--success { color: #22C55E; background: #F0FDF4; }
.h5-timeline__body { flex: 1; }
.h5-timeline__label { font-size: 13px; font-weight: 500; color: var(--h5-text-h1, #1C2B4A); }
.h5-timeline__time  { font-size: 12px; color: var(--h5-text-muted, #64748B); margin-top: 2px; }

/* 处置建议 */
.h5-alarm-sheet__suggestion {
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
}
.h5-alarm-sheet__suggestion--red    { border-color: #FECACA; background: #FEF2F2; }
.h5-alarm-sheet__suggestion--orange { border-color: #FED7AA; background: #FFF7ED; }
.h5-alarm-sheet__suggestion--yellow { border-color: #FDE68A; background: #FFFBEB; }
.h5-alarm-sheet__suggestion-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 6px;
}
.h5-alarm-sheet__suggestion-text {
  font-size: 13px;
  color: var(--h5-text-body, #374151);
  line-height: 1.6;
}

/* 操作反馈 */
.h5-alarm-sheet__action-msg {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  background: #F0FDF4;
  color: #15803D;
}
.h5-alarm-sheet__action-msg--error {
  background: #FEF2F2;
  color: #DC2626;
}

/* 弹层底部按钮 */
.h5-alarm-sheet__footer {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  /* 底部需避开 tabbar（64px）+ iOS safe-area */
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid #F1F5F9;
}

/* 通用按钮 */
.h5-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.h5-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.h5-btn:not(:disabled):active { transform: scale(0.97); }
.h5-btn--primary   { background: var(--h5-primary, #1B6FE8); color: #fff; }
.h5-btn--danger    { background: #E53935 !important; color: #fff; animation: h5-btn-pulse 1.4s ease-in-out infinite; }
@keyframes h5-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(229,57,53,0); }
}
.h5-btn--secondary { background: #EFF6FF; color: var(--h5-primary, #1B6FE8); border: 1px solid #BFDBFE; }

/* ===== Transition 动画 ===== */
.h5-sheet-overlay-enter-active,
.h5-sheet-overlay-leave-active { transition: opacity 0.25s ease; }
.h5-sheet-overlay-enter-from,
.h5-sheet-overlay-leave-to { opacity: 0; }

.h5-sheet-enter-active,
.h5-sheet-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.h5-sheet-enter-from,
.h5-sheet-leave-to { transform: translateX(-50%) translateY(100%); }

.h5-slide-down-enter-active,
.h5-slide-down-leave-active { transition: max-height 0.2s ease, opacity 0.2s ease; max-height: 60px; overflow: hidden; }
.h5-slide-down-enter-from,
.h5-slide-down-leave-to { max-height: 0; opacity: 0; }

.h5-fade-enter-active, .h5-fade-leave-active { transition: opacity 0.2s; }
.h5-fade-enter-from, .h5-fade-leave-to { opacity: 0; }

/* ===== 状态筛选标签 —— 复用 H5WorkOrdersView 风格 ===== */
.h5-filter-tabs {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin: 10px 12px 0;
  padding: 8px;
  border: 1px solid #DDE9FB;
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 10px 24px rgba(44,93,154,0.08);
  position: sticky;
  top: 8px;
  z-index: 10;
}
.h5-filter-tabs::-webkit-scrollbar { display: none; }
.h5-filter-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  min-height: 32px;
  padding: 0 13px;
  border-radius: 16px;
  border: none;
  border-bottom: 0;
  font-size: 13px;
  font-weight: 800;
  color: #5C7094;
  background: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.h5-filter-tab--active {
  color: #fff;
  background: linear-gradient(135deg, #1B6FE8, #4B96FF);
  box-shadow: 0 8px 16px rgba(27,111,232,0.20);
}
.h5-filter-tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  background: var(--h5-primary, #1B6FE8);
  color: #fff;
  margin-left: 3px;
}
.h5-filter-tab--active .h5-filter-tab__badge {
  background: rgba(255,255,255,0.3);
  color: #fff;
}
</style>
