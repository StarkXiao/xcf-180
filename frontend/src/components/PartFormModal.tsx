import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  Trash2,
  Check,
  Package,
  Tag,
  Image,
  List,
  Car,
  AlertTriangle,
  MapPin,
  Info,
  FileText,
} from 'lucide-react'
import type { PartAdmin, Category, CreatePartRequest, UpdatePartRequest, PartPosition, PartStatus } from '@/types'
import { BIKE_MODELS } from '@/data/bikeModels'

interface PartFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePartRequest | UpdatePartRequest) => void
  initialData?: PartAdmin
  categories: Category[]
  brands: string[]
}

type TabKey =
  | 'basic'
  | 'price'
  | 'content'
  | 'specs'
  | 'compatible'
  | 'conflicts'
  | 'position'
  | 'status'

interface SpecRow {
  id: string
  key: string
  value: string
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: '基本信息', icon: <Package size={14} /> },
  { key: 'price', label: '价格库存', icon: <Tag size={14} /> },
  { key: 'content', label: '图文详情', icon: <Image size={14} /> },
  { key: 'specs', label: '规格参数', icon: <List size={14} /> },
  { key: 'compatible', label: '兼容车型', icon: <Car size={14} /> },
  { key: 'conflicts', label: '冲突配件', icon: <AlertTriangle size={14} /> },
  { key: 'position', label: '预览位置', icon: <MapPin size={14} /> },
  { key: 'status', label: '状态设置', icon: <Info size={14} /> },
]

const DEFAULT_POSITION: PartPosition = {
  x: 10,
  y: 10,
  width: 20,
  height: 20,
}

const generateId = () => Math.random().toString(36).slice(2, 9)

