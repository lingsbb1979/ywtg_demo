import repository from "./sqliteMirrorRepository"

export interface WorkOrder {
  id: string
  alarmId?: string
  buildingId?: string
  status?: string
  assignedTo?: string
  createdAt?: string
  disposal?: any
  photos?: string[]
}

const TABLE = "work_order"

export async function listWorkOrders(filter?: { status?: string }): Promise<WorkOrder[]> {
  const rows = await repository.readTableAsync<WorkOrder>(TABLE)
  if (filter?.status) {
    return rows.filter((r) => r.status === filter.status)
  }
  return rows
}

export async function createWorkOrder(payload: Partial<WorkOrder>): Promise<WorkOrder> {
  const rows = await repository.readTableAsync<WorkOrder>(TABLE)
  const id = payload.id || `wo-${Date.now().toString(36)}`
  const record: WorkOrder = {
    id,
    alarmId: payload.alarmId || "",
    buildingId: payload.buildingId || "",
    status: payload.status || "pending",
    assignedTo: payload.assignedTo || "",
    createdAt: new Date().toISOString(),
    disposal: payload.disposal || null,
    photos: payload.photos || []
  }
  rows.push(record)
  await repository.writeTableAsync(TABLE, rows)
  return record
}

export async function acceptOrder(id: string): Promise<WorkOrder> {
  const rows = await repository.readTableAsync<WorkOrder>(TABLE)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error("work order not found")
  rows[idx].status = "accepted"
  await repository.writeTableAsync(TABLE, rows)
  return rows[idx]
}

export async function submitDisposal(id: string, payload: any): Promise<WorkOrder> {
  const rows = await repository.readTableAsync<WorkOrder>(TABLE)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error("work order not found")
  rows[idx].disposal = payload
  rows[idx].status = payload?.closed ? "closed" : "processing"
  await repository.writeTableAsync(TABLE, rows)
  return rows[idx]
}

export default {
  listWorkOrders,
  createWorkOrder,
  acceptOrder,
  submitDisposal
}
