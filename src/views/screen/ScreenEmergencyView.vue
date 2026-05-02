<template>
  <!--
    T15.99 大屏应急管理占位页 /screen/emergency
    ─────────────────────────────────────────────────────────────
    P1 简化版：显示应急管理功能规划说明，包含返回首页链接
    告警等级 RED 的情况下可从大屏首页跳转到本页
    ─────────────────────────────────────────────────────────────
  -->
  <div class="screen-root screen-bg screen-emergency">
    <!-- ===== 顶部标题栏 ===== -->
    <header class="screen-emergency__header">
      <router-link to="/screen/home" class="screen-back-link">
        ← 返回大屏首页
      </router-link>
      <h1 class="screen-emergency__title">应急管理中心</h1>
    </header>

    <!-- ===== 主内容区 ===== -->
    <main class="screen-emergency__main">
      <div class="screen-glass-card screen-emergency__card">
        <!-- 图标 + 标题 -->
        <div class="screen-emergency__icon">🚨</div>
        <h2 class="screen-emergency__subtitle">应急管理系统</h2>
        <p class="screen-emergency__desc">
          本模块正在建设中，预计将提供以下功能：
        </p>

        <!-- 规划功能列表 -->
        <ul class="screen-emergency__plan-list">
          <li class="screen-emergency__plan-item">
            <span class="risk-dot risk-dot--red" />
            <span>红色告警自动触发应急预案</span>
          </li>
          <li class="screen-emergency__plan-item">
            <span class="risk-dot risk-dot--orange" />
            <span>应急事件全流程管理（触发→响应→处置→恢复）</span>
          </li>
          <li class="screen-emergency__plan-item">
            <span class="risk-dot risk-dot--yellow" />
            <span>应急资源调度与人员联动</span>
          </li>
          <li class="screen-emergency__plan-item">
            <span class="risk-dot risk-dot--green" />
            <span>事后分析与报告生成</span>
          </li>
        </ul>

        <div class="screen-emergency__badge">
          <span class="badge-screen badge-screen--orange">开发中</span>
          <span style="color:var(--screen-text-muted,rgba(255,255,255,0.4));font-size:12px;margin-left:8px">
            即将上线
          </span>
        </div>

        <router-link to="/screen/home" class="screen-emergency__home-link">
          返回大屏首页 →
        </router-link>
      </div>

      <!-- 当前活跃红色告警提示 -->
      <div v-if="redAlarmCount > 0" class="screen-glass-card screen-emergency__alert-card">
        <div class="screen-emergency__alert-title">
          <span class="risk-dot risk-dot--red" />
          当前活跃红色告警
          <span class="badge-screen badge-screen--red tabular-nums">{{ redAlarmCount }}</span>
        </div>
        <div class="screen-emergency__alert-hint">
          请立即前往
          <router-link to="/screen/alarm-dispatch" class="screen-emergency__alert-link">
            告警派遣中心
          </router-link>
          处理
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getTable } from "@/services/sqliteMirrorRepository"

const redAlarmCount = ref(0)

onMounted(() => {
  const alarms = getTable<{ alarm_level: string; status: string }>("alarm_record")
  redAlarmCount.value = alarms.filter(
    a => a.alarm_level === "RED" && (a.status === "ACTIVE" || a.status === "PENDING")
  ).length
})
</script>

<style scoped>
.screen-emergency {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}

.screen-emergency__header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
}

.screen-back-link {
  font-size: 13px;
  color: var(--screen-cyan, #00D4FF);
  text-decoration: none;
}

.screen-emergency__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin: 0;
}

.screen-emergency__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px 24px;
}

.screen-emergency__card {
  max-width: 560px;
  width: 100%;
  padding: 40px 48px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.20));
  background: var(--screen-panel-bg, rgba(16,24,48,0.85));
  backdrop-filter: blur(10px);
  text-align: center;
}

.screen-emergency__icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.screen-emergency__subtitle {
  font-size: 22px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin: 0 0 12px;
}

.screen-emergency__desc {
  font-size: 14px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
  margin-bottom: 20px;
}

.screen-emergency__plan-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.screen-emergency__plan-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
}

.screen-emergency__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.screen-emergency__home-link {
  color: var(--screen-cyan, #00D4FF);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.screen-emergency__alert-card {
  max-width: 560px;
  width: 100%;
  padding: 20px 24px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--risk-red, #FF4444);
  background: rgba(255,68,68,0.08);
  backdrop-filter: blur(10px);
}

.screen-emergency__alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--risk-red, #FF4444);
  margin-bottom: 8px;
}

.screen-emergency__alert-hint {
  font-size: 13px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

.screen-emergency__alert-link {
  color: var(--screen-cyan, #00D4FF);
  text-decoration: none;
  font-weight: 500;
}
</style>
