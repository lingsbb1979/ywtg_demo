/**
 * sqlExportService.ts — SQLiteMirror 演示工具：SQL 导出 / 导入
 *
 * T15.109 — exportToSql()：把 localStorage ywtg.sqlite.* 表逐表导出为 SQLite
 *           兼容的 SQL 文本（demo_seed.sql），包含 CREATE TABLE + INSERT。
 * T15.110 — importFromBackup()：从 JSON 备份字符串恢复 localStorage（P1）。
 * T15.111 — generateInsertStatement()：列顺序严格按 TableRegistry 注册表输出。
 * T15.112 — fillNullFields()：导出前补齐缺失字段为 null。
 * T15.113 — assertNoIllegalFields()：发现 SQL 不存在字段时抛出带表名/字段名的错误。
 * T15.114 — escapeSqlValue()：字符串转义（单引号、换行），null/undefined → NULL。
 * T15.115 — 导出结果包含 CREATE TABLE DDL 和 INSERT INTO 语句。
 * T15.116 — exportToDbFile()：P1 存根，依赖 sql.js 库尚未实现。
 */
import { TableRegistry } from "../models/tableRegistry"

// ── 内部存储适配（与 sqliteMirrorRepository 相同逻辑）─────────────────────────

const MEM_KEY = "__ywtg_sqlite_mirror_store__"
const LS_PREFIX = "ywtg.sqlite."

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

/** 获取所有 ywtg.sqlite.* 键名 */
function getAllSqliteKeys(): string[] {
  const keys: string[] = []

  if (typeof localStorage !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(LS_PREFIX)) keys.push(k)
    }
    return keys
  }

  // Node / 内存降级
  const mem: Record<string, string> = ((globalThis as any)[MEM_KEY] ??= {})
  return Object.keys(mem).filter((k) => k.startsWith(LS_PREFIX))
}

/** 按 key 读取行数组 */
function readRows(key: string): Record<string, unknown>[] {
  try {
    const raw = lsGet(key)
    if (!raw) return []
    return JSON.parse(raw) as Record<string, unknown>[]
  } catch {
    return []
  }
}

// ── T15.114 — SQL 值转义 ─────────────────────────────────────────────────────

/**
 * 将 JavaScript 值转义为 SQLite INSERT 语句中可用的文本。
 *
 * - null / undefined  → NULL
 * - number            → 原始数值字符串（42, 3.14）
 * - boolean           → 1 / 0
 * - string            → 单引号包裹，内部单引号转 ''，换行转 \n
 * - 其余类型          → JSON.stringify 后按字符串规则转义
 */
export function escapeSqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL"
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return v ? "1" : "0"

  // 对象/数组：先序列化为 JSON 字符串再转义
  const s = typeof v === "string" ? v : JSON.stringify(v)

  // 单引号转义：' → ''
  // 换行转义：\n → \\n（SQLite TEXT 字段可接受 \n，但为可读性使用转义）
  const escaped = s
    .replace(/'/g, "''")
    .replace(/\r?\n/g, "\\n")

  return `'${escaped}'`
}

// ── T15.112 — 空字段补齐 ─────────────────────────────────────────────────────

/**
 * 补齐行对象中缺失的字段，使其与 TableRegistry 声明的字段列表一致。
 *
 * - 已有的字段值保持不变
 * - 缺失的字段赋值为 null
 * - 表名未在 TableRegistry 登记时返回行副本，不抛出
 * - 返回新对象，不修改原始 row
 */
export function fillNullFields(
  tableName: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const fields = TableRegistry[tableName]
  if (!fields) return { ...row }

  const result: Record<string, unknown> = {}
  for (const field of fields) {
    result[field] = Object.prototype.hasOwnProperty.call(row, field)
      ? row[field]
      : null
  }
  return result
}

// ── T15.113 — 非法字段拦截 ───────────────────────────────────────────────────

/**
 * 断言行对象中不存在 TableRegistry 未登记的非法字段。
 *
 * 表名未注册时跳过校验（不抛出），以兼容尚未在注册表中的自定义数据。
 *
 * @throws Error  当发现非法字段时，消息包含表名和非法字段名列表
 */
export function assertNoIllegalFields(
  tableName: string,
  row: Record<string, unknown>,
): void {
  const fields = TableRegistry[tableName]
  if (!fields) return // 未注册的表跳过校验

  const illegal = Object.keys(row).filter((k) => !fields.includes(k))
  if (illegal.length > 0) {
    throw new Error(
      `[SQLExport] 表 "${tableName}" 包含非法字段：${illegal.join(", ")}（不在 完整SQL.md 字段定义中）`,
    )
  }
}

// ── T15.115 — 生成 CREATE TABLE DDL ─────────────────────────────────────────

/**
 * 为指定表生成简版 CREATE TABLE IF NOT EXISTS DDL。
 *
 * - 字段全部声明为 TEXT（演示导入时 SQLite 会隐式转换类型）
 * - 未注册的表名生成占位注释
 */
