import { useStore } from '@/store/useStore'
import { Wind, Circle, GripHorizontal, Lightbulb, Shield, Disc } from 'lucide-react'
import type { Category } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  exhaust: Wind,
  wheels: Circle,
  handlebar: GripHorizontal,
  lighting: Lightbulb,
  bodykit: Shield,
  brake: Disc,
}

export default function CategoryNav() {
  const { categories, activeCategory, setActiveCategory } = useStore()

  return (
    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-44 shrink-0">
      <button
        onClick={() => setActiveCategory('all')}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${
          activeCategory === 'all'
            ? 'bg-moto-orange text-white shadow-lg shadow-moto-orange/20'
            : 'bg-carbon-700/50 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
        }`}
      >
        <span className="text-xs font-orbitron">ALL</span>
        <span className="hidden lg:inline">全部配件</span>
      </button>
      {categories.map((cat) => {
        const Icon = iconMap[cat.id] || Shield
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-moto-orange text-white shadow-lg shadow-moto-orange/20'
                : 'bg-carbon-700/50 text-moto-steel hover:bg-carbon-600 hover:text-moto-silver'
            }`}
          >
            <Icon size={16} />
            <span className="hidden lg:inline">{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
