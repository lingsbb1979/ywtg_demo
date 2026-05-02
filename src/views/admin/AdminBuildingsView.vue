<template>
  <!--
    T15.88 管理端建筑列表 /admin/buildings
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌──────────── 页面标题：建筑档案 / 历史建筑列表 ─────────────┐
    │  🏚 历史建筑列表       共 23 栋                           │
    ├──────────── zone:toolbar ──────────────────────────────────┤
    │  [全部][红色][橙色][黄色][绿色]  [搜索建筑名称...]         │
    ├──────────── zone:buildings ─────────────────────────────────┤
    │  ┌─── 建筑卡片 ────────────────────────────────────────┐  │
    │  │  ● ORANGE  B003 杏林路民国砖楼                       │  │
    │  │  佳木斯市向阳区杏林路 3 号                           │  │
    │  │  [档案 ✓]  [最新风险：橙色]  [查看详情 →]            │  │
    │  └────────────────────────────────────────────────────┘  │
    │  ┌── 建筑卡片 ──────────────────────────────────────────┐  │
    │  │  ● GREEN  B001 历史建筑 A ...                        │  │
    │  └────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────┘

    数据来源：buildingService.listBuildings(query)
    UI 规范：沿用 PC 管理端企业浅色主题
      - pc-card / admin-card 卡片容器
      - --pc-primary / --pc-bg-page / --pc-border tokens
      - admin-filter-tab 筛选标签
      - risk-dot 风险颜色点
  -->

  <div class="admin-buildings" style="background:var(--pc-bg-page,#F0F4F9)">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">🏚 历史建筑档案</h2>
      <span class="admin-page-subtitle">建筑列表管理 · 共 {{ filteredBuildings.length }} 栋</span>
    </div>

    <!-- ① 筛选工具栏（zone:toolbar）-->
    <div class="pc-card admin-card admin-buildings-toolbar" data-zone="toolbar">
      <!-- 风险等级筛选标签 -->
      <div class="admin-table-filter-tabs">
        <button
          v-for="tab in levelTabs"
          :key="tab.value"
          class="admin-filter-tab"
          :class="{ 'admin-filter-tab--active': activeLevel === tab.value }"
          @click="activeLevel = tab.value"
        >
          <span
            v-if="tab.value !== 'ALL'"
            class="risk-dot"
            :class="`risk-dot--${tab.value.toLowerCase()}`"
            style="display:inline-block;margin-right:4px"
          />
          {{ tab.label }}
          <span class="admin-filter-tab__count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="admin-toolbar-right">
        <input
          v-model="keyword"
          class="input-pc admin-search-input"
          type="text"
          placeholder="搜索建筑名称 / 编码..."
        />
        <span class="admin-toolbar-total">共 {{ filteredBuildings.length }} 栋</span>
      </div>
    </div>

    <!-- ② 建筑卡片列表（zone:buildings）-->
    <div class="admin-buildings-list" data-zone="buildings">
      <!-- 空状态 -->
      <div v-if="filteredBuildings.length === 0" class="admin-empty">
        <span class="admin-empty__icon">🔍</span>
        <span>暂无建筑数据，请先重置演示数据或调整筛选条件</span>
        <router-link class="btn-pc-secondary btn-sm" to="/admin/demo-console">
          前往演示控制台重置数据
        </router-link>
      </div>

      <!-- 建筑网格 -->
      <div class="admin-building-grid">
        <div
          v-for="building in filteredBuildings"
          :key="building.id"
          class="admin-building-card pc-card"
          :class="buildingCardClass(building.latestRiskLevel)"
          @click="goDetail(building.id)"
        >
          <!-- 卡片头部：风险点 + 名称 + 编码 -->
          <div class="admin-building-card__header">
            <span class="risk-dot" :class="riskDotClass(building.latestRiskLevel)" />
            <div class="admin-building-card__name-wrap">
              <span class="admin-building-card__name">{{ building.name }}</span>
              <span class="admin-building-card__code tabular-nums">{{ building.spaceCode }}</span>
            </div>
            <span class="badge" :class="riskBadgeClass(building.latestRiskLevel)">
              {{ building.latestRiskLevel ?? 'GREEN' }}
            </span>
          </div>

          <!-- 地址 -->
          <div class="admin-building-card__address">
            {{ building.addressDesc ?? '暂无地址信息' }}
          </div>

          <!-- 卡片底部：档案状态 + 风险等级 + 查看详情 -->
          <div class="admin-building-card__footer">
            <span class="admin-building-card__archive" :class="building.archiveStatus !== null ? 'text-success' : 'text-muted'">
              {{ building.archiveStatus !== null ? '档案 ✓' : '暂无档案' }}
            </span>
            <span class="admin-building-card__risk-label">
              最新风险：{{ RISK_LABEL[building.latestRiskLevel ?? 'GREEN'] ?? '正常' }}
            </span>
            <router-link
              class="admin-building-card__detail-link"
              :to="`/admin/buildings/${building.id}`"
              @click.stop
            >
              查看详情 →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { listBuildings, type BuildingListItem } from "@/services/buildingService"

