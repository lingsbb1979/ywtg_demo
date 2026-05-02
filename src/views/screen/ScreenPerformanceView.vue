<template>
  <!--
    T15.100 大屏绩效看板 /screen/performance
    ─────────────────────────────────────────────────────────────
    P1 轻量版：展示闭环率、平均响应时间、超时数、督办数
    数据来源：work_order 表 + supervision_order 表
    ─────────────────────────────────────────────────────────────
  -->
  <div class="screen-root screen-bg screen-performance">
    <!-- ===== 顶部标题栏 ===== -->
    <header class="screen-performance__header">
      <router-link to="/screen/home" class="screen-back-link">
        ← 返回大屏首页
      </router-link>
      <h1 class="screen-performance__title">绩效看板</h1>
      <span class="screen-performance__time tabular-nums">{{ currentTime }}</span>
    </header>

    <!-- ===== 主内容区 ===== -->
    <main class="screen-performance__main">

      <!-- KPI 主指标行 -->
      <div class="screen-glass-card screen-performance__kpi-row" data-zone="kpi">
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">工单闭环率</span>
          <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">
            {{ closeRate }}%
          </span>
          <span class="screen-kpi-item__unit">闭环率</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">平均响应时间</span>
          <span class="screen-kpi-item__value tabular-nums">
            {{ avgResponseTime }}
          </span>
          <span class="screen-kpi-item__unit">分钟</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">超时工单数</span>
          <span
            class="screen-kpi-item__value tabular-nums"
            :class="overdueCount > 0 ? 'screen-kpi-item__value--warn' : ''"
          >
            {{ overdueCount }}
          </span>
          <span class="screen-kpi-item__unit">条</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">督办数</span>
          <span
            class="screen-kpi-item__value tabular-nums"
            :class="supervisionCount > 0 ? 'screen-kpi-item__value--warn' : ''"
          >
            {{ supervisionCount }}
          </span>
          <span class="screen-kpi-item__unit">件</span>
        </div>
      </div>

      <!-- 详细统计卡片 -->
      <div class="screen-performance__detail-row">
        <!-- 工单完成统计 -->
        <div class="screen-glass-card screen-performance__detail-card" data-zone="workorder-stats">
          <div class="screen-section-title">
            <span class="screen-section-title__bar" />
            工单完成统计
          </div>
          <div class="screen-performance__stat-list">
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">待接单</span>
              <span class="screen-performance__stat-value tabular-nums" style="color:var(--wo-pending,#F59E0B)">
                {{ stats.pending }}
              </span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">处理中</span>
              <span class="screen-performance__stat-value tabular-nums" style="color:var(--wo-processing,#3B82F6)">
                {{ stats.processing }}
              </span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">待核查</span>
              <span class="screen-performance__stat-value tabular-nums" style="color:var(--wo-checking,#8B5CF6)">
                {{ stats.checking }}
              </span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">已销号</span>
              <span class="screen-performance__stat-value tabular-nums" style="color:var(--wo-finished,#10B981)">
                {{ stats.finished }}
              </span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">总计</span>
              <span class="screen-performance__stat-value tabular-nums" style="color:var(--screen-cyan,#00D4FF)">
                {{ stats.total }}
              </span>
            </div>
          </div>
        </div>

        <!-- 督办统计 -->
        <div class="screen-glass-card screen-performance__detail-card" data-zone="supervision-stats">
          <div class="screen-section-title">
            <span class="screen-section-title__bar" />
            督办统计
          </div>
          <div class="screen-performance__stat-list">
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">督办总数</span>
              <span class="screen-performance__stat-value tabular-nums">{{ supervisionCount }}</span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">待回复</span>
              <span
                class="screen-performance__stat-value tabular-nums"
                :class="supervisionPending > 0 ? 'screen-performance__stat-value--warn' : ''"
              >
                {{ supervisionPending }}
              </span>
            </div>
            <div class="screen-performance__stat-item">
              <span class="screen-performance__stat-label">已回复</span>
              <span class="screen-performance__stat-value tabular-nums">{{ supervisionReplied }}</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { getTable } from "@/services/sqliteMirrorRepository"
import { selectWorkOrderBoard, selectScreenKpi } from "@/services/screenKpiService"

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const closeRate       = ref(0)
const avgResponseTime = ref("—")
const overdueCount    = ref(0)
const supervisionCount  = ref(0)
const supervisionPending  = ref(0)
const supervisionReplied  = ref(0)
const currentTime     = ref("")
const stats = ref({ pending: 0, processing: 0, checking: 0, finished: 0, total: 0 })

// ── 辅助函数 ──────────────────────────────────────────────────────────────────
function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
function loadData() {
  currentTime.value = formatTime(new Date())

  // 工单数据
  const kpi = selectScreenKpi()
  closeRate.value = kpi.closeRate

  const board = selectWorkOrderBoard()
  overdueCount.value = board.overdueCount
  stats.value = {
    pending:    board.pending,
    processing: board.processing,
    checking:   board.checking,
    finished:   board.finished,
    total:      board.total,
  }

  // 平均响应时间（简化：从已完成工单计算）
  const orders = getTable<{
    status: string
    dispatch_time: string | null
    finish_time:   string | null
  }>("work_order")

  const finished = orders.filter(o => o.status === "FINISHED" && o.dispatch_time && o.finish_time)
  if (finished.length > 0) {
    const totalMins = finished.reduce((sum, o) => {
      const diffMs = Date.parse((o.finish_time!).replace(" ", "T")) -
                     Date.parse((o.dispatch_time!).replace(" ", "T"))
      return sum + Math.floor(diffMs / 60000)
    }, 0)
    avgResponseTime.value = String(Math.floor(totalMins / finished.length))
  } else {
    avgResponseTime.value = "—"
  }

  // 督办数据
  const supervisions = getTable<{ status: string; reply: string | null }>("supervision_order")
  supervisionCount.value  = supervisions.length
  supervisionPending.value  = supervisions.filter(s => !s.reply).length
  supervisionReplied.value  = supervisions.filter(s => !!s.reply).length
}

onMounted(() => {
  loadData()
})
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
</style>
