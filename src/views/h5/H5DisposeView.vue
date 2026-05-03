<template>
  <!--
    T15.103 H5 处置页 /h5/dispose/:id
    + T15.105 GPS 定位 mock
    + T15.106 照片证据 mock
    ─────────────────────────────────────────────────────────────
    低保真线框：
    ┌────────── h5-header（深蓝渐变，56px sticky）──────────┐
    │  ← 返回       提交处置              [工单编号]        │
    ├────────── zone:disposal-form ─────────────────────────┤
    │  ┌── 处置说明 ────────────────────────────────────┐   │
    │  │  [textarea: 输入处置说明...]                    │   │
    │  └──────────────────────────────────────────────── ┘   │
    ├────────── zone:gps-section ────────────────────────────┤
    │  ┌── 定位签到 ────────────────────────────────────┐   │
    │  │  [点击定位] → 距离建筑 XX 米                    │   │
    │  └──────────────────────────────────────────────── ┘   │
    ├────────── zone:photo-section ──────────────────────────┤
    │  ┌── 现场证据 ────────────────────────────────────┐   │
    │  │  [选择演示照片] → 3 张证据占位图                │   │
    │  │  [📷][📷][📷]                                   │   │
    │  └──────────────────────────────────────────────── ┘   │
    ├────────── zone:submit ─────────────────────────────────┤
    │  [提交处置]                                             │
    └─────────────────────────────────────────────────────────┘
  -->
  <div class="h5-dispose h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- ===== 顶部导航栏 ===== -->
    <header class="h5-header">
      <button class="h5-header__back" @click="goBack">←</button>
      <span class="h5-header__title">提交处置</span>
      <span class="h5-header__actions tabular-nums" style="font-size:12px;color:rgba(255,255,255,0.6)">
        {{ orderNo }}
      </span>
    </header>

    <!-- ===== 加载中 / 无数据 ===== -->
    <div v-if="loading" class="h5-dispose__loading">
      <span style="color:var(--h5-text-muted,#94A3B8)">加载中...</span>
    </div>
    <div v-else-if="!orderId" class="h5-dispose__empty">
      <span>工单不存在</span>
      <button class="h5-btn-primary" @click="goBack">返回</button>
    </div>

    <div v-else class="h5-dispose__content">

      <!-- ===== 处置说明表单（zone:disposal-form）===== -->
      <div class="h5-card h5-dispose__section" data-zone="disposal-form">
        <div class="h5-dispose__section-title">处置说明</div>
        <textarea
          v-model="description"
          class="h5-dispose__textarea"
          placeholder="请输入处置说明（必填），描述现场情况和处置措施..."
          rows="5"
        />
        <p class="h5-dispose__hint">
          <span class="h5-dispose__hint-text">{{ description.length }} / 500 字</span>
        </p>
      </div>

      <!-- ===== GPS 定位签到（zone:gps-section）===== -->
      <div class="h5-card h5-dispose__section" data-zone="gps-section">
        <div class="h5-dispose__section-title">定位签到</div>
        <div class="h5-dispose__gps-row">
          <button
            class="h5-dispose__gps-btn"
            :class="{ 'h5-dispose__gps-btn--done': gpsChecked }"
            @click="handleGPS"
          >
            <span class="h5-dispose__gps-icon">📍</span>
            {{ gpsChecked ? '已定位' : '点击定位' }}
          </button>
          <div v-if="gpsChecked" class="h5-dispose__gps-result">
            <span class="h5-dispose__gps-distance tabular-nums">
              距建筑 <strong>{{ mockDistance }}</strong> 米
            </span>
            <span class="h5-dispose__gps-coords tabular-nums">
              {{ mockLocation.lat.toFixed(5) }}, {{ mockLocation.lng.toFixed(5) }}
            </span>
          </div>
          <div v-else class="h5-dispose__gps-hint">
            点击上方按钮获取当前位置
          </div>
        </div>
      </div>

      <!-- ===== 现场证据（zone:photo-section）===== -->
      <div class="h5-card h5-dispose__section" data-zone="photo-section">
        <div class="h5-dispose__section-title">现场证据</div>
        <!-- 隐藏的真实 file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          style="display:none"
          @change="handleFileInputChange"
        />
        <div class="h5-dispose__photo-btns">
          <!-- 真实拍照上传 -->
          <button class="h5-dispose__photo-btn" @click="fileInputRef?.click()">
            <span>📷</span>
            选择照片
          </button>
          <!-- 演示占位图 -->
          <button class="h5-dispose__photo-btn h5-dispose__photo-btn--demo" @click="handleSelectPhotos">
            <span>🎨</span>
            演示占位
          </button>
        </div>
        <p v-if="uploading" class="h5-dispose__photo-hint">上传中... {{ uploadProgress }}%</p>
        <!-- 照片预览列表 -->
        <div v-if="photos.length > 0" class="h5-dispose__photo-list" style="margin-top: 12px">
          <div
            v-for="(photo, idx) in photos"
            :key="idx"
            class="h5-dispose__photo-item"
          >
            <!-- 真实图片、演示占位图均使用 <img> 显示 -->
            <img
              :src="photo"
              class="h5-dispose__photo-thumb"
              :alt="`证据 ${idx + 1}`"
            />
            <button class="h5-dispose__photo-remove" @click="removePhoto(idx)" title="删除">×</button>
          </div>
        </div>
        <p v-if="photos.length === 0" class="h5-dispose__photo-hint">
          点击“选择照片”上传现场照片，或点击“演示占位”生成占位图
        </p>
      </div>

      <!-- ===== 提交区（zone:submit）===== -->
      <div class="h5-dispose__submit-row" data-zone="submit">
        <button
          class="h5-btn-primary h5-dispose__submit-btn"
          :disabled="submitting || description.trim().length === 0"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交处置' }}
        </button>
        <div v-if="msg" class="h5-dispose__msg" :class="msgSuccess ? 'h5-dispose__msg--success' : 'h5-dispose__msg--error'">
          {{ msg }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { submitDisposal } from "@/services/workOrderService"
import { getTable } from "@/services/sqliteMirrorRepository"
import { uploadFile } from "@/utils/fileUpload"

// ── 路由 ──────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const orderId    = ref(0)
const orderNo    = ref("")
const loading    = ref(true)
const description = ref("")
const submitting  = ref(false)
const msg         = ref("")
const msgSuccess  = ref(false)

// ── T15.105 GPS mock ────────────────────────────────────────────────────────
const gpsChecked  = ref(false)
/** 演示用固定模拟坐标（佳木斯市区附近） */
const mockLocation = {
  lat: 46.8301 + (Math.random() - 0.5) * 0.002,
  lng: 130.3631 + (Math.random() - 0.5) * 0.002,
}
/** 演示距离：50-300 米随机 */
const mockDistance = ref(Math.floor(50 + Math.random() * 250))

function handleGPS() {
  gpsChecked.value = true
}

// ── T15.106 照片 mock + 真实上传 ───────────────────────────────────────────────
const photos = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading     = ref(false)
const uploadProgress = ref(0)

// 演示占位图路径（由内置文件服务器自动生成 SVG）
const DEMO_PHOTOS = [
  "/uploads/demo-photo-1.jpg",
  "/uploads/demo-photo-2.jpg",
  "/uploads/demo-photo-3.jpg",
]

function handleSelectPhotos() {
  // 演示模式：直接添加 3 张占位图 URL（不重复添加）
  for (const p of DEMO_PHOTOS) {
    if (!photos.value.includes(p)) photos.value.push(p)
  }
}

async function handleFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) return
  uploading.value = true
  uploadProgress.value = 0
  try {
    // 逐个上传，更新进度
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i])
      urls.push(url)
      uploadProgress.value = Math.round(((i + 1) / files.length) * 100)
    }
    photos.value.push(...urls)
  } catch (err) {
    console.error("上传失败", err)
  } finally {
    uploading.value = false
    input.value = "" // 允许重复选择同一文件
  }
}

