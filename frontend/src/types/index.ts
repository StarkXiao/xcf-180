export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
  status?: 'active' | 'inactive'
  visible?: boolean
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
  imageUrl?: string
  description: string
  specs: Record<string, string | boolean | number>
  compatibleModels: string[]
  position: PartPosition
  model?: string
  inStock?: boolean
  status?: PartStatus
  isFeatured?: boolean
  discount?: number
  rating?: number
  tags?: string[]
  originalPrice?: number
  stock?: number
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

export type TemplateStatus = 'draft' | 'pending_review' | 'published' | 'archived'

export interface TemplateCategory {
  id: string
  name: string
  nameEn: string
  sortOrder: number
}

export interface Template {
  id: string
  name: string
  nameEn: string
  description: string
  coverImage: string
  category: string
  modelIds: string[]
  items: SelectionItem[]
  status: TemplateStatus
  isHot: boolean
  isRecommended: boolean
  sortOrder: number
  useCount: number
  favoriteCount: number
  viewCount: number
  tags: string[]
  author: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface CreateTemplateRequest {
  name: string
  nameEn: string
  description: string
  coverImage: string
  category: string
  modelIds: string[]
  items: SelectionItem[]
  tags: string[]
}

export interface UpdateTemplateRequest {
  name?: string
  nameEn?: string
  description?: string
  coverImage?: string
  category?: string
  modelIds?: string[]
  items?: SelectionItem[]
  status?: TemplateStatus
  isHot?: boolean
  isRecommended?: boolean
  sortOrder?: number
  tags?: string[]
}

export interface BatchPublishRequest {
  templateIds: string[]
  publishAt?: string
}

export interface BatchUpdateStatusRequest {
  templateIds: string[]
  status: TemplateStatus
  reason?: string
}

export interface TemplateCompatibilityResult {
  isValid: boolean
  modelCompatibility: {
    modelId: string
    modelName: string
    isCompatible: boolean
    incompatibleParts: string[]
  }[]
  partConflicts: CompatibilityConflict[]
  partWarnings: CompatibilityConflict[]
  totalPrice: number
  totalLaborFee: number
  grandTotal: number
}

export interface TemplateFavorite {
  templateId: string
  addedAt: string
}

export interface ApplyTemplateResult {
  success: boolean
  selection?: Selection
  compatibility?: TemplateCompatibilityResult
  error?: string
}

export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface InventoryInfo {
  partId: string
  totalStock: number
  reservedStock: number
  availableStock: number
  stockLevel: StockLevel
  alertThreshold: number
}

export interface InventoryReservation {
  id: string
  selectionId: string
  partId: string
  quantity: number
  createdAt: string
  expiresAt?: string
  status: 'active' | 'released' | 'consumed'
}

export type PurchaseOrderStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  partId: string
  partName: string
  partSku: string
  quantity: number
  unitCost: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  orderNo: string
  supplier: string
  items: PurchaseOrderItem[]
  totalAmount: number
  status: PurchaseOrderStatus
  remark?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  expectedDate?: string
  receivedDate?: string
}

export interface CreatePurchaseOrderRequest {
  supplier: string
  items: Omit<PurchaseOrderItem, 'subtotal'>[]
  remark?: string
  expectedDate?: string
  createdBy: string
}

export interface StockAlert {
  id: string
  partId: string
  partName: string
  partSku: string
  categoryId: string
  currentStock: number
  alertThreshold: number
  alertType: 'out_of_stock' | 'low_stock'
  isRead: boolean
  createdAt: string
}

export interface SubstitutePart {
  partId: string
  part: Part
  matchScore: number
  reasons: string[]
  priceDiff: number
  stockLevel: StockLevel
  availableStock: number
}

export interface StockReservationResult {
  success: boolean
  reservations: InventoryReservation[]
  failedItems: { partId: string; reason: string }[]
}

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'sent_to_customer'
  | 'customer_confirmed'
  | 'customer_rejected'
  | 'expired'
  | 'converted'

export type ApprovalRole = 'sales' | 'sales_manager' | 'finance' | 'general_manager'

export type ApprovalAction = 'approve' | 'reject' | 'return'

