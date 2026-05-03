<template>
  <!--
    H5 应急结案页 /h5/emergency/:id
    ─────────────────────────────────────────────────
    大屏所有步骤确认后，外勤人员在手机端选择最终处置方式：
      "转为修缮工单" — 险情解除，后续物理修缮
      "上报市政府"   — 整体危险，归档上报

    数据来源：
      emergency_incident → 事件基本信息
      iot_space          → 建筑名称
    写入：
      emergencyService.resolveIncident()
        → 更新 emergency_incident.status=40
        → "REPAIR_ORDER" 时额外创建 work_order
  -->
  <div class="h5-em h5-main">

    <!-- 加载中 -->
    <div v-if="loading" class="h5-em__center">
      <span style="color:var(--h5-text-muted,#94A3B8)">加载中...</span>
    </div>

    <!-- 无效事件 -->
    <div v-else-if="!incident" class="h5-em__center">
      <span class="h5-em__icon">📭</span>
      <p class="h5-em__tip">未找到活跃应急事件</p>
      <button class="h5-btn-secondary" @click="$router.back()">返回</button>
    </div>

    <!-- 已结案 -->
    <div v-else-if="resolved" class="h5-em__center h5-em__center--success">
      <span class="h5-em__icon">✅</span>
      <p class="h5-em__done-title">应急事件已结案</p>
      <p class="h5-em__done-sub">{{ resolvedMsg }}</p>
      <button class="h5-btn-primary" style="margin-top:24px" @click="$router.push('/h5/work-orders')">
        返回工单列表
      </button>
    </div>

    <!-- 结案操作 -->
    <div v-else class="h5-em__content">
      <!-- 事件信息卡 -->
      <div class="h5-card h5-em__info-card">
        <div class="h5-em__badge-row">
          <span class="h5-em__badge h5-em__badge--red">🚨 红色应急</span>
          <span class="h5-em__event-no">{{ incident.incident_no }}</span>
        </div>
        <div class="h5-em__building">{{ buildingName }}</div>
        <div class="h5-em__sub">倾斜超限 · 触发时间 {{ incident.trigger_time }}</div>
        <div class="h5-em__steps-done">
          大屏已完成全部确认步骤，请选择最终处置方式
        </div>
      </div>

      <!-- 结案选项 -->
      <div class="h5-em__options">
        <!-- 转修缮工单 -->
        <button
          class="h5-em__option-btn h5-em__option-btn--repair"
          :disabled="submitting"
          @click="handleResolve('REPAIR_ORDER')"
        >
          <span class="h5-em__option-icon">🔧</span>
          <div class="h5-em__option-texts">
            <span class="h5-em__option-title">转为修缮工单</span>
            <span class="h5-em__option-desc">险情已控制，后续进行物理修缮加固</span>
          </div>
        </button>

        <!-- 上报市政府 -->
        <button
          class="h5-em__option-btn h5-em__option-btn--report"
          :disabled="submitting"
          @click="handleResolve('REPORT_GOV')"
        >
          <span class="h5-em__option-icon">🏛️</span>
          <div class="h5-em__option-texts">
            <span class="h5-em__option-title">上报市政府</span>
            <span class="h5-em__option-desc">建筑整体危险，申请整体拆除处置</span>
          </div>
        </button>
      </div>

      <!-- 提交中提示 -->
      <p v-if="submitting" class="h5-em__submitting">提交中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getActiveIncident, resolveIncident, type EmergencyIncident } from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

const route   = useRoute()
const router  = useRouter()

const loading    = ref(true)
const submitting = ref(false)
const resolved   = ref(false)
const resolvedMsg = ref("")
const incident   = ref<EmergencyIncident | null>(null)

const buildingName = computed(() => {
  if (!incident.value) return ""
  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const space = spaces.find((s) => Number(s.id) === Number(incident.value!.building_id))
  return space?.name ?? `建筑 #${incident.value.building_id}`
})

