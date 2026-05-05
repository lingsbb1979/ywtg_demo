<template>
  <!--
    T15.71 低保真布局定型（wireframe）：/screen/home 版面关系
    ┌──────────── header: zone:kpi ────────────────────────────────────┐
    │  监测建筑 │ 活跃告警 │ 开放隐患 │ 工单闭环率                      │
    ├──────────────────────────────────────────────────────────────────┤
    │ zone:hazard-list │ zone:map          │ zone:workorder-board [上]  │
    │ 重点隐患清单      │ 佳木斯历史建筑     │ 工单进度看板               │
    │ 左侧面板 260px   │ 分布图 (中央弹性)  ├────────────────────────────┤
    │                  │                   │ zone:alarm-entry [下]      │
    │                  │                   │ 实时告警入口                │
    └──────────────────┴───────────────────┴────────────────────────────┘
  -->
  <div class="screen-root screen-bg">
    <!-- 高德地图全屏背景层（z-index: 0，固定定位，全部 UI 面板悬浮其上） -->
    <div
      ref="amapContainerRef"
      class="screen-map__amap-layer screen-map__amap-bg"
      :class="{ 'screen-map__amap-layer--hidden': mapError }"
      aria-label="高德地图 — 佳木斯历史建筑分布"
    />
    <!-- ① 顶部标题栏（screen-header） -->
    <header class="screen-header screen-command-header" data-testid="screen-header">
      <span class="screen-header__kpi-anchor" data-zone="kpi" aria-hidden="true" />
      <div class="screen-header__left screen-header__side screen-header__side--left">
        <span class="screen-header__logo-text">
          <img :src="screenIcons.shield" alt="" />
        </span>
        <div class="screen-header__clock">
          <span class="screen-header__time">{{ currentTime }}</span>
          <span class="screen-header__weather">多云 22℃</span>
        </div>
      </div>
      <div class="screen-header__center">
        <h1 class="screen-header__title">国家建筑安全监测与应急指挥平台</h1>
        <div class="screen-header__nav" aria-hidden="true">
          <span>全域感知</span>
          <span>实时互联</span>
          <span>智能预警</span>
          <span>高效处置</span>
        </div>
      </div>
      <div class="screen-header__right screen-header__side screen-header__side--right">
        <span class="screen-header__location">北京市 · 北斗卫星定位：正常</span>
        <span class="screen-header__user">管理员</span>
      </div>
    </header>

    <section class="screen-kpi-ribbon screen-kpi" data-testid="screen-kpi" data-zone="kpi">
      <div class="screen-kpi-item">
        <img class="screen-kpi-item__icon" :src="screenIcons.building" alt="" />
        <span class="screen-kpi-item__label">监测建筑总数</span>
        <span class="screen-kpi-item__value tabular-nums">{{ kpi.totalBuildings }}</span>
        <span class="screen-kpi-item__unit">栋</span>
      </div>
      <div class="screen-kpi-divider" />
      <div class="screen-kpi-item">
        <img class="screen-kpi-item__icon" :src="screenIcons.point" alt="" />
        <span class="screen-kpi-item__label">实时监测点位</span>
        <span class="screen-kpi-item__value tabular-nums">{{ kpi.monitoringPoints }}</span>
        <span class="screen-kpi-item__unit">个</span>
      </div>
      <div class="screen-kpi-divider" />
      <div class="screen-kpi-item">
        <img class="screen-kpi-item__icon" :src="screenIcons.warning" alt="" />
        <span class="screen-kpi-item__label">当前风险建筑</span>
        <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--warn">{{ kpi.openHazards }}</span>
        <span class="screen-kpi-item__unit">栋</span>
      </div>
      <div class="screen-kpi-divider" />
      <div class="screen-kpi-item screen-kpi-item--level">
        <img class="screen-kpi-item__icon" :src="screenIcons.siren" alt="" />
        <span class="screen-kpi-item__label">红色/活跃告警</span>
        <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--red">{{ kpi.activeAlarms }}</span>
        <span class="screen-kpi-item__unit">起</span>
      </div>
      <div class="screen-kpi-divider" />
      <div class="screen-kpi-item">
        <img class="screen-kpi-item__icon" :src="screenIcons.workOrder" alt="" />
        <span class="screen-kpi-item__label">工单闭环率</span>
        <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">{{ kpi.closeRate }}%</span>
        <span class="screen-kpi-item__unit">今日</span>
      </div>
      <div class="screen-kpi-divider" />
      <div class="screen-kpi-item">
        <img class="screen-kpi-item__icon" :src="screenIcons.activity" alt="" />
        <span class="screen-kpi-item__label">应急处置进度</span>
        <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">62%</span>
        <span class="screen-kpi-item__unit">整体进度</span>
      </div>
    </section>

    <!-- ② 主内容区：左面板 + 地图 + 右面板 -->
    <!-- screen-situation：最高优先级区域（T15.70 三端信息层级：大屏突出房屋隐患和态势） -->
    <main class="screen-main screen-situation">
      <!-- 左侧隐患清单（screen-hazard-list）data-priority="1"：P1 最高优先信息 -->
      <aside class="screen-panel screen-panel--left screen-glass-card" data-testid="screen-hazard-list" data-priority="1" data-zone="hazard-list">
        <div class="screen-side-section screen-side-section--ring">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar" />
            风险等级分布
            <span class="screen-panel__badge">{{ kpi.totalBuildings }}</span>
          </div>
          <div class="screen-ring-block">
            <div ref="riskChartRef" class="screen-ring-echart" />
            <div class="screen-ring-legend">
              <span v-for="item in riskDistribution" :key="item.key" class="screen-ring-legend__item">
                <i :class="`risk-dot--${item.key}`" />
                <em>{{ item.label }}</em>
                <strong class="tabular-nums">{{ item.value }}</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="screen-side-section screen-side-section--ring">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar" />
            隐患类型分布
          </div>
          <div ref="hazardTypeChartRef" class="screen-hazard-type-echart" />
        </div>

        <div class="screen-side-section screen-trend-card screen-side-section--trend">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar" />
            工单趋势分析
          </div>
          <div class="screen-trend-chart" aria-label="最近七日工单趋势">
            <div ref="trendChartRef" class="screen-trend-echart" />
          </div>
          <div class="screen-trend-labels">
            <span v-for="item in trendSeries" :key="item.label">{{ item.label }}</span>
          </div>
        </div>

        <div class="screen-side-section screen-resource-card">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar screen-panel__title-bar--iot" />
            资源统计
          </div>
          <div class="screen-resource-grid">
            <div v-for="item in resourceStats" :key="item.label" class="screen-resource-item">
              <span><img :src="item.icon" alt="" /></span>
              <strong class="tabular-nums">{{ item.value }}</strong>
              <em>{{ item.label }}</em>
            </div>
          </div>
        </div>

        <div class="screen-side-section screen-side-section--status">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar screen-panel__title-bar--iot" />
            系统运行状态
          </div>
          <div class="screen-status-strip">
            <div v-for="item in systemStats" :key="item.label" class="screen-status-item">
              <span><img :src="item.icon" alt="" /></span>
              <strong class="tabular-nums">{{ item.value }}</strong>
              <em>{{ item.label }}</em>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央地图区（screen-map） -->
      <section class="screen-map" data-testid="screen-map" data-zone="map">
        <div class="screen-map__container screen-glass-card">
          <div class="screen-map__title-bar">
            <span class="screen-panel__title-bar" />
            佳木斯市历史建筑分布图
            <span class="screen-map__title-sub">高德地图 · 佳木斯市区</span>
            <span
              v-if="mapError"
              class="screen-map__fallback-badge"
              data-testid="map-fallback-toggle"
              title="地图加载失败，已切换到建筑列表模式"
            >列表模式</span>
            <span v-if="!mapError && amapLoaded" class="screen-map__live-badge">实时</span>
          </div>

          <!-- 地图容器已移至根层级（全屏固定定位），此处不再渲染 -->

          <!-- 地图 Key 未配置提示（仅在 !mapError 但地图无法初始化时显示） -->
          <div v-if="!mapError && !amapLoaded" class="screen-map__loading">
            <span class="screen-map__loading-dot" />
            正在加载高德地图…
          </div>

          <!-- 地图失败降级：建筑列表模式 -->
          <div v-show="mapError" class="screen-map__fallback-list">
            <div
              v-for="(pt, index) in mapPoints"
              :key="pt.id"
              class="screen-map__point"
              :class="[`screen-map__point--${pt.color}`, selectedPoint?.id === pt.id ? 'screen-map__point--selected' : '']"
              :style="mapPointStyle(pt, index)"
              :title="`${pt.name}：${pt.summary}`"
              @click="selectedPoint = pt"
            >
              <span class="screen-map__point-dot risk-dot" :class="`risk-dot--${pt.color}`" />
              <span class="screen-map__point-name">{{ pt.name }}</span>
              <span class="screen-map__point-level">{{ pt.summary }}</span>
            </div>
          </div>
          <div v-if="mapPoints.length === 0 && mapError" class="screen-map__empty">
            暂无建筑点位数据，请先初始化演示数据
          </div>

          <!-- T15.72 建筑详情弹窗（高保真：风险色 + 弹窗样式） -->
          <Transition name="screen-popup">
            <div
              v-if="selectedPoint"
              class="screen-building-popup screen-glass-card"
              :class="`popup-risk--${selectedPoint.color}`"
              data-testid="screen-building-popup"
            >
              <div class="screen-popup-header">
                <span class="screen-popup-building-name">{{ selectedPoint.name }}</span>
                <button class="screen-popup-close" @click="selectedPoint = null">×</button>
              </div>
              <div
                class="screen-popup-risk-badge badge-screen"
                :class="`badge-screen--${selectedPoint.color}`"
              >
                风险等级：{{ selectedPoint.riskLevel ?? selectedPoint.color }}
              </div>
              <div class="screen-popup-summary">
                {{ selectedPoint.summary ?? `开放隐患 ${selectedPoint.openCount ?? 0} 处` }}
              </div>
              <router-link class="screen-popup-link" to="/screen/alarm-dispatch">查看详情 →</router-link>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 右侧面板：工单进度 [上] + 告警入口 [下] -->
      <aside class="screen-panel screen-panel--right screen-glass-card" data-testid="screen-workorder-board">
        <!-- 工单进度看板区域 (data-zone="workorder-board") -->
        <div data-zone="workorder-board">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar" />
            工单进度看板
          </div>
          <div class="screen-board">
            <div class="screen-board-item screen-board-item--pending">
              <span class="board-icon board-icon--pending"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/></svg></span>
              <span class="screen-board-item__count tabular-nums">{{ board.pending }}</span>
              <span class="screen-board-item__label">待处理</span>
            </div>
            <div class="screen-board-item screen-board-item--processing">
              <span class="board-icon board-icon--processing"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></span>
              <span class="screen-board-item__count tabular-nums">{{ board.processing }}</span>
              <span class="screen-board-item__label">处理中</span>
            </div>
            <div class="screen-board-item screen-board-item--checking">
              <span class="board-icon board-icon--checking"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
              <span class="screen-board-item__count tabular-nums">{{ board.checking }}</span>
              <span class="screen-board-item__label">待核查</span>
            </div>
            <div class="screen-board-item screen-board-item--finished">
              <span class="board-icon board-icon--finished"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
              <span class="screen-board-item__count tabular-nums">{{ board.finished }}</span>
              <span class="screen-board-item__label">已销号</span>
            </div>
          </div>
          <div v-if="board.overdueCount > 0" class="screen-board-overdue">
            <span class="screen-board-overdue__dot" />
            逾期工单：<strong>{{ board.overdueCount }}</strong> 条，请及时督办
          </div>
          <div class="screen-panel__divider" />
          <div class="screen-quick-links">
            <router-link class="screen-quick-link" to="/screen/work-orders">工单中心</router-link>
            <router-link class="screen-quick-link screen-quick-link--emergency" to="/screen/emergency" data-testid="emergency-link">应急处置</router-link>
            <router-link class="screen-quick-link screen-quick-link--supervision" to="/screen/performance">绩效督办</router-link>
            <router-link class="screen-quick-link" to="/admin/demo-console">控制台</router-link>
          </div>
        </div>

        <!-- 告警入口区域 (data-zone="alarm-entry") -->
        <div class="screen-alarm-entry" data-zone="alarm-entry" data-testid="screen-alarm-entry">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar screen-panel__title-bar--warn" />
            实时告警入口
            <span
              class="screen-panel__badge screen-panel__badge--warn"
              :class="kpi.activeAlarms > 0 ? 'screen-panel__badge--active' : ''"
            >{{ kpi.activeAlarms }}</span>
          </div>
          <ul class="screen-alarm-entry__list">
            <li
              v-for="h in alarmEntryItems"
              :key="h.id"
              class="screen-alarm-entry__item"
            >
              <span class="screen-alarm-entry__dot risk-dot" :class="`risk-dot--${h.alarmLevel.toLowerCase()}`" />
              <span class="screen-alarm-entry__title">{{ h.alarmTitle ?? h.alarmId }}</span>
              <span
                class="screen-alarm-entry__level badge-screen"
                :class="`badge-screen--${h.alarmLevel.toLowerCase()}`"
              >{{ h.alarmLevel }}</span>
            </li>
            <li v-if="alarmEntryItems.length === 0" class="screen-alarm-entry__empty">暂无活跃告警</li>
          </ul>
          <router-link
            class="screen-alarm-entry__link"
            to="/screen/alarm-dispatch"
            data-testid="screen-alarm-entry-link"
          >
            查看全部告警 →
          </router-link>
        </div>

        <!-- IoT 实时数据区域（选中建筑时显示）(data-zone="iot-panel") -->
        <div class="screen-iot-panel" data-zone="iot-panel">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar screen-panel__title-bar--iot" />
            选中建筑实时数据
            <span v-if="selectedPoint" class="screen-iot-panel__name">{{ selectedPoint.name }}</span>
          </div>
          <div v-if="selectedPoint && selectedIotSummary" class="screen-iot-points">
            <div
              v-for="pt in selectedIotSummary.points"
              :key="pt.pointId"
              class="screen-iot-point"
            >
              <span class="screen-iot-point__label">{{ pt.factorName }}</span>
              <span
                class="screen-iot-point__value tabular-nums"
                :class="screenValueClass(pt)"
              >
                {{ pt.latestValue !== null ? pt.latestValue.toFixed(2) : '--' }}
              </span>
              <span class="screen-iot-point__unit">{{ pt.unit }}</span>
              <!-- 最近10条迷你条形 -->
              <div class="screen-iot-sparkline">
                <span
                  v-for="(r, i) in pt.recent10"
                  :key="i"
                  class="screen-iot-sparkline__bar"
                  :class="screenDotClass(pt, r.value)"
                  :title="`${r.ts}: ${r.value}`"
                />
              </div>
            </div>
          </div>
          <div v-else-if="selectedPoint" class="screen-iot-empty">暂无遥测数据</div>
          <div v-else class="screen-iot-empty">点击地图建筑点位查看实时数据</div>
        </div>
      </aside>
    </main>

    <!-- ③ 底部应急处置时间轴 -->
    <footer class="screen-footer screen-glass-card">
      <span class="screen-footer__status-text">系统状态：正常运行</span>
      <div class="screen-command-timeline">
        <div class="screen-command-node screen-command-node--red">
          <span class="screen-command-node__icon"><img :src="screenIcons.warning" alt="" /></span>
          <strong>预警触发</strong>
          <small>系统自动预警</small>
        </div>
        <div class="screen-command-node screen-command-node--red">
          <span class="screen-command-node__icon"><img :src="screenIcons.check" alt="" /></span>
          <strong>事件确认</strong>
          <small>值班员确认事件</small>
        </div>
        <div class="screen-command-node screen-command-node--orange">
          <span class="screen-command-node__icon"><img :src="screenIcons.fileCheck" alt="" /></span>
          <strong>启动预案</strong>
          <small>II级预案启动</small>
        </div>
        <div class="screen-command-node screen-command-node--orange">
          <span class="screen-command-node__icon"><img :src="screenIcons.team" alt="" /></span>
          <strong>人员疏散</strong>
          <small>疏散 856 人</small>
        </div>
        <div class="screen-command-node screen-command-node--blue">
          <span class="screen-command-node__icon"><img :src="screenIcons.searchCheck" alt="" /></span>
          <strong>专家会商</strong>
          <small>专家赶赴中</small>
        </div>
        <div class="screen-command-node screen-command-node--blue">
          <span class="screen-command-node__icon"><img :src="screenIcons.hardHat" alt="" /></span>
          <strong>处置加固</strong>
          <small>加固方案制定</small>
        </div>
      </div>
    </footer>

    <ScreenEmergencyFloatBtn />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue"
