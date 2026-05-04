<template>
  <!--
    T15.83 管理端告警中心 /admin/alarms
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌─────────────── 面包屑 + 页面标题 ───────────────────────────┐
    │  首页 > 告警中心                      [搜索框] [筛选▾]      │
    ├────────── zone:kpi-row ──────────────────────────────────────┤
    │  活跃 N │ 已确认 N │ 已派单 N │ 已关闭 N                    │
    ├────────── zone:alarm-table ──────────────────────────────────┤
    │  [全部][红色][橙色][黄色][已处置]          共 N 条           │
    │  ┌──────┬───────┬─────┬────────┬──────┬───────┬─────────┐   │
    │  │告警ID│ 建筑  │等级 │ 类型   │ 状态 │ 时间  │  操作   │   │
    │  ├──────┼───────┼─────┼────────┼──────┼───────┼─────────┤   │
    │  │ A001 │ 永庆坊│ ●橙 │ 裂缝扩 │待确认│ 12:30 │ [详情]  │   │
    │  │ A002 │ 镇海楼│ ●红 │ 倾角超 │已确认│ 11:50 │ [详情]  │   │
    │  └──────┴───────┴─────┴────────┴──────┴───────┴─────────┘   │
    └──────────────────────────────────────────────────────────────┘

    ─── zone:drawer（右侧抽屉，点击行时弹出）───────────────────────
    ┌─── 告警详情 ─────────────────────────────────── [×] ──┐
    │  告警编号    │  A001                               │
    │  建筑名称    │  永庆坊历史建筑                      │
    │  告警类型    │  裂缝扩展                            │
    │  告警等级    │  ORANGE 橙色                         │
    │  触发时间    │  2026-05-02 12:30                    │
    │  告警内容    │  裂缝宽度超过阈值...                  │
    │                                                      │
    │  ─── 时间轴 ─────────────────────────────────────── │
    │  ● 2026-05-02 12:30  告警触发                        │
    │  ○ 待确认...                                          │
    │                                                      │
    │  ─── 操作按钮 ──────────────────────────────────── │
    │  [确认告警（btn-pc-secondary）]  [立即派单（btn-pc-primary）] │
    └──────────────────────────────────────────────────────┘

    ─────────────────────────────────────────────────────────────
    数据来源：
      - alarmService.listAlarms()      → alarm_record 表
      - update("alarm_record", id, {}) → 状态变更
    UI 规范：
      - 沿用 AdminDashboardView PC 管理端浅色企业主题
      - pc-card / admin-card / table-pc / admin-filter-tab
      - admin-drawer 右侧抽屉（480px）
      - PC tokens：--pc-primary / --pc-bg-page / --pc-border / --pc-text-h1
  -->

  <div class="admin-alarms" style="color: var(--pc-text-body, #374151)">
    <!-- ===== 页面标题栏 ===== -->
    <div class="admin-page-header">
      <div class="admin-page-header__left">
        <h2 class="admin-page-title">告警中心</h2>
        <span class="admin-page-subtitle">告警列表 · 实时监测</span>
      </div>
      <div class="admin-page-header__right">
        <input
          v-model="keyword"
          class="input-pc admin-search-input"
          type="text"
          placeholder="搜索告警ID / 建筑名称..."
        />
      </div>
    </div>

    <!-- ===== KPI 统计行（zone:kpi-row）===== -->
    <div class="admin-kpi-row" data-zone="kpi-row">
      <div class="admin-kpi-card pc-card" :class="'admin-kpi-card--alarm'">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">活跃告警</span>
          <div class="admin-kpi-card__icon-wrap" style="background:#FEE2E2">
            <span style="color:#EF4444;font-size:16px">⚠</span>
          </div>
        </div>
        <div class="admin-kpi-card__value tabular-nums" style="color:var(--pc-text-h1,#1C2B4A)">{{ kpi.active }}</div>
        <div class="admin-kpi-card__sub">待确认处理</div>
      </div>
      <div class="admin-kpi-card pc-card">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">已确认</span>
          <div class="admin-kpi-card__icon-wrap" style="background:#DBEAFE">
            <span style="color:var(--pc-primary,#1B6FE8);font-size:16px">✓</span>
          </div>
        </div>
        <div class="admin-kpi-card__value tabular-nums" style="color:var(--pc-text-h1,#1C2B4A)">{{ kpi.confirmed }}</div>
        <div class="admin-kpi-card__sub">等待派单</div>
      </div>
      <div class="admin-kpi-card pc-card">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">已派单</span>
          <div class="admin-kpi-card__icon-wrap" style="background:#D1FAE5">
            <span style="color:#10B981;font-size:16px">→</span>
          </div>
        </div>
        <div class="admin-kpi-card__value tabular-nums" style="color:var(--pc-text-h1,#1C2B4A)">{{ kpi.dispatched }}</div>
        <div class="admin-kpi-card__sub">工单处理中</div>
      </div>
      <div class="admin-kpi-card pc-card">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">已关闭</span>
          <div class="admin-kpi-card__icon-wrap" style="background:#F1F5F9">
            <span style="color:#94A3B8;font-size:16px">×</span>
          </div>
        </div>
        <div class="admin-kpi-card__value tabular-nums" style="color:var(--pc-text-h1,#1C2B4A)">{{ kpi.closed }}</div>
        <div class="admin-kpi-card__sub">已完成闭环</div>
      </div>
    </div>

    <!-- ===== 告警表格卡片（zone:alarm-table）===== -->
    <div class="pc-card admin-card admin-table-wrap" data-zone="alarm-table">
      <!-- 工具栏 -->
      <div class="admin-table-toolbar">
        <div class="admin-table-toolbar__left">
          <h3 class="admin-table-toolbar__title">告警列表</h3>
          <span class="admin-table-toolbar__total">共 {{ filteredAlarms.length }} 条</span>
        </div>
        <div class="admin-table-toolbar__right">
          <!-- 等级筛选 -->
          <select
            v-model="levelFilter"
            class="select-pc"
            style="width: 110px"
            :aria-label="'按告警等级筛选 alarmLevel'"
          >
            <option value="">全部等级</option>
            <option value="RED">红色 RED</option>
            <option value="ORANGE">橙色 ORANGE</option>
            <option value="YELLOW">黄色 YELLOW</option>
          </select>
        </div>
      </div>

      <!-- 状态筛选标签（admin-table-filter-tabs）-->
      <div class="admin-table-filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="admin-filter-tab"
          :class="{ 'admin-filter-tab--active': activeStatus === tab.value }"
          @click="activeStatus = tab.value"
        >
          {{ tab.label }}
          <span class="admin-filter-tab__count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 告警表格（table-pc）-->
      <div class="admin-table-scroll">
        <table class="table-pc">
          <thead>
            <tr>
              <th>告警ID</th>
              <th>建筑名称</th>
              <th>等级</th>
              <th>类型</th>
              <th>状态</th>
              <th>触发时间</th>
              <th style="width: 80px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="alarm in filteredAlarms"
              :key="alarm.id"
              class="admin-table-row"
              :class="{ 'admin-table-row--selected': selectedAlarm?.id === alarm.id }"
              @click="openDrawer(alarm)"
            >
              <td class="admin-td-mono tabular-nums">{{ alarm.alarmCode ?? alarm.alarmId ?? alarm.id }}</td>
              <td>{{ alarm.buildingName ?? `建筑 #${alarm.buildingId}` }}</td>
              <td>
                <span class="risk-dot" :class="riskDotClass(alarm.alarmLevel)"></span>
                <span style="margin-left:5px;font-size:12px;color:var(--pc-text-muted,#64748B)">{{ alarm.alarmLevel }}</span>
              </td>
              <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ alarm.alarmType ?? '—' }}
              </td>
              <td>
                <span class="admin-badge" :class="statusBadgeClass(alarm.status)">
                  {{ STATUS_LABEL[alarm.status ?? ''] ?? alarm.status ?? '—' }}
                </span>
              </td>
              <td class="admin-td-time tabular-nums">{{ alarm.triggerTime?.slice(0, 16) ?? '—' }}</td>
              <td>
                <div class="admin-td-actions">
                  <button
                    class="btn-icon-sm"
                    title="查看详情"
                    @click.stop="openDrawer(alarm)"
                  >
                    ▦
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-if="filteredAlarms.length === 0" class="admin-empty" style="padding:32px;text-align:center;color:var(--pc-text-muted,#64748B)">
          暂无符合条件的告警数据
        </div>
      </div>
    </div>

    <!-- ===== 详情抽屉（zone:drawer）===== -->
    <Teleport to="body">
      <!-- 遮罩 -->
      <Transition name="drawer-overlay">
        <div
          v-if="drawerVisible"
          class="admin-drawer-overlay"
          @click="closeDrawer"
        />
      </Transition>

      <!-- 抽屉主体（admin-drawer）-->
      <Transition name="drawer-slide">
        <div v-if="drawerVisible" class="admin-drawer pc-card" data-zone="drawer">
          <div class="admin-drawer__header">
            <h3 class="admin-drawer__title">告警详情</h3>
            <button class="btn-icon-sm" @click="closeDrawer">×</button>
          </div>

          <div v-if="currentAlarm" class="admin-drawer__body">
            <!-- 等级与状态 -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <span class="risk-dot risk-dot--lg" :class="riskDotClass(currentAlarm.alarmLevel)"></span>
              <span class="admin-badge" :class="statusBadgeClass(currentAlarm.status)">
                {{ STATUS_LABEL[currentAlarm.status ?? ''] ?? currentAlarm.status }}
              </span>
              <span style="font-size:13px;color:var(--pc-text-muted,#64748B)">{{ currentAlarm.alarmLevel }} 级告警</span>
            </div>

            <!-- 详情键值对（admin-detail-grid）-->
            <div class="admin-detail-grid">
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">告警编号</div>
                <div class="admin-detail-item__value tabular-nums">{{ currentAlarm.alarmCode ?? currentAlarm.alarmId ?? '—' }}</div>
              </div>
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">建筑名称</div>
                <div class="admin-detail-item__value">{{ currentAlarm.buildingName ?? '—' }}</div>
              </div>
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">建筑编码</div>
                <div class="admin-detail-item__value tabular-nums">{{ currentAlarm.buildingCode ?? '—' }}</div>
              </div>
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">告警类型</div>
                <div class="admin-detail-item__value">{{ currentAlarm.alarmType ?? '—' }}</div>
              </div>
              <div class="admin-detail-item" style="grid-column:1/-1">
                <div class="admin-detail-item__label">告警内容</div>
                <div class="admin-detail-item__value">{{ currentAlarm.alarmContent ?? '—' }}</div>
              </div>
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">触发时间</div>
                <div class="admin-detail-item__value tabular-nums">{{ currentAlarm.triggerTime ?? '—' }}</div>
              </div>
              <div class="admin-detail-item">
                <div class="admin-detail-item__label">当前状态</div>
                <div class="admin-detail-item__value">{{ STATUS_LABEL[currentAlarm.status ?? ''] ?? currentAlarm.status ?? '—' }}</div>
              </div>
            </div>

            <!-- 时间轴（admin-timeline）-->
            <div style="margin-top:20px">
              <div style="font-size:14px;font-weight:600;color:var(--pc-text-h1,#1C2B4A);margin-bottom:12px">处置进度</div>
              <ul class="admin-timeline">
                <li class="admin-timeline-item">
                  <div class="admin-timeline-dot admin-timeline-dot--danger"></div>
                  <div class="admin-timeline-content">
                    <div class="admin-timeline-content__title">告警触发</div>
                    <div class="admin-timeline-content__time tabular-nums">{{ currentAlarm.triggerTime ?? '—' }}</div>
                  </div>
                </li>
                <li v-if="currentAlarm.status !== 'ACTIVE'" class="admin-timeline-item">
                  <div class="admin-timeline-dot admin-timeline-dot--primary"></div>
                  <div class="admin-timeline-content">
                    <div class="admin-timeline-content__title">已确认告警</div>
                    <div class="admin-timeline-content__time tabular-nums">{{ currentAlarm.handleTime ?? '—' }}</div>
                  </div>
                </li>
                <li v-if="currentAlarm.status === 'DISPATCHED' || currentAlarm.status === 'CLOSED'" class="admin-timeline-item">
                  <div class="admin-timeline-dot admin-timeline-dot--success"></div>
                  <div class="admin-timeline-content">
                    <div class="admin-timeline-content__title">已派单处置</div>
                    <div class="admin-timeline-content__time">
                      {{ dispatchedOrderNo ? `工单号：${dispatchedOrderNo}` : '工单已生成，可到工单中心查看' }}
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- 处置建议（disposalSuggestion）-->
            <div v-if="currentAlarmDetail?.disposalSuggestion" style="margin-top:16px;padding:12px;background:var(--pc-bg-page,#F0F4F9);border-radius:8px;border:1px solid var(--pc-border,#E2E8F0)">
              <div style="font-size:13px;font-weight:600;color:var(--pc-text-h1,#1C2B4A);margin-bottom:6px">处置建议</div>
              <div style="font-size:13px;color:var(--pc-text-body,#374151);line-height:1.6">{{ currentAlarmDetail.disposalSuggestion }}</div>
            </div>

            <!-- 操作反馈消息 -->
            <div v-if="actionMsg" class="admin-action-msg">{{ actionMsg }}</div>
          </div>

          <!-- 抽屉底部操作按钮 -->
          <div v-if="currentAlarm" class="admin-drawer__footer">
            <button
              class="btn-pc-secondary"
              :disabled="!currentAlarm || currentAlarm.status !== 'ACTIVE'"
              @click="confirmAlarm"
            >
              确认告警
            </button>
            <button
              class="btn-pc-primary"
              :class="{ 'btn-pc-danger': currentAlarm?.alarmLevel === 'RED' }"
              :disabled="!currentAlarm || currentAlarm.status !== 'CONFIRMED'"
              @click="dispatchAlarm"
            >
              {{ currentAlarm?.alarmLevel === 'RED' ? '大屏应急' : '立即派单' }}
            </button>
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
import { createIncidentFromAlarm } from "@/services/emergencyService"

