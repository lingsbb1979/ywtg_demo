/**
 * fileUpload — 上传文件到内置文件服务器 (/uploads/)
 *
 * 用法：
 *   const url = await uploadFile(file)    // → "/uploads/1234567890-abc.jpg"
 *   const urls = await uploadFiles(files) // → ["/uploads/...", ...]
 */

const UPLOAD_BASE = "/uploads"

/**
 * 上传单个文件，返回可直接用于 <img src> 的相对 URL。
 * 文件名格式：{timestamp}-{随机串}.{ext}
 */
export async function uploadFile(file: File): Promise<string> {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "jpg"
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const url = `${UPLOAD_BASE}/${key}`

  const resp = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  })

  if (!resp.ok) {
    throw new Error(`上传失败 (${resp.status}): ${key}`)
  }

  return url
}

/**
 * 批量上传，返回 URL 数组（顺序与文件列表一致）。
 * 并发上传，最多 4 个同时进行。
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const results: string[] = []
  const CONCURRENCY = 4

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(batch.map(uploadFile))
    results.push(...batchResults)
  }

  return results
}
