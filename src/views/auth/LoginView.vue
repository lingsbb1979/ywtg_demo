<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 系统标题 -->
      <div class="login-card__header">
        <h1 class="login-card__title">佳木斯历史建筑</h1>
        <p class="login-card__subtitle">智慧安全监测平台</p>
      </div>

      <!-- 登录表单 -->
      <form class="login-card__form" @submit.prevent="handleSubmit">
        <!-- 用户名 -->
        <div class="login-field">
          <label class="login-field__label" for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            class="login-field__input"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </div>

        <!-- 密码 -->
        <div class="login-field">
          <label class="login-field__label" for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            class="login-field__input"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </div>

        <!-- 错误提示 -->
        <p v-if="errorMsg" class="login-card__error" role="alert">{{ errorMsg }}</p>

        <!-- 提交按钮 -->
        <button
          class="login-card__submit"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? "登录中..." : "登录" }}
        </button>
      </form>

      <!-- Demo 提示 -->
      <p class="login-card__hint">演示账号：admin / admin</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ username: "", password: "" })
const loading = ref(false)
const errorMsg = ref("")

async function handleSubmit() {
  if (!form.username || !form.password) {
    errorMsg.value = "请输入用户名和密码"
    return
  }

  loading.value = true
  errorMsg.value = ""

  try {
    const result = await authStore.login(form.username, form.password)
    if (result.success) {
      // 登录成功后进入管理端工作台
      await router.push("/admin/dashboard")
    } else {
      errorMsg.value = result.message ?? "用户名或密码错误"
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%);
}

.login-card {
  width: 360px;
  padding: 40px 32px 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(12px);
}

.login-card__header {
  text-align: center;
  margin-bottom: 32px;
}

.login-card__title {
  font-size: 22px;
  font-weight: 700;
  color: #e8f4fd;
  margin: 0 0 4px;
}

.login-card__subtitle {
  font-size: 14px;
  color: #8fc8f0;
  margin: 0;
}

.login-card__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-field__label {
  font-size: 13px;
  color: #a0bcd0;
}

.login-field__input {
  height: 40px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #e0eaf4;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.login-field__input:focus {
  border-color: #1677ff;
}

.login-field__input::placeholder {
  color: #4a6b7c;
}

.login-card__error {
  margin: 0;
  font-size: 13px;
  color: #ff6b6b;
}

.login-card__submit {
  height: 42px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.login-card__submit:hover:not(:disabled) {
  background: #0e5fcc;
}

.login-card__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-card__hint {
  margin: 20px 0 0;
  text-align: center;
  font-size: 12px;
  color: #4a6b7c;
}
</style>
