import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { Template, TemplateStatus, CreateTemplateRequest, UpdateTemplateRequest, SelectionItem } from '@/types'
import TemplateCard from '@/components/TemplateCard'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Archive,
  CheckSquare,
  Square,
  X,
  Loader2,
  Filter,
  ChevronDown,
  AlertTriangle,
  LayoutGrid,
  Flame,
  Star,
  Check,
  Car,
  Tag,
  ListChecks,
} from 'lucide-react'

const STATUS_OPTIONS: { value: TemplateStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部状态', color: 'text-moto-steel' },
  { value: 'draft', label: '草稿', color: 'text-carbon-400' },
  { value: 'pending_review', label: '待审核', color: 'text-yellow-400' },
  { value: 'published', label: '已发布', color: 'text-green-400' },
  { value: 'archived', label: '已归档', color: 'text-red-400' },
]

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'sport', label: '赛道运动' },
  { value: 'street', label: '街头风格' },
  { value: 'basic', label: '基础入门' },
  { value: 'hot', label: '热门推荐' },
]

export default function AdminTemplatesPage() {
  const {
    templates,
    templateCategories,
    selectedTemplateIds,
    bikeModels,
    allParts,
    fetchTemplates,
    fetchParts,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    batchPublishTemplates,
    batchUpdateTemplateStatus,
    toggleTemplateSelection,
    clearTemplateSelection,
    selectAllTemplates,
    selectTemplatesByIds,
    getFilteredTemplates,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'all'>('all')
  const [filterModel, setFilterModel] = useState<string>('')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    coverImage: '',
    category: 'basic' as 'sport' | 'street' | 'basic',
    modelIds: [] as string[],
    items: [] as SelectionItem[],
    tags: '',
    isHot: false,
    isRecommended: false,
  })

  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [partsSearchQuery, setPartsSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchTemplates(), fetchParts()])
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    let result = getFilteredTemplates()

    if (filterCategory && filterCategory !== 'all') {
      if (filterCategory === 'hot') {
        result = result.filter((t) => t.isHot || t.isRecommended)
      } else {
        result = result.filter((t) => t.category === filterCategory)
      }
    }

    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus)
    }

    if (filterModel) {
      result = result.filter((t) => t.modelIds.includes(filterModel))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    return result
  }, [templates, searchQuery, filterCategory, filterStatus, filterModel, getFilteredTemplates])

  const selectAllChecked = useMemo(() => {
    return filteredTemplates.length > 0 && filteredTemplates.every((t) => selectedTemplateIds.includes(t.id))
  }, [filteredTemplates, selectedTemplateIds])

  const filteredParts = useMemo(() => {
    if (!partsSearchQuery) return allParts
    const q = partsSearchQuery.toLowerCase().trim()
    return allParts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    )
  }, [allParts, partsSearchQuery])

  const handleToggleSelectAll = () => {
    if (selectAllChecked) {
      clearTemplateSelection()
    } else {
      selectTemplatesByIds(filteredTemplates.map((t) => t.id))
    }
  }

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      coverImage: '',
      category: 'basic',
      modelIds: [],
      items: [],
      tags: '',
      isHot: false,
      isRecommended: false,
    })
    setSelectedParts([])
    setIsFormModalOpen(true)
  }

  const openEditModal = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      nameEn: template.nameEn,
      description: template.description,
      coverImage: template.coverImage,
      category: template.category as 'sport' | 'street' | 'basic',
      modelIds: [...template.modelIds],
      items: [...template.items],
      tags: template.tags.join(', '),
      isHot: template.isHot,
      isRecommended: template.isRecommended,
    })
    setSelectedParts(template.items.map((i) => i.partId))
    setIsFormModalOpen(true)
  }

  const openDeleteModal = (template: Template) => {
    setDeletingTemplate(template)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const items: SelectionItem[] = selectedParts.map((partId) => ({
        partId,
        quantity: 1,
      }))

      const requestData: CreateTemplateRequest = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        description: formData.description.trim(),
        coverImage:
          formData.coverImage.trim() ||
          `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${formData.category}+custom+package+dark+theme&image_size=landscape_16_9`,
        category: formData.category,
        modelIds: formData.modelIds,
        items,
        tags,
      }

      if (editingTemplate) {
        const updateData: UpdateTemplateRequest = {
          ...requestData,
          isHot: formData.isHot,
          isRecommended: formData.isRecommended,
        }
        await updateTemplate(editingTemplate.id, updateData)
      } else {
        await createTemplate(requestData)
      }

      setIsFormModalOpen(false)
      setEditingTemplate(null)
    } catch (e) {
      console.error('Failed to save template:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTemplate) return
    setSubmitting(true)
    try {
      await deleteTemplate(deletingTemplate.id)
      setIsDeleteModalOpen(false)
      setDeletingTemplate(null)
    } catch (e) {
      console.error('Failed to delete template:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchPublish = async () => {
    if (selectedTemplateIds.length === 0) return
    setSubmitting(true)
    try {
      await batchPublishTemplates(selectedTemplateIds)
      clearTemplateSelection()
    } catch (e) {
      console.error('Failed to batch publish:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchArchive = async () => {
    if (selectedTemplateIds.length === 0) return
    setSubmitting(true)
    try {
      await batchUpdateTemplateStatus(selectedTemplateIds, 'archived')
      clearTemplateSelection()
    } catch (e) {
      console.error('Failed to batch archive:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchDraft = async () => {
    if (selectedTemplateIds.length === 0) return
    setSubmitting(true)
    try {
      await batchUpdateTemplateStatus(selectedTemplateIds, 'draft')
      clearTemplateSelection()
    } catch (e) {
      console.error('Failed to batch draft:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const togglePartSelection = (partId: string) => {
    setSelectedParts((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    )
  }

  const toggleModelSelection = (modelId: string) => {
    setFormData((prev) => ({
      ...prev,
      modelIds: prev.modelIds.includes(modelId)
        ? prev.modelIds.filter((id) => id !== modelId)
        : [...prev.modelIds, modelId],
    }))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterModel('')
  }

  const hasActiveFilters = filterCategory !== 'all' || filterStatus !== 'all' || filterModel || searchQuery

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            模板管理
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            共 {filteredTemplates.length} 个模板
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTemplateIds.length > 0 && (
            <div className="flex items-center gap-2 bg-moto-orange/10 text-moto-orange px-3 py-1.5 rounded-lg text-sm">
              <ListChecks size={14} />
              已选 {selectedTemplateIds.length} 项
            </div>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
          >
            <Plus size={14} />
            新建模板
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
              placeholder="搜索模板名称、描述、标签..."
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
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-carbon-800">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[140px]">
            <Filter size={14} className="text-moto-steel" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TemplateStatus | 'all')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-carbon-800">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 min-w-[160px]">
            <Car size={14} className="text-moto-steel" />
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer w-full"
            >
              <option value="" className="bg-carbon-800">全部车型</option>
              {bikeModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-carbon-800">
                  {m.name}
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

      {selectedTemplateIds.length > 0 && (
        <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={handleToggleSelectAll}
                className="text-moto-steel hover:text-moto-silver transition-colors"
              >
                {selectAllChecked ? (
                  <CheckSquare size={16} className="text-moto-orange" />
                ) : (
                  <Square size={16} />
                )}
              </button>
              <span className="text-sm text-moto-silver">
                {selectAllChecked ? '取消全选' : '全选当前页'}
              </span>
            </div>

            <div className="h-6 w-px bg-carbon-500/30 mx-1" />

            <button
              onClick={handleBatchPublish}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              批量发布
            </button>

            <button
              onClick={handleBatchArchive}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Archive size={14} />
              批量归档
            </button>

            <button
              onClick={handleBatchDraft}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-700 text-moto-steel border border-carbon-500/30 rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors disabled:opacity-50"
            >
              <Square size={14} />
              设为草稿
            </button>

            <button
              onClick={clearTemplateSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-moto-steel text-sm hover:text-moto-silver transition-colors ml-auto"
            >
              <X size={14} />
              取消选择
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-carbon-700/50 rounded-xl aspect-[16/9]" />
            ))}
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
          <LayoutGrid size={64} className="text-carbon-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-moto-silver text-xl mb-2">
            {hasActiveFilters ? '未找到匹配的模板' : '暂无模板数据'}
          </h2>
          <p className="text-moto-steel text-sm mb-6">
            {hasActiveFilters ? '请调整筛选条件或清除筛选' : '点击右上角按钮创建第一个模板'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors"
            >
              新建模板
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="relative group">
              <TemplateCard
                template={template}
                showCheckbox={true}
                showAdminActions={true}
                selected={selectedTemplateIds.includes(template.id)}
                onSelect={toggleTemplateSelection}
              />
              <div className="absolute top-14 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openEditModal(template)
                  }}
                  className="p-2 rounded-lg bg-carbon-800/90 text-moto-steel hover:text-moto-orange hover:bg-moto-orange/10 backdrop-blur transition-colors"
                  title="编辑"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openDeleteModal(template)
                  }}
                  className="p-2 rounded-lg bg-carbon-800/90 text-moto-steel hover:text-red-400 hover:bg-red-500/10 backdrop-blur transition-colors"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsFormModalOpen(false)
              setEditingTemplate(null)
            }}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h2 className="font-orbitron text-lg text-moto-silver">
                {editingTemplate ? '编辑模板' : '新建模板'}
              </h2>
              <button
                onClick={() => {
                  setIsFormModalOpen(false)
                  setEditingTemplate(null)
                }}
                className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">方案名称 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入方案名称"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">英文名称</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="请输入英文名称"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">方案描述 *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="请输入方案描述"
                      rows={3}
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">封面图片</label>
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      placeholder="输入图片URL，留空将自动生成"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                    {formData.coverImage && (
                      <div className="mt-2 aspect-[16/9] rounded-lg overflow-hidden bg-carbon-700 border border-carbon-500/20">
                        <img
                          src={formData.coverImage}
                          alt="预览"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">分类 *</label>
                    <div className="flex gap-2">
                      {(['sport', 'street', 'basic'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                            formData.category === cat
                              ? 'bg-moto-orange text-white'
                              : 'bg-carbon-700 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
                          }`}
                        >
                          {cat === 'sport' ? '赛道运动' : cat === 'street' ? '街头风格' : '基础入门'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">标签</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="多个标签用逗号分隔，如：赛道,性能,碳纤维"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isHot: !formData.isHot })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        formData.isHot
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-carbon-700 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
                      }`}
                    >
                      <Flame size={14} />
                      热门
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isRecommended: !formData.isRecommended })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        formData.isRecommended
                          ? 'bg-moto-orange/20 text-moto-orange border border-moto-orange/30'
                          : 'bg-carbon-700 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
                      }`}
                    >
                      <Star size={14} />
                      推荐
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">适配车型 *</label>
                    <div className="space-y-2">
                      {bikeModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => toggleModelSelection(model.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            formData.modelIds.includes(model.id)
                              ? 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30'
                              : 'bg-carbon-700 text-moto-silver border border-transparent hover:bg-carbon-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              formData.modelIds.includes(model.id)
                                ? 'bg-moto-orange border-moto-orange'
                                : 'border-carbon-500'
                            }`}
                          >
                            {formData.modelIds.includes(model.id) && <Check size={12} className="text-white" />}
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-moto-steel">{model.nameEn}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      包含配件 <span className="text-moto-orange">({selectedParts.length} 件)</span>
                    </label>
                    <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30 mb-2">
                      <Search size={14} className="text-moto-steel flex-shrink-0" />
                      <input
                        type="text"
                        value={partsSearchQuery}
                        onChange={(e) => setPartsSearchQuery(e.target.value)}
                        placeholder="搜索配件..."
                        className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-full"
                      />
                    </div>
                    <div className="bg-carbon-900 rounded-lg border border-carbon-500/30 max-h-64 overflow-y-auto">
                      {filteredParts.length === 0 ? (
                        <div className="p-4 text-center text-moto-steel text-sm">
                          未找到匹配的配件
                        </div>
                      ) : (
                        filteredParts.slice(0, 50).map((part) => (
                          <button
                            key={part.id}
                            type="button"
                            onClick={() => togglePartSelection(part.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              selectedParts.includes(part.id)
                                ? 'bg-moto-orange/10 text-moto-orange'
                                : 'text-moto-silver hover:bg-carbon-700/50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedParts.includes(part.id)
                                  ? 'bg-moto-orange border-moto-orange'
                                  : 'border-carbon-500'
                              }`}
                            >
                              {selectedParts.includes(part.id) && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <img
                              src={part.image}
                              alt={part.name}
                              className="w-8 h-8 rounded object-cover bg-carbon-700 flex-shrink-0"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/></svg>'
                              }}
                            />
                            <div className="text-left flex-1 min-w-0">
                              <p className="truncate">{part.name}</p>
                              <p className="text-xs text-moto-steel">
                                {part.brand} · ¥{part.price.toLocaleString()}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-carbon-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsFormModalOpen(false)
                  setEditingTemplate(null)
                }}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim() || formData.modelIds.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {editingTemplate ? '保存修改' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <p className="text-sm text-moto-silver mb-2">即将删除以下模板：</p>
              <div className="flex items-center gap-3">
                <img
                  src={deletingTemplate.coverImage}
                  alt={deletingTemplate.name}
                  className="w-12 h-12 rounded-lg object-cover bg-carbon-700 border border-carbon-500/20"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
                  }}
                />
                <div>
                  <p className="text-sm text-moto-silver font-medium">{deletingTemplate.name}</p>
                  <p className="text-xs text-moto-steel">{deletingTemplate.nameEn}</p>
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
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
