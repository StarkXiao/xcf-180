import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Bike, Package, ChevronRight, X, Check, Sparkles } from 'lucide-react'
import { getBikeModelById } from '@/data/bikeModels'

const packageTypeLabels: Record<string, { label: string; desc: string; color: string }> = {
  basic: { label: '基础版', desc: '性价比之选', color: 'text-moto-steel border-moto-steel/30 bg-moto-steel/10' },
  sport: { label: '运动版', desc: '性能优先', color: 'text-moto-orange border-moto-orange/30 bg-moto-orange/10' },
  street: { label: '街潮版', desc: '颜值至上', color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
}

export default function ModelSelector({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    bikeModels,
    currentModelId,
    currentPackageType,
    setCurrentModel,
    applyDefaultPackage,
    getPackagesForCurrentModel,
    getPackagePrice,
  } = useStore()

  const [selectedModel, setSelectedModel] = useState<string | null>(currentModelId)
  const [isApplying, setIsApplying] = useState(false)

  const packages = selectedModel ? getPackagesForCurrentModel() : []
  const currentModel = selectedModel ? getBikeModelById(selectedModel) : null

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    setCurrentModel(modelId)
  }

  const handleApplyPackage = async (packageType: 'basic' | 'sport' | 'street') => {
    if (!selectedModel) return
    setIsApplying(true)
    try {
      await applyDefaultPackage(selectedModel, packageType)
    } finally {
      setIsApplying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-carbon-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-moto-orange/20 flex items-center justify-center">
              <Bike size={20} className="text-moto-orange" />
            </div>
            <div>
              <h2 className="font-orbitron text-lg text-moto-silver font-bold">选择车型与改装方案</h2>
              <p className="text-moto-steel text-sm mt-0.5">快速生成基础改装包，一键搞定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="mb-6">
            <p className="text-moto-steel text-xs font-orbitron uppercase tracking-wider mb-3">选择车型</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bikeModels.map((model) => {
                const isSelected = selectedModel === model.id
                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-moto-orange bg-moto-orange/10 shadow-lg shadow-moto-orange/10'
                        : 'border-carbon-500/30 bg-carbon-700/30 hover:border-carbon-400/50 hover:bg-carbon-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-orbitron text-sm font-bold ${
                        isSelected ? 'text-moto-orange' : 'text-moto-silver'
                      }`}>
                        {model.name}
                      </h3>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-moto-orange flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-moto-steel text-xs line-clamp-2">{model.description}</p>
                    <p className="font-orbitron text-xs text-moto-orange mt-2">
                      起步价 ¥{model.basePrice.toLocaleString()}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedModel && currentModel && (
            <div className="animate-fade-in">
              <p className="text-moto-steel text-xs font-orbitron uppercase tracking-wider mb-3">
                选择改装方案
              </p>
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const pkgInfo = packageTypeLabels[pkg.type]
                  const price = getPackagePrice(selectedModel, pkg.type as 'basic' | 'sport' | 'street')
                  const isCurrentPackage = currentPackageType === pkg.type && currentModelId === selectedModel
                  const laborFee = Math.round(price * 0.12)
                  const totalPrice = price + laborFee

                  return (
                    <div
                      key={pkg.type}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        isCurrentPackage
                          ? 'border-moto-orange bg-moto-orange/5'
                          : 'border-carbon-500/30 bg-carbon-700/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-orbitron border ${pkgInfo.color}`}>
                              {pkgInfo.label}
                            </span>
                            <Package size={14} className="text-moto-steel" />
                            <span className="text-moto-silver font-medium text-sm">{pkg.name}</span>
                            {isCurrentPackage && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-moto-orange/20 text-moto-orange font-orbitron">
                                当前使用
                              </span>
                            )}
                          </div>
                          <p className="text-moto-steel text-xs mb-2">{pkg.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-moto-steel">
                              配件: <span className="text-moto-silver font-orbitron">¥{price.toLocaleString()}</span>
                            </span>
                            <span className="text-moto-steel">
                              工时: <span className="text-moto-silver font-orbitron">¥{laborFee.toLocaleString()}</span>
                            </span>
                            <span className="text-moto-orange font-orbitron font-bold">
                              合计 ¥{totalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyPackage(pkg.type as 'basic' | 'sport' | 'street')}
                          disabled={isApplying || isCurrentPackage}
                          className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-orbitron transition-all ${
                            isCurrentPackage
                              ? 'bg-carbon-600 text-moto-steel cursor-default'
                              : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-lg shadow-moto-orange/20'
                          }`}
                        >
                          {isApplying ? (
                            <span className="animate-pulse">应用中...</span>
                          ) : isCurrentPackage ? (
                            '已应用'
                          ) : (
                            <>
                              <Sparkles size={14} />
                              应用方案
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!selectedModel && (
            <div className="text-center py-12">
              <Bike size={48} className="text-carbon-500 mx-auto mb-3" />
              <p className="text-moto-steel text-sm">请先选择车型</p>
              <p className="text-carbon-500 text-xs mt-1">选择车型后将展示对应的改装方案</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
