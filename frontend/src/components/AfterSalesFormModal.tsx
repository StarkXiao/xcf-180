import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { X, Plus, Trash2, Package, Search, User, Phone, Car, AlertCircle, Shield, ShieldX, ShieldCheck } from 'lucide-react'
import type {
  AfterSalesType, AfterSalesPriority, IssueCategory, Order, AfterSalesPartItem, PartWarranty, WarrantyStatus
} from '@/types'
import {
  AFTER_SALES_TYPE_LABELS, AFTER_SALES_PRIORITY_LABELS,
  ISSUE_CATEGORY_LABELS, WARRANTY_STATUS_LABELS, WARRANTY_STATUS_COLORS
} from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  orderId?: string
}

const TYPE_OPTIONS: AfterSalesType[] = ['repair', 'warranty_claim', 'exchange', 'refund', 'consultation']
const PRIORITY_OPTIONS: AfterSalesPriority[] = ['low', 'medium', 'high', 'urgent']
const ISSUE_CATEGORY_OPTIONS: IssueCategory[] = [
  'quality_defect', 'compatibility_issue', 'installation_error',
  'damage_during_shipping', 'wear_and_tear', 'user_misuse',
  'design_flaw', 'other'
]

export default function AfterSalesFormModal({ isOpen, onClose, orderId }: Props) {
  const { fetchOrders, orders, createAfterSales, currentUser, fetchWarrantiesByOrder, warrantiesLoading } = useStore()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [showOrderSelect, setShowOrderSelect] = useState(false)
  const [formData, setFormData] = useState({
    type: 'repair' as AfterSalesType,
    priority: 'medium' as AfterSalesPriority,
    customerName: '',
    customerContact: '',
    customerPhone: '',
    vehicleInfo: '',
    issueCategory: 'quality_defect' as IssueCategory,
    issueDescription: '',
    laborFee: 0,
    partsCost: 0,
    customerCharge: 0,
    warrantyCoverage: 0,
    expectedCompletionDate: '',
    remark: '',
  })
  const [selectedParts, setSelectedParts] = useState<AfterSalesPartItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchOrders()
    }
  }, [isOpen])

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        handleSelectOrder(order)
      }
    }
  }, [orderId, orders])

  const calculateCosts = useCallback((parts: AfterSalesPartItem[], laborFee: number) => {
    const replacementParts = parts.filter((p) => p.needReplacement)
    const partsCost = replacementParts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
    const warrantyCoverage = replacementParts
      .filter((p) => p.isUnderWarranty && p.warrantyStatus === 'valid')
      .reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
    const customerCharge = Math.max(0, laborFee + partsCost - warrantyCoverage)
    return { partsCost, warrantyCoverage, customerCharge }
  }, [])

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order)
    setShowOrderSelect(false)
    setOrderSearch(order.orderNo)
    setFormData((prev) => ({
      ...prev,
      customerName: order.dealerName,
      customerContact: order.dealerContact,
      customerPhone: order.dealerPhone,
    }))

    const fetchedWarranties = await fetchWarrantiesByOrder(order.id)

    const warrantyMap: Record<string, PartWarranty> = {}
    fetchedWarranties.forEach((w) => {
      warrantyMap[w.partId] = w
    })

    const parts: AfterSalesPartItem[] = order.items.map((item) => {
      const warranty = warrantyMap[item.partId]
      const warrantyStatus: WarrantyStatus = warranty?.status || 'expired'
      const isUnderWarranty = warrantyStatus === 'valid'

      return {
        partId: item.partId,
        partName: item.partName,
        partBrand: item.partBrand,
        partImage: item.partImage,
        quantity: item.quantity,
        unitPrice: item.price,
        warrantyStatus,
        isUnderWarranty,
        needReplacement: false,
      }
    })
    setSelectedParts(parts)

    const { partsCost, warrantyCoverage, customerCharge } = calculateCosts(parts, formData.laborFee)
    setFormData((prev) => ({
      ...prev,
      partsCost,
      warrantyCoverage,
      customerCharge,
    }))
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.dealerName.toLowerCase().includes(orderSearch.toLowerCase())
  )

  const togglePartReplacement = (idx: number) => {
    setSelectedParts((prev) => {
      const newParts = prev.map((p, i) =>
        i === idx ? { ...p, needReplacement: !p.needReplacement } : p
      )
      const { partsCost, warrantyCoverage, customerCharge } = calculateCosts(newParts, formData.laborFee)
      setFormData((prevForm) => ({
        ...prevForm,
        partsCost,
        warrantyCoverage,
        customerCharge,
      }))
      return newParts
    })
  }

  const removePart = (idx: number) => {
    setSelectedParts((prev) => {
      const newParts = prev.filter((_, i) => i !== idx)
      const { partsCost, warrantyCoverage, customerCharge } = calculateCosts(newParts, formData.laborFee)
      setFormData((prevForm) => ({
        ...prevForm,
        partsCost,
        warrantyCoverage,
        customerCharge,
      }))
      return newParts
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedOrder) newErrors.order = '请选择关联订单'
    if (!formData.customerName.trim()) newErrors.customerName = '请输入客户名称'
    if (!formData.customerPhone.trim()) newErrors.customerPhone = '请输入联系电话'
    if (!formData.issueDescription.trim()) newErrors.issueDescription = '请输入问题描述'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!selectedOrder) return

    const totalCost = formData.laborFee + formData.partsCost

    const result = await createAfterSales({
      type: formData.type,
      orderId: selectedOrder.id,
      customerName: formData.customerName,
      customerContact: formData.customerContact,
      customerPhone: formData.customerPhone,
      vehicleInfo: formData.vehicleInfo || undefined,
      modelId: selectedOrder.modelId,
      items: selectedParts,
      issueCategory: formData.issueCategory,
      issueDescription: formData.issueDescription,
      priority: formData.priority,
      laborFee: formData.laborFee,
      partsCost: formData.partsCost,
      customerCharge: formData.customerCharge,
      warrantyCoverage: formData.warrantyCoverage,
      expectedCompletionDate: formData.expectedCompletionDate || undefined,
      createdBy: currentUser?.username || 'system',
      remark: formData.remark || undefined,
    })

    if (result) {
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setSelectedOrder(null)
    setOrderSearch('')
    setSelectedParts([])
    setErrors({})
    setFormData({
      type: 'repair',
      priority: 'medium',
      customerName: '',
      customerContact: '',
      customerPhone: '',
      vehicleInfo: '',
      issueCategory: 'quality_defect',
      issueDescription: '',
      laborFee: 0,
      partsCost: 0,
      customerCharge: 0,
      warrantyCoverage: 0,
      expectedCompletionDate: '',
      remark: '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-carbon-500/20 flex items-center justify-between">
          <h3 className="font-orbitron text-xl text-moto-silver font-bold">新建售后工单</h3>
          <button
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="p-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
              <Package size={14} /> 关联订单 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 bg-carbon-700 rounded-lg px-3 py-2 border border-carbon-500/30 focus-within:border-moto-orange/50">
                <Search size={16} className="text-moto-steel" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value)
                    setShowOrderSelect(true)
                  }}
                  onFocus={() => setShowOrderSelect(true)}
                  placeholder="搜索订单号或客户名称..."
                  className="flex-1 bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500"
                />
                {selectedOrder && (
                  <span className="text-xs text-green-400">已选择</span>
                )}
              </div>
              {showOrderSelect && orderSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-carbon-700 border border-carbon-500/30 rounded-lg overflow-hidden z-10 max-h-60 overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <p className="p-4 text-sm text-moto-steel text-center">未找到匹配订单</p>
                  ) : (
                    filteredOrders.slice(0, 10).map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className="w-full text-left p-3 hover:bg-carbon-600/50 border-b border-carbon-500/20 last:border-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-moto-silver font-medium font-orbitron">{order.orderNo}</span>
                          <span className="text-xs text-moto-orange">¥{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-moto-steel mt-1">
                          {order.dealerName} · {order.modelName} · {order.items.length} 项配件
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.order && <p className="text-xs text-red-400 mt-1">{errors.order}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
                <User size={14} /> 客户名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border focus:outline-none focus:border-moto-orange/50 ${
                  errors.customerName ? 'border-red-500/50' : 'border-carbon-500/30'
                }`}
                placeholder="请输入客户名称"
              />
              {errors.customerName && <p className="text-xs text-red-400 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
                <Phone size={14} /> 联系电话 <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className={`w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border focus:outline-none focus:border-moto-orange/50 ${
                  errors.customerPhone ? 'border-red-500/50' : 'border-carbon-500/30'
                }`}
                placeholder="请输入联系电话"
              />
              {errors.customerPhone && <p className="text-xs text-red-400 mt-1">{errors.customerPhone}</p>}
            </div>
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block">联系人</label>
              <input
                type="text"
                value={formData.customerContact}
                onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                placeholder="请输入联系人"
              />
            </div>
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
                <Car size={14} /> 车辆信息
              </label>
              <input
                type="text"
                value={formData.vehicleInfo}
                onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                placeholder="车牌号/VIN码等"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block">工单类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AfterSalesType })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{AFTER_SALES_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AfterSalesPriority })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{AFTER_SALES_PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
                <AlertCircle size={14} /> 问题分类
              </label>
              <select
                value={formData.issueCategory}
                onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value as IssueCategory })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
              >
                {ISSUE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{ISSUE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-moto-silver font-medium mb-2 block">问题描述 <span className="text-red-400">*</span></label>
            <textarea
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              rows={4}
              className={`w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border focus:outline-none focus:border-moto-orange/50 resize-none ${
                errors.issueDescription ? 'border-red-500/50' : 'border-carbon-500/30'
              }`}
              placeholder="请详细描述问题情况..."
            />
            {errors.issueDescription && <p className="text-xs text-red-400 mt-1">{errors.issueDescription}</p>}
          </div>

          <div>
            <label className="text-sm text-moto-silver font-medium mb-2 block flex items-center gap-2">
              <Shield size={14} /> 关联配件与质保状态
              {warrantiesLoading && <span className="text-xs text-moto-orange">(加载中...)</span>}
            </label>
            {selectedParts.length === 0 ? (
              <p className="text-sm text-moto-steel text-center py-8 bg-carbon-700/30 rounded-lg border border-dashed border-carbon-500/30">
                选择关联订单后自动加载订单配件及质保信息
              </p>
            ) : (
              <div className="space-y-2">
                {selectedParts.map((part, idx) => (
                  <div
                    key={idx}
                    className={`p-3 bg-carbon-700/50 rounded-lg border transition-colors ${
                      part.needReplacement ? 'border-moto-orange/40' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={part.partImage}
                        alt={part.partName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-moto-silver font-medium truncate">{part.partName}</p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${WARRANTY_STATUS_COLORS[part.warrantyStatus]}`}
                          >
                            {part.warrantyStatus === 'valid' ? (
                              <ShieldCheck size={10} />
                            ) : part.warrantyStatus === 'expired' ? (
                              <ShieldX size={10} />
                            ) : (
                              <Shield size={10} />
                            )}
                            {WARRANTY_STATUS_LABELS[part.warrantyStatus]}
                          </span>
                        </div>
                        <p className="text-xs text-moto-steel mt-1">
                          {part.partBrand} · {part.quantity}件 · ¥{part.unitPrice.toLocaleString()}
                          {part.isUnderWarranty && part.needReplacement && (
                            <span className="text-green-400 ml-2">
                              (质保覆盖 ¥{(part.unitPrice * part.quantity).toLocaleString()})
                            </span>
                          )}
                          {!part.isUnderWarranty && part.needReplacement && (
                            <span className="text-moto-orange ml-2">
                              (客户自费 ¥{(part.unitPrice * part.quantity).toLocaleString()})
                            </span>
                          )}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-moto-steel">
                        <input
                          type="checkbox"
                          checked={part.needReplacement}
                          onChange={() => togglePartReplacement(idx)}
                          className="rounded border-carbon-500 bg-carbon-700 text-moto-orange focus:ring-moto-orange/50"
                        />
                        需更换
                      </label>
                      <button
                        onClick={() => removePart(idx)}
                        className="p-1.5 text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-moto-silver font-medium mb-2 block">工时费 (¥)</label>
                <input
                  type="number"
                  value={formData.laborFee}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setFormData({
                      ...formData,
                      laborFee: v,
                      customerCharge: Math.max(0, v + formData.partsCost - formData.warrantyCoverage),
                    })
                  }}
                  className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-moto-silver font-medium mb-2 block">配件费 (¥)</label>
                <input
                  type="number"
                  value={formData.partsCost}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setFormData({
                      ...formData,
                      partsCost: v,
                      customerCharge: Math.max(0, formData.laborFee + v - formData.warrantyCoverage),
                    })
                  }}
                  className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                  min={0}
                />
                {selectedParts.some((p) => p.needReplacement) && (
                  <p className="text-xs text-moto-steel mt-1">
                    需更换配件合计：¥{selectedParts.filter((p) => p.needReplacement).reduce((s, p) => s + p.unitPrice * p.quantity, 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-moto-silver font-medium mb-2 block">质保覆盖 (¥)</label>
                <input
                  type="number"
                  value={formData.warrantyCoverage}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setFormData({
                      ...formData,
                      warrantyCoverage: v,
                      customerCharge: Math.max(0, formData.laborFee + formData.partsCost - v),
                    })
                  }}
                  className="w-full bg-carbon-700 text-green-400 text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                  min={0}
                />
                {selectedParts.some((p) => p.needReplacement && p.isUnderWarranty) && (
                  <p className="text-xs text-green-400 mt-1">
                    在保需更换：¥{selectedParts.filter((p) => p.needReplacement && p.isUnderWarranty).reduce((s, p) => s + p.unitPrice * p.quantity, 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-moto-silver font-medium mb-2 block">客户应付 (¥)</label>
                <input
                  type="number"
                  value={formData.customerCharge}
                  onChange={(e) => setFormData({ ...formData, customerCharge: Number(e.target.value) })}
                  className="w-full bg-carbon-700 text-moto-orange text-sm font-medium rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                  min={0}
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-carbon-700/30 rounded-lg border border-carbon-500/20">
              <p className="text-xs text-moto-steel">
                <span className="text-moto-silver font-medium">费用计算说明：</span>
                客户应付 = 工时费 + 配件费（勾选"需更换"的配件） - 质保覆盖（在保且需更换的配件）
              </p>
              {selectedParts.some((p) => p.needReplacement && !p.isUnderWarranty) && (
                <p className="text-xs text-moto-orange mt-1">
                  ⚠️ 以下需更换配件已过质保期，费用由客户承担：
                  {selectedParts.filter((p) => p.needReplacement && !p.isUnderWarranty).map((p) => p.partName).join('、')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-moto-silver font-medium mb-2 block">预计完成日期</label>
              <input
                type="date"
                value={formData.expectedCompletionDate}
                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
              />
            </div>
            <div />
          </div>

          <div>
            <label className="text-sm text-moto-silver font-medium mb-2 block">备注</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={2}
              className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
              placeholder="其他需要说明的信息..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-carbon-500/20 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="px-5 py-2.5 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            创建工单
          </button>
        </div>
      </div>
    </div>
  )
}
