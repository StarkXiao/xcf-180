import { useMemo } from 'react'
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Edit,
  Check,
  X,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import type { QuotePlan, PlanComparisonResult } from '@/types'

interface PlanComparisonProps {
  plans: QuotePlan[]
  planAId: string
  planBId: string
  comparison: PlanComparisonResult | null
  onPlanASelect: (id: string) => void
  onPlanBSelect: (id: string) => void
  onCompare: () => void
  onClose: () => void
}

const DIFF_TYPE_LABELS: Record<string, string> = {
  added: '新增',
  removed: '移除',
  modified: '修改',
  unchanged: '无变化',
}

export default function PlanComparison({
  plans,
  planAId,
  planBId,
  comparison,
  onPlanASelect,
  onPlanBSelect,
  onCompare,
  onClose,
}: PlanComparisonProps) {
  const planA = plans.find((p) => p.id === planAId)
  const planB = plans.find((p) => p.id === planBId)

  const diffStats = useMemo(() => {
    if (!comparison) {
      return { added: 0, removed: 0, modified: 0, unchanged: 0 }
    }
    return comparison.items.reduce(
      (acc, item) => {
        acc[item.diffType] += 1
        return acc
      },
      { added: 0, removed: 0, modified: 0, unchanged: 0 } as Record<string, number>
    )
  }, [comparison])

  const canCompare = planAId && planBId && planAId !== planBId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-carbon-900 border border-carbon-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        <div className="p-5 border-b border-carbon-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-moto-orange/15 flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-moto-orange" />
            </div>
            <div>
              <h3 className="font-orbitron text-moto-silver text-lg">多方案比价</h3>
              <p className="text-moto-steel text-xs mt-0.5">
                对比两个方案的配件差异与价格变动
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-moto-steel hover:text-white transition-colors p-2 rounded-lg hover:bg-carbon-700/50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 border-b border-carbon-500/30 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
            <PlanSelect
              label="方案 A"
              plans={plans}
              selectedId={planAId}
              onSelect={onPlanASelect}
              variant="A"
            />
            <div className="hidden md:flex pb-2.5">
              <ArrowLeftRight size={20} className="text-moto-steel" />
            </div>
            <PlanSelect
              label="方案 B"
              plans={plans}
              selectedId={planBId}
              onSelect={onPlanBSelect}
              variant="B"
            />
            <button
              onClick={onCompare}
              disabled={!canCompare}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-moto-orange"
            >
              <RefreshCw size={16} />
              开始对比
            </button>
          </div>
        </div>

        {comparison ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-carbon-500/30 shrink-0">
              <PlanSummaryCard
                label="方案 A"
                plan={planA}
                variant="A"
              />
              <DiffSummaryCard
                totalDiff={comparison.totalDiff}
                totalDiffPercent={comparison.totalDiffPercent}
              />
              <PlanSummaryCard
                label="方案 B"
                plan={planB}
                variant="B"
              />
            </div>

            <div className="grid grid-cols-4 gap-3 px-5 pb-4 shrink-0">
              <DiffStatCard label="新增" value={diffStats.added} color="green" icon={<Plus size={12} />} />
              <DiffStatCard label="移除" value={diffStats.removed} color="red" icon={<Minus size={12} />} />
              <DiffStatCard label="修改" value={diffStats.modified} color="yellow" icon={<Edit size={12} />} />
              <DiffStatCard label="无变化" value={diffStats.unchanged} color="gray" icon={<Check size={12} />} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-carbon-700/40 border-b border-carbon-500/20">
                        <th className="text-left px-4 py-3 text-moto-steel text-xs font-orbitron">
                          配件名称
                        </th>
                        <th className="text-center px-4 py-3 text-moto-steel text-xs font-orbitron w-20">
                          A 数量
                        </th>
                        <th className="text-center px-4 py-3 text-moto-steel text-xs font-orbitron w-20">
                          B 数量
                        </th>
                        <th className="text-right px-4 py-3 text-moto-steel text-xs font-orbitron w-28">
                          A 金额
                        </th>
                        <th className="text-right px-4 py-3 text-moto-steel text-xs font-orbitron w-28">
                          B 金额
                        </th>
                        <th className="text-right px-4 py-3 text-moto-steel text-xs font-orbitron w-28">
                          差额
                        </th>
                        <th className="text-center px-4 py-3 text-moto-steel text-xs font-orbitron w-24">
                          差异类型
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-carbon-500/10">
                      {comparison.items.map((item) => (
                        <tr
                          key={item.partId}
                          className={`hover:bg-carbon-700/30 transition-colors ${
                            item.diffType === 'added'
                              ? 'bg-green-500/5'
                              : item.diffType === 'removed'
                                ? 'bg-red-500/5'
                                : item.diffType === 'modified'
                                  ? 'bg-yellow-500/5'
                                  : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-moto-silver text-sm">{item.partName}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-orbitron text-sm ${
                              item.diffType === 'removed' ? 'text-red-400 line-through opacity-60' : 'text-moto-silver'
                            }`}>
                              {item.quantityA}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-orbitron text-sm ${
                              item.diffType === 'added' ? 'text-green-400' : 'text-moto-silver'
                            }`}>
                              {item.quantityB}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-orbitron text-sm ${
                              item.diffType === 'removed' ? 'text-red-400 line-through opacity-60' : 'text-moto-silver'
                            }`}>
                              ¥{item.priceA.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-orbitron text-sm ${
                              item.diffType === 'added' ? 'text-green-400' : 'text-moto-silver'
                            }`}>
                              ¥{item.priceB.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-orbitron text-sm ${
                              item.priceDiff > 0
                                ? 'text-red-400'
                                : item.priceDiff < 0
                                  ? 'text-green-400'
                                  : 'text-moto-steel'
                            }`}>
                              {item.priceDiff > 0 ? '+' : ''}¥{item.priceDiff.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {getDiffBadge(item.diffType)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-5">
            <div className="w-20 h-20 rounded-2xl bg-carbon-800 border border-carbon-500/20 flex items-center justify-center mb-4">
              <ArrowLeftRight size={32} className="text-moto-steel" />
            </div>
            <p className="text-moto-steel text-sm mb-1">选择两个方案并点击"开始对比"</p>
            <p className="text-moto-steel text-xs opacity-60">系统将自动分析配件差异与价格变动</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getDiffBadge(diffType: string) {
  const badgeStyles: Record<string, string> = {
    added: 'bg-green-500/15 text-green-400 border-green-500/30',
    removed: 'bg-red-500/15 text-red-400 border-red-500/30',
    modified: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
    unchanged: 'bg-carbon-700 text-moto-steel border-carbon-500/30',
  }
  const icons: Record<string, React.ReactNode> = {
    added: <Plus size={10} />,
    removed: <Minus size={10} />,
    modified: <Edit size={10} />,
    unchanged: <Check size={10} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md border font-orbitron ${badgeStyles[diffType]}`}>
      {icons[diffType]}
      {DIFF_TYPE_LABELS[diffType]}
    </span>
  )
}

interface PlanSelectProps {
  label: string
  plans: QuotePlan[]
  selectedId: string
  onSelect: (id: string) => void
  variant: 'A' | 'B'
}

function PlanSelect({ label, plans, selectedId, onSelect, variant }: PlanSelectProps) {
  const variantColors = {
    A: {
      badge: 'bg-blue-500/20 text-blue-400',
      ring: 'focus:ring-blue-500/50 focus:border-blue-500/50',
    },
    B: {
      badge: 'bg-green-500/20 text-green-400',
      ring: 'focus:ring-green-500/50 focus:border-green-500/50',
    },
  }
  const colors = variantColors[variant]

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${colors.badge}`}>
          {label}
        </span>
      </div>
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full appearance-none px-4 py-2.5 pr-10 bg-carbon-800 border border-carbon-500/30 rounded-xl text-moto-silver text-sm focus:outline-none focus:ring-1 ${colors.ring} transition-colors cursor-pointer`}
        >
          <option value="">请选择方案</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
              {plan.isDefault ? ' (默认)' : ''} - ¥{plan.totalAmount.toLocaleString()}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel pointer-events-none"
        />
      </div>
    </div>
  )
}

interface PlanSummaryCardProps {
  label: string
  plan?: QuotePlan
  variant: 'A' | 'B'
}

function PlanSummaryCard({ label, plan, variant }: PlanSummaryCardProps) {
  const variantColors = {
    A: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      badge: 'bg-blue-500/20 text-blue-400',
    },
    B: {
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      badge: 'bg-green-500/20 text-green-400',
    },
  }
  const colors = variantColors[variant]

  return (
    <div className={`bg-carbon-800 rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${colors.badge}`}>
          {label}
        </span>
      </div>
      <h4 className="text-moto-silver text-sm font-medium truncate">
        {plan?.name || '未选择'}
      </h4>
      {plan?.description && (
        <p className="text-moto-steel text-[10px] mt-0.5 line-clamp-1">{plan.description}</p>
      )}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-moto-steel">配件</span>
          <span className="font-orbitron text-moto-silver">¥{plan?.partsTotal.toLocaleString() || '0'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-moto-steel">施工费</span>
          <span className="font-orbitron text-blue-400">¥{plan?.laborFeeTotal.toLocaleString() || '0'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-moto-steel">优惠</span>
          <span className="font-orbitron text-green-400">-¥{plan?.discountTotal.toLocaleString() || '0'}</span>
        </div>
        <div className="pt-2 mt-1.5 border-t border-carbon-500/20 flex items-center justify-between">
          <span className="text-moto-silver text-sm font-medium">总计</span>
          <span className="font-orbitron text-xl text-moto-silver">
            ¥{plan?.totalAmount.toLocaleString() || '0'}
          </span>
        </div>
      </div>
    </div>
  )
}

interface DiffSummaryCardProps {
  totalDiff: number
  totalDiffPercent: number
}

function DiffSummaryCard({ totalDiff, totalDiffPercent }: DiffSummaryCardProps) {
  const isPositive = totalDiff > 0
  const isNegative = totalDiff < 0
  const isZero = totalDiff === 0

  return (
    <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-4 bg-moto-orange/5 flex flex-col items-center justify-center">
      <p className="text-moto-steel text-xs font-orbitron mb-2">价格差额</p>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp size={20} className="text-red-400" />
        ) : isNegative ? (
          <TrendingDown size={20} className="text-green-400" />
        ) : (
          <Minus size={20} className="text-moto-steel" />
        )}
        <p className={`font-orbitron text-2xl font-bold ${
          isPositive ? 'text-red-400' : isNegative ? 'text-green-400' : 'text-moto-silver'
        }`}>
          {isPositive ? '+' : ''}¥{totalDiff.toLocaleString()}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-orbitron px-2 py-0.5 rounded ${
          isPositive
            ? 'bg-red-500/15 text-red-400'
            : isNegative
              ? 'bg-green-500/15 text-green-400'
              : 'bg-carbon-700 text-moto-steel'
        }`}>
          {isPositive && <TrendingUp size={10} />}
          {isNegative && <TrendingDown size={10} />}
          {isPositive ? '+' : ''}{totalDiffPercent.toFixed(2)}%
        </span>
        <span className="text-moto-steel text-[10px]">
          {isPositive ? '价格增加' : isNegative ? '价格节省' : '价格持平'}
        </span>
      </div>
    </div>
  )
}

interface DiffStatCardProps {
  label: string
  value: number
  color: 'green' | 'red' | 'yellow' | 'gray'
  icon: React.ReactNode
}

function DiffStatCard({ label, value, color, icon }: DiffStatCardProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500/10 border-green-500/25 text-green-400',
    red: 'bg-red-500/10 border-red-500/25 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
    gray: 'bg-carbon-700/50 border-carbon-500/25 text-moto-steel',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-3 text-center`}>
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="font-orbitron text-xl">{value}</span>
      </div>
      <p className="text-moto-steel text-[10px] mt-1">{label}</p>
    </div>
  )
}
