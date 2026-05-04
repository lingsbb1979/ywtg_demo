<template>
  <div class="h5-home">

    <!-- 顶部品牌栏 -->
    <header class="h5-home__topbar">
      <div class="h5-home__brand">
        <span class="h5-home__brand-mark">盾</span>
        <div>
          <h1 class="h5-home__brand-title">国家建筑安全监测与应急指挥平台</h1>
          <div class="h5-home__brand-meta">
            <span>多云 22℃</span>
            <span>佳木斯市</span>
          </div>
        </div>
      </div>
      <div class="h5-home__top-actions">
        <button class="h5-home__icon-btn" type="button" aria-label="通知">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span v-if="stats.activeAlarms > 0" class="h5-home__notice-badge">{{ stats.activeAlarms }}</span>
        </button>
        <button class="h5-home__icon-btn" type="button" aria-label="全屏">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        </button>
      </div>
    </header>

    <!-- ① 顶部渐变 Banner -->
    <div class="h5-home__banner">
      <div class="h5-home__banner-bg" />
      <div class="h5-home__banner-body">
        <div class="h5-home__banner-meta">
          <span class="h5-home__system-name">实时监测建筑总数</span>
          <span class="h5-home__banner-status" :class="{ 'h5-home__banner-status--ok': true }">
            <span class="h5-home__status-dot" />正常运行
          </span>
        </div>
        <!-- 三项核心统计 -->
        <div class="h5-home__stats">
          <div class="h5-home__stat">
            <span class="h5-home__stat-val tabular-nums">{{ stats.totalBuildings }}</span>
            <span class="h5-home__stat-label">监测建筑（栋）</span>
          </div>
          <div class="h5-home__stat-divider" />
          <div class="h5-home__stat">
            <span class="h5-home__stat-val tabular-nums"
              :class="{ 'h5-home__stat-val--warn': stats.activeAlarms > 0 }">
              {{ stats.activeAlarms }}
            </span>
            <span class="h5-home__stat-label">活跃告警（条）</span>
          </div>
          <div class="h5-home__stat-divider" />
          <div class="h5-home__stat">
            <span class="h5-home__stat-val tabular-nums">{{ stats.todayWorkOrders }}</span>
            <span class="h5-home__stat-label">今日工单（件）</span>
          </div>
        </div>
        <div class="h5-home__city-stage" aria-hidden="true">
          <span class="h5-home__tower h5-home__tower--a" />
          <span class="h5-home__tower h5-home__tower--b" />
          <span class="h5-home__tower h5-home__tower--c" />
          <span class="h5-home__tower h5-home__tower--d" />
          <span class="h5-home__shield">安</span>
          <span class="h5-home__orbit h5-home__orbit--one" />
          <span class="h5-home__orbit h5-home__orbit--two" />
        </div>
        <div class="h5-home__health">
          <div class="h5-home__health-ring" :style="{ '--score': `${healthScore}%` }">
            <strong>{{ healthScore }}%</strong>
            <span>系统健康度</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ② 活跃告警横幅（有告警时才显示） -->
    <div v-if="latestAlarm" class="h5-home__alert-strip"
      :class="`h5-home__alert-strip--${(latestAlarm.alarm_level ?? 'orange').toLowerCase()}`"
      @click="$router.push('/h5/work-orders')">
      <span class="h5-home__alert-icon">⚠</span>
      <div class="h5-home__alert-body">
        <span class="h5-home__alert-level">{{ latestAlarm.alarm_level ?? 'ORANGE' }} 预警</span>
        <span class="h5-home__alert-title">{{ latestAlarm.alarm_title }}</span>
      </div>
      <span class="h5-home__alert-btn">立即查看 ›</span>
    </div>

    <!-- ③ 快捷功能入口 -->
    <div class="h5-card h5-home__section">
      <div class="h5-home__nav-grid">
        <div class="h5-home__nav-item" @click="$router.push('/h5/buildings')">
          <div class="h5-home__nav-icon h5-home__nav-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <span class="h5-home__nav-label">风险监测</span>
        </div>
        <div class="h5-home__nav-item" @click="$router.push('/h5/work-orders')">
          <div class="h5-home__nav-icon h5-home__nav-icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <span class="h5-home__nav-label">预警中心</span>
          <span v-if="stats.activeAlarms > 0" class="h5-home__nav-badge">{{ stats.activeAlarms }}</span>
        </div>
        <div class="h5-home__nav-item" @click="$router.push('/h5/buildings')">
          <div class="h5-home__nav-icon h5-home__nav-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <span class="h5-home__nav-label">数据分析</span>
        </div>
        <div class="h5-home__nav-item" @click="$router.push('/h5/mine')">
          <div class="h5-home__nav-icon h5-home__nav-icon--gray">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <span class="h5-home__nav-label">我的</span>
        </div>
      </div>
    </div>

    <!-- ④ 关键指标 -->
    <div class="h5-card h5-home__section h5-home__metric-section">
      <div class="h5-home__section-header">
        <span class="h5-home__section-title">关键指标</span>
        <span class="h5-home__section-link">立即指标 ›</span>
      </div>
      <div class="h5-home__metric-grid">
        <div v-for="item in metricCards" :key="item.label" class="h5-home__metric-card" :class="`h5-home__metric-card--${item.tone}`">
          <span class="h5-home__metric-label">{{ item.label }}</span>
          <strong class="h5-home__metric-value tabular-nums">{{ formatNumber(item.value) }}</strong>
          <span class="h5-home__metric-sub">{{ item.sub }}</span>
          <span class="h5-home__sparkline" />
        </div>
      </div>
    </div>

    <!-- ⑤ 全市风险态势 -->
    <div class="h5-card h5-home__section h5-home__risk-map-card">
      <div class="h5-home__section-header">
        <span class="h5-home__section-title">全市风险态势</span>
        <span class="h5-home__section-link" @click="$router.push('/h5/buildings')">风险地图 ›</span>
      </div>
      <div class="h5-home__risk-map" @click="$router.push('/h5/buildings')">
        <span class="h5-home__map-pin h5-home__map-pin--red">!</span>
        <span class="h5-home__map-pin h5-home__map-pin--blue h5-home__map-pin--a">馆</span>
        <span class="h5-home__map-pin h5-home__map-pin--blue h5-home__map-pin--b">馆</span>
        <span class="h5-home__map-pin h5-home__map-pin--orange h5-home__map-pin--c">!</span>
        <span class="h5-home__map-pin h5-home__map-pin--orange h5-home__map-pin--d">!</span>
      </div>
    </div>

    <!-- ⑥ 建筑风险概览 -->
    <div class="h5-card h5-home__section" v-if="riskSummary.total > 0">
      <div class="h5-home__section-header">
        <span class="h5-home__section-title">建筑风险概览</span>
        <span class="h5-home__section-link" @click="$router.push('/h5/buildings')">查看全部 ›</span>
      </div>
      <div class="h5-home__risk-row">
        <div class="h5-home__risk-item" @click="$router.push('/h5/buildings')">
          <span class="h5-home__risk-dot h5-home__risk-dot--red" />
          <span class="h5-home__risk-count tabular-nums" style="color:#EF4444">{{ riskSummary.red }}</span>
          <span class="h5-home__risk-name">红色</span>
        </div>
        <div class="h5-home__risk-item" @click="$router.push('/h5/buildings')">
          <span class="h5-home__risk-dot h5-home__risk-dot--orange" />
          <span class="h5-home__risk-count tabular-nums" style="color:#F97316">{{ riskSummary.orange }}</span>
          <span class="h5-home__risk-name">橙色</span>
        </div>
        <div class="h5-home__risk-item" @click="$router.push('/h5/buildings')">
          <span class="h5-home__risk-dot h5-home__risk-dot--yellow" />
          <span class="h5-home__risk-count tabular-nums" style="color:#CA8A04">{{ riskSummary.yellow }}</span>
          <span class="h5-home__risk-name">黄色</span>
        </div>
        <div class="h5-home__risk-item" @click="$router.push('/h5/buildings')">
          <span class="h5-home__risk-dot h5-home__risk-dot--green" />
          <span class="h5-home__risk-count tabular-nums" style="color:#16A34A">{{ riskSummary.green }}</span>
          <span class="h5-home__risk-name">绿色</span>
        </div>
      </div>
    </div>

    <!-- ⑦ 快捷入口 -->
    <div class="h5-card h5-home__section">
      <div class="h5-home__section-header">
        <span class="h5-home__section-title">快捷入口</span>
      </div>
      <div class="h5-home__quick-row">
        <button class="h5-home__quick-btn h5-home__quick-btn--blue" type="button" @click="$router.push('/h5/work-orders')">巡检上报</button>
        <button class="h5-home__quick-btn h5-home__quick-btn--orange" type="button" @click="$router.push('/h5/buildings')">隐患上报</button>
        <button class="h5-home__quick-btn h5-home__quick-btn--purple" type="button" @click="$router.push('/h5/mine')">问题反馈</button>
        <button class="h5-home__quick-btn h5-home__quick-btn--green" type="button" @click="$router.push('/h5/mine')">通讯录</button>
      </div>
    </div>

    <!-- ⑧ 最新动态 -->
    <div class="h5-card h5-home__section" v-if="activities.length > 0">
      <div class="h5-home__section-header">
        <span class="h5-home__section-title">最新动态</span>
      </div>
      <div class="h5-home__activities">
        <div
          v-for="item in activities"
          :key="item.id"
          class="h5-home__activity"
          @click="item.type === '告警' ? $router.push('/h5/work-orders') : $router.push('/h5/work-orders')"
        >
          <span class="h5-home__activity-tag"
            :class="`h5-home__activity-tag--${item.level}`">
            {{ item.type }}
          </span>
          <span class="h5-home__activity-text">{{ item.text }}</span>
          <span class="h5-home__activity-time tabular-nums">{{ item.time }}</span>
        </div>
      </div>
    </div>

    <!-- 底部留白 -->
    <div style="height: 16px" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { getTable } from "@/services/sqliteMirrorRepository"
