import { useStore } from '@/store/useStore'
import BikePreview from '@/components/BikePreview'
import SelectionPanel from '@/components/SelectionPanel'
import ConflictAlert from '@/components/ConflictAlert'
import { Plus, Check, RotateCcw, AlertTriangle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Preview() {
  const {
    currentSelection,
    parts,
    addPartToSelection,
    removePartFromSelection,
    categories,
    activeCategory,
    setActiveCategory,
    compatibilityResult,
    partConflictMap,
  } = useStore()

  const selectedItems = currentSelection?.items ?? []
  const selectedParts = selectedItems
    .map((item) => ({ part: parts.find((p) => p.id === item.partId), quantity: item.quantity }))
    .filter((item): item is { part: NonNullable<typeof item.part>; quantity: number } => item.part !== null)

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0

  const availablePartsByCategory = categories.map((cat) => ({
    category: cat,
    parts: parts.filter((p) => p.categoryId === cat.id),
  }))

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              机车预览
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              点击车身区域切换配件 · 已选 {selectedParts.length} 件
              {(hasConflicts || hasWarnings) && (
                <span className={`ml-2 ${hasConflicts ? 'text-red-400' : 'text-yellow-500'}`}>
                  · {hasConflicts ? `${compatibilityResult!.conflicts.length} 项冲突` : `${compatibilityResult!.warnings.length} 项提醒`}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              浏览配件
            </Link>
            <Link
              to="/list"
              className={`px-4 py-2 rounded-lg text-sm font-orbitron transition-colors shadow-lg ${
                hasConflicts
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-red-500/20'
                  : hasWarnings
                    ? 'bg-yellow-500 text-white hover:bg-yellow-400 shadow-yellow-500/20'
                    : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-moto-orange/20'
              }`}
            >
              {hasConflicts ? '处理冲突' : hasWarnings ? '查看提醒' : '选配清单'}
            </Link>
          </div>
        </div>

        {(hasConflicts || hasWarnings) && compatibilityResult && (
          <div className="mb-6">
            <ConflictAlert
              conflicts={compatibilityResult.conflicts}
              warnings={compatibilityResult.warnings}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <BikePreview />

            <div className="mt-6">
              <h3 className="font-orbitron text-moto-silver text-sm mb-3">已选配件概览</h3>
              {selectedParts.length === 0 ? (
                <div className="bg-carbon-800 rounded-xl p-8 border border-carbon-500/20 text-center">
                  <p className="text-moto-steel">尚未选择任何配件</p>
                  <p className="text-carbon-500 text-sm mt-1">从下方配件列表中添加，或前往配件浏览页</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedParts.map(({ part }) => {
                    const conflictStatus = partConflictMap[part.id]
                    const hasError = conflictStatus?.hasError
                    const hasWarning = conflictStatus?.hasWarning
                    return (
                      <div
                        key={part.id}
                        className={`bg-carbon-800 rounded-lg p-3 border relative group ${
                          hasError
                            ? 'border-red-500/50'
                            : hasWarning
                              ? 'border-yellow-500/50'
                              : 'border-moto-orange/20'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-full aspect-square object-cover rounded bg-carbon-700 mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background&image_size=square`
                            }}
                          />
                          {(hasError || hasWarning) && (
                            <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                              hasError ? 'bg-red-500' : 'bg-yellow-500'
                            }`}>
                              {hasError
                                ? <XCircle size={12} className="text-white" />
                                : <AlertTriangle size={12} className="text-white" />}
                            </div>
                          )}
                        </div>
                        <p className="text-moto-silver text-xs truncate">{part.name}</p>
                        <p className={`font-orbitron text-xs mt-1 ${
                          hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-moto-orange'
                        }`}>
                          ¥{part.price.toLocaleString()}
                        </p>
                        <button
                          onClick={() => removePartFromSelection(part.id)}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-opacity text-xs ${
                            hasError
                              ? 'bg-red-500 text-white opacity-100'
                              : 'bg-red-500/80 text-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-80 shrink-0">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden sticky top-4">
              <div className="p-4 border-b border-carbon-500/30">
                <h3 className="font-orbitron text-moto-silver text-sm">快速选配</h3>
                <p className="text-moto-steel text-xs mt-1">按分类浏览并添加配件</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {availablePartsByCategory.map(({ category, parts: catParts }) => (
                  <div key={category.id} className="border-b border-carbon-500/20 last:border-b-0">
                    <button
                      onClick={() => setActiveCategory(activeCategory === category.id ? 'all' : category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-moto-silver hover:bg-carbon-700/50 transition-colors"
                    >
                      <span className="font-orbitron text-xs">{category.name}</span>
                      <span className="text-moto-steel text-xs">{catParts.length}件</span>
                    </button>
                    {activeCategory === category.id && (
                      <div className="px-4 pb-3 space-y-2">
                        {catParts.map((part) => {
                          const isSel = selectedItems.some((i) => i.partId === part.id)
                          const conflictStatus = partConflictMap[part.id]
                          const hasError = isSel && conflictStatus?.hasError
                          const hasWarning = isSel && conflictStatus?.hasWarning
                          return (
                            <div
                              key={part.id}
                              className={`flex items-center gap-2 rounded-lg p-2 ${
                                hasError
                                  ? 'bg-red-500/10 border border-red-500/30'
                                  : hasWarning
                                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                                    : 'bg-carbon-700/50'
                              }`}
                            >
                              <div className="relative shrink-0">
                                <img
                                  src={part.image}
                                  alt={part.name}
                                  className="w-10 h-10 rounded object-cover bg-carbon-600"
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
                                <p className="text-moto-silver text-xs truncate">{part.name}</p>
                                <p className={`font-orbitron text-[10px] ${
                                  hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-moto-orange'
                                }`}>
                                  ¥{part.price.toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => isSel ? removePartFromSelection(part.id) : addPartToSelection(part.id)}
                                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                  hasError
                                    ? 'bg-red-500/20 text-red-400'
                                    : hasWarning
                                      ? 'bg-yellow-500/20 text-yellow-500'
                                      : isSel
                                        ? 'bg-moto-orange/20 text-moto-orange'
                                        : 'bg-carbon-600 text-moto-steel hover:text-white hover:bg-carbon-500'
                                }`}
                              >
                                {isSel ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SelectionPanel />
    </div>
  )
}
