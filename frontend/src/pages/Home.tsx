import { useState } from 'react'
import { useStore } from '@/store/useStore'
import CategoryNav from '@/components/CategoryNav'
import PartCard from '@/components/PartCard'
import PartDetail from '@/components/PartDetail'
import SearchBar from '@/components/SearchBar'
import SelectionPanel from '@/components/SelectionPanel'
import ConflictAlert from '@/components/ConflictAlert'
import AdvancedFilter from '@/components/AdvancedFilter'
import { SlidersHorizontal, ArrowRight, Heart, Clock } from 'lucide-react'
import type { Part } from '@/types'
import { Link } from 'react-router-dom'

export default function Home() {
  const {
    categories,
    loading,
    activeCategory,
    compatibilityResult,
    compatibilityLoading,
    getFilteredParts,
    getFavoriteParts,
    getRecentViewParts,
  } = useStore()
  const [detailPart, setDetailPart] = useState<Part | null>(null)

  const filteredParts = getFilteredParts()

  const activeCategoryName = categories.find((c) => c.id === activeCategory)?.name ?? '全部配件'

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        {(hasConflicts || hasWarnings) && compatibilityResult && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ConflictAlert
                  conflicts={compatibilityResult.conflicts}
                  warnings={compatibilityResult.warnings}
                />
              </div>
              <Link
                to="/list"
                className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-orbitron transition-colors ${
                  hasConflicts
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'bg-yellow-500 text-white hover:bg-yellow-400'
                }`}
              >
                处理
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              {activeCategoryName}
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              共 {filteredParts.length} 件配件
            </p>
          </div>
          <div className="w-64">
            <SearchBar />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="hidden lg:flex flex-col gap-4 shrink-0">
            <CategoryNav />
            <AdvancedFilter />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="lg:hidden">
              <CategoryNav />
            </div>
            <div className="lg:hidden">
              <AdvancedFilter />
            </div>

            <HomeQuickSection
              title="收藏配件"
              icon={<Heart size={14} />}
              parts={getFavoriteParts()}
              onViewDetail={setDetailPart}
              emptyText="暂无收藏配件"
              emptyHint="浏览配件时点击 ♥ 即可收藏"
            />
            <HomeQuickSection
              title="最近浏览"
              icon={<Clock size={14} />}
              parts={getRecentViewParts().slice(0, 8)}
              onViewDetail={setDetailPart}
              emptyText="暂无浏览记录"
              emptyHint="浏览配件后这里会显示记录"
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-carbon-800 rounded-xl overflow-hidden border border-carbon-500/20">
                    <div className="aspect-[4/3] bg-carbon-700 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-carbon-700 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-carbon-700 rounded animate-pulse w-full" />
                      <div className="h-6 bg-carbon-700 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <SlidersHorizontal size={48} className="text-carbon-500 mb-4" />
                <p className="text-moto-steel text-lg">未找到匹配的配件</p>
                <p className="text-carbon-500 text-sm mt-2">尝试更换分类或修改筛选条件</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredParts.map((part) => (
                  <PartCard key={part.id} part={part} onViewDetail={setDetailPart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailPart && <PartDetail part={detailPart} onClose={() => setDetailPart(null)} />}
      <SelectionPanel />
    </div>
  )
}

function HomeQuickSection({
  title,
  icon,
  parts,
  onViewDetail,
  emptyText,
  emptyHint,
}: {
  title: string
  icon: React.ReactNode
  parts: Part[]
  onViewDetail: (part: Part) => void
  emptyText: string
  emptyHint: string
}) {
  if (parts.length === 0) return null

  return (
    <div className="bg-carbon-800/50 rounded-xl border border-carbon-500/15 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-moto-orange">{icon}</span>
        <span className="font-orbitron text-xs text-moto-silver">{title}</span>
        <span className="text-[10px] text-moto-steel/60">{parts.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {parts.slice(0, 10).map((part) => (
          <div
            key={part.id}
            onClick={() => onViewDetail(part)}
            className="shrink-0 w-28 cursor-pointer group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-carbon-700 mb-1.5">
              <img
                src={part.image}
                alt={part.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+minimal&image_size=square`
                }}
              />
            </div>
            <p className="text-moto-silver text-[11px] truncate group-hover:text-moto-orange transition-colors">
              {part.name}
            </p>
            <p className="font-orbitron text-[10px] text-moto-orange">
              ¥{part.price.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
