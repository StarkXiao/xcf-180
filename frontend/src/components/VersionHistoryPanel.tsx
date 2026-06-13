import { useState } from 'react'
import { Clock, RotateCcw, Plus, Trash2, ChevronRight, History, X, GitCompare, Sparkles } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { SelectionVersion } from '@/types'

interface VersionHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onCompare?: (versionA: string, versionB: string) => void
}

export default function VersionHistoryPanel({ isOpen, onClose, onCompare }: VersionHistoryPanelProps) {
  const {
    versions,
    versionsLoading,
    currentSelection,
    createVersionSnapshot,
    rollbackToVersion,
    deleteVersion,
    compareVersionIdA,
    compareVersionIdB,
    setCompareVersionA,
    setCompareVersionB,
  } = useStore()

  const [snapshotName, setSnapshotName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [rollbackConfirm, setRollbackConfirm] = useState<string | null>(null)

  const handleCreateSnapshot = async () => {
    await createVersionSnapshot(snapshotName || undefined)
    setSnapshotName('')
    setShowCreateForm(false)
  }

  const handleRollback = async (versionId: string) => {
    await rollbackToVersion(versionId)
    setRollbackConfirm(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleCompareVersion = (versionId: string) => {
    if (compareVersionIdA === versionId) {
      setCompareVersionA(null)
    } else if (compareVersionIdB === versionId) {
      setCompareVersionB(null)
    } else if (!compareVersionIdA) {
      setCompareVersionA(versionId)
    } else if (!compareVersionIdB) {
      setCompareVersionB(versionId)
    } else {
      setCompareVersionA(versionId)
      setCompareVersionB(null)
    }
  }

  const isSelectedForCompare = (versionId: string) => {
    return compareVersionIdA === versionId || compareVersionIdB === versionId
  }

  const getCompareBadge = (versionId: string) => {
    if (compareVersionIdA === versionId) return 'A'
    if (compareVersionIdB === versionId) return 'B'
    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-carbon-900 border-l border-carbon-500/30 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-moto-orange" />
            <h3 className="font-orbitron text-moto-silver text-sm">版本历史</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-700 text-moto-steel font-orbitron">
              {versions.length} 个版本
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-moto-steel hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-carbon-500/30">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              <Plus size={16} />
              创建快照
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="版本描述（可选）"
                className="w-full bg-carbon-800 text-moto-silver rounded-lg px-3 py-2 text-sm border border-carbon-500/30 focus:border-moto-orange/50 focus:outline-none transition-colors placeholder:text-moto-steel/50"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setSnapshotName('')
                  }}
                  className="flex-1 px-3 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateSnapshot}
                  className="flex-1 px-3 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          )}
        </div>

        {compareVersionIdA && compareVersionIdB && onCompare && (
          <div className="p-3 border-b border-carbon-500/30 bg-moto-orange/5">
            <button
              onClick={() => onCompare(compareVersionIdA, compareVersionIdB)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-moto-orange/20 text-moto-orange border border-moto-orange/30 rounded-lg text-sm font-orbitron hover:bg-moto-orange/30 transition-colors"
            >
              <GitCompare size={14} />
              对比选中版本 (A/B)
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {versionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-moto-orange border-t-transparent rounded-full" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Clock size={48} className="text-carbon-600 mb-4" />
              <p className="text-moto-steel text-sm mb-2">暂无版本记录</p>
              <p className="text-moto-steel/60 text-xs">
                每次修改方案会自动创建快照，也可以手动创建
              </p>
            </div>
          ) : (
            <div className="divide-y divide-carbon-500/10">
              {versions.map((version, index) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isLatest={index === 0}
                  isSelected={isSelectedForCompare(version.id)}
                  compareBadge={getCompareBadge(version.id)}
                  onRollback={() => setRollbackConfirm(version.id)}
                  onDelete={() => deleteVersion(version.id)}
                  onToggleCompare={() => toggleCompareVersion(version.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {rollbackConfirm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-5 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <RotateCcw size={20} className="text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-moto-silver font-medium text-sm">确认回滚？</h4>
                  <p className="text-moto-steel text-xs mt-0.5">
                    将回滚到所选版本，当前状态会自动保存为快照
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRollbackConfirm(null)}
                  className="flex-1 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleRollback(rollbackConfirm)}
                  className="flex-1 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors"
                >
                  确认回滚
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface VersionItemProps {
  version: SelectionVersion
  isLatest: boolean
  isSelected: boolean
  compareBadge: string | null
  onRollback: () => void
  onDelete: () => void
  onToggleCompare: () => void
  formatDate: (date: string) => string
}

function VersionItem({
  version,
  isLatest,
  isSelected,
  compareBadge,
  onRollback,
  onDelete,
  onToggleCompare,
  formatDate,
}: VersionItemProps) {
  const [showActions, setShowActions] = useState(false)

  const itemCount = version.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div
      className={`relative p-4 hover:bg-carbon-800/50 transition-colors cursor-pointer group ${
        isSelected ? 'bg-moto-orange/10' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onToggleCompare}
    >
      {isSelected && compareBadge && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          compareBadge === 'A' ? 'bg-blue-500' : 'bg-green-500'
        }`} />
      )}

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-carbon-700 flex items-center justify-center shrink-0">
          {isLatest ? (
            <Sparkles size={16} className="text-moto-orange" />
          ) : (
            <Clock size={16} className="text-moto-steel" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-moto-silver text-sm font-medium truncate">
              {version.description || `版本 ${version.versionNumber}`}
            </h4>
            {isLatest && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-moto-orange/20 text-moto-orange font-orbitron shrink-0">
                最新
              </span>
            )}
            {compareBadge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron shrink-0 ${
                compareBadge === 'A'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                对比 {compareBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-moto-steel">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDate(version.createdAt)}
            </span>
            <span>v{version.versionNumber}</span>
            <span>{itemCount} 件配件</span>
          </div>
        </div>

        <ChevronRight size={14} className="text-moto-steel shrink-0 mt-1" />
      </div>

      {showActions && (
        <div
          className="absolute right-4 top-4 flex items-center gap-1 bg-carbon-800 border border-carbon-500/30 rounded-lg p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onRollback}
            className="p-1.5 text-moto-steel hover:text-moto-orange hover:bg-carbon-700 rounded transition-colors"
            title="回滚到此版本"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-moto-steel hover:text-red-400 hover:bg-carbon-700 rounded transition-colors"
            title="删除此版本"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
