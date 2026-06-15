import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  Calculator,
  DollarSign,
  TrendingDown,
  Percent,
  Settings,
  FileDown,
  Send,
  Plus,
  Trash2,
  Wrench,
  Tag,
  CheckCircle2,
  Save,
  CalendarClock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { QuoteItem, QuotePlan, Part, ConstructionTask } from '@/types'

const DEFAULT_LABOR_RATES: Record<string, number> = {
  exhaust: 0.15,
  brake: 0.18,
  wheels: 0.10,
  handlebar: 0.08,
  lighting: 0.05,
  bodykit: 0.12,
  default: 0.1,
}

const LABOR_RATE_HOURLY = 180

interface BudgetFormItem {
  id: string
  name: string
  category: string
  unitPrice: number
  quantity: number
  laborHours: number
  partId?: string
}

function quoteItemsToBudgetItems(items: QuoteItem[]): BudgetFormItem[] {
  return items.map((item, idx) => ({
    id: `${item.partId || 'item'}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    partId: item.partId,
    name: item.partName,
    category: item.categoryId || 'default',
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    laborHours: Math.round((item.laborFee / LABOR_RATE_HOURLY) * 10) / 10 || 0,
  }))
}

export default function BudgetEstimatePanel() {
  const {
    currentCustomer,
    currentRequirement,
    laborFeeRates,
    currentQuote,
    createQuoteFromRequirements,
    updateQuoteFull,
    createScheduleFromQuote,
    setReceptionActiveTab,
    setCurrentSchedule,
    allParts,
    currentSchedule,
  } = useStore()

  const combinedRates: Record<string, number> = { ...DEFAULT_LABOR_RATES }
  Object.keys(laborFeeRates).forEach((k) => {
    combinedRates[k] = (laborFeeRates as any)[k]
  })

  const [items, setItems] = useState<BudgetFormItem[]>(() => {
    const plan = currentQuote?.plans?.find((p: QuotePlan) => p.id === currentQuote?.activePlanId)
      || currentQuote?.plans?.[0]
    if (plan?.items && plan.items.length > 0) {
      return quoteItemsToBudgetItems(plan.items)
    }
    return []
  })

  const [discount, setDiscount] = useState(currentQuote?.discountRate ?? 0)
  const [depositRatio, setDepositRatio] = useState(currentQuote?.depositRatio ?? 30)
  const [showSettings, setShowSettings] = useState(false)
  const [taxRate, setTaxRate] = useState(currentQuote?.taxRate ?? 13)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [scheduleExpanded, setScheduleExpanded] = useState(true)

  const categoryOptions = [
    { value: 'exhaust', label: '排气系统', rate: `${((combinedRates.exhaust || 0.15) * 100).toFixed(0)}%` },
    { value: 'brake', label: '制动系统', rate: `${((combinedRates.brake || 0.18) * 100).toFixed(0)}%` },
    { value: 'wheels', label: '轮组系统', rate: `${((combinedRates.wheels || 0.1) * 100).toFixed(0)}%` },
    { value: 'handlebar', label: '操控系统', rate: `${((combinedRates.handlebar || 0.08) * 100).toFixed(0)}%` },
    { value: 'lighting', label: '灯光系统', rate: `${((combinedRates.lighting || 0.05) * 100).toFixed(0)}%` },
    { value: 'bodykit', label: '外观套件', rate: `${((combinedRates.bodykit || 0.12) * 100).toFixed(0)}%` },
    { value: 'default', label: '其他配件', rate: `${((combinedRates.default || 0.1) * 100).toFixed(0)}%` },
  ]

  const partsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  )
  const laborTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (combinedRates[item.category] || combinedRates.default) *
            item.unitPrice *
            item.quantity +
          item.laborHours * LABOR_RATE_HOURLY * 0.5,
        0
      ),
    [items, combinedRates]
  )
  const subtotal = partsTotal + laborTotal
  const discountAmount = subtotal * (discount / 100)
  const beforeTax = subtotal - discountAmount
  const taxAmount = beforeTax * (taxRate / 100)
  const grandTotal = beforeTax + taxAmount
  const depositAmount = grandTotal * (depositRatio / 100)
  const balanceAmount = grandTotal - depositAmount

  const addItem = (part?: Part) => {
    const newItem: BudgetFormItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      partId: part?.id,
      name: part?.name || '',
      category: part?.categoryId || 'default',
      unitPrice: part?.price || 0,
      quantity: 1,
      laborHours: 0,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof BudgetFormItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeItem = (id: string) => {
    if (items.length > 0) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const buildQuoteItems = (): QuoteItem[] => {
    return items.map((item, idx) => {
      const rate = combinedRates[item.category] || combinedRates.default
      const laborFee =
        rate * item.unitPrice * item.quantity +
        item.laborHours * LABOR_RATE_HOURLY * 0.5
      const cat = categoryOptions.find((c) => c.value === item.category)
      return {
        partId: item.partId || `gen_${idx}`,
        partName: item.name || '未命名配件',
        partBrand: '',
        partImage: '',
        categoryId: item.category,
        categoryName: cat?.label || '其他',
        originalPrice: item.unitPrice,
        unitPrice: item.unitPrice,
        discountRate: 1,
        quantity: item.quantity,
        laborFee: Math.round(laborFee * 100) / 100,
        subtotal: Math.round((item.unitPrice * item.quantity + laborFee) * 100) / 100,
      }
    })
  }

  const handleSave = async () => {
    if (!currentCustomer) {
      alert('请先在「客户建档」中选择客户')
      setReceptionActiveTab('customer')
      return
    }
    if (items.length === 0) {
      alert('请至少添加一项报价内容')
      return
    }
    setSaving(true)
    try {
      const quoteItems = buildQuoteItems()
      const planItems = quoteItems
      const partsTotalCalc = planItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      const laborTotalCalc = planItems.reduce((s, i) => s + i.laborFee, 0)
      const discountCalc = (partsTotalCalc + laborTotalCalc) * (discount / 100)
      const beforeT = partsTotalCalc + laborTotalCalc - discountCalc
      const taxCalc = beforeT * (taxRate / 100)
      const totalAmount = beforeT + taxCalc

      if (currentQuote) {
        await updateQuoteFull(currentQuote.id, {
          items: quoteItems,
          discountRate: discount,
          taxRate,
          depositRatio,
          remark: currentRequirement?.remark,
        })
        alert('报价已更新保存！')
      } else {
        const planId = `plan_${Date.now()}`
        const now = new Date().toISOString()
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 7)

        await createQuoteFromRequirements({
          customerId: currentCustomer.id,
          customerName: currentCustomer.name,
          customerContact: currentCustomer.contact || currentCustomer.name,
          customerPhone: currentCustomer.phone,
          customerEmail: currentCustomer.email,
          modelId: 'xcf-180',
          packageType: null,
          requirementId: currentRequirement?.id,
          plans: [
            {
              id: planId,
              name: '标准方案',
              description: currentRequirement?.usageScenario || '门店接待方案',
              items: planItems,
              partsTotal: partsTotalCalc,
              laborFeeTotal: laborTotalCalc,
              discountTotal: discountCalc,
              totalAmount,
              isDefault: true,
              appliedDiscountRules: [],
            } as any,
          ],
          items: quoteItems,
          discountRate: discount,
          taxRate,
          depositRatio,
          remark: currentRequirement?.remark,
          validUntil: validUntil.toISOString(),
        })
        alert('报价创建成功！')
      }
    } catch (e) {
      console.error(e)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!currentCustomer) {
      alert('请先选择客户')
      return
    }
    if (!currentQuote) {
      alert('请先保存报价单，再生成施工排期')
      return
    }
    setCreating(true)
    try {
      const schedule = await createScheduleFromQuote({
        quoteId: currentQuote.id,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        quoteNo: currentQuote.quoteNo,
        totalAmount: grandTotal,
        autoGenerateTasks: true,
        remark: currentRequirement?.remark,
      })
      if (schedule) {
        setCurrentSchedule(schedule)
        alert(`施工排期「${(schedule as any).scheduleNo || schedule.id}」创建成功！`)
        setReceptionActiveTab('schedule')
      }
    } catch (e) {
      console.error(e)
      alert('创建施工排期失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-orbitron text-lg text-moto-silver font-bold flex items-center gap-2">
              <Calculator size={20} className="text-moto-orange" />
              预算测算
            </h3>
            {currentQuote && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-full text-xs font-medium">
                <Tag size={12} />
                {currentQuote.quoteNo}
              </span>
            )}
            {currentQuote?.convertedScheduleId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                <CalendarClock size={12} />
                已生成施工排期
              </span>
            )}
          </div>
          <p className="text-xs text-moto-steel mt-0.5">
            {currentCustomer
              ? `为 ${currentCustomer.name} 生成报价方案`
              : '请先在「客户建档」中选择客户'}
            {currentRequirement && ` · 关联需求 #${currentRequirement.id.slice(-4)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              showSettings
                ? 'bg-carbon-700 text-moto-silver'
                : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-800'
            }`}
          >
            <Settings size={16} />
            参数设置
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg text-sm transition-colors">
            <FileDown size={16} />
            导出
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg text-sm transition-colors">
            <Send size={16} />
            发送报价
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '保存中...' : currentQuote ? '更新报价' : '保存报价'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 bg-carbon-800/30 border-b border-carbon-500/30">
          <div className="grid grid-cols-4 gap-4 max-w-4xl">
            <div>
              <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                <Percent size={11} />
                优惠折扣 (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
              />
            </div>
            <div>
              <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                <DollarSign size={11} />
                税率 (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
              />
            </div>
            <div>
              <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                <Percent size={11} />
                定金比例 (%)
              </label>
              <input
                type="number"
                value={depositRatio}
                onChange={(e) =>
                  setDepositRatio(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                }
                className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
              />
            </div>
            <div>
              <label className="block text-xs text-moto-steel mb-1.5 flex items-center gap-1">
                <Wrench size={11} />
                工时单价 (元/h)
              </label>
              <input
                type="number"
                value={LABOR_RATE_HOURLY}
                readOnly
                className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-carbon-800/50 rounded-xl border border-carbon-500/20 overflow-hidden">
            <div className="p-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h4 className="text-sm font-medium text-moto-silver">报价明细</h4>
              <button
                onClick={() => addItem()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-xs hover:bg-moto-orange/20 transition-colors"
              >
                <Plus size={14} />
                添加项目
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-moto-steel bg-carbon-800/50">
                    <th className="px-4 py-3 font-medium">项目名称</th>
                    <th className="px-4 py-3 font-medium w-32">分类</th>
                    <th className="px-4 py-3 font-medium w-28 text-right">单价</th>
                    <th className="px-4 py-3 font-medium w-24 text-center">数量</th>
                    <th className="px-4 py-3 font-medium w-24 text-right">工时</th>
                    <th className="px-4 py-3 font-medium w-28 text-right">小计</th>
                    <th className="px-4 py-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-500/20">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center text-moto-steel">
                          <AlertCircle size={32} className="mb-2 opacity-40" />
                          <p className="text-sm">暂无报价项目</p>
                          <p className="text-xs opacity-60 mt-1">
                            在「现场选配」中选择配件后点击「生成报价」，或点击上方「添加项目」
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const category = categoryOptions.find((c) => c.value === item.category)
                      return (
                        <tr key={item.id} className="text-sm hover:bg-carbon-800/30">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="请输入项目名称"
                              className="w-full bg-transparent text-moto-silver focus:outline-none placeholder:text-carbon-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                              className="w-full bg-carbon-800 rounded px-2 py-1 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none focus:border-moto-orange/50"
                            >
                              {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} ({opt.rate})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-moto-steel mr-1">¥</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                                className="w-20 bg-transparent text-moto-silver text-right focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  'quantity',
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-16 bg-carbon-800 rounded px-2 py-1 border border-carbon-500/20 text-moto-silver text-center text-sm focus:outline-none focus:border-moto-orange/50"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step={0.5}
                                min={0}
                                value={item.laborHours}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    'laborHours',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className="w-14 bg-transparent text-moto-silver text-right focus:outline-none"
                              />
                              <span className="text-moto-steel text-xs">h</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-orbitron text-moto-orange">
                            ¥{(item.unitPrice * item.quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-moto-steel hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-carbon-800/30 rounded-xl border border-carbon-500/20 p-5">
            <h4 className="text-sm font-medium text-moto-silver mb-4">工时费率参考</h4>
            <div className="grid grid-cols-3 gap-3">
              {categoryOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center justify-between p-3 bg-carbon-800 rounded-lg border border-carbon-500/20"
                >
                  <span className="text-sm text-moto-silver">{opt.label}</span>
                  <span className="font-orbitron text-sm text-moto-orange">
                    <Percent size={10} className="inline mr-0.5" />
                    {opt.rate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 shrink-0 border-l border-carbon-500/30 bg-carbon-900/50 overflow-y-auto">
          <div className="p-5 border-b border-carbon-500/30">
            <h4 className="font-orbitron text-moto-silver font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-moto-orange" />
              费用汇总
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-moto-steel">配件费用</span>
                <span className="font-orbitron text-sm text-moto-silver">
                  ¥{partsTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-moto-steel flex items-center gap-1">
                  <Wrench size={12} />
                  工时费用
                </span>
                <span className="font-orbitron text-sm text-moto-silver">
                  ¥{laborTotal.toFixed(0).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-carbon-500/20 flex items-center justify-between">
                <span className="text-sm text-moto-steel">费用小计</span>
                <span className="font-orbitron text-base text-moto-silver">
                  ¥{subtotal.toFixed(0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-carbon-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-moto-steel flex items-center gap-1">
                  <TrendingDown size={12} />
                  优惠折扣
                </span>
                <span className="text-xs text-moto-orange bg-moto-orange/10 px-1.5 py-0.5 rounded">
                  -{discount}%
                </span>
              </div>
              <span className="font-orbitron text-sm text-green-400">
                -¥{discountAmount.toFixed(0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-moto-steel">税前金额</span>
              <span className="font-orbitron text-sm text-moto-silver">
                ¥{beforeTax.toFixed(0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-moto-steel flex items-center gap-1">
                <Tag size={12} />
                增值税 ({taxRate}%)
              </span>
              <span className="font-orbitron text-sm text-moto-silver">
                ¥{taxAmount.toFixed(0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-5 border-b border-carbon-500/30 bg-gradient-to-r from-moto-orange/10 to-transparent">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-moto-steel">应付总额</span>
              <span className="font-orbitron text-2xl text-moto-orange">
                ¥{grandTotal.toFixed(0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-moto-steel">
              人民币（大写）：
              <span className="text-moto-silver ml-1">
                {Math.floor(grandTotal)} 元整
              </span>
            </p>
          </div>

          <div className="p-5 border-b border-carbon-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-moto-steel">定金 ({depositRatio}%)</span>
              </div>
              <span className="font-orbitron text-base text-moto-silver">
                ¥{depositAmount.toFixed(0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-moto-steel">尾款</span>
              <span className="font-orbitron text-base text-moto-silver">
                ¥{balanceAmount.toFixed(0).toLocaleString()}
              </span>
            </div>
          </div>

          {currentSchedule && (
            <div className="border-b border-carbon-500/30 bg-green-500/5 space-y-3 overflow-hidden">
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-green-400 flex items-center gap-1.5">
                    <CalendarClock size={14} />
                    施工排期
                    <span className="ml-1 text-[10px] text-moto-steel font-normal">
                      ({(currentSchedule as any).scheduleNo || `#${currentSchedule.id.slice(-6)}`})
                    </span>
                  </h5>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScheduleExpanded((v) => !v)}
                      className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
                      title={scheduleExpanded ? '收起详情' : '展开详情'}
                    >
                      {scheduleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => setReceptionActiveTab('schedule')}
                      className="text-[10px] text-green-400 hover:text-green-300 transition-colors"
                    >
                      查看 →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">施工状态</span>
                    <span
                      className={`font-medium ${
                        currentSchedule.status === 'completed'
                          ? 'text-green-400'
                          : currentSchedule.status === 'in_progress'
                          ? 'text-moto-orange'
                          : currentSchedule.status === 'delayed'
                          ? 'text-red-400'
                          : 'text-moto-steel'
                      }`}
                    >
                      {currentSchedule.status === 'completed'
                        ? '已完成'
                        : currentSchedule.status === 'in_progress'
                        ? '进行中'
                        : currentSchedule.status === 'delayed'
                        ? '已延期'
                        : '已排期'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">完成进度</span>
                    <span className="font-orbitron text-moto-orange">
                      {currentSchedule.progress || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">任务总数</span>
                    <span className="text-moto-silver">
                      {currentSchedule.tasks?.length || 0} 项
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel flex items-center gap-1">
                      <Clock size={10} />
                      预计总工时
                    </span>
                    <span className="text-moto-silver font-medium">
                      {(currentSchedule as any).totalEstimatedHours ||
                        (currentSchedule.tasks?.reduce(
                          (s: number, t: ConstructionTask) => s + (t.estimatedHours || 0),
                          0
                        ) || 0)}
                      {' '}h
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${currentSchedule.progress || 0}%` }}
                  />
                </div>
                {currentSchedule.plannedStartDate && (
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-moto-steel">计划工期</span>
                    <span className="text-moto-silver">
                      {new Date(currentSchedule.plannedStartDate).toLocaleDateString('zh-CN')}
                      {' → '}
                      {currentSchedule.plannedEndDate
                        ? new Date(currentSchedule.plannedEndDate).toLocaleDateString('zh-CN')
                        : '-'}
                      {currentSchedule.plannedStartDate && currentSchedule.plannedEndDate && (
                        <span className="text-moto-steel ml-1.5">
                          (
                          {Math.max(
                            1,
                            Math.ceil(
                              (new Date(currentSchedule.plannedEndDate).getTime() -
                                new Date(currentSchedule.plannedStartDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}
                          天)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {currentSchedule.tasks && currentSchedule.tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-500/10">
                    <p className="text-xs text-moto-steel mb-2 flex items-center gap-1">
                      <User size={10} />
                      施工人员分配
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(
                        new Set(
                          currentSchedule.tasks
                            .flatMap((t) => t.assignedWorkerNames || [])
                            .filter(Boolean)
                        )
                      ).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-carbon-700 text-moto-silver rounded text-[11px]"
                        >
                          <User size={9} />
                          {name}
                        </span>
                      ))}
                      {Array.from(
                        new Set(
                          currentSchedule.tasks
                            .flatMap((t) => t.assignedWorkerNames || [])
                            .filter(Boolean)
                        )
                      ).length === 0 && (
                        <span className="text-[11px] text-moto-steel">暂未分配</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {scheduleExpanded && currentSchedule.tasks && currentSchedule.tasks.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[11px] text-moto-steel mb-2 font-medium">任务明细</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {currentSchedule.tasks.map((task: ConstructionTask) => (
                      <div
                        key={task.id}
                        className="bg-carbon-800/60 rounded-lg border border-carbon-500/20 p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  task.status === 'completed'
                                    ? 'bg-green-400'
                                    : task.status === 'in_progress'
                                    ? 'bg-moto-orange'
                                    : task.status === 'blocked' || task.status === 'paused'
                                    ? 'bg-red-400'
                                    : 'bg-moto-steel'
                                }`}
                              />
                              <span className="text-xs text-moto-silver font-medium">
                                {task.name}
                              </span>
                              {task.priority && task.priority !== 'low' && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    task.priority === 'high'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/20'
                                  }`}
                                >
                                  {task.priority === 'high' ? '高优' : '中优'}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-moto-steel mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-moto-steel shrink-0" />
                            <span className="text-moto-steel">工时：</span>
                            <span className="text-moto-silver font-medium">
                              {task.estimatedHours || 0}h
                              {task.actualHours != null && task.actualHours > 0 && (
                                <span className="text-green-400 ml-1">
                                  / {task.actualHours}h 实际
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User size={10} className="text-moto-steel shrink-0" />
                            <span className="text-moto-steel">技师：</span>
                            <span className="text-moto-silver truncate">
                              {task.assignedWorkerNames && task.assignedWorkerNames.length > 0
                                ? task.assignedWorkerNames.join('、')
                                : '未分配'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <CalendarClock size={10} className="text-moto-steel shrink-0" />
                            <span className="text-moto-steel">计划：</span>
                            <span className="text-moto-silver">
                              {task.startDate
                                ? new Date(task.startDate).toLocaleDateString('zh-CN')
                                : '-'}
                              {' → '}
                              {task.endDate
                                ? new Date(task.endDate).toLocaleDateString('zh-CN')
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-5 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange/90 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? '保存中...' : currentQuote ? '更新报价单' : '生成报价单'}
            </button>

            <button
              onClick={handleCreateSchedule}
              disabled={creating || !currentQuote}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600/90 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <CalendarClock size={16} />
              )}
              {creating
                ? '生成中...'
                : currentQuote?.convertedScheduleId || currentSchedule
                ? '查看施工排期'
                : '生成施工排期'}
              <ArrowRight size={14} />
            </button>

            {currentQuote?.convertedScheduleId && (
              <button
                onClick={() => setReceptionActiveTab('schedule')}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                已生成施工排期 → 前往查看
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1 py-2 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors">
                <FileDown size={14} />
                导出PDF
              </button>
              <button className="flex items-center justify-center gap-1 py-2 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors">
                <Send size={14} />
                发送客户
              </button>
            </div>
            <p className="text-[10px] text-moto-steel text-center pt-2">
              报价有效期 7 天 · 最终价格以合同为准
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
