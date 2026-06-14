import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { PartAdmin, PartStatus, StatusHistoryRecord, ReviewPartRequest } from '@/types'
import {
  Search,
  Filter,
  Tag,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Square,
  CheckSquare2,
  Eye,
  Clock,
  User,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ListChecks,
  MessageSquare,
  Power,
  Calculator,
} from 'lucide-react'

const STATUS_OPTIONS: { value: PartStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_review', label: '待审核' },
  { value: 'active', label: '已上架' },
  { value: 'inactive', label: '已下架' },
  { value: 'rejected', label: '已驳回' },
  { value: 'draft', label: '草稿' },
]

const STATUS_BADGE: Record<PartStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-carbon-600 text-carbon-300 border-carbon-500/30' },
  pending_review: { label: '待审核', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  active: { label: '已上架', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  inactive: { label: '已下架', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  rejected: { label: '已驳回', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const STATUS_TRANSITIONS: { from: PartStatus[]; to: PartStatus; label: string; icon: React.ReactNode; className: string }[] = [
  { from: ['pending_review'], to: 'active', label: '审核通过', icon: <CheckCircle2 size={14} />, className: 'bg-green-500 hover:bg-green-600' },
  { from: ['pending_review', 'active'], to: 'rejected', label: '驳回', icon: <XCircle size={14} />, className: 'bg-red-500 hover:bg-red-600' },
  { from: ['inactive', 'rejected'], to: 'active', label: '上架', icon: <Power size={14} />, className: 'bg-green-500 hover:bg-green-600' },
  { from: ['active'], to: 'inactive', label: '下架', icon: <Power size={14} />, className: 'bg-gray-600 hover:bg-gray-700' },
  { from: ['draft'], to: 'pending_review', label: '提交审核', icon: <ArrowRight size={14} />, className: 'bg-yellow-500 hover:bg-yellow-600' },
]

export default function AdminReviewPage() {
  const { categories, fetchCategories, fetchParts } = useStore()
  const [parts, setParts] = useState<PartAdmin[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<PartStatus | 'all'>('pending_review')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterBrand, setFilterBrand] = useState<string>('')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review')
  const [historyFilterPartId, setHistoryFilterPartId] = useState<string>('')

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewingPart, setReviewingPart] = useState<PartAdmin | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewRemark, setReviewRemark] = useState('')

  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchAction, setBatchAction] = useState<PartStatus | null>(null)
  const [batchReason, setBatchReason] = useState('')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPart, setPreviewPart] = useState<PartAdmin | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchCategories(), fetchParts()])
      const [partsData, brandsData, historyData] = await Promise.all([
        api.adminGetParts(),
        api.adminGetBrands(),
        api.adminGetStatusHistory(),
      ])
      setParts(partsData)
      setBrands(brandsData)
      setStatusHistory(historyData)
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return parts.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterCategory && p.categoryId !== filterCategory) return false
      if (filterBrand && p.brand !== filterBrand) return false
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [parts, searchQuery, filterStatus, filterCategory, filterBrand])

  const filteredHistory = useMemo(() => {
    if (!historyFilterPartId) return statusHistory
    return statusHistory.filter((h) => h.partId === historyFilterPartId)
  }, [statusHistory, historyFilterPartId])

  const selectedParts = useMemo(() => {
    return parts.filter((p) => selectedIds.includes(p.id))
  }, [parts, selectedIds])

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    return cat ? cat.name : id
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
      setSelectAll(false)
    } else {
      setSelectedIds(filteredParts.map((p) => p.id))
      setSelectAll(true)
    }
  }

  const availableBatchActions = useMemo(() => {
    if (selectedParts.length === 0) return []
    const statuses = Array.from(new Set(selectedParts.map((p) => p.status)))
    return STATUS_TRANSITIONS.filter((t) => statuses.every((s) => t.from.includes(s as PartStatus)))
  }, [selectedParts])

  const openReviewModal = (part: PartAdmin, action: 'approve' | 'reject') => {
    setReviewingPart(part)
    setReviewAction(action)
    setReviewRemark('')
    setReviewModalOpen(true)
  }

  const handleSingleReview = async () => {
    if (!reviewingPart) return
    setSubmitting(true)
    try {
      const data: ReviewPartRequest = {
        status: reviewAction === 'approve' ? 'active' : 'rejected',
        reviewRemark: reviewRemark.trim() || undefined,
        reviewedBy: 'admin',
      }
      await api.adminReviewPart(reviewingPart.id, data)
      await loadData()
      setReviewModalOpen(false)
      setReviewingPart(null)
      setSelectedIds((prev) => prev.filter((id) => id !== reviewingPart.id))
    } catch (e) {
      console.error('Failed to review part:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const openBatchModal = (action: PartStatus) => {
    setBatchAction(action)
    setBatchReason('')
    setBatchModalOpen(true)
  }

  const handleBatchAction = async () => {
    if (!batchAction || selectedIds.length === 0) return
    setSubmitting(true)
    try {
      await api.adminBatchStatusChange({
        partIds: selectedIds,
        status: batchAction,
        reason: batchReason.trim() || undefined,
      })
      await loadData()
      setBatchModalOpen(false)
      setBatchAction(null)
      setSelectedIds([])
      setSelectAll(false)
    } catch (e) {
      console.error('Failed to batch change status:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const openPreview = (part: PartAdmin) => {
    setPreviewPart(part)
    setPreviewOpen(true)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('pending_review')
    setFilterCategory('')
    setFilterBrand('')
  }

  const hasTextFilters = filterCategory || filterBrand || searchQuery
  const hasActiveFilters = hasTextFilters || filterStatus !== 'all'

  const getStatusIcon = (status: PartStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={12} className="text-green-400" />
      case 'rejected':
        return <XCircle size={12} className="text-red-400" />
      case 'pending_review':
        return <AlertTriangle size={12} className="text-yellow-400" />
      default:
        return <Clock size={12} className="text-moto-steel" />
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            上下架审核
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            审核配件上架申请，管理配件上下架状态
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 bg-carbon-800 rounded-xl p-1 border border-carbon-500/20 w-fit">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'review'
              ? 'bg-moto-orange text-white shadow-lg shadow-moto-orange/20'
              : 'text-moto-steel hover:text-moto-silver'
          }`}
        >
          <CheckCircle2 size={16} />
          审核管理
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-moto-orange text-white shadow-lg shadow-moto-orange/20'
              : 'text-moto-steel hover:text-moto-silver'
          }`}
        >
          <History size={16} />
          状态历史
        </button>
      </div>

      {activeTab === 'review' ? (
        <>
          {selectedIds.length > 0 && (
            <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-5 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-moto-orange/15 flex items-center justify-center">
                    <ListChecks size={20} className="text-moto-orange" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-moto-silver">已选择 {selectedIds.length} 个配件</h3>
                    <p className="text-xs text-moto-steel mt-0.5">
                      当前状态: {Array.from(new Set(selectedParts.map((p) => STATUS_BADGE[p.status].label))).join('、')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedIds([])
                    setSelectAll(false)
                  }}
                  className="text-moto-steel hover:text-moto-silver text-sm"
                >
                  清除选择
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableBatchActions.map((action) => (
                  <button
                    key={action.to}
                    onClick={() => openBatchModal(action.to)}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${action.className}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
                {availableBatchActions.length === 0 && (
                  <p className="text-sm text-moto-steel">所选配件没有可用的批量操作</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="text-moto-steel" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索名称、品牌、SKU..."
                  className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-moto-steel hover:text-moto-silver transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[140px]">
                <Filter size={14} className="text-moto-steel" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as PartStatus | 'all')}
                  className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-carbon-800">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[140px]">
                <Filter size={14} className="text-moto-steel" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
                >
                  <option value="" className="bg-carbon-800">全部分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-carbon-800">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[140px]">
                <Tag size={14} className="text-moto-steel" />
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
                >
                  <option value="" className="bg-carbon-800">全部品牌</option>
                  {brands.map((b) => (
                    <option key={b} value={b} className="bg-carbon-800">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-moto-orange text-sm hover:text-moto-orange-light transition-colors"
                >
                  <X size={14} />
                  清除筛选
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-8 text-center">
              <Loader2 size={32} className="text-moto-orange animate-spin mx-auto" />
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
              <CheckCircle2 size={64} className="text-carbon-500 mx-auto mb-4" />
              <h2 className="font-orbitron text-moto-silver text-xl mb-2">
                {hasTextFilters
                  ? '未找到匹配的配件'
                  : filterStatus === 'pending_review'
                  ? '暂无待审核配件'
                  : '暂无配件数据'}
              </h2>
              <p className="text-moto-steel text-sm">
                {hasTextFilters
                  ? '请调整筛选条件或清除筛选'
                  : filterStatus === 'pending_review'
                  ? '所有配件已审核完成'
                  : '请先在配件管理中添加配件'}
              </p>
            </div>
          ) : (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                      <th className="w-12 px-4 py-3">
                        <button
                          onClick={toggleSelectAll}
                          className="text-moto-steel hover:text-moto-silver transition-colors"
                        >
                          {selectAll ? (
                            <CheckSquare2 size={16} className="text-moto-orange" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        配件信息
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        分类
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        价格
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        审核备注
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => {
                      const isSelected = selectedIds.includes(part.id)
                      const availableActions = STATUS_TRANSITIONS.filter((t) =>
                        t.from.includes(part.status as PartStatus)
                      )
                      return (
                        <tr
                          key={part.id}
                          className={`border-b border-carbon-500/20 last:border-b-0 hover:bg-carbon-700/30 transition-colors ${
                            isSelected ? 'bg-moto-orange/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleSelect(part.id)}
                              className="text-moto-steel hover:text-moto-silver transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare2 size={16} className="text-moto-orange" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={part.image}
                                alt={part.name}
                                className="w-10 h-10 rounded-lg object-cover bg-carbon-700 border border-carbon-500/20"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm text-moto-silver font-medium truncate">
                                  {part.name}
                                </p>
                                <p className="text-xs text-moto-steel font-mono">
                                  {part.sku} · {part.brand}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-moto-steel">{getCategoryName(part.categoryId)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-moto-orange font-mono font-medium">
                              ¥{part.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${STATUS_BADGE[part.status].className}`}
                            >
                              {getStatusIcon(part.status)}
                              {STATUS_BADGE[part.status].label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[200px]">
                              {part.reviewRemark ? (
                                <div className="flex items-start gap-1.5">
                                  <MessageSquare size={12} className="text-moto-steel shrink-0 mt-0.5" />
                                  <p className="text-xs text-moto-steel truncate">{part.reviewRemark}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-carbon-500">-</span>
                              )}
                              {part.reviewedBy && (
                                <p className="text-[10px] text-carbon-500 mt-1">
                                  {part.reviewedBy} · {part.reviewedAt ? new Date(part.reviewedAt).toLocaleDateString('zh-CN') : ''}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openPreview(part)}
                                className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                                title="查看详情"
                              >
                                <Eye size={14} />
                              </button>
                              {availableActions.map((action) => (
                                <button
                                  key={action.to}
                                  onClick={() => {
                                    if (action.to === 'active' && part.status === 'pending_review') {
                                      openReviewModal(part, 'approve')
                                    } else if (action.to === 'rejected') {
                                      openReviewModal(part, 'reject')
                                    } else {
                                      setSelectedIds([part.id])
                                      openBatchModal(action.to)
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    action.to === 'active' || action.to === 'pending_review'
                                      ? 'text-green-400 hover:bg-green-500/10'
                                      : action.to === 'rejected'
                                      ? 'text-red-400 hover:bg-red-500/10'
                                      : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
                                  }`}
                                  title={action.label}
                                >
                                  {action.icon}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-carbon-500/20 flex items-center justify-between">
                <p className="text-xs text-moto-steel">
                  显示 <span className="font-orbitron text-moto-silver">{filteredParts.length}</span> 条
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
          <div className="p-4 border-b border-carbon-500/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[200px]">
                <Filter size={14} className="text-moto-steel" />
                <select
                  value={historyFilterPartId}
                  onChange={(e) => setHistoryFilterPartId(e.target.value)}
                  className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
                >
                  <option value="" className="bg-carbon-800">全部配件</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-carbon-800">
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="text-moto-orange animate-spin mx-auto" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <History size={64} className="text-carbon-500 mx-auto mb-4" />
              <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无状态变更记录</h2>
              <p className="text-moto-steel text-sm">配件状态变更后将在此处显示历史记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      配件名称
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      原状态
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      新状态
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      操作人
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      变更时间
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      原因
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-carbon-500/20 last:border-b-0 hover:bg-carbon-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-moto-steel" />
                          <div>
                            <p className="text-sm text-moto-silver font-medium">{record.partName}</p>
                            <p className="text-xs text-moto-steel font-mono">{record.partId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${STATUS_BADGE[record.oldStatus].className}`}
                        >
                          {STATUS_BADGE[record.oldStatus].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${STATUS_BADGE[record.newStatus].className}`}
                          >
                            {STATUS_BADGE[record.newStatus].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-moto-silver">
                          <User size={14} className="text-moto-steel" />
                          {record.changedBy}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-moto-steel">
                          <Clock size={14} className="text-moto-steel" />
                          {new Date(record.changedAt).toLocaleString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-moto-steel">
                          {record.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reviewModalOpen && reviewingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewModalOpen(false)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  reviewAction === 'approve' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                {reviewAction === 'approve' ? (
                  <CheckCircle2 size={20} className="text-green-400" />
                ) : (
                  <XCircle size={20} className="text-red-400" />
                )}
              </div>
              <div>
                <h3 className="font-orbitron text-moto-silver text-lg">
                  {reviewAction === 'approve' ? '审核通过' : '驳回申请'}
                </h3>
                <p className="text-xs text-moto-steel mt-0.5">
                  配件: {reviewingPart.name}
                </p>
              </div>
            </div>

            <div className="bg-carbon-700/50 rounded-lg p-4 mb-5 border border-carbon-500/20">
              <div className="flex items-center gap-3">
                <img
                  src={reviewingPart.image}
                  alt={reviewingPart.name}
                  className="w-12 h-12 rounded-lg object-cover bg-carbon-700 border border-carbon-500/20"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
                  }}
                />
                <div>
                  <p className="text-sm text-moto-silver font-medium">{reviewingPart.name}</p>
                  <p className="text-xs text-moto-steel font-mono">{reviewingPart.sku}</p>
                  <p className="text-sm text-moto-orange font-mono mt-1">
                    ¥{reviewingPart.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-moto-steel mb-1.5">
                <MessageSquare size={10} className="inline mr-1" />
                审核备注 {reviewAction === 'reject' && <span className="text-red-400">*</span>}
              </label>
              <textarea
                value={reviewRemark}
                onChange={(e) => setReviewRemark(e.target.value)}
                placeholder={reviewAction === 'approve' ? '请输入审核通过备注（可选）' : '请输入驳回原因'}
                rows={3}
                className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSingleReview}
                disabled={submitting || (reviewAction === 'reject' && !reviewRemark.trim())}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm transition-colors disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : reviewAction === 'approve' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                确认{reviewAction === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {batchModalOpen && batchAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBatchModalOpen(false)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-moto-orange/10 flex items-center justify-center shrink-0">
                <ListChecks size={20} className="text-moto-orange" />
              </div>
              <div>
                <h3 className="font-orbitron text-moto-silver text-lg">批量操作确认</h3>
                <p className="text-xs text-moto-steel mt-0.5">
                  将对 {selectedIds.length} 个配件执行操作
                </p>
              </div>
            </div>

            <div className="bg-carbon-700/50 rounded-lg p-4 mb-5 border border-carbon-500/20">
              <p className="text-sm text-moto-silver mb-2">
                即将将以下配件状态变更为：
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${STATUS_BADGE[batchAction].className}`}
              >
                {STATUS_BADGE[batchAction].label}
              </span>
              <div className="mt-3 max-h-24 overflow-y-auto space-y-1">
                {selectedParts.slice(0, 5).map((p) => (
                  <p key={p.id} className="text-xs text-moto-steel truncate">
                    • {p.name} ({p.sku})
                  </p>
                ))}
                {selectedParts.length > 5 && (
                  <p className="text-xs text-moto-steel">
                    ...还有 {selectedParts.length - 5} 个配件
                  </p>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-moto-steel mb-1.5">
                <MessageSquare size={10} className="inline mr-1" />
                操作原因（可选）
              </label>
              <textarea
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
                placeholder="请输入操作原因..."
                rows={3}
                className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBatchAction}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && previewPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h2 className="font-orbitron text-lg text-moto-silver">配件详情</h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-64px)]">
              <div className="flex gap-6 mb-6">
                <img
                  src={previewPart.image}
                  alt={previewPart.name}
                  className="w-32 h-32 rounded-xl object-cover bg-carbon-700 border border-carbon-500/20 flex-shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="14">No Image</text></svg>'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-orbitron text-xl text-moto-silver mb-2">{previewPart.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-carbon-700 text-moto-steel text-xs rounded">
                      {previewPart.brand}
                    </span>
                    <span className="px-2 py-0.5 bg-carbon-700 text-moto-steel text-xs rounded font-mono">
                      {previewPart.sku}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${STATUS_BADGE[previewPart.status].className}`}
                    >
                      {STATUS_BADGE[previewPart.status].label}
                    </span>
                  </div>
                  <p className="text-2xl text-moto-orange font-bold">
                    ¥{previewPart.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-carbon-700/50 rounded-lg p-4">
                  <p className="text-xs text-moto-steel mb-1">库存</p>
                  <p className="text-moto-silver font-mono">{previewPart.stock}</p>
                </div>
                <div className="bg-carbon-700/50 rounded-lg p-4">
                  <p className="text-xs text-moto-steel mb-1">分类</p>
                  <p className="text-moto-silver">{getCategoryName(previewPart.categoryId)}</p>
                </div>
                {previewPart.originalPrice && (
                  <div className="bg-carbon-700/50 rounded-lg p-4">
                    <p className="text-xs text-moto-steel mb-1">原价</p>
                    <p className="text-moto-silver line-through">¥{previewPart.originalPrice.toLocaleString()}</p>
                  </div>
                )}
                {previewPart.costPrice && (
                  <div className="bg-carbon-700/50 rounded-lg p-4">
                    <p className="text-xs text-moto-steel mb-1">成本</p>
                    <p className="text-moto-silver">¥{previewPart.costPrice.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <p className="text-xs text-moto-steel mb-2">描述</p>
                <p className="text-sm text-moto-silver">{previewPart.description}</p>
              </div>

              {Object.keys(previewPart.specs).length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-moto-steel mb-2">规格参数</p>
                  <div className="bg-carbon-700/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {Object.entries(previewPart.specs).map(([key, value], i) => (
                          <tr key={key} className={i > 0 ? 'border-t border-carbon-500/20' : ''}>
                            <td className="px-4 py-2 text-xs text-moto-steel w-32">{key}</td>
                            <td className="px-4 py-2 text-sm text-moto-silver">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {previewPart.reviewRemark && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-400 font-medium mb-1">审核备注</p>
                      <p className="text-xs text-yellow-300/80">{previewPart.reviewRemark}</p>
                      {previewPart.reviewedBy && (
                        <p className="text-[10px] text-yellow-300/60 mt-2">
                          由 {previewPart.reviewedBy} 于{' '}
                          {previewPart.reviewedAt
                            ? new Date(previewPart.reviewedAt).toLocaleString('zh-CN')
                            : ''}{' '}
                          审核
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}