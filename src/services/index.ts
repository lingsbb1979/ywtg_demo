export interface MockHttpResponse<T> {
  code: number
  message: string
  data: T
}

export function createMockHttpResponse<T>(data: T): Promise<MockHttpResponse<T>> {
  return Promise.resolve({
    code: 0,
    message: "ok",
    data
  })
}