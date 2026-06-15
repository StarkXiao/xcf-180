import { useState } from 'react'
import { useStore } from '@/store/useStore'
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  ChevronRight,
  DollarSign,
  Calendar,
  Flag,
  Tag,
  Sparkles,
} from 'lucide-react'
import {
  REQUIREMENT_TYPE_LABELS,
  REQUIREMENT_PRIORITY_LABELS,
  REQUIREMENT_PRIORITY_COLORS,
  type RequirementType,
  type RequirementPriority,
  type CreateRequirementRequest,
} from '@/types'

const TYPE_OPTIONS: { value: RequirementType; label: string; icon: string }[] = [
  { value: 'appearance', label: '外观改装', icon: '🎨' },
  { value: 'performance', label: '性能提升', icon: '⚡' },
  { value: 'comfort', label: '舒适升级', icon: '🛋️' },
  { value: 'safety', label: '安全强化', icon: '🛡️' },
  { value: 'audio', label: '音响系统', icon: '🔊' },
  { value: 'lighting', label: '灯光升级', icon: '💡' },
  { value: 'other', label: '其他需求', icon: '📋' },
]

const PRIORITY_OPTIONS: { value: RequirementPriority; label: string }[] = [
  { value: 'low', label: '低优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'urgent', label: '紧急' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
  { value: 'confirmed', label: '已确认', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'in_progress', label: '进行中', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { value: 'completed', label: '已完成', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  { value: 'cancelled', label: '已取消', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
]

interface RequirementItemForm {
  id?: string
  type: RequirementType
  description: string
  priority: RequirementPriority
  budgetMin: string
  budgetMax: string
  preferredBrands: string
  remark: string
}

export default function RequirementRecordPanel() {
  const {
    currentCustomer,
    requirements,
    requirementsLoading,
    currentRequirement,
    fetchRequirements,
    createRequirement,
    setCurrentRequirement,
    getRequirementsByCustomer,
  } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<RequirementItemForm[]>([
    { type: 'appearance', description: '', priority: 'medium', budgetMin: '', budgetMax: '', preferredBrands: '', remark: '' },
  ])
  const [overallBudgetMin, setOverallBudgetMin] = useState('')
  const [overallBudgetMax, setOverallBudgetMax] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [stylePreference, setStylePreference] = useState('')
  const [usageScenario, setUsageScenario] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [remark, setRemark] = useState('')

  const customerRequirements = currentCustomer
    ? getRequirementsByCustomer(currentCustomer.id)
    : requirements

  const addItem = () => {
    setItems([
      ...items,
      { type: 'appearance', description: '', priority: 'medium', budgetMin: '', budgetMax: '', preferredBrands: '', remark: '' },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof RequirementItemForm, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (!currentCustomer) {
      alert('请先选择客户')
      return
    }

    const validItems = items.filter((item) => item.description.trim())
    if (validItems.length === 0) {
      alert('请至少填写一条需求描述')
      return
    }

    const data: CreateRequirementRequest = {
      customerId: currentCustomer.id,
      items: validItems.map((item) => ({
        type: item.type,
        description: item.description,
        priority: item.priority,
        budgetRange:
          item.budgetMin || item.budgetMax
            ? {
                min: parseFloat(item.budgetMin) || 0,
                max: parseFloat(item.budgetMax) || parseFloat(item.budgetMin) || 0,
              }
            : undefined,
        preferredBrands: item.preferredBrands
          ? item.preferredBrands.split(',').map((b) => b.trim()).filter(Boolean)
          : [],
        remark: item.remark || undefined,
      })),
      overallBudget:
        overallBudgetMin || overallBudgetMax
          ? {
              min: parseFloat(overallBudgetMin) || 0,
              max: parseFloat(overallBudgetMax) || parseFloat(overallBudgetMin) || 0,
            }
          : undefined,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      stylePreference: stylePreference || undefined,
      usageScenario: usageScenario || undefined,
      specialRequirements: specialRequirements || undefined,
      remark: remark || undefined,
    }

    await createRequirement(data)
    resetForm()
    fetchRequirements()
  }

  const resetForm = () => {
    setShowForm(false)
    setItems([
      { type: 'appearance', description: '', priority: 'medium', budgetMin: '', budgetMax: '', preferredBrands: '', remark: '' },
    ])
    setOverallBudgetMin('')
    setOverallBudgetMax('')
    setExpectedDeliveryDate('')
    setStylePreference('')
    setUsageScenario('')
    setSpecialRequirements('')
    setRemark('')
  }

  return (
    <div className="h-full flex flex-col">
      {!currentCustomer ? (
        <div className="flex-1 flex flex-col items-center justify-center text-moto-steel">
          <FileText size={64} className="mb-4 opacity-20" />
          <p className="text-lg mb-2">请先选择客户</p>
          <p className="text-sm opacity-60">在「客户建档」中选择客户后再创建需求记录</p>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
            <div>
              <h3 className="font-orbitron text-lg text-moto-silver font-bold">
                {currentCustomer.name} 的需求记录
              </h3>
              <p className="text-xs text-moto-steel mt-0.5">
                共 {customerRequirements.length} 条需求
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
                showForm
                  ? 'bg-carbon-700 text-moto-silver hover:bg-carbon-600'
                  : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30 hover:bg-moto-orange/20'
              }`}
            >
              {showForm ? (
                <>
                  <X size={16} />
                  取消
                </>
              ) : (
                <>
                  <Plus size={16} />
                  新建需求
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {showForm && (
              <div className="w-96 shrink-0 border-r border-carbon-500/30 overflow-y-auto p-4">
                <h4 className="font-orbitron text-moto-silver font-semibold mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-moto-orange" />
                  新建需求记录
                </h4>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-moto-steel mb-2">需求明细</label>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="p-3 bg-carbon-800/50 rounded-lg border border-carbon-500/20 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-moto-steel font-medium">
                              需求 #{index + 1}
                            </span>
                            {items.length > 1 && (
                              <button
                                onClick={() => removeItem(index)}
                                className="p-1 text-moto-steel hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={item.type}
                              onChange={(e) => updateItem(index, 'type', e.target.value)}
                              className="bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                            >
                              {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.icon} {opt.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={item.priority}
                              onChange={(e) => updateItem(index, 'priority', e.target.value)}
                              className="bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                            >
                              {PRIORITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50 resize-none"
                            placeholder="请描述具体需求..."
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={item.budgetMin}
                              onChange={(e) => updateItem(index, 'budgetMin', e.target.value)}
                              placeholder="预算最低"
                              className="bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                            />
                            <input
                              type="number"
                              value={item.budgetMax}
                              onChange={(e) => updateItem(index, 'budgetMax', e.target.value)}
                              placeholder="预算最高"
                              className="bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                            />
                          </div>
                          <input
                            type="text"
                            value={item.preferredBrands}
                            onChange={(e) => updateItem(index, 'preferredBrands', e.target.value)}
                            placeholder="偏好品牌（多个用逗号分隔）"
                            className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addItem}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-carbon-500/30 rounded-lg text-xs text-moto-steel hover:text-moto-orange hover:border-moto-orange/30 transition-colors"
                    >
                      <Plus size={14} />
                      添加一条需求
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                      <DollarSign size={12} />
                      整体预算范围（元）
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={overallBudgetMin}
                        onChange={(e) => setOverallBudgetMin(e.target.value)}
                        placeholder="最低"
                        className="flex-1 bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                      />
                      <span className="text-moto-steel">~</span>
                      <input
                        type="number"
                        value={overallBudgetMax}
                        onChange={(e) => setOverallBudgetMax(e.target.value)}
                        placeholder="最高"
                        className="flex-1 bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                      <Calendar size={12} />
                      期望交付日期
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                      <Tag size={12} />
                      风格偏好
                    </label>
                    <input
                      type="text"
                      value={stylePreference}
                      onChange={(e) => setStylePreference(e.target.value)}
                      placeholder="如：赛道风格、复古风格、简约风格等"
                      className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">使用场景</label>
                    <input
                      type="text"
                      value={usageScenario}
                      onChange={(e) => setUsageScenario(e.target.value)}
                      placeholder="如：日常通勤、赛道日、长途旅行等"
                      className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">特殊要求</label>
                    <textarea
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      rows={2}
                      placeholder="其他特殊需求或注意事项"
                      className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">备注</label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      rows={2}
                      placeholder="销售顾问备注"
                      className="w-full bg-carbon-800 rounded-lg px-2.5 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-moto-orange text-white rounded-lg text-xs hover:bg-moto-orange/90 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      保存需求
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {requirementsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-carbon-800 rounded-xl border border-carbon-500/20 animate-pulse"
                    />
                  ))}
                </div>
              ) : customerRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-moto-steel">
                  <FileText size={56} className="mb-4 opacity-20" />
                  <p className="text-lg mb-2">暂无需求记录</p>
                  <p className="text-sm opacity-60 mb-4">点击右上角「新建需求」开始记录客户需求</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerRequirements
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((req) => {
                      const statusConfig = STATUS_OPTIONS.find(
                        (s) => s.value === req.status
                      ) || STATUS_OPTIONS[0]
                      return (
                        <div
                          key={req.id}
                          onClick={() => setCurrentRequirement(req)}
                          className={`bg-carbon-800/50 rounded-xl border p-5 transition-all cursor-pointer hover:shadow-lg hover:shadow-black/20 ${
                            currentRequirement?.id === req.id
                              ? 'border-moto-orange/50 ring-1 ring-moto-orange/30'
                              : 'border-carbon-500/20 hover:border-carbon-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-moto-silver">
                                  需求记录 #{req.id.slice(-4)}
                                </h4>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border ${statusConfig.color}`}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>
                              <p className="text-xs text-moto-steel">
                                创建于 {new Date(req.createdAt).toLocaleString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-moto-steel">
                              <Edit3 size={14} />
                              <ChevronRight size={16} />
                            </div>
                          </div>

                          {req.overallBudget && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full text-xs mb-3">
                              <DollarSign size={12} />
                              预算 ¥{req.overallBudget.min.toLocaleString()} ~ ¥
                              {req.overallBudget.max.toLocaleString()}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {req.items.slice(0, 4).map((item) => (
                              <span
                                key={item.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                  REQUIREMENT_PRIORITY_COLORS[item.priority]
                                }`}
                              >
                                <Flag size={8} />
                                {REQUIREMENT_TYPE_LABELS[item.type]}
                              </span>
                            ))}
                            {req.items.length > 4 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-carbon-700 text-moto-steel rounded text-[10px]">
                                +{req.items.length - 4} 项
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-carbon-500/20 text-xs text-moto-steel">
                            {req.stylePreference && (
                              <div className="flex items-center gap-1.5">
                                <Tag size={11} />
                                <span>{req.stylePreference}</span>
                              </div>
                            )}
                            {req.usageScenario && (
                              <div className="flex items-center gap-1.5">
                                <Sparkles size={11} />
                                <span>{req.usageScenario}</span>
                              </div>
                            )}
                            {req.expectedDeliveryDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={11} />
                                <span>期望交付: {req.expectedDeliveryDate}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <FileText size={11} />
                              <span>共 {req.items.length} 项需求</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
