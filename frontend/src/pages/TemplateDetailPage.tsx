import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useParams, useNavigate, Link } from 'react-router-dom'
import BikePreview from '@/components/BikePreview'
import ConflictAlert from '@/components/ConflictAlert'
import {
  ArrowLeft,
  Heart,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Wrench,
  Plus,
  Trash2,
  Combine,
  Loader2,
  Flame,
  Star,
  Copy,
} from 'lucide-react'
import type { Template } from '@/types'

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

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    fetchTemplates,
    fetchParts,
    fetchSelections,
    fetchTemplateDetail,
    currentTemplate,
    allParts,
    categories,
    laborFeeRates,
    templateCompatibility,
    checkTemplateCompatibility,
    applyTemplate,
    combineTemplates,
    combinedTemplates,
    setCombinedTemplates,
    toggleTemplateFavorite,
    isTemplateFavorite,
    templates,
    setCurrentSelection,
    currentSelection,
    clearSelection,
    addPartToSelection,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [checkingCompat, setCheckingCompat] = useState(false)
  const [showCombineModal, setShowCombineModal] = useState(false)
  const [selectedCombineTemplates, setSelectedCombineTemplates] = useState<string[]>([])
  const [combining, setCombining] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'parts' | 'compatibility'>('preview')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchParts()
      await fetchSelections()
      await fetchTemplates()
      if (id) {
        await fetchTemplateDetail(id)
        await checkTemplateCompatibility(id)
      }
      setLoading(false)
    }
    init()
  }, [id])

  const template = currentTemplate
  const isFav = template ? isTemplateFavorite(template.id) : false

  const templateParts =
    template?.items
      .map((item) => {
        const part = allParts.find((p) => p.id === item.partId)
        return part ? { ...part, quantity: item.quantity } : null
      })
      .filter(Boolean) ?? []

  const totalPrice = templateParts.reduce(
    (sum, part) => sum + (part?.price ?? 0) * (part?.quantity ?? 1),
    0
  )

  const totalLaborFee = templateParts.reduce((sum, part) => {
    if (!part) return sum
    const rate = laborFeeRates[part.categoryId] ?? 0.1
    return sum + Math.round(part.price * part.quantity * rate)
  }, 0)

  const grandTotal = totalPrice + totalLaborFee

  const handleApply = async () => {
    if (!template) return
    setApplying(true)
    try {
      const result = await applyTemplate(template.id)
      if (result?.success) {
        navigate('/preview')
      }
    } finally {
      setApplying(false)
    }
  }

  const handleCheckCompatibility = async () => {
    if (!template) return
    setCheckingCompat(true)
    try {
      await checkTemplateCompatibility(template.id)
    } finally {
      setCheckingCompat(false)
    }
  }

  const handleCombine = async () => {
    if (selectedCombineTemplates.length === 0 || !template) return
    setCombining(true)
    try {
      await combineTemplates([template.id, ...selectedCombineTemplates])
    } finally {
      setCombining(false)
    }
  }

  const handleApplyCombined = async () => {
    if (!combinedTemplates || !combinedTemplates.isValid) return
    setApplying(true)
    try {
      if (currentSelection) {
        await clearSelection()
      }
      for (const item of combinedTemplates.combinedItems) {
        await addPartToSelection(item.partId)
      }
      navigate('/preview')
    } finally {
      setApplying(false)
    }
  }

  const partsByCategory = categories.map((cat) => ({
    category: cat,
    parts: templateParts.filter((p) => p?.categoryId === cat.id),
  })).filter((c) => c.parts.length > 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-moto-orange animate-spin" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-moto-silver text-lg">模板不存在</p>
        <Link
          to="/templates"
          className="mt-4 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange/90 transition-colors"
        >
          返回模板中心
        </Link>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[template.status] || STATUS_MAP.draft

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 rounded-lg bg-carbon-800/50 border border-carbon-500/20 text-moto-steel hover:text-moto-silver hover:border-moto-orange/30 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-orbitron text-2xl text-moto-silver font-bold">
                {template.name}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              {template.isHot && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-orbitron">
                  <Flame size={10} /> 热门
                </span>
              )}
              {template.isRecommended && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-moto-orange/20 text-moto-orange text-[10px] font-orbitron">
                  <Star size={10} /> 推荐
                </span>
              )}
            </div>
            <p className="text-moto-steel text-sm mt-1">
              {template.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTemplateFavorite(template.id)}
              className={`p-3 rounded-xl border transition-all ${
                isFav
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-carbon-800/50 border-carbon-500/20 text-moto-steel hover:text-red-400 hover:border-red-500/30'
              }`}
            >
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setShowCombineModal(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-carbon-800/50 border border-carbon-500/20 text-moto-steel hover:text-moto-silver hover:border-moto-orange/30 transition-all"
            >
              <Combine size={20} />
              <span className="text-sm font-orbitron hidden sm:inline">组合方案</span>
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-moto-orange text-white font-orbitron text-sm hover:bg-moto-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              一键应用
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-carbon-800/30 rounded-2xl border border-carbon-500/20 overflow-hidden">
              <div className="flex border-b border-carbon-500/20">
                {[
                  { id: 'preview', label: '效果预览', icon: Eye },
                  { id: 'parts', label: '配件清单', icon: Wrench },
                  { id: 'compatibility', label: '适配校验', icon: ShieldCheck },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-orbitron transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'text-moto-orange border-moto-orange bg-moto-orange/5'
                        : 'text-moto-steel border-transparent hover:text-moto-silver'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-moto-steel">
                        <span className="font-orbitron">作者：</span>
                        <span className="text-moto-silver">{template.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-moto-steel">
                        <Eye size={14} />
                        <span>{template.viewCount} 次浏览</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-moto-steel">
                        <Download size={14} />
                        <span>{template.useCount} 次使用</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-moto-steel">
                        <Heart size={14} />
                        <span>{template.favoriteCount} 收藏</span>
                      </div>
                    </div>
                    <BikePreview previewItems={template.items} readOnly={true} />
                  </div>
                )}

                {activeTab === 'parts' && (
                  <div className="space-y-6">
                    {partsByCategory.map(({ category, parts }) => (
                      <div key={category.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1 h-4 bg-moto-orange rounded-full" />
                          <span className="font-orbitron text-sm text-moto-silver">
                            {category.name}
                          </span>
                          <span className="text-[10px] text-moto-steel font-orbitron">
                            {parts.length} 件
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {parts.map((part) => (
                            <div
                              key={part!.id}
                              className="flex items-center gap-3 p-3 bg-carbon-800/50 rounded-xl border border-carbon-500/20 hover:border-moto-orange/30 transition-colors"
                            >
                              <img
                                src={part!.image}
                                alt={part!.name}
                                className="w-12 h-12 rounded-lg object-cover bg-carbon-700"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon&image_size=square`
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-moto-silver text-sm font-medium truncate">
                                  {part!.name}
                                </p>
                                <p className="text-[10px] text-moto-steel">
                                  {part!.brand}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-orbitron text-sm text-moto-orange">
                                  ¥{part!.price.toLocaleString()}
                                </p>
                                {part!.quantity > 1 && (
                                  <p className="text-[10px] text-moto-steel">
                                    x{part!.quantity}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'compatibility' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-orbitron text-lg text-moto-silver">
                          适配校验报告
                        </h3>
                        <p className="text-moto-steel text-sm mt-1">
                          验证方案与各车型的兼容性以及配件之间的冲突
                        </p>
                      </div>
                      <button
                        onClick={handleCheckCompatibility}
                        disabled={checkingCompat}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-carbon-700/50 text-moto-silver text-sm font-orbitron hover:bg-carbon-600/50 transition-colors disabled:opacity-50"
                      >
                        {checkingCompat ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        重新校验
                      </button>
                    </div>

                    {templateCompatibility && (
                      <>
                        <div
                          className={`p-4 rounded-xl border ${
                            templateCompatibility.isValid
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {templateCompatibility.isValid ? (
                              <CheckCircle className="text-green-500" size={24} />
                            ) : (
                              <XCircle className="text-red-500" size={24} />
                            )}
                            <div>
                              <p
                                className={`font-orbitron font-semibold ${
                                  templateCompatibility.isValid
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {templateCompatibility.isValid
                                  ? '校验通过'
                                  : '存在问题'}
                              </p>
                              <p className="text-moto-steel text-sm">
                                {templateCompatibility.isValid
                                  ? '该方案所有配件兼容且适配所有目标车型'
                                  : '请检查下方的冲突和适配问题'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-orbitron text-sm text-moto-silver mb-3 flex items-center gap-2">
                            <Layers size={14} />
                            车型适配性
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {templateCompatibility.modelCompatibility.map((mc) => (
                              <div
                                key={mc.modelId}
                                className={`p-4 rounded-xl border ${
                                  mc.isCompatible
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {mc.isCompatible ? (
                                    <CheckCircle
                                      className="text-green-500 shrink-0"
                                      size={16}
                                    />
                                  ) : (
                                    <XCircle
                                      className="text-red-500 shrink-0"
                                      size={16}
                                    />
                                  )}
                                  <span className="font-orbitron text-sm text-moto-silver">
                                    {mc.modelName}
                                  </span>
                                </div>
                                {!mc.isCompatible && (
                                  <p className="text-[11px] text-red-400">
                                    不兼容配件：{mc.incompatibleParts.join('、')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {(templateCompatibility.partConflicts.length > 0 ||
                          templateCompatibility.partWarnings.length > 0) && (
                          <ConflictAlert
                            conflicts={templateCompatibility.partConflicts}
                            warnings={templateCompatibility.partWarnings}
                          />
                        )}

                        <div className="bg-carbon-800/50 rounded-xl p-4 border border-carbon-500/20">
                          <h4 className="font-orbitron text-sm text-moto-silver mb-3">
                            费用明细
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] text-moto-steel font-orbitron uppercase">
                                配件总价
                              </p>
                              <p className="font-orbitron text-lg text-moto-silver">
                                ¥{templateCompatibility.totalPrice.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-moto-steel font-orbitron uppercase">
                                工时费用
                              </p>
                              <p className="font-orbitron text-lg text-moto-silver">
                                ¥{templateCompatibility.totalLaborFee.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-moto-steel font-orbitron uppercase">
                                总计
                              </p>
                              <p className="font-orbitron text-xl text-moto-orange font-bold">
                                ¥{templateCompatibility.grandTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {combinedTemplates && (
              <div className="bg-carbon-800/30 rounded-2xl border border-moto-orange/30 overflow-hidden">
                <div className="p-4 border-b border-carbon-500/20 bg-moto-orange/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Combine className="text-moto-orange" size={18} />
                      <span className="font-orbitron text-sm text-moto-silver">
                        组合方案预览
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-orbitron ${
                          combinedTemplates.isValid
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {combinedTemplates.isValid ? '可组合' : '存在冲突'}
                      </span>
                      <button
                        onClick={() => {
                          setCombinedTemplates(null)
                          setSelectedCombineTemplates([])
                        }}
                        className="text-moto-steel hover:text-moto-silver text-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-moto-steel mt-1">
                    组合：
                    {combinedTemplates.templates.map((t) => t.name).join(' + ')}
                  </p>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-moto-steel font-orbitron uppercase">
                        组合后总计
                      </p>
                      <p className="font-orbitron text-xl text-moto-orange font-bold">
                        ¥{combinedTemplates.grandTotal.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleApplyCombined}
                      disabled={applying || !combinedTemplates.isValid}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-moto-orange text-white font-orbitron text-sm hover:bg-moto-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applying ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                      应用组合方案
                    </button>
                  </div>
                  {combinedTemplates.conflicts.length > 0 && (
                    <ConflictAlert
                      conflicts={combinedTemplates.conflicts}
                      warnings={combinedTemplates.warnings}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-carbon-800/30 rounded-2xl border border-carbon-500/20 p-6">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">方案信息</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    分类
                  </p>
                  <p className="text-moto-silver text-sm">
                    {CATEGORY_MAP[template.category] || template.category}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    适配车型
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.modelIds.map((modelId) => (
                      <span
                        key={modelId}
                        className="text-[10px] px-2 py-0.5 rounded bg-moto-orange/10 text-moto-orange font-orbitron"
                      >
                        {modelId}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    标签
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-carbon-700/50 text-moto-steel"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-carbon-500/20">
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    配件总数
                  </p>
                  <p className="text-moto-silver text-sm">
                    {template.items.length} 件
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    配件总价
                  </p>
                  <p className="font-orbitron text-lg text-moto-orange font-bold">
                    ¥{totalPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    工时费用
                  </p>
                  <p className="font-orbitron text-lg text-moto-silver">
                    ¥{totalLaborFee.toLocaleString()}
                  </p>
                </div>
                <div className="pt-4 border-t border-carbon-500/20">
                  <p className="text-[10px] text-moto-steel font-orbitron uppercase mb-1">
                    预计总费用
                  </p>
                  <p className="font-orbitron text-2xl text-moto-orange font-bold">
                    ¥{grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-carbon-800/30 rounded-2xl border border-carbon-500/20 p-6">
              <h3 className="font-orbitron text-sm text-moto-silver mb-4">时间信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-moto-steel">创建时间</span>
                  <span className="text-moto-silver">
                    {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moto-steel">更新时间</span>
                  <span className="text-moto-silver">
                    {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {template.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-moto-steel">发布时间</span>
                    <span className="text-moto-silver">
                      {new Date(template.publishedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCombineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-carbon-500/20 flex items-center justify-between">
              <div>
                <h3 className="font-orbitron text-lg text-moto-silver">组合方案</h3>
                <p className="text-moto-steel text-sm mt-1">
                  选择其他方案进行组合，将取各分类的配件去重合并
                </p>
              </div>
              <button
                onClick={() => setShowCombineModal(false)}
                className="text-moto-steel hover:text-moto-silver"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <p className="text-xs text-moto-steel mb-4">
                当前方案：<span className="text-moto-orange">{template.name}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates
                  .filter((t) => t.id !== template.id && t.status === 'published')
                  .map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedCombineTemplates.includes(t.id)
                          ? 'bg-moto-orange/10 border-moto-orange/50'
                          : 'bg-carbon-700/30 border-carbon-500/20 hover:border-moto-orange/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCombineTemplates.includes(t.id)}
                        onChange={() => {
                          setSelectedCombineTemplates((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((id) => id !== t.id)
                              : [...prev, t.id]
                          )
                        }}
                        className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange bg-carbon-700"
                      />
                      <img
                        src={t.coverImage}
                        alt={t.name}
                        className="w-10 h-10 rounded object-cover bg-carbon-600"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+package&image_size=square`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-moto-silver text-sm truncate">{t.name}</p>
                        <p className="text-[10px] text-moto-steel">
                          {t.items.length} 件配件
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
            <div className="p-6 border-t border-carbon-500/20 flex justify-end gap-3">
              <button
                onClick={() => setShowCombineModal(false)}
                className="px-6 py-2.5 rounded-lg bg-carbon-700 text-moto-silver text-sm font-orbitron hover:bg-carbon-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCombine}
                disabled={selectedCombineTemplates.length === 0 || combining}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-moto-orange text-white text-sm font-orbitron hover:bg-moto-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {combining ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Combine size={14} />
                )}
                生成组合方案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
