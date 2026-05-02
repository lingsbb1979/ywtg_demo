/**
 * syncService.ts — 页面刷新机制 + 跨标签页同步
 *
 * T15.107 — 页面刷新机制：
 *   - syncRefreshKey：只读 ref，页面可 watch 其变化并重新加载数据
 *   - triggerRefresh(tableName?)：递增刷新键，通知所有订阅页面重新拉取数据
 *
 * T15.108 — 跨标签页同步（P1）：
 *   - setupCrossTabSync()：监听浏览器 storage 事件，其他标签页修改
 *     ywtg.sqlite.* 时自动调用 triggerRefresh()，保持多标签一致性
 *
 * 用法示例（在 Vue 组件中）：
 *   import { syncRefreshKey, triggerRefresh } from '@/services/syncService'
 *   watch(syncRefreshKey, loadData)    // 有数据变更时自动重载
 *   onMounted(() => loadData())
 */
import { ref, readonly } from "vue"

// ── 内部可写 ref ──────────────────────────────────────────────────────────────
const _refreshKey = ref(0)

/**
 * 只读刷新键。页面可 watch 此值：当其递增时重新拉取数据。
 * 初始值为 0。
 */
export const syncRefreshKey = readonly(_refreshKey)

/**
 * T15.107 — 触发全局刷新。
 *
 * 递增 syncRefreshKey，所有 watch 该值的组件会重新执行数据加载逻辑。
 *
 * @param tableName  可选。指示是哪张表发生了变更（供调试/日志使用）。
 */
export function triggerRefresh(_tableName?: string): void {
  _refreshKey.value++
}

/**
 * T15.108 — 设置跨标签页同步（P1）。
 *
 * 在浏览器环境中监听 `storage` 事件：
 * - 当其他标签页修改了 `ywtg.sqlite.*` 开头的 localStorage 键时，
 *   自动调用 triggerRefresh()，使当前标签页数据刷新。
 *
 * 返回清理函数，在组件卸载时调用以防内存泄漏：
 *
 * ```ts
 * const cleanup = setupCrossTabSync()
 * onUnmounted(cleanup)
 * ```
 */
export function setupCrossTabSync(): () => void {
  const SQLITE_PREFIX = "ywtg.sqlite."

  const handler = (e: Event): void => {
    const storageEvent = e as StorageEvent
    if (storageEvent.key && storageEvent.key.startsWith(SQLITE_PREFIX)) {
      triggerRefresh(storageEvent.key.slice(SQLITE_PREFIX.length))
    }
  }

  // Node/Vitest 环境下 window 可能是 globalThis
  const target = typeof window !== "undefined" ? window : globalThis
  target.addEventListener("storage", handler)

  return () => {
    target.removeEventListener("storage", handler)
  }
}
