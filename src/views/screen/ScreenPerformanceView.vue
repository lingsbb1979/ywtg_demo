<template>
  <!--
    T15.100 大屏绩效督办中心 /screen/performance
    统计口径：仅督办单（supervision_order），不含工单
    数据来源：supervision_order 表
  -->
  <div class="screen-root screen-bg screen-performance">
    <!-- ===== 顶部标题栏 ===== -->
    <header class="screen-performance__header screen-page-header">
      <div class="screen-page-header__left">
        <router-link to="/screen/home" class="screen-back-link">
          ← 返回大屏首页
        </router-link>
        <div class="screen-page-title-group">
          <span class="screen-page-kicker">PERFORMANCE SUPERVISION</span>
          <h1 class="screen-performance__title screen-page-title">绩效督办中心</h1>
        </div>
      </div>
      <div class="screen-page-header__right">
        <span class="screen-metric-pill">督办 {{ supervisionTotal }} 件</span>
        <span class="screen-performance__time screen-page-time tabular-nums">{{ currentTime }}</span>
      </div>
    </header>

    <!-- ===== 主内容区 ===== -->
    <main class="screen-performance__main">

      <!-- KPI 主指标行（全部督办口径） -->
      <div class="screen-glass-card screen-kpi-ribbon screen-performance__kpi-row" data-zone="kpi">
        <!-- 督办总数 -->
        <div class="screen-kpi-item">
          <span class="board-icon board-icon--checking"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg></span>
          <span class="screen-kpi-item__label">督办总数</span>
          <span class="screen-kpi-item__value tabular-nums" :class="supervisionTotal > 0 ? 'screen-kpi-item__value--warn' : ''">
            {{ supervisionTotal }}
          </span>
          <span class="screen-kpi-item__unit">件</span>
        </div>
        <div class="screen-kpi-divider" />
        <!-- 待回复 -->
        <div class="screen-kpi-item">
          <span class="board-icon board-icon--pending"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg></span>
          <span class="screen-kpi-item__label">待回复</span>
          <span class="screen-kpi-item__value tabular-nums" :class="supervisionPending > 0 ? 'screen-kpi-item__value--warn' : ''">
            {{ supervisionPending }}
          </span>
          <span class="screen-kpi-item__unit">件</span>
        </div>
        <div class="screen-kpi-divider" />
        <!-- 已回复 -->
        <div class="screen-kpi-item">
          <span class="board-icon board-icon--finished"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
          <span class="screen-kpi-item__label">已回复</span>
          <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">
            {{ supervisionReplied }}
          </span>
          <span class="screen-kpi-item__unit">件</span>
        </div>
        <div class="screen-kpi-divider" />
        <!-- 督办回复率 -->
        <div class="screen-kpi-item">
          <span class="board-icon board-icon--processing"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg></span>
          <span class="screen-kpi-item__label">督办回复率</span>
          <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">
            {{ replyRate }}%
          </span>
          <span class="screen-kpi-item__unit">回复率</span>
        </div>
      </div>

      <!-- 详细督办列表 -->
      <div class="screen-glass-card screen-performance__detail-card screen-performance__list-card" data-zone="supervision-list">
        <div class="screen-section-title">
          <span class="screen-section-title__bar" />
          督办明细
        </div>
        <div class="screen-performance__stat-list">
          <div
            v-for="sup in supervisions"
            :key="sup.id"
            class="screen-performance__stat-item"
          >
            <div class="screen-sup-item__left">
              <span class="screen-sup-item__no">{{ sup.supervision_no ?? `#${sup.id}` }}</span>
              <span class="screen-sup-item__title">{{ sup.title ?? '—' }}</span>
            </div>
            <div class="screen-sup-item__right">
              <span
                class="screen-sup-item__status"
                :class="{
                  'screen-sup-item__status--pending':  !sup.reply,
                  'screen-sup-item__status--replied':  !!sup.reply,
                }"
              >{{ sup.reply ? '已回复' : '待回复' }}</span>
              <span class="screen-sup-item__time tabular-nums">{{ (sup.issue_time ?? sup.create_time ?? '').slice(0, 16) }}</span>
            </div>
          </div>
          <div v-if="supervisions.length === 0" class="screen-performance__empty">
            暂无督办记录
          </div>
        </div>
      </div>

    </main>
    <ScreenEmergencyFloatBtn />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import ScreenEmergencyFloatBtn from "./ScreenEmergencyFloatBtn.vue"
import { getTable } from "@/services/sqliteMirrorRepository"

interface SupervisionRow {
  id:              number
  supervision_no:  string | null
  title:           string | null
  status:          string | null
  reply:           string | null
  issue_time:      string | null
  create_time:     string | null
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const supervisions      = ref<SupervisionRow[]>([])
const supervisionTotal  = ref(0)
const supervisionPending = ref(0)
const supervisionReplied = ref(0)
const currentTime        = ref("")

const replyRate = computed(() =>
  supervisionTotal.value === 0
    ? 0
    : Math.round((supervisionReplied.value / supervisionTotal.value) * 1000) / 10
)

// ── 辅助 ──────────────────────────────────────────────────────────────────────
function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
function loadData() {
  currentTime.value = formatTime(new Date())
  const rows = getTable<SupervisionRow>("supervision_order")
  supervisions.value      = [...rows].sort((a, b) => b.id - a.id)
  supervisionTotal.value  = rows.length
  supervisionPending.value = rows.filter(s => !s.reply).length
  supervisionReplied.value = rows.filter(s => !!s.reply).length
}

let timer: ReturnType<typeof setInterval>
onMounted(() => { loadData(); timer = setInterval(loadData, 5_000) })
</script>
<style scoped>
.screen-performance {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}

.screen-performance__header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
}

