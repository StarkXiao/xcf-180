import { X, Plus, Check, Tag, Layers, Info } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part } from '@/types'

interface Props {
  part: Part
  onClose: () => void
}

export default function PartDetail({ part, onClose }: Props) {
  const { currentSelection, addPartToSelection, removePartFromSelection } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false

  const handleToggle = () => {
    if (isSelected) {
      removePartFromSelection(part.id)
    } else {
      addPartToSelection(part.id)
    }
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
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-moto-orange" />
              <span className="text-moto-orange text-xs font-orbitron uppercase">{part.categoryId}</span>
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

            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-moto-orange text-2xl font-bold">
                  ¥{part.price.toLocaleString()}
                </span>
                <button
                  onClick={handleToggle}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
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
