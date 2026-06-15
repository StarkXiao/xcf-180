import { create } from 'zustand'
import type {
  Category,
  Part,
  Selection,
  SelectionItem,
  SelectionVersion,
  CompatibilityCheckResult,
  CompatibilityConflict,
  ComparisonResult,
  CategoryDiff,
  PartDiffItem,
  DiffType,
  ReplacementSuggestion,
  SortOption,
  Share,
  CreateShareRequest,
  PartRecommendations,
  PartRecommendation,
  BikeModel,
  FavoriteRecord,
  RecentViewRecord,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  AddAfterSaleNoteRequest,
  OrderStatus,
  Template,
  TemplateCategory,
  TemplateStatus,
  TemplateCompatibilityResult,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ApplyTemplateResult,
  InventoryInfo,
  StockAlert,
  SubstitutePart,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  PurchaseOrderStatus,
  StockLevel,
  Quote,
  QuotePlan,
  QuoteStatus,
  QuoteItem,
  DiscountRule,
  DiscountResult,
  PlanComparisonResult,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  CreateQuotePlanRequest,
  UpdateQuotePlanRequest,
  SubmitApprovalRequest,
  ProcessApprovalRequest,
  CustomerConfirmRequest,
  ExportQuoteRequest,
  CreateDiscountRuleRequest,
  UpdateDiscountRuleRequest,
  ApprovalRole,
  User,
  UserProfile,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  UserFavoritePart,
  UserBrowsingHistory,
  ModificationArchive,
  CreateModificationArchiveRequest,
  UpdateModificationArchiveRequest,
  SharedResource,
  UserStats,
  Customer,
  CustomerVehicle,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerLevel,
  CustomerSource,
  RequirementRecord,
  CreateRequirementRequest,
  UpdateRequirementRequest,
  RequirementType,
  RequirementPriority,
  ConstructionSchedule,
  CreateConstructionScheduleRequest,
  UpdateConstructionScheduleRequest,
  UpdateConstructionTaskRequest,
  ConstructionTask,
  ConstructionPhase,
  ReceptionSelection,
  CreateReceptionSelectionRequest,
  CreateScheduleFromQuoteRequest,
  PartReview,
  ReviewStats,
  PartIssue,
  PartWarning,
  CreatePartReviewRequest,
  ProcessReviewRequest,
  CreateIssueRequest,
  UpdateIssueStatusRequest,
  AcknowledgeWarningRequest,
  VehicleModelProfile,
  VehicleModelProfileSummary,
  CreateVehicleModelProfileRequest,
  UpdateVehicleModelProfileRequest,
  ModificationRestriction,
  RegulationNote,
  AssemblyZone,
  AfterSalesRecord,
  AfterSalesPartItem,
  AfterSalesProgress,
  PartWarranty,
  AfterSalesStats,
  AfterSalesStatus,
  AfterSalesPriority,
  AfterSalesType,
  IssueCategory,
  WarrantyStatus,
  CreateAfterSalesRequest,
  UpdateAfterSalesRequest,
  UpdateAfterSalesStatusRequest,
} from '@/types'
import { api } from '@/api/client'
import { BIKE_MODELS, getPackagePartIds, getPackagesForModel } from '@/data/bikeModels'

const MAX_RECENT_VIEWS = 50

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {}
  return fallback
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

interface ReceptionContextIds {
  customerId: string | null
  quoteId: string | null
  scheduleId: string | null
}

const RECEPTION_CTX_KEY = 'xcf-reception-context'

function saveReceptionContext(ids: ReceptionContextIds): void {
  saveToStorage(RECEPTION_CTX_KEY, ids)
}

