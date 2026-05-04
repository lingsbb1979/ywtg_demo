<template>
  <!--
    T15.99 大屏应急管理中心 /screen/emergency
    ──────────────────────────────────────────────────────────────
    · 有活跃事件：显示 5 步应急指挥确认面板（与首页 overlay 相同逻辑）
    · 无活跃事件：显示历史应急事件归档列表
    · 完整应急事件管理系统（含 开发中 模块扩展规划，即将上线）
    ──────────────────────────────────────────────────────────────
  -->
  <div class="screen-root screen-bg screen-emergency">
    <!-- 顶部标题栏 -->
    <header class="screen-emergency__header screen-page-header">
      <div class="screen-page-header__left">
        <router-link to="/screen/home" class="screen-back-link">← 返回大屏首页</router-link>
        <div class="screen-page-title-group">
          <span class="screen-page-kicker">EMERGENCY COMMAND</span>
          <h1 class="screen-emergency__title screen-page-title">应急管理中心</h1>
        </div>
      </div>
      <div class="screen-page-header__right">
        <span class="screen-emergency__time screen-page-time">{{ currentTime }}</span>
      </div>
    </header>

    <!-- ① 多个活跃事件：先选择处置哪一个 -->
    <main v-if="allActiveIncidents.length > 1 && currentIncident === null" class="screen-emergency__main screen-emergency__main--selector">
      <div class="screen-glass-card screen-em-selector">
        <div class="screen-em-selector__header">
          <span class="screen-em-panel__icon" style="font-size:26px;width:40px;height:40px">!</span>
          <div>
            <h2 class="screen-em-panel__title" style="font-size:20px">红色预警 — 请选择处置事件</h2>
            <p class="screen-em-panel__sub">检测到 {{ allActiveIncidents.length }} 个活跃应急事件，请选择进行指挥处置：</p>
          </div>
        </div>
        <div class="screen-em-selector__list">
          <div
            v-for="inc in allActiveIncidents"
            :key="inc.id"
            class="screen-glass-card screen-em-selector__item"
            @click="selectedIncidentId = inc.id"
          >
            <span class="screen-em-selector__badge">RED</span>
            <div class="screen-em-selector__info">
              <span class="screen-em-selector__building">{{ getBuilding(inc.building_id) }}</span>
              <span class="screen-em-selector__no">事件编号 {{ inc.incident_no }} · 触发 {{ inc.trigger_time }}</span>
              <span class="screen-em-selector__progress">已完成 {{ inc.current_step }} / {{ planNodesCount }} 步</span>
            </div>
            <span class="screen-em-selector__arrow">开始处置 →</span>
          </div>
        </div>
      </div>
    </main>

    <!-- ② 单个或已选事件：5 步应急指挥面板 -->
    <main v-else-if="currentIncident" class="screen-emergency__main screen-emergency__main--active">
      <div class="screen-glass-card screen-em-panel">
        <!-- 多事件时显示返回选择按钮 -->
        <button v-if="allActiveIncidents.length > 1" class="screen-em-back-btn" @click="selectedIncidentId = null">← 返回事件选择</button>
        <!-- 面板标题 -->
        <div class="screen-em-panel__header">
          <span class="screen-em-panel__icon">!</span>
          <div>
            <h2 class="screen-em-panel__title">红色预警 — 应急指挥流程</h2>
            <p class="screen-em-panel__sub">
              {{ incidentBuilding }} · 倾斜超限 · 事件编号 {{ currentIncident.incident_no }}
              · 触发时间 {{ currentIncident.trigger_time }}
            </p>
          </div>
        </div>

        <!-- 步骤列表 -->
        <div class="screen-em-steps">
          <div
            v-for="(node, idx) in planNodes"
            :key="node.id"
            class="screen-em-step"
            :class="{
              'screen-em-step--done':    idx < currentIncident.current_step,
              'screen-em-step--current': idx === currentIncident.current_step,
              'screen-em-step--locked':  idx > currentIncident.current_step,
            }"
          >
            <div class="screen-em-step__no">
              <template v-if="idx < currentIncident.current_step">✓</template>
              <template v-else>{{ idx + 1 }}</template>
            </div>
            <div class="screen-em-step__body">
              <span class="screen-em-step__name">{{ node.node_name }}</span>
              <span v-if="node.limit_minutes" class="screen-em-step__limit">
                时限 {{ node.limit_minutes }} 分钟
              </span>
              <!-- 最后步骤完成后显示 H5 结案链接 -->
              <template v-if="idx === planNodes.length - 1 && idx < currentIncident.current_step">
                <div class="screen-em-step__h5">
                  <span style="color:rgba(255,255,255,0.6);font-size:12px">请外勤人员打开手机访问：</span>
                  <a :href="h5EmergencyUrl" target="_blank" class="screen-em-step__h5-btn">
                    打开 H5 结案页 →
                  </a>
                </div>
              </template>
            </div>
            <div class="screen-em-step__action">
              <button
                v-if="idx === currentIncident.current_step"
                class="screen-em-step__confirm"
                @click="handleConfirm(node)"
              >✓ 确认</button>
              <span v-else-if="idx < currentIncident.current_step" class="screen-em-step__done-tag">已完成</span>
            </div>
          </div>
        </div>

        <!-- 全部步骤完成提示 -->
        <div v-if="currentIncident.current_step >= planNodes.length" class="screen-em-panel__footer">
          <span style="color:#10B981">✅ 所有步骤已完成，等待外勤 H5 端选择结案方式…</span>
        </div>
      </div>
    </main>

    <!-- ③ 无活跃事件：系统正常 + 归档列表 -->
    <main v-else class="screen-emergency__main">
      <!-- 无事件提示 -->
      <div class="screen-glass-card screen-em-no-incident">
          <span class="screen-em-no-incident__icon">OK</span>
        <p class="screen-em-no-incident__text">当前无活跃应急事件</p>
        <p class="screen-em-no-incident__hint">系统持续监测中，红色告警触发后将自动启动应急预案流程</p>
      </div>

      <!-- 历史应急事件归档（含"上报市政府"归档记录） -->
      <div class="screen-glass-card screen-em-archive">
        <div class="screen-em-archive__header">
          应急事件归档
          <span class="badge-screen badge-screen--orange" style="margin-left:8px">{{ allIncidents.length }} 条</span>
        </div>
        <div v-if="allIncidents.length === 0" class="screen-em-archive__empty">
          暂无历史应急事件记录
        </div>
        <div v-else class="screen-em-archive__list">
          <div
            v-for="inc in allIncidents"
            :key="inc.id"
            class="screen-em-archive__item screen-glass-card"
          >
            <!-- 顶部摘要行 -->
            <div class="screen-em-archive__item-row" @click="toggleExpand(inc.id)">
              <div class="screen-em-archive__item-left">
                <span
                  class="badge-screen"
                  :class="Number(inc.status) === 40 ? 'badge-screen--green' : 'badge-screen--red'"
                >{{ Number(inc.status) === 40 ? '已结案' : '处理中' }}</span>
                <span class="screen-em-archive__no">{{ inc.incident_no }}</span>
              </div>
              <div class="screen-em-archive__item-mid">
                <span class="screen-em-archive__building">{{ getBuilding(inc.building_id) }}</span>
                <span class="screen-em-archive__time">触发：{{ inc.trigger_time }}</span>
              </div>
              <div class="screen-em-archive__item-right">
                <span v-if="inc.close_type === 'REPAIR_ORDER'" class="badge-screen badge-screen--orange">
                  转修缮工单
                </span>
                <span v-else-if="inc.close_type === 'REPORT_GOV'" class="badge-screen badge-screen--red">
                  上报市政府·已归档
                </span>
                <span v-else class="badge-screen" style="border:1px solid rgba(255,255,255,0.2)">
                  进行中（步骤 {{ inc.current_step }}/{{ planNodesCount }}）
                </span>
                <span class="screen-em-archive__expand-btn">{{ expandedIds.has(inc.id) ? '▲' : '▼' }}</span>
              </div>
            </div>

            <!-- 展开时间轴 -->
            <div v-if="expandedIds.has(inc.id)" class="screen-em-archive__timeline">
              <div
                v-for="(step, idx) in getIncidentTimeline(inc)"
                :key="step.node_code"
                class="screen-em-tl-item"
                :class="step.confirmed ? 'screen-em-tl-item--done' : 'screen-em-tl-item--pending'"
              >
                <div class="screen-em-tl-item__dot" />
                <div class="screen-em-tl-item__body">
                  <span class="screen-em-tl-item__name">步骤 {{ idx + 1 }}：{{ step.node_name }}</span>
                  <span v-if="step.confirmed" class="screen-em-tl-item__time">{{ step.confirm_time }}</span>
                  <span v-else class="screen-em-tl-item__time screen-em-tl-item__time--none">未执行</span>
                </div>
              </div>
              <!-- 结案节点 -->
              <div v-if="Number(inc.status) === 40" class="screen-em-tl-item screen-em-tl-item--close">
                <div class="screen-em-tl-item__dot screen-em-tl-item__dot--close" />
                <div class="screen-em-tl-item__body">
                  <span class="screen-em-tl-item__name">
                    <template v-if="inc.close_type === 'REPAIR_ORDER'">结案：转修缮工单处置</template>
                    <template v-else-if="inc.close_type === 'REPORT_GOV'">结案：上报市政府，申请整体拆除</template>
                    <template v-else>结案</template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部状态栏 -->
    <footer class="screen-footer screen-glass-card">
      <span class="screen-footer__item">应急管理中心</span>
      <span class="screen-footer__divider" />
      <span class="screen-footer__item">数据更新：{{ currentTime }}</span>
      <router-link class="screen-footer__item" to="/screen/alarm-dispatch" style="color:rgba(0,212,255,0.7)">
        告警派遣中心 →
      </router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import {
  getAllActiveIncidents,
  getAllIncidents,
  getPlanNodes,
  getIncidentOrders,
  confirmStep,
  type EmergencyIncident,
  type EmergencyFlowNode,
  type EmergencyOrder,
} from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

