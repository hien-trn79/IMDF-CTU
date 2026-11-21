const API_URL = 'http://localhost:8081/api'

// Cố đọc thông báo lỗi từ backend (JSON có message/error hoặc văn bản thuần)
async function readError(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = await response.text()
    try {
      const json = JSON.parse(body) as { message?: string; error?: string }
      detail = json.message ?? json.error ?? ''
    } catch {
      detail = body
    }
  } catch {
    // bỏ qua
  }
  return detail.slice(0, 200) || `Lỗi ${response.status}`
}

/** Gọi API có token; ném Error kèm thông báo của backend nếu không thành công. */
export async function apiRequest(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  token: string,
  body?: unknown
): Promise<void> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(await readError(response))
}
