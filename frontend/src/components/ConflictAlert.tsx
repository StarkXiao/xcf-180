import { AlertTriangle, XCircle, X } from 'lucide-react'
import type { CompatibilityConflict } from '@/types'
import { useStore } from '@/store/useStore'

interface Props {
  conflicts?: CompatibilityConflict[]
  warnings?: CompatibilityConflict[]
  compact?: boolean
  onDismiss?: () => void
}

export default function ConflictAlert({ conflicts = [], warnings = [], compact = false, onDismiss }: Props) {
  const { removePartFromSelection } = useStore()

  if (conflicts.length === 0 && warnings.length === 0) return null

  const getCounterpart = (c: CompatibilityConflict, excludePartId?: string) => {
    if (excludePartId) {
      return c.partId === excludePartId
        ? { id: c.conflictPartId, name: c.conflictPartName }
        : { id: c.partId, name: c.partName }
    }
    return null
  }

  const renderItem = (c: CompatibilityConflict, isError: boolean, highlightPartId?: string) => {
    const counterpart = highlightPartId ? getCounterpart(c, highlightPartId) : null
    const counterpartName = counterpart?.name ?? (c.partName + ' ↔ ' + c.conflictPartName)

    return (
      <div
        key={`${c.partId}-${c.conflictPartId}`}
        className={`flex items-start gap-2 ${isError ? 'text-red-400' : 'text-yellow-500'}`}
      >
        {isError ? <XCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0 text-xs leading-relaxed">
          {highlightPartId ? (
            <span>
              与「<span className="font-medium">{counterpartName}</span>」{isError ? '存在安装冲突' : '搭配需谨慎'}
            </span>
          ) : (
            <span>{c.message}</span>
          )}
          {!compact && counterpart && (
            <button
              onClick={() => counterpart && removePartFromSelection(counterpart.id)}
              className="ml-2 underline underline-offset-2 hover:text-white transition-colors"
            >
              移除
            </button>
          )}
        </div>
      </div>
    )
  }

  const allErrors = [...conflicts]
  const allWarnings = [...warnings]
  const totalCount = allErrors.length + allWarnings.length

  return (
    <div
      className={`animate-fade-in ${
        compact
          ? 'rounded-lg border p-2.5 space-y-1.5'
          : 'rounded-xl border p-4 space-y-3'
      } ${
        allErrors.length > 0
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-yellow-500/5 border-yellow-500/30'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {allErrors.length > 0 ? (
            <XCircle size={compact ? 14 : 18} className="text-red-400 shrink-0" />
          ) : (
            <AlertTriangle size={compact ? 14 : 18} className="text-yellow-500 shrink-0" />
          )}
          <span
            className={`font-orbitron ${compact ? 'text-xs' : 'text-sm'} ${
              allErrors.length > 0 ? 'text-red-400' : 'text-yellow-500'
            }`}
          >
            {allErrors.length > 0
              ? `兼容冲突${compact ? ` (${totalCount})` : ''}`
              : `搭配提醒${compact ? ` (${totalCount})` : ''}`
            }
          </span>
          {!compact && (
            <span className="text-moto-steel text-xs">
              {allErrors.length > 0 && `${allErrors.length} 项错误`}
              {allErrors.length > 0 && allWarnings.length > 0 && ' · '}
              {allWarnings.length > 0 && `${allWarnings.length} 项提醒`}
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-moto-steel hover:text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className={`space-y-1.5 ${compact ? 'pl-6' : 'pl-7'}`}>
        {allErrors.map((c) => renderItem(c, true))}
        {allWarnings.map((c) => renderItem(c, false))}
      </div>
    </div>
  )
}
