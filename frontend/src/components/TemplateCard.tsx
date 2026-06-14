import { useStore } from '@/store/useStore'
import { Heart, Eye, Download, Flame, Star, Check, AlertTriangle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Template } from '@/types'

interface TemplateCardProps {
  template: Template
  showCheckbox?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
  showAdminActions?: boolean
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-carbon-500 text-moto-steel' },
  pending_review: { label: '待审核', className: 'bg-yellow-500/20 text-yellow-500' },
  published: { label: '已发布', className: 'bg-green-500/20 text-green-500' },
  archived: { label: '已归档', className: 'bg-red-500/20 text-red-500' },
}

const CATEGORY_MAP: Record<string, string> = {
  sport: '赛道运动',
  street: '街头风格',
  basic: '基础入门',
}

export default function TemplateCard({
  template,
  showCheckbox = false,
  selected = false,
  onSelect,
  showAdminActions = false,
}: TemplateCardProps) {
  const {
    allParts,
    isTemplateFavorite,
    toggleTemplateFavorite,
    getTotalPrice,
    categories,
  } = useStore()

  const templateParts = template.items
    .map((item) => allParts.find((p) => p.id === item.partId))
    .filter(Boolean)

  const totalPrice = templateParts.reduce((sum, part) => sum + (part?.price ?? 0), 0)
  const isFav = isTemplateFavorite(template.id)
  const statusInfo = STATUS_MAP[template.status] || STATUS_MAP.draft

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleTemplateFavorite(template.id)
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(template.id)
  }

  return (
    <Link
      to={`/templates/${template.id}`}
      className="group bg-carbon-800/50 rounded-xl border border-carbon-500/20 overflow-hidden hover:border-moto-orange/40 transition-all duration-300 hover:shadow-lg hover:shadow-moto-orange/5"
    >
      <div className="relative aspect-[16/9] bg-carbon-700 overflow-hidden">
        <img
          src={template.coverImage}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+custom+package+dark+theme&image_size=landscape_16_9`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {template.isHot && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-orbitron backdrop-blur">
              <Flame size={10} /> 热门
            </span>
          )}
          {template.isRecommended && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-moto-orange/90 text-white text-[10px] font-orbitron backdrop-blur">
              <Star size={10} /> 推荐
            </span>
          )}
          {showAdminActions && (
            <span className={`px-2 py-1 rounded-full text-[10px] font-orbitron backdrop-blur ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {showCheckbox && (
            <button
              onClick={handleSelect}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                selected
                  ? 'bg-moto-orange border-moto-orange text-white'
                  : 'border-carbon-400 bg-carbon-800/80 hover:border-moto-orange/50'
              }`}
            >
              {selected && <Check size={14} />}
            </button>
          )}
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur transition-all ${
              isFav
                ? 'bg-red-500/90 text-white'
                : 'bg-carbon-800/80 text-moto-steel hover:text-red-400 hover:bg-carbon-700/80'
            }`}
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-carbon-800/80 text-moto-silver font-orbitron backdrop-blur">
              {CATEGORY_MAP[template.category] || template.category}
            </span>
            <div className="flex items-center gap-3 text-[10px] text-moto-silver/80 font-orbitron">
              <span className="flex items-center gap-1">
                <Eye size={10} /> {template.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Download size={10} /> {template.useCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-orbitron text-base text-moto-silver font-semibold truncate group-hover:text-moto-orange transition-colors">
          {template.name}
        </h3>
        <p className="text-xs text-moto-steel mt-1 line-clamp-2 h-8">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-700/50 text-moto-steel"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-carbon-500/20">
          <div>
            <p className="text-[10px] text-moto-steel font-orbitron">包含配件</p>
            <p className="text-moto-silver text-sm font-semibold">
              {templateParts.length} 件
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-moto-steel font-orbitron">参考总价</p>
            <p className="text-moto-orange font-orbitron font-bold">
              ¥{totalPrice.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto">
          {templateParts.slice(0, 4).map((part) => (
            <div
              key={part!.id}
              className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-carbon-700 border border-carbon-500/20"
              title={part!.name}
            >
              <img
                src={part!.image}
                alt={part!.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon&image_size=square`
                }}
              />
            </div>
          ))}
          {templateParts.length > 4 && (
            <div className="shrink-0 w-10 h-10 rounded-lg bg-carbon-700 border border-carbon-500/20 flex items-center justify-center">
              <span className="text-[10px] text-moto-steel font-orbitron">
                +{templateParts.length - 4}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {template.modelIds.map((modelId) => (
            <span
              key={modelId}
              className="text-[9px] px-1.5 py-0.5 rounded bg-moto-orange/10 text-moto-orange font-orbitron"
            >
              {modelId}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
