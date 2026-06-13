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
  brand: string
  categoryId: string
  price: number
  image: string
  description: string
  specs: Record<string, string | boolean | number>
  compatible: string[]
  conflictsWith: string[]
  position: PartPosition
}

export type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'

export interface FilterState {
  priceMin: number | null
  priceMax: number | null
  brands: string[]
  compatibleModels: string[]
  sortBy: SortOption
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

export interface SelectionVersion {
  id: string
  name: string
  items: SelectionItem[]
  createdAt: string
  description?: string
  versionNumber: number
}

export interface Selection {
  id: string
  name: string
  items: SelectionItem[]
  createdAt: string
  updatedAt: string
  versions: SelectionVersion[]
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

export interface ShareAccessLog {
  accessedAt: string
  ip?: string
  userAgent?: string
}

export interface Share {
  id: string
  selectionId: string
  name: string
  items: SelectionItem[]
  note?: string
  createdAt: string
  expiresAt?: string
  isActive: boolean
  accessCount: number
  lastAccessedAt?: string
  accessLogs: ShareAccessLog[]
}

export interface CreateShareRequest {
  note?: string
  expiresInDays?: number
  expiresAt?: string
}

export interface UpdateShareRequest {
  note?: string
  expiresAt?: string
  isActive?: boolean
}
