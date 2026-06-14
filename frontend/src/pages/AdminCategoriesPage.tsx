import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Power,
  X,
  Check,
  AlertTriangle,
  Folder,
  ArrowUpDown,
  Clock,
  Tag,
  Globe,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react'

type ViewMode = 'table' | 'card'

export default function AdminCategoriesPage() {
  const { categories, fetchCategories, allParts } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [loading, setLoading] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    nameEn: '',
    icon: '',
    description: '',
    sortOrder: 0,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    let result = [...categories]
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          (c.description?.toLowerCase() ?? '').includes(q)
      )
    }
    return result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categories, searchQuery])

  const getPartCountByCategory = (categoryId: string) => {
    return allParts.filter((p) => p.categoryId === categoryId).length
  }

  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      icon: '',
      description: '',
      sortOrder: 0,
    })
    setFormErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      nameEn: category.nameEn,
      icon: category.icon ?? '',
      description: category.description ?? '',
      sortOrder: category.sortOrder ?? 0,
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteModalOpen(true)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = '请输入分类名称'
    }
    if (!formData.nameEn.trim()) {
      errors.nameEn = '请输入英文名'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    setLoading(true)
    try {
      await api.adminCreateCategory(formData)
      await fetchCategories()
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e) {
      console.error('Failed to create category:', e)
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory || !validateForm()) return
    setSubmitting(true)
    setLoading(true)
    try {
      await api.adminUpdateCategory(editingCategory.id, formData)
      await fetchCategories()
      setIsEditModalOpen(false)
      setEditingCategory(null)
      resetForm()
    } catch (e) {
      console.error('Failed to update category:', e)
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    setLoading(true)
    try {
      await api.adminUpdateCategory(category.id, { isActive: !category.isActive })
      await fetchCategories()
    } catch (e) {
      console.error('Failed to toggle category:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    const partCount = getPartCountByCategory(deletingCategory.id)
    if (partCount > 0) return
    setLoading(true)
    try {
      await api.adminDeleteCategory(deletingCategory.id)
      await fetchCategories()
      setIsDeleteModalOpen(false)
      setDeletingCategory(null)
    } catch (e) {
      console.error('Failed to delete category:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              配件分类维护
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              共 {filteredCategories.length} 个分类
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-carbon-800 rounded-lg border border-carbon-500/20 p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'card'
                    ? 'bg-moto-orange/20 text-moto-orange'
                    : 'text-moto-steel hover:text-moto-silver'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-moto-orange/20 text-moto-orange'
                    : 'text-moto-steel hover:text-moto-silver'
                }`}
              >
                <List size={16} />
              </button>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              <Plus size={16} />
              新增分类
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="text-moto-steel" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索分类名称、英文名或描述..."
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
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 animate-pulse">
                <div className="space-y-3">
                  <div className="h-5 bg-carbon-700 rounded w-32" />
                  <div className="h-4 bg-carbon-700 rounded w-48" />
                  <div className="h-3 bg-carbon-700 rounded w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Folder size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无分类</h2>
            <p className="text-moto-steel text-sm mb-6">点击右上角按钮创建第一个分类</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              新增分类
            </button>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const partCount = getPartCountByCategory(category.id)
              return (
                <div
                  key={category.id}
                  className={`bg-carbon-800 rounded-xl border p-5 transition-all hover:shadow-lg hover:shadow-black/20 group ${
                    category.isActive
                      ? 'border-carbon-500/20 hover:border-moto-orange/40'
                      : 'border-carbon-500/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          category.isActive
                            ? 'bg-moto-orange/15 text-moto-orange'
                            : 'bg-carbon-700 text-moto-steel'
                        }`}
                      >
                        <Folder size={20} />
                      </div>
                      <div>
                        <h3 className="font-orbitron text-moto-silver font-medium">
                          {category.name}
                        </h3>
                        <p className="text-xs text-moto-steel font-mono">{category.nameEn}</p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                        category.isActive
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {category.isActive ? <Check size={10} /> : <X size={10} />}
                      {category.isActive ? '启用' : '停用'}
                    </span>
                  </div>

                  {category.description && (
                    <p className="text-xs text-moto-steel mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-moto-steel mb-4">
                    <span className="flex items-center gap-1">
                      <Tag size={10} />
                      {partCount} 配件
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpDown size={10} />
                      排序 {category.sortOrder ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString('zh-CN')
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-carbon-500/20">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                    >
                      <Edit3 size={12} />
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${
                        category.isActive
                          ? 'text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      <Power size={12} />
                      {category.isActive ? '停用' : '启用'}
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-carbon-500/20">
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      名称
                    </th>
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      英文名
                    </th>
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      描述
                    </th>
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      排序
                    </th>
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="text-right px-5 py-3 font-orbitron text-xs text-moto-steel font-medium uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b border-carbon-500/10 hover:bg-carbon-700/30 transition-colors ${
                        !category.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center ${
                              category.isActive
                                ? 'bg-moto-orange/15 text-moto-orange'
                                : 'bg-carbon-700 text-moto-steel'
                            }`}
                          >
                            <Folder size={16} />
                          </div>
                          <span className="text-moto-silver text-sm font-medium">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-moto-steel text-sm font-mono">
                          {category.nameEn}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-moto-steel text-sm">
                          {category.description || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-moto-steel text-sm font-mono">
                          {category.sortOrder ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                            category.isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {category.isActive ? <Check size={10} /> : <X size={10} />}
                          {category.isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-moto-steel text-sm">
                          {category.createdAt
                            ? new Date(category.createdAt).toLocaleDateString('zh-CN')
                            : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                            title="编辑"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(category)}
                            className={`p-2 rounded-lg transition-colors ${
                              category.isActive
                                ? 'text-yellow-400 hover:bg-yellow-500/10'
                                : 'text-green-400 hover:bg-green-500/10'
                            }`}
                            title={category.isActive ? '停用' : '启用'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(category)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/20 w-full max-w-lg animate-scale-in shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-500/20">
              <h2 className="font-orbitron text-lg text-moto-silver">
                {isCreateModalOpen ? '新增分类' : '编辑分类'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setEditingCategory(null)
                  resetForm()
                }}
                className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm text-moto-silver mb-2">
                  <Tag size={12} className="text-moto-orange" />
                  分类名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入分类名称"
                  className={`w-full bg-carbon-900 border rounded-lg px-4 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none transition-colors ${
                    formErrors.name
                      ? 'border-red-500/50 focus:border-red-400'
                      : 'border-carbon-500/30 focus:border-moto-orange/50'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-moto-silver mb-2">
                  <Globe size={12} className="text-moto-orange" />
                  英文名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="请输入英文名"
                  className={`w-full bg-carbon-900 border rounded-lg px-4 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none transition-colors ${
                    formErrors.nameEn
                      ? 'border-red-500/50 focus:border-red-400'
                      : 'border-carbon-500/30 focus:border-moto-orange/50'
                  }`}
                />
                {formErrors.nameEn && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.nameEn}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-moto-silver mb-2">
                  <Folder size={12} className="text-moto-orange" />
                  图标
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="请输入图标名称或URL（可选）"
                  className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-4 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-moto-silver mb-2">
                  <FileText size={12} className="text-moto-orange" />
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入分类描述（可选）"
                  rows={3}
                  className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-4 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-moto-silver mb-2">
                  <ArrowUpDown size={12} className="text-moto-orange" />
                  排序
                </label>
                <input
                  type="number"
                  value={formData.sortOrder ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-4 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-carbon-500/20">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setEditingCategory(null)
                  resetForm()
                }}
                className="px-4 py-2 rounded-lg text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={isCreateModalOpen ? handleCreate : handleUpdate}
                disabled={submitting}
                className="px-5 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : isCreateModalOpen ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/20 w-full max-w-md animate-scale-in shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    getPartCountByCategory(deletingCategory.id) > 0
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="font-orbitron text-lg text-moto-silver">确认删除</h2>
                  <p className="text-sm text-moto-steel mt-1">
                    分类「{deletingCategory.name}」
                  </p>
                </div>
              </div>

              {getPartCountByCategory(deletingCategory.id) > 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-400 font-medium mb-1">
                        无法删除该分类
                      </p>
                      <p className="text-xs text-yellow-300/80">
                        该分类下还有 {getPartCountByCategory(deletingCategory.id)}{' '}
                        个配件，请先删除或转移这些配件后再进行删除操作。
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-moto-steel mb-4">
                  此操作将永久删除该分类，删除后无法恢复。确认继续吗？
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-carbon-500/20">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setDeletingCategory(null)
                }}
                className="px-4 py-2 rounded-lg text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || getPartCountByCategory(deletingCategory.id) > 0}
                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
