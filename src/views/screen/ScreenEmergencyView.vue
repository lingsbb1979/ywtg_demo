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
    <header class="screen-emergency__header">
      <router-link to="/screen/home" class="screen-back-link">← 返回大屏首页</router-link>
      <h1 class="screen-emergency__title">应急管理中心</h1>
      <span class="screen-emergency__time">{{ currentTime }}</span>
    </header>

    <!-- ① 有活跃事件：5 步应急指挥面板 -->
    <main v-if="activeIncident" class="screen-emergency__main screen-emergency__main--active">
      <div class="screen-glass-card screen-em-panel">
        <!-- 面板标题 -->
        <div class="screen-em-panel__header">
          <span class="screen-em-panel__icon">🚨</span>
          <div>
            <h2 class="screen-em-panel__title">红色预警 — 应急指挥流程</h2>
            <p class="screen-em-panel__sub">
              {{ incidentBuilding }} · 倾斜超限 · 事件编号 {{ activeIncident.incident_no }}
              · 触发时间 {{ activeIncident.trigger_time }}
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
              'screen-em-step--done':    idx < activeIncident.current_step,
              'screen-em-step--current': idx === activeIncident.current_step,
              'screen-em-step--locked':  idx > activeIncident.current_step,
            }"
          >
            <div class="screen-em-step__no">
              <template v-if="idx < activeIncident.current_step">✓</template>
              <template v-else>{{ idx + 1 }}</template>
            </div>
            <div class="screen-em-step__body">
              <span class="screen-em-step__name">{{ node.node_name }}</span>
              <span v-if="node.limit_minutes" class="screen-em-step__limit">
                时限 {{ node.limit_minutes }} 分钟
              </span>
              <!-- 最后步骤完成后显示 H5 结案链接 -->
              <template v-if="idx === planNodes.length - 1 && idx < activeIncident.current_step">
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
                v-if="idx === activeIncident.current_step"
                class="screen-em-step__confirm"
                @click="handleConfirm(node)"
              >✓ 确认</button>
              <span v-else-if="idx < activeIncident.current_step" class="screen-em-step__done-tag">已完成</span>
            </div>
          </div>
        </div>

        <!-- 全部步骤完成提示 -->
        <div v-if="activeIncident.current_step >= planNodes.length" class="screen-em-panel__footer">
          <span style="color:#10B981">✅ 所有步骤已完成，等待外勤 H5 端选择结案方式…</span>
        </div>
      </div>
    </main>

    <!-- ② 无活跃事件：系统正常 + 归档列表 -->
    <main v-else class="screen-emergency__main">
      <!-- 无事件提示 -->
      <div class="screen-glass-card screen-em-no-incident">
        <span style="font-size:40px">🟢</span>
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
                🔧 转修缮工单
              </span>
              <span v-else-if="inc.close_type === 'REPORT_GOV'" class="badge-screen badge-screen--red">
                🏛️ 上报市政府·已归档
              </span>
              <span v-else class="badge-screen" style="border:1px solid rgba(255,255,255,0.2)">
                进行中（步骤 {{ inc.current_step }}/{{ planNodesCount }}）
              </span>
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
  getActiveIncident,
  getAllIncidents,
  getPlanNodes,
  confirmStep,
  type EmergencyIncident,
  type EmergencyFlowNode,
} from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

const currentTime    = ref("")
const activeIncident = ref<EmergencyIncident | null>(null)
const planNodes      = ref<EmergencyFlowNode[]>([])
const allIncidents   = ref<EmergencyIncident[]>([])
const spaces         = ref<{ id: number; name: string }[]>([])

function getBuilding(id: number | null): string {
  if (id == null) return "未知建筑"
  const s = spaces.value.find((x) => Number(x.id) === Number(id))
  return s?.name ?? `建筑 #${id}`
}

const planNodesCount = computed(() => planNodes.value.length || 5)

const h5EmergencyUrl = computed(() => {
  if (!activeIncident.value) return ""
  return `${window.location.origin}/h5/emergency/${activeIncident.value.id}?_role=FIELD_WORKER`
})

const incidentBuilding = computed(() => getBuilding(activeIncident.value?.building_id ?? null))

function handleConfirm(node: EmergencyFlowNode): void {
  if (!activeIncident.value) return
  confirmStep(activeIncident.value.id, node.node_code)
  loadData()
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadData() {
  spaces.value         = getTable<{ id: number; name: string }>("iot_space")
  const incident       = getActiveIncident()
  activeIncident.value = incident
  planNodes.value      = incident ? getPlanNodes(incident.plan_id) : getPlanNodes(1)
  allIncidents.value   = getAllIncidents()
  currentTime.value    = formatTime(new Date())
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
.screen-emergency__main--active { align-items: center; justify-content: center; }

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
.screen-em-archive__item   { display: flex; align-items: center; gap: 16px; padding: 14px 16px; }
.screen-em-archive__item-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; width: 200px; }
.screen-em-archive__item-mid   { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.screen-em-archive__item-right { flex-shrink: 0; }
.screen-em-archive__no       { font-size: 13px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; }
.screen-em-archive__building { font-size: 15px; font-weight: 600; color: #fff; }
.screen-em-archive__time     { font-size: 12px; color: rgba(255,255,255,0.45); }
</style>
