<template>
  <div class="admin-layout">
    <!-- 顶部视角切换区 -->
    <header class="admin-layout__header">
      <div class="admin-layout__header-title">佳木斯历史建筑智慧安全监测平台</div>
      <div class="admin-layout__header-role">
        <span class="admin-layout__header-role-label">演示视角：</span>
        <select
          class="admin-layout__header-role-select"
          :value="demoRoleStore.currentRole"
          @change="onRoleChange"
        >
          <option v-for="r in demoRoleStore.roleOptions" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>
    </header>

    <div class="admin-layout__body">
      <!-- 侧边菜单区 -->
      <aside class="admin-layout__sidebar">
        <nav class="admin-layout__nav">
          <router-link class="admin-layout__nav-item" to="/admin/dashboard">工作台</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/buildings">建筑档案</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/telemetry">实时监测</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/analysis">数据分析</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/alarms">告警中心</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/work-orders">工单中心</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/supervision">督办管理</router-link>
          <router-link class="admin-layout__nav-item" to="/admin/demo-console">演示控制台</router-link>
        </nav>
      </aside>

      <!-- 内容区 -->
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDemoRoleStore } from "@/stores/demoRole"

const demoRoleStore = useDemoRoleStore()

function onRoleChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  demoRoleStore.setRole(val as any)
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 24px;
  background: #001529;
  color: #fff;
  flex-shrink: 0;
}

.admin-layout__header-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.admin-layout__header-role {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.admin-layout__header-role-select {
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #444;
  background: #003a6e;
  color: #fff;
  cursor: pointer;
}

.admin-layout__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-layout__sidebar {
  width: 200px;
  background: #001529;
  flex-shrink: 0;
  overflow-y: auto;
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.admin-layout__nav-item {
  display: block;
  padding: 10px 20px;
  color: #ffffffa0;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.admin-layout__nav-item:hover,
.admin-layout__nav-item.router-link-active {
  background: #1890ff22;
  color: #fff;
}

.admin-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
