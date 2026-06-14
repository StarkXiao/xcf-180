import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  ArrowLeft, Clock, User, Phone, Wrench, Package, CalendarDays, Truck, CheckCircle2,
  XCircle, AlertCircle, Factory, ChevronRight, MessageSquare, Send, Trash2,
  Percent, FileText, ChevronDown, Plus,
} from 'lucide-react'
import type { OrderStatus, AfterSaleNote } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  pending: { label: '待报价', color: 'text-yellow-500', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500', icon: <Clock size={14} /> },
  quoted: { label: '已报价', color: 'text-blue-400', bgColor: 'bg-blue-500', borderColor: 'border-blue-500', icon: <AlertCircle size={14} /> },
  confirmed: { label: '已确认', color: 'text-cyan-400', bgColor: 'bg-cyan-500', borderColor: 'border-cyan-500', icon: <CheckCircle2 size={14} /> },
  in_production: { label: '生产中', color: 'text-purple-400', bgColor: 'bg-purple-500', borderColor: 'border-purple-500', icon: <Factory size={14} /> },
  shipped: { label: '已发货', color: 'text-indigo-400', bgColor: 'bg-indigo-500', borderColor: 'border-indigo-500', icon: <Truck size={14} /> },
  delivered: { label: '已交付', color: 'text-green-400', bgColor: 'bg-green-500', borderColor: 'border-green-500', icon: <Package size={14} /> },
  completed: { label: '已完成', color: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500', icon: <CheckCircle2 size={14} /> },
  cancelled: { label: '已取消', color: 'text-red-400', bgColor: 'bg-red-500', borderColor: 'border-red-500', icon: <XCircle size={14} /> },
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'quoted', 'confirmed', 'in_production', 'shipped', 'delivered', 'completed']

const NEXT_STATUS_OPTIONS: Partial<Record<OrderStatus, { label: string; value: OrderStatus }[]>> = {
  pending: [{ label: '确认报价', value: 'quoted' }],
  quoted: [{ label: '客户确认', value: 'confirmed' }, { label: '取消订单', value: 'cancelled' }],
  confirmed: [{ label: '开始生产', value: 'in_production' }, { label: '取消订单', value: 'cancelled' }],
  in_production: [{ label: '已发货', value: 'shipped' }],
  shipped: [{ label: '确认交付', value: 'delivered' }],
  delivered: [{ label: '完成订单', value: 'completed' }],
}

const NOTE_TYPE_CONFIG: Record<AfterSaleNote['type'], { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  comment: { label: '备注', color: 'text-moto-steel', bgColor: 'bg-carbon-700', icon: <MessageSquare size={10} /> },
  issue: { label: '问题', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: <AlertCircle size={10} /> },
  solution: { label: '解决', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: <CheckCircle2 size={10} /> },
  followup: { label: '跟进', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: <Clock size={10} /> },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orders, fetchOrders, updateOrderStatus, updateOrderDiscount, addAfterSaleNote, deleteAfterSaleNote, deleteOrder } = useStore()

  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<AfterSaleNote['type']>('comment')
  const [noteCreatedBy, setNoteCreatedBy] = useState('')
  const [statusRemark, setStatusRemark] = useState('')
  const [statusChangedBy, setStatusChangedBy] = useState('admin')
  const [discountInput, setDiscountInput] = useState('')
  const [showDiscountEdit, setShowDiscountEdit] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (orders.length === 0) fetchOrders()
  }, [])

  const order = orders.find((o) => o.id === id)

  useEffect(() => {
    if (order) {
      setDiscountInput(String(order.discount))
    }
  }, [order?.discount])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="text-carbon-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-moto-silver text-xl mb-2">订单不存在</h2>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors"
          >
            返回订单列表
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status]
  const nextOptions = NEXT_STATUS_OPTIONS[order.status] || []
  const currentFlowIndex = STATUS_FLOW.indexOf(order.status)

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setSubmitting(true)
    try {
      await updateOrderStatus(order.id, {
        status: newStatus,
        changedBy: statusChangedBy,
        remark: statusRemark || undefined,
      })
      setShowStatusDropdown(false)
      setStatusRemark('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiscountSave = async () => {
    const val = Math.max(0, Number(discountInput) || 0)
    await updateOrderDiscount(order.id, val)
    setShowDiscountEdit(false)
  }

  const handleAddNote = async () => {
    if (!noteContent.trim() || !noteCreatedBy.trim()) return
    setSubmitting(true)
    try {
      await addAfterSaleNote(order.id, {
        content: noteContent.trim(),
        createdBy: noteCreatedBy.trim(),
        type: noteType,
      })
      setNoteContent('')
      setNoteType('comment')
      setShowNoteForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    await deleteAfterSaleNote(order.id, noteId)
  }

  const handleDeleteOrder = async () => {
    if (!confirm('确定要删除此订单吗？此操作不可恢复。')) return
    await deleteOrder(order.id)
    navigate('/orders')
  }

  const groupedItems = order.items.reduce<Record<string, typeof order.items>>((acc, item) => {
    if (!acc[item.categoryId]) acc[item.categoryId] = []
    acc[item.categoryId].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-3 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <ArrowLeft size={14} />
              订单列表
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-orbitron text-2xl text-moto-silver font-bold">{order.orderNo}</h1>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${statusConfig.bgColor.replace('/10', '/20')} ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-moto-steel text-sm mt-1 flex items-center gap-2">
                <Clock size={12} />
                创建于 {new Date(order.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {nextOptions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
                >
                  状态流转
                  <ChevronDown size={14} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-carbon-800 border border-carbon-500/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                    <div className="p-3 border-b border-carbon-500/20">
                      <label className="block text-xs text-moto-steel mb-1">操作人</label>
                      <input
                        type="text"
                        value={statusChangedBy}
                        onChange={(e) => setStatusChangedBy(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange"
                      />
                      <label className="block text-xs text-moto-steel mb-1 mt-2">备注</label>
                      <input
                        type="text"
                        value={statusRemark}
                        onChange={(e) => setStatusRemark(e.target.value)}
                        placeholder="可选备注"
                        className="w-full px-2.5 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:ring-1 focus:ring-moto-orange placeholder:text-carbon-500"
                      />
                    </div>
                    <div className="p-2 space-y-1">
                      {nextOptions.map((opt) => {
                        const optConfig = STATUS_CONFIG[opt.value]
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            disabled={submitting}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-carbon-700 transition-colors disabled:opacity-50"
                          >
                            <span className={optConfig.color}>{optConfig.icon}</span>
                            <span className={optConfig.color}>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleDeleteOrder}
              className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              title="删除订单"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">订单状态流转</h3>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STATUS_FLOW.map((s, i) => {
                  const cfg = STATUS_CONFIG[s]
                  const isCurrent = s === order.status
                  const isPast = i < currentFlowIndex
                  return (
                    <div key={s} className="flex items-center shrink-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-orbitron border ${
                        isCurrent
                          ? `${cfg.color} ${cfg.bgColor.replace('/10', '/20')} ${cfg.borderColor}/50`
                          : isPast
                            ? 'bg-carbon-700 text-moto-steel border-carbon-600'
                            : 'bg-carbon-700/30 text-carbon-500 border-carbon-700/50'
                      }`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <ChevronRight size={10} className={i < currentFlowIndex ? 'text-moto-steel mx-0.5' : 'text-carbon-600 mx-0.5'} />
                      )}
                    </div>
                  )
                })}
              </div>
              {order.statusHistory.length > 0 && (
                <div className="mt-4 space-y-2">
                  {order.statusHistory.slice().reverse().map((h, i) => {
                    const hCfg = STATUS_CONFIG[h.status as OrderStatus]
                    return (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className={`mt-0.5 ${hCfg?.color || 'text-moto-steel'}`}>{hCfg?.icon || <Clock size={10} />}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={hCfg?.color || 'text-moto-steel'}>{hCfg?.label || h.status}</span>
                            <span className="text-moto-steel">·</span>
                            <span className="text-moto-steel">{h.changedBy}</span>
                            <span className="text-moto-steel/60">{new Date(h.changedAt).toLocaleString('zh-CN')}</span>
                          </div>
                          {h.remark && <p className="text-moto-steel/80 mt-0.5">{h.remark}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">配件明细</h3>
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([categoryId, items]) => {
                  const categorySubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
                  const categoryLaborFee = items.reduce((s, i) => s + i.laborFee, 0)
                  return (
                    <div key={categoryId}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-orbitron text-moto-silver">{items[0]?.categoryName || categoryId}</span>
                        <span className="text-xs font-orbitron text-moto-orange">¥{(categorySubtotal + categoryLaborFee).toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.partId} className="flex items-center gap-3 text-sm bg-carbon-700/50 rounded-lg px-3 py-2">
                            <img
                              src={item.partImage}
                              alt={item.partName}
                              className="w-10 h-10 rounded object-cover bg-carbon-600 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+product+photo+dark&image_size=square`
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-moto-silver text-sm truncate">{item.partName}</p>
                              <p className="text-moto-steel text-xs">{item.partBrand} · ¥{item.price.toLocaleString()} × {item.quantity}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-orbitron text-moto-orange text-sm">¥{item.subtotal.toLocaleString()}</p>
                              <p className="text-blue-400 text-[10px]">含施工费 ¥{item.laborFee.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">经销商信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-moto-steel shrink-0" />
                  <span className="text-moto-steel w-16">经销商</span>
                  <span className="text-moto-silver">{order.dealerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-moto-steel shrink-0" />
                  <span className="text-moto-steel w-16">联系人</span>
                  <span className="text-moto-silver">{order.dealerContact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-moto-steel shrink-0" />
                  <span className="text-moto-steel w-16">电话</span>
                  <span className="text-moto-silver">{order.dealerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-moto-steel shrink-0" />
                  <span className="text-moto-steel w-16">车型</span>
                  <span className="text-moto-silver">{order.modelName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-moto-steel shrink-0" />
                  <span className="text-moto-steel w-16">套件</span>
                  <span className="text-moto-silver">{order.packageName || '自定义'}</span>
                </div>
                {order.expectedDeliveryDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-moto-steel shrink-0" />
                    <span className="text-moto-steel w-16">期望交付</span>
                    <span className="text-moto-silver">{order.expectedDeliveryDate}</span>
                  </div>
                )}
                {order.remark && (
                  <div className="pt-3 border-t border-carbon-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-moto-steel" />
                      <span className="text-moto-steel text-xs">备注</span>
                    </div>
                    <p className="text-moto-silver text-xs">{order.remark}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">费用汇总</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-moto-steel">配件总价</span>
                  <span className="text-moto-silver font-orbitron">¥{order.partsTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-moto-steel">施工费</span>
                  <span className="text-blue-400 font-orbitron">¥{order.laborFeeTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-moto-steel flex items-center gap-1">
                    <Percent size={10} />
                    折扣
                  </span>
                  {showDiscountEdit ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-24 px-2 py-1 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-sm font-orbitron focus:outline-none focus:ring-1 focus:ring-moto-orange"
                      />
                      <button onClick={handleDiscountSave} className="text-moto-orange text-xs hover:underline">保存</button>
                      <button onClick={() => setShowDiscountEdit(false)} className="text-moto-steel text-xs hover:underline">取消</button>
                    </div>
                  ) : (
                    <span
                      className="text-green-400 font-orbitron cursor-pointer hover:underline"
                      onClick={() => setShowDiscountEdit(true)}
                    >
                      -¥{order.discount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-carbon-500/20 flex items-center justify-between">
                  <span className="text-moto-silver font-medium">订单总额</span>
                  <span className="font-orbitron text-xl font-bold text-moto-orange">¥{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-sm text-moto-silver flex items-center gap-2">
                  <MessageSquare size={14} />
                  售后备注
                  {order.afterSaleNotes.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-carbon-700 rounded-full text-moto-steel">{order.afterSaleNotes.length}</span>
                  )}
                </h3>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-carbon-700 text-moto-steel rounded-lg text-xs hover:bg-carbon-600 hover:text-moto-silver transition-colors"
                >
                  <Plus size={12} />
                  添加
                </button>
              </div>

              {showNoteForm && (
                <div className="mb-4 p-3 bg-carbon-700/50 rounded-lg border border-carbon-500/20 space-y-2 animate-scale-in">
                  <div className="flex gap-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as AfterSaleNote['type'])}
                      className="px-2 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-xs focus:outline-none focus:ring-1 focus:ring-moto-orange"
                    >
                      <option value="comment">备注</option>
                      <option value="issue">问题</option>
                      <option value="solution">解决</option>
                      <option value="followup">跟进</option>
                    </select>
                    <input
                      type="text"
                      value={noteCreatedBy}
                      onChange={(e) => setNoteCreatedBy(e.target.value)}
                      placeholder="操作人"
                      className="flex-1 px-2 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-xs focus:outline-none focus:ring-1 focus:ring-moto-orange placeholder:text-carbon-500"
                    />
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="输入备注内容..."
                    rows={3}
                    className="w-full px-2 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded text-moto-silver text-xs focus:outline-none focus:ring-1 focus:ring-moto-orange placeholder:text-carbon-500 resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowNoteForm(false)}
                      className="px-3 py-1 text-moto-steel text-xs hover:text-moto-silver transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={submitting || !noteContent.trim() || !noteCreatedBy.trim()}
                      className="flex items-center gap-1 px-3 py-1 bg-moto-orange text-white rounded text-xs hover:bg-moto-orange-light transition-colors disabled:opacity-50"
                    >
                      <Send size={10} />
                      提交
                    </button>
                  </div>
                </div>
              )}

              {order.afterSaleNotes.length === 0 && !showNoteForm ? (
                <p className="text-moto-steel text-xs text-center py-4">暂无售后备注</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {order.afterSaleNotes.slice().reverse().map((note) => {
                    const typeCfg = NOTE_TYPE_CONFIG[note.type]
                    return (
                      <div key={note.id} className={`p-3 rounded-lg ${typeCfg.bgColor} border border-carbon-500/10`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-[10px] ${typeCfg.color}`}>
                              {typeCfg.icon}
                              {typeCfg.label}
                            </span>
                            <span className="text-moto-steel text-[10px]">{note.createdBy}</span>
                            <span className="text-moto-steel/60 text-[10px]">{new Date(note.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-carbon-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        <p className="text-moto-silver text-xs">{note.content}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
