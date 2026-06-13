export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  description?: string
  sortOrder?: number
}

export interface PartPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface Part {
  id: string
  name: string
  categoryId: string
  price: number
  image: string
  description: string
  specs: Record<string, string | boolean | number>
  compatible: string[]
  conflictsWith: string[]
  position: PartPosition
}

export interface CompatibilityConflict {
  partId: string
  conflictPartId: string
  partName: string
  conflictPartName: string
  severity: 'warning' | 'error'
  message: string
}

export interface CompatibilityCheckResult {
  hasConflicts: boolean
  conflicts: CompatibilityConflict[]
  warnings: CompatibilityConflict[]
}

export interface SelectionItem {
  partId: string
  quantity: number
}

export interface Selection {
  id: string
  name: string
  items: SelectionItem[]
  createdAt: string
  updatedAt: string
}

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface PartDiffItem {
  partId: string
  part: Part | null
  diffType: DiffType
  quantityA: number
  quantityB: number
  priceA: number
  priceB: number
  priceDiff: number
}

export interface CategoryDiff {
  categoryId: string
  categoryName: string
  items: PartDiffItem[]
  subtotalA: number
  subtotalB: number
  subtotalDiff: number
}

export interface ComparisonResult {
  selectionA: Selection | null
  selectionB: Selection | null
  totalA: number
  totalB: number
  totalDiff: number
  totalDiffPercent: number
  categories: CategoryDiff[]
  addedCount: number
  removedCount: number
  modifiedCount: number
  unchangedCount: number
}

export interface ReplacementSuggestion {
  categoryId: string
  categoryName: string
  partA: Part | null
  partB: Part | null
  suggestion: string
  priceDiff: number
  pros: string[]
  cons: string[]
}
