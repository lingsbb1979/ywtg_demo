<template>
  <!--
    H5 建筑列表页 /h5/buildings
    外勤可查看全部 23 栋历史建筑风险状态，点击进入该建筑 IoT 实时指标页。
  -->
  <div class="h5-buildings h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- 搜索栏 -->
    <div class="h5-buildings__search">
      <input
        v-model="keyword"
        class="h5-buildings__search-input"
        type="search"
        placeholder="搜索建筑名称..."
        data-testid="h5-buildings-search"
      />
    </div>

    <!-- 风险快筛 -->
    <div class="h5-filter-tabs" style="padding: 0 12px 8px">
      <button
        v-for="f in RISK_FILTERS"
        :key="f.value"
        class="h5-filter-tab"
        :class="[{ 'h5-filter-tab--active': riskFilter === f.value }, f.cls]"
        @click="riskFilter = f.value"
      >
        <span v-if="f.dot" class="h5-filter-dot" :class="f.dot" />
        {{ f.label }}
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="filtered.length === 0" class="h5-buildings__empty">
      <span class="h5-empty-icon">🏚</span>
      <p>暂无建筑数据，请先在演示控制台重置数据</p>
    </div>

    <!-- 建筑列表 -->
    <ul v-else class="h5-buildings__list" data-testid="h5-buildings-list">
      <li
        v-for="b in filtered"
        :key="b.id"
        class="h5-buildings__item h5-list-item"
        :class="`h5-buildings__item--${riskClass(b.latestRiskLevel)}`"
        @click="$router.push(`/h5/building/${b.id}/metrics`)"
      >
        <span class="risk-dot" :class="`risk-dot--${riskClass(b.latestRiskLevel)}`" />
        <div class="h5-buildings__item-info">
          <span class="h5-buildings__item-name">{{ b.name }}</span>
          <span class="h5-buildings__item-code tabular-nums">{{ b.spaceCode }}</span>
        </div>
        <span class="badge h5-buildings__risk-badge"
          :class="`h5-risk-level--${riskClass(b.latestRiskLevel)}`">
          {{ b.latestRiskLevel ?? 'GREEN' }}
        </span>
        <span class="h5-buildings__arrow">›</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { listBuildings, type BuildingListItem } from "@/services/buildingService"

const keyword    = ref("")
const riskFilter = ref("ALL")
const buildings  = ref<BuildingListItem[]>([])

const RISK_FILTERS = [
  { label: "全部",   value: "ALL",    cls: "",                  dot: ""          },
  { label: "红色",   value: "RED",    cls: "h5-filter-tab--red",    dot: "dot--red"    },
  { label: "橙色",   value: "ORANGE", cls: "h5-filter-tab--orange", dot: "dot--orange" },
  { label: "黄色",   value: "YELLOW", cls: "h5-filter-tab--yellow", dot: "dot--yellow" },
  { label: "绿色",   value: "GREEN",  cls: "h5-filter-tab--green",  dot: "dot--green"  },
]

function riskClass(level: string | null): string {
  return (level ?? "green").toLowerCase()
}

const filtered = computed(() => {
  let list = buildings.value
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(b => b.name.toLowerCase().includes(kw) || b.spaceCode.toLowerCase().includes(kw))
  }
  if (riskFilter.value !== "ALL") {
    list = list.filter(b => (b.latestRiskLevel ?? "GREEN") === riskFilter.value)
  }
  // 风险等级排序：RED > ORANGE > YELLOW > GREEN
  const ORDER: Record<string, number> = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 }
  return [...list].sort((a, b) =>
    (ORDER[a.latestRiskLevel ?? "GREEN"] ?? 3) - (ORDER[b.latestRiskLevel ?? "GREEN"] ?? 3)
  )
})

onMounted(() => {
  buildings.value = listBuildings()
})
</script>

<style scoped>
.h5-buildings {
  padding-bottom: 20px;
}

/* 搜索栏 */
.h5-buildings__search {
  padding: 10px 12px 4px;
}
.h5-buildings__search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--h5-border, #E2E8F0);
  border-radius: 18px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}
