import { X, TrendingUp, TrendingDown, Minus, ArrowRight, ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { PartDiffItem } from '@/types'

interface VersionDiffModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function VersionDiffModal({ isOpen, onClose }: VersionDiffModalProps) {
  const {
    compareVersions,
    compareVersionIdA,
    compareVersionIdB,
    versions,
  } = useStore()

  const comparison = compareVersions()

  const versionA = versions.find((v) => v.id === compareVersionIdA)
  const versionB = versions.find((v) => v.id === compareVersionIdB)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDiffBadge = (diffType: string) => {
    switch (diffType) {
      case 'added':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-orbitron">
            新增
          </span>
        )
      case 'removed':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-orbitron">
            移除
          </span>
        )
      case 'modified':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-orbitron">
            变更
          </span>
        )
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-carbon-600 text-moto-steel font-orbitron">
            不变
          </span>
        )
    }
  }

  const renderPartRow = (item: PartDiffItem, side: 'A' | 'B') => {
    const isSideA = side === 'A'
    const quantity = isSideA ? item.quantityA : item.quantityB
    const price = isSideA ? item.priceA : item.priceB
    const isHidden = (item.diffType === 'added' && isSideA) || (item.diffType === 'removed' && !isSideA)

    if (isHidden) {
      return <div className="flex-1 opacity-30" />
    }

    return (
      <div className="flex-1 flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={item.part?.image}
            alt={item.part?.name}
            className="w-10 h-10 rounded-lg object-cover bg-carbon-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${item.part?.categoryId}+part+product+photo+dark+background&image_size=square`
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-moto-silver text-xs font-medium truncate">{item.part?.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-moto-steel text-[10px]">×{quantity}</span>
            <span className="text-moto-orange font-orbitron text-xs">¥{price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen || !comparison) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-carbon-900 border border-carbon-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        <div className="p-5 border-b border-carbon-500/30 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-orbitron text-moto-silver text-lg">版本差异对比</h3>
            <p className="text-moto-steel text-xs mt-1">
              查看两个版本之间的配件变化与价格差异
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-moto-steel hover:text-white transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 border-b border-carbon-500/30 shrink-0">
          <VersionCard
            label="版本 A"
            title={versionA?.description || `版本 ${versionA?.versionNumber}`}
            subtitle={formatDate(versionA?.createdAt)}
            total={comparison.totalA}
            variant="A"
          />
          <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-4 bg-moto-orange/5 flex flex-col items-center justify-center">
            <p className="text-moto-steel text-xs font-orbitron mb-1">价格差额</p>
            <div className="flex items-center gap-2">
              {comparison.totalDiff > 0 ? (
                <TrendingUp size={18} className="text-red-400" />
              ) : comparison.totalDiff < 0 ? (
                <TrendingDown size={18} className="text-green-400" />
              ) : (
                <Minus size={18} className="text-moto-steel" />
              )}
              <p className={`font-orbitron text-xl ${
                comparison.totalDiff > 0
                  ? 'text-red-400'
                  : comparison.totalDiff < 0
                    ? 'text-green-400'
                    : 'text-moto-silver'
              }`}>
                {comparison.totalDiff >= 0 ? '+' : ''}¥{comparison.totalDiff.toLocaleString()}
              </p>
            </div>
            <p className="text-moto-steel text-xs mt-1">
              {comparison.totalDiffPercent >= 0 ? '+' : ''}
              {comparison.totalDiffPercent.toFixed(2)}%
            </p>
          </div>
          <VersionCard
            label="版本 B"
            title={versionB?.description || `版本 ${versionB?.versionNumber}`}
            subtitle={formatDate(versionB?.createdAt)}
            total={comparison.totalB}
            variant="B"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 px-4 pb-4 shrink-0">
          <StatCard label="新增配件" value={comparison.addedCount} color="green" />
          <StatCard label="移除配件" value={comparison.removedCount} color="red" />
          <StatCard label="数量变更" value={comparison.modifiedCount} color="yellow" />
          <StatCard label="保持不变" value={comparison.unchangedCount} color="gray" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comparison.categories.map((cat) => (
            <div
              key={cat.categoryId}
              className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-carbon-500/20 flex items-center justify-between bg-carbon-700/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-orbitron text-moto-silver text-xs">{cat.categoryName}</h3>
                  {cat.items.filter((i) => i.diffType !== 'unchanged').length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-moto-orange/20 text-moto-orange font-orbitron">
                      {cat.items.filter((i) => i.diffType !== 'unchanged').length} 项变动
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-blue-400 font-orbitron">A: ¥{cat.subtotalA.toLocaleString()}</span>
                  <ArrowRight size={10} className="text-moto-steel" />
                  <span className="text-green-400 font-orbitron">B: ¥{cat.subtotalB.toLocaleString()}</span>
                </div>
              </div>
              <div className="divide-y divide-carbon-500/10">
                {cat.items.map((item) => (
                  <div
                    key={item.partId}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-carbon-700/20 transition-colors"
                  >
                    {renderPartRow(item, 'A')}
                    <div className="shrink-0 flex flex-col items-center">
                      {getDiffBadge(item.diffType)}
                      <div className="text-moto-steel text-[10px] mt-1">
                        {item.priceDiff !== 0 && (
                          <span className={item.priceDiff > 0 ? 'text-red-400' : 'text-green-400'}>
                            {item.priceDiff >= 0 ? '+' : ''}¥{item.priceDiff.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {renderPartRow(item, 'B')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface VersionCardProps {
  label: string
  title: string
  subtitle: string
  total: number
  variant: 'A' | 'B'
}

function VersionCard({ label, title, subtitle, total, variant }: VersionCardProps) {
  return (
    <div className={`bg-carbon-800 rounded-xl border p-4 ${
      variant === 'A' ? 'border-blue-500/30 bg-blue-500/5' : 'border-green-500/30 bg-green-500/5'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${
          variant === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
        }`}>
          {label}
        </span>
      </div>
      <h4 className="text-moto-silver text-sm font-medium truncate">{title}</h4>
      <p className="text-moto-steel text-[10px] mt-0.5">{subtitle}</p>
      <p className="font-orbitron text-lg text-moto-silver mt-2">¥{total.toLocaleString()}</p>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  color: 'green' | 'red' | 'yellow' | 'gray'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    gray: 'bg-carbon-700/50 border-carbon-500/20 text-moto-steel',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-3 text-center`}>
      <p className="font-orbitron text-xl">{value}</p>
      <p className="text-moto-steel text-[10px] mt-1">{label}</p>
    </div>
  )
}
