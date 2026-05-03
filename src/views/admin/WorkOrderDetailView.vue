<template>
  <div class="wo-detail" style="color: var(--pc-text-body, #374151)">

    <!-- ===== 页面标题栏 ===== -->
    <div class="admin-page-header">
      <div class="admin-page-header__left">
        <router-link to="/admin/work-orders" class="wo-detail__back">← 工单管理</router-link>
        <h2 class="admin-page-title">工单详情</h2>
        <span v-if="order" class="admin-page-subtitle">{{ order.orderNo ?? `#${order.id}` }}</span>
      </div>
      <!-- 核查按钮 -->
      <div v-if="order?.status === 'CHECKING'" class="admin-page-header__right" style="gap:8px;display:flex">
        <button class="btn-pc-secondary btn-sm" @click="doReject">退回重办</button>
        <button class="btn-pc-primary btn-sm" @click="doVerify">核查通过</button>
      </div>
    </div>

    <!-- ===== 加载 / 空 ===== -->
    <div v-if="loading" class="admin-empty">加载中…</div>
    <div v-else-if="!order" class="admin-empty">
      未找到工单 #{{ rawId }}
      <router-link to="/admin/work-orders" style="margin-left:8px;color:var(--pc-primary,#1677ff)">返回列表</router-link>
    </div>

    <template v-else>
      <!-- ===== 基本信息卡片 ===== -->
      <div class="pc-card admin-card wo-detail__section">
        <div class="wo-detail__card-title">基本信息</div>
        <div class="admin-detail-grid">
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">工单编号</div>
            <code class="admin-detail-item__value" style="font-family:monospace">{{ order.orderNo ?? order.orderCode ?? '—' }}</code>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">建筑名称</div>
            <div class="admin-detail-item__value">{{ order.buildingName ?? `#${order.buildingId}` }}</div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">告警等级</div>
            <div class="admin-detail-item__value">
              <span class="admin-badge" :class="levelBadgeClass(order.alarmLevel)">{{ order.alarmLevel ?? '—' }}</span>
            </div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">工单状态</div>
            <div class="admin-detail-item__value">
              <span class="admin-badge" :class="statusBadgeClass(order.status)">{{ STATUS_LABEL[order.status ?? ''] ?? order.status ?? '—' }}</span>
            </div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">派单时间</div>
            <div class="admin-detail-item__value">{{ order.dispatchTime?.slice(0, 16) ?? '—' }}</div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">接单时间</div>
            <div class="admin-detail-item__value">{{ order.acceptTime?.slice(0, 16) ?? '—' }}</div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">完成时间</div>
            <div class="admin-detail-item__value">{{ order.finishTime?.slice(0, 16) ?? '—' }}</div>
          </div>
          <div class="admin-detail-item">
            <div class="admin-detail-item__label">核查时间</div>
            <div class="admin-detail-item__value">{{ order.checkTime?.slice(0, 16) ?? '—' }}</div>
          </div>
          <div v-if="order.dispatchOrg" class="admin-detail-item">
            <div class="admin-detail-item__label">派单单位</div>
            <div class="admin-detail-item__value">{{ order.dispatchOrg }}</div>
          </div>
          <div v-if="order.receiveOrg" class="admin-detail-item">
            <div class="admin-detail-item__label">接单单位</div>
            <div class="admin-detail-item__value">{{ order.receiveOrg }}</div>
          </div>
          <div v-if="order.alarmTitle" class="admin-detail-item" style="grid-column: 1 / -1">
            <div class="admin-detail-item__label">关联告警</div>
            <div class="admin-detail-item__value">{{ order.alarmTitle }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 处置记录 ===== -->
      <div class="pc-card admin-card wo-detail__section" v-if="order.disposals.length > 0">
        <div class="wo-detail__card-title">外勤处置记录</div>
        <div
          v-for="(d, idx) in order.disposals"
          :key="d.id"
          class="wo-detail__disposal"
        >
          <div class="wo-detail__disposal-header">
            <span class="wo-detail__disposal-index">处置 #{{ idx + 1 }}</span>
            <span class="wo-detail__disposal-time">{{ d.disposalTime?.slice(0, 16) ?? '—' }}</span>
          </div>
          <p v-if="d.disposalDesc" class="wo-detail__disposal-desc">{{ d.disposalDesc }}</p>
          <p v-if="d.addressDesc" class="wo-detail__disposal-location">
            <span style="opacity:0.55">📍</span> {{ d.addressDesc }}
          </p>
          <!-- 现场照片 -->
          <div v-if="parsedImages(d.imageUrls).length > 0" class="wo-detail__disposal-images">
            <img
              v-for="(url, i) in parsedImages(d.imageUrls)"
              :key="i"
              :src="url"
              class="wo-detail__disposal-img"
              :alt="`现场照片${i+1}`"
            />
          </div>
        </div>
      </div>
      <div class="pc-card admin-card wo-detail__section wo-detail__no-disposal" v-else>
        <div class="wo-detail__card-title">外勤处置记录</div>
        <div class="admin-empty" style="padding:24px 0">暂无处置记录</div>
      </div>

      <!-- ===== 流程时间轴 ===== -->
      <div class="pc-card admin-card wo-detail__section" v-if="order.logs.length > 0">
        <div class="wo-detail__card-title">处理流程</div>
        <ul class="admin-timeline">
          <li
            v-for="log in order.logs"
            :key="log.id"
            class="admin-timeline-item"
          >
            <span class="admin-timeline-dot admin-timeline-dot--primary"></span>
            <div class="admin-timeline-content">
              <div class="admin-timeline-content__title">
                {{ log.nodeName ?? log.nodeType ?? '节点' }}
                <span v-if="log.operatorName || log.operator" class="wo-detail__log-operator">
                  — {{ log.operatorName ?? log.operator }}
                </span>
              </div>
              <div v-if="log.actionDesc" class="wo-detail__log-desc">{{ log.actionDesc }}</div>
              <time class="admin-timeline-content__time">{{ log.actionTime?.slice(0, 16) ?? log.createTime?.slice(0, 16) ?? '—' }}</time>
            </div>
          </li>
        </ul>
      </div>

    </template>

    <!-- 操作反馈 -->
    <div v-if="actionMsg" class="admin-action-msg admin-action-msg--fixed">{{ actionMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  getWorkOrder,
  verifyWorkOrder,
  rejectWorkOrder,
  type WorkOrderDetail,
} from "@/services/workOrderService"

const route  = useRoute()
const router = useRouter()
const rawId  = computed(() => Number(route.params.id))

const order:    WorkOrderDetail | null | undefined = ref(undefined as any)
const loading   = ref(true)
const actionMsg = ref("")

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待接单",
  PROCESSING: "处理中",
  CHECKING:   "待核查",
  FINISHED:   "已销号",
  CLOSED:     "已销号",
}

function statusBadgeClass(status: string | null) {
  const map: Record<string, string> = {
    PENDING:    "admin-badge--warning",
    PROCESSING: "admin-badge--primary",
    CHECKING:   "admin-badge--info",
    FINISHED:   "admin-badge--success",
    CLOSED:     "admin-badge--success",
  }
  return map[status ?? ""] ?? ""
}

function levelBadgeClass(level: string | null) {
  const map: Record<string, string> = {
    RED:    "admin-badge--danger",
    ORANGE: "admin-badge--warning",
    YELLOW: "admin-badge--yellow",
    GREEN:  "admin-badge--success",
  }
  return map[level ?? ""] ?? ""
}

function parsedImages(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    // 逗号分隔兜底
    return raw.split(",").map(s => s.trim()).filter(Boolean)
  }
  return []
}