import { listBuildings } from "@/services/buildingService"

// ── 核心统计 ──────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const spaces = getTable<{ id: number; type: string }>("iot_space")
  const totalBuildings = spaces.filter(s => s.type === "2").length || 23

  // 只统计 RED 级别活跃告警
  const alarmRows = getTable<{ status: string; alarm_level: string }>("alarm_record")
  const activeAlarms = alarmRows.filter(a =>
    a.alarm_level === "RED" && (a.status === "ACTIVE" || a.status === "PENDING")
  ).length

  const orders = getTable<{ create_time: string }>("work_order")
  const today = new Date().toISOString().slice(0, 10)
  const todayWorkOrders = orders.filter(o => (o.create_time ?? "").startsWith(today)).length

  return { totalBuildings, activeAlarms, todayWorkOrders }
})

// ── 最新告警（只有 RED 级别才显示预警横幅）─────────────────────────────────
const latestAlarm = computed(() => {
  const rows = getTable<{
    id: number; alarm_title: string; alarm_level: string; status: string; trigger_time: string
  }>("alarm_record")
  return rows
    .filter(r =>
      r.alarm_level === "RED" && (r.status === "ACTIVE" || r.status === "PENDING")
    )
    .sort((a, b) => (b.trigger_time ?? "").localeCompare(a.trigger_time ?? ""))[0] ?? null
})