function removePhoto(idx: number) {
  photos.value.splice(idx, 1)
}

// ── 事件处理 ──────────────────────────────────────────────────────────────────
function goBack() {
  router.back()
}

function handleSubmit() {
  if (description.value.trim().length === 0) {
    msg.value = "请输入处置说明"
    msgSuccess.value = false
    return
  }
  submitting.value = true
  const result = submitDisposal(orderId.value, {
    disposalDesc: description.value.trim(),
    gpsLocation:  gpsChecked.value
      ? `${mockLocation.lat.toFixed(5)},${mockLocation.lng.toFixed(5)}`
      : null,
    imageUrls: photos.value.length > 0 ? photos.value.join(",") : null,
  })
  submitting.value = false
  if (result.ok) {
    msg.value = "✓ 处置已提交，等待核查"
    msgSuccess.value = true
    setTimeout(() => {
      router.back()
    }, 2000)
  } else {
    msg.value = result.error ?? "提交失败，请重试"
    msgSuccess.value = false
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
onMounted(() => {
  const idParam = route.params.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (Number.isNaN(id) || id <= 0) {
    loading.value = false
    return
  }
  orderId.value = id
  // 获取工单编号
  const orders = getTable<{ id: number; order_no: string }>("work_order")
  const found  = orders.find(o => o.id === id)
  orderNo.value = found?.order_no ?? `WO-${id}`
  loading.value = false
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.h5-dispose {
  min-height: 100vh;
  background: var(--h5-bg-page, #F7F9FC);
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + env(safe-area-inset-bottom) + 16px);
}

/* ===== 顶部导航 ===== */
.h5-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: var(--h5-header-height, 56px);
  padding: 0 16px;
  background: linear-gradient(135deg, #0E3875 0%, #1B6FE8 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  gap: 12px;
}

.h5-header__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 32px;
  min-height: var(--h5-touch-min, 44px);
  display: flex;
  align-items: center;
}

.h5-header__title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}

/* ===== 内容区 ===== */
.h5-dispose__content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-dispose__loading,
.h5-dispose__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
}

/* ===== 各区块 ===== */
.h5-dispose__section {
  padding: 16px;
  border-radius: var(--radius-lg, 12px);
  background: var(--h5-bg-card, #fff);
  box-shadow: var(--h5-shadow-card, 0 2px 12px rgba(0,0,0,0.06));
}

.h5-dispose__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 12px;
}

/* ===== 处置说明 ===== */
.h5-dispose__textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--h5-border, #EEF2F7);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--h5-text-body, #334155);
  background: var(--h5-bg-page, #F7F9FC);
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.h5-dispose__textarea:focus {
  outline: none;
  border-color: var(--h5-primary, #1B6FE8);
}

.h5-dispose__hint {
  margin: 6px 0 0;
  text-align: right;
}

.h5-dispose__hint-text {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}

/* ===== GPS 定位 ===== */
.h5-dispose__gps-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-dispose__gps-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--h5-primary, #1B6FE8);
  background: rgba(27,111,232,0.06);
  color: var(--h5-primary, #1B6FE8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: var(--h5-touch-min, 44px);
  transition: background 0.2s;
}

.h5-dispose__gps-btn--done {
  background: rgba(16,185,129,0.08);
  border-color: var(--risk-green, #10B981);
  color: var(--risk-green, #10B981);
}

.h5-dispose__gps-icon {
  font-size: 18px;
}

.h5-dispose__gps-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--h5-bg-page, #F7F9FC);
}

.h5-dispose__gps-distance {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
}

.h5-dispose__gps-distance strong {
  color: var(--h5-primary, #1B6FE8);
}

.h5-dispose__gps-coords {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}

.h5-dispose__gps-hint {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}

/* ===== 照片上传 ===== */
.h5-dispose__photo-btns {
  display: flex;
  gap: 8px;
}

.h5-dispose__photo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 12px 8px;
  border-radius: 8px;
  border: 1px dashed var(--h5-border, #CBD5E1);
  background: var(--h5-bg-page, #F7F9FC);
  color: var(--h5-text-muted, #64748B);
  font-size: 13px;
  cursor: pointer;
  min-height: var(--h5-touch-min, 44px);
}

.h5-dispose__photo-btn--demo {
  flex: 0 0 auto;
  width: auto;
  font-size: 12px;
  color: var(--h5-primary, #1B6FE8);
  border-color: var(--h5-primary, #1B6FE8);
  background: rgba(27,111,232,0.04);
}

.h5-dispose__photo-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.h5-dispose__photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--h5-border, #EEF2F7);
  background: #f1f5f9;
}

.h5-dispose__photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.h5-dispose__photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.h5-dispose__photo-hint {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
  margin: 8px 0 0;
  text-align: center;
}

/* ===== 提交区 ===== */
.h5-dispose__submit-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 16px;
}

.h5-dispose__submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-lg, 12px);
  border: none;
  background: linear-gradient(135deg, #1B6FE8 0%, #0E3875 100%);
  color: #fff;
  cursor: pointer;
  min-height: var(--h5-touch-min, 44px);
  transition: opacity 0.2s;
}

.h5-dispose__submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.h5-dispose__msg {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}

.h5-dispose__msg--success {
  background: rgba(16,185,129,0.1);
  color: var(--risk-green, #10B981);
  border: 1px solid rgba(16,185,129,0.2);
}

.h5-dispose__msg--error {
  background: rgba(255,68,68,0.08);
  color: var(--risk-red, #FF4444);
  border: 1px solid rgba(255,68,68,0.15);
}
</style>
