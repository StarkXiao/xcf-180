import { useState, useEffect } from 'react'
import { X, Plus, Check, Tag, Layers, Info, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part, CompatibilityCheckResult } from '@/types'
import ConflictAlert from '@/components/ConflictAlert'

interface Props {
  part: Part
  onClose: () => void
}

export default function PartDetail({ part, onClose }: Props) {
  const {
    currentSelection,
    addPartToSelection,
    removePartFromSelection,
    checkPartAgainstSelection,
  } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false
  const [partCompat, setPartCompat] = useState<CompatibilityCheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!isSelected) {
      setChecking(true)
      checkPartAgainstSelection(part.id).then((r) => {
        if (!cancelled) {
          setPartCompat(r)
          setChecking(false)
        }
      })
    } else {
      setPartCompat(null)
    }
    return () => { cancelled = true }
  }, [part.id, isSelected, currentSelection?.items.length, checkPartAgainstSelection])

  const hasError = partCompat?.conflicts && partCompat.conflicts.length > 0
  const hasWarning = partCompat?.warnings && partCompat.warnings.length > 0

  const handleToggle = () => {
    if (isSelected) {
      removePartFromSelection(part.id)
      return
    }
    if (hasError || hasWarning) {
      setShowConfirm(true)
    } else {
      addPartToSelection(part.id)
    }
  }

  const confirmAdd = () => {
    setShowConfirm(false)
    addPartToSelection(part.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-carbon-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-carbon-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-carbon-900/80 text-moto-steel hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 aspect-square bg-carbon-700 relative">
            <img
              src={part.image}
              alt={part.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background+studio+lighting&image_size=square`
              }}
            />
          </div>

          <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-orbitron px-2.5 py-1 rounded-md bg-moto-orange/15 border border-moto-orange/30 text-moto-orange">
                {part.brand}
              </span>
              <span className="flex items-center gap-1 text-moto-steel text-xs font-orbitron">
                <Tag size={12} />
                {part.categoryId}
              </span>
            </div>
            <h2 className="font-orbitron text-xl lg:text-2xl text-moto-silver font-bold">{part.name}</h2>
            <p className="text-moto-steel text-sm mt-3 leading-relaxed">{part.description}</p>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={14} className="text-moto-orange" />
                <span className="text-moto-silver text-sm font-orbitron">规格参数</span>
              </div>
              <div className="space-y-2">
                {Object.entries(part.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-moto-steel">{key}</span>
                    <span className="text-moto-silver">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-moto-orange" />
                <span className="text-moto-silver text-sm font-orbitron">兼容车型</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {part.compatible.map((model) => (
                  <span key={model} className="px-3 py-1 bg-carbon-700 rounded-full text-xs text-moto-steel">
                    {model}
                  </span>
                ))}
              </div>
            </div>

            {!isSelected && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  {hasError ? (
                    <XCircle size={14} className="text-red-400" />
                  ) : hasWarning ? (
                    <AlertTriangle size={14} className="text-yellow-500" />
                  ) : (
                    <Check size={14} className="text-green-400" />
                  )}
                  <span className={`text-sm font-orbitron ${
                    hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-green-400'
                  }`}>
                    {checking
                      ? '兼容性检查中...'
                      : hasError
                        ? '存在安装冲突'
                        : hasWarning
                          ? '搭配需专业调校'
                          : '与当前选配兼容'}
                  </span>
                </div>
                {partCompat && (
                  <ConflictAlert
                    conflicts={partCompat.conflicts}
                    warnings={partCompat.warnings}
                    compact
                  />
                )}
              </div>
            )}

            <div className="mt-auto pt-6 space-y-3">
              {showConfirm && (
                <div className={`rounded-xl border p-4 space-y-3 ${
                  hasError
                    ? 'bg-red-500/5 border-red-500/40'
                    : 'bg-yellow-500/5 border-yellow-500/40'
                }`}>
                  <p className={`text-sm ${hasError ? 'text-red-400' : 'text-yellow-500'}`}>
                    {hasError
                      ? '该配件与已选配件存在安装冲突，添加后请尽快处理冲突项。是否仍要添加？'
                      : '该配件搭配需专业调校，建议咨询技术人员。是否继续添加？'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={confirmAdd}
                      className={`px-4 py-2 rounded-lg text-sm font-orbitron text-white transition-colors ${
                        hasError
                          ? 'bg-red-500 hover:bg-red-400'
                          : 'bg-yellow-500 hover:bg-yellow-400'
                      }`}
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-orbitron text-moto-orange text-2xl font-bold">
                  ¥{part.price.toLocaleString()}
                </span>
                <button
                  onClick={handleToggle}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : hasError
                        ? 'bg-red-500/80 text-white hover:bg-red-500 shadow-lg shadow-red-500/20'
                        : hasWarning
                          ? 'bg-yellow-500 text-white hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                          : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-lg shadow-moto-orange/20'
                  }`}
                >
                  {isSelected ? <><Check size={16} /> 移除</> : <><Plus size={16} /> 添加</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
