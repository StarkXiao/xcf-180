import { create } from 'zustand'
import type { Category, Part, Selection, SelectionItem, CompatibilityCheckResult, CompatibilityConflict } from '@/types'
import { api } from '@/api/client'

interface AppState {
  categories: Category[]
  parts: Part[]
  selections: Selection[]
  activeCategory: string
  currentSelection: Selection | null
  selectedPartIds: string[]
  searchQuery: string
  loading: boolean
  compatibilityResult: CompatibilityCheckResult | null
  compatibilityLoading: boolean
  partConflictMap: Record<string, { hasError: boolean; hasWarning: boolean }>

  setActiveCategory: (cat: string) => void
  setSearchQuery: (q: string) => void
  fetchCategories: () => Promise<void>
  fetchParts: (category?: string) => Promise<void>
  fetchSelections: () => Promise<void>
  createSelection: (name: string) => Promise<Selection | undefined>
  addPartToSelection: (partId: string) => Promise<void>
  removePartFromSelection: (partId: string) => Promise<void>
  setQuantity: (partId: string, quantity: number) => Promise<void>
  clearSelection: () => Promise<void>
  togglePartSelection: (partId: string) => void
  getPartById: (id: string) => Part | undefined
  getSelectedParts: () => Part[]
  getTotalPrice: () => number
  initDefaultSelection: () => Promise<void>
  checkCurrentSelectionCompatibility: () => Promise<void>
  checkPartAgainstSelection: (partId: string) => Promise<CompatibilityCheckResult | null>
  getConflictsForPart: (partId: string) => CompatibilityConflict[]
  getWarningsForPart: (partId: string) => CompatibilityConflict[]
}

