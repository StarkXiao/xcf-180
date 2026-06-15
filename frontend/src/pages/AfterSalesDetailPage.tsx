import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Wrench, User, Phone, Package, Car, Clock, Shield,
  AlertCircle, CheckCircle2, ChevronRight, Edit, Save, X, Plus,
  Trash2, MessageSquare, FileText, TrendingUp
} from 'lucide-react'
import type { AfterSalesStatus, AfterSalesPriority, AfterSalesType, IssueCategory, AfterSalesPartItem } from '@/types'
import {
  AFTER_SALES_STATUS_LABELS, AFTER_SALES_STATUS_COLORS,
  AFTER_SALES_PRIORITY_LABELS, AFTER_SALES_PRIORITY_COLORS,
  AFTER_SALES_TYPE_LABELS, ISSUE_CATEGORY_LABELS, WARRANTY_STATUS_LABELS, WARRANTY_STATUS_COLORS
} from '@/types'

const STATUS_OPTIONS: AfterSalesStatus[] = [
  'pending', 'inspecting', 'parts_ordered', 'repairing', 'testing',
  'completed', 'customer_pickup', 'closed', 'cancelled'
]

const PRIORITY_OPTIONS: AfterSalesPriority[] = ['low', 'medium', 'high', 'urgent']

const TYPE_OPTIONS: AfterSalesType[] = ['repair', 'warranty_claim', 'exchange', 'refund', 'consultation']

const ISSUE_CATEGORY_OPTIONS: IssueCategory[] = [
  'quality_defect', 'compatibility_issue', 'installation_error',
  'damage_during_shipping', 'wear_and_tear', 'user_misuse',
  'design_flaw', 'other'
]

