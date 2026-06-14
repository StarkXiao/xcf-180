import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import TemplateCard from '@/components/TemplateCard'
import { Search, SlidersHorizontal, Package, Heart, Sparkles } from 'lucide-react'

export default function TemplateCenterPage() {
  const {
    fetchTemplates,
    fetchParts,
    templatesLoading,
    templateCategories,
    templateSearchQuery,
    templateCategoryFilter,
    templateModelFilter,
    setTemplateSearchQuery,
    setTemplateCategoryFilter,
    setTemplateModelFilter,
    getFilteredTemplates,
    getFavoriteParts,
    templateFavorites,
    templates,
    bikeModels,
    isTemplateFavorite,
  } = useStore()

  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const init = async () => {
      await fetchParts()
      await fetchTemplates({ status: 'published' })
    }
    init()
  }, [])

  const filteredTemplates = getFilteredTemplates()
  const hotTemplates = filteredTemplates.filter((t) => t.isHot || t.isRecommended)
  const favoriteTemplates = filteredTemplates.filter((t) => isTemplateFavorite(t.id))

  const activeCategoryName =
    templateCategories.find((c) => c.id === templateCategoryFilter)?.name ?? '全部方案'

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold flex items-center gap-3">
              <Package className="text-moto-orange" size={28} />
              方案模板中心
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              精选热门改装方案，一键应用，快速打造专属座驾
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-moto-orange/10 via-moto-orange/5 to-transparent rounded-2xl p-6 mb-8 border border-moto-orange/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-moto-orange/20 flex items-center justify-center shrink-0">
              <Sparkles className="text-moto-orange" size={24} />
            </div>
            <div>
              <h2 className="font-orbitron text-lg text-moto-silver font-semibold">
                热门改装方案推荐
              </h2>
              <p className="text-moto-steel text-sm mt-1 max-w-2xl">
                基于大数据精选的热门改装组合，经过兼容性严格验证，覆盖赛道运动、街头风格、基础通勤等多种场景。
                收藏喜欢的方案，随时查看和应用。
              </p>
            </div>
          </div>
        </div>

        {hotTemplates.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-moto-orange rounded-full" />
              <span className="font-orbitron text-sm text-moto-silver uppercase tracking-wider">
                热门推荐
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-orbitron">
                HOT
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hotTemplates.slice(0, 4).map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </div>
        )}

        {favoriteTemplates.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-red-400" />
              <span className="font-orbitron text-sm text-moto-silver uppercase tracking-wider">
                我的收藏
              </span>
              <span className="text-[10px] text-moto-steel font-orbitron">
                {favoriteTemplates.length} 个方案
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteTemplates.slice(0, 4).map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 mt-8">
          <div className="flex items-center gap-3">
            <span className="w-1 h-5 bg-moto-orange rounded-full" />
            <span className="font-orbitron text-sm text-moto-silver uppercase tracking-wider">
              全部方案
            </span>
            <span className="text-[10px] text-moto-steel font-orbitron">
              共 {filteredTemplates.length} 个方案
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel"
              />
              <input
                type="text"
                placeholder="搜索方案名称、标签..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-carbon-800/50 border border-carbon-500/30 rounded-lg text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors placeholder:text-moto-steel/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange'
                  : 'bg-carbon-800/50 border-carbon-500/30 text-moto-steel hover:border-moto-orange/30'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-carbon-800/30 rounded-xl p-4 mb-6 border border-carbon-500/20 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-moto-steel font-orbitron uppercase tracking-wider block mb-2">
                  分类筛选
                </label>
                <div className="flex flex-wrap gap-2">
                  {templateCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTemplateCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all ${
                        templateCategoryFilter === cat.id
                          ? 'bg-moto-orange text-white'
                          : 'bg-carbon-700/50 text-moto-steel hover:bg-carbon-600/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-moto-steel font-orbitron uppercase tracking-wider block mb-2">
                  车型适配
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTemplateModelFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all ${
                      !templateModelFilter
                        ? 'bg-moto-orange text-white'
                        : 'bg-carbon-700/50 text-moto-steel hover:bg-carbon-600/50'
                    }`}
                  >
                    全部
                  </button>
                  {bikeModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setTemplateModelFilter(model.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all ${
                        templateModelFilter === model.id
                          ? 'bg-moto-orange text-white'
                          : 'bg-carbon-700/50 text-moto-steel hover:bg-carbon-600/50'
                      }`}
                    >
                      {model.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTemplateCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-orbitron transition-all border ${
                templateCategoryFilter === cat.id
                  ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange'
                  : 'bg-carbon-800/50 border-carbon-500/20 text-moto-steel hover:border-moto-orange/30'
              }`}
            >
              {cat.name}
              <span className="text-[10px] ml-1 opacity-60">
                {
                  templates.filter((t) =>
                    cat.id === 'all'
                      ? t.status === 'published'
                      : cat.id === 'hot'
                      ? (t.isHot || t.isRecommended) && t.status === 'published'
                      : t.category === cat.id && t.status === 'published'
                  ).length
                }
              </span>
            </button>
          ))}
        </div>

        {templatesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-carbon-800/50 rounded-xl overflow-hidden border border-carbon-500/20 animate-pulse"
              >
                <div className="aspect-[16/9] bg-carbon-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-carbon-700 rounded w-3/4" />
                  <div className="h-3 bg-carbon-700 rounded w-full" />
                  <div className="h-3 bg-carbon-700 rounded w-5/6" />
                  <div className="flex justify-between pt-2 border-t border-carbon-500/20">
                    <div className="h-6 bg-carbon-700 rounded w-16" />
                    <div className="h-6 bg-carbon-700 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={48} className="text-carbon-500 mb-4" />
            <p className="text-moto-steel text-lg">暂无匹配的方案模板</p>
            <p className="text-carbon-500 text-sm mt-2">尝试更换分类或修改搜索条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