// ── 常量 ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待确认",
  CONFIRMED:  "已确认",
  DISPATCHED: "已派单",
  CLOSED:     "已关闭",
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const alarms             = ref([] as AlarmListItem[])
const selectedAlarm      = ref(null as AlarmListItem | null)
const currentAlarm       = ref(null as AlarmListItem | null)
const currentAlarmDetail = ref(null as AlarmDetail | null)
const activeStatus       = ref("ALL")
const levelFilter        = ref("")
const keyword            = ref("")
const drawerVisible      = ref(false)
const actionMsg          = ref("")
const dispatchedOrderNo  = ref("")
const router = useRouter()

// ── 状态筛选标签 ──────────────────────────────────────────────────────────────

const statusTabs = computed(() => [
  { label: "全部",   value: "ALL",        count: alarms.value.length },
  { label: "活跃",   value: "PENDING",    count: alarms.value.filter(a => a.status === "PENDING").length },
  { label: "已确认", value: "CONFIRMED",  count: alarms.value.filter(a => a.status === "CONFIRMED").length },
  { label: "已派单", value: "DISPATCHED", count: alarms.value.filter(a => a.status === "DISPATCHED").length },
  { label: "已关闭", value: "CLOSED",     count: alarms.value.filter(a => a.status === "CLOSED").length },
])

