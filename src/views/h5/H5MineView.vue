<template>
  <!--
    H5 我的页面 /h5/mine
    展示当前外勤用户信息（头像、姓名、角色、岗位、手机号）
    以及关于系统、版本信息等链接入口。
  -->
  <div class="h5-mine h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- 用户信息卡 -->
    <div class="h5-mine__profile">
      <div class="h5-mine__avatar">
        {{ avatarLetter }}
      </div>
      <div class="h5-mine__info">
        <div class="h5-mine__name">{{ user.realName }}</div>
        <div class="h5-mine__role">{{ user.roleName }}</div>
      </div>
    </div>

    <!-- 信息列表 -->
    <div class="h5-card h5-mine__section">
      <div class="h5-mine__section-title">个人信息</div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">姓名</span>
        <span class="h5-mine__row-value">{{ user.realName }}</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">账号</span>
        <span class="h5-mine__row-value tabular-nums">{{ user.username }}</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">角色</span>
        <span class="h5-mine__row-value">{{ user.roleName }}</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">岗位</span>
        <span class="h5-mine__row-value">{{ user.position }}</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">所属单位</span>
        <span class="h5-mine__row-value">{{ user.orgName }}</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">手机号</span>
        <span class="h5-mine__row-value tabular-nums">{{ user.phone }}</span>
      </div>
    </div>

    <!-- 菜单列表 -->
    <div class="h5-card h5-mine__section">
      <div class="h5-mine__section-title">功能入口</div>
      <div class="h5-mine__menu-item" @click="$router.push('/h5/work-orders')">
        <span class="h5-mine__menu-icon">📋</span>
        <span class="h5-mine__menu-label">我的工单</span>
        <span class="h5-mine__menu-arrow">›</span>
      </div>
      <div class="h5-mine__menu-item" @click="$router.push('/h5/buildings')">
        <span class="h5-mine__menu-icon">🏛</span>
        <span class="h5-mine__menu-label">建筑实时指标</span>
        <span class="h5-mine__menu-arrow">›</span>
      </div>
    </div>

    <!-- 关于系统 -->
    <div class="h5-card h5-mine__section">
      <div class="h5-mine__section-title">关于</div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">系统名称</span>
        <span class="h5-mine__row-value">佳木斯历史建筑智慧安全监测平台</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">版本</span>
        <span class="h5-mine__row-value tabular-nums">v1.0.0-demo</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">主管单位</span>
        <span class="h5-mine__row-value">佳木斯市住房和城乡建设局</span>
      </div>
      <div class="h5-mine__row">
        <span class="h5-mine__row-label">建设依据</span>
        <span class="h5-mine__row-value">GB/T 38353-2019 · JGJ 8-2016</span>
      </div>
    </div>

    <!-- 角色说明 -->
    <div class="h5-mine__demo-tip">
      <span class="h5-mine__demo-tip-icon">ℹ️</span>
      <span>当前身份为外勤人员（{{ user.username }}），可接单处置工单，在建筑列表查看实时 IoT 数据。</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { getTable } from "@/services/sqliteMirrorRepository"

// 读取 Demo 固定外勤用户（street01, id=2）
const rawUser = computed(() => {
  const users = getTable<{
    id: number; real_name: string; username: string; phone: string; org_id: number
  }>("sys_user")
  return users.find(u => u.id === 2) ?? null
})

const ORG_NAMES: Record<number, string> = {
  101: "佳木斯市住房和城乡建设局",
  107: "向阳区建国街道办事处",
}

const user = computed(() => ({
  realName: rawUser.value?.real_name ?? "张建国（向阳街道）",
  username: rawUser.value?.username ?? "street01",
  phone:    rawUser.value?.phone ?? "138****0002",
  roleName: "街道外勤人员",
  position: "现场处置外勤",
  orgName:  ORG_NAMES[rawUser.value?.org_id ?? 107] ?? "向阳区建国街道办事处",
}))

const avatarLetter = computed(() => (user.value.realName?.[0] ?? "张"))
</script>

<style scoped>
.h5-mine {
  padding: 0 0 20px;
}

/* 用户头像卡 */
.h5-mine__profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px 20px;
  background: linear-gradient(135deg, #1677FF 0%, #0E54CC 100%);
  color: #fff;
}
.h5-mine__avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.5);
}
.h5-mine__info { display: flex; flex-direction: column; gap: 4px; }
.h5-mine__name { font-size: 18px; font-weight: 700; }
.h5-mine__role { font-size: 13px; opacity: 0.85; }

/* 信息卡 */
.h5-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.h5-mine__section {
  margin: 12px 12px 0;
}
.h5-mine__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--h5-text-muted, #94A3B8);
  padding: 10px 14px 6px;
  border-bottom: 1px solid var(--h5-border, #F0F4F9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.h5-mine__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--h5-border, #F5F7FA);
  font-size: 14px;
}
.h5-mine__row:last-child { border-bottom: none; }
.h5-mine__row-label { color: var(--h5-text-muted, #64748B); min-width: 72px; }
.h5-mine__row-value { color: var(--h5-text-title, #1C2B4A); font-weight: 500; text-align: right; flex: 1; }

/* 菜单项 */
.h5-mine__menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--h5-border, #F5F7FA);
  transition: background 0.15s;
}
.h5-mine__menu-item:last-child { border-bottom: none; }
.h5-mine__menu-item:active { background: #F5F7FA; }
.h5-mine__menu-icon { font-size: 18px; }
.h5-mine__menu-label { flex: 1; font-size: 14px; font-weight: 500; color: var(--h5-text-title, #1C2B4A); }
.h5-mine__menu-arrow { font-size: 18px; color: var(--h5-text-muted, #CBD5E1); }

/* Demo 提示 */
.h5-mine__demo-tip {
  display: flex;
  gap: 8px;
  margin: 12px 12px 0;
  padding: 10px 14px;
  background: #EFF6FF;
  border-radius: 8px;
  font-size: 12px;
  color: #1E40AF;
  line-height: 1.6;
}
.h5-mine__demo-tip-icon { flex-shrink: 0; }
</style>

