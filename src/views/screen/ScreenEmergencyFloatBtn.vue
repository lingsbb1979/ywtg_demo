<template>
  <!--
    大屏通用组件：应急红灯悬浮按钮 + 弹框
    ────────────────────────────────────────
    · 有活跃应急事件（未 H5 结案）时，右上角显示红色闪烁灯 + 数量徽章
    · 点击红灯 → 弹出应急指挥弹框（可关闭）
    · 弹框内容与 /screen/emergency 相同（多事件先选择，单事件直接打勾）
    · 全部 H5 结案后（status=40）红灯自动消失
    ────────────────────────────────────────
    用法：在任意大屏页面根节点末尾插入 <ScreenEmergencyFloatBtn />
  -->

  <!-- 红灯悬浮按钮（仅有活跃事件时显示） -->
  <Teleport to="body">
    <button
      v-if="allActiveIncidents.length > 0"
      class="em-float-btn"
      :title="`${allActiveIncidents.length} 个活跃应急事件`"
      @click="open = true"
    >
      <span class="em-float-btn__ring" />
      <span class="em-float-btn__ring em-float-btn__ring--delay" />
      <span class="em-float-btn__icon">🚨</span>
      <span class="em-float-btn__badge">{{ allActiveIncidents.length }}</span>
    </button>

    <!-- 弹框遮罩 -->
    <Transition name="em-modal">
      <div v-if="open" class="em-modal-overlay" @click.self="open = false">
        <div class="em-modal screen-bg">
          <!-- 弹框顶栏 -->
          <div class="em-modal__header">
            <span class="em-modal__header-icon">🚨</span>
            <div>
              <h2 class="em-modal__title">应急指挥中心</h2>
              <p class="em-modal__sub">
                {{ allActiveIncidents.length }} 个活跃应急事件
              </p>
            </div>
            <button class="em-modal__close" @click="open = false">✕</button>
          </div>

          <!-- 弹框正文 -->
          <div class="em-modal__body">

            <!-- A. 多个事件 → 选择列表 -->
            <template v-if="allActiveIncidents.length > 1 && selectedId === null">
              <p class="em-modal__hint">检测到 {{ allActiveIncidents.length }} 个红色应急事件，请选择处置：</p>
              <div class="em-selector-list">
                <div
                  v-for="inc in allActiveIncidents"
                  :key="inc.id"
                  class="em-selector-item screen-glass-card"
                  @click="selectedId = inc.id"
                >
                  <span class="em-selector-item__badge">RED</span>
                  <div class="em-selector-item__info">
                    <span class="em-selector-item__building">{{ buildingName(inc.building_id) }}</span>
                    <span class="em-selector-item__no">{{ inc.incident_no }} · {{ inc.trigger_time }}</span>
                    <span class="em-selector-item__prog">已完成 {{ inc.current_step }} / {{ getPlanNodes(inc.plan_id).length }} 步</span>
                  </div>
                  <span class="em-selector-item__arrow">开始处置 →</span>
                </div>
              </div>
            </template>

            <!-- B. 单个事件 or 已选 → 步骤面板 -->
            <template v-else-if="currentIncident">
              <!-- 多事件时返回按钮 -->
              <button v-if="allActiveIncidents.length > 1" class="em-back-btn" @click="selectedId = null">← 返回事件列表</button>

              <!-- 事件信息 -->
              <div class="em-incident-header">
                <span class="em-incident-header__icon">!</span>
                <div>
                  <div class="em-incident-header__title">红色预警 — 应急指挥流程</div>
                  <div class="em-incident-header__sub">
                    {{ buildingName(currentIncident.building_id) }} · 事件编号 {{ currentIncident.incident_no }}
                    · 触发时间 {{ currentIncident.trigger_time }}
                  </div>
                </div>
              </div>

              <!-- 步骤列表 -->
              <div class="em-steps">
                <div
                  v-for="(node, idx) in planNodes"
                  :key="node.id"
                  class="em-step"
                  :class="{
                    'em-step--done':    idx < currentIncident.current_step,
                    'em-step--current': idx === currentIncident.current_step,
                    'em-step--locked':  idx > currentIncident.current_step,
                  }"
                >
                  <div class="em-step__no">
                    <template v-if="idx < currentIncident.current_step">✓</template>
                    <template v-else>{{ idx + 1 }}</template>
                  </div>
                  <div class="em-step__body">
                    <span class="em-step__name">{{ node.node_name }}</span>
                    <span v-if="node.limit_minutes" class="em-step__limit">时限 {{ node.limit_minutes }} 分钟</span>
                    <!-- 最后步骤完成 → H5 结案链接 -->
                    <template v-if="idx === planNodes.length - 1 && idx < currentIncident.current_step">
                      <div class="em-step__h5">
                        <span style="color:rgba(255,255,255,0.55);font-size:12px">请外勤打开手机：</span>
                        <a :href="h5Url" target="_blank" class="em-step__h5-btn">打开 H5 结案页 →</a>
                      </div>
                    </template>
                  </div>
                  <div class="em-step__action">
                    <button
                      v-if="idx === currentIncident.current_step"
                      class="em-step__confirm"
                      @click="doConfirm(node)"
                    >✓ 确认</button>
                    <span v-else-if="idx < currentIncident.current_step" class="em-step__done-tag">已完成</span>
                  </div>
                </div>
              </div>

              <!-- 全部完成提示 -->
              <div v-if="currentIncident.current_step >= planNodes.length" class="em-done-footer">
                ✅ 所有步骤已完成，等待外勤 H5 端选择结案方式…
              </div>
            </template>

          </div><!-- /body -->
        </div><!-- /modal -->
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import {
  getAllActiveIncidents,
  getPlanNodes,
  confirmStep,
  type EmergencyIncident,
  type EmergencyFlowNode,
} from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

