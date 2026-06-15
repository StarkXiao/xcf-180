import { useState, useEffect, useRef } from 'react'
import { X, Plus, Check, Tag, Layers, Info, AlertTriangle, XCircle, Sparkles, RefreshCw, ChevronRight, Heart, PackageX, ArrowRightLeft, MessageSquare, Star } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Part, CompatibilityCheckResult, PartRecommendation, SubstitutePart, CreatePartReviewRequest, ReviewStats } from '@/types'
import ConflictAlert from '@/components/ConflictAlert'
import StockAlertBadge from '@/components/StockAlertBadge'
import PartReviewStats from '@/components/PartReviewStats'
import PartReviewList from '@/components/PartReviewList'
import PartReviewForm from '@/components/PartReviewForm'

interface Props {
  part: Part
  onClose: () => void
}

export default function PartDetail({ part, onClose }: Props) {
  const {
    currentSelection,
    addPartToSelection,
    removePartFromSelection,
    checkPartAgainstSelection,
    getPartRecommendations,
    getCategoryName,
    isFavorite,
    toggleFavorite,
    addRecentView,
    getStockLevel,
    getInventoryInfo,
    fetchSubstitutes,
    getSubstitutesForPart,
    isAuthenticated,
    partReviews,
    partReviewsLoading,
    partReviewStats,
    fetchPartReviews,
    createReview,
  } = useStore()
  const isSelected = currentSelection?.items.some((i) => i.partId === part.id) ?? false
  const [partCompat, setPartCompat] = useState<CompatibilityCheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [substitutes, setSubstitutes] = useState<SubstitutePart[]>([])
  const browsingHistoryAdded = useRef(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews'>('detail')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewSort, setReviewSort] = useState('createdAt')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const stockLevel = getStockLevel(part.id)
  const currentPartReviews = partReviews[part.id] || []
  const currentPartReviewsLoading = partReviewsLoading[part.id] || false
  const currentPartReviewStats = partReviewStats[part.id] || null
  const invInfo = getInventoryInfo(part.id)
  const isOutOfStock = stockLevel === 'out_of_stock'

  useEffect(() => {
    browsingHistoryAdded.current = false
  }, [part.id])

  useEffect(() => {
    const addHistory = async () => {
      if (isAuthenticated && !browsingHistoryAdded.current) {
        browsingHistoryAdded.current = true
        await addRecentView(part.id)
      }
    }
    addHistory()
  }, [part.id, isAuthenticated, addRecentView])

  useEffect(() => {
    if (isOutOfStock) {
      fetchSubstitutes(part.id).then(setSubstitutes)
    } else {
      setSubstitutes(getSubstitutesForPart(part.id))
    }
  }, [part.id, isOutOfStock])

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchPartReviews(part.id, { page: reviewPage, pageSize: 5, sortBy: reviewSort })
    }
  }, [part.id, activeTab, reviewPage, reviewSort, fetchPartReviews])

  const handleReviewSubmit = async (data: CreatePartReviewRequest) => {
    setReviewSubmitting(true)
    try {
      await createReview(data)
      setShowReviewForm(false)
      await fetchPartReviews(part.id, { page: 1, pageSize: 5, sortBy: reviewSort })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const recommendations = getPartRecommendations(part.id)
  const { alternatives, pairings } = recommendations

  useEffect(() => {
    let cancelled = false
    if (!isSelected) {
      setChecking(true)
      checkPartAgainstSelection(part.id).then((r) => {
        if (!cancelled) {
          setPartCompat(r)
          setChecking(false)
        }
      })
    } else {
      setPartCompat(null)
    }
    return () => { cancelled = true }
  }, [part.id, isSelected, currentSelection?.items.length, checkPartAgainstSelection])

  const hasError = partCompat?.conflicts && partCompat.conflicts.length > 0
  const hasWarning = partCompat?.warnings && partCompat.warnings.length > 0

  const handleToggle = () => {
    if (isSelected) {
      removePartFromSelection(part.id)
      return
    }
    if (hasError || hasWarning) {
      setShowConfirm(true)
    } else {
      addPartToSelection(part.id)
    }
  }

  const confirmAdd = () => {
    setShowConfirm(false)
    addPartToSelection(part.id)
  }

  const handleReplaceAlternative = async (altPartId: string) => {
    if (isSelected) {
      await removePartFromSelection(part.id)
    }
    await addPartToSelection(altPartId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-carbon-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-carbon-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={async () => await toggleFavorite(part.id)}
          className={`absolute top-4 right-14 z-10 p-2 rounded-full transition-colors ${
            isFavorite(part.id)
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-carbon-900/80 text-moto-steel hover:text-red-400'
          }`}
        >
          <Heart size={20} fill={isFavorite(part.id) ? 'currentColor' : 'none'} />
        </button>
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

          <div className="lg:w-1/2 flex flex-col overflow-hidden max-h-[50vh] lg:max-h-[90vh]">
            <div className="p-6 lg:p-8 pb-4 border-b border-carbon-700">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-orbitron px-2.5 py-1 rounded-md bg-moto-orange/15 border border-moto-orange/30 text-moto-orange">
                  {part.brand}
                </span>
                <span className="flex items-center gap-1 text-moto-steel text-xs font-orbitron">
                  <Tag size={12} />
                  {part.categoryId}
                </span>
              </div>
              <h2 className="font-orbitron text-xl lg:text-2xl text-moto-silver font-bold">{part.name}</h2>
              <p className="text-moto-steel text-sm mt-3 leading-relaxed">{part.description}</p>

              {currentPartReviewStats && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-moto-silver font-semibold">{currentPartReviewStats.averageRating?.toFixed(1) || '5.0'}</span>
                  </div>
                  <div className="text-moto-steel text-sm">
                    {currentPartReviewStats.totalReviews || 0} 条评价
                  </div>
                </div>
              )}
            </div>

            <div className="flex border-b border-carbon-700">
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'detail'
                    ? 'text-moto-orange'
                    : 'text-moto-steel hover:text-moto-silver'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info size={14} />
                  详情
                </div>
                {activeTab === 'detail' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-moto-orange"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'reviews'
                    ? 'text-moto-orange'
                    : 'text-moto-steel hover:text-moto-silver'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  评价
                  {currentPartReviewStats?.totalReviews > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-carbon-700 text-moto-steel">
                      {currentPartReviewStats.totalReviews}
                    </span>
                  )}
                </div>
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-moto-orange"></div>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'detail' && (
                <div className="p-6 lg:p-8 pt-4 space-y-6">
                  <div>
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

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-moto-orange" />
                      <span className="text-moto-silver text-sm font-orbitron">兼容车型</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {part.compatibleModels.map((model) => (
                        <span key={model} className="px-3 py-1 bg-carbon-700 rounded-full text-xs text-moto-steel">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isOutOfStock && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PackageX size={16} className="text-red-400" />
                        <span className="text-red-400 font-orbitron text-sm">该配件当前缺货</span>
                      </div>
                      <p className="text-moto-steel text-xs leading-relaxed">
                        此配件库存为零，暂时无法添加到方案中。您可以查看以下替代配件，或联系采购部门补货。
                      </p>
                    </div>
                  )}

                  {!isOutOfStock && stockLevel === 'low_stock' && (
                    <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-yellow-500" />
                        <span className="text-yellow-500 font-orbitron text-xs">库存偏低</span>
                        <StockAlertBadge stockLevel={stockLevel} availableStock={invInfo?.availableStock} size="sm" showCount />
                      </div>
                      <p className="text-moto-steel text-[11px]">
                        当前可用库存仅剩 {invInfo?.availableStock ?? '?'} 件，建议尽快确认方案
                      </p>
                    </div>
                  )}

                  {isOutOfStock && substitutes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRightLeft size={14} className="text-moto-orange" />
                        <span className="text-moto-silver text-sm font-orbitron">替代件推荐</span>
                        <span className="text-[10px] text-moto-steel font-orbitron">
                          缺货时可替代的同分类配件
                        </span>
                      </div>
                      <div className="space-y-2">
                        {substitutes.slice(0, 4).map((sub) => (
                          <SubstituteRow
                            key={sub.partId}
                            substitute={sub}
                            isSelected={currentSelection?.items.some((i) => i.partId === sub.partId) ?? false}
                            onAdd={() => addPartToSelection(sub.partId)}
                            onRemove={() => removePartFromSelection(sub.partId)}
                            categoryName={getCategoryName(sub.part.categoryId)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!isSelected && !isOutOfStock && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {hasError ? (
                          <XCircle size={14} className="text-red-400" />
                        ) : hasWarning ? (
                          <AlertTriangle size={14} className="text-yellow-500" />
                        ) : (
                          <Check size={14} className="text-green-400" />
                        )}
                        <span className={`text-sm font-orbitron ${
                          hasError ? 'text-red-400' : hasWarning ? 'text-yellow-500' : 'text-green-400'
                        }`}>
                          {checking
                            ? '兼容性检查中...'
                            : hasError
                              ? '存在安装冲突'
                              : hasWarning
                                ? '搭配需专业调校'
                                : '与当前选配兼容'}
                        </span>
                      </div>
                      {partCompat && (
                        <ConflictAlert
                          conflicts={partCompat.conflicts}
                          warnings={partCompat.warnings}
                          compact
                        />
                      )}
                    </div>
                  )}

                  {pairings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-moto-orange" />
                        <span className="text-moto-silver text-sm font-orbitron">搭配建议</span>
                        <span className="text-[10px] text-moto-steel font-orbitron">
                          基于当前分类与兼容车型智能推荐
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {pairings.slice(0, 4).map((rec) => (
                          <RecommendationCard
                            key={rec.part.id}
                            recommendation={rec}
                            isSelected={currentSelection?.items.some((i) => i.partId === rec.part.id) ?? false}
                            categoryName={getCategoryName(rec.part.categoryId)}
                            onAdd={() => addPartToSelection(rec.part.id)}
                            onRemove={() => removePartFromSelection(rec.part.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {alternatives.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <RefreshCw size={14} className="text-moto-orange" />
                        <span className="text-moto-silver text-sm font-orbitron">替代配件</span>
                        <span className="text-[10px] text-moto-steel font-orbitron">
                          同分类其他可选方案
                        </span>
                      </div>
                      <div className="space-y-2">
                        {alternatives.slice(0, 3).map((rec) => (
                          <AlternativeRow
                            key={rec.part.id}
                            recommendation={rec}
                            isSelected={currentSelection?.items.some((i) => i.partId === rec.part.id) ?? false}
                            onAdd={() => handleReplaceAlternative(rec.part.id)}
                            onRemove={() => removePartFromSelection(rec.part.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="p-6 lg:p-8 pt-4 space-y-6">
                  {!showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 border-2 border-dashed border-carbon-600 rounded-xl text-moto-steel hover:border-moto-orange hover:text-moto-orange transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      发表评价
                    </button>
                  )}

                  {showReviewForm && (
                    <PartReviewForm
                      partId={part.id}
                      partName={part.name}
                      onSubmit={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                      loading={reviewSubmitting}
                    />
                  )}

                  {currentPartReviewStats && (
                    <PartReviewStats stats={currentPartReviewStats} />
                  )}

                  <PartReviewList
                    reviews={currentPartReviews}
                    loading={currentPartReviewsLoading}
                    total={currentPartReviewStats?.totalReviews || 0}
                    page={reviewPage}
                    pageSize={5}
                    onPageChange={setReviewPage}
                    sortBy={reviewSort}
                    onSortChange={setReviewSort}
                  />
                </div>
              )}
            </div>

            <div className="p-6 lg:p-8 pt-4 border-t border-carbon-700 space-y-3">
              {showConfirm && (
                <div className={`rounded-xl border p-4 space-y-3 ${
                  hasError
                    ? 'bg-red-500/5 border-red-500/40'
                    : 'bg-yellow-500/5 border-yellow-500/40'
                }`}>
                  <p className={`text-sm ${hasError ? 'text-red-400' : 'text-yellow-500'}`}>
                    {hasError
                      ? '该配件与已选配件存在安装冲突，添加后请尽快处理冲突项。是否仍要添加？'
                      : '该配件搭配需专业调校，建议咨询技术人员。是否继续添加？'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={confirmAdd}
                      className={`px-4 py-2 rounded-lg text-sm font-orbitron text-white transition-colors ${
                        hasError
                          ? 'bg-red-500 hover:bg-red-400'
                          : 'bg-yellow-500 hover:bg-yellow-400'
                      }`}
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`font-orbitron text-2xl font-bold ${isOutOfStock ? 'text-moto-steel/50' : 'text-moto-orange'}`}>
                  ¥{part.price.toLocaleString()}
                </span>
                <button
                  onClick={handleToggle}
                  disabled={isOutOfStock && !isSelected}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron text-sm transition-all duration-200 ${
                    isOutOfStock && !isSelected
                      ? 'bg-carbon-700/30 text-carbon-500 cursor-not-allowed'
                      : isSelected
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : hasError
                          ? 'bg-red-500/80 text-white hover:bg-red-500 shadow-lg shadow-red-500/20'
                          : hasWarning
                            ? 'bg-yellow-500 text-white hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                            : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-lg shadow-moto-orange/20'
                  }`}
                >
                  {isSelected ? <><Check size={16} /> 移除</> : isOutOfStock ? <><PackageX size={16} /> 缺货</> : <><Plus size={16} /> 添加</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  recommendation,
  isSelected,
  categoryName,
  onAdd,
  onRemove,
}: {
  recommendation: PartRecommendation
  isSelected: boolean
  categoryName: string
  onAdd: () => void
  onRemove: () => void
}) {
  const { part, reason, compatibilityStatus } = recommendation

  const statusColor = {
    compatible: 'text-green-400 bg-green-500/10 border-green-500/30',
    warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    conflict: 'text-red-400 bg-red-500/10 border-red-500/30',
    unknown: 'text-moto-steel bg-carbon-700 border-carbon-500/30',
  }[compatibilityStatus]

  const statusIcon = {
    compatible: <Check size={10} />,
    warning: <AlertTriangle size={10} />,
    conflict: <XCircle size={10} />,
    unknown: null,
  }[compatibilityStatus]

  return (
    <div className={`rounded-lg border p-2 transition-all hover:bg-carbon-700/30 ${
      isSelected
        ? 'border-moto-orange/50 bg-moto-orange/5'
        : 'border-carbon-500/20 bg-carbon-800/50'
    }`}>
      <div className="flex gap-2">
        <img
          src={part.image}
          alt={part.name}
          className="w-12 h-12 rounded object-cover bg-carbon-600 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+icon+minimal&image_size=square`
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-moto-silver text-xs font-medium truncate">{part.name}</p>
          <p className="text-[10px] text-moto-steel truncate">{categoryName}</p>
          <p className="font-orbitron text-[10px] text-moto-orange mt-0.5">
            ¥{part.price.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-orbitron ${statusColor}`}>
          {statusIcon}
          {compatibilityStatus === 'compatible' ? '兼容' : compatibilityStatus === 'warning' ? '注意' : compatibilityStatus === 'conflict' ? '冲突' : ''}
        </span>
        <button
          onClick={isSelected ? onRemove : onAdd}
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-orbitron transition-colors ${
            isSelected
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              : compatibilityStatus === 'conflict'
                ? 'bg-carbon-700 text-moto-steel hover:bg-carbon-600'
                : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30 hover:bg-moto-orange/20'
          }`}
        >
          {isSelected ? <><Check size={10} /> 已选</> : <><Plus size={10} /> 添加</>}
        </button>
      </div>
      <p className="text-[9px] text-moto-steel mt-1.5 truncate">
        <span className="text-moto-orange/70">·</span> {reason}
      </p>
    </div>
  )
}

function AlternativeRow({
  recommendation,
  isSelected,
  onAdd,
  onRemove,
}: {
  recommendation: PartRecommendation
  isSelected: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const { part, reason, compatibilityStatus } = recommendation

  return (
    <div className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
      isSelected
        ? 'bg-moto-orange/5 border border-moto-orange/30'
        : 'bg-carbon-800/50 border border-transparent hover:bg-carbon-700/50'
    }`}>
      <img
        src={part.image}
        alt={part.name}
        className="w-10 h-10 rounded object-cover bg-carbon-600 shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+minimal&image_size=square`
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-moto-silver text-xs font-medium truncate">{part.name}</p>
          {compatibilityStatus === 'conflict' && <XCircle size={10} className="text-red-400 shrink-0" />}
          {compatibilityStatus === 'warning' && <AlertTriangle size={10} className="text-yellow-500 shrink-0" />}
        </div>
        <p className="text-[10px] text-moto-steel truncate">{reason}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-orbitron text-xs text-moto-orange">
          ¥{part.price.toLocaleString()}
        </span>
        <button
          onClick={isSelected ? onRemove : onAdd}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-orbitron transition-colors ${
            isSelected
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              : compatibilityStatus === 'conflict'
                ? 'bg-carbon-700 text-moto-steel hover:bg-carbon-600'
                : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30 hover:bg-moto-orange/20'
          }`}
        >
          {isSelected ? <><Check size={10} /> 已选</> : <><ChevronRight size={10} /> 替换</>}
        </button>
      </div>
    </div>
  )
}

function SubstituteRow({
  substitute,
  isSelected,
  onAdd,
  onRemove,
  categoryName,
}: {
  substitute: SubstitutePart
  isSelected: boolean
  onAdd: () => void
  onRemove: () => void
  categoryName: string
}) {
  const { part, matchScore, reasons, priceDiff, stockLevel, availableStock } = substitute

  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 transition-colors border ${
      isSelected
        ? 'bg-moto-orange/5 border-moto-orange/30'
        : 'bg-carbon-800/50 border-carbon-500/20 hover:bg-carbon-700/50 hover:border-carbon-500/40'
    }`}>
      <img
        src={part.image}
        alt={part.name}
        className="w-12 h-12 rounded-lg object-cover bg-carbon-600 shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+minimal&image_size=square`
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-moto-silver text-xs font-medium truncate">{part.name}</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-carbon-700 text-moto-steel border border-carbon-500/30 shrink-0">
            {part.brand}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StockAlertBadge stockLevel={stockLevel} availableStock={availableStock} size="sm" showCount />
          {priceDiff < 0 && (
            <span className="text-[9px] text-green-400">省 ¥{Math.abs(priceDiff).toLocaleString()}</span>
          )}
          {priceDiff > 0 && (
            <span className="text-[9px] text-yellow-500">+¥{priceDiff.toLocaleString()}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {reasons.slice(0, 2).map((r, i) => (
            <span key={i} className="text-[9px] text-moto-steel/70 bg-carbon-700/50 px-1 rounded">
              {r}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-orbitron text-sm text-moto-orange">
          ¥{part.price.toLocaleString()}
        </span>
        <button
          onClick={isSelected ? onRemove : onAdd}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-orbitron transition-colors ${
            isSelected
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              : stockLevel === 'out_of_stock'
                ? 'bg-carbon-700/30 text-carbon-500 cursor-not-allowed'
                : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30 hover:bg-moto-orange/20'
          }`}
          disabled={stockLevel === 'out_of_stock' && !isSelected}
        >
          {isSelected ? <><Check size={10} /> 已选</> : <><ArrowRightLeft size={10} /> 替代</>}
        </button>
      </div>
    </div>
  )
}