// ── KPI 统计 ──────────────────────────────────────────────────────────────────

const kpi = computed(() => ({
  active:     alarms.value.filter(a => a.status === "PENDING").length,
  confirmed:  alarms.value.filter(a => a.status === "CONFIRMED").length,
  dispatched: alarms.value.filter(a => a.status === "DISPATCHED").length,
  closed:     alarms.value.filter(a => a.status === "CLOSED").length,
}))

// ── 筛选计算属性 ──────────────────────────────────────────────────────────────

const filteredAlarms = computed(() => {
  let list = alarms.value
  if (activeStatus.value !== "ALL") {
    list = list.filter(a => a.status === activeStatus.value)
  }
  if (levelFilter.value) {
    list = list.filter(a => a.alarmLevel === levelFilter.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(a =>
      (a.alarmCode ?? "").toLowerCase().includes(kw) ||
      (a.alarmId ?? "").toLowerCase().includes(kw) ||
      (a.buildingName ?? "").toLowerCase().includes(kw)
    )
  }
  return list
})

// ── 样式辅助 ──────────────────────────────────────────────────────────────────

function riskDotClass(level: string | null) {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? ""] ?? "risk-dot--green"
}

function statusBadgeClass(status: string | null) {
  const map: Record<string, string> = {
    PENDING:    "admin-badge--danger",
    CONFIRMED:  "admin-badge--warning",
    DISPATCHED: "admin-badge--primary",
    CLOSED:     "admin-badge--success",
  }
  return map[status ?? ""] ?? ""
}

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function openDrawer(alarm: AlarmListItem) {
  selectedAlarm.value = alarm
  currentAlarm.value  = alarm
  drawerVisible.value = true
  actionMsg.value = ""
  dispatchedOrderNo.value = ""
  // 加载完整详情（含 disposalSuggestion）
  const result = getAlarm(alarm.id)
  currentAlarmDetail.value = result.ok ? result.data : null
}

