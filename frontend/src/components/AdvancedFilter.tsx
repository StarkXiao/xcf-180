import { useState } from 'react'
import { useStore } from '@/store/useStore'
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowUpDown,
  Tag,
  Car,
  Banknote,
} from 'lucide-react'
import type { SortOption } from '@/types'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: '默认排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
]

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-carbon-500/20 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-carbon-700/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-moto-silver text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-moto-steel" />
        ) : (
          <ChevronDown size={16} className="text-moto-steel" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function AdvancedFilter() {
  const {
    priceMin,
    priceMax,
    selectedBrands,
    selectedModels,
    sortBy,
    setPriceMin,
    setPriceMax,
    toggleBrand,
    toggleModel,
    setSortBy,
    clearFilters,
    getAllBrands,
    getAllCompatibleModels,
    getPriceRange,
  } = useStore()

  const [collapsed, setCollapsed] = useState(false)
  const brands = getAllBrands()
  const models = getAllCompatibleModels()
  const { min: globalMin, max: globalMax } = getPriceRange()

  const hasActiveFilters =
    priceMin != null ||
    priceMax != null ||
    selectedBrands.length > 0 ||
    selectedModels.length > 0 ||
    sortBy !== 'default'

  const handlePriceMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '')
    if (v === '') {
      setPriceMin(null)
    } else {
      const num = Number(v)
      setPriceMin(num)
    }
  }

  const handlePriceMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '')
    if (v === '') {
      setPriceMax(null)
    } else {
      const num = Number(v)
      setPriceMax(num)
    }
  }

  return (
    <div className="bg-carbon-800/60 border border-carbon-500/30 rounded-xl overflow-hidden shrink-0 lg:w-64">
      <div className="flex items-center justify-between px-4 py-3 border-b border-carbon-500/20">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-moto-silver font-orbitron text-sm hover:text-moto-orange transition-colors"
        >
          <SlidersHorizontal size={16} />
          <span>高级筛选</span>
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-moto-orange/20 text-moto-orange text-[10px] font-bold">
              {[
                priceMin != null || priceMax != null ? 1 : 0,
                selectedBrands.length > 0 ? 1 : 0,
                selectedModels.length > 0 ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-moto-steel text-xs hover:text-moto-orange transition-colors"
          >
            <RotateCcw size={12} />
            重置
          </button>
        )}
      </div>

      {!collapsed && (
        <div>
          <FilterSection title="排序" icon={<ArrowUpDown size={14} className="text-moto-orange" />}>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none bg-carbon-700/60 border border-carbon-500/30 rounded-lg px-3 py-2 pr-9 text-sm text-moto-silver focus:outline-none focus:border-moto-orange/50 transition-colors cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-moto-steel pointer-events-none"
              />
            </div>
          </FilterSection>

          <FilterSection title="价格区间" icon={<Banknote size={14} className="text-moto-orange" />}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-moto-steel text-xs">
                    ¥
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceMin ?? ''}
                    onChange={handlePriceMinInput}
                    placeholder={String(globalMin)}
                    className="w-full bg-carbon-700/60 border border-carbon-500/30 rounded-lg pl-6 pr-3 py-2 text-sm text-moto-silver placeholder-moto-steel/40 focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-moto-steel text-xs">
                    ¥
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceMax ?? ''}
                    onChange={handlePriceMaxInput}
                    placeholder={String(globalMax)}
                    className="w-full bg-carbon-700/60 border border-carbon-500/30 rounded-lg pl-6 pr-3 py-2 text-sm text-moto-silver placeholder-moto-steel/40 focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '≤2k', max: 2000 },
                  { label: '2k-5k', min: 2000, max: 5000 },
                  { label: '5k-10k', min: 5000, max: 10000 },
                  { label: '≥10k', min: 10000 },
                ].map((preset) => {
                  const active =
                    (preset.min != null ? priceMin === preset.min : true) &&
                    (preset.max != null ? priceMax === preset.max : true)
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setPriceMin(preset.min ?? null)
                        setPriceMax(preset.max ?? null)
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-orbitron transition-colors border ${
                        active
                          ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange'
                          : 'bg-carbon-700/40 border-carbon-500/20 text-moto-steel hover:text-moto-silver hover:border-carbon-500/40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </FilterSection>

          <FilterSection title="品牌" icon={<Tag size={14} className="text-moto-orange" />}>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((brand) => {
                const selected = selectedBrands.includes(brand)
                return (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={`group relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                      selected
                        ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange'
                        : 'bg-carbon-700/40 border-carbon-500/20 text-moto-silver hover:border-carbon-500/50 hover:bg-carbon-700/60'
                    }`}
                  >
                    {selected && <X size={10} />}
                    <span>{brand}</span>
                  </button>
                )
              })}
            </div>
          </FilterSection>

          <FilterSection title="适配车型" icon={<Car size={14} className="text-moto-orange" />}>
            <div className="flex flex-wrap gap-1.5">
              {models.map((model) => {
                const selected = selectedModels.includes(model)
                return (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-orbitron transition-all border ${
                      selected
                        ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange'
                        : 'bg-carbon-700/40 border-carbon-500/20 text-moto-silver hover:border-carbon-500/50 hover:bg-carbon-700/60'
                    }`}
                  >
                    {selected && <X size={10} />}
                    <span>{model}</span>
                  </button>
                )
              })}
            </div>
          </FilterSection>
        </div>
      )}
    </div>
  )
}
