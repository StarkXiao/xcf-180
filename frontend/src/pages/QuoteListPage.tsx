import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Link } from 'react-router-dom'
import { FileText, Search, Filter, Plus, Clock, User, ChevronRight, Package, Wrench, Eye } from 'lucide-react'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, type QuoteStatus, type Quote, type QuotePlan } from '@/types'

const STATUS_OPTIONS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_approval', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'sent_to_customer', label: '已发客户' },
  { value: 'customer_confirmed', label: '客户确认' },
  { value: 'customer_rejected', label: '客户拒绝' },
  { value: 'expired', label: '已过期' },
  { value: 'converted', label: '已转订单' },
]

const STATUS_ICONS: Record<QuoteStatus, React.ReactNode> = {
  draft: <FileText size={12} />,
  pending_approval: <Clock size={12} />,
  approved: <Eye size={12} />,
  rejected: <Eye size={12} />,
  sent_to_customer: <User size={12} />,
  customer_confirmed: <Eye size={12} />,
  customer_rejected: <Eye size={12} />,
  expired: <Clock size={12} />,
  converted: <Package size={12} />,
}

function getStatusStyleConfig(status: QuoteStatus): { label: string; color: string; bgColor: string; icon: React.ReactNode } {
  const baseColor = QUOTE_STATUS_COLORS[status]
  const colorMap: Record<string, string> = {
    'bg-gray-500': 'text-gray-400',
    'bg-yellow-500': 'text-yellow-400',
    'bg-green-500': 'text-green-400',
    'bg-red-500': 'text-red-400',
    'bg-blue-500': 'text-blue-400',
    'bg-emerald-500': 'text-emerald-400',
    'bg-rose-500': 'text-rose-400',
    'bg-zinc-500': 'text-zinc-400',
    'bg-purple-500': 'text-purple-400',
  }
  const bgColorMap: Record<string, string> = {
    'bg-gray-500': 'bg-gray-500/10 border-gray-500/30',
    'bg-yellow-500': 'bg-yellow-500/10 border-yellow-500/30',
    'bg-green-500': 'bg-green-500/10 border-green-500/30',
    'bg-red-500': 'bg-red-500/10 border-red-500/30',
    'bg-blue-500': 'bg-blue-500/10 border-blue-500/30',
    'bg-emerald-500': 'bg-emerald-500/10 border-emerald-500/30',
    'bg-rose-500': 'bg-rose-500/10 border-rose-500/30',
    'bg-zinc-500': 'bg-zinc-500/10 border-zinc-500/30',
    'bg-purple-500': 'bg-purple-500/10 border-purple-500/30',
  }
  return {
    label: QUOTE_STATUS_LABELS[status],
    color: colorMap[baseColor] || 'text-moto-silver',
    bgColor: bgColorMap[baseColor] || 'bg-carbon-700 border-carbon-500/30',
    icon: STATUS_ICONS[status],
  }
}

export default function QuoteListPage() {
  const {
    quotesLoading,
    quoteFilterStatus,
    quoteFilterCustomerName,
    quoteFilterModelId,
    bikeModels,
    fetchQuotes,
    setQuoteFilterStatus,
    setQuoteFilterCustomerName,
    setQuoteFilterModelId,
    getFilteredQuotes,
  } = useStore()

  useEffect(() => {
    fetchQuotes()
  }, [])

  const quotes = getFilteredQuotes().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const statusCounts: Record<string, number> = { all: quotes.length }
  for (const s of Object.keys(QUOTE_STATUS_LABELS)) {
    statusCounts[s] = quotes.filter((q) => q.status === s).length
  }

  const getQuoteTotalAmount = (quote: Quote) => {
    if (quote.activePlanId) {
      const activePlan = quote.plans.find((p: QuotePlan) => p.id === quote.activePlanId)
      if (activePlan) return activePlan.totalAmount
    }
    const defaultPlan = quote.plans.find((p: QuotePlan) => p.isDefault)
    if (defaultPlan) return defaultPlan.totalAmount
    if (quote.plans.length > 0) return quote.plans[0].totalAmount
    return 0
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              报价管理
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              共 {quotes.length} 条报价单
            </p>
          </div>
          <Link
            to="/list"
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors"
          >
            <Plus size={14} />
            新建报价
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Filter size={14} className="text-moto-steel" />
            <select
              value={quoteFilterStatus}
              onChange={(e) => setQuoteFilterStatus(e.target.value as QuoteStatus | 'all')}
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
              value={quoteFilterCustomerName}
              onChange={(e) => setQuoteFilterCustomerName(e.target.value)}
              placeholder="搜索客户名称..."
              className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-36"
            />
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Wrench size={14} className="text-moto-steel" />
            <select
              value={quoteFilterModelId}
              onChange={(e) => setQuoteFilterModelId(e.target.value)}
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
            const config = getStatusStyleConfig(opt.value as QuoteStatus)
            return (
              <button
                key={opt.value}
                onClick={() => setQuoteFilterStatus(opt.value as QuoteStatus)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  quoteFilterStatus === opt.value
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

        {quotesLoading ? (
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
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无报价单</h2>
            <p className="text-moto-steel text-sm mb-6">前往选配清单创建报价单</p>
            <Link
              to="/list"
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              开始选配
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const statusConfig = getStatusStyleConfig(quote.status)
              const totalAmount = getQuoteTotalAmount(quote)
              return (
                <Link
                  key={quote.id}
                  to={`/quotes/${quote.id}`}
                  className="block bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 hover:border-carbon-500/40 transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-orbitron text-moto-silver text-sm">{quote.quoteNo}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-moto-steel">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {quote.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench size={10} />
                          {quote.modelName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {quote.plans.length} 个方案
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(quote.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-orbitron text-lg text-moto-orange">¥{totalAmount.toLocaleString()}</p>
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
