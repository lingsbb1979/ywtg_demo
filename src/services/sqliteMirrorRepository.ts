/**
 * SQLiteMirror Repository（T15.13 / T15.14 实现）
 *
 * localStorage key 规则：ywtg.sqlite.<tableName>
 * tableName 必须是 完整SQL.md 中存在的真实表名（TableName 类型约束）
 *
 * Node / 测试环境：localStorage 不可用时自动回退到 globalThis 内存存储。
 * 浏览器环境：直接读写 window.localStorage。
 */
import type { TableName } from "../models/tableNames"

type Row = Record<string, unknown>

// ── 内部存储适配 ──────────────────────────────────────────────────────────────

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function lsGet(key: string): string | null {
  if (typeof localStorage !== "undefined") return localStorage.getItem(key)
  const mem: Record<string, string> = ((globalThis as any)[MEM_KEY] ??= {})
  return mem[key] ?? null
}

function lsSet(key: string, value: string): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value)
    return
  }
  const mem: Record<string, string> = ((globalThis as any)[MEM_KEY] ??= {})
  mem[key] = value
}

// ── T15.13 getTable() ─────────────────────────────────────────────────────────

/**
 * 从 localStorage（或内存降级存储）读取指定真实表的全部行。
 * 表不存在时返回空数组，绝不抛出异常。
 */
export function getTable<T extends Row = Row>(tableName: TableName): T[] {
  try {
    const raw = lsGet(`ywtg.sqlite.${tableName}`)
    if (!raw) return []
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

// ── T15.14 setTable() ─────────────────────────────────────────────────────────

/**
 * 将行数组写回 localStorage（或内存降级存储）。
 * 覆盖整张表，不做增量合并。
 */
export function setTable<T extends Row = Row>(tableName: TableName, rows: T[]): void {
  try {
    lsSet(`ywtg.sqlite.${tableName}`, JSON.stringify(rows))
  } catch {
    // noop：存储配额超限等异常不上抛
  }
}

// ── T15.15 resetTables() ─────────────────────────────────────────────────────

/**
 * 清除所有 ywtg.sqlite.* 业务表数据。
 *
 * - 只删除 ywtg.sqlite.* 前缀的 key
 * - ywtg.ui.*（演示角色等 UI 状态）和 ywtg.session.*（登录态）不受影响
 * - 实际种子数据填充由 T15.24~T15.32 的 seed 函数完成
 */
export function resetTables(): void {
  const PREFIX = "ywtg.sqlite."

  if (typeof localStorage !== "undefined") {
    // 先收集要删除的 key，再删除（避免边遍历边删除的索引问题）
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
    return
  }

  // Node / 内存降级存储
  const mem: Record<string, string> = ((globalThis as any)[MEM_KEY] ??= {})
  Object.keys(mem)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => { delete mem[k] })
}

// ── 保留旧接口（向后兼容 T15.4 已有引用）────────────────────────────────────

/** @deprecated 请使用 getTable() */
export function readTable<T extends Row = Row>(tableName: string): T[] {
  return getTable(tableName as TableName)
}

/** @deprecated 请使用 setTable() */
export function writeTable<T extends Row = Row>(tableName: string, rows: T[]): void {
  setTable(tableName as TableName, rows)
}

export async function readTableAsync<T extends Row = Row>(tableName: string): Promise<T[]> {
  return readTable<T>(tableName)
}

export async function writeTableAsync<T extends Row = Row>(tableName: string, rows: T[]): Promise<void> {
  writeTable(tableName, rows)
}

export default {
  getTable,
  setTable,
  resetTables,
  readTable,
  writeTable,
  readTableAsync,
  writeTableAsync,
}

