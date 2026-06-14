import type { Category, Part, Selection, SelectionItem, SelectionVersion, CompatibilityCheckResult, Share, CreateShareRequest, UpdateShareRequest, Order, CreateOrderRequest, UpdateOrderStatusRequest, AddAfterSaleNoteRequest, AfterSaleNote } from '@/types'

const BASE = ''

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const api = {
  getCategories: () => fetchJSON<Category[]>('/api/categories'),

  getParts: (category?: string) => {
    const params = category ? `?category=${category}` : ''
    return fetchJSON<Part[]>(`/api/parts${params}`)
  },

  getPart: (id: string) => fetchJSON<Part>(`/api/parts/${id}`),

  getSelections: () => fetchJSON<Selection[]>('/api/selections'),

  createSelection: (name: string) =>
    fetchJSON<Selection>('/api/selections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateSelection: (id: string, data: Partial<Selection>) =>
    fetchJSON<Selection>(`/api/selections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSelection: (id: string) =>
    fetchJSON<Selection>(`/api/selections/${id}`, { method: 'DELETE' }),

  addItem: (selectionId: string, item: SelectionItem) =>
    fetchJSON<Selection>(`/api/selections/${selectionId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  removeItem: (selectionId: string, partId: string) =>
    fetchJSON<Selection>(`/api/selections/${selectionId}/items/${partId}`, {
      method: 'DELETE',
    }),

  checkCompatibility: (partIds: string[]) =>
    fetchJSON<CompatibilityCheckResult>('/api/compatibility/check', {
      method: 'POST',
      body: JSON.stringify({ partIds }),
    }),

  checkPartCompatibility: (partId: string, selectedPartIds: string[]) =>
    fetchJSON<CompatibilityCheckResult>(`/api/compatibility/part/${partId}/check`, {
      method: 'POST',
      body: JSON.stringify({ partIds: selectedPartIds }),
    }),

  getVersions: (selectionId: string) =>
    fetchJSON<SelectionVersion[]>(`/api/selections/${selectionId}/versions`),

  createVersion: (selectionId: string, description?: string) =>
    fetchJSON<SelectionVersion>(`/api/selections/${selectionId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),

  getVersion: (selectionId: string, versionId: string) =>
    fetchJSON<SelectionVersion>(`/api/selections/${selectionId}/versions/${versionId}`),

  rollbackVersion: (selectionId: string, versionId: string) =>
    fetchJSON<Selection>(`/api/selections/${selectionId}/versions/${versionId}/rollback`, {
      method: 'POST',
    }),

  deleteVersion: (selectionId: string, versionId: string) =>
    fetchJSON<SelectionVersion>(`/api/selections/${selectionId}/versions/${versionId}`, {
      method: 'DELETE',
    }),

  compareVersions: (selectionId: string, versionA: string, versionB: string) =>
    fetchJSON<{ versionA: SelectionVersion; versionB: SelectionVersion }>(
      `/api/selections/${selectionId}/versions/compare?versionA=${versionA}&versionB=${versionB}`
    ),

  createShare: (selectionId: string, data: CreateShareRequest) =>
    fetchJSON<Share>(`/api/selections/${selectionId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getShares: (selectionId: string) =>
    fetchJSON<Share[]>(`/api/selections/${selectionId}/shares`),

  getShare: (shareId: string) =>
    fetchJSON<Share>(`/api/shares/${shareId}`),

  updateShare: (shareId: string, data: UpdateShareRequest) =>
    fetchJSON<Share>(`/api/shares/${shareId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteShare: (shareId: string) =>
    fetchJSON<Share>(`/api/shares/${shareId}`, { method: 'DELETE' }),

  getOrders: (params?: { status?: string; dealerName?: string; modelId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.dealerName) searchParams.set('dealerName', params.dealerName)
    if (params?.modelId) searchParams.set('modelId', params.modelId)
    const qs = searchParams.toString()
    return fetchJSON<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`)
  },

  getOrder: (id: string) =>
    fetchJSON<Order>(`/api/orders/${id}`),

  createOrder: (data: CreateOrderRequest) =>
    fetchJSON<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrder: (id: string, data: Partial<Pick<Order, 'dealerName' | 'dealerContact' | 'dealerPhone' | 'remark' | 'expectedDeliveryDate'>>) =>
    fetchJSON<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteOrder: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }),

  updateOrderStatus: (id: string, data: UpdateOrderStatusRequest) =>
    fetchJSON<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateOrderDiscount: (id: string, discount: number) =>
    fetchJSON<Order>(`/api/orders/${id}/discount`, {
      method: 'PUT',
      body: JSON.stringify({ discount }),
    }),

  addAfterSaleNote: (orderId: string, data: AddAfterSaleNoteRequest) =>
    fetchJSON<AfterSaleNote>(`/api/orders/${orderId}/after-sale-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAfterSaleNote: (orderId: string, noteId: string) =>
    fetchJSON<{ success: boolean }>(`/api/orders/${orderId}/after-sale-notes/${noteId}`, {
      method: 'DELETE',
    }),
}