.h5-buildings__search-input:focus {
  border-color: var(--h5-primary, #1677FF);
}

/* 空状态 */
.h5-buildings__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--h5-text-muted, #94A3B8);
  font-size: 14px;
  gap: 8px;
}
.h5-empty-icon { font-size: 48px; }

/* 列表 */
.h5-buildings__list {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.h5-buildings__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  border-left: 4px solid #E2E8F0;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: opacity 0.15s;
}
.h5-buildings__item:active { opacity: 0.7; }
.h5-buildings__item--red    { border-left-color: #F87171; }
.h5-buildings__item--orange { border-left-color: #FB923C; }
.h5-buildings__item--yellow { border-left-color: #FBBF24; }
.h5-buildings__item--green  { border-left-color: #34D399; }

.h5-buildings__item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.h5-buildings__item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-title, #1C2B4A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h5-buildings__item-code {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-buildings__risk-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 9999px;
  font-weight: 600;
  white-space: nowrap;
}
.h5-buildings__arrow {
  font-size: 18px;
  color: var(--h5-text-muted, #CBD5E1);
}

/* 筛选chips行 */
.h5-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px 10px;
}
.h5-filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid var(--h5-border, #E2E8F0);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--h5-text-muted, #64748B);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.h5-filter-tab:active { opacity: 0.75; }
/* 激活态：全部 */
.h5-filter-tab--active {
  background: var(--h5-primary, #1677FF);
  border-color: var(--h5-primary, #1677FF);
  color: #fff;
}
/* 各颜色激活态 */
.h5-filter-tab--red.h5-filter-tab--active    { background: #EF4444; border-color: #EF4444; color: #fff; }
.h5-filter-tab--orange.h5-filter-tab--active { background: #F97316; border-color: #F97316; color: #fff; }
.h5-filter-tab--yellow.h5-filter-tab--active { background: #EAB308; border-color: #EAB308; color: #fff; }
.h5-filter-tab--green.h5-filter-tab--active  { background: #22C55E; border-color: #22C55E; color: #fff; }

/* risk dot in filter */
.h5-filter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot--red    { background: #EF4444; }
.dot--orange { background: #F97316; }
.dot--yellow { background: #EAB308; }
.dot--green  { background: #22C55E; }

/* 风险色标 badge */
.h5-risk-level--red    { background: #FEE2E2; color: #DC2626; }
.h5-risk-level--orange { background: #FFEDD5; color: #EA580C; }
.h5-risk-level--yellow { background: #FEF9C3; color: #CA8A04; }
.h5-risk-level--green  { background: #DCFCE7; color: #16A34A; }

/* risk dot */
.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.risk-dot--red    { background: #F87171; }
.risk-dot--orange { background: #FB923C; }
.risk-dot--yellow { background: #FBBF24; }
.risk-dot--green  { background: #34D399; }

/* ===== 参考图风格覆盖：白蓝移动建筑列表 ===== */
.h5-buildings {
  background:
    radial-gradient(circle at 50% -40px, rgba(42,114,255,0.18), transparent 220px),
    linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%);
  min-height: 100vh;
}
.h5-buildings__search { padding: 12px 12px 8px; }
.h5-buildings__search-input {
  height: 42px;
  border-radius: 21px;
  border-color: #DDE9FB;
  color: #17305E;
  box-shadow: 0 10px 24px rgba(44,93,154,0.08);
}
.h5-filter-tabs {
  margin: 0 12px 8px;
  padding: 8px !important;
  border: 1px solid #DDE9FB;
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 10px 24px rgba(44,93,154,0.08);
}
.h5-filter-tab {
  height: 32px;
  border-radius: 16px;
  color: #5C7094;
  font-weight: 800;
}
.h5-buildings__list { padding: 4px 12px 0; gap: 12px; }
.h5-buildings__item {
  min-height: 66px;
  border: 1px solid #DDE9FB;
  border-left-width: 5px;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(44,93,154,0.10);
}
.h5-buildings__item-name { color: #092D81; font-weight: 900; }
.h5-buildings__item-code { color: #7D93B6; }
.h5-buildings__risk-badge { border-radius: 5px; font-weight: 900; }
</style>