const currentTime        = ref("")
const allActiveIncidents = ref<EmergencyIncident[]>([])
const selectedIncidentId = ref<number | null>(null)
const allIncidents       = ref<EmergencyIncident[]>([])
const spaces             = ref<{ id: number; name: string }[]>([])

/** 当前处置的事件：只有1个时自动选中，多个时需手动选择 */
const currentIncident = computed<EmergencyIncident | null>(() => {
  if (allActiveIncidents.value.length === 1) return allActiveIncidents.value[0]
  if (selectedIncidentId.value !== null)
    return allActiveIncidents.value.find(i => Number(i.id) === selectedIncidentId.value) ?? null
  return null
})

const planNodes = computed<EmergencyFlowNode[]>(() =>
  currentIncident.value ? getPlanNodes(currentIncident.value.plan_id) : getPlanNodes(1)
)

// 展开状态：归档事件 id 集合
const expandedIds = ref(new Set<number>())
function toggleExpand(id: number): void {
  const s = new Set(expandedIds.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  expandedIds.value = s
}

/** 将事件步骤与确认记录合并，生成时间轴 */
function getIncidentTimeline(inc: EmergencyIncident): Array<{
  node_code: string; node_name: string; confirmed: boolean; confirm_time: string | null
}> {
  const nodes = getPlanNodes(inc.plan_id)
  const orders: EmergencyOrder[] = getIncidentOrders(inc.id)
  const orderMap = new Map(orders.map((o) => [o.order_type, o]))
  return nodes.map((node) => {
    const order = orderMap.get(node.node_code)
    return { node_code: node.node_code, node_name: node.node_name, confirmed: !!order, confirm_time: order?.confirm_time ?? null }
  })
}

function getBuilding(id: number | null): string {
  if (id == null) return "未知建筑"
  const s = spaces.value.find((x) => Number(x.id) === Number(id))
  return s?.name ?? `建筑 #${id}`
}

const planNodesCount = computed(() => planNodes.value.length || 5)

const h5EmergencyUrl = computed(() => {
  if (!currentIncident.value) return ""
  return `${window.location.origin}/h5/emergency/${currentIncident.value.id}?_role=FIELD_WORKER`
})

const incidentBuilding = computed(() => getBuilding(currentIncident.value?.building_id ?? null))

function handleConfirm(node: EmergencyFlowNode): void {
  if (!currentIncident.value) return
  confirmStep(currentIncident.value.id, node.node_code)
  loadData()
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadData() {
  spaces.value             = getTable<{ id: number; name: string }>("iot_space")
  allActiveIncidents.value = getAllActiveIncidents()
  // 若已选事件已结案则重置选择
  if (selectedIncidentId.value !== null) {
    const still = allActiveIncidents.value.find(i => Number(i.id) === selectedIncidentId.value)
    if (!still) selectedIncidentId.value = null
  }
  allIncidents.value = getAllIncidents()
  currentTime.value  = formatTime(new Date())
}

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  loadData()
  timer = setInterval(loadData, 5_000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.screen-emergency {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}
.screen-emergency__header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
}
.screen-back-link { font-size: 13px; color: var(--screen-cyan, #00D4FF); text-decoration: none; }
.screen-emergency__title { font-size: 18px; font-weight: 700; color: #fff; flex: 1; }
.screen-emergency__time  { font-size: 13px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; }

.screen-emergency__main {
  flex: 1; overflow-y: auto; padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.screen-emergency__main--active   { align-items: center; justify-content: center; }
.screen-emergency__main--selector { align-items: center; justify-content: flex-start; padding-top: 40px; }

/* 事件选择面板 */
.screen-em-selector { width: min(680px, calc(100vw - 48px)); padding: 28px 32px; display: flex; flex-direction: column; gap: 16px; border-color: rgba(239,68,68,0.45); }
.screen-em-selector__header { display: flex; align-items: flex-start; gap: 16px; }
.screen-em-selector__list   { display: flex; flex-direction: column; gap: 10px; }
.screen-em-selector__item   { display: flex; align-items: center; gap: 16px; padding: 16px 20px; cursor: pointer; border-color: rgba(239,68,68,0.3); transition: border-color 0.15s, background 0.15s; }
.screen-em-selector__item:hover { border-color: rgba(239,68,68,0.7); background: rgba(239,68,68,0.1) !important; }
.screen-em-selector__badge    { padding: 3px 10px; border-radius: 4px; background: #EF4444; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.screen-em-selector__info     { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.screen-em-selector__building { font-size: 16px; font-weight: 700; color: #fff; }
.screen-em-selector__no       { font-size: 12px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; }
.screen-em-selector__progress { font-size: 12px; color: rgba(255,200,0,0.8); }
.screen-em-selector__arrow    { font-size: 14px; font-weight: 700; color: var(--screen-cyan, #00D4FF); flex-shrink: 0; }
.screen-em-back-btn { align-self: flex-start; padding: 6px 14px; border-radius: 6px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.35); color: var(--screen-cyan, #00D4FF); font-size: 13px; cursor: pointer; }
.screen-em-back-btn:hover { background: rgba(0,212,255,0.18); }

/* 活跃事件面板 */
.screen-em-panel { width: 100%; max-width: 760px; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
.screen-em-panel__header { display: flex; align-items: flex-start; gap: 16px; }
.screen-em-panel__icon   { font-size: 36px; }
.screen-em-panel__title  { font-size: 20px; font-weight: 700; color: #EF4444; margin: 0 0 4px; }
.screen-em-panel__sub    { font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; }
.screen-em-panel__footer { padding: 12px 16px; background: rgba(16,185,129,0.08); border-radius: 8px; font-size: 14px; text-align: center; }

.screen-em-steps { display: flex; flex-direction: column; gap: 10px; }
.screen-em-step {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 16px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}
.screen-em-step--done    { border-color: rgba(16,185,129,0.35); background: rgba(16,185,129,0.06); }
.screen-em-step--current { border-color: rgba(239,68,68,0.5);   background: rgba(239,68,68,0.08); }
.screen-em-step--locked  { opacity: 0.45; }
.screen-em-step__no {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff;
}
.screen-em-step--done .screen-em-step__no    { background: rgba(16,185,129,0.2); border-color: #10B981; color: #10B981; }
.screen-em-step--current .screen-em-step__no { background: rgba(239,68,68,0.25); border-color: #EF4444; color: #EF4444; }
.screen-em-step__body  { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.screen-em-step__name  { font-size: 15px; font-weight: 600; color: #fff; }
.screen-em-step__limit { font-size: 12px; color: rgba(255,200,0,0.8); }
.screen-em-step__h5    { margin-top: 6px; display: flex; align-items: center; gap: 10px; }
.screen-em-step__h5-btn {
  display: inline-block; padding: 4px 14px; border-radius: 4px;
  background: rgba(22,119,255,0.25); border: 1px solid #1677FF;
  color: #60AEFF; font-size: 13px; text-decoration: none;
}
.screen-em-step__action    { flex-shrink: 0; }
.screen-em-step__confirm   { padding: 6px 18px; border-radius: 6px; background: #EF4444; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.screen-em-step__confirm:hover { opacity: 0.85; }
.screen-em-step__done-tag  { font-size: 13px; color: #10B981; }

/* 无事件提示 */
.screen-em-no-incident { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.screen-em-no-incident__text { font-size: 18px; color: #10B981; font-weight: 600; margin: 0; }
.screen-em-no-incident__hint { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }

/* 归档列表 */
.screen-em-archive { padding: 20px 24px; }
.screen-em-archive__header { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 14px; display: flex; align-items: center; }
.screen-em-archive__empty  { color: rgba(255,255,255,0.4); font-size: 14px; padding: 20px 0; text-align: center; }
.screen-em-archive__list   { display: flex; flex-direction: column; gap: 10px; }
.screen-em-archive__item   { display: flex; flex-direction: column; padding: 14px 16px; cursor: pointer; }
.screen-em-archive__item-row   { display: flex; align-items: center; gap: 16px; }
.screen-em-archive__item-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; width: 200px; }
.screen-em-archive__item-mid   { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.screen-em-archive__item-right { flex-shrink: 0; display: flex; align-items: center; gap: 10px; }
.screen-em-archive__no       { font-size: 13px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; }
.screen-em-archive__building { font-size: 15px; font-weight: 600; color: #fff; }
.screen-em-archive__time     { font-size: 12px; color: rgba(255,255,255,0.45); }
.screen-em-archive__expand-btn { font-size: 11px; color: rgba(255,255,255,0.35); cursor: pointer; padding: 0 4px; }

/* 归档时间轴 */
.screen-em-archive__timeline { margin-top: 14px; padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 0; }
.screen-em-tl-item { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 12px; position: relative; }
.screen-em-tl-item::before {
  content: ''; position: absolute; left: 6px; top: 18px; bottom: 0;
  width: 1px; background: rgba(255,255,255,0.12);
}
.screen-em-tl-item:last-child::before { display: none; }
.screen-em-tl-item__dot {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; z-index: 1;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.25);
}
.screen-em-tl-item--done .screen-em-tl-item__dot   { background: #10B981; border-color: #10B981; }
.screen-em-tl-item--close .screen-em-tl-item__dot,
.screen-em-tl-item__dot--close                      { background: #1677FF; border-color: #1677FF; }
.screen-em-tl-item__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.screen-em-tl-item__name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.8); }
.screen-em-tl-item--pending .screen-em-tl-item__name { color: rgba(255,255,255,0.35); }
.screen-em-tl-item--close  .screen-em-tl-item__name  { color: #60AEFF; }
.screen-em-tl-item__time { font-size: 12px; color: rgba(255,255,255,0.45); font-variant-numeric: tabular-nums; }
.screen-em-tl-item__time--none { color: rgba(255,255,255,0.2); }

/* ===== 参考图风格覆盖 ===== */
.screen-emergency {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #020D1F !important;
}
/* 与首页完全一致：去掉 screen-bg 的蓝色渐变和光晔 */
.screen-emergency::before {
  background:
    linear-gradient(rgba(0, 180, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.04) 1px, transparent 1px) !important;
  background-size: 48px 48px, 48px 48px !important;
  mask-image: none !important;
  opacity: 1 !important;
}
.screen-emergency::after { display: none !important; }

.screen-emergency__header {
  margin: 10px 12px 0;
  border-color: rgba(44, 166, 255, 0.7);
  background:
    linear-gradient(180deg, rgba(6, 38, 91, 0.96), rgba(4, 23, 58, 0.88)),
    radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.22), transparent 52%);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.28), inset 0 1px 0 rgba(156, 210, 255, 0.22);
}

.screen-emergency__main {
  padding: 12px;
  gap: 12px;
  overflow: hidden;
}

.screen-emergency__main--active {
  align-items: stretch;
  justify-content: center;
}

.screen-em-panel {
  width: min(1180px, calc(100vw - 48px));
  max-width: none;
  margin: 0 auto;
  padding: 32px 40px;
  border-color: rgba(255, 68, 68, 0.58);
  background:
    radial-gradient(circle at 16% 0%, rgba(255, 68, 68, 0.18), transparent 38%),
    linear-gradient(180deg, rgba(8, 42, 98, 0.9), rgba(4, 22, 55, 0.82));
  box-shadow: 0 0 34px rgba(255, 68, 68, 0.18), inset 0 0 30px rgba(0, 132, 255, 0.12);
}

.screen-em-panel__icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle, #FF4E45 0 44%, rgba(255,78,69,0.32) 45% 100%);
  color: #fff;
  font-size: 28px;
  font-weight: 900;
  box-shadow: 0 0 0 18px rgba(239,68,68,0.12), 0 0 32px rgba(239,68,68,0.7);
}

.screen-em-panel__title {
  font-size: 26px;
  color: #FF6A5F;
  text-shadow: 0 0 16px rgba(255, 68, 68, 0.54);
}

.screen-em-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.screen-em-step {
  min-height: 150px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-color: rgba(0, 145, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}

.screen-em-step__no {
  width: 38px;
  height: 38px;
  box-shadow: 0 0 16px currentColor;
}

.screen-em-no-incident {
  min-height: 190px;
  justify-content: center;
  border-color: rgba(51, 246, 162, 0.44);
}

.screen-em-no-incident__icon {
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(51, 246, 162, 0.55);
  color: #33F6A2;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 0 24px rgba(51, 246, 162, 0.34), inset 0 0 18px rgba(51, 246, 162, 0.12);
}

.screen-em-archive {
  flex: 1;
  overflow: hidden;
}

.screen-em-archive__list {
  max-height: calc(100vh - 390px);
  overflow-y: auto;
  padding-right: 4px;
}

.screen-em-archive__item {
  border-color: rgba(0, 145, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}
</style>
