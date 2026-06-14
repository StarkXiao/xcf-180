export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PartStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected'

export interface PartAdmin extends Part {
  sku: string
  stock: number
  status: PartStatus
  originalPrice?: number
  costPrice?: number
  reviewRemark?: string
  reviewedBy?: string
  reviewedAt?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  conflictsWith: string[]
}

export interface CreatePartRequest {
  name: string
  brand: string
  categoryId: string
  price: number
  originalPrice?: number
  costPrice?: number
  sku: string
  stock: number
  image: string
  description: string
  specs: Record<string, string | boolean | number>
  compatibleModels: string[]
  conflictsWith: string[]
  position: PartPosition
  status?: PartStatus
}

export interface UpdatePartRequest {
  name?: string
  brand?: string
  categoryId?: string
  price?: number
  originalPrice?: number
  costPrice?: number
  sku?: string
  stock?: number
  image?: string
  description?: string
  specs?: Record<string, string | boolean | number>
  compatibleModels?: string[]
  conflictsWith?: string[]
  position?: PartPosition
  status?: PartStatus
}

export interface ReviewPartRequest {
  status: 'active' | 'rejected'
  reviewRemark?: string
  reviewedBy: string
}

export interface BatchPriceAdjustRequest {
  partIds: string[]
  adjustType: 'fixed' | 'percent'
  adjustValue: number
  reason?: string
}

export interface BatchStatusRequest {
  partIds: string[]
  status: PartStatus
  reason?: string
}

export interface CreateCategoryRequest {
  name: string
  nameEn: string
  icon?: string
  description?: string
  sortOrder?: number
}

export interface UpdateCategoryRequest {
  name?: string
  nameEn?: string
  icon?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export interface PriceHistoryRecord {
  id: string
  partId: string
  partName: string
  oldPrice: number
  newPrice: number
  changedAt: string
  changedBy: string
  reason?: string
}

export interface StatusHistoryRecord {
  id: string
  partId: string
  partName: string
  oldStatus: PartStatus
  newStatus: PartStatus
  changedAt: string
  changedBy: string
  reason?: string
}

export interface CompatibilityRelation {
  id: string
  partIdA: string
  partIdB: string
  type: 'compatible' | 'conflict'
  severity?: 'warning' | 'error'
  remark?: string
  createdAt: string
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
  compatibleModels: string[]
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

export interface PartRecommendation {
  part: Part
  reason: string
  matchScore: number
  compatibilityStatus: 'compatible' | 'warning' | 'conflict' | 'unknown'
}

export interface PartRecommendations {
  alternatives: PartRecommendation[]
  pairings: PartRecommendation[]
}

export interface UpdateShareRequest {
  note?: string
  expiresAt?: string
  isActive?: boolean
}

export interface FavoriteRecord {
  partId: string
  addedAt: string
}

export interface RecentViewRecord {
  partId: string
  viewedAt: string
}

export interface BikeModel {
  id: string
  name: string
  nameEn: string
  description: string
  basePrice: number
  image?: string
}

export interface DefaultPackage {
  modelId: string
  packageType: 'basic' | 'sport' | 'street'
  name: string
  description: string
  partIds: string[]
}

export interface ModelPackageConfig {
  modelId: string
  packages: {
    type: 'basic' | 'sport' | 'street'
    name: string
    description: string
    categoryParts: Record<string, string>
  }[]
}

export type OrderStatus =
  | 'pending'
  | 'quoted'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface OrderItem {
  partId: string
  partName: string
  partBrand: string
  partImage: string
  categoryId: string
  categoryName: string
  price: number
  quantity: number
  laborFee: number
  subtotal: number
}

export interface OrderStatusHistory {
  status: OrderStatus
  changedAt: string
  changedBy: string
  remark?: string
}

export interface AfterSaleNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
  type: 'comment' | 'issue' | 'solution' | 'followup'
}

export interface Order {
  id: string
  orderNo: string
  dealerName: string
  dealerContact: string
  dealerPhone: string
  modelId: string
  modelName: string
  packageType: 'basic' | 'sport' | 'street' | null
  packageName: string
  items: OrderItem[]
  partsTotal: number
  laborFeeTotal: number
  discount: number
  totalAmount: number
  status: OrderStatus
  statusHistory: OrderStatusHistory[]
  afterSaleNotes: AfterSaleNote[]
  remark?: string
  createdAt: string
  updatedAt: string
  expectedDeliveryDate?: string
}

export interface CreateOrderRequest {
  selectionId: string
  dealerName: string
  dealerContact: string
  dealerPhone: string
  modelId: string
  packageType: 'basic' | 'sport' | 'street' | null
  remark?: string
  expectedDeliveryDate?: string
  discount?: number
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  changedBy: string
  remark?: string
}

export interface AddAfterSaleNoteRequest {
  content: string
  createdBy: string
  type: AfterSaleNote['type']
}
