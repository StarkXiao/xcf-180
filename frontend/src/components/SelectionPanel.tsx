import { useState } from 'react'
import { ShoppingCart, ChevronRight, Trash2, Minus, Plus, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Link } from 'react-router-dom'

export default function SelectionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    currentSelection,
    allParts,
    removePartFromSelection,
    setQuantity,
    getTotalPrice,
    partConflictMap,
    compatibilityResult,
  } = useStore()
  const totalPrice = getTotalPrice()
  const itemCount = currentSelection?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0
  const totalIssues = (compatibilityResult?.conflicts?.length ?? 0) + (compatibilityResult?.warnings?.length ?? 0)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 border rounded-l-xl p-3 shadow-xl transition-colors group ${
          hasConflicts
            ? 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20'
            : hasWarnings
              ? 'bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/20'
              : 'bg-carbon-800 border-carbon-500/30 hover:bg-carbon-700'
        }`}
      >
        <ShoppingCart size={20} className={`${
          hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-orange'
        }`} />
        {itemCount > 0 && (
          <span className={`absolute -top-2 -left-2 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-orbitron ${
            hasConflicts ? 'bg-red-500' : hasWarnings ? 'bg-yellow-500' : 'bg-moto-orange'
          }`}>
            {itemCount}
          </span>
        )}
        {(hasConflicts || hasWarnings) && !isOpen && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {hasConflicts
              ? <XCircle size={12} className="text-red-400" />
              : <AlertTriangle size={12} className="text-yellow-500" />}
          </span>
        )}
        <ChevronRight size={14} className={`text-moto-steel mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-carbon-800 border-l border-carbon-500/30 z-40 shadow-2xl animate-slide-in-right flex flex-col">
          <div className={`p-4 border-b flex items-center justify-between ${
            hasConflicts
              ? 'border-red-500/30 bg-red-500/5'
              : hasWarnings
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-carbon-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <h3 className={`font-orbitron text-sm ${
                hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-silver'
              }`}>
                选配清单
              </h3>
              {(hasConflicts || hasWarnings) && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${
                  hasConflicts ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {totalIssues} 项问题
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-moto-steel hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentSelection?.items.length === 0 && (
              <p className="text-moto-steel text-sm text-center py-8">暂无配件，请浏览添加</p>
            )}
            {currentSelection?.items.map((item) => {
              const part = allParts.find((p) => p.id === item.partId)
              if (!part) return null
              const conflictStatus = partConflictMap[part.id]
              const hasError = conflictStatus?.hasError
              const hasWarning = conflictStatus?.hasWarning
              return (
                <div key={item.partId} className={`rounded-lg p-3 flex items-center gap-3 border-l-4 ${
                  hasError
                    ? 'bg-red-500/10 border-l-red-500'
                    : hasWarning
                      ? 'bg-yellow-500/10 border-l-yellow-500'
                      : 'bg-carbon-700/50 border-l-transparent'
                }`}>
                  <div className="relative shrink-0">
                    <img
                      src={part.image}
                      alt={part.name}
                      className="w-12 h-12 rounded object-cover bg-carbon-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+dark+minimal&image_size=square_hd`
                      }}
                    />
                    {(hasError || hasWarning) && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        hasError ? 'bg-red-500' : 'bg-yellow-500'
                      }`}>
                        {hasError
                          ? <XCircle size={10} className="text-white" />
                          : <AlertTriangle size={10} className="text-white" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`text-sm truncate ${
                        hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-moto-silver'
                      }`}>{part.name}</p>
                    </div>
                    <p className={`font-orbitron text-xs ${
                      hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-moto-orange'
                    }`}>¥{part.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuantity(item.partId, item.quantity - 1)}
                      className="p-1 rounded bg-carbon-600 text-moto-steel hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-moto-silver text-xs w-6 text-center font-orbitron">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.partId, item.quantity + 1)}
                      className="p-1 rounded bg-carbon-600 text-moto-steel hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removePartFromSelection(item.partId)}
                    className="p-1 text-moto-steel hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className={`p-4 border-t bg-carbon-900/50 ${
            hasConflicts
              ? 'border-red-500/30'
              : hasWarnings
                ? 'border-yellow-500/30'
                : 'border-carbon-500/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className={`text-sm ${
                  hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-steel'
                }`}>
                  {hasConflicts ? '存在冲突' : hasWarnings ? '有搭配提醒' : '合计'}
                </span>
                {(hasConflicts || hasWarnings) && (
                  <p className="text-[10px] text-moto-steel mt-0.5">
                    {totalIssues} 项问题需要处理
                  </p>
                )}
              </div>
              <span className={`font-orbitron text-xl font-bold ${
                hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-orange'
              }`}>¥{totalPrice.toLocaleString()}</span>
            </div>
            <Link
              to="/list"
              onClick={() => setIsOpen(false)}
              className={`block w-full py-2.5 text-center rounded-xl font-orbitron text-sm transition-colors shadow-lg ${
                hasConflicts
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-red-500/20'
                  : hasWarnings
                    ? 'bg-yellow-500 text-white hover:bg-yellow-400 shadow-yellow-500/20'
                    : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-moto-orange/20'
              }`}
            >
              {hasConflicts ? '处理冲突' : hasWarnings ? '查看提醒' : '查看完整清单'}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
