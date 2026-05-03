<template>
  <!--
    T15.94 管理端督办管理 /admin/supervision（P1 简化版）
    ─────────────────────────────────────────────────────────────
    功能：可查看督办列表和填写回复
    ┌─────────────── 页面标题 ──────────────────────────────────┐
    │  督办管理                                                 │
    ├─────── zone:supervision-list ────────────────────────────┤
    │  ┌────────┬────────┬──────┬────────┬────────────────┐    │
    │  │督办编号│工单/建筑│状态  │触发时间│  操作          │    │
    │  ├────────┼────────┼──────┼────────┼────────────────┤    │
    │  │SO-001  │B001    │待处理│xx:xx  │[查看][填写回复] │    │
    │  └────────┴────────┴──────┴────────┴────────────────┘    │
    ├─────── zone:reply-form（选中督办后展示）──────────────────┤
    │  告警编号：SO-001         回复：[___________] [提交]     │
    └──────────────────────────────────────────────────────────┘

    数据来源：
      - getTable("supervision_order") → 读取督办列表
      - setTable("supervision_order", ...) → 写入回复
    UI 规范：
      - PC 管理端企业浅色主题
      - pc-card / admin-card / table-pc / admin-filter-tab
      - PC tokens：--pc-primary / --pc-bg-page / --pc-border
  -->

  <div class="admin-supervision" style="color: var(--pc-text-body, #374151)">
    <!-- ===== 页面标题栏 ===== -->
    <div class="admin-page-header">
      <div class="admin-page-header__left">
        <h2 class="admin-page-title">督办管理</h2>
        <span class="admin-page-subtitle">督办列表 · 回复处理</span>
      </div>
    </div>

    <!-- ===== 督办列表卡片（zone:supervision-list）===== -->
    <div class="pc-card admin-card admin-table-wrap" data-zone="supervision-list">
      <div class="admin-table-toolbar">
        <div class="admin-table-toolbar__left">
          <h3 class="admin-table-toolbar__title">督办列表</h3>
          <span class="admin-table-toolbar__total tabular-nums">共 {{ supervisions.length }} 条</span>
        </div>
      </div>

      <div class="admin-table-scroll">
        <table class="table-pc">
          <thead>
            <tr>
              <th>督办编号</th>
              <th>工单/建筑</th>
              <th>督办类型</th>
              <th>状态</th>
              <th>创建时间</th>
              <th style="width: 140px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in supervisions"
              :key="item.id"
              class="admin-table-row"
              :class="{ 'admin-table-row--selected': selectedId === item.id }"
            >
              <td class="admin-td-mono tabular-nums">{{ item.supervision_no ?? `SO-${String(item.id).padStart(4,'0')}` }}</td>
              <td>{{ item.building_name ?? item.order_no ?? `工单 #${item.order_id}` }}</td>
              <td>{{ item.supervision_type ?? '超时督办' }}</td>
              <td>
                <span class="admin-badge" :class="statusBadgeClass(item.status)">
                  {{ STATUS_LABEL[item.status ?? ''] ?? item.status ?? '—' }}
                </span>
              </td>
              <td class="admin-td-time tabular-nums">{{ (item.create_time ?? '').slice(0, 16) || '—' }}</td>
              <td>
                <div class="admin-td-actions">
                  <button
                    class="btn-icon-sm"
                    title="填写回复"
                    :disabled="item.status === 'CLOSED'"
                    @click="openReply(item)"
                  >
                    回复
                  </button>
                  <button
                    v-if="item.status === 'REPLIED'"
                    class="btn-icon-sm btn-icon-sm--success"
                    title="办结督办"
                    @click="closeSupervision(item)"
                  >
                    办结
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="supervisions.length === 0"
          class="admin-empty"
          style="padding:32px;text-align:center;color:var(--pc-text-muted,#64748B)"
        >
          暂无督办记录
        </div>
      </div>
    </div>

    <!-- ===== 回复表单卡片（zone:reply-form）===== -->
    <div
      v-if="selectedItem"
      class="pc-card admin-card admin-reply-form"
      data-zone="reply-form"
    >
      <div class="admin-table-toolbar">
        <div class="admin-table-toolbar__left">
          <h3 class="admin-table-toolbar__title">填写督办回复</h3>
          <span class="admin-table-toolbar__total">
            {{ selectedItem.supervision_no ?? `SO-${String(selectedItem.id).padStart(4,'0')}` }}
          </span>
        </div>
      </div>
      <div class="admin-reply-form__body">
        <textarea
          v-model="replyContent"
          class="admin-reply-textarea"
          rows="4"
          placeholder="请填写督办回复内容..."
        ></textarea>
        <div class="admin-reply-form__actions">
          <button class="btn-pc-secondary" @click="cancelReply">取消</button>
          <button
            class="btn-pc-primary"
            :disabled="!replyContent.trim()"
            @click="submitReply"
          >
            提交回复
          </button>
        </div>
      </div>
      <!-- 操作反馈 -->
      <div v-if="actionMsg" class="admin-action-msg" style="margin-top:8px;color:var(--pc-primary,#1B6FE8)">{{ actionMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getTable, setTable } from "@/services/sqliteMirrorRepository"

// ── 督办记录类型 ──────────────────────────────────────────────────────────────

interface SupervisionOrder {
  id:               number
  supervision_no:   string | null
  order_id:         number | null
  order_no:         string | null
  building_id:      number | null
  building_name:    string | null
  supervision_type: string | null
  reason:           string | null
  status:           string | null
  handler_id:       number | null
  handler_name:     string | null
  reply:            string | null
  reply_time:       string | null
  create_time:      string | null
  update_time:      string | null
}

// ── 常量 ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "待处理",
  ISSUED:    "待处理",
  REPLIED:   "已回复",
  CLOSED:    "已关闭",
  ESCALATED: "已升级",
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const supervisions  = ref([] as SupervisionOrder[])
const selectedId    = ref(null as number | null)
const selectedItem  = ref(null as SupervisionOrder | null)
const replyContent  = ref("")
const actionMsg     = ref("")

// ── 样式辅助 ──────────────────────────────────────────────────────────────────

function statusBadgeClass(status: string | null) {
  const map: Record<string, string> = {
    PENDING:   "admin-badge--danger",
    REPLIED:   "admin-badge--success",
    CLOSED:    "admin-badge--success",
    ESCALATED: "admin-badge--warning",
  }
  return map[status ?? ""] ?? ""
}

// ── 回复操作 ──────────────────────────────────────────────────────────────────

function openReply(item: SupervisionOrder) {
  selectedId.value   = item.id
  selectedItem.value = item
  replyContent.value = item.reply ?? ""
  actionMsg.value    = ""
}

function cancelReply() {
  selectedId.value   = null
  selectedItem.value = null
  replyContent.value = ""
  actionMsg.value    = ""
}

function submitReply() {
  if (!selectedItem.value || !replyContent.value.trim()) return
  const id  = selectedItem.value.id
  const now = new Date().toISOString().replace("T", " ").slice(0, 19)

  const rows = getTable<SupervisionOrder>("supervision_order")
  const idx  = rows.findIndex((r) => r.id === id)
  if (idx !== -1) {
    rows[idx] = {
      ...rows[idx],
      reply:       replyContent.value.trim(),
      reply_time:  now,
      status:      "REPLIED",
      update_time: now,
    }
    setTable("supervision_order", rows)
    actionMsg.value = `✓ 督办 #${id} 回复已提交`
    loadData()
    setTimeout(() => {
      cancelReply()
    }, 1500)
  }
}

function closeSupervision(item: SupervisionOrder) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19)
  const rows = getTable<SupervisionOrder>("supervision_order")
  const idx  = rows.findIndex((r) => r.id === item.id)
  if (idx !== -1) {
    rows[idx] = { ...rows[idx], status: "CLOSED", update_time: now }
    setTable("supervision_order", rows)
    loadData()
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function loadData() {
  supervisions.value = getTable<SupervisionOrder>("supervision_order")
    .slice()
    .sort((a, b) => {
      const ta = a.create_time ?? ""
      const tb = b.create_time ?? ""
      return ta > tb ? -1 : ta < tb ? 1 : 0
    })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ===== 页面根 ===== */
.admin-supervision {
  background: var(--pc-bg-page, #F0F4F9);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 页面标题栏 ===== */
.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/* ===== 卡片通用 ===== */
.admin-table-wrap,
.admin-reply-form {
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
.admin-table-scroll {
  overflow-x: auto;
}
.admin-td-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* ===== 回复表单 ===== */
.admin-reply-form__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.admin-reply-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  color: var(--pc-text-body, #374151);
  background: var(--pc-bg-page, #F0F4F9);
}
.admin-reply-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
