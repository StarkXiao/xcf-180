import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type {
  DiscountRule,
  DiscountRule as DiscountRuleType,
  CreateDiscountRuleRequest,
  UpdateDiscountRuleRequest,
} from '@/types'
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
  Percent,
  Tag,
  BadgePoundSterling,
  Package,
  ShoppingCart,
  X,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react'

const RULE_TYPE_OPTIONS: {
  value: DiscountRule['type']
  label: string
  icon: typeof Percent
  color: string
  bgColor: string
  borderColor: string
}[] = [
  {
    value: 'percentage',
    label: '按订单金额百分比折扣',
    icon: Percent,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    value: 'fixed',
    label: '按订单金额立减',
    icon: BadgePoundSterling,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    value: 'category',
    label: '按分类折扣',
    icon: Tag,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    value: 'brand',
    label: '按品牌折扣',
    icon: ShoppingCart,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  {
    value: 'volume',
    label: '按购买数量折扣',
    icon: Package,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
]

type FilterStatus = 'all' | 'active'

export default function AdminDiscountRulesPage() {
  const {
    discountRules,
    discountRulesLoading,
    categories,
    fetchDiscountRules,
    fetchCategories,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<DiscountRuleType | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingRule, setDeletingRule] = useState<DiscountRuleType | null>(null)

  const [formData, setFormData] = useState<CreateDiscountRuleRequest>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minAmount: undefined,
    maxAmount: undefined,
    categoryId: undefined,
    brand: '',
    minQuantity: undefined,
    priority: 0,
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchDiscountRules(), fetchCategories()])
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = useMemo(() => {
    let result = [...discountRules]
    if (filterStatus === 'active') {
      result = result.filter((r) => r.isActive)
    }
    return result.sort((a, b) => a.priority - b.priority)
  }, [discountRules, filterStatus])

  const getRuleTypeInfo = (type: DiscountRule['type']) => {
    return RULE_TYPE_OPTIONS.find((o) => o.value === type) || RULE_TYPE_OPTIONS[0]
  }

  const formatRuleValue = (rule: DiscountRule): string => {
    switch (rule.type) {
      case 'percentage':
        return `${rule.value}折`
      case 'fixed':
        return `立减${rule.value.toLocaleString()}元`
      case 'category': {
        const cat = categories.find((c) => c.id === rule.categoryId)
        return `${cat?.name || rule.categoryId}分类${rule.value}折`
      }
      case 'brand':
        return `${rule.brand}品牌${rule.value}折`
      case 'volume':
        return `${rule.value}折`
      default:
        return `${rule.value}`
    }
  }

  const formatCondition = (rule: DiscountRule): string => {
    switch (rule.type) {
      case 'percentage':
      case 'fixed': {
        if (rule.minAmount != null && rule.maxAmount != null) {
          return `满${rule.minAmount.toLocaleString()}元 - ${rule.maxAmount.toLocaleString()}元`
        } else if (rule.minAmount != null) {
          return `满${rule.minAmount.toLocaleString()}元`
        } else if (rule.maxAmount != null) {
          return `不超过${rule.maxAmount.toLocaleString()}元`
        }
        return '无限制'
      }
      case 'category': {
        const cat = categories.find((c) => c.id === rule.categoryId)
        return cat?.name || rule.categoryId || '未指定分类'
      }
      case 'brand':
        return rule.brand || '未指定品牌'
      case 'volume':
        return `满${rule.minQuantity || 0}件`
      default:
        return '无限制'
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minAmount: undefined,
      maxAmount: undefined,
      categoryId: undefined,
      brand: '',
      minQuantity: undefined,
      priority: 0,
      isActive: true,
    })
  }

  const openCreateModal = () => {
    setEditingRule(null)
    resetForm()
    setIsFormModalOpen(true)
  }

  const openEditModal = (rule: DiscountRuleType) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description || '',
      type: rule.type,
      value: rule.value,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount,
      categoryId: rule.categoryId,
      brand: rule.brand || '',
      minQuantity: rule.minQuantity,
      priority: rule.priority,
      isActive: rule.isActive,
    })
    setIsFormModalOpen(true)
  }

  const openDeleteModal = (rule: DiscountRuleType) => {
    setDeletingRule(rule)
    setIsDeleteModalOpen(true)
  }

  const handleToggleActive = async (rule: DiscountRuleType) => {
    try {
      await updateDiscountRule(rule.id, { isActive: !rule.isActive })
    } catch (e) {
      console.error('Failed to toggle rule:', e)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      const requestData: CreateDiscountRuleRequest = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        brand: formData.type === 'brand' ? formData.brand?.trim() || undefined : undefined,
        categoryId: formData.type === 'category' ? formData.categoryId : undefined,
        minAmount:
          formData.type === 'percentage' || formData.type === 'fixed'
            ? formData.minAmount
            : undefined,
        maxAmount:
          formData.type === 'percentage' || formData.type === 'fixed'
            ? formData.maxAmount
            : undefined,
        minQuantity: formData.type === 'volume' ? formData.minQuantity : undefined,
      }

      if (editingRule) {
        const updateData: UpdateDiscountRuleRequest = { ...requestData }
        await updateDiscountRule(editingRule.id, updateData)
      } else {
        await createDiscountRule(requestData)
      }

      setIsFormModalOpen(false)
      setEditingRule(null)
    } catch (e) {
      console.error('Failed to save rule:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRule) return
    setSubmitting(true)
    try {
      await deleteDiscountRule(deletingRule.id)
      setIsDeleteModalOpen(false)
      setDeletingRule(null)
    } catch (e) {
      console.error('Failed to delete rule:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            折扣规则管理
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            配置不同类型的折扣规则，自动应用于报价单
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
        >
          <Plus size={14} />
          新增规则
        </button>
      </div>

      <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-moto-steel mr-2">状态筛选：</span>
          <div className="flex items-center bg-carbon-900 rounded-lg p-1 border border-carbon-500/30">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'all'
                  ? 'bg-moto-orange/20 text-moto-orange'
                  : 'text-moto-steel hover:text-moto-silver'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'active'
                  ? 'bg-moto-orange/20 text-moto-orange'
                  : 'text-moto-steel hover:text-moto-silver'
              }`}
            >
              仅启用
            </button>
          </div>
          <span className="text-xs text-moto-steel ml-2">
            共 {filteredRules.length} 条规则
          </span>
        </div>
      </div>

      {loading || discountRulesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-5 bg-carbon-700 rounded w-32" />
                <div className="h-4 bg-carbon-700 rounded w-48" />
                <div className="h-8 bg-carbon-700 rounded w-24" />
                <div className="h-4 bg-carbon-700 rounded w-40" />
                <div className="h-4 bg-carbon-700 rounded w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
          <Settings size={64} className="text-carbon-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-moto-silver text-xl mb-2">
            {filterStatus === 'active' ? '没有启用的折扣规则' : '暂无折扣规则'}
          </h2>
          <p className="text-moto-steel text-sm mb-6">
            点击右上角按钮创建第一个折扣规则
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors"
          >
            新增规则
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => {
            const typeInfo = getRuleTypeInfo(rule.type)
            const TypeIcon = typeInfo.icon
            return (
              <div
                key={rule.id}
                className={`bg-carbon-800 rounded-xl border p-5 transition-all hover:shadow-lg hover:shadow-black/20 ${
                  rule.isActive
                    ? 'border-carbon-500/20 hover:border-moto-orange/40'
                    : 'border-carbon-500/10 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bgColor} ${typeInfo.color}`}
                    >
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-moto-silver font-medium">
                        {rule.name}
                      </h3>
                      <p className="text-xs text-moto-steel line-clamp-1">
                        {rule.description || '暂无描述'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`transition-colors ${
                      rule.isActive ? 'text-green-400' : 'text-carbon-500'
                    }`}
                    title={rule.isActive ? '点击停用' : '点击启用'}
                  >
                    {rule.isActive ? (
                      <ToggleRight size={24} />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor}`}
                  >
                    <TypeIcon size={10} />
                    {typeInfo.label}
                  </span>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-moto-steel">规则值：</span>
                    <span className="text-moto-silver font-medium">
                      {formatRuleValue(rule)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-moto-steel">生效条件：</span>
                    <span className="text-moto-silver">{formatCondition(rule)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-moto-steel">优先级：</span>
                    <span className="text-moto-silver font-mono">{rule.priority}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-carbon-500/20">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                  >
                    <Edit2 size={12} />
                    编辑
                  </button>
                  <button
                    onClick={() => openDeleteModal(rule)}
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
      )}

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsFormModalOpen(false)
              setEditingRule(null)
            }}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h2 className="font-orbitron text-lg text-moto-silver">
                {editingRule ? '编辑规则' : '新增规则'}
              </h2>
              <button
                onClick={() => {
                  setIsFormModalOpen(false)
                  setEditingRule(null)
                }}
                className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
              <div>
                <label className="block text-sm text-moto-steel mb-1.5">
                  规则名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入规则名称"
                  className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-moto-steel mb-1.5">规则描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入规则描述（可选）"
                  rows={2}
                  className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-moto-steel mb-1.5">
                  规则类型 <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RULE_TYPE_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: opt.value })
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                          formData.type === opt.value
                            ? `${opt.bgColor} ${opt.color} border ${opt.borderColor}`
                            : 'bg-carbon-700 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver border border-transparent'
                        }`}
                      >
                        <OptIcon size={12} />
                        {opt.label.replace('按', '').replace('折扣', '')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(formData.type === 'percentage' || formData.type === 'fixed') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-moto-steel mb-1.5">
                        最小金额（元）
                      </label>
                      <input
                        type="number"
                        value={formData.minAmount ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-moto-steel mb-1.5">
                        最大金额（元）
                      </label>
                      <input
                        type="number"
                        value={formData.maxAmount ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="不限制"
                        className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      {formData.type === 'percentage'
                        ? '折扣值（如 95 表示95折）'
                        : '立减金额（元）'}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.value || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, value: Number(e.target.value) })
                      }
                      placeholder={
                        formData.type === 'percentage' ? '95' : '2000'
                      }
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                </>
              )}

              {formData.type === 'category' && (
                <>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      选择分类 <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoryId: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors cursor-pointer"
                    >
                      <option value="" className="bg-carbon-800">
                        请选择分类
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-carbon-800">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      折扣百分比（如 90 表示9折） <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.value || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, value: Number(e.target.value) })
                      }
                      placeholder="90"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                </>
              )}

              {formData.type === 'brand' && (
                <>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      品牌名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.brand || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="如：Akrapovic"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      折扣百分比（如 90 表示9折） <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.value || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, value: Number(e.target.value) })
                      }
                      placeholder="90"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                </>
              )}

              {formData.type === 'volume' && (
                <>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      最小购买数量 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.minQuantity ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minQuantity: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="5"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1.5">
                      折扣百分比（如 90 表示9折） <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.value || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, value: Number(e.target.value) })
                      }
                      placeholder="90"
                      className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-moto-steel mb-1.5">优先级</label>
                  <input
                    type="number"
                    value={formData.priority ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-carbon-900 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, isActive: !formData.isActive })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors w-full justify-center ${
                      formData.isActive
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-carbon-700 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
                    }`}
                  >
                    {formData.isActive ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    {formData.isActive ? '已启用' : '已停用'}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-carbon-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsFormModalOpen(false)
                  setEditingRule(null)
                }}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-moto-orange/20"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {editingRule ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingRule && (
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
              <p className="text-sm text-moto-silver mb-2">即将删除以下规则：</p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRuleTypeInfo(deletingRule.type).bgColor} ${getRuleTypeInfo(deletingRule.type).color}`}
                >
                  {(() => {
                    const Icon = getRuleTypeInfo(deletingRule.type).icon
                    return <Icon size={18} />
                  })()}
                </div>
                <div>
                  <p className="text-sm text-moto-silver font-medium">
                    {deletingRule.name}
                  </p>
                  <p className="text-xs text-moto-steel">
                    {formatRuleValue(deletingRule)}
                  </p>
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
