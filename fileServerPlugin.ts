/**
 * fileServerPlugin — 内置轻量文件服务器 (Vite Dev Plugin)
 *
 * 模拟 MinIO / S3 Object Storage 核心接口，专为演示环境设计。
 * 文件落盘到 <project>/uploads/ 目录，重启后依然存在。
 *
 * 接口：
 *   PUT  /uploads/<key>          上传文件（raw body）
 *   GET  /uploads/<key>          下载 / 显示文件
 *   HEAD /uploads/<key>          文件是否存在
 *   DELETE /uploads/<key>        删除文件
 *
 * 内置演示占位图（自动生成，无需真实文件）：
 *   /uploads/demo-photo-1.jpg  … demo-photo-5.jpg
 */

import type { Plugin } from "vite"
import fs   from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

// ── 配置 ──────────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.resolve("uploads")

// ── MIME 映射 ─────────────────────────────────────────────────────────────────

function getMime(filename: string): string {
  const map: Record<string, string> = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".gif":  "image/gif",
    ".webp": "image/webp",
    ".svg":  "image/svg+xml",
    ".pdf":  "application/pdf",
    ".mp4":  "video/mp4",
    ".mov":  "video/quicktime",
    ".txt":  "text/plain",
    ".json": "application/json",
  }
  return map[path.extname(filename).toLowerCase()] ?? "application/octet-stream"
}

// ── 演示占位图生成（SVG → served as image/svg+xml）────────────────────────────

const DEMO_PHOTO_CONFIGS: Record<string, { label: string; bg: string; icon: string }> = {
  "demo-photo-1.jpg": { label: "裂缝现场",   bg: "#1d4ed8", icon: "🔍" },
  "demo-photo-2.jpg": { label: "加固支撑",   bg: "#15803d", icon: "🔧" },
  "demo-photo-3.jpg": { label: "监测仪器",   bg: "#b45309", icon: "📡" },
  "demo-photo-4.jpg": { label: "整体外观",   bg: "#7c3aed", icon: "🏛️" },
  "demo-photo-5.jpg": { label: "处置完成",   bg: "#0f766e", icon: "✅" },
}

function generateDemoSvg(label: string, bg: string, icon: string): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <!-- 网格纹理 -->
  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
  </pattern>
  <rect width="400" height="300" fill="url(#grid)"/>
  <!-- 边框 -->
  <rect x="8" y="8" width="384" height="284" rx="4" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <!-- 图标 -->
  <text x="200" y="130" font-family="'Segoe UI Emoji',sans-serif" font-size="48" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <!-- 标签 -->
  <text x="200" y="175" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="18" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text>
  <!-- 小字 -->
  <text x="200" y="202" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="12" fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="middle">现场证据照片（演示）</text>
  <!-- 时间戳 -->
  <text x="200" y="260" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.35)" text-anchor="middle">佳木斯历史建筑智慧安全监测平台</text>
</svg>`
  return Buffer.from(svg, "utf-8")
}

// ── Vite 插件主体 ─────────────────────────────────────────────────────────────

export function fileServerPlugin(): Plugin {
  return {
    name: "vite-fileserver",

    configureServer(server) {
      // 确保上传目录存在
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })

      server.middlewares.use("/uploads", (req, res, next) => {
        const rawUrl = req.url ?? "/"
        // 去掉 query string，解码 URI
        const key = decodeURIComponent(rawUrl.split("?")[0].replace(/^\/+/, ""))

        if (!key) {
          // 列目录（不支持）
          res.writeHead(403, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Directory listing disabled" }))
          return
        }

        // ── 安全：防止目录穿越 ──────────────────────────────────────────────
        const filePath = path.join(UPLOAD_DIR, key)
        if (!filePath.startsWith(UPLOAD_DIR + path.sep) && filePath !== UPLOAD_DIR) {
          res.writeHead(403, { "Content-Type": "text/plain" })
          res.end("Forbidden")
          return
        }

        const method = (req.method ?? "GET").toUpperCase()

        // ── GET / HEAD ──────────────────────────────────────────────────────
        if (method === "GET" || method === "HEAD") {
          // 先查磁盘
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const data = fs.readFileSync(filePath)
            const mime = getMime(key)
            res.writeHead(200, {
              "Content-Type":   mime,
              "Content-Length": String(data.length),
              "Cache-Control":  "max-age=86400",
              "ETag":           `"${crypto.createHash("md5").update(data).digest("hex")}"`,
            })
            res.end(method === "HEAD" ? null : data)
            return
          }

          // 演示占位图（不需要真实文件）
          const cfg = DEMO_PHOTO_CONFIGS[key]
          if (cfg) {
            const svg = generateDemoSvg(cfg.label, cfg.bg, cfg.icon)
            res.writeHead(200, {
              "Content-Type":   "image/svg+xml",
              "Content-Length": String(svg.length),
              "Cache-Control":  "max-age=86400",
            })
            res.end(method === "HEAD" ? null : svg)
            return
          }

          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Not Found", key }))
          return
        }

        // ── PUT（上传，raw body）───────────────────────────────────────────
        if (method === "PUT") {
          const dir = path.dirname(filePath)
          fs.mkdirSync(dir, { recursive: true })

          const chunks: Buffer[] = []
          req.on("data", (chunk: Buffer) => chunks.push(chunk))
          req.on("end", () => {
            const body = Buffer.concat(chunks)
            fs.writeFileSync(filePath, body)
            const etag = crypto.createHash("md5").update(body).digest("hex")
            res.writeHead(200, {
              "Content-Type": "application/xml",
              "ETag":         `"${etag}"`,
            })
            // MinIO / S3 兼容响应
            res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<PutObjectResponse><ETag>"${etag}"</ETag><Size>${body.length}</Size></PutObjectResponse>`)
          })
          req.on("error", () => {
            res.writeHead(500)
            res.end()
          })
          return
        }

        // ── DELETE ─────────────────────────────────────────────────────────
        if (method === "DELETE") {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            res.writeHead(204)
          } else {
            res.writeHead(404)
          }
          res.end()
          return
        }

        // ── 其他方法（OPTIONS 等）────────────────────────────────────────
        res.writeHead(405, {
          "Allow":        "GET, HEAD, PUT, DELETE",
          "Content-Type": "application/json",
        })
        res.end(JSON.stringify({ error: "Method Not Allowed" }))
      })

      console.log(`\n  ✦ FileServer  →  http://localhost:5173/uploads/<key>  (${UPLOAD_DIR})\n`)
    },
  }
}
