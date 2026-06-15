import React from 'react'
import { PartWarning, WARNING_LEVEL_LABELS, WARNING_LEVEL_COLORS } from '@/types'

interface PartWarningPanelProps {
  warnings: PartWarning[]
  loading?: boolean
  onAcknowledge?: (warningId: string, notes?: string) => Promise<void>
  onDismiss?: (warningId: string) => Promise<void>
}

const PartWarningPanel: React.FC<PartWarningPanelProps> = ({ warnings, loading, onAcknowledge, onDismiss }) => {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'warning':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getWarningTypeLabel = (type: string) => {
    switch (type) {
      case 'low_rating':
        return '低评分'
      case 'quality_complaints':
        return '质量投诉'
      case 'compatibility_issues':
        return '适配问题'
      case 'installation':
        return '安装问题'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (warnings.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">暂无预警</h3>
        <p className="text-zinc-500 dark:text-zinc-400">当前所有配件评分正常，无需处理</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={`bg-white dark:bg-zinc-900 rounded-xl p-6 border-l-4 ${
            warning.warningLevel === 'danger'
              ? 'border-red-500'
              : 'border-orange-500'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              WARNING_LEVEL_COLORS[warning.warningLevel].replace('bg-', 'bg-opacity-20 text-')
            }`}>
              {getLevelIcon(warning.warningLevel)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${WARNING_LEVEL_COLORS[warning.warningLevel]}`}>
                  {WARNING_LEVEL_LABELS[warning.warningLevel]}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                  {getWarningTypeLabel(warning.warningType)}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(warning.createdAt).toLocaleString('zh-CN')}
                </span>
                {!warning.isActive && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                    已处理
                  </span>
                )}
                {warning.acknowledgedBy && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                    已确认
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                配件：{warning.partName}
              </h4>
              <h5 className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                {warning.title}
              </h5>
              <p className="text-zinc-700 dark:text-zinc-300 mb-4">{warning.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">当前值</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">{warning.currentValue}</div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">预警阈值</div>
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{warning.threshold}</div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">涉及评价</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">{warning.affectedReviews}</div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">涉及问题</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{warning.affectedIssues}</div>
                </div>
              </div>

              {warning.acknowledgedBy && (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  {warning.acknowledgedAt && (
                    <span>确认时间：{new Date(warning.acknowledgedAt).toLocaleString('zh-CN')}，</span>
                  )}
                  确认人：{warning.acknowledgedBy}
                </div>
              )}

              {warning.isActive && !warning.acknowledgedBy && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onAcknowledge?.(warning.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                  >
                    确认预警
                  </button>
                  <button
                    onClick={() => onDismiss?.(warning.id)}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium transition-colors"
                  >
                    忽略
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PartWarningPanel