function loadData() {
  loading.value = true
  const result = getWorkOrder(rawId.value)
  ;(order as any).value = result
  loading.value = false
}

function showMsg(msg: string) {
  actionMsg.value = msg
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

function doVerify() {
  const result = verifyWorkOrder(rawId.value)
  if (result.ok) {
    showMsg("✓ 核查通过，工单已销号")
    loadData()
  } else {
    showMsg(`✗ ${result.error}`)
  }
}

function doReject() {
  const result = rejectWorkOrder(rawId.value)
  if (result.ok) {
    showMsg("✓ 已退回重办")
    loadData()
  } else {
    showMsg(`✗ ${result.error}`)
  }
}

onMounted(loadData)
</script>

<style scoped>
.wo-detail {
  background: var(--pc-bg-page, #F0F4F9);
  min-height: 100%;
}

.wo-detail__back {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  text-decoration: none;
  margin-right: 8px;
}
.wo-detail__back:hover { color: var(--pc-primary, #1677ff); }

.wo-detail__section {
  margin-bottom: 16px;
  padding: 20px 24px;
}

.wo-detail__card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-text-heading, #111827);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--pc-border, #E5E7EB);
}

/* ── 处置记录 ── */
.wo-detail__disposal {
  padding: 14px 0;
  border-bottom: 1px dashed var(--pc-border, #E5E7EB);
}
.wo-detail__disposal:last-child { border-bottom: none; }

.wo-detail__disposal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.wo-detail__disposal-index {
  font-size: 12px;
  font-weight: 600;
  color: var(--pc-primary, #1677ff);
  background: rgba(22,119,255,0.08);
  padding: 2px 8px;
  border-radius: 4px;
}
.wo-detail__disposal-time {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  font-family: monospace;
}
.wo-detail__disposal-desc {
  font-size: 13px;
  color: var(--pc-text-body, #374151);
  line-height: 1.6;
  margin: 0 0 6px;
}
.wo-detail__disposal-location {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  margin: 0 0 8px;
}
.wo-detail__disposal-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.wo-detail__disposal-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--pc-border, #E5E7EB);
  cursor: pointer;
}

/* ── 时间轴内容区（全局 admin-timeline 仅提供 item/dot 结构）── */
.admin-timeline-content {
  flex: 1;
  min-width: 0;
}
.wo-detail__log-desc {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ── 操作反馈浮动提示 ── */
.admin-action-msg--fixed {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
</style>