// ── 路由 ──────────────────────────────────────────────────────────────────────

const router = useRouter()

// ── 常量 ──────────────────────────────────────────────────────────────────────

const RISK_LABEL: Record<string, string> = {
  RED:    "危险",
  ORANGE: "警告",
  YELLOW: "关注",
  GREEN:  "正常",
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const buildings   = ref([] as BuildingListItem[])
const activeLevel = ref("ALL")
const keyword     = ref("")

// ── 计算属性：筛选 ─────────────────────────────────────────────────────────────

const filteredBuildings = computed(() => {
  let list = buildings.value
  if (activeLevel.value !== "ALL") {
    list = list.filter((b) => (b.latestRiskLevel ?? "GREEN") === activeLevel.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((b) =>
      b.name.toLowerCase().includes(kw) ||
      b.spaceCode.toLowerCase().includes(kw) ||
      (b.addressDesc ?? "").toLowerCase().includes(kw)
    )
  }
  return list
})

// ── 计算属性：筛选标签 ─────────────────────────────────────────────────────────

const levelTabs = computed(() => [
  { label: "全部",   value: "ALL",    count: buildings.value.length },
  { label: "红色危险", value: "RED",    count: buildings.value.filter((b) => b.latestRiskLevel === "RED").length },
  { label: "橙色警告", value: "ORANGE", count: buildings.value.filter((b) => b.latestRiskLevel === "ORANGE").length },
  { label: "黄色关注", value: "YELLOW", count: buildings.value.filter((b) => b.latestRiskLevel === "YELLOW").length },
  { label: "绿色正常", value: "GREEN",  count: buildings.value.filter((b) => (b.latestRiskLevel ?? "GREEN") === "GREEN").length },
])

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function riskDotClass(level: string | null): string {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? "GREEN"] ?? "risk-dot--green"
}

function riskBadgeClass(level: string | null): string {
  const map: Record<string, string> = {
    RED: "badge--danger", ORANGE: "badge--warning",
    YELLOW: "badge--info", GREEN: "badge--success",
  }
  return map[level ?? "GREEN"] ?? "badge--success"
}

function buildingCardClass(level: string | null): string {
  if (level === "RED")    return "admin-building-card--red"
  if (level === "ORANGE") return "admin-building-card--orange"
  if (level === "YELLOW") return "admin-building-card--yellow"
  return ""
}

function goDetail(id: number) {
  router.push(`/admin/buildings/${id}`)
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

onMounted(() => {
  buildings.value = listBuildings()
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-buildings {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  background: var(--pc-bg-page, #F0F4F9);
}

/* 页面标题 */
.admin-page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(to right, var(--pc-primary, #1B6FE8), transparent 60%);
  background-position: bottom;
  background-size: 100% 2px;
  background-repeat: no-repeat;
}
.admin-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
  margin: 0;
}
.admin-page-subtitle {
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== pc-card / admin-card ===== */
.pc-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}
.admin-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
  overflow: hidden;
}

/* ===== 筛选工具栏 ===== */
.admin-buildings-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  flex-wrap: wrap;
}
.admin-table-filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}
.admin-filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  background: #fff;
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  cursor: pointer;
  transition: all var(--duration-micro, 150ms) ease;
  white-space: nowrap;
}
.admin-filter-tab:hover { border-color: var(--pc-primary, #1B6FE8); color: var(--pc-primary, #1B6FE8); }
.admin-filter-tab--active {
  background: var(--pc-primary, #1B6FE8);
  border-color: var(--pc-primary, #1B6FE8);
  color: #fff;
  font-weight: 500;
}
.admin-filter-tab--active .admin-filter-tab__count { background: rgba(255,255,255,0.25); color: #fff; }
.admin-filter-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radius-full, 9999px);
  background: var(--pc-bg-page, #F0F4F9);
  font-size: 11px;
  font-weight: 600;
  color: var(--pc-text-muted, #64748B);
}
.admin-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.input-pc {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  background: #fff;
  color: var(--pc-text-body, #374151);
  outline: none;
  width: 220px;
  transition: border-color var(--duration-micro, 150ms) ease;
}
.input-pc:focus { border-color: var(--pc-primary, #1B6FE8); box-shadow: 0 0 0 3px rgba(27,111,232,0.08); }
.admin-search-input { flex-shrink: 0; }
.admin-toolbar-total {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  white-space: nowrap;
}

/* ===== 建筑列表容器 ===== */
.admin-buildings-list { display: flex; flex-direction: column; gap: 0; }

.admin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: var(--pc-text-muted, #94A3B8);
  text-align: center;
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
}
.admin-empty__icon { font-size: 40px; }

/* ===== 建筑网格 ===== */
.admin-building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

/* ===== 建筑卡片 ===== */
.admin-building-card {
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow var(--duration-micro, 150ms) ease, transform var(--duration-micro, 150ms) ease;
}
.admin-building-card:hover {
  box-shadow: var(--pc-shadow-md, 0 4px 12px rgba(0,0,0,0.10));
  transform: translateY(-1px);
}
.admin-building-card--red    { border-left: 4px solid var(--risk-red,    #FF4444); }
.admin-building-card--orange { border-left: 4px solid var(--risk-orange, #FF8A3D); }
.admin-building-card--yellow { border-left: 4px solid var(--risk-yellow, #FACC15); }

/* 卡片头部 */
.admin-building-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-building-card__name-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.admin-building-card__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.admin-building-card__code {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}

/* 地址 */
.admin-building-card__address {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 卡片底部 */
.admin-building-card__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--pc-border, #E2E8F0);
  font-size: 12px;
}
.admin-building-card__archive { font-weight: 500; }
.admin-building-card__risk-label {
  flex: 1;
  color: var(--pc-text-muted, #64748B);
}
.admin-building-card__detail-link {
  color: var(--pc-primary, #1B6FE8);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}
.admin-building-card__detail-link:hover { text-decoration: underline; }

/* ===== risk-dot ===== */
.risk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red,    #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FACC15); }
.risk-dot--green  { background: var(--risk-green,  #10B981); }

/* ===== badge ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.badge--danger  { background: #FEE2E2; color: #EF4444; }
.badge--warning { background: #FEF3C7; color: #D97706; }
.badge--info    { background: #EDE9FE; color: #8B5CF6; }
.badge--success { background: #D1FAE5; color: #10B981; }

/* ===== 按钮 ===== */
.btn-pc-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: #fff;
  color: var(--pc-primary, #1B6FE8);
  border: 1px solid var(--pc-primary, #1B6FE8);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* ===== 颜色辅助 ===== */
.text-success { color: var(--color-success, #10B981); }
.text-muted   { color: var(--pc-text-muted, #94A3B8); }
</style>
