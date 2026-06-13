import { useStore } from '@/store/useStore'
import SelectionPanel from '@/components/SelectionPanel'
import ConflictAlert from '@/components/ConflictAlert'
import { Trash2, Minus, Plus, Download, RotateCcw, Package, ArrowLeft, AlertTriangle, XCircle, ArrowLeftRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function SelectionList() {
  const {
    currentSelection,
    allParts,
    removePartFromSelection,
    setQuantity,
    clearSelection,
    getTotalPrice,
    getTotalLaborFee,
    getGrandTotal,
    getCategoryName,
    getCategorySubtotal,
    getCategoryLaborFee,
    laborFeeRates,
    compatibilityResult,
    compatibilityLoading,
    partConflictMap,
    getConflictsForPart,
    getWarningsForPart,
    setCompareSelectionA,
    setCompareSelectionB,
    selections,
  } = useStore()
  const navigate = useNavigate()
  const totalPrice = getTotalPrice()
  const totalLaborFee = getTotalLaborFee()
  const grandTotal = getGrandTotal()
  const selectedItems = currentSelection?.items ?? []
  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0

  const selectedParts = selectedItems
    .map((item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return part ? { part, quantity: item.quantity } : null
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof allParts.find>>; quantity: number }[]

  const groupedByCategory = selectedParts.reduce<Record<string, typeof selectedParts>>((acc, item) => {
    const cat = item.part.categoryId
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const handleExport = () => {
    const lines: string[] = []
    lines.push('═══════════════════════════════════')
    lines.push('  XCF-180 改装配件选配清单')
    lines.push('═══════════════════════════════════')
    lines.push('')
    lines.push(`方案: ${currentSelection?.name ?? '未命名'}`)
    lines.push(`日期: ${new Date().toLocaleDateString('zh-CN')}`)
    lines.push('')

    Object.entries(groupedByCategory).forEach(([cat, items]) => {
      const categoryName = getCategoryName(cat)
      const subtotal = getCategorySubtotal(cat)
      const laborFee = getCategoryLaborFee(cat)
      const categoryTotal = subtotal + laborFee
      const laborRate = Math.round((laborFeeRates[cat] ?? 0.1) * 100)
      lines.push(`【${categoryName}】`)
      items.forEach(({ part, quantity }) => {
        lines.push(`  ${part.name} × ${quantity}  ¥${(part.price * quantity).toLocaleString()}`)
      })
      lines.push(`  ─────────────────────────`)
      lines.push(`  配件小计: ¥${subtotal.toLocaleString()}`)
      lines.push(`  施工费(${laborRate}%): ¥${laborFee.toLocaleString()}`)
      lines.push(`  分类合计: ¥${categoryTotal.toLocaleString()}`)
      lines.push('')
    })

    lines.push('───────────────────────────────────')
    lines.push(`  配件总价: ¥${totalPrice.toLocaleString()}`)
    lines.push(`  施工费估算: ¥${totalLaborFee.toLocaleString()}`)
    lines.push(`  预估总计: ¥${grandTotal.toLocaleString()}`)
    lines.push('═══════════════════════════════════')
    lines.push('')
    lines.push('* 施工费为估算值，实际费用以门店报价为准')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `XCF-180-选配清单-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              选配清单
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              已选 {selectedParts.length} 件配件 · 配件合计 ¥{totalPrice.toLocaleString()} · 含施工费总计 ¥{grandTotal.toLocaleString()}
              {(hasConflicts || hasWarnings) && (
                <span className={`ml-2 ${hasConflicts ? 'text-red-400' : 'text-yellow-500'}`}>
                  · {hasConflicts ? `${compatibilityResult!.conflicts.length} 项冲突` : `${compatibilityResult!.warnings.length} 项提醒`}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/preview"
              className="flex items-center gap-2 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <ArrowLeft size={14} />
              返回预览
            </Link>
            {selectedParts.length > 0 && (
              <>
                <button
                  onClick={() => {
                    if (currentSelection) {
                      setCompareSelectionA(currentSelection.id)
                      const other = selections.find((s) => s.id !== currentSelection.id)
                      if (other) {
                        setCompareSelectionB(other.id)
                      }
                      navigate('/compare')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors"
                >
                  <ArrowLeftRight size={14} />
                  方案对比
                </button>
                <button
                  onClick={clearSelection}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                >
                  <RotateCcw size={14} />
                  清空
                </button>
                <button
                  onClick={handleExport}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-orbitron transition-colors shadow-lg ${
                    hasConflicts
                      ? 'bg-red-500 text-white hover:bg-red-400 shadow-red-500/20'
                      : hasWarnings
                        ? 'bg-yellow-500 text-white hover:bg-yellow-400 shadow-yellow-500/20'
                        : 'bg-moto-orange text-white hover:bg-moto-orange-light shadow-moto-orange/20'
                  }`}
                >
                  <Download size={14} />
                  {hasConflicts ? '仍要导出' : hasWarnings ? '谨慎导出' : '导出清单'}
                </button>
              </>
            )}
          </div>
        </div>

        {(hasConflicts || hasWarnings) && compatibilityResult && (
          <div className="mb-6">
            <ConflictAlert
              conflicts={compatibilityResult.conflicts}
              warnings={compatibilityResult.warnings}
            />
          </div>
        )}

        {selectedParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">清单为空</h2>
            <p className="text-moto-steel text-sm mb-6">前往配件浏览页面开始选配</p>
            <Link
              to="/"
              className="px-6 py-3 bg-moto-orange text-white rounded-xl font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
            >
              开始选配
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([categoryId, items]) => {
              const subtotal = getCategorySubtotal(categoryId)
              const laborFee = getCategoryLaborFee(categoryId)
              const categoryTotal = subtotal + laborFee
              const categoryName = getCategoryName(categoryId)
              const laborRate = laborFeeRates[categoryId] ?? 0.1
              return (
                <div key={categoryId} className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                  <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
                    <div>
                      <h3 className="font-orbitron text-moto-silver text-sm">{categoryName}</h3>
                      <p className="text-moto-steel text-xs mt-0.5">{items.length} 项配件</p>
                    </div>
                    <div className="text-right">
                      <p className="text-moto-orange font-orbitron text-sm">¥{categoryTotal.toLocaleString()}</p>
                      <p className="text-moto-steel text-xs">含施工费</p>
                    </div>
                  </div>
                  <div className="divide-y divide-carbon-500/10">
                    {items.map(({ part, quantity }) => {
                      const conflictStatus = partConflictMap[part.id]
                      const hasError = conflictStatus?.hasError
                      const hasWarning = conflictStatus?.hasWarning
                      const partConflicts = getConflictsForPart(part.id)
                      const partWarnings = getWarningsForPart(part.id)

                      return (
                        <div
                          key={part.id}
                          className={`px-6 py-4 flex items-center gap-4 hover:bg-carbon-700/30 transition-colors border-l-4 ${
                            hasError
                              ? 'border-l-red-500'
                              : hasWarning
                                ? 'border-l-yellow-500'
                                : 'border-l-transparent'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={part.image}
                              alt={part.name}
                              className="w-16 h-16 rounded-lg object-cover bg-carbon-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background&image_size=square`
                              }}
                            />
                            {(hasError || hasWarning) && (
                              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                hasError ? 'bg-red-500' : 'bg-yellow-500'
                              }`}>
                                {hasError ? <XCircle size={12} className="text-white" /> : <AlertTriangle size={12} className="text-white" />}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-moto-silver text-sm font-medium">{part.name}</h4>
                              {(hasError || hasWarning) && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  hasError ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                  {hasError ? `${partConflicts.length} 项冲突` : `${partWarnings.length} 项提醒`}
                                </span>
                              )}
                            </div>
                            <p className="text-moto-steel text-xs mt-1 line-clamp-1">{part.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(part.specs).slice(0, 3).map(([key, val]) => (
                                <span key={key} className="text-[10px] px-2 py-0.5 bg-carbon-700 rounded text-moto-steel">
                                  {key}: {String(val)}
                                </span>
                              ))}
                            </div>
                            {(hasError || hasWarning) && (
                              <div className={`mt-2 text-[10px] ${hasError ? 'text-red-400' : 'text-yellow-500'}`}>
                                {(hasError ? partConflicts : partWarnings).slice(0, 1).map((c) => (
                                  <span key={c.partId}>
                                    {c.message}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setQuantity(part.id, quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-carbon-700 flex items-center justify-center text-moto-steel hover:text-white hover:bg-carbon-600 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-moto-silver font-orbitron text-sm">{quantity}</span>
                            <button
                              onClick={() => setQuantity(part.id, quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-carbon-700 flex items-center justify-center text-moto-steel hover:text-white hover:bg-carbon-600 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-right shrink-0 w-28">
                            <p className="font-orbitron text-moto-orange text-lg">¥{(part.price * quantity).toLocaleString()}</p>
                            {quantity > 1 && (
                              <p className="text-moto-steel text-xs">单价 ¥{part.price.toLocaleString()}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removePartFromSelection(part.id)}
                            className={`p-2 transition-colors shrink-0 ${
                              hasError
                                ? 'text-red-400 hover:text-red-300'
                                : 'text-moto-steel hover:text-red-400'
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="px-6 py-3 bg-carbon-700/30 border-t border-carbon-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-moto-steel">配件小计</span>
                      <span className="text-moto-silver font-orbitron">¥{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-moto-steel">施工费估算 <span className="text-xs">({Math.round(laborRate * 100)}%)</span></span>
                      <span className="text-blue-400 font-orbitron">¥{laborFee.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-carbon-500/20">
                      <span className="text-moto-silver text-sm font-medium">分类合计</span>
                      <span className="text-moto-orange font-orbitron font-bold">¥{categoryTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className={`bg-carbon-800 rounded-xl border p-6 sticky bottom-0 ${
              hasConflicts
                ? 'border-red-500/30 bg-red-500/5'
                : hasWarnings
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-carbon-500/20'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-silver'
                  }`}>
                    {hasConflicts
                      ? '存在兼容冲突，请处理后再下单'
                      : hasWarnings
                        ? '存在搭配提醒，建议咨询技术人员'
                        : '费用汇总'}
                  </p>
                  <p className="text-moto-steel text-xs mt-1">
                    共 {selectedParts.reduce((s, i) => s + i.quantity, 0)} 件配件
                    {(hasConflicts || hasWarnings) && (
                      <span className={`ml-2 ${hasConflicts ? 'text-red-400' : 'text-yellow-500'}`}>
                        · {hasConflicts
                          ? `${compatibilityResult!.conflicts.length} 项冲突`
                          : `${compatibilityResult!.warnings.length} 项提醒`}
                      </span>
                    )}
                  </p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-moto-steel w-20">配件总价</span>
                      <span className="text-moto-silver font-orbitron">¥{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-moto-steel w-20">施工费估算</span>
                      <span className="text-blue-400 font-orbitron">¥{totalLaborFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-moto-steel text-xs mb-1">预估总计</p>
                  <p className={`font-orbitron text-3xl font-bold ${
                    hasConflicts ? 'text-red-400' : hasWarnings ? 'text-yellow-500' : 'text-moto-orange'
                  }`}>
                    ¥{grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <SelectionPanel />
    </div>
  )
}