// ── 状态 ──────────────────────────────────────────────────────────────────────
const open               = ref(false)
const allActiveIncidents = ref<EmergencyIncident[]>([])
const selectedId         = ref<number | null>(null)
const spaces             = ref<{ id: number; name: string }[]>([])

// ── 当前处置事件 ──────────────────────────────────────────────────────────────
const currentIncident = computed<EmergencyIncident | null>(() => {
  if (allActiveIncidents.value.length === 1) return allActiveIncidents.value[0]
  if (selectedId.value !== null)
    return allActiveIncidents.value.find(i => Number(i.id) === selectedId.value) ?? null
  return null
})

const planNodes = computed<EmergencyFlowNode[]>(() =>
  currentIncident.value ? getPlanNodes(currentIncident.value.plan_id) : []
)

const h5Url = computed(() =>
  currentIncident.value
    ? `${window.location.origin}/h5/emergency/${currentIncident.value.id}?_role=FIELD_WORKER`
    : ""
)

// ── 辅助 ──────────────────────────────────────────────────────────────────────
function buildingName(id: number | null): string {
  if (id == null) return "未知建筑"
  const s = spaces.value.find(x => Number(x.id) === Number(id))
  return s?.name ?? `建筑 #${id}`
}

function doConfirm(node: EmergencyFlowNode) {
  if (!currentIncident.value) return
  confirmStep(currentIncident.value.id, node.node_code)
  loadData()
}

// ── 数据加载（每 5 秒刷新） ────────────────────────────────────────────────────
function loadData() {
  spaces.value             = getTable<{ id: number; name: string }>("iot_space")
  allActiveIncidents.value = getAllActiveIncidents()
  // 若已选事件已结案，重置选择
  if (selectedId.value !== null) {
    const still = allActiveIncidents.value.find(i => Number(i.id) === selectedId.value)
    if (!still) {
      selectedId.value = null
      // 若所有事件均已结案，关闭弹框
      if (allActiveIncidents.value.length === 0) open.value = false
    }
  }
}

let timer: ReturnType<typeof setInterval>
onMounted(() => { loadData(); timer = setInterval(loadData, 5_000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
/* ===== 浮动红灯按钮 ===== */
.em-float-btn {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 9998;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(circle, #FF2020 0%, #C0000A 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 0 rgba(255, 30, 30, 0.7);
  animation: em-float-pulse 1.3s ease-in-out infinite;
}
.em-float-btn__ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(255, 50, 50, 0.6);
  animation: em-ring-expand 1.3s ease-out infinite;
}
.em-float-btn__ring--delay { animation-delay: 0.65s; }
@keyframes em-float-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,30,30,0.7), 0 0 20px rgba(255,30,30,0.5); }
  50%       { box-shadow: 0 0 0 10px rgba(255,30,30,0), 0 0 32px rgba(255,30,30,0.8); }
}
@keyframes em-ring-expand {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}
.em-float-btn__icon { font-size: 22px; position: relative; z-index: 1; }
.em-float-btn__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #FFEB3B;
  color: #B71C1C;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  z-index: 2;
  box-shadow: 0 0 6px rgba(0,0,0,0.4);
}

