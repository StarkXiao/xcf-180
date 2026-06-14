import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { PartAdmin, PriceHistoryRecord, PartStatus } from '@/types'
import {
  Search,
  Filter,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Square,
  CheckSquare2,
  Calculator,
  Clock,
  User,
  FileText,
  ListChecks,
} from 'lucide-react'

const STATUS_BADGE: Record<PartStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-carbon-600 text-carbon-300 border-carbon-500/30' },
  pending_review: { label: '待审核', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  active: { label: '已上架', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  inactive: { label: '已下架', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  rejected: { label: '已驳回', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export default function AdminPricePage() {
  const { categories, fetchCategories, allParts, fetchParts } = useStore()
  const [parts, setParts] = useState<PartAdmin[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterBrand, setFilterBrand] = useState<string>('')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [adjustType, setAdjustType] = useState<'fixed' | 'percent'>('fixed')
  const [adjustValue, setAdjustValue] = useState<number | ''>('')
  const [adjustReason, setAdjustReason] = useState('')

  const [activeTab, setActiveTab] = useState<'adjust' | 'history'>('adjust')
  const [historyFilterPartId, setHistoryFilterPartId] = useState<string>('')

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
        api.adminGetPriceHistory(),
      ])
      setParts(partsData)
      setBrands(brandsData)
      setPriceHistory(historyData)
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return parts.filter((p) => {
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
  }, [parts, searchQuery, filterCategory, filterBrand])

  const filteredHistory = useMemo(() => {
    if (!historyFilterPartId) return priceHistory
    return priceHistory.filter((h) => h.partId === historyFilterPartId)
  }, [priceHistory, historyFilterPartId])

  const selectedParts = useMemo(() => {
    return parts.filter((p) => selectedIds.includes(p.id))
  }, [parts, selectedIds])

  const previewAdjustment = useMemo(() => {
    if (adjustValue === '' || selectedParts.length === 0) return null
    const value = Number(adjustValue)
    return selectedParts.map((p) => {
      let newPrice: number
      if (adjustType === 'fixed') {
        newPrice = Math.max(0, p.price + value)
      } else {
        newPrice = Math.max(0, Math.round(p.price * (1 + value / 100)))
      }
      return {
        ...p,
        newPrice,
        diff: newPrice - p.price,
        diffPercent: p.price > 0 ? ((newPrice - p.price) / p.price) * 100 : 0,
      }
    })
  }, [selectedParts, adjustType, adjustValue])

  const totalCurrentPrice = useMemo(() => {
    return selectedParts.reduce((sum, p) => sum + p.price, 0)
  }, [selectedParts])

  const totalNewPrice = useMemo(() => {
    if (!previewAdjustment) return 0
    return previewAdjustment.reduce((sum, p) => sum + p.newPrice, 0)
  }, [previewAdjustment])

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

  const getPartName = (id: string) => {
    const part = parts.find((p) => p.id === id)
    return part ? part.name : id
  }

  const handleBatchAdjust = async () => {
    if (selectedIds.length === 0 || adjustValue === '') return
    setSubmitting(true)
    try {
      await api.adminBatchPriceAdjust({
        partIds: selectedIds,
        adjustType,
        adjustValue: Number(adjustValue),
        reason: adjustReason.trim() || undefined,
      })
      await loadData()
      setSelectedIds([])
      setSelectAll(false)
      setAdjustValue('')
      setAdjustReason('')
    } catch (e) {
      console.error('Failed to adjust prices:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCategory('')
    setFilterBrand('')
  }

  const hasActiveFilters = filterCategory || filterBrand || searchQuery

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            价格调整
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            批量调整配件价格，查看价格变更历史
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 bg-carbon-800 rounded-xl p-1 border border-carbon-500/20 w-fit">
        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'adjust'
              ? 'bg-moto-orange text-white shadow-lg shadow-moto-orange/20'
              : 'text-moto-steel hover:text-moto-silver'
          }`}
        >
          <Calculator size={16} />
          批量调价
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
          价格历史
        </button>
      </div>

      {activeTab === 'adjust' ? (
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
                      当前总价: <span className="text-moto-silver font-mono">¥{totalCurrentPrice.toLocaleString()}</span>
                      {previewAdjustment && (
                        <span className="ml-2">
                          → 调整后:{' '}
                          <span
                            className={`font-mono ${
                              totalNewPrice > totalCurrentPrice
                                ? 'text-green-400'
                                : totalNewPrice < totalCurrentPrice
                                ? 'text-red-400'
                                : 'text-moto-silver'
                            }`}
                          >
                            ¥{totalNewPrice.toLocaleString()}
                          </span>
                          {totalNewPrice !== totalCurrentPrice && (
                            <span
                              className={`ml-1 text-xs ${
                                totalNewPrice > totalCurrentPrice ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              ({totalNewPrice > totalCurrentPrice ? '+' : ''}
                              {(totalNewPrice - totalCurrentPrice).toLocaleString()})
                            </span>
                          )}
                        </span>
                      )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">调整方式</label>
                  <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30">
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as 'fixed' | 'percent')}
                      className="w-full bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="fixed" className="bg-carbon-800">固定金额</option>
                      <option value="percent" className="bg-carbon-800">百分比</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    调整值 {adjustType === 'percent' ? '(%)' : '(¥)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel text-sm">
                      {adjustType === 'fixed' ? '¥' : ''}
                    </span>
                    <input
                      type="number"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={adjustType === 'fixed' ? '如：+50 或 -30' : '如：10 或 -15'}
                      className={`w-full bg-carbon-900 border rounded-lg px-3 py-2 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        adjustType === 'fixed' ? 'pl-7' : 'pl-3'
                      } border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange`}
                    />
                    {adjustType === 'percent' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel text-sm">%</span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs text-moto-steel mb-1.5">调整原因（可选）</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="请输入价格调整原因..."
                    className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
              </div>

              {previewAdjustment && previewAdjustment.length > 0 && (
                <div className="mt-4 bg-carbon-900/50 rounded-lg p-4 border border-carbon-500/20 max-h-60 overflow-y-auto">
                  <p className="text-xs text-moto-steel mb-2 font-orbitron uppercase">调整预览</p>
                  <div className="space-y-2">
                    {previewAdjustment.slice(0, 10).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-carbon-500/10 last:border-b-0"
                      >
                        <span className="text-moto-silver truncate max-w-[200px]">{p.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-moto-steel">¥{p.price.toLocaleString()}</span>
                          <span className="text-moto-steel">→</span>
                          <span
                            className={`${
                              p.diff > 0 ? 'text-green-400' : p.diff < 0 ? 'text-red-400' : 'text-moto-silver'
                            }`}
                          >
                            ¥{p.newPrice.toLocaleString()}
                          </span>
                          <span
                            className={`text-xs flex items-center gap-0.5 ${
                              p.diff > 0 ? 'text-green-400' : p.diff < 0 ? 'text-red-400' : 'text-moto-steel'
                            }`}
                          >
                            {p.diff > 0 ? (
                              <TrendingUp size={12} />
                            ) : p.diff < 0 ? (
                              <TrendingDown size={12} />
                            ) : (
                              <Minus size={12} />
                            )}
                            {p.diff > 0 ? '+' : ''}
                            {p.diff.toLocaleString()} ({p.diffPercent > 0 ? '+' : ''}
                            {p.diffPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                    {previewAdjustment.length > 10 && (
                      <p className="text-xs text-moto-steel text-center pt-2">
                        ...还有 {previewAdjustment.length - 10} 个配件
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleBatchAdjust}
                  disabled={selectedIds.length === 0 || adjustValue === '' || submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                  确认调整价格
                </button>
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
              <TrendingUp size={64} className="text-carbon-500 mx-auto mb-4" />
              <h2 className="font-orbitron text-moto-silver text-xl mb-2">
                {hasActiveFilters ? '未找到匹配的配件' : '暂无配件数据'}
              </h2>
              <p className="text-moto-steel text-sm">
                {hasActiveFilters ? '请调整筛选条件或清除筛选' : '请先在配件管理中添加配件'}
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
                      <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        当前售价
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                        库存
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => {
                      const isSelected = selectedIds.includes(part.id)
                      return (
                        <tr
                          key={part.id}
                          className={`border-b border-carbon-500/20 last:border-b-0 hover:bg-carbon-700/30 transition-colors cursor-pointer ${
                            isSelected ? 'bg-moto-orange/5' : ''
                          }`}
                          onClick={() => toggleSelect(part.id)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-moto-orange font-mono font-medium">
                              ¥{part.price.toLocaleString()}
                            </span>
                            {part.originalPrice && part.originalPrice > part.price && (
                              <p className="text-xs text-carbon-400 line-through">
                                ¥{part.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${STATUS_BADGE[part.status].className}`}
                            >
                              {STATUS_BADGE[part.status].label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-mono ${
                                part.stock <= 10 ? 'text-red-400' : part.stock <= 50 ? 'text-yellow-400' : 'text-green-400'
                              }`}
                            >
                              {part.stock}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-carbon-500/20 flex items-center justify-between">
                <p className="text-xs text-moto-steel">
                  共 <span className="font-orbitron text-moto-silver">{filteredParts.length}</span> 个配件
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
              <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无价格变更记录</h2>
              <p className="text-moto-steel text-sm">配件价格调整后将在此处显示历史记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                    <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      配件名称
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      原价格
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      新价格
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                      变动
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
                  {filteredHistory.map((record) => {
                    const diff = record.newPrice - record.oldPrice
                    const diffPercent = record.oldPrice > 0 ? (diff / record.oldPrice) * 100 : 0
                    return (
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
                        <td className="px-4 py-3 text-right">
                          <span className="text-moto-steel font-mono text-sm">
                            ¥{record.oldPrice.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-moto-silver font-mono text-sm font-medium">
                            ¥{record.newPrice.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {diff > 0 ? (
                              <TrendingUp size={14} className="text-green-400" />
                            ) : diff < 0 ? (
                              <TrendingDown size={14} className="text-red-400" />
                            ) : (
                              <Minus size={14} className="text-moto-steel" />
                            )}
                            <span
                              className={`font-mono text-sm ${
                                diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-moto-steel'
                              }`}
                            >
                              {diff > 0 ? '+' : ''}
                              {diff.toLocaleString()}
                            </span>
                            <span className="text-xs text-moto-steel">
                              ({diffPercent > 0 ? '+' : ''}
                              {diffPercent.toFixed(1)}%)
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
