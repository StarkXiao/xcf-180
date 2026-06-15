import { Plus, Check, AlertTriangle, XCircle, Heart } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part } from '@/types'
import StockAlertBadge from '@/components/StockAlertBadge'

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
    isFavorite,
    toggleFavorite,
    addRecentView,
    getStockLevel,
    getInventoryInfo,
  } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false
  const conflictStatus = partConflictMap[part.id]
  const hasError = isSelected && conflictStatus?.hasError
  const hasWarning = isSelected && conflictStatus?.hasWarning
  const stockLevel = getStockLevel(part.id)
  const invInfo = getInventoryInfo(part.id)
  const isOutOfStock = stockLevel === 'out_of_stock'

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      removePartFromSelection(part.id)
    } else if (!isOutOfStock) {
      addPartToSelection(part.id)
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite(part.id)
  }

  const handleClick = async () => {
    await addRecentView(part.id)
    onViewDetail(part)
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-carbon-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 part-card-hover border ${
        isOutOfStock
          ? 'border-carbon-500/40 opacity-70'
          : hasError
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
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'grayscale' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background+studio+lighting&image_size=square`
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={handleFavorite}
            className={`p-1.5 rounded-full backdrop-blur transition-all duration-200 ${
              isFavorite(part.id)
                ? 'bg-red-500/80 text-white'
                : 'bg-carbon-900/60 text-moto-steel hover:text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Heart size={12} fill={isFavorite(part.id) ? 'currentColor' : 'none'} />
          </button>
          {isOutOfStock && (
            <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-orbitron flex items-center gap-1">
              <XCircle size={10} />
              OUT
            </div>
          )}
          {!isOutOfStock && hasError && (
            <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-orbitron flex items-center gap-1">
              <XCircle size={10} />
              CONFLICT
            </div>
          )}
          {!isOutOfStock && hasWarning && !hasError && (
            <div className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full font-orbitron flex items-center gap-1">
              <AlertTriangle size={10} />
              WARN
            </div>
          )}
          {!isOutOfStock && isSelected && !hasError && !hasWarning && (
            <div className="bg-moto-orange text-white text-xs px-2 py-1 rounded-full font-orbitron">
              SELECTED
            </div>
          )}
        </div>
        {stockLevel !== 'in_stock' && (
          <div className="absolute top-2 left-2">
            <StockAlertBadge stockLevel={stockLevel} availableStock={invInfo?.availableStock} size="sm" showCount />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-[10px] font-orbitron px-2 py-0.5 rounded bg-carbon-700/70 text-moto-steel border border-carbon-500/30">
            {part.brand}
          </span>
          {invInfo && stockLevel === 'in_stock' && (
            <span className="text-[9px] text-green-400/70 font-orbitron">
              库存 {invInfo.availableStock}
            </span>
          )}
        </div>
        <h3 className={`font-orbitron text-sm group-hover:text-moto-orange transition-colors truncate mt-2 ${isOutOfStock ? 'text-moto-steel line-through' : 'text-moto-silver'}`}>
          {part.name}
        </h3>
        <p className="text-moto-steel text-xs mt-1 line-clamp-2">{part.description}</p>
        {(hasError || hasWarning) && isSelected && !isOutOfStock && (
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
          <span className={`font-orbitron text-lg font-bold ${isOutOfStock ? 'text-moto-steel/60' : 'text-moto-orange'}`}>
            ¥{part.price.toLocaleString()}
          </span>
          <button
            onClick={handleToggle}
            disabled={isOutOfStock && !isSelected}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isOutOfStock && !isSelected
                ? 'bg-carbon-700/30 text-carbon-500 cursor-not-allowed'
                : hasError
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