function loadReceptionContext(): ReceptionContextIds {
  return loadFromStorage<ReceptionContextIds>(RECEPTION_CTX_KEY, {
    customerId: null,
    quoteId: null,
    scheduleId: null,
  })
}

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

  versions: SelectionVersion[]
  versionsLoading: boolean
  compareVersionIdA: string | null
  compareVersionIdB: string | null

  fetchVersions: () => Promise<void>
  createVersionSnapshot: (description?: string) => Promise<void>
  rollbackToVersion: (versionId: string) => Promise<void>
  deleteVersion: (versionId: string) => Promise<void>
  setCompareVersionA: (id: string | null) => void
  setCompareVersionB: (id: string | null) => void
  compareVersions: () => ComparisonResult | null

  shares: Share[]
  sharesLoading: boolean
  fetchShares: () => Promise<void>
  createShare: (data: CreateShareRequest) => Promise<Share | undefined>
  updateShare: (shareId: string, data: { note?: string; expiresAt?: string; isActive?: boolean }) => Promise<Share | undefined>
  deleteShare: (shareId: string) => Promise<void>
  getShareById: (shareId: string) => Share | undefined
  getPartRecommendations: (partId: string) => PartRecommendations

  bikeModels: BikeModel[]
  currentModelId: string | null
  currentPackageType: 'basic' | 'sport' | 'street' | null
  setCurrentModel: (modelId: string) => void
  setCurrentPackageType: (type: 'basic' | 'sport' | 'street') => void
  applyDefaultPackage: (modelId: string, packageType: 'basic' | 'sport' | 'street') => Promise<void>
  getPackagesForCurrentModel: () => ReturnType<typeof getPackagesForModel>
  getPackagePrice: (modelId: string, packageType: 'basic' | 'sport' | 'street') => number
  initDefaultSelectionWithModel: (modelId: string, packageType: 'basic' | 'sport' | 'street') => Promise<void>

  favorites: FavoriteRecord[]
  recentViews: RecentViewRecord[]
  isFavorite: (partId: string) => boolean
  toggleFavorite: (partId: string) => Promise<void>
  addRecentView: (partId: string) => Promise<void>
  getFavoriteParts: () => Part[]
  getRecentViewParts: () => Part[]

  orders: Order[]
  ordersLoading: boolean
  orderFilterStatus: OrderStatus | 'all'
  orderFilterDealerName: string
  orderFilterModelId: string
  fetchOrders: () => Promise<void>
  setOrderFilterStatus: (status: OrderStatus | 'all') => void
  setOrderFilterDealerName: (name: string) => void
  setOrderFilterModelId: (modelId: string) => void
  createOrder: (data: CreateOrderRequest) => Promise<Order | undefined>
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) => Promise<void>
  updateOrderDiscount: (orderId: string, discount: number) => Promise<void>
  addAfterSaleNote: (orderId: string, data: AddAfterSaleNoteRequest) => Promise<void>
  deleteAfterSaleNote: (orderId: string, noteId: string) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  getFilteredOrders: () => Order[]

  templates: Template[]
  templateCategories: TemplateCategory[]
  templateFavorites: string[]
  templatesLoading: boolean
  currentTemplate: Template | null
  templateCompatibility: TemplateCompatibilityResult | null
  templateSearchQuery: string
  templateCategoryFilter: string
  templateStatusFilter: string
  templateModelFilter: string
  selectedTemplateIds: string[]
  combinedTemplates: {
    templates: { id: string; name: string }[]
    combinedItems: SelectionItem[]
    conflicts: CompatibilityConflict[]
    warnings: CompatibilityConflict[]
    totalPrice: number
    totalLaborFee: number
    grandTotal: number
    isValid: boolean
  } | null

  fetchTemplates: (params?: {
    category?: string
    status?: string
    modelId?: string
    keyword?: string
    isHot?: boolean
    isRecommended?: boolean
  }) => Promise<void>
  fetchTemplateDetail: (id: string) => Promise<void>
  createTemplate: (data: CreateTemplateRequest) => Promise<Template | undefined>
  updateTemplate: (id: string, data: UpdateTemplateRequest) => Promise<Template | undefined>
  deleteTemplate: (id: string) => Promise<void>
  batchPublishTemplates: (templateIds: string[], publishAt?: string) => Promise<{ success: boolean; publishedCount: number }>
  batchUpdateTemplateStatus: (templateIds: string[], status: TemplateStatus, reason?: string) => Promise<{ success: boolean; updatedCount: number }>
  checkTemplateCompatibility: (templateId: string) => Promise<void>
  applyTemplate: (templateId: string) => Promise<ApplyTemplateResult | undefined>
  combineTemplates: (templateIds: string[]) => Promise<void>
  toggleTemplateFavorite: (templateId: string) => Promise<void>
  setTemplateSearchQuery: (q: string) => void
  setTemplateCategoryFilter: (cat: string) => void
  setTemplateStatusFilter: (status: string) => void
  setTemplateModelFilter: (modelId: string) => void
  toggleTemplateSelection: (templateId: string) => void
  clearTemplateSelection: () => void
  selectAllTemplates: () => void
  selectTemplatesByIds: (templateIds: string[]) => void
  getFilteredTemplates: () => Template[]
  getTemplateById: (id: string) => Template | undefined
  isTemplateFavorite: (templateId: string) => boolean
  setCurrentSelection: (selection: Selection | null) => void
  setCombinedTemplates: (data: AppState['combinedTemplates']) => void

  inventoryMap: Record<string, InventoryInfo>
  stockAlerts: StockAlert[]
  purchaseOrders: PurchaseOrder[]
  inventoryLoading: boolean
  substituteCache: Record<string, SubstitutePart[]>

  fetchInventoryOverview: () => Promise<void>
  fetchInventoryBatchInfo: (partIds: string[]) => Promise<void>
  getInventoryInfo: (partId: string) => InventoryInfo | undefined
  getStockLevel: (partId: string) => StockLevel
  isOutOfStock: (partId: string) => boolean
  isLowStock: (partId: string) => boolean

  reserveInventoryForSelection: (selectionId: string, items: SelectionItem[]) => Promise<boolean>
  releaseInventoryForSelection: (selectionId: string, partIds?: string[]) => Promise<void>
  consumeInventoryForSelection: (selectionId: string) => Promise<void>

  fetchStockAlerts: (params?: { unread?: boolean; alertType?: 'out_of_stock' | 'low_stock' }) => Promise<void>
  markAlertRead: (alertId: string) => Promise<void>
  markAllAlertsRead: () => Promise<void>
  getUnreadAlertCount: () => number

  fetchSubstitutes: (partId: string) => Promise<SubstitutePart[]>
  getSubstitutesForPart: (partId: string) => SubstitutePart[]

  fetchPurchaseOrders: (params?: { status?: PurchaseOrderStatus }) => Promise<void>
  createPurchaseOrder: (data: CreatePurchaseOrderRequest) => Promise<PurchaseOrder | undefined>
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => Promise<void>
  deletePurchaseOrder: (id: string) => Promise<void>

  quotes: Quote[]
  quotesLoading: boolean
  currentQuote: Quote | null
  quoteFilterStatus: QuoteStatus | 'all'
  quoteFilterCustomerName: string
  quoteFilterModelId: string
  discountRules: DiscountRule[]
  discountRulesLoading: boolean
  planComparison: PlanComparisonResult | null

  fetchQuotes: (params?: { status?: QuoteStatus; customerName?: string; modelId?: string }) => Promise<void>
  fetchQuoteDetail: (id: string) => Promise<void>
  createQuote: (data: CreateQuoteRequest) => Promise<Quote | undefined>
  updateQuote: (id: string, data: UpdateQuoteRequest) => Promise<Quote | undefined>
  deleteQuote: (id: string) => Promise<void>
  setQuoteFilterStatus: (status: QuoteStatus | 'all') => void
  setQuoteFilterCustomerName: (name: string) => void
  setQuoteFilterModelId: (modelId: string) => void
  getFilteredQuotes: () => Quote[]
  getQuoteById: (id: string) => Quote | undefined

  createQuotePlan: (quoteId: string, data: CreateQuotePlanRequest) => Promise<QuotePlan | undefined>
  updateQuotePlan: (quoteId: string, planId: string, data: UpdateQuotePlanRequest) => Promise<QuotePlan | undefined>
  deleteQuotePlan: (quoteId: string, planId: string) => Promise<void>
  compareQuotePlans: (quoteId: string, planA: string, planB: string) => Promise<PlanComparisonResult | null>
  setPlanComparison: (data: PlanComparisonResult | null) => void

  submitQuoteApproval: (quoteId: string, data: SubmitApprovalRequest) => Promise<Quote | undefined>
  processQuoteApproval: (quoteId: string, nodeId: string, data: ProcessApprovalRequest) => Promise<Quote | undefined>
  sendQuoteToCustomer: (quoteId: string) => Promise<Quote | undefined>
  customerConfirmQuote: (quoteId: string, data: CustomerConfirmRequest) => Promise<Quote | undefined>
  customerRejectQuote: (quoteId: string, data: { confirmedBy: string; contactInfo: string; note?: string }) => Promise<Quote | undefined>
  exportQuote: (quoteId: string, data: ExportQuoteRequest) => Promise<{ success: boolean; quote: Quote; plan: QuotePlan; exportRecord: any } | undefined>
  convertQuoteToOrder: (quoteId: string, orderId?: string) => Promise<Quote | undefined>

  fetchDiscountRules: (params?: { isActive?: boolean }) => Promise<void>
  createDiscountRule: (data: CreateDiscountRuleRequest) => Promise<DiscountRule | undefined>
  updateDiscountRule: (id: string, data: UpdateDiscountRuleRequest) => Promise<DiscountRule | undefined>
  deleteDiscountRule: (id: string) => Promise<void>
  calculateDiscount: (data: {
    items: { partId: string; categoryId: string; brand: string; unitPrice: number; quantity: number }[];
    totalAmount: number
  }) => Promise<{ results: DiscountResult[]; totalDiscount: number; finalAmount: number } | undefined>
  applyDiscountToPlan: (quoteId: string, planId: string) => Promise<QuotePlan | undefined>
  downloadQuoteFile: (type: 'pdf' | 'excel', quoteId: string, planId?: string, exportedBy?: string) => Promise<void>

  currentUser: User | null
  userProfile: UserProfile | null
  authToken: string | null
  isAuthenticated: boolean
  authLoading: boolean

  userFavorites: (UserFavoritePart & { detail?: any; favorited?: boolean })[]
  userBrowsingHistory: (UserBrowsingHistory & { detail?: any })[]
  userArchives: ModificationArchive[]
  userSharedResources: { owned: SharedResource[]; collaborated: SharedResource[] }
  userStats: UserStats | null
  userDataLoading: boolean

  register: (data: RegisterRequest) => Promise<AuthResponse | undefined>
  login: (data: LoginRequest) => Promise<AuthResponse | undefined>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  updateUserProfile: (data: UpdateUserProfileRequest) => Promise<{ user: User; profile: UserProfile } | undefined>
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>
  setAuthToken: (token: string | null) => void

  fetchUserFavorites: (type?: 'part' | 'template' | 'selection') => Promise<void>
  toggleUserFavorite: (targetType: 'part' | 'template' | 'selection', targetId: string, targetName?: string) => Promise<boolean>
  checkUserFavorite: (targetType: 'part' | 'template' | 'selection', targetId: string) => Promise<boolean>

  fetchUserBrowsingHistory: (limit?: number) => Promise<void>
  addUserBrowsingHistory: (data: { targetType: 'part' | 'template' | 'selection'; targetId: string; targetName?: string; targetImage?: string }) => Promise<void>
  removeBrowsingHistoryItem: (id: string) => Promise<void>
  clearBrowsingHistory: () => Promise<void>

  fetchUserArchives: (status?: 'draft' | 'published' | 'archived') => Promise<void>
  fetchArchiveDetail: (id: string) => Promise<ModificationArchive | undefined>
  createArchive: (data: CreateModificationArchiveRequest) => Promise<ModificationArchive | undefined>
  updateArchive: (id: string, data: UpdateModificationArchiveRequest) => Promise<ModificationArchive | undefined>
  deleteArchive: (id: string) => Promise<void>

  fetchSharedResources: () => Promise<void>
  createSharedResource: (data: { resourceType: 'selection' | 'archive'; resourceId: string; resourceName: string }) => Promise<SharedResource | undefined>
  inviteCollaborator: (sharedId: string, data: { email?: string; username?: string; permission: 'view' | 'edit' | 'admin' }) => Promise<any>
  removeCollaborator: (sharedId: string, userId: string) => Promise<void>

  fetchUserStats: () => Promise<void>

  customers: Customer[]
  customersLoading: boolean
  currentCustomer: Customer | null
  customerSearchKeyword: string
  customerFilterLevel: CustomerLevel | 'all'
  customerFilterSource: CustomerSource | 'all'

  fetchCustomers: (params?: { keyword?: string; level?: string; source?: string; phone?: string }) => Promise<void>
  fetchCustomerDetail: (id: string) => Promise<void>
  createCustomer: (data: CreateCustomerRequest) => Promise<Customer | undefined>
  updateCustomer: (id: string, data: UpdateCustomerRequest) => Promise<Customer | undefined>
  deleteCustomer: (id: string) => Promise<void>
  addCustomerVehicle: (customerId: string, data: Omit<CustomerVehicle, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) => Promise<CustomerVehicle | undefined>
  updateCustomerVehicle: (customerId: string, vehicleId: string, data: Partial<CustomerVehicle>) => Promise<CustomerVehicle | undefined>
  deleteCustomerVehicle: (customerId: string, vehicleId: string) => Promise<void>
  setCurrentCustomer: (customer: Customer | null) => void
  setCustomerSearchKeyword: (keyword: string) => void
  setCustomerFilterLevel: (level: CustomerLevel | 'all') => void
  setCustomerFilterSource: (source: CustomerSource | 'all') => void
  getFilteredCustomers: () => Customer[]
  getCustomerById: (id: string) => Customer | undefined

  requirements: RequirementRecord[]
  requirementsLoading: boolean
  currentRequirement: RequirementRecord | null

  fetchRequirements: (params?: { customerId?: string; status?: string; vehicleId?: string }) => Promise<void>
  fetchRequirementDetail: (id: string) => Promise<void>
  createRequirement: (data: CreateRequirementRequest) => Promise<RequirementRecord | undefined>
  updateRequirement: (id: string, data: UpdateRequirementRequest) => Promise<RequirementRecord | undefined>
  deleteRequirement: (id: string) => Promise<void>
  setCurrentRequirement: (requirement: RequirementRecord | null) => void
  getRequirementsByCustomer: (customerId: string) => RequirementRecord[]
  getRequirementById: (id: string) => RequirementRecord | undefined

  schedules: ConstructionSchedule[]
  schedulesLoading: boolean
  currentSchedule: ConstructionSchedule | null

  fetchSchedules: (params?: { customerId?: string; status?: string; date?: string }) => Promise<void>
  fetchScheduleDetail: (id: string) => Promise<void>
  createSchedule: (data: CreateConstructionScheduleRequest) => Promise<ConstructionSchedule | undefined>
  updateSchedule: (id: string, data: UpdateConstructionScheduleRequest) => Promise<ConstructionSchedule | undefined>
  deleteSchedule: (id: string) => Promise<void>
  updateScheduleTask: (scheduleId: string, taskId: string, data: UpdateConstructionTaskRequest) => Promise<ConstructionSchedule | undefined>
  setCurrentSchedule: (schedule: ConstructionSchedule | null) => void
  getSchedulesByCustomer: (customerId: string) => ConstructionSchedule[]
  getScheduleById: (id: string) => ConstructionSchedule | undefined

  receptionActiveTab: 'customer' | 'requirement' | 'selection' | 'budget' | 'schedule'
  setReceptionActiveTab: (tab: 'customer' | 'requirement' | 'selection' | 'budget' | 'schedule') => void

  currentReceptionSelection: ReceptionSelection | null
  receptionSelections: ReceptionSelection[]
  createReceptionSelection: (data: CreateReceptionSelectionRequest) => Promise<ReceptionSelection | undefined>
  updateReceptionSelection: (id: string, data: Partial<CreateReceptionSelectionRequest>) => Promise<ReceptionSelection | undefined>
  setCurrentReceptionSelection: (selection: ReceptionSelection | null) => void
  getReceptionSelectionsByCustomer: (customerId: string) => ReceptionSelection[]

  receptionQuotes: Quote[]
  createQuoteFromSelection: (selectionId: string, data?: Partial<CreateQuoteRequest>) => Promise<Quote | undefined>
  createQuoteFromRequirements: (data: CreateQuoteRequest) => Promise<Quote | undefined>
  updateQuoteFull: (id: string, data: UpdateQuoteRequest & {
    plans?: QuotePlan[]
    discountRate?: number
    taxRate?: number
    depositRatio?: number
    items?: QuoteItem[]
  }) => Promise<Quote | undefined>
  createScheduleFromQuote: (data: CreateScheduleFromQuoteRequest) => Promise<ConstructionSchedule | undefined>
  fetchQuoteWithDetails: (id: string) => Promise<(Quote & { customer?: any; requirement?: any; schedule?: any }) | undefined>
  fetchReceptionQuotes: (params?: { customerId?: string }) => Promise<void>
  setCurrentQuote: (quote: Quote | null) => void
  getQuotesByCustomer: (customerId: string) => Quote[]

  restoreReceptionContext: () => Promise<void>

  partReviews: Record<string, PartReview[]>
  partReviewsLoading: Record<string, boolean>
  partReviewStats: Record<string, ReviewStats>
  adminReviews: PartReview[]
  adminReviewsLoading: boolean
  adminReviewsTotal: number
  issues: PartIssue[]
  issuesLoading: boolean
  issuesTotal: number
  warnings: PartWarning[]
  warningsLoading: boolean
  warningsTotal: number
  warningsSummary: { total: number; active: number; danger: number; warning: number; unacknowledged: number } | null

  fetchPartReviews: (partId: string, params?: { status?: string; page?: number; pageSize?: number; sortBy?: string }) => Promise<void>
  fetchReviewStats: (partId: string) => Promise<ReviewStats | null>
  createReview: (data: CreatePartReviewRequest) => Promise<PartReview | null>
  markReviewHelpful: (reviewId: string, userId?: string) => Promise<void>
  fetchAdminReviews: (params?: { status?: string; partId?: string; page?: number; pageSize?: number }) => Promise<void>
  processReview: (reviewId: string, data: ProcessReviewRequest) => Promise<PartReview | null>
  fetchIssues: (params?: { status?: string; priority?: string; partId?: string; category?: string; page?: number; pageSize?: number }) => Promise<void>
  createIssue: (data: CreateIssueRequest) => Promise<PartIssue | null>
  updateIssueStatus: (issueId: string, data: UpdateIssueStatusRequest) => Promise<PartIssue | null>
  fetchWarnings: (params?: { isActive?: boolean; warningLevel?: string; partId?: string; page?: number; pageSize?: number }) => Promise<void>
  acknowledgeWarning: (warningId: string, data: AcknowledgeWarningRequest) => Promise<PartWarning | null>
  deleteWarning: (warningId: string) => Promise<boolean>

  vehicleProfiles: VehicleModelProfileSummary[]
  vehicleProfilesLoading: boolean
  currentVehicleProfile: VehicleModelProfile | null
  vehicleProfileFilterModelId: string
  vehicleProfileFilterStatus: string
  vehicleProfileSearchKeyword: string

  fetchVehicleProfiles: (params?: {
    modelId?: string
    year?: number
    status?: string
    keyword?: string
  }) => Promise<void>
  fetchVehicleProfileDetail: (id: string) => Promise<void>
  createVehicleProfile: (data: CreateVehicleModelProfileRequest) => Promise<VehicleModelProfile | undefined>
  updateVehicleProfile: (id: string, data: UpdateVehicleModelProfileRequest) => Promise<VehicleModelProfile | undefined>
  deleteVehicleProfile: (id: string) => Promise<boolean>
  updateVehicleProfileStatus: (id: string, isActive: boolean) => Promise<VehicleModelProfile | undefined>
  getVehicleProfileById: (id: string) => VehicleModelProfileSummary | undefined
  setVehicleProfileFilterModelId: (modelId: string) => void
  setVehicleProfileFilterStatus: (status: string) => void
  setVehicleProfileSearchKeyword: (keyword: string) => void
  getFilteredVehicleProfiles: () => VehicleModelProfileSummary[]

  afterSalesRecords: AfterSalesRecord[]
  afterSalesLoading: boolean
  currentAfterSales: AfterSalesRecord | null
  afterSalesFilterStatus: AfterSalesStatus | 'all'
  afterSalesFilterPriority: AfterSalesPriority | 'all'
  afterSalesFilterType: AfterSalesType | 'all'
  afterSalesFilterIssueCategory: IssueCategory | 'all'
  afterSalesSearchKeyword: string
  afterSalesStats: AfterSalesStats | null

  fetchAfterSalesRecords: (params?: {
    status?: AfterSalesStatus
    priority?: AfterSalesPriority
    type?: AfterSalesType
    orderId?: string
    customerName?: string
    issueCategory?: IssueCategory
  }) => Promise<void>
  fetchAfterSalesDetail: (id: string) => Promise<AfterSalesRecord | undefined>
  fetchAfterSalesByOrder: (orderId: string) => Promise<void>
  createAfterSales: (data: CreateAfterSalesRequest) => Promise<AfterSalesRecord | undefined>
  updateAfterSales: (id: string, data: UpdateAfterSalesRequest) => Promise<AfterSalesRecord | undefined>
  updateAfterSalesStatus: (id: string, data: UpdateAfterSalesStatusRequest) => Promise<AfterSalesRecord | undefined>
  deleteAfterSales: (id: string) => Promise<boolean>
  fetchAfterSalesStats: () => Promise<void>
  setAfterSalesFilterStatus: (status: AfterSalesStatus | 'all') => void
  setAfterSalesFilterPriority: (priority: AfterSalesPriority | 'all') => void
  setAfterSalesFilterType: (type: AfterSalesType | 'all') => void
  setAfterSalesFilterIssueCategory: (category: IssueCategory | 'all') => void
  setAfterSalesSearchKeyword: (keyword: string) => void
  getFilteredAfterSales: () => AfterSalesRecord[]

  warranties: PartWarranty[]
  warrantiesLoading: boolean
  fetchWarranties: (params?: { orderId?: string; partId?: string; status?: string }) => Promise<void>
  fetchWarrantyDetail: (id: string) => Promise<PartWarranty | undefined>
  fetchWarrantiesByOrder: (orderId: string) => Promise<void>
  createWarranty: (data: Partial<PartWarranty> & {
    partId: string
    partName: string
    orderId: string
    orderNo: string
    warrantyPeriodMonths: number
    purchaseDate: string
  }) => Promise<PartWarranty | undefined>
}

