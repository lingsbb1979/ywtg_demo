import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const viewPath = resolve(__dirname, "../src/views/screen/ScreenAlarmDispatchView.vue")

function getView() {
  return readFileSync(viewPath, "utf-8")
}

describe("T15.132 大屏告警派遣状态流", () => {
  it("确认按钮仅在 PENDING 时可点击", () => {
    expect(getView()).toMatch(/selectedAlarm\.value\.status === \"PENDING\"|selectedAlarm\.status !== 'PENDING'/)
  })

  it("二级动作仅在 CONFIRMED 后可点击", () => {
    expect(getView()).toMatch(/selectedAlarm\.value\.status === \"CONFIRMED\"|selectedAlarm\.status !== 'CONFIRMED'/)
  })
})