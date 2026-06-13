import { Plus, Check, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part } from '@/types'

interface Props {
  part: Part
  onViewDetail: (part: Part) => void
}

export default function PartCard({ part, onViewDetail }: Props) {
  const {
    currentSelection,
    addPartToSelection,
    removePartFromSelection,
    getConflictsForPart,
    getWarningsForPart,
    partConflictMap,
  } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false
  const conflictStatus = partConflictMap[part.id]
  const hasError = isSelected && conflictStatus?.hasError
  const hasWarning = isSelected && conflictStatus?.hasWarning

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      removePartFromSelection(part.id)
    } else {
      addPartToSelection(part.id)
    }
  }

  return (
    <div
      onClick={() => onViewDetail(part)}
      className={`group relative bg-carbon-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 part-card-hover border ${
        hasError
          ? 'border-red-500/50'
          : hasWarning
            ? 'border-yellow-500/50'
            : isSelected
              ? 'border-moto-orange/50 glow-border'
              : 'border-carbon-500/20 hover:border-carbon-500/40'
      }`}
    >
      <div className="aspect-[4/3] bg-carbon-700 relative overflow-hidden">
        <img
          src={part.image}
          alt={part.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background+studio+lighting&image_size=square`
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {hasError && (
            <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-orbitron flex items-center gap-1">
              <XCircle size={10} />
              CONFLICT
            </div>
          )}
          {hasWarning && !hasError && (
            <div className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full font-orbitron flex items-center gap-1">
              <AlertTriangle size={10} />
              WARN
            </div>
          )}
          {isSelected && !hasError && !hasWarning && (
            <div className="bg-moto-orange text-white text-xs px-2 py-1 rounded-full font-orbitron">
              SELECTED
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-[10px] font-orbitron px-2 py-0.5 rounded bg-carbon-700/70 text-moto-steel border border-carbon-500/30">
            {part.brand}
          </span>
        </div>
        <h3 className="font-orbitron text-sm text-moto-silver group-hover:text-moto-orange transition-colors truncate mt-2">
          {part.name}
        </h3>
        <p className="text-moto-steel text-xs mt-1 line-clamp-2">{part.description}</p>
        {(hasError || hasWarning) && isSelected && (
          <div className={`mt-2 text-[10px] flex items-center gap-1 ${hasError ? 'text-red-400' : 'text-yellow-500'}`}>
            {hasError ? <XCircle size={10} /> : <AlertTriangle size={10} />}
            <span>
              {hasError
                ? `${getConflictsForPart(part.id).length} 项冲突`
                : `${getWarningsForPart(part.id).length} 项提醒`}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-orbitron text-moto-orange text-lg font-bold">
            ¥{part.price.toLocaleString()}
          </span>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              hasError
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : hasWarning
                  ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                  : isSelected
                    ? 'bg-moto-orange/20 text-moto-orange hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-carbon-700 text-moto-steel hover:bg-moto-orange hover:text-white'
            }`}
          >
            {isSelected ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
