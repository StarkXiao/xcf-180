import { create } from 'zustand'
import type {
  Category,
  Part,
  Selection,
  SelectionItem,
  CompatibilityCheckResult,
  CompatibilityConflict,
  ComparisonResult,
  CategoryDiff,
  PartDiffItem,
  DiffType,
  ReplacementSuggestion,
  SortOption,
} from '@/types'
import { api } from '@/api/client'

interface AppState {
  categories: Category[]
  parts: Part[]
  allParts: Part[]
  selections: Selection[]
  activeCategory: string
  currentSelection: Selection | null
  selectedPartIds: string[]
  searchQuery: string
  loading: boolean
  compatibilityResult: CompatibilityCheckResult | null
  compatibilityLoading: boolean
  partConflictMap: Record<string, { hasError: boolean; hasWarning: boolean }>

  priceMin: number | null
  priceMax: number | null
  selectedBrands: string[]
  selectedModels: string[]
  sortBy: SortOption

  setActiveCategory: (cat: string) => void
  setSearchQuery: (q: string) => void
  setPriceMin: (v: number | null) => void
  setPriceMax: (v: number | null) => void
  toggleBrand: (brand: string) => void
  toggleModel: (model: string) => void
  setSortBy: (v: SortOption) => void
  clearFilters: () => void
  getAllBrands: () => string[]
  getAllCompatibleModels: () => string[]
  getPriceRange: () => { min: number; max: number }

  fetchCategories: () => Promise<void>
  fetchParts: () => Promise<void>
  fetchSelections: () => Promise<void>
  createSelection: (name: string) => Promise<Selection | undefined>
  addPartToSelection: (partId: string) => Promise<void>
  removePartFromSelection: (partId: string) => Promise<void>
  setQuantity: (partId: string, quantity: number) => Promise<void>
  clearSelection: () => Promise<void>
  togglePartSelection: (partId: string) => void
  getPartById: (id: string) => Part | undefined
  getSelectedParts: () => Part[]
  getFilteredParts: () => Part[]
  getTotalPrice: () => number
  getCategorySubtotal: (categoryId: string) => number
  getCategoryLaborFee: (categoryId: string) => number
  getTotalLaborFee: () => number
  getGrandTotal: () => number
  getCategoryName: (categoryId: string) => string
  laborFeeRates: Record<string, number>
  initDefaultSelection: () => Promise<void>
  checkCurrentSelectionCompatibility: () => Promise<void>
  checkPartAgainstSelection: (partId: string) => Promise<CompatibilityCheckResult | null>
  getConflictsForPart: (partId: string) => CompatibilityConflict[]
  getWarningsForPart: (partId: string) => CompatibilityConflict[]

  compareSelectionIdA: string | null
  compareSelectionIdB: string | null
  setCompareSelectionA: (id: string | null) => void
  setCompareSelectionB: (id: string | null) => void
  compareSelections: () => ComparisonResult | null
  getReplacementSuggestions: () => ReplacementSuggestion[]
}