onMounted(() => {
  const idParam = route.params.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)

  // 优先从 URL id 查找事件；若无效则找任意活跃事件（兼容从大屏链接跳转）
  if (id > 0) {
    const incidents = getTable<EmergencyIncident>("emergency_incident")
    const found = incidents.find((r) => Number(r.id) === id && Number(r.status) !== 40)
    incident.value = found ?? null
  }
  if (!incident.value) {
    incident.value = getActiveIncident()
  }

  loading.value = false
})

function handleResolve(closeType: "REPAIR_ORDER" | "REPORT_GOV"): void {
  if (!incident.value || submitting.value) return
  submitting.value = true
  const result = resolveIncident(incident.value.id, closeType)
  submitting.value = false

  if (result.ok) {
    resolved.value = true
    if (closeType === "REPAIR_ORDER") {
      resolvedMsg.value = `已生成修缮工单，工单编号 WO-EM-${String(result.workOrderId ?? "").padStart(4, "0")}，请工单中心跟进处置。`
    } else {
      resolvedMsg.value = "已上报市政府，事件已归档。整体拆除方案由市政府审批后执行。"
    }
  }
}
</script>

<style scoped>
.h5-em {
  min-height: 100vh;
  background: var(--h5-bg-page, #F7F9FC);
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + env(safe-area-inset-bottom) + 16px);
}

.h5-em__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
}
.h5-em__center--success { gap: 8px; }
.h5-em__icon { font-size: 48px; }
.h5-em__tip  { color: var(--h5-text-muted, #94A3B8); font-size: 14px; }

.h5-em__done-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-success, #10B981);
  margin: 0;
}
.h5-em__done-sub {
  font-size: 13px;
  color: var(--h5-text-muted, #94A3B8);
  max-width: 280px;
  line-height: 1.6;
  margin: 0;
}

/* 内容区 */
.h5-em__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 事件信息卡 */
.h5-em__info-card {
  background: var(--h5-bg-card, #FFFFFF);
  border-radius: var(--h5-radius-card, 12px);
  padding: 16px;
  box-shadow: var(--h5-shadow-card, 0 2px 8px rgba(0,0,0,0.06));
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.h5-em__badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.h5-em__badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 9999px;
}
.h5-em__badge--red {
  background: rgba(239,68,68,0.12);
  color: #EF4444;
  border: 1px solid rgba(239,68,68,0.30);
}
.h5-em__event-no {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
  font-variant-numeric: tabular-nums;
}
.h5-em__building {
  font-size: 18px;
  font-weight: 700;
  color: var(--h5-text-primary, #1E293B);
}
.h5-em__sub {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-em__steps-done {
  margin-top: 4px;
  font-size: 13px;
  color: var(--h5-text-secondary, #475569);
  background: rgba(16,185,129,0.06);
  border-left: 3px solid #10B981;
  padding: 8px 10px;
  border-radius: 0 6px 6px 0;
}

/* 选项按钮 */
.h5-em__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.h5-em__option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--h5-bg-card, #FFFFFF);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.h5-em__option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.h5-em__option-btn--repair { border-color: rgba(59,130,246,0.30); }
.h5-em__option-btn--repair:not(:disabled):active {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.h5-em__option-btn--report { border-color: rgba(239,68,68,0.30); }
.h5-em__option-btn--report:not(:disabled):active {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
}
.h5-em__option-icon { font-size: 32px; flex-shrink: 0; }
.h5-em__option-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.h5-em__option-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--h5-text-primary, #1E293B);
}
.h5-em__option-desc {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
  line-height: 1.4;
}

.h5-em__submitting {
  text-align: center;
  color: var(--h5-text-muted, #94A3B8);
  font-size: 13px;
}

.h5-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 32px;
  border: none;
  border-radius: 22px;
  background: var(--h5-primary, #1677FF);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22,119,255,0.35);
  transition: opacity 0.15s;
}
.h5-btn-primary:active { opacity: 0.85; }

.h5-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 24px;
  border: 1px solid var(--h5-border, #D1D5DB);
  border-radius: 20px;
  background: #fff;
  color: var(--h5-text-secondary, #475569);
  font-size: 14px;
  cursor: pointer;
}
</style>