export default function PartFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  brands,
}: PartFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sku, setSku] = useState('')

  const [price, setPrice] = useState<number | ''>('')
  const [originalPrice, setOriginalPrice] = useState<number | ''>('')
  const [costPrice, setCostPrice] = useState<number | ''>('')
  const [stock, setStock] = useState<number | ''>(0)

  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')

  const [specs, setSpecs] = useState<SpecRow[]>([])

  const [compatible, setCompatible] = useState<string[]>([])

  const [conflictsWith, setConflictsWith] = useState<string[]>([])
  const [conflictSearch, setConflictSearch] = useState('')

  const [position, setPosition] = useState<PartPosition>(DEFAULT_POSITION)

  const [status, setStatus] = useState<PartStatus>('draft')

  const isEditMode = !!initialData

  const allParts = useMemo(() => {
    const partsFromStore = (window as any).__ALL_PARTS__ || []
    return partsFromStore
  }, [])

  const filteredConflictParts = useMemo(() => {
    if (!Array.isArray(allParts)) return []
    return allParts.filter((p: any) => {
      if (initialData && p.id === initialData.id) return false
      if (!conflictSearch.trim()) return true
      return (
        p.name?.toLowerCase().includes(conflictSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(conflictSearch.toLowerCase())
      )
    })
  }, [allParts, conflictSearch, initialData])

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '')
        setBrand(initialData.brand || '')
        setCategoryId(initialData.categoryId || '')
        setSku(initialData.sku || '')
        setPrice(initialData.price ?? '')
        setOriginalPrice(initialData.originalPrice ?? '')
        setCostPrice(initialData.costPrice ?? '')
        setStock(initialData.stock ?? 0)
        setImage(initialData.image || '')
        setDescription(initialData.description || '')
        setSpecs(
          initialData.specs
            ? Object.entries(initialData.specs).map(([key, value]) => ({
                id: generateId(),
                key,
                value: String(value),
              }))
            : []
        )
        setCompatible(initialData.compatible || [])
        setConflictsWith(initialData.conflictsWith || [])
        setPosition(initialData.position || DEFAULT_POSITION)
        setStatus(initialData.status || 'draft')
      } else {
        resetForm()
      }
      setActiveTab('basic')
      setErrors({})
    }
  }, [isOpen, initialData])

  const resetForm = () => {
    setName('')
    setBrand('')
    setCategoryId('')
    setSku('')
    setPrice('')
    setOriginalPrice('')
    setCostPrice('')
    setStock(0)
    setImage('')
    setDescription('')
    setSpecs([])
    setCompatible([])
    setConflictsWith([])
    setPosition(DEFAULT_POSITION)
    setStatus('draft')
  }

  const handleClose = () => {
    setSubmitting(false)
    resetForm()
    onClose()
  }

  const addSpecRow = () => {
    setSpecs((prev) => [...prev, { id: generateId(), key: '', value: '' }])
  }

  const removeSpecRow = (id: string) => {
    setSpecs((prev) => prev.filter((s) => s.id !== id))
  }

  const updateSpecRow = (id: string, field: 'key' | 'value', value: string) => {
    setSpecs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const toggleCompatible = (modelId: string) => {
    setCompatible((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    )
  }

  const toggleConflictPart = (partId: string) => {
    setConflictsWith((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    )
  }

  const removeConflictPart = (partId: string) => {
    setConflictsWith((prev) => prev.filter((id) => id !== partId))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = '请输入配件名称'
    if (!brand.trim()) newErrors.brand = '请输入品牌'
    if (!categoryId) newErrors.categoryId = '请选择分类'
    if (!sku.trim()) newErrors.sku = '请输入SKU编码'

    if (price === '' || Number(price) < 0) newErrors.price = '请输入有效的售价'
    if (stock === '' || Number(stock) < 0) newErrors.stock = '请输入有效的库存数量'

    if (!image.trim()) newErrors.image = '请输入图片URL'
    if (!description.trim()) newErrors.description = '请输入配件描述'

    const specsMap: Record<string, boolean> = {}
    for (const spec of specs) {
      if (spec.key.trim() || spec.value.trim()) {
        if (!spec.key.trim()) {
          newErrors.specs = '规格键名不能为空'
          break
        }
        if (!spec.value.trim()) {
          newErrors.specs = '规格值不能为空'
          break
        }
        if (specsMap[spec.key.trim()]) {
          newErrors.specs = '规格键名不能重复'
          break
        }
        specsMap[spec.key.trim()] = true
      }
    }

    if (position.x < 0 || position.x > 100) newErrors.position = 'X坐标必须在0-100之间'
    else if (position.y < 0 || position.y > 100) newErrors.position = 'Y坐标必须在0-100之间'
    else if (position.width <= 0 || position.width > 100) newErrors.position = '宽度必须在0-100之间'
    else if (position.height <= 0 || position.height > 100) newErrors.position = '高度必须在0-100之间'
    else if (position.x + position.width > 100) newErrors.position = 'X坐标+宽度不能超过100'
    else if (position.y + position.height > 100) newErrors.position = 'Y坐标+高度不能超过100'

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.brand || newErrors.categoryId || newErrors.sku) {
        setActiveTab('basic')
      } else if (newErrors.price || newErrors.stock) {
        setActiveTab('price')
      } else if (newErrors.image || newErrors.description) {
        setActiveTab('content')
      } else if (newErrors.specs) {
        setActiveTab('specs')
      } else if (newErrors.position) {
        setActiveTab('position')
      }
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)

    const specsRecord: Record<string, string> = {}
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specsRecord[s.key.trim()] = s.value.trim()
      }
    })

    const baseData = {
      name: name.trim(),
      brand: brand.trim(),
      categoryId,
      sku: sku.trim(),
      price: Number(price),
      originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      stock: Number(stock),
      image: image.trim(),
      description: description.trim(),
      specs: specsRecord,
      compatible,
      conflictsWith,
      position,
      status,
    }

    const data: CreatePartRequest | UpdatePartRequest = isEditMode
      ? baseData
      : (baseData as CreatePartRequest)

    await onSubmit(data)
    setSubmitting(false)
  }

  if (!isOpen) return null

  const getPartName = (partId: string) => {
    if (!Array.isArray(allParts)) return partId
    const part = allParts.find((p: any) => p.id === partId)
    return part?.name || partId
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
        <div className="sticky top-0 bg-carbon-800 z-10 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-moto-orange" size={20} />
            <div>
              <h2 className="font-orbitron text-lg text-moto-silver">
                {isEditMode ? '编辑配件' : '新增配件'}
              </h2>
              <p className="text-xs text-moto-steel mt-0.5">
                {isEditMode ? '修改配件信息并保存' : '填写配件信息并提交'}
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

        <div className="flex border-b border-carbon-500/20 px-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-orbitron whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-moto-orange text-moto-orange'
                  : 'border-transparent text-moto-steel hover:text-moto-silver'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <Package size={10} className="inline mr-1" />
                    配件名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setErrors((prev) => ({ ...prev, name: '' }))
                    }}
                    placeholder="请输入配件名称"
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
                    <Tag size={10} className="inline mr-1" />
                    品牌 <span className="text-red-400">*</span>
                  </label>
                  {brands.length > 0 ? (
                    <div className="relative">
                      <select
                        value={brand}
                        onChange={(e) => {
                          setBrand(e.target.value)
                          setErrors((prev) => ({ ...prev, brand: '' }))
                        }}
                        className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 transition-colors appearance-none pr-8 ${
                          errors.brand
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                        }`}
                      >
                        <option value="">请选择品牌</option>
                        {brands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value)
                        setErrors((prev) => ({ ...prev, brand: '' }))
                      }}
                      placeholder="请输入品牌"
                      className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.brand
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                  )}
                  {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <Tag size={10} className="inline mr-1" />
                    SKU编码 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value)
                      setErrors((prev) => ({ ...prev, sku: '' }))
                    }}
                    placeholder="请输入SKU编码"
                    className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                      errors.sku
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                    }`}
                  />
                  {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <List size={10} className="inline mr-1" />
                    所属分类 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value)
                      setErrors((prev) => ({ ...prev, categoryId: '' }))
                    }}
                    className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 transition-colors appearance-none ${
                      errors.categoryId
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                    }`}
                  >
                    <option value="">请选择分类</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-400 text-xs mt-1">{errors.categoryId}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'price' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <Tag size={10} className="inline mr-1" />
                    售价 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel text-sm">¥</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value === '' ? '' : Number(e.target.value))
                        setErrors((prev) => ({ ...prev, price: '' }))
                      }}
                      placeholder="0.00"
                      className={`w-full pl-7 pr-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.price
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                  </div>
                  {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <Tag size={10} className="inline mr-1" />
                    原价（可选）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel text-sm">¥</span>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) =>
                        setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <Tag size={10} className="inline mr-1" />
                    成本价（可选）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel text-sm">¥</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) =>
                        setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    <List size={10} className="inline mr-1" />
                    库存数量 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => {
                      setStock(e.target.value === '' ? '' : Number(e.target.value))
                      setErrors((prev) => ({ ...prev, stock: '' }))
                    }}
                    placeholder="0"
                    className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                      errors.stock
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                    }`}
                  />
                  {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock}</p>}
                </div>
              </div>

              {originalPrice !== '' && price !== '' && Number(originalPrice) > Number(price) && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-xs text-green-400">
                    折扣: {((1 - Number(price) / Number(originalPrice)) * 100).toFixed(1)}% 优惠
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <Image size={10} className="inline mr-1" />
                  商品图片 <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-carbon-700/50 border border-carbon-500/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {image ? (
                      <img
                        src={image}
                        alt="preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Image size={32} className="text-carbon-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value)
                        setErrors((prev) => ({ ...prev, image: '' }))
                      }}
                      placeholder="请输入图片URL"
                      className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.image
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                    {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image}</p>}
                    <p className="text-xs text-moto-steel mt-2">
                      建议尺寸: 400x400px，支持 JPG/PNG/SVG 格式
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <FileText size={10} className="inline mr-1" />
                  配件描述 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setErrors((prev) => ({ ...prev, description: '' }))
                  }}
                  placeholder="请输入配件描述，包括功能特点、适用场景等..."
                  rows={6}
                  className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors resize-none ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-moto-steel mt-1 text-right">
                  {description.length} 字
                </p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-moto-steel">
                  添加配件的规格参数，如材质、尺寸、重量等
                </p>
                <button
                  onClick={addSpecRow}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-moto-orange hover:text-moto-orange-light transition-colors"
                >
                  <Plus size={12} />
                  添加规格
                </button>
              </div>

              {errors.specs && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400">{errors.specs}</p>
                </div>
              )}

              {specs.length === 0 ? (
                <div className="border-2 border-dashed border-carbon-500/30 rounded-lg p-8 text-center">
                  <List size={32} className="text-carbon-500 mx-auto mb-3" />
                  <p className="text-sm text-moto-steel mb-2">暂无规格参数</p>
                  <button
                    onClick={addSpecRow}
                    className="text-xs text-moto-orange hover:text-moto-orange-light transition-colors"
                  >
                    + 添加第一个规格
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {specs.map((spec) => (
                    <div key={spec.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => updateSpecRow(spec.id, 'key', e.target.value)}
                        placeholder="参数名"
                        className="w-32 px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                      />
                      <span className="text-moto-steel text-sm">:</span>
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpecRow(spec.id, 'value', e.target.value)}
                        placeholder="参数值"
                        className="flex-1 px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                      />
                      <button
                        onClick={() => removeSpecRow(spec.id)}
                        className="p-2 text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'compatible' && (
            <div className="space-y-4">
              <p className="text-xs text-moto-steel">
                选择该配件兼容的车型
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {BIKE_MODELS.map((model) => {
                  const isSelected = compatible.includes(model.id)
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleCompatible(model.id)}
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
              <p className="text-xs text-moto-steel">
                已选择 {compatible.length} 个兼容车型
              </p>
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              <p className="text-xs text-moto-steel">
                添加与该配件存在安装冲突的配件
              </p>

              {conflictsWith.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400 font-medium mb-2">
                    已添加 {conflictsWith.length} 个冲突配件
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conflictsWith.map((partId) => (
                      <span
                        key={partId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/30"
                      >
                        {getPartName(partId)}
                        <button
                          onClick={() => removeConflictPart(partId)}
                          className="hover:text-red-300 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={conflictSearch}
                  onChange={(e) => setConflictSearch(e.target.value)}
                  placeholder="搜索配件名称或SKU..."
                  className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                />
              </div>

              <div className="max-h-64 overflow-y-auto border border-carbon-500/30 rounded-lg">
                {filteredConflictParts.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertTriangle size={24} className="text-carbon-500 mx-auto mb-2" />
                    <p className="text-sm text-moto-steel">未找到匹配的配件</p>
                  </div>
                ) : (
                  <div className="divide-y divide-carbon-500/20">
                    {filteredConflictParts.map((part: any) => {
                      const isSelected = conflictsWith.includes(part.id)
                      return (
                        <button
                          key={part.id}
                          onClick={() => toggleConflictPart(part.id)}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-red-500/10'
                              : 'hover:bg-carbon-700/50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-red-500 border-red-500'
                                : 'border-carbon-500/50'
                            }`}
                          >
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-8 h-8 rounded object-cover bg-carbon-700 flex-shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="8">N/A</text></svg>'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-moto-silver truncate">{part.name}</p>
                            <p className="text-[10px] text-moto-steel">{part.sku} · {part.brand}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'position' && (
            <div className="space-y-5">
              <p className="text-xs text-moto-steel">
                设置配件在机车预览图上的标记位置和尺寸
              </p>

              {errors.position && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400">{errors.position}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    X 坐标 (%)
                  </label>
                  <input
                    type="number"
                    value={position.x}
                    onChange={(e) =>
                      setPosition({ ...position, x: Number(e.target.value) })
                    }
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    Y 坐标 (%)
                  </label>
                  <input
                    type="number"
                    value={position.y}
                    onChange={(e) =>
                      setPosition({ ...position, y: Number(e.target.value) })
                    }
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    宽度 (%)
                  </label>
                  <input
                    type="number"
                    value={position.width}
                    onChange={(e) =>
                      setPosition({ ...position, width: Number(e.target.value) })
                    }
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    高度 (%)
                  </label>
                  <input
                    type="number"
                    value={position.height}
                    onChange={(e) =>
                      setPosition({ ...position, height: Number(e.target.value) })
                    }
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                  />
                </div>
              </div>

              <div className="bg-carbon-900/50 rounded-lg p-4 border border-carbon-500/20">
                <p className="text-xs text-moto-steel mb-2">预览</p>
                <div className="relative w-full aspect-video bg-carbon-800 rounded-lg border border-carbon-500/30 overflow-hidden">
                  <div
                    className="absolute bg-moto-orange/30 border-2 border-moto-orange rounded transition-all"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${position.width}%`,
                      height: `${position.height}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-moto-steel mb-2">
                  <Info size={10} className="inline mr-1" />
                  配件状态
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['draft', 'pending_review', 'active', 'inactive', 'rejected'] as PartStatus[]).map((s) => {
                    const labels: Record<PartStatus, string> = {
                      draft: '草稿',
                      pending_review: '待审核',
                      active: '已上架',
                      inactive: '已下架',
                      rejected: '已驳回',
                    }
                    const colors: Record<PartStatus, string> = {
                      draft: 'bg-carbon-600 text-carbon-300 border-carbon-500/30',
                      pending_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                      active: 'bg-green-500/10 text-green-400 border-green-500/30',
                      inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
                      rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
                    }
                    const isSelected = status === s
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? `border-moto-orange ring-1 ring-moto-orange/50 ${colors[s]}`
                            : 'border-carbon-500/30 text-moto-steel hover:border-carbon-500/50'
                        }`}
                      >
                        <p className="text-sm font-medium">{labels[s]}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-carbon-700/50 rounded-lg p-4 border border-carbon-500/20">
                <p className="text-xs text-moto-steel mb-2">状态说明</p>
                <ul className="text-xs text-moto-steel space-y-1">
                  <li><span className="text-carbon-400">草稿：</span>配件信息编辑中，不对外展示</li>
                  <li><span className="text-yellow-400">待审核：</span>提交审核，等待运营人员审核</li>
                  <li><span className="text-green-400">已上架：</span>审核通过，用户可见可选购</li>
                  <li><span className="text-gray-400">已下架：</span>临时下架，用户不可见</li>
                  <li><span className="text-red-400">已驳回：</span>审核未通过，需要修改后重新提交</li>
                </ul>
              </div>
            </div>
          )}
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
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check size={14} />
                  {isEditMode ? '保存修改' : '创建配件'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
