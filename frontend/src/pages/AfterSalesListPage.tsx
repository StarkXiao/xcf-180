import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Link } from 'react-router-dom'
import { Wrench, Search, Filter, Plus, ChevronRight, Clock, User, AlertCircle, Package, TrendingUp, CheckCircle, XCircle, Loader, Shield, Car } from 'lucide-react'
import type { AfterSalesStatus, AfterSalesPriority, AfterSalesType, IssueCategory } from '@/types'
import { AFTER_SALES_STATUS_LABELS, AFTER_SALES_STATUS_COLORS, AFTER_SALES_PRIORITY_LABELS, AFTER_SALES_PRIORITY_COLORS, AFTER_SALES_TYPE_LABELS, ISSUE_CATEGORY_LABELS } from '@/types'
import AfterSalesFormModal from '@/components/AfterSalesFormModal'

const STATUS_OPTIONS: { value: AfterSalesStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待受理' },
  { value: 'inspecting', label: '检测中' },
  { value: 'parts_ordered', label: '配件订购中' },
  { value: 'repairing', label: '维修中' },
  { value: 'testing', label: '测试验收' },
  { value: 'completed', label: '处理完成' },
  { value: 'customer_pickup', label: '待客户取车' },
  { value: 'closed', label: '已结案' },
  { value: 'cancelled', label: '已取消' },
]

