import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { X, ChevronRight, ChevronLeft, User, Phone, FileText, CalendarDays, Percent, AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react'
import type { CreateOrderRequest } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (orderId: string) => void
}

type Step = 'info' | 'quote' | 'confirm'

const STATUS_LABELS: Record<string, string> = {
  pending: '待报价',
  quoted: '已报价',
  confirmed: '已确认',
  in_production: '生产中',
  shipped: '已发货',
  delivered: '已交付',
  completed: '已完成',
  cancelled: '已取消',
}

export default function QuoteConfirmModal({ isOpen, onClose, onSuccess }: Props) {
  const {
    currentSelection,
    currentModelId,
    currentPackageType,
    bikeModels,
    getTotalPrice,
    getTotalLaborFee,
    getGrandTotal,
    getCategoryName,
    allParts,
    categories,
    compatibilityResult,
    laborFeeRates,
    createOrder,
    consumeInventoryForSelection,
  } = useStore()

  const [step, setStep] = useState<Step>('info')
  const [dealerName, setDealerName] = useState('')
  const [dealerContact, setDealerContact] = useState('')
  const [dealerPhone, setDealerPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [discount, setDiscount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalPrice = getTotalPrice()
  const totalLaborFee = getTotalLaborFee()
  const grandTotal = getGrandTotal()
  const finalAmount = grandTotal - discount
  const hasConflicts = (compatibilityResult?.conflicts?.length ?? 0) > 0

  const currentModel = bikeModels.find((m) => m.id === currentModelId)
  const selectedItems = currentSelection?.items ?? []

  const selectedParts = selectedItems
    .map((item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return part ? { part, quantity: item.quantity } : null
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof allParts.find>>; quantity: number }[]

  const groupedByCategory = selectedParts.reduce<Record<string, typeof selectedParts>>((acc, item) => {
    const cat = item.part.categoryId
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const validateInfo = () => {
    const newErrors: Record<string, string> = {}
    if (!dealerName.trim()) newErrors.dealerName = '请输入经销商名称'
    if (!dealerContact.trim()) newErrors.dealerContact = '请输入联系人'
    if (!dealerPhone.trim()) newErrors.dealerPhone = '请输入联系电话'
    else if (!/^1[3-9]\d{9}$/.test(dealerPhone.trim())) newErrors.dealerPhone = '请输入有效的手机号'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 'info') {
      if (!validateInfo()) return
      setStep('quote')
    } else if (step === 'quote') {
      setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'quote') setStep('info')
    else if (step === 'confirm') setStep('quote')
  }

  const handleSubmit = async () => {
    if (!currentSelection || !currentModelId) return
    setSubmitting(true)
    try {
      const data: CreateOrderRequest = {
        selectionId: currentSelection.id,
        dealerName: dealerName.trim(),
        dealerContact: dealerContact.trim(),
        dealerPhone: dealerPhone.trim(),
        modelId: currentModelId,
        packageType: currentPackageType,
        remark: remark.trim() || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        discount: discount > 0 ? discount : undefined,
      }
      const order = await createOrder(data)
      if (order) {
        await consumeInventoryForSelection(currentSelection.id)
        onSuccess(order.id)
      }
    } catch (e) {
      console.error('Failed to create order:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('info')
    setDealerName('')
    setDealerContact('')
    setDealerPhone('')
    setRemark('')
    setExpectedDeliveryDate('')
    setDiscount(0)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: '经销商信息', icon: <User size={14} /> },
    { key: 'quote', label: '报价确认', icon: <FileText size={14} /> },
    { key: 'confirm', label: '提交订单', icon: <CheckCircle2 size={14} /> },
  ]

  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="sticky top-0 bg-carbon-800 z-10 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-orbitron text-lg text-moto-silver">经销商下单</h2>
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-orbitron ${
                    i === stepIndex
                      ? 'bg-moto-orange text-white'
                      : i < stepIndex
                        ? 'bg-moto-orange/20 text-moto-orange'
                        : 'bg-carbon-700 text-moto-steel'
                  }`}>
                    {s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight size={12} className={i < stepIndex ? 'text-moto-orange' : 'text-carbon-500'} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === 'info' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-orbitron text-sm text-moto-silver mb-4">经销商信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">
                      <User size={10} className="inline mr-1" />
                      经销商名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={dealerName}
                      onChange={(e) => { setDealerName(e.target.value); setErrors((prev) => ({ ...prev, dealerName: '' })) }}
                      placeholder="请输入经销商名称"
                      className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.dealerName ? 'border-red-500 focus:ring-red-500' : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                    {errors.dealerName && <p className="text-red-400 text-xs mt-1">{errors.dealerName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">
                      <User size={10} className="inline mr-1" />
                      联系人 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={dealerContact}
                      onChange={(e) => { setDealerContact(e.target.value); setErrors((prev) => ({ ...prev, dealerContact: '' })) }}
                      placeholder="请输入联系人姓名"
                      className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.dealerContact ? 'border-red-500 focus:ring-red-500' : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                    {errors.dealerContact && <p className="text-red-400 text-xs mt-1">{errors.dealerContact}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">
                      <Phone size={10} className="inline mr-1" />
                      联系电话 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={dealerPhone}
                      onChange={(e) => { setDealerPhone(e.target.value); setErrors((prev) => ({ ...prev, dealerPhone: '' })) }}
                      placeholder="请输入手机号"
                      className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                        errors.dealerPhone ? 'border-red-500 focus:ring-red-500' : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                      }`}
                    />
                    {errors.dealerPhone && <p className="text-red-400 text-xs mt-1">{errors.dealerPhone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel mb-1.5">
                      <CalendarDays size={10} className="inline mr-1" />
                      期望交付日期
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <FileText size={10} className="inline mr-1" />
                  订单备注
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="选填，如有特殊要求请在此说明"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {step === 'quote' && (
            <div className="space-y-5">
              <div className="bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart size={14} className="text-moto-orange" />
                  <h3 className="font-orbitron text-sm text-moto-silver">报价明细</h3>
                </div>
                {currentModel && (
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="px-2 py-0.5 bg-moto-orange/10 text-moto-orange rounded border border-moto-orange/20">
                      {currentModel.name}
                    </span>
                    {currentPackageType && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                        {currentPackageType === 'basic' ? '基础版' : currentPackageType === 'sport' ? '运动版' : '街潮版'}
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {Object.entries(groupedByCategory).map(([categoryId, items]) => {
                    const subtotal = items.reduce((sum, { part, quantity }) => sum + part.price * quantity, 0)
                    const laborFee = Math.round(subtotal * (laborFeeRates[categoryId] ?? 0.1))
                    const categoryName = getCategoryName(categoryId)
                    const laborRate = Math.round((laborFeeRates[categoryId] ?? 0.1) * 100)
                    return (
                      <div key={categoryId} className="bg-carbon-700/80 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-orbitron text-moto-silver">{categoryName}</span>
                          <span className="text-xs font-orbitron text-moto-orange">¥{(subtotal + laborFee).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1">
                          {items.map(({ part, quantity }) => (
                            <div key={part.id} className="flex items-center justify-between text-xs">
                              <span className="text-moto-steel truncate flex-1">{part.name} × {quantity}</span>
                              <span className="text-moto-silver ml-2">¥{(part.price * quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-carbon-500/20 flex items-center justify-between text-xs">
                          <span className="text-moto-steel">施工费({laborRate}%)</span>
                          <span className="text-blue-400">¥{laborFee.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Percent size={14} className="text-moto-orange" />
                  <h3 className="font-orbitron text-sm text-moto-silver">折扣设置</h3>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-40 px-3 py-2 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
                    placeholder="0"
                  />
                  <span className="text-moto-steel text-sm">元</span>
                </div>
              </div>

              <div className="bg-carbon-900/50 rounded-xl p-4 border border-carbon-500/20 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-moto-steel">配件总价</span>
                  <span className="text-moto-silver font-orbitron">¥{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-moto-steel">施工费估算</span>
                  <span className="text-blue-400 font-orbitron">¥{totalLaborFee.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-moto-steel">折扣优惠</span>
                    <span className="text-green-400 font-orbitron">-¥{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-carbon-500/20 flex items-center justify-between">
                  <span className="text-moto-silver font-medium">订单总额</span>
                  <span className="font-orbitron text-2xl font-bold text-moto-orange">¥{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              {hasConflicts && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">存在兼容冲突</p>
                    <p className="text-moto-steel text-xs mt-1">当前方案存在 {compatibilityResult!.conflicts.length} 项兼容冲突，建议处理后再提交订单</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
                <h3 className="font-orbitron text-sm text-moto-silver mb-3">经销商信息确认</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-moto-steel text-xs">经销商</span>
                    <p className="text-moto-silver">{dealerName}</p>
                  </div>
                  <div>
                    <span className="text-moto-steel text-xs">联系人</span>
                    <p className="text-moto-silver">{dealerContact}</p>
                  </div>
                  <div>
                    <span className="text-moto-steel text-xs">联系电话</span>
                    <p className="text-moto-silver">{dealerPhone}</p>
                  </div>
                  <div>
                    <span className="text-moto-steel text-xs">期望交付</span>
                    <p className="text-moto-silver">{expectedDeliveryDate || '未指定'}</p>
                  </div>
                </div>
                {remark && (
                  <div className="mt-3 pt-3 border-t border-carbon-500/20">
                    <span className="text-moto-steel text-xs">备注</span>
                    <p className="text-moto-silver text-sm mt-1">{remark}</p>
                  </div>
                )}
              </div>

              <div className="bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
                <h3 className="font-orbitron text-sm text-moto-silver mb-3">订单摘要</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">车型</span>
                    <span className="text-moto-silver">{currentModel?.name || '未选择'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">配件数量</span>
                    <span className="text-moto-silver">{selectedParts.reduce((s, i) => s + i.quantity, 0)} 件</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">配件总价</span>
                    <span className="text-moto-silver font-orbitron">¥{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moto-steel">施工费</span>
                    <span className="text-blue-400 font-orbitron">¥{totalLaborFee.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-moto-steel">折扣</span>
                      <span className="text-green-400 font-orbitron">-¥{discount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-carbon-500/20 flex items-center justify-between">
                  <span className="text-moto-silver font-medium">订单总额</span>
                  <span className="font-orbitron text-2xl font-bold text-moto-orange">¥{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-moto-orange/5 border border-moto-orange/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-moto-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-moto-silver text-sm">确认提交后，订单将以 <span className="text-moto-orange">"待报价"</span> 状态创建</p>
                  <p className="text-moto-steel text-xs mt-1">后续可在订单管理中追踪状态流转</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-carbon-800 border-t border-carbon-500/20 px-6 py-4 flex items-center justify-between">
          <div>
            {step !== 'info' ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                <ChevronLeft size={14} />
                上一步
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step !== 'confirm' ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
              >
                下一步
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    确认提交
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
