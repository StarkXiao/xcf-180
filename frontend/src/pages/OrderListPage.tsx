import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, Filter, Eye, Package, Clock, User, ChevronRight, Truck, CheckCircle2, XCircle, AlertCircle, Wrench, Factory } from 'lucide-react'
import type { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: '待报价', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/30', icon: <Clock size={12} /> },
  quoted: { label: '已报价', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30', icon: <AlertCircle size={12} /> },
  confirmed: { label: '已确认', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/30', icon: <CheckCircle2 size={12} /> },
  in_production: { label: '生产中', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30', icon: <Factory size={12} /> },
  shipped: { label: '已发货', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/30', icon: <Truck size={12} /> },
  delivered: { label: '已交付', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30', icon: <Package size={12} /> },
  completed: { label: '已完成', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: '已取消', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30', icon: <XCircle size={12} /> },
}

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待报价' },
  { value: 'quoted', label: '已报价' },
  { value: 'confirmed', label: '已确认' },
  { value: 'in_production', label: '生产中' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已交付' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function OrderListPage() {
  const {
    ordersLoading,
    orderFilterStatus,
    orderFilterDealerName,
    orderFilterModelId,
    bikeModels,
    fetchOrders,
    setOrderFilterStatus,
    setOrderFilterDealerName,
    setOrderFilterModelId,
    getFilteredOrders,
  } = useStore()

  useEffect(() => {
    fetchOrders()
  }, [])

  const orders = getFilteredOrders()

  const statusCounts: Record<string, number> = { all: orders.length }
  for (const s of Object.keys(STATUS_CONFIG)) {
    statusCounts[s] = orders.filter((o) => o.status === s).length
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              订单管理
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              共 {orders.length} 条订单
            </p>
          </div>
          <Link
            to="/list"
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors"
          >
            <ClipboardList size={14} />
            新建订单
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Filter size={14} className="text-moto-steel" />
            <select
              value={orderFilterStatus}
              onChange={(e) => setOrderFilterStatus(e.target.value as OrderStatus | 'all')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-carbon-800">
                  {opt.label} {opt.value !== 'all' && statusCounts[opt.value] ? `(${statusCounts[opt.value]})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Search size={14} className="text-moto-steel" />
            <input
              type="text"
              value={orderFilterDealerName}
              onChange={(e) => setOrderFilterDealerName(e.target.value)}
              placeholder="搜索经销商..."
              className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-36"
            />
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Wrench size={14} className="text-moto-steel" />
            <select
              value={orderFilterModelId}
              onChange={(e) => setOrderFilterModelId(e.target.value)}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-carbon-800">全部车型</option>
              {bikeModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-carbon-800">{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
          {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) => {
            const count = statusCounts[opt.value] || 0
            if (count === 0) return null
            const config = STATUS_CONFIG[opt.value as OrderStatus]
            return (
              <button
                key={opt.value}
                onClick={() => setOrderFilterStatus(opt.value as OrderStatus)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  orderFilterStatus === opt.value
                    ? `${config.bgColor} ${config.color} border-current`
                    : 'bg-carbon-800 text-moto-steel border-carbon-500/20 hover:border-carbon-500/40'
                }`}
              >
                {config.icon}
                {opt.label}
                <span className="font-orbitron">{count}</span>
              </button>
            )
          })}
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-carbon-700 rounded w-40" />
                    <div className="h-3 bg-carbon-700 rounded w-24" />
                  </div>
                  <div className="h-8 bg-carbon-700 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardList size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无订单</h2>
            <p className="text-moto-steel text-sm mb-6">前往选配清单创建订单</p>
            <Link
              to="/list"
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              开始选配
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status]
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 hover:border-carbon-500/40 transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-orbitron text-moto-silver text-sm">{order.orderNo}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {order.afterSaleNotes.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/30">
                            <AlertCircle size={10} />
                            售后 {order.afterSaleNotes.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-moto-steel">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {order.dealerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench size={10} />
                          {order.modelName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {order.items.length} 项配件
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-orbitron text-lg text-moto-orange">¥{order.totalAmount.toLocaleString()}</p>
                        {order.discount > 0 && (
                          <p className="text-[10px] text-green-400">优惠 ¥{order.discount.toLocaleString()}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-carbon-500 group-hover:text-moto-orange transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