function closeDrawer() {
  drawerVisible.value = false
  actionMsg.value = ""
}

function confirmAlarm() {
  if (!currentAlarm.value) return
  const id = currentAlarm.value.id
  const result = serviceConfirmAlarm(id)
  if (result.ok) {
    loadData()
    actionMsg.value = `✓ 告警 #${id} 已确认`
  } else {
    actionMsg.value = `✗ ${result.error}`
  }
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

function dispatchAlarm() {
  if (!currentAlarm.value) return
  const alarm = currentAlarm.value

  // RED 级别告警→创建应急事件并跳转大屏应急页
  if (alarm.alarmLevel === "RED") {
    const result = createIncidentFromAlarm(alarm.id)
    if (result.ok) {
      loadData()
      closeDrawer()
      router.push("/screen/emergency")
    } else {
      actionMsg.value = `✗ ${result.error}`
      setTimeout(() => { actionMsg.value = "" }, 4000)
    }
    return
  }

  const result = serviceDispatchAlarm(alarm.id)
  if (result.ok) {
    dispatchedOrderNo.value = result.orderNo ?? ""
    loadData()
    actionMsg.value = `✓ 已派单，工单号：${result.orderNo}`
    setTimeout(() => { actionMsg.value = "" }, 4000)
  } else {
    actionMsg.value = `✗ ${result.error}`
    setTimeout(() => { actionMsg.value = "" }, 4000)
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function loadData() {
  alarms.value = listAlarms()
  if (currentAlarm.value) {
    const updated = alarms.value.find(a => a.id === currentAlarm.value!.id)
    if (updated) {
      currentAlarm.value = updated
      const result = getAlarm(updated.id)
      currentAlarmDetail.value = result.ok ? result.data : null
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ===== 页面根 ===== */
.admin-alarms {
  background: var(--pc-bg-page, #F0F4F9);
  min-height: 100%;
}

/* ===== 页面标题栏 ===== */
.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.admin-page-header__left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.admin-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-h1, #1C2B4A);
  margin: 0;
}
.admin-page-subtitle {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
}
.admin-page-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-search-input {
  width: 220px;
}

/* ===== KPI 统计行 ===== */
.admin-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.admin-kpi-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--pc-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--pc-border, #E2E8F0);
  box-shadow: var(--pc-shadow-sm, 0 1px 4px rgba(0,0,0,0.06));
}
.admin-kpi-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.admin-kpi-card__label {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
}
.admin-kpi-card__icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.admin-kpi-card__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}
.admin-kpi-card__sub {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}

/* ===== 表格外层 ===== */
.admin-table-wrap {
  overflow: hidden;
  background: var(--pc-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--pc-border, #E2E8F0);
  box-shadow: var(--pc-shadow-sm, 0 1px 4px rgba(0,0,0,0.06));
}
.admin-table-scroll {
  overflow-x: auto;
}

/* 工具栏 */
.admin-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--pc-border-light, #F1F5F9);
}
.admin-table-toolbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-table-toolbar__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  margin: 0;
}
.admin-table-toolbar__total {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  background: var(--pc-bg-stripe, #F8FAFC);
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
}
.admin-table-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 状态筛选标签 */
.admin-table-filter-tabs {
  display: flex;
  gap: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  overflow-x: auto;
  scrollbar-width: none;
}
.admin-filter-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease;
}
.admin-filter-tab:hover { color: var(--pc-text-body, #374151); }
.admin-filter-tab--active {
  color: var(--pc-primary, #1B6FE8);
  border-bottom-color: var(--pc-primary, #1B6FE8);
  font-weight: 500;
}
.admin-filter-tab__count {
  min-width: 18px;
  height: 18px;
  border-radius: var(--radius-full, 9999px);
  background: var(--pc-bg-stripe, #F8FAFC);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  color: var(--pc-text-muted, #64748B);
}
.admin-filter-tab--active .admin-filter-tab__count {
  background: rgba(27,111,232,0.10);
  color: var(--pc-primary, #1B6FE8);
}

/* 表格行选中效果 */
.admin-table-row { cursor: pointer; transition: background 150ms ease; }
.admin-table-row:hover { background: var(--pc-bg-stripe, #F8FAFC); }
.admin-table-row--selected { background: rgba(27,111,232,0.06); }

/* 操作小按钮 */
.btn-icon-sm {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-sm, 4px);
  background: #fff;
  color: var(--pc-text-muted, #64748B);
  cursor: pointer;
  transition: all 150ms ease;
}
.btn-icon-sm:hover {
  border-color: var(--pc-primary, #1B6FE8);
  color: var(--pc-primary, #1B6FE8);
  background: rgba(27,111,232,0.06);
}

/* admin-badge */
.admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.admin-badge--danger  { background: #FEE2E2; color: #EF4444; }
.admin-badge--warning { background: #FEF3C7; color: #F59E0B; }
.admin-badge--primary { background: #DBEAFE; color: var(--pc-primary, #1B6FE8); }
.admin-badge--success { background: #D1FAE5; color: #10B981; }

/* risk-dot */
.risk-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red, #FF4444); box-shadow: 0 0 4px var(--risk-red, #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 4px var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FACC15); }
.risk-dot--green  { background: var(--risk-green, #10B981); }
.risk-dot--lg     { width: 12px; height: 12px; }

/* ===== 详情抽屉样式（drawer-overlay + admin-drawer）===== */
.admin-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.20);
  z-index: 100;
}

.admin-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  max-width: 90vw;
  height: 100vh;
  border-radius: var(--radius-xl, 16px) 0 0 var(--radius-xl, 16px);
  box-shadow: var(--pc-shadow-xl, -4px 0 24px rgba(0,0,0,0.15));
  display: flex;
  flex-direction: column;
  z-index: 101;
  overflow: hidden;
  background: var(--pc-bg-card, #fff);
}
.admin-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  flex-shrink: 0;
}
.admin-drawer__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  margin: 0;
}
.admin-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.admin-drawer__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--pc-border, #E2E8F0);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* ===== 详情键值对 ===== */
.admin-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.admin-detail-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--pc-border-light, #F1F5F9);
}
.admin-detail-item:nth-child(odd)  { padding-right: 12px; }
.admin-detail-item:nth-child(even) { padding-left: 12px; border-left: 1px solid var(--pc-border-light, #F1F5F9); }
.admin-detail-item__label {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  margin-bottom: 4px;
}
.admin-detail-item__value {
  font-size: 14px;
  color: var(--pc-text-body, #374151);
  font-weight: 500;
}

/* ===== 时间轴 ===== */
.admin-timeline {
  padding: 0;
  margin: 0;
  list-style: none;
}
.admin-timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  position: relative;
}
.admin-timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  bottom: 0;
  width: 1px;
  background: var(--pc-border, #E2E8F0);
}
.admin-timeline-item:last-child::before { display: none; }
.admin-timeline-item:last-child { padding-bottom: 0; }
.admin-timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid;
  background: #fff;
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}
.admin-timeline-dot--primary { border-color: var(--pc-primary, #1B6FE8); background: rgba(27,111,232,0.10); }
.admin-timeline-dot--success { border-color: #10B981; background: rgba(16,185,129,0.10); }
.admin-timeline-dot--warning { border-color: #F59E0B; background: rgba(245,158,11,0.10); }
.admin-timeline-dot--danger  { border-color: #EF4444; background: rgba(239,68,68,0.10); }
.admin-timeline-content__title {
  font-size: 14px;
  color: var(--pc-text-body, #374151);
  font-weight: 500;
  margin-bottom: 2px;
}
.admin-timeline-content__time {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}

/* 操作反馈 */
.admin-action-msg {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(16,185,129,0.10);
  border: 1px solid rgba(16,185,129,0.40);
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  color: #10B981;
}

/* ===== 按钮 ===== */
.btn-pc-primary {
  height: 36px;
  padding: 0 20px;
  background: var(--pc-primary, #1B6FE8);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-pc-primary:hover:not(:disabled) { background: #1462d4; }
.btn-pc-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-pc-danger { background: #E53935 !important; }
.btn-pc-danger:hover:not(:disabled) { background: #C62828 !important; }

.btn-pc-secondary {
  height: 36px;
  padding: 0 20px;
  background: #fff;
  color: var(--pc-text-body, #374151);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}
.btn-pc-secondary:hover:not(:disabled) {
  border-color: var(--pc-primary, #1B6FE8);
  color: var(--pc-primary, #1B6FE8);
}
.btn-pc-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* select */
.select-pc {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 6px);
  background: #fff;
  font-size: 13px;
  color: var(--pc-text-body, #374151);
  cursor: pointer;
  appearance: none;
}
.select-pc:focus {
  outline: none;
  border-color: var(--pc-primary, #1B6FE8);
  box-shadow: 0 0 0 3px rgba(27,111,232,0.12);
}

/* input */
.input-pc {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 6px);
  font-size: 14px;
  color: var(--pc-text-body, #374151);
  background: #fff;
  transition: border-color 150ms ease;
}
.input-pc:focus {
  outline: none;
  border-color: var(--pc-primary, #1B6FE8);
  box-shadow: 0 0 0 3px rgba(27,111,232,0.12);
}

/* admin-td */
.admin-td-mono {
  font-family: "SF Mono", "Cascadia Code", monospace;
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}
.admin-td-time {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  white-space: nowrap;
}
.admin-td-actions {
  display: flex;
  gap: 4px;
}

/* table-pc */
.table-pc {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table-pc th {
  padding: 10px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--pc-text-muted, #64748B);
  background: var(--pc-bg-stripe, #F8FAFC);
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  white-space: nowrap;
}
.table-pc td {
  padding: 11px 16px;
  border-bottom: 1px solid var(--pc-border-light, #F1F5F9);
  color: var(--pc-text-body, #374151);
  vertical-align: middle;
}

/* ===== 抽屉动画 ===== */
.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 250ms ease;
}
.drawer-overlay-enter-from,
.drawer-overlay-leave-to { opacity: 0; }
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 250ms ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to { transform: translateX(100%); }
</style>
