import { useState } from 'react'
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
  ChevronDown,
  ChevronUp,
  Wrench,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import type { Part } from '@/types'

interface BudgetItem {
  id: string
  name: string
  category: string
  unitPrice: number
  quantity: number
  laborHours: number
}

const DEFAULT_LABOR_RATES = {
  exhaust: 0.15,
  brake: 0.18,
  wheels: 0.10,
  handlebar: 0.08,
  lighting: 0.05,
  bodykit: 0.12,
}

const LABOR_RATE_HOURLY = 180

export default function BudgetEstimatePanel() {
  const { currentCustomer, laborFeeRates } = useStore()
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', name: '天蝎碳纤维全段排气', category: 'exhaust', unitPrice: 8500, quantity: 1, laborHours: 2.5 },
    { id: '2', name: 'Brembo M40 径向卡钳', category: 'brake', unitPrice: 6800, quantity: 2, laborHours: 3 },
  ])
  const [discount, setDiscount] = useState(5)
  const [depositRatio, setDepositRatio] = useState(30)
  const [showSettings, setShowSettings] = useState(false)
  const [taxRate, setTaxRate] = useState(13)

  const partsTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const laborTotal = items.reduce(
    (sum, item) =>
      sum +
      (laborFeeRates[item.category as keyof typeof laborFeeRates] || DEFAULT_LABOR_RATES.exhaust) *
        item.unitPrice *
        item.quantity +
      item.laborHours * LABOR_RATE_HOURLY * 0.5,
    0
  )
  const subtotal = partsTotal + laborTotal
  const discountAmount = subtotal * (discount / 100)
  const beforeTax = subtotal - discountAmount
  const taxAmount = beforeTax * (taxRate / 100)
  const grandTotal = beforeTax + taxAmount
  const depositAmount = grandTotal * (depositRatio / 100)
  const balanceAmount = grandTotal - depositAmount

  const addItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: '',
      category: 'exhaust',
      unitPrice: 0,
      quantity: 1,
      laborHours: 0,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const categoryOptions = [
    { value: 'exhaust', label: '排气系统', rate: `${(laborFeeRates.exhaust * 100).toFixed(0)}%` },
    { value: 'brake', label: '制动系统', rate: `${(laborFeeRates.brake * 100).toFixed(0)}%` },
    { value: 'wheels', label: '轮组系统', rate: `${(laborFeeRates.wheels * 100).toFixed(0)}%` },
    { value: 'handlebar', label: '操控系统', rate: `${(laborFeeRates.handlebar * 100).toFixed(0)}%` },
    { value: 'lighting', label: '灯光系统', rate: `${(laborFeeRates.lighting * 100).toFixed(0)}%` },
    { value: 'bodykit', label: '外观套件', rate: `${(laborFeeRates.bodykit * 100).toFixed(0)}%` },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
        <div>
          <h3 className="font-orbitron text-lg text-moto-silver font-bold flex items-center gap-2">
            <Calculator size={20} className="text-moto-orange" />
            预算测算
          </h3>
          {currentCustomer && (
            <p className="text-xs text-moto-steel mt-0.5">
              为 {currentCustomer.name} 生成报价方案
            </p>
          )}
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
          <button className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors">
            <Send size={16} />
            发送报价
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
                工时单价 (元/小时)
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
                onClick={addItem}
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
                  {items.map((item) => {
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
                              updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
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
                                updateItem(item.id, 'laborHours', Math.max(0, parseFloat(e.target.value) || 0))
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
                  })}
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

          <div className="p-5 space-y-3">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange/90 transition-colors">
              <CheckCircle2 size={16} />
              生成正式报价单
            </button>
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