export interface QuoteItem {
  partId: string
  partName: string
  partBrand: string
  partImage: string
  categoryId: string
  categoryName: string
  originalPrice: number
  unitPrice: number
  discountRate: number
  quantity: number
  laborFee: number
  subtotal: number
}

export interface QuotePlan {
  id: string
  name: string
  description?: string
  items: QuoteItem[]
  partsTotal: number
  laborFeeTotal: number
  discountTotal: number
  totalAmount: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
  appliedDiscountRules?: {
    ruleId: string
    ruleName: string
    appliedAmount: number
    description: string
  }[]
}

export interface ApprovalNode {
  id: string
  role: ApprovalRole
  approverName?: string
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'skipped'
  actionAt?: string
  comment?: string
}

export interface ApprovalFlow {
  id: string
  currentStep: number
  nodes: ApprovalNode[]
  history: {
    nodeId: string
    role: ApprovalRole
    approverName?: string
    action: ApprovalAction
    comment?: string
    actedAt: string
  }[]
  startedAt?: string
  completedAt?: string
}

export interface DiscountRule {
  id: string
  name: string
  description?: string
  type: 'percentage' | 'fixed' | 'category' | 'brand' | 'volume'
  value: number
  minAmount?: number
  maxAmount?: number
  categoryId?: string
  brand?: string
  minQuantity?: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DiscountResult {
  ruleId: string
  ruleName: string
  appliedAmount: number
  description: string
}

export interface CustomerConfirmation {
  id: string
  confirmedBy: string
  confirmedAt: string
  contactInfo: string
  signature?: string
  ipAddress?: string
  userAgent?: string
  note?: string
  selectedPlanId?: string
}

export interface QuoteExportRecord {
  id: string
  exportedBy: string
  exportedAt: string
  format: 'pdf' | 'excel' | 'print'
  version: number
}

export interface QuoteVersion {
  id: string
  versionNumber: number
  createdAt: string
  createdBy: string
  description?: string
  plans: QuotePlan[]
  totalAmount: number
}

export interface Quote {
  id: string
  quoteNo: string
  customerName: string
  customerContact: string
  customerPhone: string
  customerEmail?: string
  modelId: string
  modelName: string
  packageType: 'basic' | 'sport' | 'street' | null
  packageName: string
  plans: QuotePlan[]
  activePlanId?: string
  status: QuoteStatus
  approvalFlow: ApprovalFlow | null
  customerConfirmation: CustomerConfirmation | null
  exportRecords: QuoteExportRecord[]
  versions: QuoteVersion[]
  currentVersion: number
  validUntil?: string
  remark?: string
  internalNote?: string
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt: string
  convertedOrderId?: string
}

export interface CreateQuoteRequest {
  selectionId: string
  customerName: string
  customerContact: string
  customerPhone: string
  customerEmail?: string
  modelId: string
  packageType: 'basic' | 'sport' | 'street' | null
  remark?: string
  validUntil?: string
}

export interface UpdateQuoteRequest {
  customerName?: string
  customerContact?: string
  customerPhone?: string
  customerEmail?: string
  remark?: string
  internalNote?: string
  validUntil?: string
  activePlanId?: string
}

export interface CreateQuotePlanRequest {
  quoteId: string
  name: string
  description?: string
  items: {
    partId: string
    unitPrice?: number
    discountRate?: number
    quantity: number
  }[]
  isDefault?: boolean
}

export interface UpdateQuotePlanRequest {
  name?: string
  description?: string
  items?: {
    partId: string
    unitPrice?: number
    discountRate?: number
    quantity: number
  }[]
  isDefault?: boolean
}

export interface SubmitApprovalRequest {
  submitter: string
  comment?: string
}

export interface ProcessApprovalRequest {
  nodeId: string
  role: ApprovalRole
  action: ApprovalAction
  approverName: string
  comment?: string
}

export interface CustomerConfirmRequest {
  planId?: string
  confirmedBy: string
  contactInfo: string
  signature?: string
  note?: string
}

export interface ExportQuoteRequest {
  format: 'pdf' | 'excel' | 'print'
  planId?: string
  exportedBy: string
}

export interface CreateDiscountRuleRequest {
  name: string
  description?: string
  type: DiscountRule['type']
  value: number
  minAmount?: number
  maxAmount?: number
  categoryId?: string
  brand?: string
  minQuantity?: number
  priority?: number
  isActive?: boolean
}

export interface UpdateDiscountRuleRequest {
  name?: string
  description?: string
  type?: DiscountRule['type']
  value?: number
  minAmount?: number
  maxAmount?: number
  categoryId?: string
  brand?: string
  minQuantity?: number
  priority?: number
  isActive?: boolean
}

export interface CalculateDiscountRequest {
  items: {
    partId: string
    categoryId: string
    brand: string
    unitPrice: number
    quantity: number
  }[]
  totalAmount: number
}

export interface PlanComparisonResult {
  planA: QuotePlan
  planB: QuotePlan
  totalDiff: number
  totalDiffPercent: number
  items: {
    partId: string
    partName: string
    quantityA: number
    quantityB: number
    priceA: number
    priceB: number
    priceDiff: number
    diffType: 'added' | 'removed' | 'modified' | 'unchanged'
  }[]
}

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  sales: '销售',
  sales_manager: '销售经理',
  finance: '财务',
  general_manager: '总经理',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  sent_to_customer: '已发客户',
  customer_confirmed: '客户确认',
  customer_rejected: '客户拒绝',
  expired: '已过期',
  converted: '已转订单',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-500',
  pending_approval: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  sent_to_customer: 'bg-blue-500',
  customer_confirmed: 'bg-emerald-500',
  customer_rejected: 'bg-rose-500',
  expired: 'bg-zinc-500',
  converted: 'bg-purple-500',
}

