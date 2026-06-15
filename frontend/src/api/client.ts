import type { Category, Part, Selection, SelectionItem, SelectionVersion, CompatibilityCheckResult, CompatibilityConflict, Share, CreateShareRequest, UpdateShareRequest, Order, CreateOrderRequest, UpdateOrderStatusRequest, AddAfterSaleNoteRequest, AfterSaleNote, PartAdmin, CreatePartRequest, UpdatePartRequest, ReviewPartRequest, BatchPriceAdjustRequest, BatchStatusRequest, CreateCategoryRequest, UpdateCategoryRequest, PriceHistoryRecord, StatusHistoryRecord, CompatibilityRelation, PartStatus, Template, TemplateCategory, TemplateCompatibilityResult, CreateTemplateRequest, UpdateTemplateRequest, BatchPublishRequest, BatchUpdateStatusRequest, ApplyTemplateResult, TemplateFavorite, InventoryInfo, StockReservationResult, StockAlert, SubstitutePart, PurchaseOrder, CreatePurchaseOrderRequest, PurchaseOrderStatus, Quote, QuotePlan, QuoteStatus, DiscountRule, DiscountResult, PlanComparisonResult, CreateQuoteRequest, UpdateQuoteRequest, CreateQuotePlanRequest, UpdateQuotePlanRequest, SubmitApprovalRequest, ProcessApprovalRequest, CustomerConfirmRequest, ExportQuoteRequest, CreateDiscountRuleRequest, UpdateDiscountRuleRequest, CalculateDiscountRequest, User, UserProfile, RegisterRequest, LoginRequest, AuthResponse, UpdateUserProfileRequest, ChangePasswordRequest, UserFavoritePart, UserBrowsingHistory, ModificationArchive, CreateModificationArchiveRequest, UpdateModificationArchiveRequest, SharedResource, Collaborator, InviteCollaboratorRequest, UpdateCollaboratorPermissionRequest, UserStats, Customer, CustomerVehicle, CreateCustomerRequest, UpdateCustomerRequest, RequirementRecord, CreateRequirementRequest, UpdateRequirementRequest, ConstructionSchedule, CreateConstructionScheduleRequest, UpdateConstructionScheduleRequest, UpdateConstructionTaskRequest, ReceptionSelection, CreateReceptionSelectionRequest, CreateScheduleFromQuoteRequest, QuoteItem, PartReview, ReviewStats, PartIssue, PartWarning, CreatePartReviewRequest, ProcessReviewRequest, CreateIssueRequest, UpdateIssueStatusRequest, AcknowledgeWarningRequest } from '@/types'

const BASE = ''