// ── 建筑风险概览 ──────────────────────────────────────────────────────────────
const riskSummary = computed(() => {
  const buildings = listBuildings()
  const red    = buildings.filter(b => b.latestRiskLevel === "RED").length
  const orange = buildings.filter(b => b.latestRiskLevel === "ORANGE").length
  const yellow = buildings.filter(b => b.latestRiskLevel === "YELLOW").length
  // null（无分析记录）视为绿色安全
  const green  = buildings.filter(b => !b.latestRiskLevel || b.latestRiskLevel === "GREEN").length
  const total  = buildings.length
  return { red, orange, yellow, green, total }
})

const healthScore = computed(() => {
  const penalty = stats.value.activeAlarms * 2 + riskSummary.value.red * 4 + riskSummary.value.orange * 2
  return Math.max(82, Math.min(99, 98 - penalty))
})

const metricCards = computed(() => {
  const closedSet = new Set(["CLOSED", "CANCELLED", "COMPLETED"])
  const allOrders = getTable<{ status: string }>("work_order")
  const openOrders = allOrders.filter(o => !closedSet.has(o.status ?? "")).length
  return [
    { label: "监测设备", value: stats.value.totalBuildings * 12, sub: "在线率 98.6%", tone: "blue" },
    { label: "隐患点位", value: riskSummary.value.red + riskSummary.value.orange + riskSummary.value.yellow, sub: "较昨日 ↓ 3.6%", tone: "orange" },
    { label: "在处理工单", value: openOrders, sub: "待核查处置", tone: "blue" },
    { label: "应急资源", value: 2465, sub: "可用率 92.4%", tone: "purple" },
  ]
})