export const useStore = create<AppState>((set, get) => ({
  categories: [],
  parts: [],
  selections: [],
  activeCategory: 'all',
  currentSelection: null,
  selectedPartIds: [],
  searchQuery: '',
  loading: false,
  compatibilityResult: null,
  compatibilityLoading: false,
  partConflictMap: {},

  setActiveCategory: (cat) => {
    set({ activeCategory: cat })
    get().fetchParts(cat === 'all' ? undefined : cat)
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchCategories: async () => {
    try {
      const categories = await api.getCategories()
      set({ categories })
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  },

  fetchParts: async (category) => {
    set({ loading: true })
    try {
      const parts = await api.getParts(category)
      set({ parts, loading: false })
    } catch (e) {
      console.error('Failed to fetch parts:', e)
      set({ loading: false })
    }
  },

  fetchSelections: async () => {
    try {
      const selections = await api.getSelections()
      set({ selections })
    } catch (e) {
      console.error('Failed to fetch selections:', e)
    }
  },

  createSelection: async (name) => {
    try {
      const sel = await api.createSelection(name)
      set((state) => ({
        selections: [...state.selections, sel],
        currentSelection: sel,
      }))
      return sel
    } catch (e) {
      console.error('Failed to create selection:', e)
    }
  },

  addPartToSelection: async (partId) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    const existingItem = currentSelection.items.find((i) => i.partId === partId)
    if (existingItem) {
      await get().setQuantity(partId, existingItem.quantity + 1)
      return
    }
    try {
      const updated = await api.addItem(currentSelection.id, { partId, quantity: 1 })
      set({ currentSelection: updated })
      set((state) => ({
        selections: state.selections.map((s) => (s.id === updated.id ? updated : s)),
      }))
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to add item:', e)
    }
  },

  removePartFromSelection: async (partId) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const updated = await api.removeItem(currentSelection.id, partId)
      set({ currentSelection: updated })
      set((state) => ({
        selections: state.selections.map((s) => (s.id === updated.id ? updated : s)),
      }))
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to remove item:', e)
    }
  },

  setQuantity: async (partId, quantity) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    if (quantity <= 0) {
      await get().removePartFromSelection(partId)
      return
    }
    const updatedItems = currentSelection.items.map((i) =>
      i.partId === partId ? { ...i, quantity } : i
    )
    try {
      const updated = await api.updateSelection(currentSelection.id, {
        ...currentSelection,
        items: updatedItems,
      } as any)
      set({ currentSelection: updated })
      set((state) => ({
        selections: state.selections.map((s) => (s.id === updated.id ? updated : s)),
      }))
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to update quantity:', e)
    }
  },

  clearSelection: async () => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const updated = await api.updateSelection(currentSelection.id, {
        ...currentSelection,
        items: [],
      } as any)
      set({ currentSelection: updated })
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to clear selection:', e)
    }
  },

  togglePartSelection: (partId) => {
    set((state) => {
      const ids = state.selectedPartIds.includes(partId)
        ? state.selectedPartIds.filter((id) => id !== partId)
        : [...state.selectedPartIds, partId]
      return { selectedPartIds: ids }
    })
  },

  getPartById: (id) => {
    return get().parts.find((p) => p.id === id)
  },

  getSelectedParts: () => {
    const { parts, selectedPartIds } = get()
    return parts.filter((p) => selectedPartIds.includes(p.id))
  },

  getTotalPrice: () => {
    const { currentSelection, parts } = get()
    if (!currentSelection) return 0
    return currentSelection.items.reduce((total, item) => {
      const part = parts.find((p) => p.id === item.partId)
      return total + (part ? part.price * item.quantity : 0)
    }, 0)
  },

  initDefaultSelection: async () => {
    const { selections } = get()
    if (selections.length === 0) {
      await get().createSelection('我的改装方案')
    } else {
      set({ currentSelection: selections[0] })
    }
    setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
  },

  checkCurrentSelectionCompatibility: async () => {
    const { currentSelection } = get()
    const partIds = currentSelection?.items.map((i) => i.partId) ?? []
    if (partIds.length === 0) {
      set({ compatibilityResult: null, partConflictMap: {} })
      return
    }
    set({ compatibilityLoading: true })
    try {
      const result = await api.checkCompatibility(partIds)
      const conflictMap: Record<string, { hasError: boolean; hasWarning: boolean }> = {}
      partIds.forEach((id) => { conflictMap[id] = { hasError: false, hasWarning: false } })
      result.conflicts.forEach((c) => {
        const existing1 = conflictMap[c.partId] || { hasError: false, hasWarning: false }
        conflictMap[c.partId] = { ...existing1, hasError: true }
        const existing2 = conflictMap[c.conflictPartId] || { hasError: false, hasWarning: false }
        conflictMap[c.conflictPartId] = { ...existing2, hasError: true }
      })
      result.warnings.forEach((w) => {
        const existing1 = conflictMap[w.partId] || { hasError: false, hasWarning: false }
        conflictMap[w.partId] = { ...existing1, hasWarning: true }
        const existing2 = conflictMap[w.conflictPartId] || { hasError: false, hasWarning: false }
        conflictMap[w.conflictPartId] = { ...existing2, hasWarning: true }
      })
      set({ compatibilityResult: result, partConflictMap: conflictMap })
    } catch (e) {
      console.error('Failed to check compatibility:', e)
    } finally {
      set({ compatibilityLoading: false })
    }
  },

  checkPartAgainstSelection: async (partId) => {
    const { currentSelection } = get()
    const selectedIds = currentSelection?.items.filter((i) => i.partId !== partId).map((i) => i.partId) ?? []
    try {
      return await api.checkPartCompatibility(partId, selectedIds)
    } catch (e) {
      console.error('Failed to check part compatibility:', e)
      return null
    }
  },

  getConflictsForPart: (partId) => {
    const { compatibilityResult } = get()
    if (!compatibilityResult) return []
    return compatibilityResult.conflicts.filter(
      (c) => c.partId === partId || c.conflictPartId === partId
    )
  },

  getWarningsForPart: (partId) => {
    const { compatibilityResult } = get()
    if (!compatibilityResult) return []
    return compatibilityResult.warnings.filter(
      (w) => w.partId === partId || w.conflictPartId === partId
    )
  },
}))