const useStore = create<AppState>((set, get) => ({
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

  versions: [],
  versionsLoading: false,
  compareVersionIdA: null,
  compareVersionIdB: null,

  shares: [],
  sharesLoading: false,

  favorites: loadFromStorage<FavoriteRecord[]>('xcf-favorites', []),
  recentViews: loadFromStorage<RecentViewRecord[]>('xcf-recent-views', []),

  orders: [],
  ordersLoading: false,
  orderFilterStatus: 'all' as OrderStatus | 'all',
  orderFilterDealerName: '',
  orderFilterModelId: '',

  bikeModels: BIKE_MODELS,
  currentModelId: null,
  currentPackageType: null,

  templates: [],
  templateCategories: [],
  templateFavorites: loadFromStorage<string[]>('xcf-template-favorites', []),
  templatesLoading: false,
  currentTemplate: null,
  templateCompatibility: null,
  templateSearchQuery: '',
  templateCategoryFilter: 'all',
  templateStatusFilter: 'all',
  templateModelFilter: '',
  selectedTemplateIds: [],
  combinedTemplates: null,

  inventoryMap: {},
  stockAlerts: [],
  purchaseOrders: [],
  inventoryLoading: false,
  substituteCache: {},

  quotes: [],
  quotesLoading: false,
  currentQuote: null,
  quoteFilterStatus: 'all' as QuoteStatus | 'all',
  quoteFilterCustomerName: '',
  quoteFilterModelId: '',
  discountRules: [],
  discountRulesLoading: false,
  planComparison: null,

  currentUser: null,
  userProfile: null,
  authToken: typeof localStorage !== 'undefined' ? localStorage.getItem('xcf-auth-token') : null,
  isAuthenticated: false,
  authLoading: false,

  userFavorites: [],
  userBrowsingHistory: [],
  userArchives: [],
  userSharedResources: { owned: [], collaborated: [] },
  userStats: null,
  userDataLoading: false,

  customers: [],
  customersLoading: false,
  currentCustomer: null,
  customerSearchKeyword: '',
  customerFilterLevel: 'all',
  customerFilterSource: 'all',

  requirements: [],
  requirementsLoading: false,
  currentRequirement: null,

  schedules: [],
  schedulesLoading: false,
  currentSchedule: null,

  receptionActiveTab: 'customer',

  currentReceptionSelection: null,
  receptionSelections: [],
  receptionQuotes: [],

  partReviews: {},
  partReviewsLoading: {},
  partReviewStats: {},
  adminReviews: [],
  adminReviewsLoading: false,
  adminReviewsTotal: 0,
  issues: [],
  issuesLoading: false,
  issuesTotal: 0,
  warnings: [],
  warningsLoading: false,
  warningsTotal: 0,
  warningsSummary: null,

  vehicleProfiles: [],
  vehicleProfilesLoading: false,
  currentVehicleProfile: null,
  vehicleProfileFilterModelId: '',
  vehicleProfileFilterStatus: 'all',
  vehicleProfileSearchKeyword: '',

  afterSalesRecords: [],
  afterSalesLoading: false,
  currentAfterSales: null,
  afterSalesFilterStatus: 'all',
  afterSalesFilterPriority: 'all',
  afterSalesFilterType: 'all',
  afterSalesFilterIssueCategory: 'all',
  afterSalesSearchKeyword: '',
  afterSalesStats: null,

  warranties: [],
  warrantiesLoading: false,

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
    allParts.forEach((p) => p.compatibleModels.forEach((m) => set.add(m)))
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
    const { currentSelection, inventoryMap } = get()
    if (!currentSelection) return

    const invInfo = inventoryMap[partId]
    if (invInfo && invInfo.stockLevel === 'out_of_stock') return

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
      await get().reserveInventoryForSelection(currentSelection.id, [{ partId, quantity: 1 }])
      await get().fetchVersions()
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
      await get().releaseInventoryForSelection(currentSelection.id, [partId])
      await get().fetchVersions()
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
    const existingItem = currentSelection.items.find((i) => i.partId === partId)
    const oldQuantity = existingItem?.quantity || 0
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
      if (oldQuantity !== quantity) {
        await get().releaseInventoryForSelection(currentSelection.id, [partId])
        await get().reserveInventoryForSelection(currentSelection.id, [{ partId, quantity }])
      }
      await get().fetchVersions()
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to update quantity:', e)
    }
  },

  clearSelection: async () => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const allPartIds = currentSelection.items.map((i) => i.partId)
      const updated = await api.updateSelection(currentSelection.id, {
        ...currentSelection,
        items: [],
      } as any)
      set({ currentSelection: updated })
      set((state) => ({
        selections: state.selections.map((s) => (s.id === updated.id ? updated : s)),
      }))
      if (allPartIds.length > 0) {
        await get().releaseInventoryForSelection(currentSelection.id, allPartIds)
      }
      await get().fetchVersions()
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
        p.compatibleModels.some((m) => selectedModels.includes(m))
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

  fetchVersions: async () => {
    const { currentSelection } = get()
    if (!currentSelection) return
    set({ versionsLoading: true })
    try {
      const versions = await api.getVersions(currentSelection.id)
      set({ versions, versionsLoading: false })
    } catch (e) {
      console.error('Failed to fetch versions:', e)
      set({ versionsLoading: false })
    }
  },

  createVersionSnapshot: async (description) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const version = await api.createVersion(currentSelection.id, description)
      set((state) => ({
        versions: [version, ...state.versions],
      }))
    } catch (e) {
      console.error('Failed to create version snapshot:', e)
    }
  },

  rollbackToVersion: async (versionId) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const updated = await api.rollbackVersion(currentSelection.id, versionId)
      set({ currentSelection: updated })
      set((state) => ({
        selections: state.selections.map((s) => (s.id === updated.id ? updated : s)),
      }))
      await get().fetchVersions()
      setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
    } catch (e) {
      console.error('Failed to rollback version:', e)
    }
  },

  deleteVersion: async (versionId) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      await api.deleteVersion(currentSelection.id, versionId)
      set((state) => ({
        versions: state.versions.filter((v) => v.id !== versionId),
      }))
    } catch (e) {
      console.error('Failed to delete version:', e)
    }
  },

  setCompareVersionA: (id) => set({ compareVersionIdA: id }),
  setCompareVersionB: (id) => set({ compareVersionIdB: id }),

  compareVersions: () => {
    const { versions, allParts, categories, compareVersionIdA, compareVersionIdB } = get()
    if (!compareVersionIdA || !compareVersionIdB) return null

    const versionA = versions.find((v) => v.id === compareVersionIdA) || null
    const versionB = versions.find((v) => v.id === compareVersionIdB) || null

    const getVersionTotal = (ver: SelectionVersion | null) => {
      if (!ver) return 0
      return ver.items.reduce((total, item) => {
        const part = allParts.find((p) => p.id === item.partId)
        return total + (part ? part.price * item.quantity : 0)
      }, 0)
    }

    const totalA = getVersionTotal(versionA)
    const totalB = getVersionTotal(versionB)
    const totalDiff = totalB - totalA
    const totalDiffPercent = totalA > 0 ? (totalDiff / totalA) * 100 : 0

    const getItemMap = (ver: SelectionVersion | null) => {
      const map = new Map<string, number>()
      if (ver) {
        ver.items.forEach((item) => map.set(item.partId, item.quantity))
      }
      return map
    }

    const mapA = getItemMap(versionA)
    const mapB = getItemMap(versionB)

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
      selectionA: versionA ? { ...versionA, updatedAt: versionA.createdAt, versions: [] } : null,
      selectionB: versionB ? { ...versionB, updatedAt: versionB.createdAt, versions: [] } : null,
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

  fetchShares: async () => {
    const { currentSelection } = get()
    if (!currentSelection) return
    set({ sharesLoading: true })
    try {
      const shares = await api.getShares(currentSelection.id)
      set({ shares, sharesLoading: false })
    } catch (e) {
      console.error('Failed to fetch shares:', e)
      set({ sharesLoading: false })
    }
  },

  createShare: async (data) => {
    const { currentSelection } = get()
    if (!currentSelection) return
    try {
      const share = await api.createShare(currentSelection.id, data)
      set((state) => ({
        shares: [share, ...state.shares],
      }))
      return share
    } catch (e) {
      console.error('Failed to create share:', e)
    }
  },

  updateShare: async (shareId, data) => {
    try {
      const share = await api.updateShare(shareId, data)
      set((state) => ({
        shares: state.shares.map((s) => (s.id === shareId ? share : s)),
      }))
      return share
    } catch (e) {
      console.error('Failed to update share:', e)
    }
  },

  deleteShare: async (shareId) => {
    try {
      await api.deleteShare(shareId)
      set((state) => ({
        shares: state.shares.filter((s) => s.id !== shareId),
      }))
    } catch (e) {
      console.error('Failed to delete share:', e)
    }
  },

  getShareById: (shareId) => {
    return get().shares.find((s) => s.id === shareId)
  },

  getPartRecommendations: (partId) => {
    const { allParts, currentSelection, categories, partConflictMap } = get()
    const currentPart = allParts.find((p) => p.id === partId)
    if (!currentPart) {
      return { alternatives: [], pairings: [] }
    }

    const selectedPartIds = currentSelection?.items.map((i) => i.partId) ?? []
    const selectedCategoryIds = new Set(
      selectedPartIds
        .map((id) => allParts.find((p) => p.id === id)?.categoryId)
        .filter(Boolean) as string[]
    )

    const calcMatchScore = (part: Part): number => {
      let score = 0
      const commonModels = currentPart.compatibleModels.filter((m) => part.compatibleModels.includes(m))
      score += commonModels.length * 20
      if (part.brand === currentPart.brand) score += 15
      score += 25
      const isInSelection = selectedPartIds.includes(part.id)
      if (isInSelection) score += 10
      return score
    }

    const getCompatStatus = (part: Part): PartRecommendation['compatibilityStatus'] => {
      const conflictInfo = partConflictMap[part.id]
      if (conflictInfo?.hasError) return 'conflict'
      if (conflictInfo?.hasWarning) return 'warning'
      return 'compatible'
    }

    const alternatives: PartRecommendation[] = allParts
      .filter((p) => p.categoryId === currentPart.categoryId && p.id !== currentPart.id)
      .map((part) => {
        const score = calcMatchScore(part)
        const status = getCompatStatus(part)
        let reason = '同分类替代配件'
        const commonModels = currentPart.compatibleModels.filter((m) => part.compatibleModels.includes(m))
        if (part.brand === currentPart.brand) reason = '同品牌推荐'
        if (commonModels.length >= 2) reason = '兼容车型高度匹配'
        return { part, reason, matchScore: score, compatibilityStatus: status }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    const pairings: PartRecommendation[] = allParts
      .filter((p) => p.categoryId !== currentPart.categoryId)
      .map((part) => {
        const score = calcMatchScore(part)
        const status = getCompatStatus(part)
        let reason = '经典搭配组合'
        const catName = categories.find((c) => c.id === part.categoryId)?.name || part.categoryId
        if (part.brand === currentPart.brand) reason = `同品牌${catName}搭配`
        const commonModels = currentPart.compatibleModels.filter((m) => part.compatibleModels.includes(m))
        if (commonModels.length >= 2) reason = `${catName}完美兼容`
        if (selectedCategoryIds.has(part.categoryId)) reason = `补充${catName}方案`
        return { part, reason, matchScore: score, compatibilityStatus: status }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6)

    return { alternatives, pairings }
  },

  setCurrentModel: (modelId) => {
    set({ currentModelId: modelId })
  },

  setCurrentPackageType: (type) => {
    set({ currentPackageType: type })
  },

  getPackagesForCurrentModel: () => {
    const { currentModelId } = get()
    if (!currentModelId) return []
    return getPackagesForModel(currentModelId)
  },

  getPackagePrice: (modelId, packageType) => {
    const { allParts } = get()
    const partIds = getPackagePartIds(modelId, packageType)
    return partIds.reduce((total, partId) => {
      const part = allParts.find((p) => p.id === partId)
      return total + (part?.price ?? 0)
    }, 0)
  },

  applyDefaultPackage: async (modelId, packageType) => {
    const { currentSelection, clearSelection, addPartToSelection, allParts } = get()
    if (!currentSelection) return

    const partIds = getPackagePartIds(modelId, packageType)
    const validPartIds = partIds.filter((id) => allParts.some((p) => p.id === id))

    await clearSelection()

    for (const partId of validPartIds) {
      await addPartToSelection(partId)
    }

    set({ currentModelId: modelId, currentPackageType: packageType })
  },

  initDefaultSelectionWithModel: async (modelId, packageType) => {
    const { selections, createSelection, allParts } = get()

    let selection: Selection | undefined
    if (selections.length === 0) {
      const model = BIKE_MODELS.find((m) => m.id === modelId)
      const pkg = getPackagesForModel(modelId).find((p) => p.type === packageType)
      const selectionName = model && pkg ? `${model.name} - ${pkg.name}` : '我的改装方案'
      selection = await createSelection(selectionName)
    } else {
      selection = selections[0]
      set({ currentSelection: selection })
    }

    const partIds = getPackagePartIds(modelId, packageType)
    const validPartIds = partIds.filter((id) => allParts.some((p) => p.id === id))

    if (selection && validPartIds.length > 0) {
      for (const partId of validPartIds) {
        await get().addPartToSelection(partId)
      }
    }

    set({ currentModelId: modelId, currentPackageType: packageType })
    setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
  },

  isFavorite: (partId) => {
    const { isAuthenticated, userFavorites, favorites } = get()
    if (isAuthenticated) {
      return userFavorites.some((f) => f.targetType === 'part' && f.targetId === partId)
    }
    return favorites.some((f) => f.partId === partId)
  },

  toggleFavorite: async (partId) => {
    const { isAuthenticated, toggleUserFavorite, allParts } = get()
    if (isAuthenticated) {
      const part = allParts.find((p) => p.id === partId)
      await toggleUserFavorite('part', partId, part?.name)
      return
    }
    set((state) => {
      const exists = state.favorites.some((f) => f.partId === partId)
      const next = exists
        ? state.favorites.filter((f) => f.partId !== partId)
        : [...state.favorites, { partId, addedAt: new Date().toISOString() }]
      saveToStorage('xcf-favorites', next)
      return { favorites: next }
    })
  },

  addRecentView: async (partId) => {
    const { isAuthenticated, addUserBrowsingHistory, allParts } = get()
    if (isAuthenticated) {
      const part = allParts.find((p) => p.id === partId)
      await addUserBrowsingHistory({
        targetType: 'part',
        targetId: partId,
        targetName: part?.name,
      })
    }
    set((state) => {
      const filtered = state.recentViews.filter((r) => r.partId !== partId)
      const next = [{ partId, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT_VIEWS)
      saveToStorage('xcf-recent-views', next)
      return { recentViews: next }
    })
  },

  getFavoriteParts: () => {
    const { isAuthenticated, userFavorites, favorites, allParts } = get()
    if (isAuthenticated) {
      return userFavorites
        .filter((f) => f.targetType === 'part')
        .map((f) => allParts.find((p) => p.id === f.targetId))
        .filter(Boolean) as Part[]
    }
    return favorites
      .map((f) => allParts.find((p) => p.id === f.partId))
      .filter(Boolean) as Part[]
  },

  getRecentViewParts: () => {
    const { isAuthenticated, userBrowsingHistory, recentViews, allParts } = get()
    if (isAuthenticated) {
      return userBrowsingHistory
        .filter((h) => h.targetType === 'part')
        .map((h) => allParts.find((p) => p.id === h.targetId))
        .filter(Boolean) as Part[]
    }
    return recentViews
      .map((r) => allParts.find((p) => p.id === r.partId))
      .filter(Boolean) as Part[]
  },

  fetchOrders: async () => {
    set({ ordersLoading: true })
    try {
      const orders = await api.getOrders()
      set({ orders, ordersLoading: false })
    } catch (e) {
      console.error('Failed to fetch orders:', e)
      set({ ordersLoading: false })
    }
  },

  setOrderFilterStatus: (status) => set({ orderFilterStatus: status }),
  setOrderFilterDealerName: (name) => set({ orderFilterDealerName: name }),
  setOrderFilterModelId: (modelId) => set({ orderFilterModelId: modelId }),

  createOrder: async (data) => {
    try {
      const order = await api.createOrder(data)
      set((state) => ({
        orders: [order, ...state.orders],
      }))
      return order
    } catch (e) {
      console.error('Failed to create order:', e)
    }
  },

  updateOrderStatus: async (orderId, data) => {
    try {
      const updated = await api.updateOrderStatus(orderId, data)
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }))
    } catch (e) {
      console.error('Failed to update order status:', e)
    }
  },

  updateOrderDiscount: async (orderId, discount) => {
    try {
      const updated = await api.updateOrderDiscount(orderId, discount)
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }))
    } catch (e) {
      console.error('Failed to update order discount:', e)
    }
  },

  addAfterSaleNote: async (orderId, data) => {
    try {
      const note = await api.addAfterSaleNote(orderId, data)
      set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id !== orderId) return o
          return { ...o, afterSaleNotes: [...o.afterSaleNotes, note] }
        }),
      }))
    } catch (e) {
      console.error('Failed to add after-sale note:', e)
    }
  },

  deleteAfterSaleNote: async (orderId, noteId) => {
    try {
      await api.deleteAfterSaleNote(orderId, noteId)
      set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id !== orderId) return o
          return { ...o, afterSaleNotes: o.afterSaleNotes.filter((n) => n.id !== noteId) }
        }),
      }))
    } catch (e) {
      console.error('Failed to delete after-sale note:', e)
    }
  },

  deleteOrder: async (orderId) => {
    try {
      await api.deleteOrder(orderId)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
      }))
    } catch (e) {
      console.error('Failed to delete order:', e)
    }
  },

  getFilteredOrders: () => {
    const { orders, orderFilterStatus, orderFilterDealerName, orderFilterModelId } = get()
    let result = [...orders]
    if (orderFilterStatus !== 'all') {
      result = result.filter((o) => o.status === orderFilterStatus)
    }
    if (orderFilterDealerName) {
      const q = orderFilterDealerName.toLowerCase()
      result = result.filter((o) => o.dealerName.toLowerCase().includes(q))
    }
    if (orderFilterModelId) {
      result = result.filter((o) => o.modelId === orderFilterModelId)
    }
    return result
  },

  fetchTemplates: async (params) => {
    set({ templatesLoading: true })
    try {
      const { templates, categories, favorites } = await api.getTemplates(params)
      set({
        templates,
        templateCategories: categories,
        templateFavorites: favorites.map((f) => f.templateId),
        templatesLoading: false,
      })
    } catch (e) {
      console.error('Failed to fetch templates:', e)
      set({ templatesLoading: false })
    }
  },

  fetchTemplateDetail: async (id) => {
    try {
      const template = await api.getTemplate(id)
      set({ currentTemplate: template })
    } catch (e) {
      console.error('Failed to fetch template detail:', e)
    }
  },

  createTemplate: async (data) => {
    try {
      const template = await api.createTemplate(data)
      set((state) => ({
        templates: [...state.templates, template],
      }))
      return template
    } catch (e) {
      console.error('Failed to create template:', e)
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const template = await api.updateTemplate(id, data)
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? template : t)),
        currentTemplate: state.currentTemplate?.id === id ? template : state.currentTemplate,
      }))
      return template
    } catch (e) {
      console.error('Failed to update template:', e)
    }
  },

  deleteTemplate: async (id) => {
    try {
      await api.deleteTemplate(id)
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
      }))
    } catch (e) {
      console.error('Failed to delete template:', e)
    }
  },

  batchPublishTemplates: async (templateIds, publishAt) => {
    try {
      const result = await api.batchPublishTemplates({ templateIds, publishAt })
      set((state) => ({
        templates: state.templates.map((t) => {
          const published = result.published.find((p) => p.id === t.id)
          return published || t
        }),
        selectedTemplateIds: [],
      }))
      return { success: result.success, publishedCount: result.publishedCount }
    } catch (e) {
      console.error('Failed to batch publish templates:', e)
      return { success: false, publishedCount: 0 }
    }
  },

  batchUpdateTemplateStatus: async (templateIds, status, reason) => {
    try {
      const result = await api.batchUpdateTemplateStatus({ templateIds, status, reason })
      set((state) => ({
        templates: state.templates.map((t) => {
          const updated = result.updated.find((u) => u.id === t.id)
          return updated || t
        }),
        selectedTemplateIds: [],
      }))
      return { success: result.success, updatedCount: result.updatedCount }
    } catch (e) {
      console.error('Failed to batch update template status:', e)
      return { success: false, updatedCount: 0 }
    }
  },

  checkTemplateCompatibility: async (templateId) => {
    try {
      const result = await api.checkTemplateCompatibility(templateId)
      set({ templateCompatibility: result })
    } catch (e) {
      console.error('Failed to check template compatibility:', e)
    }
  },

  applyTemplate: async (templateId) => {
    try {
      const result = await api.applyTemplate(templateId)
      if (result.success && result.selection) {
        set((state) => ({
          selections: [...state.selections, result.selection!],
          currentSelection: result.selection!,
        }))
        await get().fetchVersions()
        setTimeout(() => get().checkCurrentSelectionCompatibility(), 0)
      }
      return result
    } catch (e) {
      console.error('Failed to apply template:', e)
    }
  },

  combineTemplates: async (templateIds) => {
    try {
      const result = await api.combineTemplates(templateIds)
      set({ combinedTemplates: result })
    } catch (e) {
      console.error('Failed to combine templates:', e)
    }
  },

  toggleTemplateFavorite: async (templateId) => {
    const { isAuthenticated, toggleUserFavorite, templates, currentTemplate } = get()
    if (isAuthenticated) {
      const template = templates.find((t) => t.id === templateId)
      const favorited = await toggleUserFavorite('template', templateId, template?.name)
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === templateId ? { ...t, favoriteCount: t.favoriteCount + (favorited ? 1 : -1) } : t
        ),
        currentTemplate:
          state.currentTemplate?.id === templateId
            ? { ...state.currentTemplate, favoriteCount: state.currentTemplate.favoriteCount + (favorited ? 1 : -1) }
            : state.currentTemplate,
      }))
      return
    }
    try {
      const result = await api.toggleTemplateFavorite(templateId)
      set((state) => {
        const favorites = result.favorited
          ? [...state.templateFavorites, templateId]
          : state.templateFavorites.filter((id) => id !== templateId)
        saveToStorage('xcf-template-favorites', favorites)
        return {
          templateFavorites: favorites,
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, favoriteCount: result.favoriteCount } : t
          ),
          currentTemplate:
            state.currentTemplate?.id === templateId
              ? { ...state.currentTemplate, favoriteCount: result.favoriteCount }
              : state.currentTemplate,
        }
      })
    } catch (e) {
      console.error('Failed to toggle template favorite:', e)
    }
  },

  setTemplateSearchQuery: (q) => set({ templateSearchQuery: q }),
  setTemplateCategoryFilter: (cat) => set({ templateCategoryFilter: cat }),
  setTemplateStatusFilter: (status) => set({ templateStatusFilter: status }),
  setTemplateModelFilter: (modelId) => set({ templateModelFilter: modelId }),

  toggleTemplateSelection: (templateId) =>
    set((state) => ({
      selectedTemplateIds: state.selectedTemplateIds.includes(templateId)
        ? state.selectedTemplateIds.filter((id) => id !== templateId)
        : [...state.selectedTemplateIds, templateId],
    })),

  clearTemplateSelection: () => set({ selectedTemplateIds: [] }),

  selectAllTemplates: () =>
    set((state) => ({
      selectedTemplateIds: state.getFilteredTemplates().map((t) => t.id),
    })),

  selectTemplatesByIds: (templateIds) =>
    set({ selectedTemplateIds: templateIds }),

  getFilteredTemplates: () => {
    const {
      templates,
      templateSearchQuery,
      templateCategoryFilter,
      templateStatusFilter,
      templateModelFilter,
    } = get()

    let result = [...templates]

    if (templateSearchQuery) {
      const q = templateSearchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    if (templateCategoryFilter && templateCategoryFilter !== 'all') {
      if (templateCategoryFilter === 'hot') {
        result = result.filter((t) => t.isHot || t.isRecommended)
      } else {
        result = result.filter((t) => t.category === templateCategoryFilter)
      }
    }

    if (templateStatusFilter && templateStatusFilter !== 'all') {
      result = result.filter((t) => t.status === templateStatusFilter)
    }

    if (templateModelFilter) {
      result = result.filter((t) => t.modelIds.includes(templateModelFilter))
    }

    return result
  },

  getTemplateById: (id) => {
    return get().templates.find((t) => t.id === id)
  },

  isTemplateFavorite: (templateId) => {
    const { isAuthenticated, userFavorites, templateFavorites } = get()
    if (isAuthenticated) {
      return userFavorites.some((f) => f.targetType === 'template' && f.targetId === templateId)
    }
    return templateFavorites.includes(templateId)
  },

  setCurrentSelection: (selection) => {
    set({ currentSelection: selection })
  },

  setCombinedTemplates: (data) => {
    set({ combinedTemplates: data })
  },

  fetchInventoryOverview: async () => {
    try {
      const overview = await api.getInventoryOverview()
      set({ inventoryMap: overview.inventory })
    } catch (e) {
      console.error('Failed to fetch inventory overview:', e)
    }
  },

  fetchInventoryBatchInfo: async (partIds) => {
    if (partIds.length === 0) return
    try {
      const batchInfo = await api.getInventoryBatchInfo(partIds)
      set((state) => ({
        inventoryMap: { ...state.inventoryMap, ...batchInfo },
      }))
    } catch (e) {
      console.error('Failed to fetch batch inventory info:', e)
    }
  },

  getInventoryInfo: (partId) => {
    return get().inventoryMap[partId]
  },

  getStockLevel: (partId) => {
    const info = get().inventoryMap[partId]
    return info?.stockLevel ?? 'in_stock'
  },

  isOutOfStock: (partId) => {
    return get().getStockLevel(partId) === 'out_of_stock'
  },

  isLowStock: (partId) => {
    return get().getStockLevel(partId) === 'low_stock'
  },

  reserveInventoryForSelection: async (selectionId, items) => {
    try {
      const result = await api.reserveInventory(selectionId, items)
      await get().fetchInventoryOverview()
      return result.success
    } catch (e) {
      console.error('Failed to reserve inventory:', e)
      return false
    }
  },

  releaseInventoryForSelection: async (selectionId, partIds) => {
    try {
      await api.releaseInventory(selectionId, partIds)
      await get().fetchInventoryOverview()
    } catch (e) {
      console.error('Failed to release inventory:', e)
    }
  },

  consumeInventoryForSelection: async (selectionId) => {
    try {
      await api.consumeInventory(selectionId)
      await get().fetchInventoryOverview()
    } catch (e) {
      console.error('Failed to consume inventory:', e)
    }
  },

  fetchStockAlerts: async (params) => {
    try {
      const alerts = await api.getStockAlerts(params)
      set({ stockAlerts: alerts })
    } catch (e) {
      console.error('Failed to fetch stock alerts:', e)
    }
  },

  markAlertRead: async (alertId) => {
    try {
      await api.markAlertRead(alertId)
      set((state) => ({
        stockAlerts: state.stockAlerts.map((a) =>
          a.id === alertId ? { ...a, isRead: true } : a
        ),
      }))
    } catch (e) {
      console.error('Failed to mark alert read:', e)
    }
  },

  markAllAlertsRead: async () => {
    try {
      await api.markAllAlertsRead()
      set((state) => ({
        stockAlerts: state.stockAlerts.map((a) => ({ ...a, isRead: true })),
      }))
    } catch (e) {
      console.error('Failed to mark all alerts read:', e)
    }
  },

  getUnreadAlertCount: () => {
    return get().stockAlerts.filter((a) => !a.isRead).length
  },

  fetchSubstitutes: async (partId) => {
    try {
      const substitutes = await api.getSubstitutes(partId)
      set((state) => ({
        substituteCache: { ...state.substituteCache, [partId]: substitutes },
      }))
      return substitutes
    } catch (e) {
      console.error('Failed to fetch substitutes:', e)
      return []
    }
  },

  getSubstitutesForPart: (partId) => {
    return get().substituteCache[partId] ?? []
  },

  fetchPurchaseOrders: async (params) => {
    set({ inventoryLoading: true })
    try {
      const orders = await api.getPurchaseOrders(params)
      set({ purchaseOrders: orders, inventoryLoading: false })
    } catch (e) {
      console.error('Failed to fetch purchase orders:', e)
      set({ inventoryLoading: false })
    }
  },

  createPurchaseOrder: async (data) => {
    try {
      const order = await api.createPurchaseOrder(data)
      set((state) => ({
        purchaseOrders: [order, ...state.purchaseOrders],
      }))
      return order
    } catch (e) {
      console.error('Failed to create purchase order:', e)
    }
  },

  updatePurchaseOrderStatus: async (id, status) => {
    try {
      const updated = await api.updatePurchaseOrderStatus(id, status)
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((o) =>
          o.id === id ? updated : o
        ),
      }))
    } catch (e) {
      console.error('Failed to update purchase order status:', e)
    }
  },

  deletePurchaseOrder: async (id) => {
    try {
      await api.deletePurchaseOrder(id)
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((o) => o.id !== id),
      }))
    } catch (e) {
      console.error('Failed to delete purchase order:', e)
    }
  },

  fetchQuotes: async (params) => {
    set({ quotesLoading: true })
    try {
      const quotes = await api.getQuotes(params)
      set({ quotes, quotesLoading: false })
    } catch (e) {
      console.error('Failed to fetch quotes:', e)
      set({ quotesLoading: false })
    }
  },

  fetchQuoteDetail: async (id) => {
    try {
      const quote = await api.getQuote(id)
      set({ currentQuote: quote })
    } catch (e) {
      console.error('Failed to fetch quote detail:', e)
    }
  },

  createQuote: async (data) => {
    try {
      const quote = await api.createQuote(data)
      set((state) => ({
        quotes: [quote, ...state.quotes],
      }))
      return quote
    } catch (e) {
      console.error('Failed to create quote:', e)
    }
  },

  updateQuote: async (id, data) => {
    try {
      const quote = await api.updateQuote(id, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? quote : q)),
        currentQuote: state.currentQuote?.id === id ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to update quote:', e)
    }
  },

  deleteQuote: async (id) => {
    try {
      await api.deleteQuote(id)
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
        currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
      }))
    } catch (e) {
      console.error('Failed to delete quote:', e)
    }
  },

  setQuoteFilterStatus: (status) => set({ quoteFilterStatus: status }),
  setQuoteFilterCustomerName: (name) => set({ quoteFilterCustomerName: name }),
  setQuoteFilterModelId: (modelId) => set({ quoteFilterModelId: modelId }),

  getFilteredQuotes: () => {
    const { quotes, quoteFilterStatus, quoteFilterCustomerName, quoteFilterModelId } = get()
    let result = [...quotes]
    if (quoteFilterStatus !== 'all') {
      result = result.filter((q) => q.status === quoteFilterStatus)
    }
    if (quoteFilterCustomerName) {
      const q = quoteFilterCustomerName.toLowerCase()
      result = result.filter((o) => o.customerName.toLowerCase().includes(q))
    }
    if (quoteFilterModelId) {
      result = result.filter((o) => o.modelId === quoteFilterModelId)
    }
    return result
  },

  getQuoteById: (id) => {
    return get().quotes.find((q) => q.id === id)
  },

  createQuotePlan: async (quoteId, data) => {
    try {
      const plan = await api.createQuotePlan(quoteId, data)
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === quoteId ? { ...q, plans: [...q.plans, plan], updatedAt: new Date().toISOString() } : q
        ),
        currentQuote:
          state.currentQuote?.id === quoteId
            ? { ...state.currentQuote, plans: [...state.currentQuote.plans, plan], updatedAt: new Date().toISOString() }
            : state.currentQuote,
      }))
      return plan
    } catch (e) {
      console.error('Failed to create quote plan:', e)
    }
  },

  updateQuotePlan: async (quoteId, planId, data) => {
    try {
      const plan = await api.updateQuotePlan(quoteId, planId, data)
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                plans: q.plans.map((p) => (p.id === planId ? plan : p)),
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
        currentQuote:
          state.currentQuote?.id === quoteId
            ? {
                ...state.currentQuote,
                plans: state.currentQuote.plans.map((p) => (p.id === planId ? plan : p)),
                updatedAt: new Date().toISOString(),
              }
            : state.currentQuote,
      }))
      return plan
    } catch (e) {
      console.error('Failed to update quote plan:', e)
    }
  },

  deleteQuotePlan: async (quoteId, planId) => {
    try {
      await api.deleteQuotePlan(quoteId, planId)
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                plans: q.plans.filter((p) => p.id !== planId),
                activePlanId: q.activePlanId === planId ? q.plans[0]?.id : q.activePlanId,
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
        currentQuote:
          state.currentQuote?.id === quoteId
            ? {
                ...state.currentQuote,
                plans: state.currentQuote.plans.filter((p) => p.id !== planId),
                activePlanId:
                  state.currentQuote.activePlanId === planId
                    ? state.currentQuote.plans[0]?.id
                    : state.currentQuote.activePlanId,
                updatedAt: new Date().toISOString(),
              }
            : state.currentQuote,
      }))
    } catch (e) {
      console.error('Failed to delete quote plan:', e)
    }
  },

  compareQuotePlans: async (quoteId, planA, planB) => {
    try {
      const result = await api.compareQuotePlans(quoteId, planA, planB)
      set({ planComparison: result })
      return result
    } catch (e) {
      console.error('Failed to compare quote plans:', e)
      return null
    }
  },

  setPlanComparison: (data) => set({ planComparison: data }),

  submitQuoteApproval: async (quoteId, data) => {
    try {
      const quote = await api.submitQuoteApproval(quoteId, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to submit quote approval:', e)
    }
  },

  processQuoteApproval: async (quoteId, nodeId, data) => {
    try {
      const quote = await api.processQuoteApproval(quoteId, nodeId, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to process quote approval:', e)
    }
  },

  sendQuoteToCustomer: async (quoteId) => {
    try {
      const quote = await api.sendQuoteToCustomer(quoteId)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to send quote to customer:', e)
    }
  },

  customerConfirmQuote: async (quoteId, data) => {
    try {
      const quote = await api.customerConfirmQuote(quoteId, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to confirm quote:', e)
    }
  },

  customerRejectQuote: async (quoteId, data) => {
    try {
      const quote = await api.customerRejectQuote(quoteId, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to reject quote:', e)
    }
  },

  exportQuote: async (quoteId, data) => {
    try {
      const result = await api.exportQuote(quoteId, data)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? result.quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? result.quote : state.currentQuote,
      }))
      return result
    } catch (e) {
      console.error('Failed to export quote:', e)
    }
  },

  convertQuoteToOrder: async (quoteId, orderId) => {
    try {
      const quote = await api.convertQuoteToOrder(quoteId, orderId)
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? quote : q)),
        currentQuote: state.currentQuote?.id === quoteId ? quote : state.currentQuote,
      }))
      return quote
    } catch (e) {
      console.error('Failed to convert quote to order:', e)
    }
  },

  fetchDiscountRules: async (params) => {
    set({ discountRulesLoading: true })
    try {
      const rules = await api.getDiscountRules(params)
      set({ discountRules: rules, discountRulesLoading: false })
    } catch (e) {
      console.error('Failed to fetch discount rules:', e)
      set({ discountRulesLoading: false })
    }
  },

  createDiscountRule: async (data) => {
    try {
      const rule = await api.createDiscountRule(data)
      set((state) => ({
        discountRules: [...state.discountRules, rule],
      }))
      return rule
    } catch (e) {
      console.error('Failed to create discount rule:', e)
    }
  },

  updateDiscountRule: async (id, data) => {
    try {
      const rule = await api.updateDiscountRule(id, data)
      set((state) => ({
        discountRules: state.discountRules.map((r) => (r.id === id ? rule : r)),
      }))
      return rule
    } catch (e) {
      console.error('Failed to update discount rule:', e)
    }
  },

  deleteDiscountRule: async (id) => {
    try {
      await api.deleteDiscountRule(id)
      set((state) => ({
        discountRules: state.discountRules.filter((r) => r.id !== id),
      }))
    } catch (e) {
      console.error('Failed to delete discount rule:', e)
    }
  },

  calculateDiscount: async (data) => {
    try {
      return await api.calculateDiscount(data)
    } catch (e) {
      console.error('Failed to calculate discount:', e)
    }
  },

  applyDiscountToPlan: async (quoteId, planId) => {
    try {
      const res = await api.applyDiscountToPlan(quoteId, planId)
      if (res?.success && res.plan) {
        set((state) => {
          const quotes = state.quotes.map((q) => {
            if (q.id !== quoteId) return q
            return {
              ...q,
              plans: q.plans.map((p) => (p.id === res.plan.id ? res.plan : p)),
              updatedAt: new Date().toISOString(),
            }
          })
          const currentQuote = state.currentQuote?.id === quoteId
            ? {
                ...state.currentQuote,
                plans: state.currentQuote.plans.map((p) =>
                  p.id === res.plan.id ? res.plan : p
                ),
                updatedAt: new Date().toISOString(),
              }
            : state.currentQuote
          return { quotes, currentQuote }
        })
        return res.plan
      }
    } catch (e) {
      console.error('Failed to apply discount to plan:', e)
    }
  },

  downloadQuoteFile: async (type, quoteId, planId, exportedBy) => {
    try {
      await api.downloadQuoteFile(type, quoteId, planId, exportedBy)
      const quote = get().currentQuote || get().quotes.find((q) => q.id === quoteId)
      if (quote) {
        await get().fetchQuoteDetail(quoteId)
      }
    } catch (e) {
      console.error('Failed to download quote file:', e)
      throw e
    }
  },

  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('xcf-auth-token', token)
    } else {
      localStorage.removeItem('xcf-auth-token')
    }
    set({ authToken: token })
  },

  register: async (data) => {
    try {
      set({ authLoading: true })
      const result = await api.register(data)
      get().setAuthToken(result.token)
      set({
        currentUser: result.user,
        isAuthenticated: true,
        authLoading: false,
      })
      return result
    } catch (e) {
      console.error('Failed to register:', e)
      set({ authLoading: false })
    }
  },

  login: async (data) => {
    try {
      set({ authLoading: true })
      const result = await api.login(data)
      get().setAuthToken(result.token)
      set({
        currentUser: result.user,
        isAuthenticated: true,
        authLoading: false,
      })
      return result
    } catch (e) {
      console.error('Failed to login:', e)
      set({ authLoading: false })
    }
  },

  logout: async () => {
    try {
      await api.logout()
    } catch (e) {
      console.error('Failed to logout:', e)
    } finally {
      get().setAuthToken(null)
      set({
        currentUser: null,
        userProfile: null,
        isAuthenticated: false,
        userFavorites: [],
        userBrowsingHistory: [],
        userArchives: [],
        userSharedResources: { owned: [], collaborated: [] },
        userStats: null,
      })
    }
  },

  fetchCurrentUser: async () => {
    const token = get().authToken
    if (!token) {
      set({ isAuthenticated: false })
      return
    }
    try {
      set({ authLoading: true })
      const result = await api.getCurrentUser()
      set({
        currentUser: result.user,
        userProfile: result.profile,
        isAuthenticated: true,
        authLoading: false,
      })
    } catch (e) {
      console.error('Failed to fetch current user:', e)
      get().setAuthToken(null)
      set({
        currentUser: null,
        userProfile: null,
        isAuthenticated: false,
        authLoading: false,
      })
    }
  },

  updateUserProfile: async (data) => {
    try {
      const result = await api.updateUserProfile(data)
      set({
        currentUser: result.user,
        userProfile: result.profile,
      })
      return result
    } catch (e) {
      console.error('Failed to update user profile:', e)
    }
  },

  changePassword: async (data) => {
    try {
      const result = await api.changePassword(data)
      return result.success
    } catch (e) {
      console.error('Failed to change password:', e)
      return false
    }
  },

  fetchUserFavorites: async (type) => {
    if (!get().isAuthenticated) return
    try {
      set({ userDataLoading: true })
      const favorites = await api.getFavorites(type)
      set({ userFavorites: favorites, userDataLoading: false })
    } catch (e) {
      console.error('Failed to fetch favorites:', e)
      set({ userDataLoading: false })
    }
  },

  toggleUserFavorite: async (targetType, targetId, targetName) => {
    if (!get().isAuthenticated) return false
    try {
      const existing = get().userFavorites.find(
        (f) => f.targetType === targetType && f.targetId === targetId
      )
      if (existing) {
        await api.removeFavorite(existing.id)
        set((state) => ({
          userFavorites: state.userFavorites.filter((f) => f.id !== existing.id),
        }))
        return false
      } else {
        const result = await api.addFavorite({ targetType, targetId, targetName })
        set((state) => ({
          userFavorites: [result, ...state.userFavorites],
        }))
        return true
      }
    } catch (e) {
      console.error('Failed to toggle favorite:', e)
      return false
    }
  },

  checkUserFavorite: async (targetType, targetId) => {
    if (!get().isAuthenticated) return false
    try {
      const result = await api.checkFavorite({ targetType, targetId })
      return result.favorited
    } catch (e) {
      console.error('Failed to check favorite:', e)
      return false
    }
  },

  fetchUserBrowsingHistory: async (limit) => {
    if (!get().isAuthenticated) return
    try {
      set({ userDataLoading: true })
      const history = await api.getBrowsingHistory(limit)
      set({ userBrowsingHistory: history, userDataLoading: false })
    } catch (e) {
      console.error('Failed to fetch browsing history:', e)
      set({ userDataLoading: false })
    }
  },

  addUserBrowsingHistory: async (data) => {
    if (!get().isAuthenticated) return
    try {
      const record = await api.addBrowsingHistory(data)
      set((state) => {
        const filtered = state.userBrowsingHistory.filter(
          (h) => !(h.targetType === data.targetType && h.targetId === data.targetId)
        )
        return {
          userBrowsingHistory: [record as any, ...filtered].slice(0, 200),
        }
      })
    } catch (e) {
      console.error('Failed to add browsing history:', e)
    }
  },

  removeBrowsingHistoryItem: async (id) => {
    if (!get().isAuthenticated) return
    try {
      await api.removeBrowsingHistory(id)
      set((state) => ({
        userBrowsingHistory: state.userBrowsingHistory.filter((h) => h.id !== id),
      }))
    } catch (e) {
      console.error('Failed to remove browsing history:', e)
    }
  },

  clearBrowsingHistory: async () => {
    if (!get().isAuthenticated) return
    try {
      await api.clearBrowsingHistory()
      set({ userBrowsingHistory: [] })
    } catch (e) {
      console.error('Failed to clear browsing history:', e)
    }
  },

  fetchUserArchives: async (status) => {
    if (!get().isAuthenticated) return
    try {
      set({ userDataLoading: true })
      const archives = await api.getArchives(status)
      set({ userArchives: archives, userDataLoading: false })
    } catch (e) {
      console.error('Failed to fetch archives:', e)
      set({ userDataLoading: false })
    }
  },

  fetchArchiveDetail: async (id) => {
    try {
      return await api.getArchive(id)
    } catch (e) {
      console.error('Failed to fetch archive detail:', e)
    }
  },

  createArchive: async (data) => {
    if (!get().isAuthenticated) return
    try {
      const archive = await api.createArchive(data)
      set((state) => ({
        userArchives: [archive, ...state.userArchives],
      }))
      return archive
    } catch (e) {
      console.error('Failed to create archive:', e)
    }
  },

  updateArchive: async (id, data) => {
    if (!get().isAuthenticated) return
    try {
      const archive = await api.updateArchive(id, data)
      set((state) => ({
        userArchives: state.userArchives.map((a) => (a.id === id ? archive : a)),
      }))
      return archive
    } catch (e) {
      console.error('Failed to update archive:', e)
    }
  },

  deleteArchive: async (id) => {
    if (!get().isAuthenticated) return
    try {
      await api.deleteArchive(id)
      set((state) => ({
        userArchives: state.userArchives.filter((a) => a.id !== id),
      }))
    } catch (e) {
      console.error('Failed to delete archive:', e)
    }
  },

  fetchSharedResources: async () => {
    if (!get().isAuthenticated) return
    try {
      set({ userDataLoading: true })
      const resources = await api.getSharedResources()
      set({ userSharedResources: resources, userDataLoading: false })
    } catch (e) {
      console.error('Failed to fetch shared resources:', e)
      set({ userDataLoading: false })
    }
  },

  createSharedResource: async (data) => {
    if (!get().isAuthenticated) return
    try {
      const resource = await api.createSharedResource(data)
      set((state) => ({
        userSharedResources: {
          ...state.userSharedResources,
          owned: [resource, ...state.userSharedResources.owned],
        },
      }))
      return resource
    } catch (e) {
      console.error('Failed to create shared resource:', e)
    }
  },

  inviteCollaborator: async (sharedId, data) => {
    if (!get().isAuthenticated) return
    try {
      const collaborator = await api.inviteCollaborator(sharedId, data)
      set((state) => ({
        userSharedResources: {
          ...state.userSharedResources,
          owned: state.userSharedResources.owned.map((r) =>
            r.id === sharedId
              ? { ...r, collaborators: [...r.collaborators, collaborator] }
              : r
          ),
        },
      }))
      return collaborator
    } catch (e) {
      console.error('Failed to invite collaborator:', e)
    }
  },

  removeCollaborator: async (sharedId, userId) => {
    if (!get().isAuthenticated) return
    try {
      await api.removeCollaborator(sharedId, userId)
      set((state) => ({
        userSharedResources: {
          ...state.userSharedResources,
          owned: state.userSharedResources.owned.map((r) =>
            r.id === sharedId
              ? {
                  ...r,
                  collaborators: r.collaborators.filter((c) => c.userId !== userId),
                }
              : r
          ),
        },
      }))
    } catch (e) {
      console.error('Failed to remove collaborator:', e)
    }
  },

  fetchUserStats: async () => {
    if (!get().isAuthenticated) return
    try {
      const stats = await api.getUserStats()
      set({ userStats: stats })
    } catch (e) {
      console.error('Failed to fetch user stats:', e)
    }
  },

  fetchCustomers: async (params) => {
    set({ customersLoading: true })
    try {
      const customers = await api.getCustomers(params)
      set({ customers, customersLoading: false })
    } catch (e) {
      console.error('Failed to fetch customers:', e)
      set({ customersLoading: false })
    }
  },

  fetchCustomerDetail: async (id) => {
    try {
      const customer = await api.getCustomer(id)
      set((state) => {
        saveReceptionContext({
          customerId: customer.id,
          quoteId: state.currentQuote?.id ?? null,
          scheduleId: state.currentSchedule?.id ?? null,
        })
        return { currentCustomer: customer }
      })
    } catch (e) {
      console.error('Failed to fetch customer detail:', e)
    }
  },

  createCustomer: async (data) => {
    try {
      const customer = await api.createCustomer(data)
      set((state) => {
        saveReceptionContext({
          customerId: customer.id,
          quoteId: state.currentQuote?.id ?? null,
          scheduleId: state.currentSchedule?.id ?? null,
        })
        return {
          customers: [customer, ...state.customers],
          currentCustomer: customer,
        }
      })
      return customer
    } catch (e) {
      console.error('Failed to create customer:', e)
    }
  },

  updateCustomer: async (id, data) => {
    try {
      const customer = await api.updateCustomer(id, data)
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? customer : c)),
        currentCustomer: state.currentCustomer?.id === id ? customer : state.currentCustomer,
      }))
      return customer
    } catch (e) {
      console.error('Failed to update customer:', e)
    }
  },

  deleteCustomer: async (id) => {
    try {
      await api.deleteCustomer(id)
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        currentCustomer: state.currentCustomer?.id === id ? null : state.currentCustomer,
      }))
    } catch (e) {
      console.error('Failed to delete customer:', e)
    }
  },

  addCustomerVehicle: async (customerId, data) => {
    try {
      const vehicle = await api.addCustomerVehicle(customerId, data)
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId
            ? { ...c, vehicles: [...c.vehicles, vehicle], updatedAt: new Date().toISOString() }
            : c
        ),
        currentCustomer:
          state.currentCustomer?.id === customerId
            ? {
                ...state.currentCustomer,
                vehicles: [...state.currentCustomer.vehicles, vehicle],
                updatedAt: new Date().toISOString(),
              }
            : state.currentCustomer,
      }))
      return vehicle
    } catch (e) {
      console.error('Failed to add customer vehicle:', e)
    }
  },

  updateCustomerVehicle: async (customerId, vehicleId, data) => {
    try {
      const vehicle = await api.updateCustomerVehicle(customerId, vehicleId, data)
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                vehicles: c.vehicles.map((v) => (v.id === vehicleId ? vehicle : v)),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
        currentCustomer:
          state.currentCustomer?.id === customerId
            ? {
                ...state.currentCustomer,
                vehicles: state.currentCustomer.vehicles.map((v) =>
                  v.id === vehicleId ? vehicle : v
                ),
                updatedAt: new Date().toISOString(),
              }
            : state.currentCustomer,
      }))
      return vehicle
    } catch (e) {
      console.error('Failed to update customer vehicle:', e)
    }
  },

  deleteCustomerVehicle: async (customerId, vehicleId) => {
    try {
      await api.deleteCustomerVehicle(customerId, vehicleId)
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                vehicles: c.vehicles.filter((v) => v.id !== vehicleId),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
        currentCustomer:
          state.currentCustomer?.id === customerId
            ? {
                ...state.currentCustomer,
                vehicles: state.currentCustomer.vehicles.filter((v) => v.id !== vehicleId),
                updatedAt: new Date().toISOString(),
              }
            : state.currentCustomer,
      }))
    } catch (e) {
      console.error('Failed to delete customer vehicle:', e)
    }
  },

  setCurrentCustomer: (customer) =>
    set((state) => {
      let nextSchedule = state.currentSchedule
      if (customer) {
        if (!nextSchedule || nextSchedule.customerId !== customer.id) {
          const matched = state.schedules.find(
            (s) =>
              s.customerId === customer.id &&
              (!state.currentQuote ||
                s.quoteId === state.currentQuote.id ||
                s.id === (state.currentQuote as any)?.convertedScheduleId)
          )
          if (matched) {
            nextSchedule = matched
          }
        }
      } else {
        nextSchedule = null
      }
      saveReceptionContext({
        customerId: customer?.id ?? null,
        quoteId: state.currentQuote?.id ?? null,
        scheduleId: nextSchedule?.id ?? null,
      })
      return { currentCustomer: customer, currentSchedule: nextSchedule }
    }),
  setCustomerSearchKeyword: (keyword) => set({ customerSearchKeyword: keyword }),
  setCustomerFilterLevel: (level) => set({ customerFilterLevel: level }),
  setCustomerFilterSource: (source) => set({ customerFilterSource: source }),

  getFilteredCustomers: () => {
    const { customers, customerSearchKeyword, customerFilterLevel, customerFilterSource } = get()
    let result = [...customers]
    if (customerSearchKeyword) {
      const q = customerSearchKeyword.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.contact && c.contact.toLowerCase().includes(q))
      )
    }
    if (customerFilterLevel !== 'all') {
      result = result.filter((c) => c.level === customerFilterLevel)
    }
    if (customerFilterSource !== 'all') {
      result = result.filter((c) => c.source === customerFilterSource)
    }
    return result
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id)
  },

  fetchRequirements: async (params) => {
    set({ requirementsLoading: true })
    try {
      const requirements = await api.getRequirements(params)
      set({ requirements, requirementsLoading: false })
    } catch (e) {
      console.error('Failed to fetch requirements:', e)
      set({ requirementsLoading: false })
    }
  },

  fetchRequirementDetail: async (id) => {
    try {
      const req = await api.getRequirement(id)
      set({ currentRequirement: req })
    } catch (e) {
      console.error('Failed to fetch requirement detail:', e)
    }
  },

  createRequirement: async (data) => {
    try {
      const req = await api.createRequirement(data)
      set((state) => ({
        requirements: [req, ...state.requirements],
        currentRequirement: req,
      }))
      return req
    } catch (e) {
      console.error('Failed to create requirement:', e)
    }
  },

  updateRequirement: async (id, data) => {
    try {
      const req = await api.updateRequirement(id, data)
      set((state) => ({
        requirements: state.requirements.map((r) => (r.id === id ? req : r)),
        currentRequirement: state.currentRequirement?.id === id ? req : state.currentRequirement,
      }))
      return req
    } catch (e) {
      console.error('Failed to update requirement:', e)
    }
  },

  deleteRequirement: async (id) => {
    try {
      await api.deleteRequirement(id)
      set((state) => ({
        requirements: state.requirements.filter((r) => r.id !== id),
        currentRequirement: state.currentRequirement?.id === id ? null : state.currentRequirement,
      }))
    } catch (e) {
      console.error('Failed to delete requirement:', e)
    }
  },

  setCurrentRequirement: (requirement) => set({ currentRequirement: requirement }),

  getRequirementsByCustomer: (customerId) => {
    return get().requirements.filter((r) => r.customerId === customerId)
  },

  getRequirementById: (id) => {
    return get().requirements.find((r) => r.id === id)
  },

  fetchSchedules: async (params) => {
    set({ schedulesLoading: true })
    try {
      const schedules = await api.getSchedules(params)
      set({ schedules, schedulesLoading: false })
    } catch (e) {
      console.error('Failed to fetch schedules:', e)
      set({ schedulesLoading: false })
    }
  },

  fetchScheduleDetail: async (id) => {
    try {
      const schedule = await api.getSchedule(id)
      set({ currentSchedule: schedule })
    } catch (e) {
      console.error('Failed to fetch schedule detail:', e)
    }
  },

  createSchedule: async (data) => {
    try {
      const schedule = await api.createSchedule(data)
      set((state) => ({
        schedules: [schedule, ...state.schedules],
        currentSchedule: schedule,
      }))
      return schedule
    } catch (e) {
      console.error('Failed to create schedule:', e)
    }
  },

  updateSchedule: async (id, data) => {
    try {
      const schedule = await api.updateSchedule(id, data)
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? schedule : s)),
        currentSchedule: state.currentSchedule?.id === id ? schedule : state.currentSchedule,
      }))
      return schedule
    } catch (e) {
      console.error('Failed to update schedule:', e)
    }
  },

  deleteSchedule: async (id) => {
    try {
      await api.deleteSchedule(id)
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        currentSchedule: state.currentSchedule?.id === id ? null : state.currentSchedule,
      }))
    } catch (e) {
      console.error('Failed to delete schedule:', e)
    }
  },

  updateScheduleTask: async (scheduleId, taskId, data) => {
    try {
      const schedule = await api.updateScheduleTask(scheduleId, taskId, data)
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === scheduleId ? schedule : s)),
        currentSchedule: state.currentSchedule?.id === scheduleId ? schedule : state.currentSchedule,
      }))
      return schedule
    } catch (e) {
      console.error('Failed to update schedule task:', e)
    }
  },

  setCurrentSchedule: (schedule) => {
    set({ currentSchedule: schedule })
    const { currentCustomer, currentQuote } = get()
    saveReceptionContext({
      customerId: currentCustomer?.id ?? null,
      quoteId: currentQuote?.id ?? null,
      scheduleId: schedule?.id ?? null,
    })
  },

  getSchedulesByCustomer: (customerId) => {
    return get().schedules.filter((s) => s.customerId === customerId)
  },

  getScheduleById: (id) => {
    return get().schedules.find((s) => s.id === id)
  },

  setReceptionActiveTab: (tab) => set({ receptionActiveTab: tab }),

  createReceptionSelection: async (data) => {
    try {
      const selection = await api.createReceptionSelection(data)
      set((state) => ({
        receptionSelections: [selection, ...state.receptionSelections],
        currentReceptionSelection: selection,
      }))
      return selection
    } catch (e) {
      console.error('Failed to create reception selection:', e)
    }
  },

  updateReceptionSelection: async (id, data) => {
    try {
      const selection = await api.updateReceptionSelection(id, data)
      set((state) => ({
        receptionSelections: state.receptionSelections.map((s) => (s.id === id ? selection : s)),
        currentReceptionSelection: state.currentReceptionSelection?.id === id ? selection : state.currentReceptionSelection,
      }))
      return selection
    } catch (e) {
      console.error('Failed to update reception selection:', e)
    }
  },

  setCurrentReceptionSelection: (selection) => set({ currentReceptionSelection: selection }),

  getReceptionSelectionsByCustomer: (customerId) => {
    return get().receptionSelections.filter((s) => s.customerId === customerId)
  },

  createQuoteFromSelection: async (selectionId, data) => {
    try {
      const quote = await api.createQuoteFromSelection(selectionId, data)
      set((state) => {
        saveReceptionContext({
          customerId: state.currentCustomer?.id ?? null,
          quoteId: quote.id,
          scheduleId: state.currentSchedule?.id ?? null,
        })
        return {
          receptionQuotes: [quote, ...state.receptionQuotes],
          currentQuote: quote,
        }
      })
      return quote
    } catch (e) {
      console.error('Failed to create quote from selection:', e)
    }
  },

  createQuoteFromRequirements: async (data) => {
    try {
      const quote = await api.createQuoteFromRequirements(data)
      set((state) => {
        saveReceptionContext({
          customerId: state.currentCustomer?.id ?? null,
          quoteId: quote.id,
          scheduleId: state.currentSchedule?.id ?? null,
        })
        return {
          receptionQuotes: [quote, ...state.receptionQuotes],
          currentQuote: quote,
        }
      })
      return quote
    } catch (e) {
      console.error('Failed to create quote from requirements:', e)
    }
  },

  updateQuoteFull: async (id, data) => {
    try {
      const quote = await api.updateQuoteFull(id, data)
      set((state) => {
        const nextQuote = state.currentQuote?.id === id ? quote : state.currentQuote
        if (nextQuote?.id === quote.id) {
          saveReceptionContext({
            customerId: state.currentCustomer?.id ?? null,
            quoteId: quote.id,
            scheduleId: state.currentSchedule?.id ?? null,
          })
        }
        return {
          receptionQuotes: state.receptionQuotes.map((q) => (q.id === id ? quote : q)),
          currentQuote: nextQuote,
        }
      })
      return quote
    } catch (e) {
      console.error('Failed to update quote full:', e)
    }
  },

  createScheduleFromQuote: async (data) => {
    try {
      const schedule = await api.createScheduleFromQuote(data)
      set((state) => {
        saveReceptionContext({
          customerId: state.currentCustomer?.id ?? null,
          quoteId: state.currentQuote?.id ?? null,
          scheduleId: schedule.id,
        })
        return {
          schedules: [schedule, ...state.schedules],
          currentSchedule: schedule,
        }
      })
      return schedule
    } catch (e) {
      console.error('Failed to create schedule from quote:', e)
    }
  },

  fetchQuoteWithDetails: async (id) => {
    try {
      const quote = await api.getQuoteWithDetails(id)
      set((state) => {
        const nextCustomer = quote.customer || state.currentCustomer
        const nextSchedule = quote.schedule || state.currentSchedule
        saveReceptionContext({
          customerId: nextCustomer?.id ?? null,
          quoteId: quote.id,
          scheduleId: nextSchedule?.id ?? null,
        })
        return {
          currentQuote: quote,
          currentCustomer: nextCustomer,
          currentRequirement: quote.requirement || state.currentRequirement,
          currentSchedule: nextSchedule,
        }
      })
      return quote
    } catch (e) {
      console.error('Failed to fetch quote details:', e)
    }
  },

  fetchReceptionQuotes: async (params) => {
    set({ quotesLoading: true })
    try {
      const quotes = await api.getQuotesByCustomer(params?.customerId || '')
      set({ receptionQuotes: quotes, quotesLoading: false })
    } catch (e) {
      console.error('Failed to fetch reception quotes:', e)
      set({ quotesLoading: false })
    }
  },

  setCurrentQuote: (quote) =>
    set((state) => {
      let nextSchedule = state.currentSchedule
      if (quote) {
        const convertedId = (quote as any)?.convertedScheduleId
        const matched =
          (convertedId && state.schedules.find((s) => s.id === convertedId)) ||
          state.schedules.find(
            (s) =>
              s.quoteId === quote.id &&
              (!state.currentCustomer || s.customerId === state.currentCustomer.id)
          )
        if (matched) {
          nextSchedule = matched
        }
      }
      saveReceptionContext({
        customerId: state.currentCustomer?.id ?? null,
        quoteId: quote?.id ?? null,
        scheduleId: nextSchedule?.id ?? null,
      })
      return { currentQuote: quote, currentSchedule: nextSchedule }
    }),

  getQuotesByCustomer: (customerId) => {
    return get().receptionQuotes.filter((q) => q.customerId === customerId)
  },

  restoreReceptionContext: async () => {
    const ctx = loadReceptionContext()
    if (!ctx.customerId && !ctx.quoteId && !ctx.scheduleId) return

    const updates: Partial<AppState> = {}

    try {
      if (ctx.customerId) {
        const customer = await api.getCustomer(ctx.customerId)
        if (customer) updates.currentCustomer = customer
      }
    } catch (e) {
      console.error('restoreReceptionContext: failed to restore customer', e)
    }

    try {
      if (ctx.quoteId) {
        const quote = await api.getQuoteWithDetails(ctx.quoteId)
        if (quote) {
          updates.currentQuote = quote
          if (quote.customer) updates.currentCustomer = quote.customer
          if (quote.requirement) updates.currentRequirement = quote.requirement
          if (quote.schedule) updates.currentSchedule = quote.schedule
        }
      }
    } catch (e) {
      console.error('restoreReceptionContext: failed to restore quote', e)
    }

    try {
      if (ctx.scheduleId && !updates.currentSchedule) {
        const schedule = await api.getSchedule(ctx.scheduleId)
        if (schedule) updates.currentSchedule = schedule
      }
    } catch (e) {
      console.error('restoreReceptionContext: failed to restore schedule', e)
    }

    if (Object.keys(updates).length > 0) {
      set(updates)
    }
  },

  fetchPartReviews: async (partId, params) => {
    set((state) => ({
      partReviewsLoading: { ...state.partReviewsLoading, [partId]: true },
    }))
    try {
      const result = await api.getPartReviews(partId, params)
      set((state) => ({
        partReviews: { ...state.partReviews, [partId]: result.reviews },
        partReviewStats: { ...state.partReviewStats, [partId]: result.stats },
        partReviewsLoading: { ...state.partReviewsLoading, [partId]: false },
      }))
    } catch (e) {
      console.error('Failed to fetch part reviews:', e)
      set((state) => ({
        partReviewsLoading: { ...state.partReviewsLoading, [partId]: false },
      }))
    }
  },

  fetchReviewStats: async (partId) => {
    try {
      const stats = await api.getReviewStats(partId)
      set((state) => ({
        partReviewStats: { ...state.partReviewStats, [partId]: stats },
      }))
      return stats
    } catch (e) {
      console.error('Failed to fetch review stats:', e)
      return null
    }
  },

  createReview: async (data) => {
    try {
      const review = await api.createReview(data)
      return review
    } catch (e) {
      console.error('Failed to create review:', e)
      return null
    }
  },

  markReviewHelpful: async (reviewId, userId) => {
    try {
      const result = await api.markReviewHelpful(reviewId, userId)
      set((state) => {
        const newPartReviews: Record<string, PartReview[]> = {}
        Object.entries(state.partReviews).forEach(([partId, reviews]) => {
          newPartReviews[partId] = reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: result.helpfulCount } : r
          )
        })
        return { partReviews: newPartReviews }
      })
    } catch (e) {
      console.error('Failed to mark review helpful:', e)
    }
  },

  fetchAdminReviews: async (params) => {
    set({ adminReviewsLoading: true })
    try {
      const result = await api.getAdminReviews(params)
      set({
        adminReviews: result.reviews,
        adminReviewsTotal: result.total,
        adminReviewsLoading: false,
      })
    } catch (e) {
      console.error('Failed to fetch admin reviews:', e)
      set({ adminReviewsLoading: false })
    }
  },

  processReview: async (reviewId, data) => {
    try {
      const review = await api.processReview(reviewId, data)
      set((state) => ({
        adminReviews: state.adminReviews.map((r) => (r.id === reviewId ? review : r)),
      }))
      return review
    } catch (e) {
      console.error('Failed to process review:', e)
      return null
    }
  },

  fetchIssues: async (params) => {
    set({ issuesLoading: true })
    try {
      const result = await api.getIssues(params)
      set({
        issues: result.issues,
        issuesTotal: result.total,
        issuesLoading: false,
      })
    } catch (e) {
      console.error('Failed to fetch issues:', e)
      set({ issuesLoading: false })
    }
  },

  createIssue: async (data) => {
    try {
      const issue = await api.createIssue(data)
      set((state) => ({
        issues: [issue, ...state.issues],
      }))
      return issue
    } catch (e) {
      console.error('Failed to create issue:', e)
      return null
    }
  },

  updateIssueStatus: async (issueId, data) => {
    try {
      const issue = await api.updateIssueStatus(issueId, data)
      set((state) => ({
        issues: state.issues.map((i) => (i.id === issueId ? issue : i)),
      }))
      return issue
    } catch (e) {
      console.error('Failed to update issue status:', e)
      return null
    }
  },

  fetchWarnings: async (params) => {
    set({ warningsLoading: true })
    try {
      const result = await api.getWarnings(params)
      set({
        warnings: result.warnings,
        warningsTotal: result.total,
        warningsSummary: result.summary,
        warningsLoading: false,
      })
    } catch (e) {
      console.error('Failed to fetch warnings:', e)
      set({ warningsLoading: false })
    }
  },

  acknowledgeWarning: async (warningId, data) => {
    try {
      const warning = await api.acknowledgeWarning(warningId, data)
      set((state) => ({
        warnings: state.warnings.map((w) => (w.id === warningId ? warning : w)),
      }))
      return warning
    } catch (e) {
      console.error('Failed to acknowledge warning:', e)
      return null
    }
  },

  deleteWarning: async (warningId) => {
    try {
      await api.deleteWarning(warningId)
      set((state) => ({
        warnings: state.warnings.filter((w) => w.id !== warningId),
      }))
      return true
    } catch (e) {
      console.error('Failed to delete warning:', e)
      return false
    }
  },

  fetchVehicleProfiles: async (params) => {
    set({ vehicleProfilesLoading: true })
    try {
      const profiles = await api.getVehicleProfiles(params)
      set({ vehicleProfiles: profiles, vehicleProfilesLoading: false })
    } catch (e) {
      console.error('Failed to fetch vehicle profiles:', e)
      set({ vehicleProfilesLoading: false })
    }
  },

  fetchVehicleProfileDetail: async (id) => {
    try {
      const profile = await api.getVehicleProfile(id)
      set({ currentVehicleProfile: profile })
    } catch (e) {
      console.error('Failed to fetch vehicle profile detail:', e)
      set({ currentVehicleProfile: null })
    }
  },

  createVehicleProfile: async (data) => {
    try {
      const profile = await api.adminCreateVehicleProfile(data)
      set((state) => ({
        vehicleProfiles: [
          {
            id: profile.id,
            modelId: profile.modelId,
            modelName: profile.modelName,
            modelNameEn: profile.modelNameEn,
            year: profile.year,
            trimLevel: profile.trimLevel,
            basePrice: profile.basePrice,
            description: profile.description,
            imageUrl: profile.imageUrl,
            specsCount: profile.specs.length,
            zonesCount: profile.assemblyZones.length,
            restrictionsCount: profile.modificationRestrictions.length,
            regulationsCount: profile.regulationNotes.length,
            diagramsCount: profile.diagrams.length,
            streetLegalStatus: profile.streetLegalStatus,
            isActive: profile.isActive,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
          ...state.vehicleProfiles,
        ],
      }))
      return profile
    } catch (e) {
      console.error('Failed to create vehicle profile:', e)
    }
  },

  updateVehicleProfile: async (id, data) => {
    try {
      const profile = await api.adminUpdateVehicleProfile(id, data)
      set((state) => ({
        vehicleProfiles: state.vehicleProfiles.map((p) =>
          p.id === id
            ? {
                ...p,
                modelName: profile.modelName,
                modelNameEn: profile.modelNameEn,
                year: profile.year,
                trimLevel: profile.trimLevel,
                basePrice: profile.basePrice,
                description: profile.description,
                imageUrl: profile.imageUrl,
                specsCount: profile.specs.length,
                zonesCount: profile.assemblyZones.length,
                restrictionsCount: profile.modificationRestrictions.length,
                regulationsCount: profile.regulationNotes.length,
                diagramsCount: profile.diagrams.length,
                streetLegalStatus: profile.streetLegalStatus,
                isActive: profile.isActive,
                updatedAt: profile.updatedAt,
              }
            : p
        ),
        currentVehicleProfile:
          state.currentVehicleProfile?.id === id
            ? profile
            : state.currentVehicleProfile,
      }))
      return profile
    } catch (e) {
      console.error('Failed to update vehicle profile:', e)
    }
  },

  deleteVehicleProfile: async (id) => {
    try {
      await api.adminDeleteVehicleProfile(id)
      set((state) => ({
        vehicleProfiles: state.vehicleProfiles.filter((p) => p.id !== id),
        currentVehicleProfile:
          state.currentVehicleProfile?.id === id
            ? null
            : state.currentVehicleProfile,
      }))
      return true
    } catch (e) {
      console.error('Failed to delete vehicle profile:', e)
      return false
    }
  },

  updateVehicleProfileStatus: async (id, isActive) => {
    try {
      const profile = await api.adminToggleVehicleProfileActive(id)
      set((state) => ({
        vehicleProfiles: state.vehicleProfiles.map((p) =>
          p.id === id
            ? {
                ...p,
                isActive: profile.isActive,
                updatedAt: profile.updatedAt,
              }
            : p
        ),
        currentVehicleProfile:
          state.currentVehicleProfile?.id === id
            ? { ...state.currentVehicleProfile, isActive: profile.isActive, updatedAt: profile.updatedAt }
            : state.currentVehicleProfile,
      }))
      return profile
    } catch (e) {
      console.error('Failed to update vehicle profile status:', e)
    }
  },

  getVehicleProfileById: (id) => {
    return get().vehicleProfiles.find((p) => p.id === id)
  },

  setVehicleProfileFilterModelId: (modelId) =>
    set({ vehicleProfileFilterModelId: modelId }),

  setVehicleProfileFilterStatus: (status) =>
    set({ vehicleProfileFilterStatus: status }),

  setVehicleProfileSearchKeyword: (keyword) =>
    set({ vehicleProfileSearchKeyword: keyword }),

  getFilteredVehicleProfiles: () => {
    const {
      vehicleProfiles,
      vehicleProfileFilterModelId,
      vehicleProfileFilterStatus,
      vehicleProfileSearchKeyword,
    } = get()
    let result = [...vehicleProfiles]
    if (vehicleProfileFilterModelId) {
      result = result.filter((p) => p.modelId === vehicleProfileFilterModelId)
    }
    if (vehicleProfileFilterStatus !== 'all') {
      result = result.filter(
        (p) =>
          vehicleProfileFilterStatus === 'active' ? p.isActive : !p.isActive
      )
    }
    if (vehicleProfileSearchKeyword) {
      const q = vehicleProfileSearchKeyword.toLowerCase()
      result = result.filter(
        (p) =>
          p.modelName.toLowerCase().includes(q) ||
          p.modelNameEn.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }
    return result
  },

  fetchAfterSalesRecords: async (params) => {
    set({ afterSalesLoading: true })
    try {
      const records = await api.getAfterSalesRecords(params)
      set({ afterSalesRecords: records, afterSalesLoading: false })
    } catch (e) {
      console.error('Failed to fetch after sales records:', e)
      set({ afterSalesLoading: false })
    }
  },

  fetchAfterSalesDetail: async (id) => {
    set({ afterSalesLoading: true })
    try {
      const record = await api.getAfterSalesRecord(id)
      set({ currentAfterSales: record, afterSalesLoading: false })
      return record
    } catch (e) {
      console.error('Failed to fetch after sales detail:', e)
      set({ afterSalesLoading: false })
    }
  },

  fetchAfterSalesByOrder: async (orderId) => {
    set({ afterSalesLoading: true })
    try {
      const records = await api.getAfterSalesByOrder(orderId)
      set({ afterSalesRecords: records, afterSalesLoading: false })
    } catch (e) {
      console.error('Failed to fetch after sales by order:', e)
      set({ afterSalesLoading: false })
    }
  },

  createAfterSales: async (data) => {
    try {
      const record = await api.createAfterSales(data)
      set((state) => ({
        afterSalesRecords: [record, ...state.afterSalesRecords],
      }))
      return record
    } catch (e) {
      console.error('Failed to create after sales record:', e)
    }
  },

  updateAfterSales: async (id, data) => {
    try {
      const record = await api.updateAfterSales(id, data)
      set((state) => ({
        afterSalesRecords: state.afterSalesRecords.map((r) =>
          r.id === id ? record : r
        ),
        currentAfterSales:
          state.currentAfterSales?.id === id ? record : state.currentAfterSales,
      }))
      return record
    } catch (e) {
      console.error('Failed to update after sales record:', e)
    }
  },

  updateAfterSalesStatus: async (id, data) => {
    try {
      const record = await api.updateAfterSalesStatus(id, data)
      set((state) => ({
        afterSalesRecords: state.afterSalesRecords.map((r) =>
          r.id === id ? record : r
        ),
        currentAfterSales:
          state.currentAfterSales?.id === id ? record : state.currentAfterSales,
      }))
      return record
    } catch (e) {
      console.error('Failed to update after sales status:', e)
    }
  },

  deleteAfterSales: async (id) => {
    try {
      await api.deleteAfterSales(id)
      set((state) => ({
        afterSalesRecords: state.afterSalesRecords.filter((r) => r.id !== id),
        currentAfterSales:
          state.currentAfterSales?.id === id
            ? null
            : state.currentAfterSales,
      }))
      return true
    } catch (e) {
      console.error('Failed to delete after sales record:', e)
      return false
    }
  },

  fetchAfterSalesStats: async () => {
    try {
      const stats = await api.getAfterSalesStats()
      set({ afterSalesStats: stats })
    } catch (e) {
      console.error('Failed to fetch after sales stats:', e)
    }
  },

  setAfterSalesFilterStatus: (status) =>
    set({ afterSalesFilterStatus: status }),

  setAfterSalesFilterPriority: (priority) =>
    set({ afterSalesFilterPriority: priority }),

  setAfterSalesFilterType: (type) =>
    set({ afterSalesFilterType: type }),

  setAfterSalesFilterIssueCategory: (category) =>
    set({ afterSalesFilterIssueCategory: category }),

  setAfterSalesSearchKeyword: (keyword) =>
    set({ afterSalesSearchKeyword: keyword }),

  getFilteredAfterSales: () => {
    const {
      afterSalesRecords,
      afterSalesFilterStatus,
      afterSalesFilterPriority,
      afterSalesFilterType,
      afterSalesFilterIssueCategory,
      afterSalesSearchKeyword,
    } = get()
    let result = [...afterSalesRecords]
    if (afterSalesFilterStatus !== 'all') {
      result = result.filter((r) => r.status === afterSalesFilterStatus)
    }
    if (afterSalesFilterPriority !== 'all') {
      result = result.filter((r) => r.priority === afterSalesFilterPriority)
    }
    if (afterSalesFilterType !== 'all') {
      result = result.filter((r) => r.type === afterSalesFilterType)
    }
    if (afterSalesFilterIssueCategory !== 'all') {
      result = result.filter(
        (r) => r.issueCategory === afterSalesFilterIssueCategory
      )
    }
    if (afterSalesSearchKeyword) {
      const q = afterSalesSearchKeyword.toLowerCase()
      result = result.filter(
        (r) =>
          r.afterSalesNo.toLowerCase().includes(q) ||
          r.orderNo.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.issueDescription.toLowerCase().includes(q)
      )
    }
    return result
  },

  fetchWarranties: async (params) => {
    set({ warrantiesLoading: true })
    try {
      const warranties = await api.getWarranties(params)
      set({ warranties, warrantiesLoading: false })
    } catch (e) {
      console.error('Failed to fetch warranties:', e)
      set({ warrantiesLoading: false })
    }
  },

  fetchWarrantyDetail: async (id) => {
    set({ warrantiesLoading: true })
    try {
      const warranty = await api.getWarranty(id)
      set({ warrantiesLoading: false })
      return warranty
    } catch (e) {
      console.error('Failed to fetch warranty detail:', e)
      set({ warrantiesLoading: false })
    }
  },

  fetchWarrantiesByOrder: async (orderId) => {
    set({ warrantiesLoading: true })
    try {
      const warranties = await api.getWarrantiesByOrder(orderId)
      set({ warranties, warrantiesLoading: false })
    } catch (e) {
      console.error('Failed to fetch warranties by order:', e)
      set({ warrantiesLoading: false })
    }
  },

  createWarranty: async (data) => {
    try {
      const warranty = await api.createWarranty(data)
      set((state) => ({
        warranties: [warranty, ...state.warranties],
      }))
      return warranty
    } catch (e) {
      console.error('Failed to create warranty:', e)
    }
  },
}))

export { useStore }