function getAuthToken(): string | null {
  return localStorage.getItem('xcf-auth-token')
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(BASE + url, {
    headers,
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

  adminCreateCategory: (data: CreateCategoryRequest) =>
    fetchJSON<Category>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateCategory: (id: string, data: UpdateCategoryRequest) =>
    fetchJSON<Category>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteCategory: (id: string) =>
    fetchJSON<Category>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  adminGetParts: (params?: { category?: string; status?: PartStatus; keyword?: string; brand?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('admin', '1')
    if (params?.category) searchParams.set('category', params.category)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    if (params?.brand) searchParams.set('brand', params.brand)
    const qs = searchParams.toString()
    return fetchJSON<PartAdmin[]>(`/api/parts${qs ? `?${qs}` : ''}`)
  },

  adminCreatePart: (data: CreatePartRequest) =>
    fetchJSON<PartAdmin>('/api/admin/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdatePart: (id: string, data: UpdatePartRequest) =>
    fetchJSON<PartAdmin>(`/api/admin/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeletePart: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/admin/parts/${id}`, {
      method: 'DELETE',
    }),

  adminReviewPart: (id: string, data: ReviewPartRequest) =>
    fetchJSON<PartAdmin>(`/api/admin/parts/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminBatchPriceAdjust: (data: BatchPriceAdjustRequest) =>
    fetchJSON<{ success: boolean; updatedCount: number; updated: PartAdmin[] }>('/api/admin/parts/batch-price', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminBatchStatusChange: (data: BatchStatusRequest) =>
    fetchJSON<{ success: boolean; updatedCount: number; updated: PartAdmin[] }>('/api/admin/parts/batch-status', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminGetPriceHistory: (partId?: string) => {
    const qs = partId ? `?partId=${partId}` : ''
    return fetchJSON<PriceHistoryRecord[]>(`/api/admin/price-history${qs}`)
  },

  adminGetStatusHistory: (partId?: string) => {
    const qs = partId ? `?partId=${partId}` : ''
    return fetchJSON<StatusHistoryRecord[]>(`/api/admin/status-history${qs}`)
  },

  adminGetCompatibilityRelations: () =>
    fetchJSON<CompatibilityRelation[]>('/api/admin/compatibility-relations'),

  adminCreateCompatibilityRelation: (data: { partIdA: string; partIdB: string; type: 'compatible' | 'conflict'; severity?: 'warning' | 'error'; remark?: string }) =>
    fetchJSON<CompatibilityRelation>('/api/admin/compatibility-relations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminDeleteCompatibilityRelation: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/admin/compatibility-relations/${id}`, {
      method: 'DELETE',
    }),

  adminGetBrands: () =>
    fetchJSON<string[]>('/api/admin/brands'),

  getTemplates: (params?: {
    category?: string
    status?: string
    modelId?: string
    keyword?: string
    isHot?: boolean
    isRecommended?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.modelId) searchParams.set('modelId', params.modelId)
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    if (params?.isHot) searchParams.set('isHot', 'true')
    if (params?.isRecommended) searchParams.set('isRecommended', 'true')
    const qs = searchParams.toString()
    return fetchJSON<{
      templates: Template[]
      categories: TemplateCategory[]
      favorites: TemplateFavorite[]
    }>(`/api/templates${qs ? `?${qs}` : ''}`)
  },

  getTemplate: (id: string) =>
    fetchJSON<Template>(`/api/templates/${id}`),

  createTemplate: (data: CreateTemplateRequest) =>
    fetchJSON<Template>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: UpdateTemplateRequest) =>
    fetchJSON<Template>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    fetchJSON<Template>(`/api/templates/${id}`, { method: 'DELETE' }),

  batchPublishTemplates: (data: BatchPublishRequest) =>
    fetchJSON<{ success: boolean; publishedCount: number; published: Template[] }>(
      '/api/templates/batch-publish',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  batchUpdateTemplateStatus: (data: BatchUpdateStatusRequest) =>
    fetchJSON<{ success: boolean; updatedCount: number; updated: Template[] }>(
      '/api/templates/batch-status',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  checkTemplateCompatibility: (templateId: string) =>
    fetchJSON<TemplateCompatibilityResult>(`/api/templates/${templateId}/check-compatibility`, {
      method: 'POST',
    }),

  applyTemplate: (templateId: string) =>
    fetchJSON<ApplyTemplateResult>(`/api/templates/${templateId}/apply`, {
      method: 'POST',
    }),

  combineTemplates: (templateIds: string[]) =>
    fetchJSON<{
      templates: { id: string; name: string }[]
      combinedItems: SelectionItem[]
      conflicts: CompatibilityConflict[]
      warnings: CompatibilityConflict[]
      totalPrice: number
      totalLaborFee: number
      grandTotal: number
      isValid: boolean
    }>(`/api/templates/combine?templateIds=${templateIds.join(',')}`),

  toggleTemplateFavorite: (templateId: string) =>
    fetchJSON<{ favorited: boolean; favoriteCount: number }>(
      `/api/templates/${templateId}/favorite`,
      { method: 'POST' }
    ),

  getFavoriteTemplates: () =>
    fetchJSON<Template[]>('/api/templates/favorites/list'),

  getInventoryOverview: () =>
    fetchJSON<{
      totalParts: number
      outOfStockCount: number
      lowStockCount: number
      inStockCount: number
      totalReserved: number
      unreadAlerts: number
      inventory: Record<string, InventoryInfo>
    }>('/api/inventory/overview'),

  getInventoryPartInfo: (partId: string) =>
    fetchJSON<InventoryInfo>(`/api/inventory/part/${partId}`),

  getInventoryBatchInfo: (partIds: string[]) =>
    fetchJSON<Record<string, InventoryInfo>>(`/api/inventory/batch-info?partIds=${partIds.join(',')}`),

  reserveInventory: (selectionId: string, items: { partId: string; quantity: number }[]) =>
    fetchJSON<StockReservationResult>('/api/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({ selectionId, items }),
    }),

  releaseInventory: (selectionId: string, partIds?: string[]) =>
    fetchJSON<{ success: boolean; releasedCount: number }>('/api/inventory/release', {
      method: 'POST',
      body: JSON.stringify({ selectionId, partIds }),
    }),

  consumeInventory: (selectionId: string) =>
    fetchJSON<{ success: boolean; consumedCount: number }>('/api/inventory/consume', {
      method: 'POST',
      body: JSON.stringify({ selectionId }),
    }),

  getStockAlerts: (params?: { unread?: boolean; alertType?: 'out_of_stock' | 'low_stock' }) => {
    const searchParams = new URLSearchParams()
    if (params?.unread) searchParams.set('unread', 'true')
    if (params?.alertType) searchParams.set('alertType', params.alertType)
    const qs = searchParams.toString()
    return fetchJSON<StockAlert[]>(`/api/inventory/alerts${qs ? `?${qs}` : ''}`)
  },

  markAlertRead: (alertId: string) =>
    fetchJSON<StockAlert>(`/api/inventory/alerts/${alertId}/read`, {
      method: 'PUT',
    }),

  markAllAlertsRead: () =>
    fetchJSON<{ success: boolean; count: number }>('/api/inventory/alerts/read-all', {
      method: 'PUT',
    }),

  getSubstitutes: (partId: string) =>
    fetchJSON<SubstitutePart[]>(`/api/inventory/substitutes/${partId}`),

  getPurchaseOrders: (params?: { status?: PurchaseOrderStatus }) => {
    const qs = params?.status ? `?status=${params.status}` : ''
    return fetchJSON<PurchaseOrder[]>(`/api/inventory/purchase-orders${qs}`)
  },

  createPurchaseOrder: (data: CreatePurchaseOrderRequest) =>
    fetchJSON<PurchaseOrder>('/api/inventory/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) =>
    fetchJSON<PurchaseOrder>(`/api/inventory/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) =>
    fetchJSON<PurchaseOrder>(`/api/inventory/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePurchaseOrder: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/inventory/purchase-orders/${id}`, {
      method: 'DELETE',
    }),

  getQuotes: (params?: { status?: QuoteStatus; customerName?: string; modelId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.customerName) searchParams.set('customerName', params.customerName)
    if (params?.modelId) searchParams.set('modelId', params.modelId)
    const qs = searchParams.toString()
    return fetchJSON<Quote[]>(`/api/quotes${qs ? `?${qs}` : ''}`)
  },

  getQuote: (id: string) =>
    fetchJSON<Quote>(`/api/quotes/${id}`),

  createQuote: (data: CreateQuoteRequest) =>
    fetchJSON<Quote>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuote: (id: string, data: UpdateQuoteRequest) =>
    fetchJSON<Quote>(`/api/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteQuote: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/quotes/${id}`, {
      method: 'DELETE',
    }),

  createQuotePlan: (quoteId: string, data: CreateQuotePlanRequest) =>
    fetchJSON<QuotePlan>(`/api/quotes/${quoteId}/plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuotePlan: (quoteId: string, planId: string, data: UpdateQuotePlanRequest) =>
    fetchJSON<QuotePlan>(`/api/quotes/${quoteId}/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteQuotePlan: (quoteId: string, planId: string) =>
    fetchJSON<{ success: boolean }>(`/api/quotes/${quoteId}/plans/${planId}`, {
      method: 'DELETE',
    }),

  compareQuotePlans: (quoteId: string, planA: string, planB: string) =>
    fetchJSON<PlanComparisonResult>(
      `/api/quotes/${quoteId}/compare?planA=${planA}&planB=${planB}`
    ),

  submitQuoteApproval: (quoteId: string, data: SubmitApprovalRequest) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/submit-approval`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processQuoteApproval: (quoteId: string, nodeId: string, data: ProcessApprovalRequest) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/approval/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  sendQuoteToCustomer: (quoteId: string) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/send-to-customer`, {
      method: 'POST',
    }),

  customerConfirmQuote: (quoteId: string, data: CustomerConfirmRequest) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/customer-confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  customerRejectQuote: (quoteId: string, data: { confirmedBy: string; contactInfo: string; note?: string }) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/customer-reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  exportQuote: (quoteId: string, data: ExportQuoteRequest) =>
    fetchJSON<{ success: boolean; quote: Quote; plan: QuotePlan; exportRecord: any }>(
      `/api/quotes/${quoteId}/export`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  convertQuoteToOrder: (quoteId: string, orderId?: string) =>
    fetchJSON<Quote>(`/api/quotes/${quoteId}/convert`, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  getDiscountRules: (params?: { isActive?: boolean }) => {
    const qs = params?.isActive !== undefined ? `?isActive=${params.isActive}` : ''
    return fetchJSON<DiscountRule[]>(`/api/discount-rules${qs}`)
  },

  createDiscountRule: (data: CreateDiscountRuleRequest) =>
    fetchJSON<DiscountRule>('/api/discount-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDiscountRule: (id: string, data: UpdateDiscountRuleRequest) =>
    fetchJSON<DiscountRule>(`/api/discount-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDiscountRule: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/discount-rules/${id}`, {
      method: 'DELETE',
    }),

  calculateDiscount: (data: CalculateDiscountRequest) =>
    fetchJSON<{ results: DiscountResult[]; totalDiscount: number; finalAmount: number }>(
      '/api/discount-rules/calculate',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  applyDiscountToPlan: (quoteId: string, planId: string) =>
    fetchJSON<{
      success: boolean
      plan: QuotePlan
      appliedRules: DiscountResult[]
      totalDiscount: number
      totalAmount: number
    }>(`/api/quotes/${quoteId}/plans/${planId}/apply-discount`, {
      method: 'POST',
    }),

  async downloadQuoteFile(type: 'pdf' | 'excel', quoteId: string, planId?: string, exportedBy?: string): Promise<void> {
    const params = new URLSearchParams()
    if (planId) params.set('planId', planId)
    if (exportedBy) params.set('exportedBy', exportedBy)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const url = BASE + `/api/quotes/${quoteId}/export/${type}${qs}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Export Error: ${res.status}`)
    const contentDisposition = res.headers.get('Content-Disposition') || ''
    const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/i)
    const blob = await res.blob()
    const link = document.createElement('a')
    const objectURL = URL.createObjectURL(blob)
    link.href = objectURL
    const extension = type === 'excel' ? 'csv' : 'pdf'
    const defaultName = `报价单-${Date.now()}.${extension}`
    const rawName = fileNameMatch ? decodeURIComponent(fileNameMatch[1]) : defaultName
    const safeName = rawName.endsWith(`.html`) && type === 'pdf' ? rawName.replace(/\.html$/, '.pdf') : rawName
    link.download = safeName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000)
  },

  register: (data: RegisterRequest) =>
    fetchJSON<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    fetchJSON<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchJSON<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    fetchJSON<{ user: User; profile: UserProfile | null }>('/api/user/me'),

  updateUserProfile: (data: UpdateUserProfileRequest) =>
    fetchJSON<{ user: User; profile: UserProfile }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordRequest) =>
    fetchJSON<{ success: boolean }>('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getFavorites: (type?: 'part' | 'template' | 'selection') => {
    const qs = type ? `?type=${type}` : ''
    return fetchJSON<(UserFavoritePart & { detail: any })[]>(`/api/user/favorites${qs}`)
  },

  addFavorite: (data: { targetType: 'part' | 'template' | 'selection'; targetId: string; targetName?: string }) =>
    fetchJSON<UserFavoritePart & { favorited: boolean }>('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeFavorite: (id: string) =>
    fetchJSON<UserFavoritePart & { favorited: boolean }>(`/api/user/favorites/${id}`, {
      method: 'DELETE',
    }),

  checkFavorite: (data: { targetType: 'part' | 'template' | 'selection'; targetId: string }) =>
    fetchJSON<{ favorited: boolean; id: string | null }>('/api/user/favorites/check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBrowsingHistory: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : ''
    return fetchJSON<(UserBrowsingHistory & { detail: any })[]>(`/api/user/history${qs}`)
  },

  addBrowsingHistory: (data: { targetType: 'part' | 'template' | 'selection'; targetId: string; targetName?: string; targetImage?: string; duration?: number }) =>
    fetchJSON<UserBrowsingHistory>('/api/user/history', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeBrowsingHistory: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/user/history/${id}`, {
      method: 'DELETE',
    }),

  clearBrowsingHistory: () =>
    fetchJSON<{ success: boolean }>('/api/user/history', {
      method: 'DELETE',
    }),

  getArchives: (status?: 'draft' | 'published' | 'archived') => {
    const qs = status ? `?status=${status}` : ''
    return fetchJSON<ModificationArchive[]>(`/api/user/archives${qs}`)
  },

  getArchive: (id: string) =>
    fetchJSON<ModificationArchive>(`/api/user/archives/${id}`),

  createArchive: (data: CreateModificationArchiveRequest) =>
    fetchJSON<ModificationArchive>('/api/user/archives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArchive: (id: string, data: UpdateModificationArchiveRequest) =>
    fetchJSON<ModificationArchive>(`/api/user/archives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArchive: (id: string) =>
    fetchJSON<ModificationArchive>(`/api/user/archives/${id}`, {
      method: 'DELETE',
    }),

  likeArchive: (id: string) =>
    fetchJSON<{ likes: number }>(`/api/user/archives/${id}/like`, {
      method: 'POST',
    }),

  getSharedResources: () =>
    fetchJSON<{ owned: SharedResource[]; collaborated: SharedResource[] }>('/api/user/shared'),

  getSharedResource: (id: string) =>
    fetchJSON<SharedResource>(`/api/user/shared/${id}`),

  createSharedResource: (data: { resourceType: 'selection' | 'archive'; resourceId: string; resourceName: string }) =>
    fetchJSON<SharedResource>('/api/user/shared', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  inviteCollaborator: (sharedId: string, data: InviteCollaboratorRequest) =>
    fetchJSON<Collaborator>(`/api/user/shared/${sharedId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCollaboratorPermission: (sharedId: string, userId: string, data: UpdateCollaboratorPermissionRequest) =>
    fetchJSON<Collaborator>(`/api/user/shared/${sharedId}/collaborators/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removeCollaborator: (sharedId: string, userId: string) =>
    fetchJSON<Collaborator>(`/api/user/shared/${sharedId}/collaborators/${userId}`, {
      method: 'DELETE',
    }),

  getUserStats: () =>
    fetchJSON<UserStats>('/api/user/stats'),

  getCustomers: (params?: { keyword?: string; level?: string; source?: string; phone?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    if (params?.level) searchParams.set('level', params.level)
    if (params?.source) searchParams.set('source', params.source)
    if (params?.phone) searchParams.set('phone', params.phone)
    const qs = searchParams.toString()
    return fetchJSON<Customer[]>(`/api/customers${qs ? `?${qs}` : ''}`)
  },

  getCustomer: (id: string) =>
    fetchJSON<Customer>(`/api/customers/${id}`),

  createCustomer: (data: CreateCustomerRequest) =>
    fetchJSON<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: UpdateCustomerRequest) =>
    fetchJSON<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/customers/${id}`, { method: 'DELETE' }),

  addCustomerVehicle: (customerId: string, data: Omit<CustomerVehicle, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) =>
    fetchJSON<CustomerVehicle>(`/api/customers/${customerId}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomerVehicle: (customerId: string, vehicleId: string, data: Partial<CustomerVehicle>) =>
    fetchJSON<CustomerVehicle>(`/api/customers/${customerId}/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomerVehicle: (customerId: string, vehicleId: string) =>
    fetchJSON<{ success: boolean }>(`/api/customers/${customerId}/vehicles/${vehicleId}`, { method: 'DELETE' }),

  getRequirements: (params?: { customerId?: string; status?: string; vehicleId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.customerId) searchParams.set('customerId', params.customerId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.vehicleId) searchParams.set('vehicleId', params.vehicleId)
    const qs = searchParams.toString()
    return fetchJSON<RequirementRecord[]>(`/api/requirements${qs ? `?${qs}` : ''}`)
  },

  getRequirement: (id: string) =>
    fetchJSON<RequirementRecord>(`/api/requirements/${id}`),

  createRequirement: (data: CreateRequirementRequest) =>
    fetchJSON<RequirementRecord>('/api/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRequirement: (id: string, data: UpdateRequirementRequest) =>
    fetchJSON<RequirementRecord>(`/api/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRequirement: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/requirements/${id}`, { method: 'DELETE' }),

  getSchedules: (params?: { customerId?: string; status?: string; date?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.customerId) searchParams.set('customerId', params.customerId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.date) searchParams.set('date', params.date)
    const qs = searchParams.toString()
    return fetchJSON<ConstructionSchedule[]>(`/api/schedules${qs ? `?${qs}` : ''}`)
  },

  getSchedule: (id: string) =>
    fetchJSON<ConstructionSchedule>(`/api/schedules/${id}`),

  createSchedule: (data: CreateConstructionScheduleRequest) =>
    fetchJSON<ConstructionSchedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSchedule: (id: string, data: UpdateConstructionScheduleRequest) =>
    fetchJSON<ConstructionSchedule>(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSchedule: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/schedules/${id}`, { method: 'DELETE' }),

  updateScheduleTask: (scheduleId: string, taskId: string, data: UpdateConstructionTaskRequest) =>
    fetchJSON<ConstructionSchedule>(`/api/schedules/${scheduleId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createReceptionSelection: (data: CreateReceptionSelectionRequest) =>
    fetchJSON<ReceptionSelection>('/api/reception/selections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateReceptionSelection: (id: string, data: Partial<CreateReceptionSelectionRequest>) =>
    fetchJSON<ReceptionSelection>(`/api/reception/selections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getReceptionSelection: (id: string) =>
    fetchJSON<ReceptionSelection>(`/api/reception/selections/${id}`),

  getReceptionSelectionsByCustomer: (customerId: string) =>
    fetchJSON<ReceptionSelection[]>(`/api/reception/selections?customerId=${customerId}`),

  createQuoteFromSelection: (selectionId: string, data?: Partial<CreateQuoteRequest>) =>
    fetchJSON<Quote>(`/api/reception/selections/${selectionId}/create-quote`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  createQuoteFromRequirements: (data: CreateQuoteRequest) =>
    fetchJSON<Quote>('/api/reception/create-quote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuoteFull: (id: string, data: UpdateQuoteRequest & {
    plans?: QuotePlan[]
    discountRate?: number
    taxRate?: number
    depositRatio?: number
    items?: QuoteItem[]
  }) =>
    fetchJSON<Quote>(`/api/reception/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createScheduleFromQuote: (data: CreateScheduleFromQuoteRequest) =>
    fetchJSON<ConstructionSchedule>('/api/reception/quotes/create-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getQuoteWithDetails: (id: string) =>
    fetchJSON<Quote & { customer?: Customer; requirement?: RequirementRecord; schedule?: ConstructionSchedule }>(
      `/api/reception/quotes/${id}/details`
    ),

  getQuotesByCustomer: (customerId: string) =>
    fetchJSON<Quote[]>(`/api/reception/quotes?customerId=${customerId}`),

  getPartReviews: (partId: string, params?: { status?: string; page?: number; pageSize?: number; sortBy?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    const qs = searchParams.toString()
    return fetchJSON<{ reviews: PartReview[]; total: number; page: number; pageSize: number; stats: ReviewStats }>(
      `/api/reviews/parts/${partId}${qs ? `?${qs}` : ''}`
    )
  },

  getReviewStats: (partId: string) =>
    fetchJSON<ReviewStats>(`/api/reviews/stats/${partId}`),

  createReview: (data: CreatePartReviewRequest) =>
    fetchJSON<PartReview>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markReviewHelpful: (reviewId: string, userId?: string) =>
    fetchJSON<{ helpful: boolean; helpfulCount: number }>(`/api/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getAdminReviews: (params?: { status?: string; partId?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.partId) searchParams.set('partId', params.partId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    const qs = searchParams.toString()
    return fetchJSON<{ reviews: PartReview[]; total: number; page: number; pageSize: number }>(
      `/api/reviews/admin/list${qs ? `?${qs}` : ''}`
    )
  },

  processReview: (reviewId: string, data: ProcessReviewRequest) =>
    fetchJSON<PartReview>(`/api/reviews/admin/${reviewId}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getIssues: (params?: { status?: string; priority?: string; partId?: string; category?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.priority) searchParams.set('priority', params.priority)
    if (params?.partId) searchParams.set('partId', params.partId)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    const qs = searchParams.toString()
    return fetchJSON<{ issues: PartIssue[]; total: number; page: number; pageSize: number }>(
      `/api/reviews/issues${qs ? `?${qs}` : ''}`
    )
  },

  createIssue: (data: CreateIssueRequest) =>
    fetchJSON<PartIssue>('/api/reviews/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIssueStatus: (issueId: string, data: UpdateIssueStatusRequest) =>
    fetchJSON<PartIssue>(`/api/reviews/issues/${issueId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getWarnings: (params?: { isActive?: boolean; warningLevel?: string; partId?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params?.warningLevel) searchParams.set('warningLevel', params.warningLevel)
    if (params?.partId) searchParams.set('partId', params.partId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    const qs = searchParams.toString()
    return fetchJSON<{ warnings: PartWarning[]; total: number; page: number; pageSize: number; summary: { total: number; active: number; danger: number; warning: number; unacknowledged: number } }>(
      `/api/reviews/warnings${qs ? `?${qs}` : ''}`
    )
  },

  acknowledgeWarning: (warningId: string, data: AcknowledgeWarningRequest) =>
    fetchJSON<PartWarning>(`/api/reviews/warnings/${warningId}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWarning: (warningId: string) =>
    fetchJSON<{ success: boolean; removed: PartWarning }>(`/api/reviews/warnings/${warningId}`, {
      method: 'DELETE',
    }),
}
