import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { InventoryInfo, StockAlert, PurchaseOrder, PurchaseOrderStatus, PartAdmin } from '@/types'
import {
  Package,
  PackageX,
  AlertTriangle,
  ShoppingCart,
  Bell,
  BellOff,
  Check,
  X,
  Plus,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  Search,
  Loader2,
  ArrowUpDown,
  Clock,
  Truck,
  ClipboardCheck,
} from 'lucide-react'

type TabType = 'overview' | 'alerts' | 'purchase'

const PO_STATUS_BADGE: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  approved: { label: '已审批', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  shipped: { label: '运输中', className: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  received: { label: '已入库', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  cancelled: { label: '已取消', className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
}

const PO_STATUS_FLOW: PurchaseOrderStatus[] = ['pending', 'approved', 'shipped', 'received']

export default function AdminInventoryPage() {
  const { categories, fetchCategories, fetchParts, allParts } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(false)

  const [overview, setOverview] = useState<{
    totalParts: number
    outOfStockCount: number
    lowStockCount: number
    inStockCount: number
    totalReserved: number
    unreadAlerts: number
    inventory: Record<string, InventoryInfo>
  } | null>(null)

  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [adminParts, setAdminParts] = useState<PartAdmin[]>([])
  const [poFilterStatus, setPoFilterStatus] = useState<PurchaseOrderStatus | 'all'>('all')
  const [alertFilterType, setAlertFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all')

  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false)
  const [poSupplier, setPoSupplier] = useState('')
  const [poRemark, setPoRemark] = useState('')
  const [poExpectedDate, setPoExpectedDate] = useState('')
  const [poSelectedParts, setPoSelectedParts] = useState<{ partId: string; quantity: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchCategories(), fetchParts()])
      const [overviewData, alertsData, poData, partsData] = await Promise.all([
        api.getInventoryOverview(),
        api.getStockAlerts(),
        api.getPurchaseOrders(),
        api.adminGetParts(),
      ])
      setOverview(overviewData)
      setAlerts(alertsData)
      setPurchaseOrders(poData)
      setAdminParts(partsData)
    } catch (e) {
      console.error('Failed to load inventory data:', e)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id
  }

  const handleMarkAlertRead = async (alertId: string) => {
    await api.markAlertRead(alertId)
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, isRead: true } : a))
  }

  const handleMarkAllAlertsRead = async () => {
    await api.markAllAlertsRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
  }

  const handleUpdatePOStatus = async (id: string, status: PurchaseOrderStatus) => {
    try {
      const updated = await api.updatePurchaseOrderStatus(id, status)
      setPurchaseOrders((prev) => prev.map((o) => o.id === id ? updated : o))
      if (status === 'received') {
        loadData()
      }
    } catch (e) {
      console.error('Failed to update PO status:', e)
    }
  }

  const handleDeletePO = async (id: string) => {
    try {
      await api.deletePurchaseOrder(id)
      setPurchaseOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) {
      console.error('Failed to delete PO:', e)
    }
  }

  const handleCreatePO = async () => {
    if (!poSupplier || poSelectedParts.length === 0) return
    setSubmitting(true)
    try {
      const items = poSelectedParts.map((sp) => {
        const part = adminParts.find((p) => p.id === sp.partId)
        return {
          partId: sp.partId,
          partName: part?.name || sp.partId,
          partSku: part?.sku || sp.partId,
          quantity: sp.quantity,
          unitCost: part?.costPrice || 0,
        }
      })
      await api.createPurchaseOrder({
        supplier: poSupplier,
        items,
        remark: poRemark || undefined,
        expectedDate: poExpectedDate || undefined,
        createdBy: 'admin',
      })
      setIsCreatePOModalOpen(false)
      setPoSupplier('')
      setPoRemark('')
      setPoExpectedDate('')
      setPoSelectedParts([])
      await loadData()
    } catch (e) {
      console.error('Failed to create PO:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (alertFilterType !== 'all' && a.alertType !== alertFilterType) return false
      return true
    })
  }, [alerts, alertFilterType])

  const filteredPO = useMemo(() => {
    if (poFilterStatus === 'all') return purchaseOrders
    return purchaseOrders.filter((o) => o.status === poFilterStatus)
  }, [purchaseOrders, poFilterStatus])

  const inventoryList = useMemo(() => {
    if (!overview?.inventory) return []
    return Object.values(overview.inventory).sort((a, b) => {
      const levelOrder = { out_of_stock: 0, low_stock: 1, in_stock: 2 }
      return levelOrder[a.stockLevel] - levelOrder[b.stockLevel]
    })
  }, [overview])

  const addPOPart = (partId: string) => {
    if (poSelectedParts.some((p) => p.partId === partId)) return
    setPoSelectedParts([...poSelectedParts, { partId, quantity: 1 }])
  }

  const removePOPart = (partId: string) => {
    setPoSelectedParts(poSelectedParts.filter((p) => p.partId !== partId))
  }

  const updatePOPartQty = (partId: string, quantity: number) => {
    setPoSelectedParts(poSelectedParts.map((p) => p.partId === partId ? { ...p, quantity } : p))
  }

  const outOfStockParts = adminParts.filter((p) => {
    const info = overview?.inventory[p.id]
    return info?.stockLevel === 'out_of_stock'
  })

  const lowStockParts = adminParts.filter((p) => {
    const info = overview?.inventory[p.id]
    return info?.stockLevel === 'low_stock'
  })

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            库存联动
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            配件库存管理 · 缺货预警 · 替代件推荐 · 采购登记
          </p>
        </div>
        <button
          onClick={() => setIsCreatePOModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
        >
          <ShoppingCart size={14} />
          新建采购单
        </button>
      </div>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-green-400" />
              <span className="text-moto-steel text-xs font-orbitron">库存充足</span>
            </div>
            <p className="font-orbitron text-2xl text-green-400">{overview.inStockCount}</p>
          </div>
          <div className="bg-carbon-800 rounded-xl border border-yellow-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-moto-steel text-xs font-orbitron">库存偏低</span>
            </div>
            <p className="font-orbitron text-2xl text-yellow-500">{overview.lowStockCount}</p>
          </div>
          <div className="bg-carbon-800 rounded-xl border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <PackageX size={16} className="text-red-400" />
              <span className="text-moto-steel text-xs font-orbitron">缺货</span>
            </div>
            <p className="font-orbitron text-2xl text-red-400">{overview.outOfStockCount}</p>
          </div>
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart size={16} className="text-moto-orange" />
              <span className="text-moto-steel text-xs font-orbitron">已预留</span>
            </div>
            <p className="font-orbitron text-2xl text-moto-orange">{overview.totalReserved}</p>
          </div>
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className={overview.unreadAlerts > 0 ? 'text-red-400' : 'text-moto-steel'} />
              <span className="text-moto-steel text-xs font-orbitron">未读预警</span>
            </div>
            <p className={`font-orbitron text-2xl ${overview.unreadAlerts > 0 ? 'text-red-400' : 'text-moto-steel'}`}>
              {overview.unreadAlerts}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['overview', 'alerts', 'purchase'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-orbitron transition-colors ${
              activeTab === tab
                ? 'bg-moto-orange text-white'
                : 'bg-carbon-800 text-moto-steel border border-carbon-500/20 hover:text-moto-silver'
            }`}
          >
            {tab === 'overview' ? '库存总览' : tab === 'alerts' ? '缺货预警' : '采购管理'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-moto-orange" />
        </div>
      ) : activeTab === 'overview' ? (
        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-carbon-500/20 flex items-center justify-between">
            <span className="text-moto-silver text-sm font-orbitron">配件库存明细</span>
            <span className="text-moto-steel text-xs">{inventoryList.length} 项</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">配件</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">分类</th>
                  <th className="text-center px-4 py-3 text-xs font-orbitron text-moto-steel">总库存</th>
                  <th className="text-center px-4 py-3 text-xs font-orbitron text-moto-steel">已预留</th>
                  <th className="text-center px-4 py-3 text-xs font-orbitron text-moto-steel">可用</th>
                  <th className="text-center px-4 py-3 text-xs font-orbitron text-moto-steel">状态</th>
                  <th className="text-center px-4 py-3 text-xs font-orbitron text-moto-steel">预警线</th>
                </tr>
              </thead>
              <tbody>
                {inventoryList.map((inv) => {
                  const part = adminParts.find((p) => p.id === inv.partId)
                  if (!part) return null
                  return (
                    <tr key={inv.partId} className="border-b border-carbon-500/20 hover:bg-carbon-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={part.image} alt={part.name} className="w-10 h-10 rounded-lg object-cover bg-carbon-700" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/></svg>' }} />
                          <div>
                            <p className="text-sm text-moto-silver font-medium">{part.name}</p>
                            <p className="text-xs text-moto-steel font-mono">{part.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-moto-steel">{getCategoryName(part.categoryId)}</td>
                      <td className="px-4 py-3 text-center text-sm text-moto-silver font-mono">{inv.totalStock}</td>
                      <td className="px-4 py-3 text-center text-sm text-moto-orange font-mono">{inv.reservedStock}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-mono font-bold ${
                          inv.stockLevel === 'out_of_stock' ? 'text-red-400' : inv.stockLevel === 'low_stock' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {inv.availableStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                          inv.stockLevel === 'out_of_stock'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : inv.stockLevel === 'low_stock'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              : 'bg-green-500/10 text-green-400 border-green-500/30'
                        }`}>
                          {inv.stockLevel === 'out_of_stock' ? <PackageX size={10} /> : inv.stockLevel === 'low_stock' ? <AlertTriangle size={10} /> : <Check size={10} />}
                          {inv.stockLevel === 'out_of_stock' ? '缺货' : inv.stockLevel === 'low_stock' ? '偏低' : '充足'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-moto-steel font-mono">{inv.alertThreshold}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'alerts' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30">
                <Filter size={14} className="text-moto-steel" />
                <select
                  value={alertFilterType}
                  onChange={(e) => setAlertFilterType(e.target.value as typeof alertFilterType)}
                  className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-carbon-800">全部类型</option>
                  <option value="out_of_stock" className="bg-carbon-800">缺货</option>
                  <option value="low_stock" className="bg-carbon-800">库存偏低</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleMarkAllAlertsRead}
              className="flex items-center gap-1.5 px-3 py-2 text-moto-orange text-sm hover:text-moto-orange-light transition-colors"
            >
              <BellOff size={14} />
              全部标为已读
            </button>
          </div>
          {filteredAlerts.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
              <Bell size={48} className="text-carbon-500 mx-auto mb-4" />
              <h2 className="font-orbitron text-moto-silver text-lg mb-2">暂无预警</h2>
              <p className="text-moto-steel text-sm">所有配件库存状态正常</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-carbon-800 rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                    alert.alertType === 'out_of_stock'
                      ? 'border-red-500/30'
                      : 'border-yellow-500/30'
                  } ${!alert.isRead ? 'bg-carbon-800' : 'opacity-60'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    alert.alertType === 'out_of_stock' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                  }`}>
                    {alert.alertType === 'out_of_stock'
                      ? <PackageX size={20} className="text-red-400" />
                      : <AlertTriangle size={20} className="text-yellow-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-moto-silver text-sm font-medium">{alert.partName}</p>
                      <span className="text-xs text-moto-steel font-mono">{alert.partSku}</span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      alert.alertType === 'out_of_stock' ? 'text-red-400' : 'text-yellow-500'
                    }`}>
                      {alert.alertType === 'out_of_stock'
                        ? '库存为零，无法满足订单需求'
                        : `当前库存 ${alert.currentStock} 件，低于预警线 ${alert.alertThreshold}`
                      }
                    </p>
                    <p className="text-[10px] text-moto-steel mt-0.5">
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAlertRead(alert.id)}
                        className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                        title="标为已读"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-carbon-900 rounded-lg px-3 py-2 border border-carbon-500/30">
              <Filter size={14} className="text-moto-steel" />
              <select
                value={poFilterStatus}
                onChange={(e) => setPoFilterStatus(e.target.value as PurchaseOrderStatus | 'all')}
                className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-carbon-800">全部状态</option>
                <option value="pending" className="bg-carbon-800">待审批</option>
                <option value="approved" className="bg-carbon-800">已审批</option>
                <option value="shipped" className="bg-carbon-800">运输中</option>
                <option value="received" className="bg-carbon-800">已入库</option>
                <option value="cancelled" className="bg-carbon-800">已取消</option>
              </select>
            </div>
          </div>

          {filteredPO.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-12 text-center">
              <ShoppingCart size={48} className="text-carbon-500 mx-auto mb-4" />
              <h2 className="font-orbitron text-moto-silver text-lg mb-2">暂无采购单</h2>
              <p className="text-moto-steel text-sm mb-6">点击右上角按钮创建采购单</p>
              <button
                onClick={() => setIsCreatePOModalOpen(true)}
                className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors"
              >
                新建采购单
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPO.map((po) => {
                const nextStatusIdx = PO_STATUS_FLOW.indexOf(po.status)
                const nextStatus = nextStatusIdx >= 0 && nextStatusIdx < PO_STATUS_FLOW.length - 1
                  ? PO_STATUS_FLOW[nextStatusIdx + 1]
                  : null

                return (
                  <div key={po.id} className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-carbon-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-orbitron text-moto-silver text-sm">{po.orderNo}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${PO_STATUS_BADGE[po.status].className}`}>
                          {PO_STATUS_BADGE[po.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {nextStatus && (
                          <button
                            onClick={() => handleUpdatePOStatus(po.id, nextStatus)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-xs font-orbitron hover:bg-moto-orange/20 transition-colors"
                          >
                            {nextStatus === 'approved' && <><Check size={12} /> 审批</>}
                            {nextStatus === 'shipped' && <><Truck size={12} /> 发货</>}
                            {nextStatus === 'received' && <><ClipboardCheck size={12} /> 入库</>}
                          </button>
                        )}
                        {po.status === 'pending' && (
                          <button
                            onClick={() => handleUpdatePOStatus(po.id, 'cancelled')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-orbitron hover:bg-red-500/20 transition-colors"
                          >
                            <X size={12} /> 取消
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePO(po.id)}
                          className="p-1.5 rounded-lg text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div className="flex items-center gap-4 mb-3 text-xs text-moto-steel">
                        <span className="flex items-center gap-1"><ShoppingCart size={12} /> {po.supplier}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(po.createdAt).toLocaleDateString('zh-CN')}</span>
                        {po.expectedDate && (
                          <span className="flex items-center gap-1"><Truck size={12} /> 预计 {new Date(po.expectedDate).toLocaleDateString('zh-CN')}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {po.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-moto-silver">{item.partName}</span>
                              <span className="text-moto-steel font-mono text-xs">{item.partSku}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-moto-steel">×{item.quantity}</span>
                              <span className="font-orbitron text-moto-orange text-xs">¥{item.subtotal.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-carbon-500/20">
                        <span className="text-moto-steel text-sm">合计</span>
                        <span className="font-orbitron text-moto-orange text-lg">¥{po.totalAmount.toLocaleString()}</span>
                      </div>
                      {po.remark && (
                        <p className="text-moto-steel text-xs mt-2">备注：{po.remark}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isCreatePOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreatePOModalOpen(false)} />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
              <h2 className="font-orbitron text-lg text-moto-silver">新建采购单</h2>
              <button onClick={() => setIsCreatePOModalOpen(false)} className="p-1.5 rounded-lg text-moto-steel hover:text-moto-silver hover:bg-carbon-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-moto-steel mb-1.5 block">供应商 *</label>
                  <input
                    type="text"
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    placeholder="输入供应商名称"
                    className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 placeholder:text-carbon-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-moto-steel mb-1.5 block">预计到货日期</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-moto-steel mb-1.5 block">备注</label>
                <textarea
                  value={poRemark}
                  onChange={(e) => setPoRemark(e.target.value)}
                  placeholder="可选备注信息"
                  rows={2}
                  className="w-full bg-carbon-900 border border-carbon-500/30 rounded-lg px-3 py-2 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 placeholder:text-carbon-500 resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-moto-steel">采购配件列表</label>
                  <span className="text-[10px] text-moto-steel">已选 {poSelectedParts.length} 项</span>
                </div>

                {poSelectedParts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {poSelectedParts.map((sp) => {
                      const part = adminParts.find((p) => p.id === sp.partId)
                      if (!part) return null
                      return (
                        <div key={sp.partId} className="flex items-center gap-3 bg-carbon-700/50 rounded-lg p-3">
                          <img src={part.image} alt={part.name} className="w-10 h-10 rounded object-cover bg-carbon-600" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/></svg>' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-moto-silver text-sm truncate">{part.name}</p>
                            <p className="text-moto-steel text-xs font-mono">{part.sku} · 成本 ¥{(part.costPrice || 0).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={sp.quantity}
                              onChange={(e) => updatePOPartQty(sp.partId, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 bg-carbon-900 border border-carbon-500/30 rounded px-2 py-1 text-moto-silver text-sm text-center focus:outline-none focus:border-moto-orange/50"
                              min={1}
                            />
                            <span className="font-orbitron text-xs text-moto-orange">
                              ¥{((part.costPrice || 0) * sp.quantity).toLocaleString()}
                            </span>
                          </div>
                          <button onClick={() => removePOPart(sp.partId)} className="p-1 text-moto-steel hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })}
                    <div className="text-right pt-2 border-t border-carbon-500/20">
                      <span className="text-moto-steel text-sm">采购合计：</span>
                      <span className="font-orbitron text-moto-orange text-lg ml-2">
                        ¥{poSelectedParts.reduce((sum, sp) => {
                          const part = adminParts.find((p) => p.id === sp.partId)
                          return sum + (part?.costPrice || 0) * sp.quantity
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-moto-steel mb-2">快速添加缺货/低库存配件</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {[...outOfStockParts, ...lowStockParts].filter(
                      (p) => !poSelectedParts.some((sp) => sp.partId === p.id)
                    ).map((part) => (
                      <button
                        key={part.id}
                        onClick={() => addPOPart(part.id)}
                        className="w-full flex items-center gap-3 rounded-lg p-2 bg-carbon-900/50 border border-carbon-500/20 hover:bg-carbon-700/50 hover:border-carbon-500/40 transition-colors text-left"
                      >
                        <img src={part.image} alt={part.name} className="w-8 h-8 rounded object-cover bg-carbon-600" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="%236b7280"><rect width="100%" height="100%" fill="%231f2937"/></svg>' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-moto-silver text-xs truncate">{part.name}</p>
                          <p className="text-[10px] text-moto-steel">{part.sku} · 库存 {part.stock}</p>
                        </div>
                        <Plus size={12} className="text-moto-orange shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-carbon-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCreatePOModalOpen(false)}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePO}
                disabled={!poSupplier || poSelectedParts.length === 0 || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                提交采购单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