export default function AfterSalesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    fetchAfterSalesDetail,
    currentAfterSales,
    fetchWarrantiesByOrder,
    warranties,
    updateAfterSales,
    updateAfterSalesStatus,
    fetchOrders,
    orders,
    currentUser,
  } = useStore()

  const [isEditing, setIsEditing] = useState(false)
  const [statusComment, setStatusComment] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<AfterSalesStatus | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    if (id) {
      fetchAfterSalesDetail(id)
    }
  }, [id])

  useEffect(() => {
    if (currentAfterSales) {
      fetchWarrantiesByOrder(currentAfterSales.orderId)
      setEditData({
        type: currentAfterSales.type,
        priority: currentAfterSales.priority,
        issueCategory: currentAfterSales.issueCategory,
        issueDescription: currentAfterSales.issueDescription,
        rootCause: currentAfterSales.rootCause,
        solution: currentAfterSales.solution,
        laborFee: currentAfterSales.laborFee,
        partsCost: currentAfterSales.partsCost,
        customerCharge: currentAfterSales.customerCharge,
        warrantyCoverage: currentAfterSales.warrantyCoverage,
        assignedTo: currentAfterSales.assignedTo,
        expectedCompletionDate: currentAfterSales.expectedCompletionDate?.split('T')[0],
        remark: currentAfterSales.remark,
      })
    }
  }, [currentAfterSales])

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleSave = async () => {
    if (!id) return
    await updateAfterSales(id, editData)
    setIsEditing(false)
    fetchAfterSalesDetail(id)
  }

  const handleStatusChange = async () => {
    if (!id || !selectedStatus) return
    await updateAfterSalesStatus(id, {
      status: selectedStatus,
      changedBy: currentUser?.username || 'system',
      comment: statusComment,
    })
    setShowStatusModal(false)
    setStatusComment('')
    setSelectedStatus(null)
    fetchAfterSalesDetail(id)
  }

  if (!currentAfterSales) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wrench size={48} className="text-carbon-500 mx-auto mb-4 animate-pulse" />
          <p className="text-moto-steel">加载中...</p>
        </div>
      </div>
    )
  }

  const record = currentAfterSales
  const statusConfig = AFTER_SALES_STATUS_COLORS[record.status]
  const statusLabel = AFTER_SALES_STATUS_LABELS[record.status]
  const order = orders.find((o) => o.id === record.orderId)

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/after-sales')}
            className="flex items-center gap-2 text-moto-steel hover:text-moto-silver transition-colors"
          >
            <ArrowLeft size={18} />
            返回列表
          </button>
          <div className="flex-1" />
          {order && (
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-carbon-800 text-moto-steel border border-carbon-500/20 rounded-lg hover:border-carbon-500/40 hover:text-moto-silver transition-colors"
            >
              <Package size={14} />
              查看关联订单
            </Link>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors"
            >
              <Edit size={14} />
              编辑
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditData({
                    type: record.type,
                    priority: record.priority,
                    issueCategory: record.issueCategory,
                    issueDescription: record.issueDescription,
                    rootCause: record.rootCause,
                    solution: record.solution,
                    laborFee: record.laborFee,
                    partsCost: record.partsCost,
                    customerCharge: record.customerCharge,
                    warrantyCoverage: record.warrantyCoverage,
                    assignedTo: record.assignedTo,
                    expectedCompletionDate: record.expectedCompletionDate?.split('T')[0],
                    remark: record.remark,
                  })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
              >
                <X size={14} />
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors"
              >
                <Save size={14} />
                保存
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-orbitron text-xl text-moto-silver font-bold">{record.afterSalesNo}</h1>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${statusConfig}`}>
                      {statusLabel}
                    </span>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${AFTER_SALES_PRIORITY_COLORS[record.priority]}`}>
                      {AFTER_SALES_PRIORITY_LABELS[record.priority]}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-moto-orange/10 text-moto-orange border border-moto-orange/30">
                      {AFTER_SALES_TYPE_LABELS[record.type]}
                    </span>
                  </div>
                  <p className="text-xs text-moto-steel">
                    创建于 {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors"
                >
                  <ChevronRight size={14} />
                  更新状态
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-moto-steel mb-1 flex items-center gap-1">
                    <User size={12} /> 客户名称
                  </p>
                  <p className="text-sm text-moto-silver font-medium">{record.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-1 flex items-center gap-1">
                    <Phone size={12} /> 联系电话
                  </p>
                  <p className="text-sm text-moto-silver">{record.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-1 flex items-center gap-1">
                    <Package size={12} /> 关联订单
                  </p>
                  <p className="text-sm text-moto-silver font-medium">{record.orderNo}</p>
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-1 flex items-center gap-1">
                    <Car size={12} /> 车型
                  </p>
                  <p className="text-sm text-moto-silver">{record.modelName}</p>
                </div>
                {record.vehicleInfo && (
                  <div className="col-span-2">
                    <p className="text-xs text-moto-steel mb-1">车辆信息</p>
                    <p className="text-sm text-moto-silver">{record.vehicleInfo}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-moto-steel mb-2 flex items-center gap-1">
                    <AlertCircle size={12} /> 问题分类
                  </p>
                  {isEditing ? (
                    <select
                      value={editData.issueCategory}
                      onChange={(e) => setEditData({ ...editData, issueCategory: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    >
                      {ISSUE_CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{ISSUE_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${
                      record.issueCategory === 'quality_defect' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      record.issueCategory === 'compatibility_issue' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                      'bg-carbon-700 text-moto-silver border-carbon-500/30'
                    }`}>
                      {ISSUE_CATEGORY_LABELS[record.issueCategory]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-2 flex items-center gap-1">
                    <MessageSquare size={12} /> 问题描述
                  </p>
                  {isEditing ? (
                    <textarea
                      value={editData.issueDescription}
                      onChange={(e) => setEditData({ ...editData, issueDescription: e.target.value })}
                      rows={4}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-moto-silver whitespace-pre-wrap bg-carbon-700/50 rounded-lg p-3">
                      {record.issueDescription || '无'}
                    </p>
                  )}
                </div>

                {record.images && record.images.length > 0 && (
                  <div>
                    <p className="text-xs text-moto-steel mb-2">问题照片</p>
                    <div className="flex gap-2 flex-wrap">
                      {record.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`问题照片 ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-carbon-500/20"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                <Package size={18} /> 关联配件
              </h2>
              {record.items.length === 0 ? (
                <p className="text-sm text-moto-steel text-center py-8">暂无关联配件</p>
              ) : (
                <div className="space-y-3">
                  {record.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-carbon-700/50 rounded-lg">
                      <img
                        src={item.partImage}
                        alt={item.partName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-moto-silver font-medium truncate">{item.partName}</p>
                        <p className="text-xs text-moto-steel">{item.partBrand}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-moto-steel">数量: {item.quantity}</span>
                          <span className="text-xs text-moto-steel">单价: ¥{item.unitPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${WARRANTY_STATUS_COLORS[item.warrantyStatus]}`}>
                          {WARRANTY_STATUS_LABELS[item.warrantyStatus]}
                        </span>
                        {item.needReplacement && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/30">
                            需更换
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {warranties.length > 0 && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
                <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                  <Shield size={18} /> 配件质保信息
                </h2>
                <div className="space-y-3">
                  {warranties.map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-carbon-700/50 rounded-lg">
                      <div>
                        <p className="text-sm text-moto-silver font-medium">{w.partName}</p>
                        <p className="text-xs text-moto-steel mt-1">
                          购买日期: {new Date(w.purchaseDate).toLocaleDateString('zh-CN')}
                          {' · '}
                          有效期至: {new Date(w.expiryDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${WARRANTY_STATUS_COLORS[w.status]}`}>
                        {WARRANTY_STATUS_LABELS[w.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                <FileText size={18} /> 问题归因与解决方案
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-moto-steel mb-2">根本原因</p>
                  {isEditing ? (
                    <textarea
                      value={editData.rootCause || ''}
                      onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })}
                      rows={3}
                      placeholder="请输入问题根本原因分析..."
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-moto-silver whitespace-pre-wrap bg-carbon-700/50 rounded-lg p-3">
                      {record.rootCause || '待分析'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-2">解决方案</p>
                  {isEditing ? (
                    <textarea
                      value={editData.solution || ''}
                      onChange={(e) => setEditData({ ...editData, solution: e.target.value })}
                      rows={3}
                      placeholder="请输入解决方案..."
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-moto-silver whitespace-pre-wrap bg-carbon-700/50 rounded-lg p-3">
                      {record.solution || '待制定'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                <Clock size={18} /> 处理进度
              </h2>
              {record.progress.length === 0 ? (
                <p className="text-sm text-moto-steel text-center py-8">暂无进度记录</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-carbon-600" />
                  <div className="space-y-4">
                    {record.progress.map((p, idx) => {
                      const pStatusConfig = AFTER_SALES_STATUS_COLORS[p.status]
                      const pStatusLabel = AFTER_SALES_STATUS_LABELS[p.status]
                      return (
                        <div key={p.id} className="relative pl-10">
                          <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 ${
                            idx === 0 ? 'bg-moto-orange border-moto-orange' : 'bg-carbon-800 border-carbon-500'
                          }`} />
                          <div className="bg-carbon-700/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${pStatusConfig}`}>
                                {pStatusLabel}
                              </span>
                              <span className="text-[10px] text-moto-steel">
                                {new Date(p.changedAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-xs text-moto-steel">操作人: {p.changedBy}</p>
                            {p.comment && (
                              <p className="text-sm text-moto-silver mt-2">{p.comment}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> 费用明细
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-steel">工时费</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.laborFee}
                      onChange={(e) => setEditData({ ...editData, laborFee: Number(e.target.value) })}
                      className="w-24 bg-carbon-700 text-moto-silver text-sm rounded-lg px-2 py-1 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 text-right"
                    />
                  ) : (
                    <span className="text-sm text-moto-silver">¥{record.laborFee.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-steel">配件费用</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.partsCost}
                      onChange={(e) => setEditData({ ...editData, partsCost: Number(e.target.value) })}
                      className="w-24 bg-carbon-700 text-moto-silver text-sm rounded-lg px-2 py-1 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 text-right"
                    />
                  ) : (
                    <span className="text-sm text-moto-silver">¥{record.partsCost.toLocaleString()}</span>
                  )}
                </div>
                <div className="h-px bg-carbon-600" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-silver font-medium">总费用</span>
                  <span className="text-sm text-moto-silver font-medium">¥{record.totalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-steel">质保覆盖</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.warrantyCoverage}
                      onChange={(e) => setEditData({ ...editData, warrantyCoverage: Number(e.target.value) })}
                      className="w-24 bg-carbon-700 text-moto-silver text-sm rounded-lg px-2 py-1 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 text-right"
                    />
                  ) : (
                    <span className="text-sm text-green-400">-¥{record.warrantyCoverage.toLocaleString()}</span>
                  )}
                </div>
                <div className="h-px bg-carbon-600" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-silver font-bold">客户应付</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.customerCharge}
                      onChange={(e) => setEditData({ ...editData, customerCharge: Number(e.target.value) })}
                      className="w-24 bg-carbon-700 text-moto-orange text-sm rounded-lg px-2 py-1 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 text-right font-bold"
                    />
                  ) : (
                    <span className="text-lg text-moto-orange font-orbitron font-bold">¥{record.customerCharge.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
              <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                <User size={18} /> 负责人
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-moto-steel mb-1">处理人员</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.assignedTo || ''}
                      onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                      placeholder="输入处理人员姓名"
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    />
                  ) : (
                    <p className="text-sm text-moto-silver">{record.assigneeName || record.assignedTo || '未分配'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-moto-steel mb-1">预计完成日期</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.expectedCompletionDate || ''}
                      onChange={(e) => setEditData({ ...editData, expectedCompletionDate: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    />
                  ) : (
                    <p className="text-sm text-moto-silver">
                      {record.expectedCompletionDate
                        ? new Date(record.expectedCompletionDate).toLocaleDateString('zh-CN')
                        : '未设置'}
                    </p>
                  )}
                </div>
                {record.actualCompletionDate && (
                  <div>
                    <p className="text-xs text-moto-steel mb-1">实际完成日期</p>
                    <p className="text-sm text-green-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {new Date(record.actualCompletionDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
                <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4 flex items-center gap-2">
                  <Edit size={18} /> 编辑信息
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-moto-steel mb-1">工单类型</p>
                    <select
                      value={editData.type}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{AFTER_SALES_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-moto-steel mb-1">优先级</p>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{AFTER_SALES_PRIORITY_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-moto-steel mb-1">备注</p>
                    <textarea
                      value={editData.remark || ''}
                      onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
                      rows={3}
                      className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {record.remark && !isEditing && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
                <h2 className="font-orbitron text-lg text-moto-silver font-bold mb-4">备注</h2>
                <p className="text-sm text-moto-silver whitespace-pre-wrap">{record.remark}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-carbon-500/20">
              <h3 className="font-orbitron text-lg text-moto-silver font-bold">更新处理状态</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-moto-steel mb-2">选择新状态</p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                        selectedStatus === s
                          ? `${AFTER_SALES_STATUS_COLORS[s]} border-current`
                          : 'bg-carbon-700 text-moto-steel border-carbon-500/20 hover:border-carbon-500/40'
                      }`}
                    >
                      {AFTER_SALES_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-moto-steel mb-2">进度备注</p>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={3}
                  placeholder="请输入状态变更说明..."
                  className="w-full bg-carbon-700 text-moto-silver text-sm rounded-lg px-3 py-2 border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-carbon-500/20 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setStatusComment('')
                  setSelectedStatus(null)
                }}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus}
                className="px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
