<template>
  <!--
    T15.93 管理端工单管理 /admin/work-orders
    ─────────────────────────────────────────────────────────────
    功能：可查看工单列表、详情、核查通过、退回重办
    ┌─────────────── 页面标题 ──────────────────────────────────┐
    │  工单管理           [搜索框]                              │
    ├─────── zone:work-order-table ────────────────────────────┤
    │  [全部][待接单][处理中][待核查][已销号]      共 N 条      │
    │  ┌───────┬───────┬──────┬──────┬──────┬──────────────┐   │
    │  │工单编号│建筑   │等级  │状态  │派单时间│  操作       │   │
    │  ├───────┼───────┼──────┼──────┼──────┼──────────────┤   │
    │  │WO-001 │永庆坊 │橙    │待核查│xx:xx │[核查通过][退回]│  │
    │  └───────┴───────┴──────┴──────┴──────┴──────────────┘   │
    └──────────────────────────────────────────────────────────┘

    数据来源：
      - workOrderService.listWorkOrders()  → work_order 表
      - workOrderService.verifyWorkOrder() → 核查通过 CHECKING→FINISHED
      - workOrderService.rejectWorkOrder() → 退回重办 CHECKING→PROCESSING
    UI 规范：
      - PC 管理端企业浅色主题
      - pc-card / admin-card / table-pc / admin-filter-tab
      - PC tokens：--pc-primary / --pc-bg-page / --pc-border
  -->

  <div class="admin-work-orders" style="color: var(--pc-text-body, #374151)">
    <!-- ===== 页面标题栏 ===== -->
    <div class="admin-page-header">
      <div class="admin-page-header__left">
        <h2 class="admin-page-title">工单管理</h2>
        <span class="admin-page-subtitle">工单列表 · 核查处置</span>
      </div>
      <div class="admin-page-header__right">
        <input
          v-model="keyword"
          class="input-pc admin-search-input"
          type="text"
          placeholder="搜索工单编号 / 建筑名称..."
        />
      </div>
    </div>

    <!-- ===== 工单表格卡片（zone:work-order-table）===== -->
    <div class="pc-card admin-card admin-table-wrap" data-zone="work-order-table">
      <!-- 工具栏 -->
      <div class="admin-table-toolbar">
        <div class="admin-table-toolbar__left">
          <h3 class="admin-table-toolbar__title">工单列表</h3>
          <span class="admin-table-toolbar__total">共 {{ filteredOrders.length }} 条</span>
        </div>
      </div>

      <!-- 状态筛选标签（admin-filter-tab）-->
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

      <!-- 工单表格（table-pc）-->
      <div class="admin-table-scroll">
        <table class="table-pc">
          <thead>
            <tr>
              <th>工单编号</th>
              <th>建筑名称</th>
              <th>告警等级</th>
              <th>工单状态</th>
              <th>派单时间</th>
              <th style="width: 160px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="admin-table-row"
            >
              <td class="admin-td-mono tabular-nums">{{ order.orderNo ?? order.orderCode ?? order.id }}</td>
              <td>{{ order.buildingName ?? `建筑 #${order.buildingId}` }}</td>
              <td>
                <span class="admin-badge" :class="levelBadgeClass(order.alarmLevel)">
                  {{ order.alarmLevel ?? '—' }}
                </span>
              </td>
              <td>
                <span class="admin-badge" :class="statusBadgeClass(order.status)">
                  {{ STATUS_LABEL[order.status ?? ''] ?? order.status ?? '—' }}
                </span>
              </td>
              <td class="admin-td-time tabular-nums">{{ order.dispatchTime?.slice(0, 16) ?? order.createTime?.slice(0, 16) ?? '—' }}</td>
              <td>
                <div class="admin-td-actions">
                  <!-- 工单详情链接 -->
                  <router-link
                    :to="`/admin/work-orders/${order.id}`"
                    class="btn-icon-sm"
                    title="查看详情"
                  >
                    ▦
                  </router-link>
                  <!-- 核查通过（仅待核查状态显示） -->
                  <button
                    v-if="order.status === 'CHECKING'"
                    class="btn-pc-primary btn-sm"
                    title="核查通过"
                    @click="doVerify(order.id)"
                  >
                    核查通过
                  </button>
                  <!-- 退回重办（仅待核查状态显示） -->
                  <button
                    v-if="order.status === 'CHECKING' && order.sourceType !== 'EMERGENCY'"
                    class="btn-pc-secondary btn-sm"
                    title="退回重办"
                    @click="doReject(order.id)"
                  >
                    退回
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div
          v-if="filteredOrders.length === 0"
          class="admin-empty"
          style="padding:32px;text-align:center;color:var(--pc-text-muted,#64748B)"
        >
          暂无符合条件的工单数据
        </div>
      </div>
    </div>

    <!-- 操作反馈消息 -->
    <div v-if="actionMsg" class="admin-action-msg admin-action-msg--fixed">{{ actionMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import {
  listWorkOrders,
  verifyWorkOrder,
  rejectWorkOrder,
  type WorkOrderListItem,
} from "@/services/workOrderService"

// ── 常量 ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待接单",
  PROCESSING: "处理中",
  CHECKING:   "待核查",
  FINISHED:   "已销号",
  CLOSED:     "已销号",
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const orders      = ref([] as WorkOrderListItem[])
const activeStatus = ref("ALL")
const keyword      = ref("")
const actionMsg    = ref("")

// ── 状态筛选标签 ──────────────────────────────────────────────────────────────

const statusTabs = computed(() => [
  { label: "全部",   value: "ALL",        count: orders.value.length },
  { label: "待接单", value: "PENDING",    count: orders.value.filter(o => o.status === "PENDING").length },
  { label: "处理中", value: "PROCESSING", count: orders.value.filter(o => o.status === "PROCESSING").length },
  { label: "待核查", value: "CHECKING",   count: orders.value.filter(o => o.status === "CHECKING").length },
  { label: "已销号", value: "FINISHED",   count: orders.value.filter(o => o.status === "FINISHED" || o.status === "CLOSED").length },
])

// ── 筛选计算属性 ──────────────────────────────────────────────────────────────

const filteredOrders = computed(() => {
  let list = orders.value
  if (activeStatus.value !== "ALL") {
    if (activeStatus.value === "FINISHED") {
      list = list.filter(o => o.status === "FINISHED" || o.status === "CLOSED")
    } else {
      list = list.filter(o => o.status === activeStatus.value)
    }
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(o =>
      (o.orderNo ?? "").toLowerCase().includes(kw) ||
      (o.orderCode ?? "").toLowerCase().includes(kw) ||
      (o.buildingName ?? "").toLowerCase().includes(kw)
    )
  }
  return list
})

// ── 样式辅助 ──────────────────────────────────────────────────────────────────

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

// ── 核查通过 ──────────────────────────────────────────────────────────────────

function doVerify(id: number) {
  const result = verifyWorkOrder(id)
  if (result.ok) {
    loadData()
    actionMsg.value = `✓ 工单 #${id} 核查通过，已销号`
  } else {
    actionMsg.value = `✗ ${result.error}`
  }
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

// ── 退回重办 ──────────────────────────────────────────────────────────────────

function doReject(id: number) {
  const result = rejectWorkOrder(id)
  if (result.ok) {
    loadData()
    actionMsg.value = `✓ 工单 #${id} 已退回重办`
  } else {
    actionMsg.value = `✗ ${result.error}`
  }
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function loadData() {
  orders.value = listWorkOrders()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ===== 页面根 ===== */
.admin-work-orders {
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

/* ===== 表格卡片 ===== */
.admin-table-wrap {
  padding: 16px;
  background: var(--pc-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--pc-border, #E2E8F0);
  box-shadow: var(--pc-shadow-sm, 0 1px 4px rgba(0,0,0,0.06));
}
.admin-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.admin-table-toolbar__left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.admin-table-toolbar__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  margin: 0;
}
.admin-table-toolbar__total {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}
.admin-table-filter-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.admin-table-scroll {
  overflow-x: auto;
}
.admin-td-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.btn-sm {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
}

/* ===== 操作反馈 ===== */
.admin-action-msg--fixed {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  box-shadow: var(--pc-shadow-sm, 0 1px 4px rgba(0,0,0,0.1));
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--pc-text-body, #374151);
  z-index: 100;
}
</style>
