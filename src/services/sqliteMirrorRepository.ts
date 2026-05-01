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

// ── T15.16 list() ─────────────────────────────────────────────────────────────

type FilterObject<T> = Partial<T>
type FilterFn<T> = (row: T) => boolean
type Filter<T> = FilterObject<T> | FilterFn<T>

/**
 * 从任意真实表查询列表。
 *
 * @param tableName  TableName 类型约束的真实表名
 * @param filter     可选。
 *   - 不传：返回全部行
 *   - 对象：返回所有与对象每个 key-value 均匹配的行（AND 条件）
 *   - 函数：返回 predicate 为 true 的行
 * @returns 浅拷贝新数组，不修改原始存储
 */
export function list<T extends Row = Row>(
  tableName: TableName,
  filter?: Filter<T>,
): T[] {
  const rows = getTable<T>(tableName)

  if (!filter) return rows.map((r) => ({ ...r }))

  if (typeof filter === "function") {
    return rows.filter(filter).map((r) => ({ ...r }))
  }

  // 对象 filter：AND 条件
  const entries = Object.entries(filter as Record<string, unknown>)
  if (entries.length === 0) return rows.map((r) => ({ ...r }))

  return rows
    .filter((row) => entries.every(([k, v]) => (row as any)[k] === v))
    .map((r) => ({ ...r }))
}

// ── T15.17 getById() ─────────────────────────────────────────────────────────

/**
 * 按 id 字段查询单行详情。
 *
 * @param tableName  真实表名（TableName 类型约束）
 * @param id         number 或 string，与行中 `id` 字段严格相等比较
 * @returns 找到时返回行的浅拷贝，未找到或表不存在时返回 null
 */
export function getById<T extends Row = Row>(
  tableName: TableName,
  id: number | string,
): T | null {
  const rows = getTable<T>(tableName)
  const row = rows.find((r) => (r as any).id === id)
  return row ? { ...row } : null
}

// ── T15.19 update() ──────────────────────────────────────────────────────────

/**
 * 按 id 对单行做局部更新（patch merge）。
 *
 * @param tableName  真实表名
 * @param id         目标行的 id（number | string）
 * @param patch      要合并的字段对象；patch.id 会被忽略，不允许修改主键
 * @returns 找到并更新返回 true；未找到或表不存在返回 false
 */
export function update<T extends Row = Row>(
  tableName: TableName,
  id: number | string,
  patch: Partial<T>,
): boolean {
  const rows = getTable<T>(tableName)
  const idx = rows.findIndex((r) => (r as any).id === id)
  if (idx === -1) return false

  // 合并 patch，但忽略 id 字段防止主键篡改
  const { id: _ignored, ...safePatch } = patch as any
  rows[idx] = { ...rows[idx], ...safePatch }
  setTable(tableName, rows)
  return true
}

// ── T15.20 remove() ──────────────────────────────────────────────────────────

/**
 * 按 id 删除单行。
 *
 * @param tableName  真实表名
 * @param id         目标行的 id（number | string）
 * @returns 找到并删除返回 true；未找到或表不存在返回 false
 */
export function remove(
  tableName: TableName,
  id: number | string,
): boolean {
  const rows = getTable(tableName)
  const idx = rows.findIndex((r) => (r as any).id === id)
  if (idx === -1) return false
  rows.splice(idx, 1)
  setTable(tableName, rows)
  return true
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
  list,
  getById,
  update,
  remove,
  readTable,
  writeTable,
  readTableAsync,
  writeTableAsync,
}

