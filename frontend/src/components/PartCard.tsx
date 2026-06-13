import { Plus, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part } from '@/types'

interface Props {
  part: Part
  onViewDetail: (part: Part) => void
}

export default function PartCard({ part, onViewDetail }: Props) {
  const { currentSelection, addPartToSelection, removePartFromSelection } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false

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
        isSelected ? 'border-moto-orange/50 glow-border' : 'border-carbon-500/20 hover:border-carbon-500/40'
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
        {isSelected && (
          <div className="absolute top-2 right-2 bg-moto-orange text-white text-xs px-2 py-1 rounded-full font-orbitron">
            SELECTED
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-orbitron text-sm text-moto-silver group-hover:text-moto-orange transition-colors truncate">
          {part.name}
        </h3>
        <p className="text-moto-steel text-xs mt-1 line-clamp-2">{part.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-orbitron text-moto-orange text-lg font-bold">
            ¥{part.price.toLocaleString()}
          </span>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isSelected
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
