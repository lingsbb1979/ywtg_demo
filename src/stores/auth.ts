/**
 * useAuthStore — 固定账号登录状态管理
 *
 * 架构约束（技术栈-mock.md）：
 *   - 登录状态存 Pinia store，不写入 SQLiteMirror 业务表
 *   - login() 返回 Promise，模拟真实 HTTP 异步调用
 *   - 固定账号 admin/admin 用于 Demo 演示，不实现真实后端鉴权
 *   - 可选：在浏览器环境写 sessionStorage（ywtg.session.auth），
 *     避免刷新页面丢失登录态；Node 测试环境自动降级为纯内存状态
 */
import { defineStore } from "pinia"
import { ref, computed } from "vue"

/** Demo 固定账号配置（不含真实密码哈希，仅用于演示） */
const DEMO_CREDENTIALS: Record<string, string> = {
  admin:  "admin",
  leader: "123456",
  field:  "123456",
}

/**
 * localStorage 键：登录会话状态，与 SQLiteMirror 业务表无关。
 * 使用 localStorage 而非 sessionStorage，保证跨标签页、刷新后不丢失登录态。
 */
const SESSION_KEY = "ywtg.session.auth"

/** 安全读取 localStorage（Node 环境降级为 null） */
function readSession(): string | null {
  try {
    return globalThis.localStorage?.getItem(SESSION_KEY) ?? null
  } catch {
    return null
  }
}

/** 安全写入 localStorage */
function writeSession(username: string): void {
  try {
    globalThis.localStorage?.setItem(SESSION_KEY, username)
  } catch {
    // Node 测试环境忽略
  }
}

/** 安全清除 localStorage */
function clearSession(): void {
  try {
    globalThis.localStorage?.removeItem(SESSION_KEY)
  } catch {
    // Node 测试环境忽略
  }
}

export interface LoginResult {
  success: boolean
  message?: string
}

export const useAuthStore = defineStore("auth", () => {
  // 从 sessionStorage 恢复登录状态（浏览器刷新后不丢失）
  const _currentUser = ref<string | null>(readSession())

  const currentUser = computed(() => _currentUser.value)
  const isLoggedIn = computed(() => _currentUser.value !== null)

  /**
   * 登录：固定账号校验，模拟异步 HTTP 调用
   * 返回 Promise<LoginResult>，页面层通过 success 判断结果
   */
  async function login(username: string, password: string): Promise<LoginResult> {
    // 模拟网络延迟（Demo 环境，1ms 即可）
    await Promise.resolve()

    const expected = DEMO_CREDENTIALS[username]
    if (!expected || expected !== password) {
      return { success: false, message: "用户名或密码错误" }
    }

    _currentUser.value = username
    writeSession(username)
    return { success: true }
  }

  /**
   * 仅内存登录（新标签页用）：校验账号但不写 localStorage，
   * 不影响其他标签页的持久化状态。
   */
  async function loginNoSave(username: string, password: string): Promise<LoginResult> {
    await Promise.resolve()
    const expected = DEMO_CREDENTIALS[username]
    if (!expected || expected !== password) {
      return { success: false, message: "用户名或密码错误" }
    }
    _currentUser.value = username
    return { success: true }
  }

  /** 退出登录，清除状态和会话 */
  function logout(): void {
    _currentUser.value = null
    clearSession()
  }

  return {
    currentUser,
    isLoggedIn,
    login,
    loginNoSave,
    logout
  }
})