import ScreenEmergencyFloatBtn from "./ScreenEmergencyFloatBtn.vue"
import { LineChart, PieChart, BarChart } from "echarts/charts"
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components"
import { init, use, type ECharts } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import {
  selectScreenKpi,
  selectMapPoints,
  selectHazardList,
  selectWorkOrderBoard,
  type ScreenKpi,
  type MapPoint,
  type HazardListItem,
  type WorkOrderBoard,
} from "@/services/screenKpiService"
import { getTable } from "@/services/sqliteMirrorRepository"
import { getBuildingIotSummary, type BuildingIotSummary } from "@/services/iotDemoService"

use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// ── 高德地图 Key 配置 ──────────────────────────────────────────────────────────
// 优先级：管理控制台 localStorage 设置 > .env.local 环境变量
// 注册地址：https://lbs.amap.com（创建「Web端(JS API)」类型 Key）
const AMAP_KEY           = (localStorage.getItem("AMAP_KEY")           || import.meta.env.VITE_AMAP_KEY           || "") as string
const AMAP_SECURITY_CODE = (localStorage.getItem("AMAP_SECURITY_CODE") || import.meta.env.VITE_AMAP_SECURITY_CODE || "") as string

// 高德地图风险颜色已移至 CSS（.bldg-pin--{color} 类）

declare global {
  interface Window {
    AMap?: Record<string, unknown> & {
      Map: new (container: HTMLElement, opts: Record<string, unknown>) => AMapInstance
      Marker: new (opts: Record<string, unknown>) => AMapMarker
      LngLat: new (lng: number, lat: number) => unknown
      Pixel: new (x: number, y: number) => unknown
      InfoWindow: new (opts: Record<string, unknown>) => AMapInfoWindow
      Scale: new (opts?: Record<string, unknown>) => void
      plugin: (plugins: string[], callback: () => void) => void
    }
    _AMapSecurityConfig?: { securityJsCode: string }
    __AMapAPIBootstrap?: () => void
  }
}
interface AMapInstance {
  setFitView: (markers: AMapMarker[]) => void
  destroy: () => void
  getZoom: () => number
  setZoom: (zoom: number) => void
  setStatus: (status: Record<string, boolean>) => void
}
interface AMapMarker {
  setMap: (map: AMapInstance | null) => void
  on: (event: string, handler: () => void) => void
}
interface AMapInfoWindow {
  open: (map: AMapInstance, position: unknown) => void
  close: () => void
}

const screenIcons = {
  shield: "/static/images/screen-icons/shield-check.svg",
  building: "/static/images/screen-icons/building-2.svg",
  point: "/static/images/screen-icons/radio-tower.svg",
  warning: "/static/images/screen-icons/triangle-alert.svg",
  siren: "/static/images/screen-icons/siren.svg",
  workOrder: "/static/images/screen-icons/clipboard-check.svg",
  chart: "/static/images/screen-icons/chart-line.svg",
  server: "/static/images/screen-icons/server.svg",
  database: "/static/images/screen-icons/database.svg",
  activity: "/static/images/screen-icons/activity.svg",
  team: "/static/images/screen-icons/users-round.svg",
  package: "/static/images/screen-icons/package-check.svg",
  check: "/static/images/screen-icons/circle-check.svg",
  fileCheck: "/static/images/screen-icons/file-check.svg",
  wrench: "/static/images/screen-icons/wrench.svg",
  send: "/static/images/screen-icons/send.svg",
  hardHat: "/static/images/screen-icons/hard-hat.svg",
  searchCheck: "/static/images/screen-icons/search-check.svg",
  archiveRestore: "/static/images/screen-icons/archive-restore.svg",
}

// ── 响应式状态 ────────────────────────────────────────────────────────────────
const kpi           = ref<ScreenKpi>({ totalBuildings: 0, monitoringPoints: 0, openHazards: 0, activeAlarms: 0, closeRate: 0 })
const mapPoints     = ref<MapPoint[]>([])
const selectedPoint = ref<MapPoint | null>(null)
const hazardList  = ref<HazardListItem[]>([])
const board       = ref<WorkOrderBoard>({ pending: 0, processing: 0, checking: 0, finished: 0, total: 0, overdueCount: 0 })
const currentTime = ref("")
const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: ECharts | null = null
const riskChartRef = ref<HTMLElement | null>(null)
let riskChart: ECharts | null = null
const hazardTypeChartRef = ref<HTMLElement | null>(null)
let hazardTypeChart: ECharts | null = null

// IoT mini 面板刷新计数器（每次 loadData 自增，驱动 computed 重新读取 localStorage）
const iotRefreshTick = ref(0)

// IoT mini 面板：点击建筑时读取遥测汇总
const selectedIotSummary = computed((): BuildingIotSummary | null => {
  void iotRefreshTick.value  // 订阅刷新信号
  if (!selectedPoint.value) return null
  return getBuildingIotSummary(selectedPoint.value.id)
})

type IotPointSummary = BuildingIotSummary["points"][number]

function screenValueClass(pt: IotPointSummary): string {
  const v = pt.latestValue
  if (v === null) return ""
  if (pt.limitHh !== null && v >= pt.limitHh) return "screen-iot--red"
  if (pt.limitH  !== null && v >= pt.limitH)  return "screen-iot--orange"
  return "screen-iot--green"
}

function screenDotClass(pt: IotPointSummary, v: number | null): string {
  if (v === null) return "bar-gray"
  if (pt.limitHh !== null && v >= pt.limitHh) return "bar-red"
  if (pt.limitH  !== null && v >= pt.limitH)  return "bar-orange"
  return "bar-green"
}

/**
 * T15.118 — 地图失败列表兜底模式。
 * 高德地图 Key 未配置或加载失败时，切换到建筑列表展示。
 */
const mapError = ref(false)

// ── 高德地图实例 ──────────────────────────────────────────────────────────────
const amapContainerRef = ref<HTMLElement | null>(null)
const amapLoaded       = ref(false)
let   amapInstance: AMapInstance | null = null
let   amapMarkers: AMapMarker[]         = []
let   amapInfoWindow: AMapInfoWindow | null = null
// document-level mouseup handler 用于拖拽结束后重新锁定地图
let   amapDocMouseupHandler: (() => void) | null = null