export interface User {
  id: string
  username: string
  email: string
  phone?: string
  nickname?: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserProfile {
  userId: string
  gender?: string
  location?: string
  bikeModel?: string
  ridingStyle?: string
  ridingExperience?: string
  favoriteBrands?: string[]
  socialLinks?: {
    wechat?: string
    weibo?: string
  }
  updatedAt: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
  phone?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface UpdateUserProfileRequest {
  nickname?: string
  phone?: string
  avatar?: string
  bio?: string
  gender?: string
  location?: string
  bikeModel?: string
  ridingStyle?: string
  ridingExperience?: string
  favoriteBrands?: string[]
  socialLinks?: {
    wechat?: string
    weibo?: string
  }
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UserFavoritePart {
  id: string
  userId: string
  targetType: 'part' | 'template' | 'selection'
  targetId: string
  targetName?: string
  addedAt: string
}

export interface UserFavoriteTemplate {
  templateId: string
  addedAt: string
}

export interface UserFavoriteSelection {
  selectionId: string
  selectionName: string
  addedAt: string
}

export interface UserBrowsingHistory {
  id: string
  userId: string
  targetType: 'part' | 'template' | 'selection'
  targetId: string
  targetName?: string
  targetImage?: string
  viewedAt: string
  duration?: number
}

export interface ModificationArchive {
  id: string
  userId: string
  title: string
  description?: string
  coverImage?: string
  bikeModel: string
  items: SelectionItem[]
  totalCost: number
  tags: string[]
  isPublic: boolean
  status: 'draft' | 'published' | 'archived'
  likes: number
  views: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface CreateModificationArchiveRequest {
  title: string
  description?: string
  coverImage?: string
  bikeModel: string
  items: SelectionItem[]
  totalCost: number
  tags?: string[]
  isPublic?: boolean
}

export interface UpdateModificationArchiveRequest {
  title?: string
  description?: string
  coverImage?: string
  bikeModel?: string
  items?: SelectionItem[]
  totalCost?: number
  tags?: string[]
  isPublic?: boolean
  status?: 'draft' | 'published' | 'archived'
}

export interface Collaborator {
  userId: string
  username: string
  nickname?: string
  avatar?: string
  permission: 'view' | 'edit' | 'admin'
  addedAt: string
  addedBy: string
}

export interface SharedResource {
  id: string
  resourceType: 'selection' | 'archive'
  resourceId: string
  resourceName: string
  ownerId: string
  collaborators: Collaborator[]
  createdAt: string
  updatedAt: string
}

export interface InviteCollaboratorRequest {
  email?: string
  username?: string
  permission: 'view' | 'edit' | 'admin'
}

export interface UpdateCollaboratorPermissionRequest {
  permission: 'view' | 'edit' | 'admin'
}

export interface UserStats {
  favoriteParts: number
  favoriteTemplates: number
  browsingHistoryCount: number
  archivesCount: number
  publishedArchivesCount: number
  collaborationsCount: number
  totalSpent: number
}

export type CustomerSource = 'walk_in' | 'phone' | 'online' | 'referral' | 'social_media' | 'other'

export type CustomerLevel = 'normal' | 'silver' | 'gold' | 'platinum'

export interface CustomerVehicle {
  id: string
  customerId: string
  licensePlate: string
  modelId: string
  modelName: string
  vin?: string
  mileage?: number
  purchaseDate?: string
  lastServiceDate?: string
  color?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  contact?: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  address?: string
  level: CustomerLevel
  source: CustomerSource
  sourceRemark?: string
  tags: string[]
  remark?: string
  vehicles: CustomerVehicle[]
  totalSpent: number
  totalVisits: number
  lastVisitAt?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest {
  name: string
  phone: string
  contact?: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  address?: string
  level?: CustomerLevel
  source?: CustomerSource
  sourceRemark?: string
  tags?: string[]
  remark?: string
  vehicle?: Omit<CustomerVehicle, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>
}

export interface UpdateCustomerRequest {
  name?: string
  phone?: string
  contact?: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  address?: string
  level?: CustomerLevel
  source?: CustomerSource
  sourceRemark?: string
  tags?: string[]
  remark?: string
}

export type RequirementPriority = 'low' | 'medium' | 'high' | 'urgent'

export type RequirementType = 'appearance' | 'performance' | 'comfort' | 'safety' | 'audio' | 'lighting' | 'other'

export interface RequirementItem {
  id: string
  type: RequirementType
  description: string
  priority: RequirementPriority
  budgetRange?: { min: number; max: number }
  preferredBrands?: string[]
  remark?: string
}

export interface RequirementRecord {
  id: string
  customerId: string
  customerName: string
  vehicleId?: string
  vehicleInfo?: string
  items: RequirementItem[]
  overallBudget?: { min: number; max: number }
  expectedDeliveryDate?: string
  stylePreference?: string
  usageScenario?: string
  specialRequirements?: string
  recordedBy: string
  recordedAt: string
  remark?: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface CreateRequirementRequest {
  customerId: string
  vehicleId?: string
  items: Omit<RequirementItem, 'id'>[]
  overallBudget?: { min: number; max: number }
  expectedDeliveryDate?: string
  stylePreference?: string
  usageScenario?: string
  specialRequirements?: string
  remark?: string
}

export interface UpdateRequirementRequest {
  items?: RequirementItem[]
  overallBudget?: { min: number; max: number }
  expectedDeliveryDate?: string
  stylePreference?: string
  usageScenario?: string
  specialRequirements?: string
  remark?: string
  status?: RequirementRecord['status']
}

export type ConstructionPhase = 'inspection' | 'disassembly' | 'parts_prep' | 'installation' | 'testing' | 'reassembly' | 'final_check' | 'completed'

export const CONSTRUCTION_PHASE_ORDER: ConstructionPhase[] = [
  'inspection',
  'disassembly',
  'parts_prep',
  'installation',
  'testing',
  'reassembly',
  'final_check',
  'completed',
]

export const CONSTRUCTION_PHASE_LABELS: Record<ConstructionPhase, string> = {
  inspection: '车辆检查',
  disassembly: '部件拆卸',
  parts_prep: '配件准备',
  installation: '安装施工',
  testing: '调试测试',
  reassembly: '复原装车',
  final_check: '终检验收',
  completed: '施工完成',
}

export type ConstructionTaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'blocked'

export const CONSTRUCTION_TASK_STATUS_COLORS: Record<ConstructionTaskStatus, string> = {
  pending: 'text-gray-400 bg-gray-500/10',
  in_progress: 'text-blue-400 bg-blue-500/10',
  paused: 'text-yellow-400 bg-yellow-500/10',
  completed: 'text-green-400 bg-green-500/10',
  blocked: 'text-red-400 bg-red-500/10',
}

export interface ConstructionTask {
  id: string
  phase: ConstructionPhase
  name: string
  description?: string
  assignee?: string
  assignedTo?: string[]
  assignedWorkerNames?: string[]
  estimatedHours: number
  actualHours?: number
  status: ConstructionTaskStatus
  startAt?: string
  endAt?: string
  actualStartAt?: string
  actualEndAt?: string
  completedAt?: string
  remark?: string
  dependencies?: string[]
  priority?: RequirementPriority
  order?: number
  startDate?: string
  endDate?: string
}

export interface ConstructionSchedule {
  id: string
  orderId?: string
  quoteId?: string
  customerId: string
  customerName: string
  vehicleId?: string
  vehicleInfo?: string
  tasks: ConstructionTask[]
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  totalEstimatedHours: number
  totalActualHours?: number
  progress: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
  remark?: string
}

export interface CreateConstructionScheduleRequest {
  orderId?: string
  quoteId?: string
  customerId: string
  vehicleId?: string
  tasks: Omit<ConstructionTask, 'id'>[]
  plannedStartDate: string
  plannedEndDate: string
  remark?: string
}

export interface UpdateConstructionScheduleRequest {
  tasks?: ConstructionTask[]
  plannedStartDate?: string
  plannedEndDate?: string
  status?: ConstructionSchedule['status']
  remark?: string
}

export interface UpdateConstructionTaskRequest {
  status?: ConstructionTask['status']
  assignee?: string
  actualHours?: number
  actualStartAt?: string
  actualEndAt?: string
  remark?: string
}

export type ReceptionStatus = 'in_progress' | 'completed' | 'cancelled'

export interface ReceptionSession {
  id: string
  sessionNo: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  vehicleId?: string
  vehicleInfo?: string
  requirementId?: string
  selectionId?: string
  quoteId?: string
  orderId?: string
  scheduleId?: string
  status: ReceptionStatus
  salesPerson: string
  startedAt: string
  completedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export const CUSTOMER_LEVEL_LABELS: Record<CustomerLevel, string> = {
  normal: '普通客户',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '铂金会员',
}

export const CUSTOMER_LEVEL_COLORS: Record<CustomerLevel, string> = {
  normal: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  silver: 'text-slate-300 bg-slate-400/10 border-slate-400/30',
  gold: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  platinum: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
}

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  walk_in: '到店咨询',
  phone: '电话咨询',
  online: '网络预约',
  referral: '客户推荐',
  social_media: '社交媒体',
  other: '其他渠道',
}

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  appearance: '外观改装',
  performance: '性能提升',
  comfort: '舒适升级',
  safety: '安全强化',
  audio: '音响系统',
  lighting: '灯光升级',
  other: '其他需求',
}

export const REQUIREMENT_PRIORITY_LABELS: Record<RequirementPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

export const REQUIREMENT_PRIORITY_COLORS: Record<RequirementPriority, string> = {
  low: 'text-gray-400 bg-gray-500/10',
  medium: 'text-blue-400 bg-blue-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  urgent: 'text-red-400 bg-red-500/10',
}

export const SCHEDULE_STATUS_LABELS: Record<ConstructionSchedule['status'], string> = {
  scheduled: '已排期',
  in_progress: '施工中',
  completed: '已完成',
  delayed: '已延期',
  cancelled: '已取消',
}

export const SCHEDULE_STATUS_COLORS: Record<ConstructionSchedule['status'], string> = {
  scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  in_progress: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  completed: 'text-green-400 bg-green-500/10 border-green-500/30',
  delayed: 'text-red-400 bg-red-500/10 border-red-500/30',
  cancelled: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

export const TASK_STATUS_LABELS: Record<ConstructionTaskStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  blocked: '已阻塞',
}

export const TASK_STATUS_COLORS: Record<ConstructionTaskStatus, string> = {
  pending: 'text-gray-400 bg-gray-500/10',
  in_progress: 'text-blue-400 bg-blue-500/10',
  paused: 'text-yellow-400 bg-yellow-500/10',
  completed: 'text-green-400 bg-green-500/10',
  blocked: 'text-red-400 bg-red-500/10',
}