const PRIORITY_OPTIONS: { value: AfterSalesPriority | 'all'; label: string }[] = [
  { value: 'all', label: '全部优先级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

const TYPE_OPTIONS: { value: AfterSalesType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'repair', label: '维修服务' },
  { value: 'warranty_claim', label: '质保索赔' },
  { value: 'exchange', label: '换货服务' },
  { value: 'refund', label: '退款处理' },
  { value: 'consultation', label: '技术咨询' },
]

const ISSUE_CATEGORY_OPTIONS: { value: IssueCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部问题' },
  { value: 'quality_defect', label: '质量缺陷' },
  { value: 'compatibility_issue', label: '适配问题' },
  { value: 'installation_error', label: '安装失误' },
  { value: 'damage_during_shipping', label: '运输损坏' },
  { value: 'wear_and_tear', label: '正常损耗' },
  { value: 'user_misuse', label: '使用不当' },
  { value: 'design_flaw', label: '设计缺陷' },
  { value: 'other', label: '其他问题' },
]

export default function AfterSalesListPage() {
  const {
    afterSalesLoading,
    afterSalesRecords,
    afterSalesFilterStatus,
    afterSalesFilterPriority,
    afterSalesFilterType,
    afterSalesFilterIssueCategory,
    afterSalesSearchKeyword,
    afterSalesStats,
    fetchAfterSalesRecords,
    fetchAfterSalesStats,
    setAfterSalesFilterStatus,
    setAfterSalesFilterPriority,
    setAfterSalesFilterType,
    setAfterSalesFilterIssueCategory,
    setAfterSalesSearchKeyword,
    getFilteredAfterSales,
  } = useStore()

  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchAfterSalesRecords()
    fetchAfterSalesStats()
  }, [])

  const records = getFilteredAfterSales()

  const statusCounts: Record<string, number> = { all: afterSalesRecords.length }
  for (const s of Object.keys(AFTER_SALES_STATUS_LABELS)) {
    statusCounts[s] = afterSalesRecords.filter((o) => o.status === s).length
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              售后服务
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              共 {afterSalesRecords.length} 条售后工单
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors"
          >
            <Plus size={14} />
            新建工单
          </button>
        </div>

        {afterSalesStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-moto-steel">待受理</p>
                  <p className="font-orbitron text-xl text-moto-silver">{afterSalesStats.pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Wrench size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-moto-steel">处理中</p>
                  <p className="font-orbitron text-xl text-moto-silver">{afterSalesStats.inProgressCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-moto-steel">已完成</p>
                  <p className="font-orbitron text-xl text-moto-silver">{afterSalesStats.completedCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-moto-orange/10">
                  <TrendingUp size={20} className="text-moto-orange" />
                </div>
                <div>
                  <p className="text-xs text-moto-steel">客户费用</p>
                  <p className="font-orbitron text-xl text-moto-orange">¥{afterSalesStats.totalCustomerCharge.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Filter size={14} className="text-moto-steel" />
            <select
              value={afterSalesFilterStatus}
              onChange={(e) => setAfterSalesFilterStatus(e.target.value as AfterSalesStatus | 'all')}
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
            <AlertCircle size={14} className="text-moto-steel" />
            <select
              value={afterSalesFilterPriority}
              onChange={(e) => setAfterSalesFilterPriority(e.target.value as AfterSalesPriority | 'all')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-carbon-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Wrench size={14} className="text-moto-steel" />
            <select
              value={afterSalesFilterType}
              onChange={(e) => setAfterSalesFilterType(e.target.value as AfterSalesType | 'all')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-carbon-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <XCircle size={14} className="text-moto-steel" />
            <select
              value={afterSalesFilterIssueCategory}
              onChange={(e) => setAfterSalesFilterIssueCategory(e.target.value as IssueCategory | 'all')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              {ISSUE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-carbon-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Search size={14} className="text-moto-steel" />
            <input
              type="text"
              value={afterSalesSearchKeyword}
              onChange={(e) => setAfterSalesSearchKeyword(e.target.value)}
              placeholder="搜索工单号/客户/订单号..."
              className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-48"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
          {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) => {
            const count = statusCounts[opt.value] || 0
            if (count === 0) return null
            const config = AFTER_SALES_STATUS_COLORS[opt.value as AfterSalesStatus]
            return (
              <button
                key={opt.value}
                onClick={() => setAfterSalesFilterStatus(opt.value as AfterSalesStatus)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  afterSalesFilterStatus === opt.value
                    ? `${config} border-current`
                    : 'bg-carbon-800 text-moto-steel border-carbon-500/20 hover:border-carbon-500/40'
                }`}
              >
                {AFTER_SALES_STATUS_LABELS[opt.value as AfterSalesStatus]}
                <span className="font-orbitron">{count}</span>
              </button>
            )
          })}
        </div>

        {afterSalesLoading ? (
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
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Wrench size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">暂无售后工单</h2>
            <p className="text-moto-steel text-sm mb-6">点击右上角按钮新建售后工单</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              新建工单
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const statusConfig = AFTER_SALES_STATUS_COLORS[record.status]
              const statusLabel = AFTER_SALES_STATUS_LABELS[record.status]
              const priorityConfig = AFTER_SALES_PRIORITY_COLORS[record.priority]
              const priorityLabel = AFTER_SALES_PRIORITY_LABELS[record.priority]
              const typeLabel = AFTER_SALES_TYPE_LABELS[record.type]
              return (
                <Link
                  key={record.id}
                  to={`/after-sales/${record.id}`}
                  className="block bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 hover:border-carbon-500/40 transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-orbitron text-moto-silver text-sm">{record.afterSalesNo}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusConfig}`}>
                          {statusLabel}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${priorityConfig}`}>
                          {priorityLabel}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-moto-orange/10 text-moto-orange border border-moto-orange/30">
                          {typeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-moto-steel flex-wrap">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {record.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {record.orderNo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car size={10} />
                          {record.modelName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield size={10} />
                          {ISSUE_CATEGORY_LABELS[record.issueCategory]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {record.issueDescription && (
                        <p className="text-xs text-moto-steel mt-2 line-clamp-1">
                          {record.issueDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        {record.items.length > 0 && (
                          <p className="text-[10px] text-moto-steel">{record.items.length} 项配件</p>
                        )}
                        <p className="font-orbitron text-lg text-moto-orange">¥{record.customerCharge.toLocaleString()}</p>
                        {record.warrantyCoverage > 0 && (
                          <p className="text-[10px] text-green-400">质保覆盖 ¥{record.warrantyCoverage.toLocaleString()}</p>
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
      <AfterSalesFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