function formatNumber(v: number): string {
  return v.toLocaleString("en-US")
}

// ── 最新动态（告警+工单合并，取最新5条） ────────────────────────────────────
const activities = computed(() => {
  const alarms = getTable<{
    id: number; alarm_title: string; alarm_level: string; trigger_time: string
  }>("alarm_record")
    .filter(r => r.trigger_time)
    .map(r => ({
      id:   `a-${r.id}`,
      type: "告警",
      level: (r.alarm_level ?? "ORANGE").toLowerCase(),
      text: r.alarm_title ?? "告警",
      time: (r.trigger_time ?? "").slice(11, 16),
      sort: r.trigger_time ?? "",
    }))

  const orders = getTable<{
    id: number; order_no: string; alarm_level: string; create_time: string
  }>("work_order")
    .filter(r => r.create_time)
    .map(r => ({
      id:   `w-${r.id}`,
      type: "工单",
      level: "order",
      text: r.order_no ?? `工单 #${r.id}`,
      time: (r.create_time ?? "").slice(11, 16),
      sort: r.create_time ?? "",
    }))

  return [...alarms, ...orders]
    .sort((a, b) => b.sort.localeCompare(a.sort))
    .slice(0, 5)
})
</script>

<style scoped>
.h5-home {
  background: var(--h5-bg-page, #F0F4F9);
  min-height: 100vh;
  padding-bottom: 20px;
}

/* ── Banner ── */
.h5-home__banner {
  position: relative;
  padding: 20px 16px 24px;
  overflow: hidden;
}
.h5-home__banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #1044A8 0%, #1B6FE8 55%, #3B8EFF 100%);
  z-index: 0;
}
.h5-home__banner-bg::after {
  content: '';
  position: absolute;
  right: -30px;
  bottom: -30px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.h5-home__banner-body {
  position: relative;
  z-index: 1;
}
.h5-home__banner-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.h5-home__system-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
}
.h5-home__banner-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.12);
  padding: 3px 10px 3px 8px;
  border-radius: 20px;
}
.h5-home__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ADE80;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(74,222,128,0.8);
}
.h5-home__stats {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 14px 8px;
}
.h5-home__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.h5-home__stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.2);
}
.h5-home__stat-val {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.h5-home__stat-val--warn { color: #FCD34D; }
.h5-home__stat-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

/* ── 告警横幅 ── */
.h5-home__alert-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.h5-home__alert-strip--red    { background: linear-gradient(90deg,#FEE2E2,#FEF2F2); border-left: 3px solid #EF4444; }
.h5-home__alert-strip--orange { background: linear-gradient(90deg,#FFEDD5,#FFF7ED); border-left: 3px solid #F97316; }
.h5-home__alert-strip--yellow { background: linear-gradient(90deg,#FEF9C3,#FEFCE8); border-left: 3px solid #EAB308; }
.h5-home__alert-icon { font-size: 18px; flex-shrink: 0; }
.h5-home__alert-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.h5-home__alert-level { font-size: 11px; font-weight: 700; color: #DC2626; }
.h5-home__alert-strip--orange .h5-home__alert-level { color: #EA580C; }
.h5-home__alert-strip--yellow .h5-home__alert-level { color: #CA8A04; }
.h5-home__alert-title { font-size: 13px; font-weight: 500; color: #1C2B4A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h5-home__alert-btn { font-size: 12px; font-weight: 600; color: #1677FF; white-space: nowrap; }

/* ── 通用卡片 Section ── */
.h5-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
.h5-home__section { margin: 10px 12px 0; padding: 14px; }
.h5-home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.h5-home__section-title { font-size: 14px; font-weight: 600; color: #1C2B4A; }
.h5-home__section-link { font-size: 12px; color: #1677FF; cursor: pointer; }

/* ── 快捷功能入口 ── */
.h5-home__nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.h5-home__nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
  padding: 4px 0;
}
.h5-home__nav-item:active { opacity: 0.7; }
.h5-home__nav-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.h5-home__nav-icon svg { width: 22px; height: 22px; }
.h5-home__nav-icon--blue   { background: linear-gradient(135deg,#EFF6FF,#DBEAFE); color: #1D4ED8; }
.h5-home__nav-icon--orange { background: linear-gradient(135deg,#FFF7ED,#FFEDD5); color: #C2410C; }
.h5-home__nav-icon--green  { background: linear-gradient(135deg,#F0FDF4,#DCFCE7); color: #15803D; }
.h5-home__nav-icon--purple { background: linear-gradient(135deg,#F5F3FF,#EDE9FE); color: #6D28D9; }
.h5-home__nav-icon--red    { background: linear-gradient(135deg,#FFF1F2,#FFE4E6); color: #BE123C; }
.h5-home__nav-icon--gray   { background: linear-gradient(135deg,#F8FAFC,#F1F5F9); color: #475569; }
.h5-home__nav-label { font-size: 12px; color: #374151; font-weight: 500; }
.h5-home__nav-badge {
  position: absolute;
  top: 0;
  right: 12px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #EF4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── 建筑风险 ── */
.h5-home__risk-row {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 8px;
}
.h5-home__risk-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 8px;
  background: #F8FAFC;
  cursor: pointer;
}
.h5-home__risk-dot {
  width: 8px; height: 8px; border-radius: 50%; margin-bottom: 2px;
}
.h5-home__risk-dot--red    { background: #EF4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
.h5-home__risk-dot--orange { background: #F97316; box-shadow: 0 0 6px rgba(249,115,22,0.5); }
.h5-home__risk-dot--yellow { background: #EAB308; box-shadow: 0 0 6px rgba(234,179,8,0.5); }
.h5-home__risk-dot--green  { background: #22C55E; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
.h5-home__risk-count { font-size: 20px; font-weight: 700; line-height: 1; }
.h5-home__risk-name { font-size: 11px; color: #94A3B8; }

/* ── 最新动态 ── */
.h5-home__activities { display: flex; flex-direction: column; }
.h5-home__activity {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid #F5F7FA;
  cursor: pointer;
}
.h5-home__activity:last-child { border-bottom: none; }
.h5-home__activity-tag {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.h5-home__activity-tag--red    { background: #FEE2E2; color: #DC2626; }
.h5-home__activity-tag--orange { background: #FFEDD5; color: #C2410C; }
.h5-home__activity-tag--yellow { background: #FEF9C3; color: #92400E; }
.h5-home__activity-tag--order  { background: #DBEAFE; color: #1D4ED8; }
/* 兼容旧写法 */
.h5-home__activity-tag--alarm  { background: #FEE2E2; color: #DC2626; }
.h5-home__activity-text { flex: 1; font-size: 13px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h5-home__activity-time { flex-shrink: 0; font-size: 11px; color: #94A3B8; }

/* ===== 参考图风格覆盖：白蓝移动端、城市主视觉、软卡片 ===== */
.h5-home {
  --h5-blue: #1D6DFF;
  --h5-blue-deep: #0837A8;
  --h5-blue-soft: #EAF3FF;
  background:
    radial-gradient(circle at 50% 160px, rgba(71,142,255,0.22), transparent 240px),
    linear-gradient(180deg, #FFFFFF 0%, #F3F8FF 34%, #F7FAFF 100%);
  color: #0A2A6B;
}

.h5-home__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 20px 20px 8px;
}
.h5-home__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.h5-home__brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0E45D9, #2E7BFF);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(29,109,255,0.28), inset 0 0 0 2px rgba(255,255,255,0.35);
  flex-shrink: 0;
}
.h5-home__brand-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
  color: #052A88;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h5-home__brand-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  color: #6D87B5;
  font-size: 12px;
}
.h5-home__top-actions { display: flex; gap: 8px; flex-shrink: 0; }
.h5-home__icon-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border: 0;
  background: rgba(255,255,255,0.72);
  color: #163475;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(42,93,168,0.12);
}
.h5-home__icon-btn svg { width: 20px; height: 20px; }
.h5-home__notice-badge {
  position: absolute;
  top: -5px;
  right: -3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #EF3333;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 17px;
}

.h5-home__banner {
  margin: 0 12px 14px;
  min-height: 250px;
  padding: 0;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(235,245,255,0.92));
  box-shadow: 0 18px 40px rgba(53,103,180,0.16);
}
.h5-home__banner-bg {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.15), rgba(218,237,255,0.65)),
    radial-gradient(circle at 50% 65%, rgba(46,123,255,0.22), transparent 45%);
}
.h5-home__banner-bg::after {
  right: 40px;
  bottom: 16px;
  width: 210px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(46,123,255,0.22), transparent 68%);
}
.h5-home__banner-body {
  min-height: 250px;
  padding: 18px 18px 16px;
  display: grid;
  grid-template-columns: 1fr 100px;
  grid-template-rows: auto auto 1fr;
  gap: 10px;
}
.h5-home__banner-meta {
  grid-column: 1 / -1;
  margin-bottom: 0;
}
.h5-home__system-name { color: #2A72FF; font-size: 13px; font-weight: 800; }
.h5-home__banner-status {
  color: #1F68EB;
  background: transparent;
  font-size: 13px;
  font-weight: 800;
  padding: 0;
}
.h5-home__stats {
  grid-column: 1;
  grid-row: 2 / 4;
  align-self: start;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.h5-home__stat { align-items: flex-start; gap: 2px; }
.h5-home__stat-divider { display: none; }
.h5-home__stat-val {
  color: #2A72FF;
  font-size: 30px;
  font-weight: 900;
  text-shadow: 0 8px 20px rgba(42,114,255,0.18);
}
.h5-home__stat-val--warn { color: #FF3333; }
.h5-home__stat-label { color: #6B82AA; font-size: 12px; font-weight: 700; }
.h5-home__city-stage {
  grid-column: 1 / -1;
  grid-row: 3;
  position: relative;
  min-height: 150px;
  margin-left: 96px;
  align-self: end;
}
.h5-home__city-stage::before {
  content: '';
  position: absolute;
  left: 12px;
  right: 8px;
  bottom: 16px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(42,114,255,0.34), transparent 68%);
  box-shadow: 0 0 34px rgba(42,114,255,0.22);
}
.h5-home__tower {
  position: absolute;
  bottom: 42px;
  width: 28px;
  border-radius: 8px 8px 2px 2px;
  background: linear-gradient(180deg, rgba(96,165,250,0.18), rgba(46,123,255,0.45));
  border: 1px solid rgba(123,179,255,0.42);
  box-shadow: inset 0 0 18px rgba(255,255,255,0.45), 0 12px 20px rgba(42,114,255,0.16);
}
.h5-home__tower--a { left: 4px; height: 86px; }
.h5-home__tower--b { left: 42px; height: 110px; }
.h5-home__tower--c { right: 50px; height: 126px; }
.h5-home__tower--d { right: 10px; height: 92px; }
.h5-home__shield {
  position: absolute;
  left: 50%;
  bottom: 62px;
  transform: translateX(-50%);
  width: 62px;
  height: 70px;
  clip-path: polygon(50% 0, 92% 16%, 82% 74%, 50% 100%, 18% 74%, 8% 16%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0D4FE8, #49A0FF);
  color: #fff;
  font-weight: 900;
  box-shadow: 0 12px 24px rgba(13,79,232,0.34), inset 0 0 0 3px rgba(255,255,255,0.28);
}
.h5-home__orbit {
  position: absolute;
  left: 50%;
  bottom: 44px;
  transform: translateX(-50%);
  border: 2px solid rgba(75,145,255,0.32);
  border-radius: 50%;
}
.h5-home__orbit--one { width: 156px; height: 36px; }
.h5-home__orbit--two { width: 112px; height: 26px; bottom: 50px; }
.h5-home__health {
  grid-column: 2;
  grid-row: 2 / 4;
  align-self: center;
  justify-self: end;
}
.h5-home__health-ring {
  width: 94px;
  height: 94px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle, #FFFFFF 56%, transparent 58%),
    conic-gradient(#2A72FF var(--score), #D9E8FF 0);
  box-shadow: 0 14px 28px rgba(43,111,232,0.22);
}
.h5-home__health-ring strong { color: #216BFF; font-size: 22px; line-height: 1; }
.h5-home__health-ring span { margin-top: 5px; color: #48628F; font-size: 11px; font-weight: 700; }

.h5-card,
.h5-home__section {
  border: 1px solid rgba(218,230,250,0.9);
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(44,93,154,0.10);
}
.h5-home__section { margin: 12px 12px 0; padding: 14px; }
.h5-home__section-title { color: #062A84; font-size: 15px; font-weight: 900; }
.h5-home__section-link { color: #4E81E8; font-weight: 700; }

.h5-home__nav-grid { grid-template-columns: repeat(6, 1fr); gap: 4px; }
.h5-home__nav-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(180deg, #FFFFFF 0%, #E7F1FF 100%) !important;
  color: #1D6DFF !important;
  box-shadow: 0 8px 18px rgba(42,114,255,0.18), inset 0 -6px 12px rgba(42,114,255,0.10);
}
.h5-home__nav-label { color: #24386A; font-size: 11px; font-weight: 800; }

.h5-home__alert-strip {
  min-height: 62px;
  border: 0;
  border-radius: 14px;
  background: #fff !important;
  box-shadow: 0 10px 28px rgba(44,93,154,0.10);
}
.h5-home__alert-icon {
  width: 52px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFECEC;
  color: #EF3333;
  font-size: 20px;
}
.h5-home__alert-level { color: #EF3333 !important; font-size: 15px; }
.h5-home__alert-title { color: #17305E; font-size: 13px; }
.h5-home__alert-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #1677FF, #2B78FF);
  color: #fff;
  box-shadow: 0 8px 16px rgba(22,119,255,0.22);
}

.h5-home__metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.h5-home__metric-card {
  min-width: 0;
  padding: 10px 8px 8px;
  border: 1px solid #E7EEFB;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}
.h5-home__metric-label { display: block; color: #253969; font-size: 11px; font-weight: 800; }
.h5-home__metric-value { display: block; margin-top: 6px; color: #2A72FF; font-size: 20px; line-height: 1; }
.h5-home__metric-sub { display: block; margin-top: 5px; color: #7B8BAA; font-size: 10px; white-space: nowrap; }
.h5-home__sparkline {
  display: block;
  height: 22px;
  margin-top: 6px;
  border-radius: 4px;
  background: linear-gradient(165deg, transparent 45%, rgba(42,114,255,0.42) 46%, rgba(42,114,255,0.14) 100%);
}
.h5-home__metric-card--orange .h5-home__metric-value { color: #FF9F2E; }
.h5-home__metric-card--orange .h5-home__sparkline { background: linear-gradient(165deg, transparent 45%, rgba(255,159,46,0.48) 46%, rgba(255,159,46,0.14) 100%); }
.h5-home__metric-card--purple .h5-home__metric-value { color: #7E5CFF; }
.h5-home__metric-card--purple .h5-home__sparkline { background: linear-gradient(165deg, transparent 45%, rgba(126,92,255,0.45) 46%, rgba(126,92,255,0.14) 100%); }

.h5-home__risk-map {
  position: relative;
  height: 178px;
  border-radius: 14px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.20), rgba(221,237,255,0.76)),
    repeating-linear-gradient(28deg, transparent 0 18px, rgba(42,114,255,0.10) 19px 20px),
    repeating-linear-gradient(118deg, transparent 0 22px, rgba(42,114,255,0.08) 23px 24px),
    linear-gradient(180deg, #F8FCFF 0%, #DDEEFF 100%);
  box-shadow: inset 0 0 36px rgba(42,114,255,0.16);
  cursor: pointer;
}
.h5-home__risk-map::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 55%;
  width: 96px;
  height: 44px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(239,51,51,0.14);
  box-shadow: 0 0 0 18px rgba(239,51,51,0.10), 0 0 0 36px rgba(239,51,51,0.05);
}
.h5-home__map-pin {
  position: absolute;
  width: 34px;
  height: 42px;
  border-radius: 18px 18px 18px 4px;
  transform: rotate(-45deg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 10px 18px rgba(42,114,255,0.24);
}
.h5-home__map-pin::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: rgba(255,255,255,0.24); }
.h5-home__map-pin { line-height: 1; }
.h5-home__map-pin--red { left: 50%; top: 42%; margin-left: -17px; background: linear-gradient(145deg, #FF4747, #E81818); box-shadow: 0 12px 28px rgba(239,51,51,0.34); }
.h5-home__map-pin--blue { background: linear-gradient(145deg, #2A72FF, #54A4FF); }
.h5-home__map-pin--orange { background: linear-gradient(145deg, #FFB13D, #FF8A1C); }
.h5-home__map-pin--a { left: 10%; top: 30%; }
.h5-home__map-pin--b { right: 13%; top: 25%; }
.h5-home__map-pin--c { left: 23%; bottom: 26px; }
.h5-home__map-pin--d { right: 20%; bottom: 34px; }

.h5-home__quick-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.h5-home__quick-btn {
  height: 42px;
  border: 1px solid #E4EEFF;
  border-radius: 21px;
  background: #fff;
  color: #233865;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(40,89,162,0.08);
}
.h5-home__quick-btn--blue { color: #1D6DFF; }
.h5-home__quick-btn--orange { color: #FF8A1C; }
.h5-home__quick-btn--purple { color: #7E5CFF; }
.h5-home__quick-btn--green { color: #10B981; }
.h5-home__risk-item { background: linear-gradient(180deg, #FFFFFF, #F5F9FF); border: 1px solid #E7EEFB; border-radius: 10px; }
.h5-home__activity { padding: 12px 0; }

@media (max-width: 375px) {
  .h5-home__brand-title { font-size: 14px; }
  .h5-home__banner-body { grid-template-columns: 1fr 86px; padding: 16px 14px; }
  .h5-home__health-ring { width: 82px; height: 82px; }
  .h5-home__city-stage { margin-left: 76px; }
  .h5-home__nav-grid { grid-template-columns: repeat(3, 1fr); row-gap: 12px; }
  .h5-home__metric-grid { grid-template-columns: repeat(2, 1fr); }
  .h5-home__quick-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
