import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const viewPath = resolve(__dirname, "../src/views/h5/H5HomeView.vue")

function getView() {
  return readFileSync(viewPath, "utf-8")
}

describe("T15.133 H5 告警入口跳转", () => {
  it("首页快捷入口显示告警中心", () => {
    expect(getView()).toContain("告警中心")
    expect(getView()).not.toContain("预警中心")
  })

  it("告警横幅和快捷入口跳转到 /h5/alerts", () => {
    expect(getView()).toMatch(/router\.push\("\/h5\/alerts"\)|openAlarmCenter/)
  })

  it("告警动态点击进入告警中心，不跳工单", () => {
    expect(getView()).toMatch(/if \(type === \"告警\"\)[\s\S]*openAlarmCenter\(/)
  })
})