export function generateCreateTableDdl(tableName: string): string {
  const fields = TableRegistry[tableName]
  if (!fields) {
    return `-- CREATE TABLE ${tableName} (schema unknown, not in TableRegistry)\n`
  }

  const cols = fields.map((f) => `  ${f} TEXT`).join(",\n")
  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${cols}\n);\n`
}

// ── T15.115 + T15.111 — 生成 INSERT INTO 语句 ────────────────────────────────

/**
 * 为指定行生成 INSERT INTO 语句。
 *
 * - 列顺序严格按 TableRegistry[tableName] 注册顺序（T15.111）
 * - 行中缺失的字段自动补 NULL（T15.112）
 * - 值使用 escapeSqlValue() 转义（T15.114）
 * - 未注册的表名直接用行的字段顺序
 */
export function generateInsertStatement(
  tableName: string,
  row: Record<string, unknown>,
): string {
  const fields = TableRegistry[tableName]

  if (!fields) {
    // 未注册的表：用行字段顺序
    const keys = Object.keys(row)
    const vals = keys.map((k) => escapeSqlValue(row[k]))
    return `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${vals.join(", ")});\n`
  }

  // T15.112 补齐缺失字段
  const filled = fillNullFields(tableName, row)
  // T15.111 按注册表字段顺序生成
  const vals = fields.map((f) => escapeSqlValue(filled[f]))
  return `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${vals.join(", ")});\n`
}

// ── T15.109 — 主导出函数 ─────────────────────────────────────────────────────

/**
 * 将 localStorage（或内存降级存储）中的 SQLiteMirror 表数据导出为
 * SQLite 兼容的 SQL 文本。
 *
 * 导出内容：
 *   1. 文件头注释（-- demo_seed.sql）
 *   2. 每张表：CREATE TABLE IF NOT EXISTS + INSERT INTO 语句
 *   3. 无数据的表只生成 CREATE TABLE，不生成 INSERT
 *
 * @param options.tableNames  可选。限定导出的表名列表。
 *                            不提供时自动扫描所有 ywtg.sqlite.* 键。
 */
export function exportToSql(options?: { tableNames?: string[] }): string {
  const tableNames: string[] = options?.tableNames
    ?? getAllSqliteKeys().map((k) => k.slice(LS_PREFIX.length))

  const now = new Date().toISOString()
  let sql = `-- demo_seed.sql: SQLiteMirror 导出\n`
  sql += `-- 生成时间: ${now}\n`
  sql += `-- 来源: localStorage ywtg.sqlite.*\n\n`

  for (const tableName of tableNames) {
    const rows = readRows(`${LS_PREFIX}${tableName}`)

    // T15.115 — 始终生成 CREATE TABLE
    sql += generateCreateTableDdl(tableName)

    if (rows.length > 0) {
      for (const row of rows) {
        // T15.115 + T15.111 + T15.112 + T15.114 — 生成 INSERT（registry 外字段被 fillNullFields 静默忽略）
        sql += generateInsertStatement(tableName, row)
      }
    }

    sql += "\n"
  }

  return sql
}

// ── T15.110 — 导入备份（P1）────────────────────────────────────────────────

/**
 * 从 JSON 备份字符串恢复 localStorage 数据。
 *
 * 备份格式（两种键名均可）：
 * ```json
 * {
 *   "alarm_record": [...],
 *   "ywtg.sqlite.work_order": [...]
 * }
 * ```
 *
 * @throws SyntaxError  当 json 不是合法 JSON 时
 */
export function importFromBackup(json: string): void {
  const data = JSON.parse(json) as Record<string, unknown[]>

  for (const [rawKey, rows] of Object.entries(data)) {
    // 统一加前缀
    const key = rawKey.startsWith(LS_PREFIX) ? rawKey : `${LS_PREFIX}${rawKey}`
    lsSet(key, JSON.stringify(rows))
  }
}

// ── T15.116 — 导出 .db 文件（P1 存根）──────────────────────────────────────

/**
 * 直接导出 SQLite .db 文件（需要 sql.js 库）。
 *
 * **P1 存根**：本期不实现，调用时抛出明确提示。
 * 后续实现步骤：
 *   1. npm install sql.js
 *   2. 用 sql.js 的 `new SQL.Database()` 创建内存 DB
 *   3. 执行 exportToSql() 生成的 DDL + INSERT
 *   4. 调用 `db.export()` 获取 Uint8Array 并触发浏览器下载
 *
 * @throws Error  始终抛出，提示 P1 未实现
 */
export function exportToDbFile(): never {
  throw new Error(
    "[P1] exportToDbFile() 需要 sql.js 库，当前版本暂未实现。" +
    "请先使用 exportToSql() 导出 SQL 文本，后续通过 npm install sql.js 启用。",
  )
}
