import { beforeEach, describe, expect, it } from "vitest"

const MEM_KEY = "__ywtg_sqlite_mirror_store__"

function resetMem() {
  delete (globalThis as any)[MEM_KEY]
}

describe("T15.131 告警菜单红点计数", () => {
  beforeEach(resetMem)

  it("统计所有未关闭告警，不区分 RED / ORANGE", async () => {
    const { setTable } = await import("../src/services/sqliteMirrorRepository")
    const { countOpenAlarms } = await import("../src/services/alarmService")

    setTable("alarm_record", [
      { id: 1, alarm_level: "RED", status: "PENDING" },
      { id: 2, alarm_level: "ORANGE", status: "PENDING" },
      { id: 3, alarm_level: "RED", status: "CLOSED" },
    ])

    expect(countOpenAlarms()).toBe(2)
  })
})