export const useStore = create<AppState>((set, get) => ({
  categories: [],
  parts: [],
  allParts: [],
  selections: [],
  activeCategory: 'all',
  currentSelection: null,
  selectedPartIds: [],
  searchQuery: '',
  loading: false,
  compatibilityResult: null,
  compatibilityLoading: false,
  partConflictMap: {},

  priceMin: null,
  priceMax: null,
  selectedBrands: [],
  selectedModels: [],
  sortBy: 'default',

  compareSelectionIdA: null,
  compareSelectionIdB: null,

  laborFeeRates: {
    exhaust: 0.15,
    brake: 0.18,
    wheels: 0.10,
    handlebar: 0.08,
    lighting: 0.05,
    bodykit: 0.12,
  },

  setActiveCategory: (cat) => {
    set({ activeCategory: cat })
    const { allParts } = get()
    const filtered = cat === 'all'
      ? allParts
      : allParts.filter((p) => p.categoryId === cat)
    set({ parts: filtered })
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setPriceMin: (v) => set({ priceMin: v }),
  setPriceMax: (v) => set({ priceMax: v }),
  toggleBrand: (brand) =>
    set((state) => ({
      selectedBrands: state.selectedBrands.includes(brand)
        ? state.selectedBrands.filter((b) => b !== brand)
        : [...state.selectedBrands, brand],
    })),
  toggleModel: (model) =>
    set((state) => ({
      selectedModels: state.selectedModels.includes(model)
        ? state.selectedModels.filter((m) => m !== model)
        : [...state.selectedModels, model],
    })),
  setSortBy: (v) => set({ sortBy: v }),
  clearFilters: () =>
    set({
      priceMin: null,
      priceMax: null,
      selectedBrands: [],
      selectedModels: [],
      sortBy: 'default',
      searchQuery: '',
    }),
  getAllBrands: () => {
    const { allParts } = get()
    return Array.from(new Set(allParts.map((p) => p.brand))).sort()
  },
  getAllCompatibleModels: () => {
    const { allParts } = get()
    const set = new Set<string>()
    allParts.forEach((p) => p.compatible.forEach((m) => set.add(m)))
    return Array.from(set).sort()
  },
  getPriceRange: () => {
    const { allParts } = get()
    if (allParts.length === 0) return { min: 0, max: 0 }
    let min = Infinity
    let max = -Infinity
    allParts.forEach((p) => {
      if (p.price < min) min = p.price
      if (p.price > max) max = p.price
    })
    return { min, max }
  },

  fetchCategories: async () => {
    try {
      const categories = await api.getCategories()
      set({ categories })
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  },

  fetchParts: async () => {
    set({ loading: true })
    try {
      const allParts = await api.getParts()
      const { activeCategory } = get()
      const filtered = activeCategory === 'all'
        ? allParts
        : allParts.filter((p) => p.categoryId === activeCategory)
      set({ allParts, parts: filtered, loading: false })
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
    return get().allParts.find((p) => p.id === id)
  },

  getSelectedParts: () => {
    const { allParts, selectedPartIds } = get()
    return allParts.filter((p) => selectedPartIds.includes(p.id))
  },

  getFilteredParts: () => {
    const {
      parts,
      searchQuery,
      priceMin,
      priceMax,
      selectedBrands,
      selectedModels,
      sortBy,
    } = get()
    let result = [...parts]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
    }
    if (priceMin != null) {
      result = result.filter((p) => p.price >= priceMin)
    }
    if (priceMax != null) {
      result = result.filter((p) => p.price <= priceMax)
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand))
    }
    if (selectedModels.length > 0) {
      result = result.filter((p) =>
        p.compatible.some((m) => selectedModels.includes(m))
      )
    }
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
        break
      default:
        break
    }
    return result
  },

  getTotalPrice: () => {
    const { currentSelection, allParts } = get()
    if (!currentSelection) return 0
    return currentSelection.items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return total + (part ? part.price * item.quantity : 0)
    }, 0)
  },

  getCategorySubtotal: (categoryId) => {
    const { currentSelection, allParts } = get()
    if (!currentSelection) return 0
    return currentSelection.items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      if (part && part.categoryId === categoryId) {
        return total + part.price * item.quantity
      }
      return total
    }, 0)
  },

  getCategoryLaborFee: (categoryId) => {
    const { laborFeeRates } = get()
    const subtotal = get().getCategorySubtotal(categoryId)
    const rate = laborFeeRates[categoryId] ?? 0.1
    return Math.round(subtotal * rate)
  },

  getTotalLaborFee: () => {
    const { currentSelection, allParts, laborFeeRates } = get()
    if (!currentSelection) return 0
    return currentSelection.items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      if (part) {
        const rate = laborFeeRates[part.categoryId] ?? 0.1
        return total + Math.round(part.price * item.quantity * rate)
      }
      return total
    }, 0)
  },

  getGrandTotal: () => {
    return get().getTotalPrice() + get().getTotalLaborFee()
  },

  getCategoryName: (categoryId) => {
    const { categories } = get()
    return categories.find((c) => c.id === categoryId)?.name || categoryId
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

  setCompareSelectionA: (id) => set({ compareSelectionIdA: id }),
  setCompareSelectionB: (id) => set({ compareSelectionIdB: id }),

  compareSelections: () => {
    const { selections, allParts, categories, compareSelectionIdA, compareSelectionIdB } = get()
    if (!compareSelectionIdA || !compareSelectionIdB) return null

    const selectionA = selections.find((s) => s.id === compareSelectionIdA) || null
    const selectionB = selections.find((s) => s.id === compareSelectionIdB) || null

    const getSelectionTotal = (sel: Selection | null) => {
      if (!sel) return 0
      return sel.items.reduce((total, item) => {
        const part = allParts.find((p) => p.id === item.partId)
        return total + (part ? part.price * item.quantity : 0)
      }, 0)
    }

    const totalA = getSelectionTotal(selectionA)
    const totalB = getSelectionTotal(selectionB)
    const totalDiff = totalB - totalA
    const totalDiffPercent = totalA > 0 ? (totalDiff / totalA) * 100 : 0

    const getItemMap = (sel: Selection | null) => {
      const map = new Map<string, number>()
      if (sel) {
        sel.items.forEach((item) => map.set(item.partId, item.quantity))
      }
      return map
    }

    const mapA = getItemMap(selectionA)
    const mapB = getItemMap(selectionB)

    const allPartIds = new Set([...mapA.keys(), ...mapB.keys()])

    const partDiffs: PartDiffItem[] = []
    allPartIds.forEach((partId) => {
      const part = allParts.find((p) => p.id === partId) || null
      const quantityA = mapA.get(partId) || 0
      const quantityB = mapB.get(partId) || 0
      const priceA = part ? part.price * quantityA : 0
      const priceB = part ? part.price * quantityB : 0
      const priceDiff = priceB - priceA

      let diffType: DiffType
      if (quantityA === 0 && quantityB > 0) {
        diffType = 'added'
      } else if (quantityA > 0 && quantityB === 0) {
        diffType = 'removed'
      } else if (quantityA !== quantityB) {
        diffType = 'modified'
      } else {
        diffType = 'unchanged'
      }

      partDiffs.push({
        partId,
        part,
        diffType,
        quantityA,
        quantityB,
        priceA,
        priceB,
        priceDiff,
      })
    })

    const categoryMap = new Map<string, CategoryDiff>()
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        items: [],
        subtotalA: 0,
        subtotalB: 0,
        subtotalDiff: 0,
      })
    })

    partDiffs.forEach((diff) => {
      const catId = diff.part?.categoryId || 'other'
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: catId,
          items: [],
          subtotalA: 0,
          subtotalB: 0,
          subtotalDiff: 0,
        })
      }
      const catDiff = categoryMap.get(catId)!
      catDiff.items.push(diff)
      catDiff.subtotalA += diff.priceA
      catDiff.subtotalB += diff.priceB
      catDiff.subtotalDiff += diff.priceDiff
    })

    const categoriesResult = Array.from(categoryMap.values()).filter(
      (c) => c.items.length > 0
    )

    let addedCount = 0
    let removedCount = 0
    let modifiedCount = 0
    let unchangedCount = 0

    partDiffs.forEach((diff) => {
      switch (diff.diffType) {
        case 'added':
          addedCount++
          break
        case 'removed':
          removedCount++
          break
        case 'modified':
          modifiedCount++
          break
        case 'unchanged':
          unchangedCount++
          break
      }
    })

    return {
      selectionA,
      selectionB,
      totalA,
      totalB,
      totalDiff,
      totalDiffPercent,
      categories: categoriesResult,
      addedCount,
      removedCount,
      modifiedCount,
      unchangedCount,
    }
  },

  getReplacementSuggestions: () => {
    const { allParts, compareSelectionIdA, compareSelectionIdB, selections, categories } = get()
    if (!compareSelectionIdA || !compareSelectionIdB) return []

    const selectionA = selections.find((s) => s.id === compareSelectionIdA)
    const selectionB = selections.find((s) => s.id === compareSelectionIdB)
    if (!selectionA || !selectionB) return []

    const suggestions: ReplacementSuggestion[] = []
    const categoryPartsMap = new Map<string, Part[]>()

    allParts.forEach((part) => {
      if (!categoryPartsMap.has(part.categoryId)) {
        categoryPartsMap.set(part.categoryId, [])
      }
      categoryPartsMap.get(part.categoryId)!.push(part)
    })

    const getCategoryName = (catId: string) => {
      return categories.find((c) => c.id === catId)?.name || catId
    }

    const catAList = selectionA.items.map((i) => i.partId)
    const catBList = selectionB.items.map((i) => i.partId)

    const allCategories = new Set<string>()
    catAList.forEach((id) => {
      const part = allParts.find((p) => p.id === id)
      if (part) allCategories.add(part.categoryId)
    })
    catBList.forEach((id) => {
      const part = allParts.find((p) => p.id === id)
      if (part) allCategories.add(part.categoryId)
    })

    allCategories.forEach((catId) => {
      const partsInCat = categoryPartsMap.get(catId) || []
      const partsA = partsInCat.filter((p) => catAList.includes(p.id))
      const partsB = partsInCat.filter((p) => catBList.includes(p.id))

      if (partsA.length > 0 && partsB.length > 0) {
        partsA.forEach((partA) => {
          partsB.forEach((partB) => {
            if (partA.id !== partB.id) {
              const priceDiff = partB.price - partA.price
              const pros: string[] = []
              const cons: string[] = []
              let suggestion = ''

              if (priceDiff > 0) {
                suggestion = `升级到 ${partB.name}，获得更好的性能表现`
                pros.push('性能提升')
                pros.push('品质更好')
                cons.push(`价格增加 ¥${priceDiff.toLocaleString()}`)
              } else if (priceDiff < 0) {
                suggestion = `降级到 ${partB.name}，节省预算`
                pros.push(`节省 ¥${Math.abs(priceDiff).toLocaleString()}`)
                pros.push('性价比更高')
                cons.push('性能可能有所下降')
              }

              const specKeysA = Object.keys(partA.specs)
              const specKeysB = Object.keys(partB.specs)
              const commonSpecs = specKeysA.filter((k) => specKeysB.includes(k))
              commonSpecs.slice(0, 2).forEach((key) => {
                const valA = partA.specs[key]
                const valB = partB.specs[key]
                if (valA !== valB) {
                  pros.push(`${key}: ${valA} → ${valB}`)
                }
              })

              suggestions.push({
                categoryId: catId,
                categoryName: getCategoryName(catId),
                partA,
                partB,
                suggestion,
                priceDiff,
                pros,
                cons,
              })
            }
          })
        })
      }
    })

    return suggestions.sort((a, b) => Math.abs(b.priceDiff) - Math.abs(a.priceDiff))
  },
}))