/* ===== 弹框遮罩 + 容器 ===== */
.em-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(2, 8, 26, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.em-modal {
  width: min(860px, calc(100vw - 48px));
  max-height: calc(100vh - 80px);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.5);
  background:
    radial-gradient(circle at 10% 0%, rgba(255, 68, 68, 0.15), transparent 38%),
    linear-gradient(180deg, rgba(6, 30, 80, 0.97), rgba(3, 16, 48, 0.95));
  box-shadow: 0 0 48px rgba(239, 68, 68, 0.25), 0 24px 80px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 弹框顶栏 */
.em-modal__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 24px 16px;
  border-bottom: 1px solid rgba(239, 68, 68, 0.25);
  flex-shrink: 0;
}
.em-modal__header-icon { font-size: 26px; }
.em-modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #FF6A5F;
  margin: 0 0 2px;
  text-shadow: 0 0 12px rgba(255,68,68,0.5);
}
.em-modal__sub  { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
.em-modal__close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.em-modal__close:hover { background: rgba(255,255,255,0.14); color: #fff; }

/* 弹框正文 */
.em-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.em-modal__hint { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; }

/* ===== 选择列表 ===== */
.em-selector-list { display: flex; flex-direction: column; gap: 10px; }
.em-selector-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  border-color: rgba(239,68,68,0.3);
  transition: border-color 0.15s, background 0.15s;
  background: linear-gradient(180deg, rgba(8,40,95,0.7), rgba(4,20,55,0.6)) !important;
}
.em-selector-item:hover { border-color: rgba(239,68,68,0.7) !important; background: rgba(239,68,68,0.1) !important; }
.em-selector-item__badge { padding: 3px 10px; border-radius: 4px; background: #EF4444; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.em-selector-item__info  { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.em-selector-item__building { font-size: 15px; font-weight: 700; color: #fff; }
.em-selector-item__no   { font-size: 12px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; }
.em-selector-item__prog { font-size: 12px; color: rgba(255,200,0,0.85); }
.em-selector-item__arrow { font-size: 14px; font-weight: 700; color: #00D4FF; flex-shrink: 0; }

/* ===== 步骤面板 ===== */
.em-back-btn {
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.3);
  color: #00D4FF;
  font-size: 12px;
  cursor: pointer;
}
.em-back-btn:hover { background: rgba(0,212,255,0.18); }

.em-incident-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.em-incident-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, #FF4E45 44%, rgba(255,78,69,0.3) 100%);
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 16px rgba(239,68,68,0.7);
}
.em-incident-header__title { font-size: 17px; font-weight: 700; color: #FF6A5F; margin: 0 0 4px; }
.em-incident-header__sub   { font-size: 12px; color: rgba(255,255,255,0.55); }

.em-steps { display: flex; flex-direction: column; gap: 8px; }
.em-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
}
.em-step--done    { border-color: rgba(16,185,129,0.35); background: rgba(16,185,129,0.06); }
.em-step--current { border-color: rgba(239,68,68,0.5);   background: rgba(239,68,68,0.08); }
.em-step--locked  { opacity: 0.45; }
.em-step__no {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff;
}
.em-step--done .em-step__no    { background: rgba(16,185,129,0.2); border-color: #10B981; color: #10B981; }
.em-step--current .em-step__no { background: rgba(239,68,68,0.25); border-color: #EF4444; color: #EF4444; }
.em-step__body  { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.em-step__name  { font-size: 14px; font-weight: 600; color: #fff; }
.em-step__limit { font-size: 12px; color: rgba(255,200,0,0.8); }
.em-step__h5    { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.em-step__h5-btn {
  padding: 3px 12px; border-radius: 4px;
  background: rgba(22,119,255,0.25); border: 1px solid #1677FF;
  color: #60AEFF; font-size: 12px; text-decoration: none;
}
.em-step__action    { flex-shrink: 0; }
.em-step__confirm   { padding: 5px 16px; border-radius: 6px; background: #EF4444; border: none; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.em-step__confirm:hover { opacity: 0.85; }
.em-step__done-tag  { font-size: 12px; color: #10B981; }

.em-done-footer {
  padding: 12px 16px;
  background: rgba(16,185,129,0.08);
  border-radius: 8px;
  font-size: 13px;
  color: #10B981;
  text-align: center;
}

/* ===== 弹框动画 ===== */
.em-modal-enter-active, .em-modal-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.em-modal-enter-from  { opacity: 0; transform: scale(0.95); }
.em-modal-leave-to    { opacity: 0; transform: scale(0.95); }
.em-modal-enter-active .em-modal,
.em-modal-leave-active .em-modal { transition: inherit; }
</style>
