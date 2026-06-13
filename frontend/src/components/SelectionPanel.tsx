import { useState } from 'react'
import { ShoppingCart, ChevronRight, Trash2, Minus, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Link } from 'react-router-dom'

export default function SelectionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentSelection, parts, removePartFromSelection, setQuantity, getTotalPrice } = useStore()
  const totalPrice = getTotalPrice()
  const itemCount = currentSelection?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-carbon-800 border border-carbon-500/30 rounded-l-xl p-3 shadow-xl hover:bg-carbon-700 transition-colors group"
      >
        <ShoppingCart size={20} className="text-moto-orange" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -left-2 bg-moto-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-orbitron">
            {itemCount}
          </span>
        )}
        <ChevronRight size={14} className={`text-moto-steel mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-carbon-800 border-l border-carbon-500/30 z-40 shadow-2xl animate-slide-in-right flex flex-col">
          <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
            <h3 className="font-orbitron text-moto-silver text-sm">选配清单</h3>
            <button onClick={() => setIsOpen(false)} className="text-moto-steel hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentSelection?.items.length === 0 && (
              <p className="text-moto-steel text-sm text-center py-8">暂无配件，请浏览添加</p>
            )}
            {currentSelection?.items.map((item) => {
              const part = parts.find((p) => p.id === item.partId)
              if (!part) return null
              return (
                <div key={item.partId} className="bg-carbon-700/50 rounded-lg p-3 flex items-center gap-3">
                  <img
                    src={part.image}
                    alt={part.name}
                    className="w-12 h-12 rounded object-cover bg-carbon-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+dark+minimal&image_size=square_hd`
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-moto-silver text-sm truncate">{part.name}</p>
                    <p className="text-moto-orange font-orbitron text-xs">¥{part.price.toLocaleString()}</p>
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

          <div className="p-4 border-t border-carbon-500/30 bg-carbon-900/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-moto-steel text-sm">合计</span>
              <span className="font-orbitron text-moto-orange text-xl font-bold">¥{totalPrice.toLocaleString()}</span>
            </div>
            <Link
              to="/list"
              onClick={() => setIsOpen(false)}
              className="block w-full py-2.5 text-center bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              查看完整清单
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
