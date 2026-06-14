import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { PartAdmin, PartStatus, CreatePartRequest, UpdatePartRequest } from '@/types'
import PartFormModal from '@/components/PartFormModal'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Filter,
  X,
  Check,
  AlertTriangle,
  Package,
  Tag,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Loader2,
  Square,
  CheckSquare2,
  Download,
} from 'lucide-react'

const STATUS_OPTIONS: { value: PartStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部状态', color: 'text-moto-steel' },
  { value: 'draft', label: '草稿', color: 'text-carbon-400' },
  { value: 'pending_review', label: '待审核', color: 'text-yellow-400' },
  { value: 'active', label: '已上架', color: 'text-green-400' },
  { value: 'inactive', label: '已下架', color: 'text-gray-400' },
  { value: 'rejected', label: '已驳回', color: 'text-red-400' },
]

const STATUS_BADGE: Record<PartStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-carbon-600 text-carbon-300 border-carbon-500/30' },
  pending_review: { label: '待审核', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  active: { label: '已上架', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  inactive: { label: '已下架', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  rejected: { label: '已驳回', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export default function AdminPartsPage() {
  const { categories, fetchCategories, allParts, fetchParts } = useStore()
  const [parts, setParts] = useState<PartAdmin[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<PartStatus | 'all'>('all')
  const [filterBrand, setFilterBrand] = useState<string>('')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<PartAdmin | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingPart, setDeletingPart] = useState<PartAdmin | null>(null)

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewPart, setPreviewPart] = useState<PartAdmin | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    ;(window as any).__ALL_PARTS__ = parts
  }, [parts])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchCategories(), fetchParts()])
      const [partsData, brandsData] = await Promise.all([
        api.adminGetParts(),
        api.adminGetBrands(),
      ])
      setParts(partsData)
      setBrands(brandsData)
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
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterBrand && p.brand !== filterBrand) return false
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [parts, searchQuery, filterCategory, filterStatus, filterBrand])

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

  const openCreateModal = () => {
    setEditingPart(null)
    setIsFormModalOpen(true)
  }

  const openEditModal = (part: PartAdmin) => {
    setEditingPart(part)
    setIsFormModalOpen(true)
  }

  const openDeleteModal = (part: PartAdmin) => {
    setDeletingPart(part)
    setIsDeleteModalOpen(true)
  }

  const openPreview = (part: PartAdmin) => {
    setPreviewPart(part)
    setIsPreviewOpen(true)
  }

  const handleSubmit = async (data: CreatePartRequest | UpdatePartRequest) => {
    setSubmitting(true)
    try {
      if (editingPart) {
        await api.adminUpdatePart(editingPart.id, data)
      } else {
        await api.adminCreatePart(data as CreatePartRequest)
      }
      await loadData()
      setIsFormModalOpen(false)
      setEditingPart(null)
    } catch (e) {
      console.error('Failed to save part:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPart) return
    setSubmitting(true)
    try {
      await api.adminDeletePart(deletingPart.id)
      await loadData()
      setIsDeleteModalOpen(false)
      setDeletingPart(null)
      setSelectedIds((prev) => prev.filter((id) => id !== deletingPart.id))
    } catch (e) {
      console.error('Failed to delete part:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCategory('')
    setFilterStatus('all')
    setFilterBrand('')
  }

  const exportCSV = () => {
    const headers = ['ID', 'SKU', '名称', '品牌', '分类', '售价', '原价', '成本', '库存', '状态', '创建时间']
    const rows = filteredParts.map((p) => [
      p.id,
      p.sku,
      p.name,
      p.brand,
      getCategoryName(p.categoryId),
      p.price,
      p.originalPrice || '',
      p.costPrice || '',
      p.stock,
      STATUS_BADGE[p.status].label,
      new Date(p.createdAt).toLocaleString('zh-CN'),
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `配件列表_${new Date().toLocaleDateString('zh-CN')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = filterCategory || filterStatus !== 'all' || filterBrand || searchQuery

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            配件管理
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            共 {filteredParts.length} 个配件
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-moto-orange/10 text-moto-orange px-3 py-1.5 rounded-lg text-sm">
              <ListChecks size={14} />
              已选 {selectedIds.length} 项
            </div>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-carbon-800 text-moto-steel border border-carbon-500/30 rounded-lg text-sm hover:text-moto-silver hover:border-carbon-500/50 transition-colors"
          >
            <Download size={14} />
            导出
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
          >
            <Plus size={14} />
            新增配件
          </button>
        </div>
      </div>

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
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                  <th className="w-12 px-4 py-3" />
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">配件信息</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">分类</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">价格</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">库存</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">创建时间</th>
                  <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel">操作</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-carbon-500/20">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="w-12 h-12 bg-carbon-700 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-carbon-700 rounded w-48" />
                          <div className="h-3 bg-carbon-700 rounded w-32" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredParts.length === 0 ? (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
          <Package size={64} className="text-carbon-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-moto-silver text-xl mb-2">
            {hasActiveFilters ? '未找到匹配的配件' : '暂无配件数据'}
          </h2>
          <p className="text-moto-steel text-sm mb-6">
            {hasActiveFilters ? '请调整筛选条件或清除筛选' : '点击右上角按钮创建第一个配件'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors"
            >
              新增配件
            </button>
          )}
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
                    库存
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => {
                  const isSelected = selectedIds.includes(part.id)
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
                            className="w-12 h-12 rounded-lg object-cover bg-carbon-700 border border-carbon-500/20"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
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
                        <div>
                          <p className="text-sm text-moto-orange font-medium">
                            ¥{part.price.toLocaleString()}
                          </p>
                          {part.originalPrice && part.originalPrice > part.price && (
                            <p className="text-xs text-carbon-400 line-through">
                              ¥{part.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
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
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${STATUS_BADGE[part.status].className}`}
                        >
                          {STATUS_BADGE[part.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-moto-steel">
                          {new Date(part.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPreview(part)}
                            className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                            title="查看"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(part)}
                            className="p-1.5 rounded-lg text-moto-steel hover:text-moto-orange hover:bg-moto-orange/10 transition-colors"
                            title="编辑"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(part)}
                            className="p-1.5 rounded-lg text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
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

      <PartFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingPart(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingPart ?? undefined}
        categories={categories}
        brands={brands}
      />

      {isPreviewOpen && previewPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h2 className="font-orbitron text-lg text-moto-silver">配件详情</h2>
              <button
                onClick={() => setIsPreviewOpen(false)}
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
                <div>
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
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-orbitron text-moto-silver text-lg">确认删除</h3>
                <p className="text-xs text-moto-steel mt-0.5">此操作无法撤销</p>
              </div>
            </div>
            <div className="bg-carbon-700/50 rounded-lg p-4 mb-5 border border-carbon-500/20">
              <p className="text-sm text-moto-silver mb-2">即将删除以下配件：</p>
              <div className="flex items-center gap-3">
                <img
                  src={deletingPart.image}
                  alt={deletingPart.name}
                  className="w-12 h-12 rounded-lg object-cover bg-carbon-700 border border-carbon-500/20"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
                  }}
                />
                <div>
                  <p className="text-sm text-moto-silver font-medium">{deletingPart.name}</p>
                  <p className="text-xs text-moto-steel font-mono">{deletingPart.sku}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