/** 动态加载高德地图 JS API 脚本 */
function loadAmapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AMap) { resolve(); return }
    if (AMAP_SECURITY_CODE) {
      window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }
    }
    window.__AMapAPIBootstrap = resolve
    const script = document.createElement("script")
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&callback=__AMapAPIBootstrap`
    script.onerror = () => reject(new Error("高德地图脚本加载失败"))
    document.head.appendChild(script)
  })
}

/** 初始化高德地图 */
async function initAmapMap(): Promise<void> {
  if (!AMAP_KEY) {
    // 未配置 Key → 列表兜底
    mapError.value = true
    return
  }
  try {
    await loadAmapScript()
    if (!amapContainerRef.value || !window.AMap) return

    amapInstance = new window.AMap.Map(amapContainerRef.value, {
      zoom:         13,
      center:       [130.3620, 46.8221],    // 佳木斯市中心
      mapStyle:     "amap://styles/darkblue",  // 深蓝商务科技风格，与大屏 UI 色调一致
      features:     ["bg", "road", "building"],  // 移除 point 层（隐藏景区/POI 标注）
      viewMode:     "3D",            // 3D 视角，高德自动渲染建筑立体模型
      pitch:        40,              // 倾斜角度
      buildingAnimation: true,       // 建筑挤出动画
      showBuildingBlock: true,       // 显示3D楼块
      resizeEnable: true,
      showLabel:    true,
      zooms:        [10, 18],
    })

    amapLoaded.value = true

    // 默认锁定地图所有交互，仅允许从点位图标发起操作
    amapInstance.setStatus({
      dragEnable:       false,
      zoomEnable:       false,
      scrollWheel:      false,
      doubleClickZoom:  false,
      keyboardEnable:   false,
      rotateEnable:     false,
    })

    // 打开拖拽结束后重新锁定的全局监听器
    amapDocMouseupHandler = () => {
      if (amapInstance) {
        amapInstance.setStatus({ dragEnable: false })
      }
    }
    document.addEventListener("mouseup", amapDocMouseupHandler)

    addAmapMarkers()

    // 自适应显示所有建筑点位，并把缩放保持在 12~14，优先保证街道名称可见。
    const validMarkers = amapMarkers.filter(Boolean)
    if (validMarkers.length > 0) {
      amapInstance.setFitView(validMarkers)
      setTimeout(() => {
        if (amapInstance) {
          const nextZoom = Math.max(13, Math.min(Math.round(amapInstance.getZoom() + 1), 15))
          amapInstance.setZoom(nextZoom)
        }
      }, 600)
    }
  } catch (err) {
    console.warn("[ScreenHome] 高德地图初始化失败，已切换到列表模式", err)
    mapError.value = true
  }
}

/** 添加/刷新建筑点位标记 */
function addAmapMarkers(): void {
  if (!amapInstance || !window.AMap) return

  // 清除旧标记
  for (const m of amapMarkers) m.setMap(null)
  amapMarkers = []
  if (amapInfoWindow) { amapInfoWindow.close(); amapInfoWindow = null }

  for (const pt of mapPoints.value) {
    if (pt.longitude === null || pt.latitude === null) continue

    const zIndex = pt.color === "red" ? 200 : pt.color === "orange" ? 150 : pt.color === "yellow" ? 100 : 50
    const label  = pt.shortName || pt.name.slice(0, 5)

    // 自定义 HTML 标记：地图落针样式（静态，无闪烁）
    const content = [
      `<div class="bldg-pin bldg-pin--${pt.color}">`,
      `  <div class="bldg-pin__icon">`,
      `    <div class="bldg-pin__circle"></div>`,
      `  </div>`,
      `  <span class="bldg-pin__lbl">${label}</span>`,
      `</div>`,
    ].join("")

    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(pt.longitude, pt.latitude),
      content,
      offset:   new window.AMap.Pixel(-20, -4),  // 水平居中，垂直对齐到圆点中心
      zIndex,
      cursor:   "pointer",
    })

    marker.on("click", () => {
      selectedPoint.value = pt
    })

    // 仅允许从点位图标发起拖拽；悬停在图标上时开启滚轮缩放
    marker.on("mousedown", () => {
      if (amapInstance) amapInstance.setStatus({ dragEnable: true })
    })
    marker.on("mouseover", () => {
      if (amapInstance) amapInstance.setStatus({ zoomEnable: true, scrollWheel: true })
    })
    marker.on("mouseout", () => {
      if (amapInstance) amapInstance.setStatus({ zoomEnable: false, scrollWheel: false })
    })

    marker.setMap(amapInstance)
    amapMarkers.push(marker)
  }
}

// ── 告警入口：取最高风险的前 4 条用于右侧告警入口区域（data-zone="alarm-entry"）──
const alarmEntryItems = computed<HazardListItem[]>(() => hazardList.value)

const riskDistribution = computed(() => {
  const counts = { red: 0, orange: 0, yellow: 0, green: 0 }
  for (const item of hazardList.value) {
    const level = item.alarmLevel.toLowerCase()
    if (level === "red" || level === "orange" || level === "yellow") counts[level]++
  }
  const riskTotal = counts.red + counts.orange + counts.yellow
  const total = Math.max(kpi.value.totalBuildings, riskTotal)
  counts.green = Math.max(0, total - riskTotal)
  return [
    { key: "red",    label: "红色风险", value: counts.red,    color: "#FF4E45" },
    { key: "orange", label: "橙色风险", value: counts.orange, color: "#FFB03A" },
    { key: "yellow", label: "黄色风险", value: counts.yellow, color: "#FCD34D" },
    { key: "green",  label: "绿色风险", value: counts.green,  color: "#20E6A4" },
  ]
})

const riskRingStyle = computed(() => {
  const total = riskDistribution.value.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return { background: "conic-gradient(rgba(0,145,255,0.24) 0 100%)" }
  }
  let start = 0
  const segments = riskDistribution.value.map((item) => {
    const end = start + (item.value / total) * 100
    const segment = `${item.color} ${start}% ${end}%`
    start = end
    return segment
  })
  return { background: `conic-gradient(${segments.join(", ")})` }
})

const hazardTypeStats = computed(() => {
  const stats = [
    { label: "结构安全", value: kpi.value.openHazards },
    { label: "设备设施", value: kpi.value.activeAlarms },
    { label: "施工安全", value: board.value.overdueCount },
    { label: "环境监测", value: Math.max(0, mapPoints.value.length - kpi.value.activeAlarms) },
  ]
  const max = Math.max(...stats.map((item) => item.value), 1)
  return stats.map((item) => ({ ...item, percent: Math.max(8, Math.round((item.value / max) * 100)) }))
})

const systemStats = computed(() => [
  { icon: screenIcons.server,   value: "98.6%", label: "设备在线率" },
  { icon: screenIcons.database, value: "97.3%", label: "数据接入率" },
  { icon: screenIcons.activity, value: "99.9%", label: "平台稳定性" },
])

const demoTrendBaseline = [
  { created: 4, finished: 3 },
  { created: 5, finished: 4 },
  { created: 6, finished: 4 },
  { created: 7, finished: 5 },
  { created: 6, finished: 6 },
  { created: 8, finished: 6 },
  { created: 9, finished: 7 },
]

const trendSeries = computed(() => {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (6 - index))
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const date = String(d.getDate()).padStart(2, "0")
    return { key: `${d.getFullYear()}-${month}-${date}`, label: `${month}/${date}` }
  })
  const createdCounts = new Map(days.map((day) => [day.key, 0]))
  const finishedCounts = new Map(days.map((day) => [day.key, 0]))
  const orders = getTable<{ dispatch_time: string | null; finish_time?: string | null; status: string }>("work_order")

  for (const order of orders) {
    const dispatchDay = order.dispatch_time?.slice(0, 10)
    if (dispatchDay && createdCounts.has(dispatchDay)) {
      createdCounts.set(dispatchDay, (createdCounts.get(dispatchDay) ?? 0) + 1)
    }
    const finishDay = order.finish_time?.slice(0, 10)
    if (finishDay && finishedCounts.has(finishDay)) {
      finishedCounts.set(finishDay, (finishedCounts.get(finishDay) ?? 0) + 1)
    }
  }

  return days.map((day, index) => ({
    label: day.label,
    created: (createdCounts.get(day.key) ?? 0) + demoTrendBaseline[index].created,
    finished: (finishedCounts.get(day.key) ?? 0) + demoTrendBaseline[index].finished,
  }))
})

const resourceStats = computed(() => [
  { icon: screenIcons.point,   value: `${Math.max(getTable<Record<string, unknown>>("iot_device").length, mapPoints.value.length)}`, label: "监测设备" },
  { icon: screenIcons.team,    value: "12", label: "应急队伍" },
  { icon: screenIcons.check,   value: "36", label: "专家人员" },
  { icon: screenIcons.package, value: "148", label: "应急物资" },
])

const mapBounds = computed(() => {
  const coords = mapPoints.value.filter((pt) => pt.latitude !== null && pt.longitude !== null)
  const lats = coords.map((pt) => pt.latitude as number)
  const lngs = coords.map((pt) => pt.longitude as number)
  return {
    minLat: lats.length ? Math.min(...lats) : 46.78,
    maxLat: lats.length ? Math.max(...lats) : 46.86,
    minLng: lngs.length ? Math.min(...lngs) : 130.30,
    maxLng: lngs.length ? Math.max(...lngs) : 130.42,
  }
})

const fallbackMapPositions = [
  [51, 50], [25, 24], [73, 22], [31, 69], [70, 70], [45, 26], [57, 75],
  [18, 48], [83, 44], [38, 42], [61, 35], [48, 63], [76, 58], [23, 77],
  [66, 18], [34, 18], [86, 74], [16, 30], [43, 80], [58, 23], [74, 36],
  [29, 54], [52, 38],
]

function clampPercent(value: number): number {
  return Math.max(9, Math.min(91, value))
}

function mapPointStyle(pt: MapPoint, index: number): Record<string, string> {
  void pt
  const [left, top] = fallbackMapPositions[index % fallbackMapPositions.length]
  return { left: `${clampPercent(left)}%`, top: `${clampPercent(top)}%` }
}

function updateTrendChart(): void {
  if (!trendChart) return
  const labels = trendSeries.value.map((item) => item.label)
  trendChart.setOption({
    animationDuration: 600,
    backgroundColor: "transparent",
    color: ["#38E8FF", "#33F6A2"],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(4, 18, 43, 0.95)",
      borderColor: "rgba(56, 232, 255, 0.5)",
      textStyle: { color: "#DDF7FF", fontSize: 12 },
    },
    legend: {
      data: ["新派工单", "闭环工单"],
      right: 10,
      top: 0,
      itemWidth: 12,
      itemHeight: 6,
      textStyle: { color: "#A8CFFF", fontSize: 11 },
    },
    grid: { left: 32, right: 12, top: 28, bottom: 22, containLabel: false },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: "rgba(140, 203, 255, 0.4)" } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: "#A8CFFF", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitNumber: 3,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: "#A8CFFF", fontSize: 11 },
    },
    series: [
      {
        name: "新派工单",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.4 },
        areaStyle: { color: "rgba(56, 232, 255, 0.22)" },
        data: trendSeries.value.map((item) => item.created),
      },
      {
        name: "闭环工单",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.4 },
        areaStyle: { color: "rgba(51, 246, 162, 0.16)" },
        data: trendSeries.value.map((item) => item.finished),
      },
    ],
  })
}

function updateRiskChart(): void {
  if (!riskChart) return
  const data = riskDistribution.value.map((item) => ({
    name: item.label,
    value: item.value,
    itemStyle: { color: item.color },
  }))
  riskChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(4, 18, 43, 0.95)",
      borderColor: "rgba(56, 232, 255, 0.5)",
      textStyle: { color: "#DDF7FF", fontSize: 12 },
      formatter: "{b}<br/>数量：{c} ({d}%)",
    },
    series: [
      {
        type: "pie",
        radius: ["55%", "82%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "center",
          formatter: () => `{v|${kpi.value.totalBuildings}}\n{l|建筑总数}`,
          rich: {
            v: { color: "#FFFFFF", fontSize: 22, fontWeight: 700, lineHeight: 26, textShadowColor: "rgba(56,232,255,0.5)", textShadowBlur: 10 },
            l: { color: "#A8CFFF", fontSize: 12, lineHeight: 14 },
          },
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: "rgba(4,18,43,0.9)",
          borderWidth: 2,
        },
        data,
      },
    ],
  })
}

function updateHazardTypeChart(): void {
  if (!hazardTypeChart) return
  const stats = hazardTypeStats.value
  hazardTypeChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(4, 18, 43, 0.95)",
      borderColor: "rgba(56, 232, 255, 0.5)",
      textStyle: { color: "#DDF7FF", fontSize: 12 },
      formatter: (params: { name: string; value: number }[]) =>
        `${params[0].name}<br/>数量：<b>${params[0].value}</b>`,
    },
    grid: { left: 70, right: 30, top: 8, bottom: 8, containLabel: false },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: "category",
      data: stats.map((item) => item.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#C5DEFF", fontSize: 13, fontWeight: 600 },
      inverse: true,
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        data: stats.map((item) => item.value),
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: "#1B6FE8" },
              { offset: 1, color: "#38E8FF" },
            ],
          },
          borderRadius: [3, 6, 6, 3],
          shadowColor: "rgba(56,232,255,0.5)",
          shadowBlur: 8,
        },
        label: {
          show: true,
          position: "right",
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: 700,
          formatter: "{c}",
        },
        showBackground: true,
        backgroundStyle: { color: "rgba(0,145,255,0.12)", borderRadius: 6 },
      },
    ],
  })
}

function initTrendChart(): void {
  if (!trendChartRef.value || trendChart) return
  trendChart = init(trendChartRef.value)
  updateTrendChart()
}

function initRiskChart(): void {
  if (!riskChartRef.value || riskChart) return
  riskChart = init(riskChartRef.value)
  updateRiskChart()
}

function initHazardTypeChart(): void {
  if (!hazardTypeChartRef.value || hazardTypeChart) return
  hazardTypeChart = init(hazardTypeChartRef.value)
  updateHazardTypeChart()
}

function resizeAllCharts(): void {
  trendChart?.resize()
  riskChart?.resize()
  hazardTypeChart?.resize()
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadData() {
  kpi.value        = selectScreenKpi()
  mapPoints.value  = selectMapPoints()
  hazardList.value = selectHazardList({ limit: 15 })
  board.value      = selectWorkOrderBoard()
  currentTime.value = formatTime(new Date())
  iotRefreshTick.value++  // 触发 selectedIotSummary 重计算
  updateTrendChart()
  updateRiskChart()
  updateHazardTypeChart()
  // 高德地图标记同步刷新（数据更新后更新点位颜色）
  if (amapLoaded.value) addAmapMarkers()
}

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  loadData()
  nextTick(() => {
    initTrendChart()
    initRiskChart()
    initHazardTypeChart()
    window.addEventListener("resize", resizeAllCharts)
    // 初始化高德地图（异步，失败时自动降级）
    initAmapMap()
  })
  timer = setInterval(loadData, 5_000)  // 缩短到 5s，确保 H5 结案后大屏及时响应
})
watch(trendSeries, updateTrendChart, { deep: true })
watch(riskDistribution, updateRiskChart, { deep: true })
watch(hazardTypeStats, updateHazardTypeChart, { deep: true })
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener("resize", resizeAllCharts)
  if (amapDocMouseupHandler) {
    document.removeEventListener("mouseup", amapDocMouseupHandler)
    amapDocMouseupHandler = null
  }
  trendChart?.dispose()
  trendChart = null
  riskChart?.dispose()
  riskChart = null
  hazardTypeChart?.dispose()
  hazardTypeChart = null
  // 销毁高德地图实例
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
  }
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.screen-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}

/* ===== 顶部标题栏 ===== */
.screen-header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  position: relative;
  z-index: 10;
}
.screen-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--screen-cyan, #00D4FF) 20%, var(--screen-primary, #1B6FE8) 50%, var(--screen-cyan, #00D4FF) 80%, transparent 100%);
  opacity: 0.7;
}
.screen-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.screen-header__logo-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--screen-primary, #1B6FE8) 0%, var(--screen-cyan, #00D4FF) 100%);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}
.screen-header__title {
  font-size: 18px;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(90deg, #fff 0%, var(--screen-cyan, #00D4FF) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.05em;
  margin: 0;
}
.screen-header__right {
  font-size: 13px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-header__time { font-variant-numeric: tabular-nums; }

/* ===== KPI 指标区 ===== */
.screen-kpi {
  display: flex;
  align-items: center;
  gap: 16px;
}
.screen-kpi-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.screen-kpi-item__label {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  white-space: nowrap;
}
.screen-kpi-item__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--screen-cyan, #00D4FF);
  line-height: 1;
}
.screen-kpi-item__value--warn    { color: var(--risk-orange, #FF8A3D); }
.screen-kpi-item__value--success { color: var(--color-success, #10B981); }
.screen-kpi-item__unit {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-kpi-divider {
  width: 1px;
  height: 32px;
  background: var(--screen-border-line, rgba(255,255,255,0.08));
}

/* ===== 主内容区 ===== */
.screen-main {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

/* ===== 面板通用 ===== */
.screen-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  padding: 14px;
  background: var(--screen-bg-card, rgba(8,25,60,0.85));
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  border-radius: var(--radius-lg, 12px);
  backdrop-filter: blur(12px);
}
.screen-glass-card {
  background: var(--screen-bg-card, rgba(8,25,60,0.85));
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  border-radius: var(--radius-lg, 12px);
  backdrop-filter: blur(12px);
  box-shadow: var(--screen-shadow-card, 0 0 0 1px rgba(0,168,255,0.20), 0 4px 24px rgba(0,0,0,0.40));
}
.screen-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  padding-bottom: 6px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
}
.screen-panel__title-bar {
  display: inline-block;
  width: 3px;
  height: 13px;
  background: var(--screen-cyan, #00D4FF);
  border-radius: 2px;
}
.screen-panel__badge {
  margin-left: auto;
  background: rgba(239,68,68,0.15);
  color: #EF4444;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(239,68,68,0.30);
}
.screen-panel__divider {
  height: 1px;
  background: var(--screen-border-line, rgba(255,255,255,0.08));
  margin: 4px 0;
}

/* ===== 隐患清单 ===== */
.screen-hazard-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
}
.screen-hazard-list__items::-webkit-scrollbar { width: 2px; }
.screen-hazard-list__items::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 1px; }
.screen-hazard-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border-left: 2px solid transparent;
}
.screen-hazard-item--red    { border-left-color: var(--risk-red, #FF4444); }
.screen-hazard-item--orange { border-left-color: var(--risk-orange, #FF8A3D); }
.screen-hazard-item--yellow { border-left-color: var(--risk-yellow, #FFD700); }
.screen-hazard-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red, #FF4444); box-shadow: 0 0 6px var(--risk-red, #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 6px var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FFD700); box-shadow: 0 0 6px var(--risk-yellow, #FFD700); }
.risk-dot--green  { background: var(--risk-green, #10B981); }
.screen-hazard-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.screen-hazard-item__name {
  font-size: 12px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.screen-hazard-item__building {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-hazard-item__level {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 9999px;
}
.badge-screen       { border: 1px solid; }
.badge-screen--red    { color: var(--risk-red,    #FF4444); background: var(--risk-red-alpha, rgba(255,68,68,0.15));    border-color: var(--risk-red,    #FF4444); }
.badge-screen--orange { color: var(--risk-orange, #FF8A3D); background: var(--risk-orange-alpha, rgba(255,138,61,0.15)); border-color: var(--risk-orange, #FF8A3D); }
.badge-screen--yellow { color: var(--risk-yellow, #FFD700); background: var(--risk-yellow-alpha, rgba(255,215,0,0.15));  border-color: var(--risk-yellow, #FFD700); }
.badge-screen--green  { color: var(--risk-green,  #10B981); background: var(--risk-green-alpha,  rgba(16,185,129,0.12)); border-color: var(--risk-green,  #10B981); }
.screen-hazard-list__empty {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  text-align: center;
  padding: 20px 0;
}

/* ===== 中央地图区 ===== */
.screen-map {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg, 12px);
}
.screen-map__container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px;
}
.screen-map__title-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
  flex-shrink: 0;
}
.screen-map__title-sub {
  font-size: 11px;
  font-weight: 400;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  margin-left: 4px;
}
.screen-map__live-badge {
  margin-left: auto;
  font-size: 11px;
  color: #20E6A4;
  padding: 1px 6px;
  border: 1px solid rgba(32,230,164,0.4);
  border-radius: 10px;
  animation: live-blink 2s ease-in-out infinite;
}
@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
/* 高德地图真实容器 */
.screen-map__amap-layer {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 0;
  /* 商务科技蓝 CSS 过滤：增强饱和度与亮度，让深蓝地图更鲜明透亮 */
  filter: brightness(1.35) saturate(1.6) hue-rotate(-8deg);
}
.screen-map__amap-layer--hidden {
  display: none;
}
/* 加载中提示 */
.screen-map__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-size: 13px;
}
.screen-map__loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--screen-cyan, #00D4FF);
  animation: loading-pulse 1.2s ease-in-out infinite;
}
@keyframes loading-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}
/* 高德地图 logo 和版权区域样式覆盖（使其适配深色大屏）*/
:deep(.amap-logo) { opacity: 0.4 !important; }
:deep(.amap-copyright) { opacity: 0.4 !important; color: rgba(255,255,255,0.3) !important; }
:deep(.amap-controls) { opacity: 0.6; }

/* ── 建筑点位自定义标记 ── */
:deep(.bldg-pin) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  user-select: none;
  /* 水平居中 + 垂直对齐使 beacon 圆心落在坐标点 */
  width: 40px;
}
:deep(.bldg-pin__beacon) {
  position: relative;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}
:deep(.bldg-pin__core) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}
:deep(.bldg-pin__ring) {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  z-index: 1;
  animation: bldg-ring-expand 2.4s ease-out infinite;
  pointer-events: none;
}
:deep(.bldg-pin__lbl) {
  display: block;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  text-align: center;
  letter-spacing: 0.3px;
  font-family: "MiSans", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 绿色（安全） */
:deep(.bldg-pin--green .bldg-pin__core) {
  background: #20E6A4;
  box-shadow: 0 0 6px #20E6A4, 0 0 16px rgba(32,230,164,0.7), 0 0 28px rgba(32,230,164,0.3);
}
:deep(.bldg-pin--green .bldg-pin__ring) { border-color: #20E6A4; }
:deep(.bldg-pin--green .bldg-pin__lbl)  {
  color: #20E6A4;
  background: rgba(0,15,10,0.82);
  border: 1px solid rgba(32,230,164,0.4);
  text-shadow: 0 0 6px rgba(32,230,164,0.8);
}

/* 橙色（橙色告警） */
:deep(.bldg-pin--orange .bldg-pin__core) {
  background: #FFB03A;
  box-shadow: 0 0 6px #FFB03A, 0 0 16px rgba(255,176,58,0.7), 0 0 28px rgba(255,176,58,0.3);
}
:deep(.bldg-pin--orange .bldg-pin__ring) { border-color: #FFB03A; }
:deep(.bldg-pin--orange .bldg-pin__lbl)  {
  color: #FFB03A;
  background: rgba(20,8,0,0.82);
  border: 1px solid rgba(255,176,58,0.4);
  text-shadow: 0 0 6px rgba(255,176,58,0.8);
}

/* 黄色（黄色告警） */
:deep(.bldg-pin--yellow .bldg-pin__core) {
  background: #FCD34D;
  box-shadow: 0 0 6px #FCD34D, 0 0 16px rgba(252,211,77,0.7), 0 0 28px rgba(252,211,77,0.3);
}
:deep(.bldg-pin--yellow .bldg-pin__ring) { border-color: #FCD34D; }
:deep(.bldg-pin--yellow .bldg-pin__lbl)  {
  color: #FCD34D;
  background: rgba(18,12,0,0.82);
  border: 1px solid rgba(252,211,77,0.4);
  text-shadow: 0 0 6px rgba(252,211,77,0.8);
}

/* 红色（紧急告警） */
:deep(.bldg-pin--red .bldg-pin__core) {
  background: #FF4E45;
  box-shadow: 0 0 6px #FF4E45, 0 0 16px rgba(255,78,69,0.7), 0 0 28px rgba(255,78,69,0.3);
}
:deep(.bldg-pin--red .bldg-pin__ring) { border-color: #FF4E45; }
:deep(.bldg-pin--red .bldg-pin__lbl)  {
  color: #FF4E45;
  background: rgba(25,0,0,0.82);
  border: 1px solid rgba(255,78,69,0.4);
  text-shadow: 0 0 6px rgba(255,78,69,0.8);
}

/* 脉冲扩散动画 */
@keyframes bldg-ring-expand {
  0%   { transform: scale(1); opacity: 0.8; }
  80%  { transform: scale(2.8); opacity: 0.1; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* 红色告警额外叠加闪烁 */
:deep(.bldg-pin--red .bldg-pin__core) {
  animation: bldg-red-pulse 1.5s ease-in-out infinite;
}
@keyframes bldg-red-pulse {
  0%, 100% { box-shadow: 0 0 6px #FF4E45, 0 0 16px rgba(255,78,69,0.7), 0 0 28px rgba(255,78,69,0.3); }
  50%       { box-shadow: 0 0 12px #FF4E45, 0 0 28px rgba(255,78,69,0.9), 0 0 48px rgba(255,78,69,0.5); }
}

/* 红色闪烁（最高级别：S>95 / 应急事件激活） */
:deep(.bldg-pin--red-blink .bldg-pin__core) {
  background: #FF2020;
  box-shadow: 0 0 8px #FF2020, 0 0 20px rgba(255,32,32,0.9), 0 0 40px rgba(255,32,32,0.5);
  animation: bldg-redblink-core 0.8s ease-in-out infinite;
}
:deep(.bldg-pin--red-blink .bldg-pin__ring) {
  border-color: #FF2020;
  animation: bldg-ring-expand 1.2s ease-out infinite;
}
:deep(.bldg-pin--red-blink .bldg-pin__lbl) {
  color: #FF5050;
  background: rgba(40,0,0,0.90);
  border: 1px solid rgba(255,32,32,0.6);
  text-shadow: 0 0 8px rgba(255,50,50,1);
  animation: bldg-redblink-lbl 0.8s ease-in-out infinite;
}
@keyframes bldg-redblink-core {
  0%, 100% { box-shadow: 0 0 8px #FF2020, 0 0 20px rgba(255,32,32,0.9), 0 0 40px rgba(255,32,32,0.5); opacity: 1; }
  50%       { box-shadow: 0 0 18px #FF2020, 0 0 40px rgba(255,32,32,1),   0 0 70px rgba(255,32,32,0.7); opacity: 0.7; }
}
@keyframes bldg-redblink-lbl {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
.screen-map__fallback-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  align-content: start;
  padding-right: 4px;
}
.screen-map__fallback-list::-webkit-scrollbar { width: 2px; }
.screen-map__fallback-list::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 1px; }
.screen-map__point {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 150ms;
}
.screen-map__point:hover { background: rgba(0,212,255,0.08); }
.screen-map__point-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.screen-map__point--red  .screen-map__point-dot { background: var(--risk-red, #FF4444); box-shadow: 0 0 5px var(--risk-red, #FF4444); }
.screen-map__point--orange .screen-map__point-dot { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 5px var(--risk-orange, #FF8A3D); }
.screen-map__point--yellow .screen-map__point-dot { background: var(--risk-yellow, #FFD700); }
.screen-map__point--green  .screen-map__point-dot { background: var(--risk-green, #10B981); }
.screen-map__point-name {
  font-size: 11px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.screen-map__point-level {
  font-size: 10px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  white-space: nowrap;
}
.screen-map__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-size: 13px;
}

/* ===== 工单看板 ===== */
.screen-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.screen-board-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}
.screen-board-item__count {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}
.screen-board-item__label {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-board-item--pending    .screen-board-item__count { color: var(--wo-pending,    #F59E0B); }
.screen-board-item--processing .screen-board-item__count { color: var(--wo-processing, #3B82F6); }
.screen-board-item--checking   .screen-board-item__count { color: var(--wo-checking,   #8B5CF6); }
.screen-board-item--finished   .screen-board-item__count { color: var(--wo-finished,   #10B981); }
.screen-board-overdue {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(239,68,68,0.10);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 6px;
  font-size: 12px;
  color: #FCA5A5;
}
.screen-board-overdue__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--risk-red, #EF4444);
  animation: pulse 1.5s ease-in-out infinite;
}
.screen-quick-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.screen-quick-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 4px 12px;
  background: rgba(27,111,232,0.15);
  border: 1px solid rgba(27,111,232,0.30);
  border-radius: 6px;
  color: var(--screen-cyan, #00D4FF);
  font-size: 13px;
  text-align: center;
  text-decoration: none;
  transition: background 150ms;
}
.screen-quick-link:hover {
  background: rgba(27,111,232,0.30);
}
.screen-quick-link--supervision {
  background: rgba(245,158,11,0.15);
  border-color: rgba(245,158,11,0.35);
  color: #F59E0B;
}
.screen-quick-link--supervision:hover {
  background: rgba(245,158,11,0.28);
}

/* ===== 告警入口区域 (data-zone="alarm-entry") ===== */
.screen-alarm-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
  padding-top: 10px;
  flex: 1;
  min-height: 0;
}
.screen-alarm-entry__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}
.screen-alarm-entry__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 150ms;
}
.screen-alarm-entry__item:hover { background: rgba(255,255,255,0.06); }
.screen-alarm-entry__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.screen-alarm-entry__title {
  flex: 1;
  font-size: 11px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.screen-alarm-entry__level {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.screen-alarm-entry__empty {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  text-align: center;
  padding: 12px 0;
}
.screen-alarm-entry__link {
  display: block;
  padding: 7px 12px;
  background: rgba(255,138,61,0.12);
  border: 1px solid rgba(255,138,61,0.30);
  border-radius: 6px;
  color: var(--risk-orange, #FF8A3D);
  font-size: 12px;
  text-align: center;
  text-decoration: none;
  font-weight: 500;
  transition: background 150ms;
}
.screen-alarm-entry__link:hover {
  background: rgba(255,138,61,0.22);
}
.screen-panel__badge--warn {
  background: rgba(255,138,61,0.15);
  color: var(--risk-orange, #FF8A3D);
  border: 1px solid rgba(255,138,61,0.30);
}
.screen-panel__badge--active {
  animation: pulse 1.5s ease-in-out infinite;
}
.screen-panel__title-bar--warn {
  background: linear-gradient(180deg, var(--risk-orange, #FF8A3D) 0%, transparent 100%);
}

/* ===== 建筑详情弹窗 (T15.72 高保真) ===== */
.screen-building-popup {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 220px;
  padding: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.screen-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.screen-popup-building-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.screen-popup-close {
  background: none;
  border: none;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
.screen-popup-close:hover { color: rgba(255,255,255,0.90); }
.screen-popup-risk-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 9999px;
  text-align: center;
}
.screen-popup-summary {
  font-size: 12px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  line-height: 1.5;
}
.screen-popup-link {
  display: block;
  padding: 7px 12px;
  background: rgba(27,111,232,0.20);
  border: 1px solid rgba(27,111,232,0.40);
  border-radius: 6px;
  color: var(--screen-cyan, #00D4FF);
  font-size: 12px;
  text-align: center;
  text-decoration: none;
  font-weight: 500;
  transition: background 150ms;
}
.screen-popup-link:hover { background: rgba(27,111,232,0.35); }

/* 选中点位高亮 */
.screen-map__point--selected {
  background: rgba(0,212,255,0.15) !important;
  border-color: var(--screen-cyan, #00D4FF) !important;
  box-shadow: 0 0 8px rgba(0,212,255,0.30);
}

/* 弹窗 Transition 动画 */
.screen-popup-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.screen-popup-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.screen-popup-enter-from   { opacity: 0; transform: translateY(-45%) scale(0.95); }
.screen-popup-leave-to     { opacity: 0; transform: translateY(-55%) scale(0.95); }

/* ===== 底部状态栏 ===== */
.screen-footer {
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin: 0 8px 8px;
  padding: 0 16px;
  gap: 16px;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-footer__item strong { color: var(--screen-text-body, rgba(255,255,255,0.75)); }
.screen-footer__status--ok { color: var(--color-success, #10B981); }
.screen-footer__divider {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.12);
}

/* ===== 工具 ===== */
.tabular-nums { font-variant-numeric: tabular-nums; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ===== 参考图风格覆盖：蓝色中控指挥大屏 ===== */
.screen-root {
  background:
    radial-gradient(circle at 50% 14%, rgba(54, 170, 255, 0.46), transparent 30%),
    radial-gradient(circle at 52% 50%, rgba(0, 212, 255, 0.23), transparent 36%),
    radial-gradient(circle at 50% 66%, rgba(239, 68, 68, 0.14), transparent 26%),
    linear-gradient(180deg, #061B43 0%, #08306B 44%, #041633 100%);
  color: #B7D6FF;
}
.screen-root::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(77,174,255,0.085) 1px, transparent 1px),
    linear-gradient(90deg, rgba(77,174,255,0.085) 1px, transparent 1px),
    radial-gradient(circle at 50% 44%, rgba(91, 161, 255, 0.20), transparent 42%);
  background-size: 38px 38px, 38px 38px, 100% 100%;
  mask-image: radial-gradient(circle at center, #000 0%, transparent 82%);
}

.screen-header {
  height: 72px;
  justify-content: center;
  padding: 0 26px;
  background:
    linear-gradient(180deg, rgba(5,28,72,0.98), rgba(4,20,52,0.88)),
    radial-gradient(circle at 50% 100%, rgba(56,232,255,0.18), transparent 46%);
  border-bottom: 1px solid rgba(72,182,255,0.54);
  box-shadow: 0 0 32px rgba(14,108,255,0.30);
}
.screen-header::before { height: 3px; opacity: 1; }
.screen-header::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 620px;
  height: 72px;
  transform: translateX(-50%);
  clip-path: polygon(7% 0, 93% 0, 100% 28%, 91% 100%, 9% 100%, 0 28%);
  border: 1px solid rgba(56, 232, 255, 0.52);
  background:
    radial-gradient(circle at 50% 0%, rgba(83, 180, 255, 0.34), transparent 48%),
    linear-gradient(180deg, rgba(8, 54, 132, 0.72), rgba(3, 19, 52, 0.34));
  box-shadow: inset 0 0 28px rgba(0, 212, 255, 0.18), 0 0 28px rgba(0, 132, 255, 0.30);
  pointer-events: none;
}
.screen-header__side {
  position: relative;
  z-index: 2;
  flex: 1;
}
.screen-header__side--left { justify-content: flex-start; }
.screen-header__side--right { justify-content: flex-end; }
.screen-header__logo-text {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(145deg, #0D4FE8, #00D4FF);
  box-shadow: 0 0 22px rgba(0,168,255,0.55), inset 0 0 0 2px rgba(255,255,255,0.25);
}
.screen-header__clock {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.screen-header__center {
  position: absolute;
  left: 50%;
  top: 7px;
  z-index: 3;
  width: 600px;
  transform: translateX(-50%);
  text-align: center;
}
.screen-header__title {
  font-size: 25px;
  color: #FFFFFF;
  background: none;
  -webkit-text-fill-color: #FFFFFF;
  text-shadow: 0 0 20px rgba(74,158,255,0.72);
}
.screen-header__nav {
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: #A9D8FF;
  font-size: 12px;
  font-weight: 800;
}
.screen-header__nav span {
  position: relative;
}
.screen-header__nav span:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #38E8FF;
  box-shadow: 0 0 8px #38E8FF;
  transform: translateY(-50%);
}
.screen-header__right { align-items: center; gap: 14px; }
.screen-header__time { color: #FFFFFF; font-size: 18px; font-weight: 800; }
.screen-header__weather { color: #9FC4F7; font-size: 12px; }
.screen-header__location { color: #A9D8FF; font-size: 13px; font-weight: 700; }
.screen-header__user {
  min-width: 70px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 212, 255, 0.42);
  color: #DDF7FF;
  background: rgba(0, 132, 255, 0.18);
  box-shadow: inset 0 0 12px rgba(0, 212, 255, 0.12);
  font-size: 13px;
  text-align: center;
}
.screen-header__kpi-anchor {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.screen-kpi-ribbon {
  height: 86px;
  margin: 8px 10px 0;
  padding: 0 18px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(44,166,255,0.72);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(7,45,108,0.94), rgba(3,21,54,0.86)),
    radial-gradient(circle at 50% 0%, rgba(0,212,255,0.16), transparent 58%);
  box-shadow: 0 0 28px rgba(0,132,255,0.32), inset 0 1px 0 rgba(160,220,255,0.26), inset 0 -14px 24px rgba(0, 132, 255, 0.08);
}
.screen-kpi-ribbon .screen-kpi-divider { display: none; }
.screen-kpi-ribbon .screen-kpi-item {
  position: relative;
  align-items: flex-start;
  padding-left: 54px;
}
.screen-kpi-ribbon .screen-kpi-item::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  width: 38px;
  height: 38px;
  transform: translateY(-50%) rotate(45deg);
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0,212,255,0.26), rgba(27,111,232,0.68));
  border: 1px solid rgba(0,212,255,0.58);
  box-shadow: 0 0 22px rgba(0,212,255,0.34);
}
.screen-kpi-item__label { color: #9CC7FF; font-size: 12px; font-weight: 700; }
.screen-kpi-item__value { color: #F8FBFF; font-size: 30px; text-shadow: 0 0 18px rgba(95,189,255,0.52); }
.screen-kpi-item__value--warn { color: #FF625A; }
.screen-kpi-item__value--red { color: #FF3F37; text-shadow: 0 0 18px rgba(255,63,55,0.65); }
.screen-kpi-item__value--success { color: #33F6A2; }
.screen-kpi-item__unit { color: #83A9D9; }

.screen-main {
  grid-template-columns: 300px 1fr 310px;
  gap: 10px;
  padding: 10px;
}
.screen-panel,
.screen-glass-card {
  border-radius: 7px;
  border: 1px solid rgba(44,166,255,0.66);
  background:
    linear-gradient(180deg, rgba(7,42,98,0.9), rgba(4,22,55,0.8)),
    radial-gradient(circle at 50% 0%, rgba(0,212,255,0.12), transparent 60%);
  box-shadow: 0 0 28px rgba(0,132,255,0.26), inset 0 0 28px rgba(16,92,190,0.16), inset 0 1px 0 rgba(156,210,255,0.18);
}
.screen-panel__title,
.screen-map__title-bar {
  color: #DDEEFF;
  border-bottom-color: rgba(0,145,255,0.22);
  font-weight: 900;
}
.screen-panel__title-bar { background: linear-gradient(180deg, #00D4FF, #1B6FE8); box-shadow: 0 0 10px rgba(0,212,255,0.7); }

.screen-map__container {
  position: relative;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(8,43,96,0.28), rgba(4,18,43,0.92));
}
.screen-map__container::before {
  content: '';
  position: absolute;
  inset: 42px 0 0;
  background:
    linear-gradient(145deg, rgba(88,162,255,0.2) 0 12%, transparent 12% 100%),
    repeating-linear-gradient(26deg, rgba(119,187,255,0.17) 0 2px, transparent 2px 32px),
    repeating-linear-gradient(116deg, rgba(119,187,255,0.15) 0 2px, transparent 2px 36px),
    linear-gradient(180deg, #0D3570 0%, #05224B 100%);
  filter: saturate(1.28) brightness(1.08);
}
.screen-map__container::after {
  display: none !important;
}
.screen-map__title-bar {
  position: relative;
  z-index: 5;
  margin: 0;
  padding: 12px 14px 8px;
  background: linear-gradient(180deg, rgba(4,18,43,0.72), transparent);
}
.screen-map__city-decor {
  position: absolute;
  inset: 46px 18px 18px;
  z-index: 2;
  pointer-events: none;
}
.screen-map__decor-node {
  position: absolute;
  min-width: 112px;
  padding: 7px 10px 7px 42px;
  border-radius: 9px;
  background: rgba(4,18,43,0.62);
  border: 1px solid currentColor;
  color: #00D4FF;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 0 18px currentColor;
}
.screen-map__decor-node::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 10px color-mix(in srgb, currentColor 18%, transparent), 0 0 24px currentColor;
}
.screen-map__decor-node::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 34px;
  width: 160px;
  height: 1px;
  background: linear-gradient(90deg, currentColor, transparent);
  opacity: 0.58;
  transform-origin: left center;
}
.screen-map__decor-node small {
  display: block;
  margin-top: 2px;
  color: rgba(255,255,255,0.72);
  font-size: 10px;
  font-weight: 700;
}
.screen-map__decor-node--green { left: 8%; top: 14%; color: #20E6A4; }
.screen-map__decor-node--red { right: 7%; top: 12%; color: #FF5650; }
.screen-map__decor-node--yellow { left: 10%; bottom: 18%; color: #FFB03A; }
.screen-map__decor-node--cyan { right: 8%; top: 48%; color: #18E9FF; }
.screen-map__decor-node--blue { right: 13%; bottom: 18%; color: #48B6FF; }
.screen-map__decor-node--green::after { transform: rotate(18deg); }
.screen-map__decor-node--red::after { transform: rotate(160deg); }
.screen-map__decor-node--yellow::after { transform: rotate(-16deg); }
.screen-map__decor-node--cyan::after { transform: rotate(180deg); }
.screen-map__decor-node--blue::after { transform: rotate(-154deg); }
.screen-map__fallback-list {
  position: absolute;
  inset: 46px 18px 18px;
  display: block;
  overflow: visible;
  z-index: 4;
}
.screen-map__point {
  position: absolute;
  width: 148px;
  min-height: 48px;
  padding: 8px 10px 8px 44px;
  border-radius: 10px;
  background: rgba(4,18,43,0.78);
  border: 1px solid rgba(0,212,255,0.32);
  box-shadow: 0 0 18px rgba(0,132,255,0.25);
  backdrop-filter: blur(6px);
}
.screen-map__point:nth-child(1) { left: 48%; top: 43%; transform: translate(-50%, -50%); border-color: rgba(255,68,68,0.55); }
.screen-map__point:nth-child(2) { left: 8%; top: 20%; }
.screen-map__point:nth-child(3) { right: 9%; top: 18%; }
.screen-map__point:nth-child(4) { left: 12%; bottom: 20%; }
.screen-map__point:nth-child(5) { right: 12%; bottom: 22%; }
.screen-map__point:nth-child(6) { left: 36%; top: 18%; }
.screen-map__point:nth-child(7) { right: 34%; bottom: 12%; }
.screen-map__point:nth-child(n+8) { display: none; }
.screen-map__point::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  width: 24px;
  height: 24px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 18px currentColor;
}
.screen-map__point::after {
  content: '';
  position: absolute;
  left: 24px;
  top: 50%;
  width: 88px;
  height: 1px;
  background: linear-gradient(90deg, currentColor, transparent);
  opacity: 0.45;
  transform-origin: left center;
}
.screen-map__point--red { color: #FF4E45; }
.screen-map__point--orange { color: #FFB03A; }
.screen-map__point--yellow { color: #FCD34D; }
.screen-map__point--green { color: #20E6A4; }
.screen-map__point-name { color: #FFFFFF; font-weight: 800; font-size: 12px; }
.screen-map__point-level { display: block; margin-top: 3px; color: currentColor; font-size: 11px; }
.screen-map__empty {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 6;
  flex: none;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(4,18,43,0.72);
  border: 1px solid rgba(0,212,255,0.28);
  color: rgba(183,214,255,0.75);
  font-size: 11px;
  white-space: nowrap;
}
.screen-building-popup { right: auto; left: 50%; top: 40%; transform: translate(-50%, -50%); border-color: rgba(255,68,68,0.48); }

.screen-board-item,
.screen-hazard-item,
.screen-alarm-entry__item {
  background: rgba(9,36,82,0.72);
  border: 1px solid rgba(0,145,255,0.18);
}
.screen-board-item__count { text-shadow: 0 0 14px currentColor; }

.screen-panel--left,
.screen-panel--right {
  gap: 8px;
}

.screen-side-section,
.screen-trend-card,
.screen-resource-card {
  position: relative;
  padding: 0;
}

.screen-side-section--ring {
  flex-shrink: 0;
}

.screen-side-section--list {
  flex-shrink: 0;
}

.screen-ring-block {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 0 4px;
}

.screen-ring {
  position: relative;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 22px rgba(0, 212, 255, 0.22);
}

.screen-ring::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: rgba(4, 18, 43, 0.92);
  border: 1px solid rgba(0, 145, 255, 0.22);
}

.screen-ring strong,
.screen-ring span {
  position: relative;
  z-index: 1;
}

.screen-ring strong {
  color: #FFFFFF;
  font-size: 22px;
  line-height: 1;
  text-shadow: 0 0 14px rgba(56, 232, 255, 0.44);
}

.screen-ring span {
  margin-top: 3px;
  color: #A8CFFF;
  font-size: 10px;
}

.screen-ring-legend {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.screen-ring-legend__item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #A8CFFF;
  font-size: 11px;
  white-space: nowrap;
}
.screen-ring-legend__item em {
  flex: 1;
  min-width: 0;
}
.screen-ring-legend__item strong {
  min-width: 20px;
  text-align: right;
}

.screen-ring-legend__item i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.screen-ring-legend__item em {
  font-style: normal;
}

.screen-ring-legend__item strong {
  color: #FFFFFF;
  font-size: 12px;
}

.screen-type-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
}

.screen-type-bar {
  display: grid;
  grid-template-columns: 58px 1fr 32px;
  gap: 8px;
  align-items: center;
  color: #A8CFFF;
  font-size: 11px;
}

.screen-type-bar div {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 145, 255, 0.16);
}

.screen-type-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1B6FE8, #38E8FF);
  box-shadow: 0 0 10px rgba(56, 232, 255, 0.45);
}

.screen-type-bar strong {
  color: #FFFFFF;
  font-size: 12px;
  text-align: right;
}

.screen-hazard-list__items {
  min-height: 0;
  max-height: 210px;
}

.screen-status-strip,
.screen-resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding-top: 8px;
}

.screen-resource-grid {
  grid-template-columns: repeat(4, 1fr);
}

.screen-status-item,
.screen-resource-item {
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid rgba(0, 145, 255, 0.22);
  border-radius: 7px;
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}

.screen-status-item span,
.screen-resource-item span {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #38E8FF;
  border: 1px solid rgba(56, 232, 255, 0.38);
  box-shadow: 0 0 12px rgba(56, 232, 255, 0.25);
  font-size: 11px;
  font-weight: 900;
}

.screen-status-item strong,
.screen-resource-item strong {
  color: #FFFFFF;
  font-size: 13px;
  line-height: 1;
  text-shadow: 0 0 12px rgba(56, 232, 255, 0.36);
}

.screen-status-item em,
.screen-resource-item em {
  color: #8CB9EA;
  font-size: 10px;
  font-style: normal;
}

.screen-trend-card {
  flex-shrink: 0;
  padding-top: 2px;
}

.screen-trend-chart {
  height: 72px;
  display: flex;
  align-items: flex-end;
  gap: 9px;
  padding: 10px 6px 6px;
  border-bottom: 1px solid rgba(0, 145, 255, 0.22);
  background:
    linear-gradient(rgba(56,232,255,0.08) 1px, transparent 1px) 0 0 / 100% 18px,
    linear-gradient(180deg, rgba(0, 212, 255, 0.05), transparent);
}

.screen-trend-chart span {
  flex: 1;
  min-height: 12px;
  border-radius: 999px 999px 2px 2px;
  background: linear-gradient(180deg, #38E8FF, #1B6FE8);
  box-shadow: 0 0 14px rgba(56, 232, 255, 0.4);
}

.screen-trend-labels {
  display: flex;
  justify-content: space-between;
  color: #8CB9EA;
  font-size: 10px;
  padding-top: 4px;
}

.screen-resource-card {
  flex-shrink: 0;
}

.screen-footer {
  position: relative;
  height: 112px;
  margin: 0 10px 10px;
  padding: 0 22px;
}
.screen-footer__status-text {
  position: absolute;
  right: 16px;
  top: 9px;
  color: #33F6A2;
  font-size: 11px;
  font-weight: 800;
}
.screen-command-timeline {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: center;
  gap: 0;
}
.screen-command-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #BBD9FF;
}
.screen-command-node:not(:last-child)::after {
  content: '';
  position: absolute;
  left: calc(50% + 30px);
  top: 21px;
  width: calc(100% - 60px);
  height: 2px;
  background: linear-gradient(90deg, currentColor, rgba(255,255,255,0.08));
  box-shadow: 0 0 12px currentColor;
}
.screen-command-node__icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid currentColor;
  background: rgba(255,255,255,0.08);
  font-weight: 900;
  box-shadow: 0 0 18px currentColor;
}
.screen-command-node strong { color: #FFFFFF; font-size: 13px; }
.screen-command-node small { color: #82A9D8; font-size: 11px; }
.screen-command-node--red { color: #FF5650; }
.screen-command-node--orange { color: #FFB03A; }
.screen-command-node--blue { color: #48B6FF; }

@media (max-width: 1000px) {
  .screen-header {
    height: 64px;
    padding: 0 12px;
  }
  .screen-header::after { width: 420px; height: 64px; }
  .screen-header__left { gap: 8px; max-width: 260px; }
  .screen-header__logo-text { width: 34px; height: 34px; font-size: 13px; }
  .screen-header__center { top: 8px; width: 410px; }
  .screen-header__title { font-size: 17px; max-width: 410px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .screen-header__nav { gap: 12px; font-size: 10px; }
  .screen-header__nav span:not(:last-child)::after { right: -8px; }
  .screen-header__time { font-size: 14px; }
  .screen-header__weather { font-size: 10px; }
  .screen-header__location { display: none; }
  .screen-header__user { min-width: 54px; padding: 5px 8px; font-size: 11px; }
  .screen-kpi-ribbon {
    height: 84px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    padding: 0 10px;
    gap: 4px;
  }
  .screen-kpi-ribbon .screen-kpi-item { padding-left: 34px; }
  .screen-kpi-ribbon .screen-kpi-item::before { width: 26px; height: 26px; }
  .screen-kpi-item__label { font-size: 10px; }
  .screen-kpi-item__value { font-size: 22px; }
  .screen-kpi-item__unit { font-size: 10px; }
  .screen-main {
    grid-template-columns: 250px minmax(260px, 1fr) 250px;
    gap: 10px;
  }
  .screen-command-node strong { font-size: 12px; }
  .screen-command-node small { display: none; }
}

@media (max-height: 650px) {
  .screen-header {
    height: 56px;
    padding: 0 12px;
  }
  .screen-header::after { height: 56px; width: 440px; }
  .screen-header__logo-text { width: 32px; height: 32px; font-size: 12px; }
  .screen-header__center { top: 5px; width: 430px; }
  .screen-header__title { font-size: 17px; }
  .screen-header__nav { margin-top: 2px; font-size: 10px; gap: 14px; }
  .screen-header__time { font-size: 14px; }
  .screen-header__weather { font-size: 10px; }
  .screen-header__user { min-width: 54px; padding: 4px 8px; font-size: 11px; }

  .screen-kpi-ribbon {
    height: 68px;
    margin: 6px 8px 0;
    padding: 0 10px;
    gap: 4px;
  }
  .screen-kpi-ribbon .screen-kpi-item { padding-left: 34px; }
  .screen-kpi-ribbon .screen-kpi-item::before { width: 26px; height: 26px; border-radius: 8px; }
  .screen-kpi-item__label { font-size: 10px; }
  .screen-kpi-item__value { font-size: 21px; }
  .screen-kpi-item__unit { font-size: 9px; }

  .screen-main {
    grid-template-columns: 250px minmax(260px, 1fr) 260px;
    gap: 8px;
    padding: 8px;
  }
  .screen-panel--left,
  .screen-panel--right { padding: 9px; gap: 5px; }
  .screen-panel__title { font-size: 12px; line-height: 16px; padding-bottom: 3px; }
  .screen-panel__badge { font-size: 10px; padding: 0 5px; }

  .screen-ring-block { grid-template-columns: 60px 1fr; gap: 6px; padding: 4px 0 1px; }
  .screen-ring { width: 56px; height: 56px; }
  .screen-ring::before { inset: 8px; }
  .screen-ring strong { font-size: 16px; }
  .screen-ring span { font-size: 9px; }
  .screen-ring-legend { gap: 2px; }
  .screen-ring-legend__item { font-size: 10px; gap: 5px; }
  .screen-type-bars { gap: 3px; padding-top: 4px; }
  .screen-type-bar { grid-template-columns: 50px 1fr 24px; gap: 6px; font-size: 10px; }
  .screen-type-bar div { height: 4px; }
  .screen-hazard-list__items { max-height: 24px; gap: 2px; }
  .screen-hazard-item { padding: 4px 6px; }
  .screen-hazard-list__empty { padding: 2px 0; font-size: 10px; }
  .screen-status-strip { gap: 4px; padding-top: 5px; }
  .screen-status-item { min-height: 26px; }
  .screen-status-item span,
  .screen-resource-item span { width: 18px; height: 18px; font-size: 9px; }
  .screen-status-item strong,
  .screen-resource-item strong { font-size: 10px; }
  .screen-status-item em,
  .screen-resource-item em { font-size: 9px; }

  .screen-map__container::after { width: 56px; height: 56px; font-size: 32px; }
  .screen-map__decor-node {
    min-width: 88px;
    padding: 5px 7px 5px 31px;
    font-size: 10px;
    border-radius: 7px;
  }
  .screen-map__decor-node::before { left: 8px; width: 16px; height: 16px; }
  .screen-map__decor-node::after { left: 25px; width: 96px; }
  .screen-map__decor-node small { font-size: 9px; }
  .screen-map__decor-node--green { left: 4%; top: 17%; }
  .screen-map__decor-node--red { right: 5%; top: 17%; }
  .screen-map__decor-node--yellow { left: 6%; bottom: 18%; }
  .screen-map__decor-node--cyan { right: 5%; top: 50%; }
  .screen-map__decor-node--blue { right: 14%; bottom: 18%; }

  .screen-board { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
  .screen-board-item { padding: 4px; gap: 1px; min-height: 40px; }
  .screen-board-item__count { font-size: 18px; }
  .screen-board-item__label { font-size: 10px; }
  .screen-panel__divider { margin: 2px 0; }
  .screen-quick-links { display: none; }
  .screen-trend-chart { height: 32px; gap: 6px; padding: 4px 5px; }
  .screen-trend-labels { font-size: 9px; }
  .screen-alarm-entry { flex: 0 0 auto; gap: 3px; padding-top: 4px; }
  .screen-alarm-entry__list { max-height: 22px; }
  .screen-alarm-entry__item { padding: 3px 6px; }
  .screen-alarm-entry__empty { padding: 1px 0; font-size: 10px; }
  .screen-alarm-entry__link { padding: 4px 8px; font-size: 10px; }
  .screen-resource-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding-top: 5px; }
  .screen-resource-item { min-height: 32px; }

  .screen-footer {
    height: 58px;
    margin: 0 8px 8px;
    padding: 0 16px;
  }
  .screen-footer__status-text { top: 3px; font-size: 10px; }
  .screen-command-node { gap: 2px; }
  .screen-command-node__icon { width: 26px; height: 26px; font-size: 11px; }
  .screen-command-node strong { font-size: 10px; }
  .screen-command-node small { display: none; }
  .screen-command-node:not(:last-child)::after { top: 13px; left: calc(50% + 20px); width: calc(100% - 40px); }
}

/* ===== IoT 实时数据 mini 面板 ===== */
.screen-iot-panel {
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.screen-panel__title-bar--iot {
  background: linear-gradient(180deg, #38BDF8 0%, transparent 100%);
}
.screen-iot-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.screen-iot-point {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 6px;
}
.screen-iot-point__label {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
  min-width: 52px;
}
.screen-iot-point__value {
  font-size: 16px;
  font-weight: 700;
  text-align: right;
}
.screen-iot-point__unit {
  font-size: 10px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}
.screen-iot--green  { color: #34D399; }
.screen-iot--orange { color: #FBBF24; }
.screen-iot--red    { color: #F87171; }
.screen-iot-sparkline {
  grid-column: 1 / -1;
  display: flex;
  gap: 2px;
  height: 14px;
  margin-top: 2px;
}
.screen-iot-sparkline__bar {
  flex: 1;
  min-width: 4px;
  border-radius: 2px;
  opacity: 0.85;
}
.bar-green  { background: #34D399; }
.bar-orange { background: #FBBF24; }
.bar-red    { background: #F87171; }
.bar-gray   { background: rgba(255,255,255,0.2); }
.screen-iot-empty {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.4));
  padding: 8px 0;
}

/* ===== 首页专项修正：真实图标 / ECharts / 蓝色网格模拟地图 ===== */
.screen-header__logo-text img,
.screen-kpi-item__icon,
.screen-status-item img,
.screen-resource-item img {
  width: 100%;
  height: 100%;
  display: block;
}

.screen-header__logo-text img {
  width: 24px;
  height: 24px;
}

.screen-kpi-item__icon {
  position: absolute;
  left: 11px;
  top: 50%;
  z-index: 1;
  width: 24px;
  height: 24px;
  transform: translateY(-50%);
  filter: drop-shadow(0 0 8px rgba(56, 232, 255, 0.58));
}

.screen-trend-card {
  min-height: 144px;
}

.screen-trend-chart {
  height: 112px;
  display: block;
  padding: 0;
  border-bottom: 0;
  background:
    linear-gradient(rgba(56,232,255,0.07) 1px, transparent 1px) 0 0 / 100% 22px,
    linear-gradient(180deg, rgba(0, 212, 255, 0.05), transparent);
}

.screen-trend-echart {
  width: 100%;
  height: 112px;
}

.screen-trend-labels {
  display: none;
}

.screen-ring-block {
  grid-template-columns: 82px 1fr;
  padding: 7px 0 2px;
}

.screen-ring {
  width: 78px;
  height: 78px;
}

.screen-ring strong {
  font-size: 20px;
}

.screen-type-bars {
  gap: 4px;
  padding-top: 6px;
}

.screen-type-bar {
  grid-template-columns: 58px 1fr 28px;
}

.screen-resource-grid,
.screen-status-strip {
  gap: 5px;
  padding-top: 6px;
}

.screen-resource-item,
.screen-status-item {
  min-height: 42px;
}

.screen-status-item span,
.screen-resource-item span {
  width: 22px;
  height: 22px;
  padding: 4px;
}

.screen-status-item strong,
.screen-resource-item strong {
  font-size: 12px;
}

.screen-status-item em,
.screen-resource-item em {
  font-size: 9px;
}

.screen-map__container {
  background:
    radial-gradient(circle at 50% 48%, rgba(56, 232, 255, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(6, 37, 88, 0.96), rgba(3, 16, 40, 0.94));
}

.screen-map__container::before {
  inset: 44px 0 0;
  background:
    linear-gradient(rgba(79, 180, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 180, 255, 0.12) 1px, transparent 1px),
    repeating-linear-gradient(31deg, rgba(45, 149, 255, 0.12) 0 2px, transparent 2px 34px),
    linear-gradient(180deg, #0A326B 0%, #041B42 100%);
  background-size: 34px 34px, 34px 34px, auto, auto;
  filter: saturate(1.22) brightness(1.06);
}

.screen-map__container::after {
  content: '';
  left: 50%;
  top: 50%;
  width: 126px;
  height: 126px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(56, 232, 255, 0.24);
  background: radial-gradient(circle, rgba(56, 232, 255, 0.16), rgba(27, 111, 232, 0.04) 58%, transparent 60%);
  box-shadow: 0 0 0 32px rgba(56, 232, 255, 0.035), 0 0 42px rgba(56, 232, 255, 0.18);
  color: transparent;
  z-index: 1;
}

.screen-map__mock-layer {
  position: absolute;
  inset: 46px 18px 18px;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}

.screen-map__district {
  position: absolute;
  border: 1px solid rgba(82, 188, 255, 0.38);
  background: rgba(27, 111, 232, 0.08);
  box-shadow: inset 0 0 28px rgba(56, 232, 255, 0.05), 0 0 16px rgba(27, 111, 232, 0.08);
}

.screen-map__district--a {
  left: 7%;
  top: 12%;
  width: 38%;
  height: 36%;
  clip-path: polygon(0 18%, 72% 0, 100% 38%, 78% 100%, 14% 82%);
}

.screen-map__district--b {
  right: 7%;
  top: 10%;
  width: 39%;
  height: 40%;
  clip-path: polygon(18% 0, 100% 12%, 88% 80%, 42% 100%, 0 42%);
}

.screen-map__district--c {
  left: 10%;
  bottom: 10%;
  width: 42%;
  height: 38%;
  clip-path: polygon(6% 14%, 64% 0, 100% 46%, 74% 100%, 0 86%);
}

.screen-map__district--d {
  right: 8%;
  bottom: 11%;
  width: 38%;
  height: 36%;
  clip-path: polygon(24% 0, 100% 24%, 86% 100%, 18% 82%, 0 32%);
}

.screen-map__road {
  position: absolute;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(56, 232, 255, 0.56), transparent);
  box-shadow: 0 0 12px rgba(56, 232, 255, 0.28);
}

.screen-map__road--main {
  left: 6%;
  right: 6%;
  top: 52%;
  transform: rotate(-7deg);
}

.screen-map__road--north {
  left: 18%;
  right: 20%;
  top: 34%;
  transform: rotate(18deg);
}

.screen-map__road--south {
  left: 16%;
  right: 12%;
  bottom: 26%;
  transform: rotate(13deg);
}

.screen-map__scanline {
  position: absolute;
  left: -20%;
  top: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(56, 232, 255, 0.12), transparent);
  animation: mapScan 5.5s linear infinite;
}

.screen-map__fallback-list {
  z-index: 5;
}

.screen-map__fallback-list .screen-map__point,
.screen-map__fallback-list .screen-map__point:nth-child(n) {
  right: auto;
  bottom: auto;
  display: flex;
  width: 126px;
  min-height: 34px;
  padding: 7px 9px 7px 34px;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: rgba(3, 16, 40, 0.76);
}

.screen-map__point::before {
  left: 10px;
  width: 16px;
  height: 16px;
}

.screen-map__point::after {
  left: 22px;
  width: 54px;
}

.screen-map__point-dot {
  display: none;
}

.screen-map__point-name {
  color: #FFFFFF;
  font-size: 11px;
  line-height: 1.25;
  white-space: normal;
}

.screen-map__point-level {
  display: none;
}

.screen-building-popup.screen-glass-card {
  position: absolute;
  left: auto;
  right: 14px;
  top: 58px;
  width: 238px;
  transform: none;
  z-index: 8;
  border-color: rgba(56, 232, 255, 0.42);
}

.screen-command-node__icon img {
  width: 22px;
  height: 22px;
  display: block;
  filter: drop-shadow(0 0 8px currentColor);
}

.screen-popup-enter-from,
.screen-popup-leave-to {
  transform: translateY(-8px) scale(0.98);
}

.screen-panel--right {
  min-height: 0;
}

.screen-panel--right [data-zone="workorder-board"] {
  flex: 0 0 auto;
}

.screen-panel--right .screen-board {
  gap: 6px;
}

.screen-panel--right .screen-board-item {
  min-height: 62px;
  padding: 8px 5px;
}

.screen-panel--right .screen-quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.screen-panel--right .screen-quick-link {
  padding: 7px 6px;
  font-size: 12px;
}

.screen-alarm-entry {
  flex: 0 0 128px;
  min-height: 0;
}

.screen-alarm-entry__list {
  max-height: 48px;
}

.screen-iot-panel {
  flex: 1 1 150px;
  min-height: 138px;
  overflow: hidden;
  padding: 8px 0 0;
  border-top: 1px solid rgba(0, 145, 255, 0.22);
}

.screen-iot-panel__name {
  margin-left: auto;
  max-width: 118px;
  overflow: hidden;
  color: #38E8FF;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.screen-iot-points {
  max-height: 100px;
  overflow-y: auto;
  padding-right: 3px;
  gap: 4px;
}

.screen-iot-point {
  grid-template-columns: 56px 1fr auto;
  padding: 4px 6px;
  border: 1px solid rgba(0, 145, 255, 0.16);
  border-radius: 7px;
  background: rgba(8, 45, 102, 0.46);
}

.screen-iot-point__label {
  min-width: 0;
  font-size: 10px;
}

.screen-iot-point__value {
  font-size: 14px;
}

.screen-iot-sparkline {
  height: 7px;
  margin-top: 1px;
}

@keyframes mapScan {
  0% { transform: translateX(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateX(460%); opacity: 0; }
}

@media (max-height: 650px) {
  .screen-trend-card { min-height: 96px; }
  .screen-trend-chart,
  .screen-trend-echart { height: 76px; }
  .screen-iot-panel { flex-basis: 124px; padding-top: 5px; }
  .screen-iot-points { max-height: 86px; gap: 4px; }
  .screen-iot-point { padding: 3px 5px; }
  .screen-map__fallback-list .screen-map__point,
  .screen-map__fallback-list .screen-map__point:nth-child(n) {
    width: 104px;
    min-height: 28px;
    padding: 5px 7px 5px 28px;
  }
  .screen-map__point-name { font-size: 10px; }
}

/* ===== 首页空间重排：把空间让给告警和实时数据 ===== */
.screen-root {
  background:
    radial-gradient(ellipse at 50% 58%, rgba(45, 190, 255, 0.34), transparent 46%),
    radial-gradient(circle at 50% 11%, rgba(80, 178, 255, 0.58), transparent 28%),
    radial-gradient(circle at 18% 22%, rgba(0, 130, 255, 0.34), transparent 24%),
    radial-gradient(circle at 82% 20%, rgba(0, 224, 255, 0.28), transparent 24%),
    linear-gradient(180deg, #041B4C 0%, #063B8B 43%, #041634 100%);
}

.screen-root::before {
  background:
    linear-gradient(rgba(115, 211, 255, 0.11) 1px, transparent 1px),
    linear-gradient(90deg, rgba(115, 211, 255, 0.10) 1px, transparent 1px),
    radial-gradient(circle at 50% 46%, rgba(53, 162, 255, 0.28), transparent 44%);
  background-size: 36px 36px, 36px 36px, 100% 100%;
}

.screen-root::after {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34%;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(0, 212, 255, 0.28), transparent 58%),
    linear-gradient(180deg, transparent, rgba(0, 81, 196, 0.24));
  z-index: 0;
}

.screen-root > * {
  position: relative;
  z-index: 1;
}

.screen-main {
  grid-template-columns: 310px minmax(0, 1fr) 322px;
  gap: 8px;
  padding: 8px 10px 8px;
  min-height: 0;
}

.screen-panel,
.screen-glass-card {
  border-color: rgba(84, 199, 255, 0.78);
  background:
    linear-gradient(180deg, rgba(8, 56, 132, 0.9), rgba(3, 24, 67, 0.82)),
    radial-gradient(circle at 50% 0%, rgba(0, 224, 255, 0.16), transparent 64%);
  box-shadow:
    0 0 30px rgba(0, 150, 255, 0.32),
    inset 0 0 30px rgba(31, 128, 255, 0.18),
    inset 0 1px 0 rgba(179, 232, 255, 0.24);
}

.screen-panel__title,
.screen-map__title-bar {
  color: #F2FBFF;
  border-bottom-color: rgba(77, 190, 255, 0.32);
  text-shadow: 0 0 12px rgba(72, 182, 255, 0.32);
}

.screen-panel__title-bar {
  background: linear-gradient(180deg, #65F4FF, #1687FF);
  box-shadow: 0 0 12px rgba(101, 244, 255, 0.82);
}

.screen-panel--left {
  display: grid;
  grid-template-rows: minmax(90px, 0.92fr) minmax(70px, 0.62fr) minmax(122px, 1.08fr) minmax(66px, 0.56fr) minmax(66px, 0.58fr);
  gap: 8px;
  padding: 10px;
  min-height: 0;
}

.screen-side-section,
.screen-trend-card,
.screen-resource-card {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.screen-side-section .screen-panel__title,
.screen-resource-card .screen-panel__title,
.screen-trend-card .screen-panel__title {
  flex: 0 0 auto;
}

.screen-ring-block {
  grid-template-columns: 76px 1fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
  padding: 5px 0 0;
}

.screen-ring {
  width: 72px;
  height: 72px;
}

.screen-ring::before {
  inset: 10px;
}

.screen-ring strong {
  font-size: 19px;
}

.screen-ring span {
  font-size: 9px;
}

.screen-ring-legend {
  justify-content: center;
  gap: 3px;
}

.screen-ring-legend__item {
  font-size: 10px;
}

.screen-type-bars {
  flex: 1;
  justify-content: center;
  gap: 4px;
  padding-top: 5px;
}

.screen-type-bar {
  grid-template-columns: 56px 1fr 26px;
  gap: 6px;
}

.screen-trend-card {
  min-height: 0;
}

.screen-trend-chart,
.screen-trend-echart {
  flex: 1;
  height: auto;
  min-height: 92px;
}

.screen-resource-grid,
.screen-status-strip {
  flex: 1;
  align-items: stretch;
  gap: 5px;
  padding-top: 5px;
}

.screen-resource-item,
.screen-status-item {
  min-height: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(12, 72, 160, 0.68), rgba(4, 30, 82, 0.58));
}

.screen-status-item span,
.screen-resource-item span {
  width: 20px;
  height: 20px;
  padding: 4px;
  border-color: rgba(101, 244, 255, 0.52);
  box-shadow: 0 0 13px rgba(101, 244, 255, 0.34);
}

.screen-status-item strong,
.screen-resource-item strong {
  font-size: 12px;
}

.screen-status-item em,
.screen-resource-item em {
  font-size: 9px;
}

.screen-panel--right {
  display: grid;
  grid-template-rows: auto minmax(142px, 0.98fr) minmax(172px, 1.22fr);
  gap: 8px;
  padding: 10px;
  min-height: 0;
}

.screen-panel--right [data-zone="workorder-board"] {
  min-height: 0;
}

.screen-panel--right .screen-board {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
}

.screen-panel--right .screen-board-item {
  min-height: 46px;
  padding: 5px 4px;
}

.screen-board-item__count {
  font-size: 22px;
}

.screen-board-item__label {
  font-size: 10px;
}

.screen-panel--right .screen-quick-links {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}

.screen-panel--right .screen-quick-link {
  padding: 5px 4px;
  font-size: 10px;
}

.screen-panel__divider {
  margin: 3px 0;
}

.screen-alarm-entry {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 6px;
  border-top-color: rgba(77, 190, 255, 0.26);
}

.screen-alarm-entry__list {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  padding-right: 5px;
}

.screen-alarm-entry__item {
  min-height: 24px;
  padding: 4px 6px;
  background: linear-gradient(180deg, rgba(9, 58, 132, 0.70), rgba(4, 29, 78, 0.58));
}

.screen-alarm-entry__link {
  flex: 0 0 auto;
  padding: 5px 8px;
}

.screen-iot-panel {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 7px 0 0;
  border-top-color: rgba(77, 190, 255, 0.26);
}

.screen-iot-points {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  gap: 5px;
  margin-top: 6px;
  padding-right: 5px;
}

.screen-iot-point {
  grid-template-columns: minmax(52px, 0.72fr) minmax(48px, 0.72fr) auto;
  padding: 4px 6px;
  border-color: rgba(77, 190, 255, 0.22);
  background: linear-gradient(180deg, rgba(10, 68, 150, 0.56), rgba(4, 30, 82, 0.48));
}

.screen-iot-point__value {
  font-size: 13px;
}

.screen-iot-sparkline {
  height: 8px;
}

.screen-alarm-entry__list,
.screen-iot-points,
.screen-hazard-list__items,
.screen-map__fallback-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(101, 244, 255, 0.82) rgba(6, 38, 96, 0.42);
}

.screen-alarm-entry__list::-webkit-scrollbar,
.screen-iot-points::-webkit-scrollbar,
.screen-hazard-list__items::-webkit-scrollbar,
.screen-map__fallback-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.screen-alarm-entry__list::-webkit-scrollbar-track,
.screen-iot-points::-webkit-scrollbar-track,
.screen-hazard-list__items::-webkit-scrollbar-track,
.screen-map__fallback-list::-webkit-scrollbar-track {
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(6, 38, 96, 0.38), rgba(3, 20, 58, 0.62));
  border: 1px solid rgba(77, 190, 255, 0.18);
}

.screen-alarm-entry__list::-webkit-scrollbar-thumb,
.screen-iot-points::-webkit-scrollbar-thumb,
.screen-hazard-list__items::-webkit-scrollbar-thumb,
.screen-map__fallback-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: linear-gradient(180deg, #65F4FF, #1687FF 62%, #0B5FDB);
  border: 1px solid rgba(190, 244, 255, 0.38);
  box-shadow: 0 0 10px rgba(101, 244, 255, 0.55);
}

.screen-footer {
  height: 74px;
  margin: 0 10px 8px;
  padding: 0 20px;
  border-color: rgba(84, 199, 255, 0.76);
  background:
    linear-gradient(180deg, rgba(8, 56, 132, 0.86), rgba(3, 24, 67, 0.78)),
    radial-gradient(ellipse at 50% 0%, rgba(0, 224, 255, 0.14), transparent 60%);
}

.screen-footer__status-text {
  top: 5px;
  color: #33F6A2;
}

.screen-command-node {
  gap: 3px;
}

.screen-command-node:not(:last-child)::after {
  left: calc(50% + 25px);
  top: 17px;
  width: calc(100% - 50px);
  height: 2px;
  background: linear-gradient(90deg, currentColor, rgba(101, 244, 255, 0.20), transparent);
}

.screen-command-node__icon {
  width: 34px;
  height: 34px;
  border: 1px solid currentColor;
  background:
    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.32), transparent 34%),
    linear-gradient(145deg, rgba(19, 104, 240, 0.72), rgba(0, 212, 255, 0.22));
  box-shadow: 0 0 20px currentColor, inset 0 0 14px rgba(255, 255, 255, 0.10);
}

.screen-command-node__icon img {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 0 8px currentColor) brightness(1.18);
}

.screen-command-node strong {
  font-size: 12px;
}

.screen-command-node small {
  font-size: 10px;
  color: #A8D7FF;
}

@media (max-height: 650px) {
  .screen-main {
    grid-template-columns: 270px minmax(260px, 1fr) 286px;
  }

  .screen-panel--left {
    grid-template-rows: minmax(58px, 0.85fr) minmax(50px, 0.58fr) minmax(82px, 1fr) minmax(42px, 0.5fr) minmax(42px, 0.5fr);
    gap: 5px;
  }

  .screen-panel--right {
    grid-template-rows: auto minmax(104px, 0.9fr) minmax(126px, 1.08fr);
    gap: 5px;
  }

  .screen-panel--right .screen-board-item {
    min-height: 34px;
  }

  .screen-board-item__count {
    font-size: 18px;
  }

  .screen-panel--right .screen-quick-link {
    padding: 4px 3px;
    font-size: 9px;
  }

  .screen-trend-chart,
  .screen-trend-echart {
    min-height: 62px;
    height: auto;
  }

  .screen-alarm-entry__list,
  .screen-iot-points {
    max-height: none;
  }

  .screen-footer {
    height: 56px;
  }

  .screen-command-node__icon {
    width: 26px;
    height: 26px;
  }

  .screen-command-node__icon img {
    width: 16px;
    height: 16px;
  }

  .screen-command-node strong {
    font-size: 10px;
  }

  .screen-command-node small {
    display: none;
  }

  .screen-command-node:not(:last-child)::after {
    top: 13px;
    left: calc(50% + 20px);
    width: calc(100% - 40px);
  }
}

/* ===== 最终覆盖：深色背景 + 字号放大 + ECharts 容器 + 右侧布局贴底 ===== */
/* 1) 深色背景：参考图2深海蓝，纯净无杂色 */
.screen-root {
  background: #020D1F !important;
}
.screen-root::before {
  background:
    linear-gradient(rgba(0, 180, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.04) 1px, transparent 1px) !important;
  background-size: 48px 48px, 48px 48px !important;
  opacity: 1;
}
.screen-root::after { display: none !important; }

.screen-panel,
.screen-glass-card {
  background: rgba(5, 22, 55, 0.58) !important;
  border: 1px solid rgba(0, 180, 255, 0.35) !important;
  box-shadow:
    0 0 0 1px rgba(0, 200, 255, 0.08),
    0 0 28px rgba(0, 100, 200, 0.22),
    inset 0 1px 0 rgba(180, 230, 255, 0.10) !important;
}

/* 2) ECharts 容器尺寸 */
.screen-ring-echart {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}
.screen-hazard-type-echart {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100%;
}
.screen-side-section--ring .screen-ring-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding: 6px 0 4px;
}

/* 3) 左侧字号统一加大 */
.screen-panel--left .screen-panel__title {
  font-size: 14px !important;
  font-weight: 700 !important;
  flex-shrink: 0;
}
.screen-ring-legend__item { font-size: 12px !important; }
.screen-ring-legend__item strong { font-size: 13px !important; min-width: 18px !important; text-align: right !important; }
.screen-ring-legend__item i { width: 8px !important; height: 8px !important; flex-shrink: 0 !important; }
.screen-ring-legend { gap: 4px !important; }

/* 资源统计/系统运行状态：确保内容不被截断 */
.screen-resource-card,
.screen-side-section--status {
  overflow: visible !important;
}
.screen-resource-grid,
.screen-status-strip {
  overflow: visible !important;
  padding-top: 4px !important;
  gap: 5px !important;
}
.screen-status-item strong,
.screen-resource-item strong {
  font-size: 14px !important;
  line-height: 1 !important;
}
.screen-status-item em,
.screen-resource-item em {
  font-size: 11px !important;
  margin-top: 1px !important;
}
.screen-status-item span,
.screen-resource-item span {
  width: 24px !important;
  height: 24px !important;
}
.screen-status-item,
.screen-resource-item {
  min-height: 0 !important;
  padding: 5px 3px !important;
  gap: 3px !important;
}

/* KPI 字号 */
.screen-kpi-item__label { font-size: 12px !important; font-weight: 700 !important; }
.screen-kpi-item__value { font-size: 30px !important; }
.screen-kpi-item__unit { font-size: 12px !important; }

/* KPI行均匀分布（解决左侧无间距、右侧大空白） */
.screen-kpi-ribbon {
  display: flex !important;
  justify-content: space-around !important;
  padding: 0 8px !important;
}
.screen-kpi-ribbon .screen-kpi-item {
  flex: 1 !important;
  max-width: 200px !important;
  padding-left: 52px !important;
  min-width: 0 !important;
}

/* 工单趋势：去掉所有横线背景，单纯 ECharts */
.screen-trend-chart {
  background: none !important;
  border-bottom: none !important;
  padding: 0 !important;
}
.screen-trend-chart,
.screen-trend-echart {
  flex: 1 !important;
  min-height: 110px !important;
  height: 100% !important;
}
.screen-trend-labels { display: none !important; }

/* 4) 左侧 grid：让 5 个区域均匀分布、确保资源/状态行足够高 */
.screen-panel--left {
  grid-template-rows:
    minmax(108px, 1.0fr)
    minmax(108px, 1.0fr)
    minmax(128px, 1.1fr)
    minmax(88px, 0.82fr)
    minmax(88px, 0.82fr) !important;
  gap: 8px !important;
  padding: 10px !important;
}

/* 5) 右侧布局：工单看板(auto) + 告警区(1fr填满剩余) + IoT数据(固定高度，3条恰好贴底) */
.screen-panel--right {
  display: grid !important;
  grid-template-rows: auto 1fr 234px !important;
  gap: 8px !important;
  padding: 10px !important;
  overflow: hidden !important;
}
.screen-alarm-entry {
  min-height: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}
.screen-alarm-entry__list {
  flex: 1 !important;
  max-height: none !important;
  overflow-y: auto !important;
}
.screen-iot-panel {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
.screen-iot-points {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
  gap: 6px !important;
  overflow: hidden !important;
  justify-content: space-between !important;
}
.screen-iot-point {
  display: grid !important;
  grid-template-columns: minmax(60px, auto) 1fr auto !important;
  align-items: center !important;
  flex: 1 !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  background: rgba(6, 32, 90, 0.70) !important;
  border: 1px solid rgba(0, 160, 255, 0.30) !important;
}
.screen-iot-sparkline {
  grid-column: 1 / -1 !important;
  height: 7px !important;
  margin-top: 4px !important;
}

/* 右侧字号 */
.screen-panel--right .screen-panel__title { font-size: 14px !important; }
.screen-board-item__count { font-size: 28px !important; }
.screen-board-item__label { font-size: 12px !important; }
.screen-quick-link { font-size: 12px !important; padding: 8px 6px !important; }
.screen-alarm-entry__title { font-size: 12px !important; }
.screen-alarm-entry__level { font-size: 11px !important; }
.screen-iot-point__label { font-size: 13px !important; min-width: 60px !important; color: #B8D8FF !important; }
.screen-iot-point__value { font-size: 18px !important; font-weight: 700 !important; }
.screen-iot-point__unit { font-size: 12px !important; }

/* 6) 底部时间轴：与主背景同色系，不再显得割裂 */
.screen-footer {
  background: rgba(5, 22, 56, 0.88) !important;
  border-color: rgba(0, 180, 255, 0.40) !important;
}
.screen-command-node__icon {
  background: rgba(8, 40, 100, 0.90) !important;
  border: 2px solid currentColor !important;
  box-shadow: 0 0 12px currentColor !important;
}
.screen-command-node:not(:last-child)::after {
  background: currentColor !important;
  opacity: 0.35 !important;
}
.screen-command-node strong {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #FFFFFF !important;
  text-shadow: none !important;
}
.screen-command-node small {
  font-size: 12px !important;
  color: #90BFEF !important;
}
.screen-command-node--red   { color: #FF6055 !important; }
.screen-command-node--orange { color: #FFBA30 !important; }
.screen-command-node--blue  { color: #4DC8FF !important; }

/* ---- 参考图2深度模仿：更高对比、更清晰的面板 ---- */
/* 标题栏 */
.screen-panel__title,
.screen-map__title-bar {
  color: #FFFFFF !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
  text-shadow: 0 0 10px rgba(0, 200, 255, 0.35) !important;
}
.screen-panel__title-bar {
  width: 4px !important;
  background: #00E5FF !important;
  box-shadow: 0 0 10px #00E5FF !important;
}
/* 面板外框加一条顶部亮线 */
.screen-panel::before,
.screen-glass-card::before {
  content: '';
  position: absolute;
  top: 0; left: 4px; right: 4px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 220, 255, 0.6), transparent);
  pointer-events: none;
}
/* KPI 条整体背景 */
.screen-kpi-ribbon {
  background: rgba(4, 20, 54, 0.96) !important;
  border-color: rgba(0, 180, 255, 0.50) !important;
}
/* 工单看板数字 */
.screen-board-item {
  background: rgba(6, 26, 66, 0.85) !important;
  border-color: rgba(0, 150, 255, 0.25) !important;
}
/* 告警条目 */
.screen-alarm-entry__item {
  background: rgba(6, 24, 60, 0.80) !important;
  border-left-width: 3px !important;
}
/* IoT 面板标题 */
.screen-iot-panel .screen-panel__title {
  color: #60DDFF !important;
}
/* IoT 数据值高亮 */
.screen-iot--green  { color: #00F5A0 !important; }
.screen-iot--orange { color: #FFB520 !important; }
.screen-iot--red    { color: #FF5050 !important; }
/* risk dot 辉光 */
.risk-dot--red    { background: #FF4444 !important; box-shadow: 0 0 8px #FF4444, 0 0 18px rgba(255,68,68,0.4) !important; }
.risk-dot--orange { background: #FFB030 !important; box-shadow: 0 0 8px #FFB030, 0 0 18px rgba(255,176,48,0.4) !important; }
.risk-dot--yellow { background: #FFD700 !important; box-shadow: 0 0 8px #FFD700 !important; }
.risk-dot--green  { background: #00E696 !important; box-shadow: 0 0 8px #00E696, 0 0 18px rgba(0,230,150,0.35) !important; }
/* KPI 数值颜色更亮 */
.screen-kpi-item__value { color: #FFFFFF !important; text-shadow: 0 0 14px rgba(0, 200, 255, 0.45) !important; }
.screen-kpi-item__value--warn { color: #FF8040 !important; text-shadow: 0 0 14px rgba(255,128,64,0.5) !important; }
.screen-kpi-item__value--red  { color: #FF4040 !important; text-shadow: 0 0 14px rgba(255,64,64,0.6) !important; }
.screen-kpi-item__value--success { color: #00F5A0 !important; text-shadow: 0 0 14px rgba(0,245,160,0.5) !important; }
.screen-kpi-item__label { color: #7AB8E8 !important; }
.screen-kpi-item__unit { color: #6090B8 !important; }

/* =======================================================================
   全屏地图交互修复：根容器整体穿透，仅 UI 面板恢复事件
   关键原理：pointer-events:none 要设到父容器才能让底层 AMap 收到拖拽事件
   ======================================================================= */

/* 根容器、主区域：全部穿透 → 鼠标事件直达底层 AMap */
.screen-root,
.screen-main,
.screen-map,
.screen-map__container,
.screen-map__loading {
  pointer-events: none !important;
}

/* 有实际交互的 UI 组件恢复事件 */
.screen-header,
.screen-kpi-ribbon,
.screen-panel--left,
.screen-panel--right,
.screen-footer,
.screen-building-popup {
  pointer-events: all !important;
}

/* 建筑详情弹窗单独放行 */
.screen-building-popup {
  pointer-events: all !important;
}

/* =======================================================================
   静态落针图标（全面替换旧版圆点+闪环方案）
   ======================================================================= */

/* 取消所有旧版 beacon/ring 动画 */
:deep(.bldg-pin__ring),
:deep(.bldg-pin__beacon) {
  display: none !important;
  animation: none !important;
}
:deep(.bldg-pin__core) {
  animation: none !important;
}

/* 落针容器 */
:deep(.bldg-pin) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  cursor: pointer !important;
  user-select: none !important;
  width: 50px !important;
  gap: 3px !important;
  transition: transform 0.18s ease, filter 0.15s ease !important;
  filter: none !important;
}
:deep(.bldg-pin:hover) {
  transform: translateY(-5px) scale(1.1) !important;
  filter: brightness(1.25) !important;
}

/* 图标容器 */
:deep(.bldg-pin__icon) {
  width: 26px !important;
  height: 33px !important;
  position: relative !important;
  display: block !important;
}

/* 落针形状：圆+尖角（border-radius 50%50%50%0 + rotate(-45deg)） */
:deep(.bldg-pin__circle) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 26px !important;
  height: 26px !important;
  border-radius: 50% 50% 50% 0 !important;
  transform: rotate(-45deg) !important;
  border: 2.5px solid rgba(255, 255, 255, 0.65) !important;
  animation: none !important;
  /* 内部高光：模拟玻璃质感 */
  box-sizing: border-box !important;
}

/* 绿色（安全） */
:deep(.bldg-pin--green .bldg-pin__circle) {
  background: linear-gradient(135deg, #2DFFC0 0%, #00C896 100%) !important;
  box-shadow:
    0 0 0 3px rgba(32,230,164,0.22),
    0 4px 18px rgba(32,230,164,0.55),
    inset 0 1px 0 rgba(255,255,255,0.35) !important;
}
:deep(.bldg-pin--green .bldg-pin__lbl) { border-color: rgba(32,230,164,0.35) !important; }

/* 橙色（橙色告警） */
:deep(.bldg-pin--orange .bldg-pin__circle) {
  background: linear-gradient(135deg, #FFD060 0%, #FF8C00 100%) !important;
  box-shadow:
    0 0 0 3px rgba(255,176,58,0.22),
    0 4px 18px rgba(255,176,58,0.55),
    inset 0 1px 0 rgba(255,255,255,0.30) !important;
}
:deep(.bldg-pin--orange .bldg-pin__lbl) { border-color: rgba(255,176,58,0.35) !important; }

/* 黄色 */
:deep(.bldg-pin--yellow .bldg-pin__circle) {
  background: linear-gradient(135deg, #FFE870 0%, #F0B800 100%) !important;
  box-shadow:
    0 0 0 3px rgba(252,211,77,0.20),
    0 4px 16px rgba(252,211,77,0.50),
    inset 0 1px 0 rgba(255,255,255,0.30) !important;
}
:deep(.bldg-pin--yellow .bldg-pin__lbl) { border-color: rgba(252,211,77,0.35) !important; }

/* 红色（紧急） */
:deep(.bldg-pin--red .bldg-pin__circle) {
  background: linear-gradient(135deg, #FF7060 0%, #E82020 100%) !important;
  box-shadow:
    0 0 0 4px rgba(255,78,69,0.24),
    0 4px 22px rgba(255,78,69,0.65),
    inset 0 1px 0 rgba(255,255,255,0.28) !important;
}
:deep(.bldg-pin--red .bldg-pin__lbl) { border-color: rgba(255,78,69,0.40) !important; }

/* 最高级紧急（red-blink）- 同样静态，只是颜色更深更亮 */
:deep(.bldg-pin--red-blink .bldg-pin__circle) {
  background: linear-gradient(135deg, #FF5050 0%, #CC0000 100%) !important;
  border-color: rgba(255,180,180,0.7) !important;
  box-shadow:
    0 0 0 5px rgba(255,50,50,0.28),
    0 4px 26px rgba(255,50,50,0.75),
    inset 0 1px 0 rgba(255,255,255,0.32) !important;
  animation: none !important;
}
:deep(.bldg-pin--red-blink .bldg-pin__lbl) {
  border-color: rgba(255,80,80,0.50) !important;
  animation: none !important;
  opacity: 1 !important;
}

/* 标签样式：深色玻璃背景 + 细边框 */
:deep(.bldg-pin__lbl) {
  display: block !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  color: #EAF5FF !important;
  text-shadow: 0 1px 5px rgba(0,0,0,0.95) !important;
  background: rgba(0, 8, 28, 0.84) !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
  white-space: nowrap !important;
  border: 1px solid rgba(255,255,255,0.16) !important;
  backdrop-filter: blur(4px) !important;
  max-width: 82px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  letter-spacing: 0.3px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
}

/* =======================================================================
   建筑详情弹窗：炫酷科技风设计
   ======================================================================= */

.screen-building-popup.screen-glass-card {
  position: absolute !important;
  right: 18px !important;
  top: 20px !important;
  width: 270px !important;
  padding: 0 !important;
  z-index: 20 !important;
  left: auto !important;
  transform: none !important;
  background: rgba(1, 9, 30, 0.95) !important;
  border: 1px solid rgba(0, 180, 255, 0.40) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(24px) saturate(1.8) !important;
  overflow: hidden !important;
  box-shadow:
    0 0 0 1px rgba(0, 210, 255, 0.08),
    0 8px 48px rgba(0, 60, 180, 0.45),
    0 0 60px rgba(0, 120, 255, 0.12),
    inset 0 1px 0 rgba(200, 240, 255, 0.12) !important;
}

/* 顶部细线按风险色高亮 */
.popup-risk--red    { border-top: 3px solid #FF4E45 !important; }
.popup-risk--orange { border-top: 3px solid #FFB03A !important; }
.popup-risk--yellow { border-top: 3px solid #FCD34D !important; }
.popup-risk--green  { border-top: 3px solid #20E6A4 !important; }

.popup-risk--red    .screen-popup-header { background: linear-gradient(90deg, rgba(255,78,69,0.15), transparent) !important; }
.popup-risk--orange .screen-popup-header { background: linear-gradient(90deg, rgba(255,176,58,0.12), transparent) !important; }
.popup-risk--yellow .screen-popup-header { background: linear-gradient(90deg, rgba(252,211,77,0.10), transparent) !important; }
.popup-risk--green  .screen-popup-header { background: linear-gradient(90deg, rgba(32,230,164,0.10), transparent) !important; }

/* 弹窗头部 */
.screen-popup-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  padding: 14px 16px 10px !important;
  border-bottom: 1px solid rgba(0,180,255,0.16) !important;
}

/* 建筑名称 */
.screen-popup-building-name {
  font-size: 16px !important;
  font-weight: 800 !important;
  color: #FFFFFF !important;
  text-shadow: 0 0 18px rgba(0, 200, 255, 0.55) !important;
  letter-spacing: 0.5px !important;
  flex: 1 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* 关闭按钮 */
.screen-popup-close {
  width: 26px !important;
  height: 26px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(255,255,255,0.07) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  border-radius: 50% !important;
  color: rgba(255,255,255,0.65) !important;
  font-size: 16px !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  transition: all 0.15s ease !important;
}
.screen-popup-close:hover {
  background: rgba(255,255,255,0.16) !important;
  color: #FFFFFF !important;
  border-color: rgba(255,255,255,0.35) !important;
}

/* 风险等级徽章 */
.screen-popup-risk-badge {
  margin: 10px 16px 0 !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  padding: 5px 12px !important;
  border-radius: 6px !important;
  text-align: center !important;
  letter-spacing: 0.5px !important;
}

/* 摘要信息 */
.screen-popup-summary {
  margin: 8px 16px !important;
  font-size: 12px !important;
  color: rgba(200, 225, 255, 0.88) !important;
  line-height: 1.6 !important;
  background: rgba(255,255,255,0.04) !important;
  border-radius: 7px !important;
  padding: 8px 12px !important;
  border: 1px solid rgba(255,255,255,0.07) !important;
}

/* 查看详情链接按钮 */
.screen-popup-link {
  display: block !important;
  margin: 10px 16px 14px !important;
  padding: 9px 16px !important;
  background: linear-gradient(135deg, rgba(0,100,220,0.30), rgba(0,200,255,0.18)) !important;
  border: 1px solid rgba(0,190,255,0.45) !important;
  border-radius: 8px !important;
  color: #60D8FF !important;
  font-size: 13px !important;
  text-align: center !important;
  text-decoration: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
  transition: all 0.15s ease !important;
  box-shadow: 0 2px 12px rgba(0,150,255,0.20) !important;
}
.screen-popup-link:hover {
  background: linear-gradient(135deg, rgba(0,130,255,0.40), rgba(0,220,255,0.25)) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 20px rgba(0,180,255,0.35) !important;
  transform: translateY(-1px) !important;
}

/* 弹窗过渡动画 */
.screen-popup-enter-active { transition: opacity 220ms ease, transform 220ms ease !important; }
.screen-popup-leave-active { transition: opacity 160ms ease, transform 160ms ease !important; }
.screen-popup-enter-from   { opacity: 0 !important; transform: translateX(12px) scale(0.96) !important; }
.screen-popup-leave-to     { opacity: 0 !important; transform: translateX(8px) scale(0.97) !important; }

/* =======================================================================
   全屏地图背景层：固定定位铺满视口
   ======================================================================= */
.screen-map__amap-bg {
  position: fixed !important;
  inset: 0 !important;
  z-index: 0 !important;
  border-radius: 0 !important;
  flex: none !important;
  width: 100vw !important;
  height: 100vh !important;
  filter: brightness(1.12) saturate(1.5) hue-rotate(-5deg) !important;
}

/* 根容器透明：地图直接作为背景 */
.screen-root {
  background: transparent !important;
  position: relative;
  z-index: 1;
}
.screen-root::before,
.screen-root::after {
  display: none !important;
}

/* 全部 UI 层确保在地图上方 */
.screen-header,
.screen-kpi-ribbon,
.screen-main,
.screen-footer {
  position: relative;
  z-index: 2;
}

/* Header：深色半透明玻璃 */
.screen-header {
  background: rgba(1, 7, 24, 0.72) !important;
  backdrop-filter: blur(20px) saturate(1.4) !important;
  border-bottom-color: rgba(0, 175, 255, 0.45) !important;
  box-shadow: 0 2px 28px rgba(0, 70, 180, 0.35) !important;
}

/* KPI 指标条：深色半透明 */
.screen-kpi-ribbon {
  background: rgba(2, 10, 32, 0.68) !important;
  backdrop-filter: blur(16px) saturate(1.3) !important;
  border-color: rgba(0, 170, 255, 0.55) !important;
  box-shadow: 0 0 22px rgba(0, 110, 220, 0.30), inset 0 1px 0 rgba(160, 220, 255, 0.20) !important;
}

/* 地图中央区域：完全透明，地图穿透显示 */
.screen-map {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
.screen-map__container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  backdrop-filter: none !important;
}
.screen-map__container::before,
.screen-map__container::after {
  display: none !important;
}

/* 地图标题栏：隐藏 */
.screen-map__title-bar {
  display: none !important;
}

/* 加载提示：绝对定位居中 */
.screen-map__loading {
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 5;
  background: rgba(2, 10, 36, 0.88);
  padding: 12px 22px;
  border-radius: 8px;
  border: 1px solid rgba(0, 180, 255, 0.40);
  backdrop-filter: blur(8px);
}

/* 左右面板：半透明玻璃，悬浮在地图上 */
.screen-panel--left,
.screen-panel--right {
  background: rgba(2, 11, 36, 0.60) !important;
  backdrop-filter: blur(22px) saturate(1.6) !important;
  border: 1px solid rgba(0, 175, 255, 0.52) !important;
  box-shadow:
    0 0 36px rgba(0, 90, 220, 0.28),
    inset 0 1px 0 rgba(180, 230, 255, 0.16) !important;
}

/* 底部状态栏：半透明玻璃 */
.screen-footer {
  background: rgba(1, 8, 26, 0.66) !important;
  backdrop-filter: blur(16px) saturate(1.3) !important;
  border-color: rgba(0, 175, 255, 0.50) !important;
  box-shadow: 0 -2px 20px rgba(0, 70, 180, 0.26) !important;
}

/* 降级列表 */
.screen-map__fallback-list {
  z-index: 5;
}
</style>