import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Wrench,
  Check,
  Loader2,
  Image,
  FileText,
  Tag,
  Car,
  Flame,
  Star,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Template, CreateTemplateRequest, UpdateTemplateRequest, SelectionItem } from '@/types'

interface TemplateFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Template
}

const CATEGORY_OPTIONS = [
  { value: 'sport', label: 'sport赛道运动', labelEn: 'Sport Racing' },
  { value: 'street', label: 'street街头风格', labelEn: 'Street Style' },
  { value: 'basic', label: 'basic基础入门', labelEn: 'Basic Entry' },
]

export default function TemplateFormModal({
  isOpen,
  onClose,
  initialData,
}: TemplateFormModalProps) {
  const { bikeModels, categories, allParts, createTemplate, updateTemplate } = useStore()

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState('')
  const [modelIds, setModelIds] = useState<string[]>([])
  const [items, setItems] = useState<SelectionItem[]>([])
  const [tags, setTags] = useState('')
  const [isHot, setIsHot] = useState(false)
  const [isRecommended, setIsRecommended] = useState(false)

  const [showPartSelector, setShowPartSelector] = useState(false)
  const [partSearchQuery, setPartSearchQuery] = useState('')
  const [partCategoryFilter, setPartCategoryFilter] = useState('all')

  const isEditMode = !!initialData

  const existingPartIds = useMemo(() => {
    return new Set(items.map((item) => item.partId))
  }, [items])

  const filteredParts = useMemo(() => {
    let result = [...allParts]

    if (partCategoryFilter !== 'all') {
      result = result.filter((p) => p.categoryId === partCategoryFilter)
    }

    if (partSearchQuery.trim()) {
      const q = partSearchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
    }

    return result
  }, [allParts, partCategoryFilter, partSearchQuery])

  const itemsTotalPrice = useMemo(() => {
    return items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return total + (part ? part.price * item.quantity : 0)
    }, 0)
  }, [items, allParts])

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '')
        setNameEn(initialData.nameEn || '')
        setDescription(initialData.description || '')
        setCoverImage(initialData.coverImage || '')
        setCategory(initialData.category || '')
        setModelIds(initialData.modelIds || [])
        setItems(initialData.items || [])
        setTags(initialData.tags?.join(', ') || '')
        setIsHot(initialData.isHot || false)
        setIsRecommended(initialData.isRecommended || false)
      } else {
        resetForm()
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  const resetForm = () => {
    setName('')
    setNameEn('')
    setDescription('')
    setCoverImage('')
    setCategory('')
    setModelIds([])
    setItems([])
    setTags('')
    setIsHot(false)
    setIsRecommended(false)
    setPartSearchQuery('')
    setPartCategoryFilter('all')
    setShowPartSelector(false)
  }

  const handleClose = () => {
    setSubmitting(false)
    resetForm()
    onClose()
  }

  const toggleModel = (modelId: string) => {
    setModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    )
  }

  const addPart = (partId: string) => {
    if (existingPartIds.has(partId)) {
      setItems((prev) =>
        prev.map((item) =>
          item.partId === partId ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setItems((prev) => [...prev, { partId, quantity: 1 }])
    }
  }

  const updateItemQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(partId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.partId === partId ? { ...item, quantity } : item
      )
    )
  }

  const removeItem = (partId: string) => {
    setItems((prev) => prev.filter((item) => item.partId !== partId))
  }

  const getPartInfo = (partId: string) => {
    return allParts.find((p) => p.id === partId)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = '请输入方案名称'
    if (!description.trim()) newErrors.description = '请输入方案描述'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const baseData = {
      name: name.trim(),
      nameEn: nameEn.trim(),
      description: description.trim(),
      coverImage: coverImage.trim(),
      category,
      modelIds,
      items,
      tags: tagsArray,
      isHot,
      isRecommended,
    }

    try {
      if (isEditMode && initialData) {
        const updateData: UpdateTemplateRequest = baseData
        await updateTemplate(initialData.id, updateData)
      } else {
        const createData: CreateTemplateRequest = baseData
        await createTemplate(createData)
      }
      handleClose()
    } catch (e) {
      console.error('Failed to submit template:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
        <div className="sticky top-0 bg-carbon-800 z-10 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="text-moto-orange" size={20} />
            <div>
              <h2 className="font-orbitron text-lg text-moto-silver">
                {isEditMode ? '编辑模板' : '创建模板'}
              </h2>
              <p className="text-xs text-moto-steel mt-0.5">
                {isEditMode ? '修改模板信息并保存' : '填写模板信息并提交'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-moto-steel mb-1.5">
                <FileText size={10} className="inline mr-1" />
                方案名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="请输入方案名称"
                className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs text-moto-steel mb-1.5">
                <FileText size={10} className="inline mr-1" />
                英文名称
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="请输入英文名称"
                className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-moto-steel mb-1.5">
              <FileText size={10} className="inline mr-1" />
              方案描述 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: '' }))
              }}
              placeholder="请输入方案描述，包括方案特点、适用场景等..."
              rows={4}
              className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors resize-none ${
                errors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
              }`}
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-moto-steel mb-1.5">
              <Image size={10} className="inline mr-1" />
              封面图片URL
            </label>
            <div className="flex gap-4">
              <div className="w-32 h-20 bg-carbon-700/50 border border-carbon-500/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <Image size={24} className="text-carbon-500" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="请输入封面图片URL"
                  className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-moto-steel mb-1.5">
                <Tag size={10} className="inline mr-1" />
                分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors appearance-none"
              >
                <option value="">请选择分类</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-moto-steel mb-1.5">
                <Tag size={10} className="inline mr-1" />
                标签（逗号分隔）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="性能, 外观, 入门"
                className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-moto-steel mb-2">
              <Car size={10} className="inline mr-1" />
              适配车型
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {bikeModels.map((model) => {
                const isSelected = modelIds.includes(model.id)
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-moto-orange/10 border-moto-orange/40 text-moto-orange'
                        : 'bg-carbon-700/30 border-carbon-500/30 text-moto-silver hover:border-carbon-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-moto-orange border-moto-orange'
                            : 'border-carbon-500/50'
                        }`}
                      >
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{model.name}</p>
                        <p className="text-[10px] text-moto-steel mt-0.5">{model.nameEn}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHot(!isHot)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isHot ? 'bg-orange-500' : 'bg-carbon-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isHot ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                  style={{
                    transform: isHot ? 'translateX(18px)' : 'translateX(2px)',
                  }}
                />
              </button>
              <div className="flex items-center gap-1 text-sm text-moto-silver">
                <Flame size={14} className={isHot ? 'text-orange-500' : 'text-moto-steel'} />
                热门
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRecommended(!isRecommended)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isRecommended ? 'bg-moto-orange' : 'bg-carbon-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform`}
                  style={{
                    transform: isRecommended ? 'translateX(18px)' : 'translateX(2px)',
                  }}
                />
              </button>
              <div className="flex items-center gap-1 text-sm text-moto-silver">
                <Star size={14} className={isRecommended ? 'text-moto-orange' : 'text-moto-steel'} />
                推荐
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-moto-steel">
                <Wrench size={10} className="inline mr-1" />
                配件列表
              </label>
              <button
                onClick={() => setShowPartSelector(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-moto-orange hover:text-moto-orange-light transition-colors"
              >
                <Plus size={12} />
                添加配件
              </button>
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed border-carbon-500/30 rounded-lg p-8 text-center">
                <Wrench size={32} className="text-carbon-500 mx-auto mb-3" />
                <p className="text-sm text-moto-steel mb-2">暂无配件</p>
                <button
                  onClick={() => setShowPartSelector(true)}
                  className="text-xs text-moto-orange hover:text-moto-orange-light transition-colors"
                >
                  + 添加第一个配件
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-carbon-700/30 rounded-lg text-xs text-moto-steel">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">配件名称</div>
                  <div className="col-span-2 text-right">单价</div>
                  <div className="col-span-2 text-center">数量</div>
                  <div className="col-span-2 text-right">小计</div>
                </div>
                {items.map((item, index) => {
                  const part = getPartInfo(item.partId)
                  if (!part) return null
                  return (
                    <div
                      key={item.partId}
                      className="grid grid-cols-12 gap-2 px-3 py-3 bg-carbon-700/20 border border-carbon-500/20 rounded-lg items-center"
                    >
                      <div className="col-span-1 text-sm text-moto-steel">{index + 1}</div>
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-8 h-8 rounded object-cover bg-carbon-700 flex-shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="8">N/A</text></svg>'
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-moto-silver truncate">{part.name}</p>
                            <p className="text-[10px] text-moto-steel">{part.brand}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-sm text-moto-silver">
                        ¥{part.price.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateItemQuantity(item.partId, item.quantity - 1)}
                            className="p-1 text-moto-steel hover:text-white hover:bg-carbon-600 rounded transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.partId, parseInt(e.target.value) || 1)
                            }
                            min={1}
                            className="w-12 px-2 py-1 bg-carbon-700 border border-carbon-500/30 rounded text-center text-sm text-moto-silver focus:outline-none focus:ring-1 focus:ring-moto-orange"
                          />
                          <button
                            onClick={() => updateItemQuantity(item.partId, item.quantity + 1)}
                            className="p-1 text-moto-steel hover:text-white hover:bg-carbon-600 rounded transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="col-span-1 text-right text-sm text-moto-orange">
                        ¥{(part.price * item.quantity).toLocaleString()}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => removeItem(item.partId)}
                          className="p-1.5 text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-end pt-2">
                  <div className="text-sm text-moto-silver">
                    配件总计：
                    <span className="text-moto-orange font-medium ml-2">
                      ¥{itemsTotalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-carbon-800 border-t border-carbon-500/20 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-moto-steel">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-400">请检查表单中的错误</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check size={14} />
                  {isEditMode ? '保存修改' : '创建模板'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showPartSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPartSelector(false)} />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
            <div className="sticky top-0 bg-carbon-800 z-10 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="text-moto-orange" size={20} />
                <h3 className="font-orbitron text-lg text-moto-silver">选择配件</h3>
              </div>
              <button
                onClick={() => setShowPartSelector(false)}
                className="p-1.5 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-carbon-500/20 space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel" />
                  <input
                    type="text"
                    value={partSearchQuery}
                    onChange={(e) => setPartSearchQuery(e.target.value)}
                    placeholder="搜索配件名称或品牌..."
                    className="w-full pl-9 pr-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
                <select
                  value={partCategoryFilter}
                  onChange={(e) => setPartCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors appearance-none min-w-[140px]"
                >
                  <option value="all">全部分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredParts.length === 0 ? (
                <div className="p-8 text-center">
                  <Search size={24} className="text-carbon-500 mx-auto mb-2" />
                  <p className="text-sm text-moto-steel">未找到匹配的配件</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredParts.map((part) => {
                    const isSelected = existingPartIds.has(part.id)
                    return (
                      <button
                        key={part.id}
                        onClick={() => addPart(part.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-moto-orange/10 border-moto-orange/40'
                            : 'bg-carbon-700/30 border-carbon-500/30 hover:border-carbon-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-10 h-10 rounded object-cover bg-carbon-700 flex-shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">N/A</text></svg>'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-moto-silver truncate">{part.name}</p>
                            <p className="text-[10px] text-moto-steel">{part.brand}</p>
                            <p className="text-xs text-moto-orange mt-0.5">¥{part.price.toLocaleString()}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-moto-orange flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-carbon-800 border-t border-carbon-500/20 px-6 py-3 flex items-center justify-end">
              <button
                onClick={() => setShowPartSelector(false)}
                className="px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange-light transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
