import type { Category, Part, Selection, SelectionItem } from '@/types'

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
}