.screen-back-link {
  font-size: 13px;
  color: var(--screen-cyan, #00D4FF);
  text-decoration: none;
}

.screen-performance__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin: 0;
  flex: 1;
}

.screen-performance__time {
  font-size: 13px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

/* ===== 主内容区 ===== */
.screen-performance__main {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== KPI 主指标行 ===== */
.screen-performance__kpi-row {
  display: flex;
  align-items: center;
  padding: 20px 32px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.20));
  background: var(--screen-panel-bg, rgba(16,24,48,0.85));
  backdrop-filter: blur(10px);
}

/* ===== 详细统计卡片行 ===== */
.screen-performance__detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.screen-performance__detail-card {
  padding: 20px 24px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.20));
  background: var(--screen-panel-bg, rgba(16,24,48,0.85));
  backdrop-filter: blur(10px);
}

.screen-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin-bottom: 16px;
}

.screen-section-title__bar {
  width: 3px;
  height: 14px;
  background: var(--screen-cyan, #00D4FF);
  border-radius: 2px;
}

.screen-performance__stat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.screen-performance__stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.screen-performance__stat-label {
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

.screen-performance__stat-value {
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  font-size: 16px;
}

.screen-performance__stat-value--warn {
  color: var(--risk-red, #FF4444);
}

/* ===== 参考图风格覆盖 ===== */
.screen-performance {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #020D1F !important;
}
/* 与首页完全一致：去掉 screen-bg 的蓝色渐变和光晔 */
.screen-performance::before {
  background:
    linear-gradient(rgba(0, 180, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.04) 1px, transparent 1px) !important;
  background-size: 48px 48px, 48px 48px !important;
  mask-image: none !important;
  opacity: 1 !important;
}
.screen-performance::after { display: none !important; }

.screen-performance__header {
  margin: 10px 12px 0;
  border-color: rgba(44, 166, 255, 0.7);
  background:
    linear-gradient(180deg, rgba(6, 38, 91, 0.96), rgba(4, 23, 58, 0.88)),
    radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.22), transparent 52%);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.28), inset 0 1px 0 rgba(156, 210, 255, 0.22);
}

.screen-performance__main {
  padding: 12px;
  gap: 12px;
  overflow: hidden;
}

.screen-performance__kpi-row {
  height: 144px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 22px;
  border-color: rgba(44, 166, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(7, 42, 98, 0.9), rgba(4, 22, 55, 0.8)),
    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.14), transparent 62%);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.28), inset 0 0 28px rgba(16, 92, 190, 0.16);
}

.screen-performance__kpi-row .screen-kpi-divider {
  display: none;
}

.screen-performance__kpi-row .screen-kpi-item {
  position: relative;
  align-items: flex-start;
  justify-content: center;
  padding-left: 64px;
  border-right: 1px solid rgba(0, 145, 255, 0.18);
}

.screen-performance__kpi-row .screen-kpi-item:last-child {
  border-right: 0;
}

/* 用 board-icon 替代空菱形 ::before */
.screen-performance__kpi-row .screen-kpi-item::before {
  display: none;
}

.screen-performance__kpi-row .board-icon {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 42px;
  height: 42px;
  margin-bottom: 0;
}

.screen-performance__kpi-row .screen-kpi-item__value {
  font-size: 36px;
  color: #F8FBFF;
  text-shadow: 0 0 18px rgba(95, 189, 255, 0.5);
}

.screen-performance__detail-row {
  grid-template-columns: 1.15fr 0.85fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.screen-performance__detail-card {
  border-color: rgba(44, 166, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(7, 42, 98, 0.9), rgba(4, 22, 55, 0.8)),
    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.12), transparent 62%);
  box-shadow: 0 0 28px rgba(0, 132, 255, 0.24), inset 0 0 28px rgba(16, 92, 190, 0.16);
}

.screen-performance__stat-item {
  min-height: 58px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 145, 255, 0.18);
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}

.screen-performance__stat-value {
  font-size: 22px;
  text-shadow: 0 0 14px currentColor;
}

/* ===== 督办明细列表 ===== */
.screen-performance__list-card {
  border-color: rgba(44, 166, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(7, 42, 98, 0.9), rgba(4, 22, 55, 0.8)),
    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.12), transparent 62%);
  box-shadow: 0 0 28px rgba(0, 132, 255, 0.24), inset 0 0 28px rgba(16, 92, 190, 0.16);
  padding: 20px 24px;
  border-radius: var(--radius-lg, 12px);
  flex: 1;
  overflow-y: auto;
}

.screen-sup-item__left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.screen-sup-item__no {
  font-size: 11px;
  color: var(--screen-cyan, #00D4FF);
  opacity: 0.75;
}

.screen-sup-item__title {
  font-size: 14px;
  color: var(--screen-text-h1, #fff);
}

.screen-sup-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.screen-sup-item__status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.screen-sup-item__status--pending {
  background: rgba(239,68,68,0.15);
  color: #F87171;
  border: 1px solid rgba(239,68,68,0.3);
}

.screen-sup-item__status--replied {
  background: rgba(16,185,129,0.15);
  color: #34D399;
  border: 1px solid rgba(16,185,129,0.3);
}

.screen-sup-item__time {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}

.screen-performance__empty {
  text-align: center;
  padding: 40px 0;
  color: var(--screen-text-muted, rgba(255,255,255,0.4));
  font-size: 13px;
}
</style>
