import { useStore } from '@/store/useStore'
import { useState } from 'react'
import {
  ArrowLeftRight, Download, TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb, ChevronDown, ChevronUp, Check, X, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PartDiffItem, ReplacementSuggestion } from '@/types'

export default function ComparePage() {
  const {
    selections,
    compareSelectionIdA,
    compareSelectionIdB,
    setCompareSelectionA,
    setCompareSelectionB,
    compareSelections,
    getReplacementSuggestions,
  } = useStore()

  const [showSuggestions, setShowSuggestions] = useState(true)
  const comparison = compareSelections()
  const suggestions = getReplacementSuggestions()

  const handleExport = () => {
    if (!comparison) return

    const lines: string[] = []
    lines.push('═══════════════════════════════════════════════')
    lines.push('        XCF-180 改装方案对比报告')
    lines.push('═══════════════════════════════════════════════')
    lines.push('')
    lines.push(`方案 A: ${comparison.selectionA?.name ?? '未选择'}`)
    lines.push(`方案 B: ${comparison.selectionB?.name ?? '未选择'}`)
    lines.push(`日期: ${new Date().toLocaleDateString('zh-CN')}`)
    lines.push('')
    lines.push('───────────────────────────────────────────────')
    lines.push('')

    lines.push('【价格对比】')
    lines.push(`  方案 A: ¥${comparison.totalA.toLocaleString()}`)
    lines.push(`  方案 B: ¥${comparison.totalB.toLocaleString()}`)
    const diffStr = comparison.totalDiff >= 0
      ? `+¥${comparison.totalDiff.toLocaleString()}`
      : `-¥${Math.abs(comparison.totalDiff).toLocaleString()}`
    lines.push(`  差额: ${diffStr} (${comparison.totalDiffPercent >= 0 ? '+' : ''}${comparison.totalDiffPercent.toFixed(2)}%)`)
    lines.push('')

    lines.push('【差异统计】')
    lines.push(`  新增配件: ${comparison.addedCount} 件`)
    lines.push(`  移除配件: ${comparison.removedCount} 件`)
    lines.push(`  数量变动: ${comparison.modifiedCount} 件`)
    lines.push(`  保持不变: ${comparison.unchangedCount} 件`)
    lines.push('')

    comparison.categories.forEach((cat) => {
      lines.push(`【${cat.categoryName}】`)
      lines.push(`  方案 A 小计: ¥${cat.subtotalA.toLocaleString()}`)
      lines.push(`  方案 B 小计: ¥${cat.subtotalB.toLocaleString()}`)
      const catDiff = cat.subtotalDiff >= 0
        ? `+¥${cat.subtotalDiff.toLocaleString()}`
        : `-¥${Math.abs(cat.subtotalDiff).toLocaleString()}`
      lines.push(`  分类差额: ${catDiff}`)
      lines.push('')

      cat.items.forEach((item) => {
        const partName = item.part?.name ?? '未知配件'
        let status = ''
        switch (item.diffType) {
          case 'added':
            status = '[新增]'
            break
          case 'removed':
            status = '[移除]'
            break
          case 'modified':
            status = '[变更]'
            break
          case 'unchanged':
            status = '[不变]'
            break
        }
        lines.push(`  ${status} ${partName}`)
        if (item.diffType !== 'removed') {
          lines.push(`    方案 B: ×${item.quantityB}  ¥${item.priceB.toLocaleString()}`)
        }
        if (item.diffType !== 'added') {
          lines.push(`    方案 A: ×${item.quantityA}  ¥${item.priceA.toLocaleString()}`)
        }
        const itemDiff = item.priceDiff >= 0
          ? `+¥${item.priceDiff.toLocaleString()}`
          : `-¥${Math.abs(item.priceDiff).toLocaleString()}`
        lines.push(`    价格变动: ${itemDiff}`)
        lines.push('')
      })
      lines.push('')
    })

    if (suggestions.length > 0) {
      lines.push('═══════════════════════════════════════════════')
      lines.push('【配件替换建议】')
      lines.push('')
      suggestions.slice(0, 5).forEach((s, idx) => {
        lines.push(`${idx + 1}. ${s.suggestion}`)
        lines.push(`   分类: ${s.categoryName}`)
        const priceDiffStr = s.priceDiff >= 0
          ? `+¥${s.priceDiff.toLocaleString()}`
          : `-¥${Math.abs(s.priceDiff).toLocaleString()}`
        lines.push(`   价格变动: ${priceDiffStr}`)
        if (s.pros.length > 0) {
          lines.push(`   优点:`)
          s.pros.forEach((p) => lines.push(`     • ${p}`))
        }
        if (s.cons.length > 0) {
          lines.push(`   缺点:`)
          s.cons.forEach((c) => lines.push(`     • ${c}`))
        }
        lines.push('')
      })
    }

    lines.push('═══════════════════════════════════════════════')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `XCF-180-方案对比-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDiffBadge = (diffType: string) => {
    switch (diffType) {
      case 'added':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-orbitron">
            新增
          </span>
        )
      case 'removed':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-orbitron">
            移除
          </span>
        )
      case 'modified':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-orbitron">
            变更
          </span>
        )
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-carbon-600 text-moto-steel font-orbitron">
            不变
          </span>
        )
    }
  }

  const renderPartRow = (item: PartDiffItem, side: 'A' | 'B') => {
    const isSideA = side === 'A'
    const quantity = isSideA ? item.quantityA : item.quantityB
    const price = isSideA ? item.priceA : item.priceB
    const isHidden = (item.diffType === 'added' && isSideA) || (item.diffType === 'removed' && !isSideA)

    if (isHidden) {
      return <div className="flex-1 opacity-30" />
    }

    return (
      <div className="flex-1 flex items-center gap-3">
      <div className="relative shrink-0">
        <img
          src={item.part?.image}
          alt={item.part?.name}
          className="w-12 h-12 rounded-lg object-cover bg-carbon-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${item.part?.categoryId}+part+product+photo+dark+background&image_size=square`
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-moto-silver text-sm font-medium truncate">{item.part?.name}</h4>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-moto-steel text-xs">×{quantity}</span>
          <span className="text-moto-orange font-orbitron text-sm">¥{price.toLocaleString()}</span>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
              方案对比
            </h1>
            <p className="text-moto-steel text-sm mt-1">
              并排对比两个选配方案的差异与价格变化
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/list"
              className="flex items-center gap-2 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <ArrowLeft size={14} />
              返回清单
            </Link>
            {comparison && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
              >
                <Download size={14} />
                导出报告
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
            <label className="text-moto-steel text-xs mb-2 block font-orbitron">方案 A</label>
            <select
              value={compareSelectionIdA ?? ''}
              onChange={(e) => setCompareSelectionA(e.target.value || null)}
              className="w-full bg-carbon-700 text-moto-silver rounded-lg px-4 py-2 text-sm border border-carbon-500/30 focus:border-moto-orange/50 focus:outline-none transition-colors"
            >
              <option value="">请选择方案</option>
              {selections.map((s) => (
                <option key={s.id} value={s.id}>
                {s.name} ({s.items.length} 件配件)
              </option>
              ))}
            </select>
          </div>
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-4">
            <label className="text-moto-steel text-xs mb-2 block font-orbitron">方案 B</label>
            <select
              value={compareSelectionIdB ?? ''}
              onChange={(e) => setCompareSelectionB(e.target.value || null)}
              className="w-full bg-carbon-700 text-moto-silver rounded-lg px-4 py-2 text-sm border border-carbon-500/30 focus:border-moto-orange/50 focus:outline-none transition-colors"
            >
              <option value="">请选择方案</option>
              {selections.map((s) => (
                <option key={s.id} value={s.id}>
                {s.name} ({s.items.length} 件配件)
              </option>
              ))}
            </select>
          </div>
        </div>

        {!comparison ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ArrowLeftRight size={64} className="text-carbon-500 mb-6" />
            <h2 className="font-orbitron text-moto-silver text-xl mb-2">选择两个方案开始对比</h2>
            <p className="text-moto-steel text-sm">
              请在上方选择两个选配方案，查看配件差异、价格变化与替换建议
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
                <p className="text-moto-steel text-xs font-orbitron mb-1">方案 A 总价</p>
                <p className="font-orbitron text-2xl text-moto-silver">
                  ¥{comparison.totalA.toLocaleString()}
                </p>
                <p className="text-moto-steel text-xs mt-1">
                  {comparison.selectionA?.items.length ?? 0} 件配件
                </p>
              </div>
              <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-6 bg-moto-orange/5">
                <p className="text-moto-steel text-xs font-orbitron mb-1">价格差额</p>
                <div className="flex items-center gap-2">
                  {comparison.totalDiff > 0 ? (
                    <TrendingUp size={20} className="text-red-400" />
                  ) : comparison.totalDiff < 0 ? (
                    <TrendingDown size={20} className="text-green-400" />
                  ) : (
                    <Minus size={20} className="text-moto-steel" />
                  )}
                  <p className={`font-orbitron text-2xl ${
                    comparison.totalDiff > 0
                      ? 'text-red-400'
                      : comparison.totalDiff < 0
                        ? 'text-green-400'
                        : 'text-moto-silver'
                  }`}>
                    {comparison.totalDiff >= 0 ? '+' : ''}¥{comparison.totalDiff.toLocaleString()}
                  </p>
                </div>
                <p className="text-moto-steel text-xs mt-1">
                  {comparison.totalDiffPercent >= 0 ? '+' : ''}
                  {comparison.totalDiffPercent.toFixed(2)}% 相比方案 A
                </p>
              </div>
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6">
                <p className="text-moto-steel text-xs font-orbitron mb-1">方案 B 总价</p>
                <p className="font-orbitron text-2xl text-moto-silver">
                  ¥{comparison.totalB.toLocaleString()}
                </p>
                <p className="text-moto-steel text-xs mt-1">
                  {comparison.selectionB?.items.length ?? 0} 件配件
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="font-orbitron text-2xl text-green-400">{comparison.addedCount}</p>
                <p className="text-moto-steel text-xs mt-1">新增配件</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="font-orbitron text-2xl text-red-400">{comparison.removedCount}</p>
                <p className="text-moto-steel text-xs mt-1">移除配件</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <p className="font-orbitron text-2xl text-yellow-500">{comparison.modifiedCount}</p>
                <p className="text-moto-steel text-xs mt-1">数量变更</p>
              </div>
              <div className="bg-carbon-700/50 border border-carbon-500/20 rounded-xl p-4 text-center">
                <p className="font-orbitron text-2xl text-moto-steel">{comparison.unchangedCount}</p>
                <p className="text-moto-steel text-xs mt-1">保持不变</p>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="w-full bg-carbon-800 rounded-xl border border-yellow-500/30 p-4 flex items-center justify-between hover:bg-carbon-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb size={20} className="text-yellow-500" />
                    <div className="text-left">
                      <h3 className="font-orbitron text-moto-silver text-sm">配件替换建议</h3>
                      <p className="text-moto-steel text-xs mt-0.5">
                        共 {suggestions.length} 条替换建议，帮助您在两个方案的同类配件进行对比分析
                      </p>
                    </div>
                  </div>
                  {showSuggestions ? (
                    <ChevronUp size={20} className="text-moto-steel" />
                  ) : (
                    <ChevronDown size={20} className="text-moto-steel" />
                  )}
                </button>
                {showSuggestions && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.slice(0, 6).map((s, idx) => (
                      <SuggestionCard key={idx} suggestion={s} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {comparison.categories.map((cat) => (
                <div key={cat.categoryId} className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                  <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between bg-carbon-700/30">
                    <div className="flex items-center gap-3">
                      <h3 className="font-orbitron text-moto-silver text-sm">{cat.categoryName}</h3>
                      {cat.items.filter((i) => i.diffType !== 'unchanged').length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-moto-orange/20 text-moto-orange font-orbitron">
                          {cat.items.filter((i) => i.diffType !== 'unchanged').length} 项变动
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-moto-steel">
                        A: <span className="text-moto-silver font-orbitron">¥{cat.subtotalA.toLocaleString()}</span>
                      </span>
                      <ArrowRight size={14} className="text-moto-steel" />
                      <span className="text-moto-steel">
                        B: <span className="text-moto-silver font-orbitron">¥{cat.subtotalB.toLocaleString()}</span>
                      </span>
                      <span className={`font-orbitron ${
                        cat.subtotalDiff > 0
                          ? 'text-red-400'
                          : cat.subtotalDiff < 0
                            ? 'text-green-400'
                            : 'text-moto-steel'
                      }`}>
                        {cat.subtotalDiff >= 0 ? '+' : ''}¥{cat.subtotalDiff.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-carbon-500/10">
                    {cat.items.map((item) => (
                      <div
                        key={item.partId}
                        className={`px-6 py-4 flex items-center gap-4 hover:bg-carbon-700/20 transition-colors
                        `}
                      >
                        {renderPartRow(item, 'A')}
                        <div className="shrink-0 flex flex-col items-center">
                          {getDiffBadge(item.diffType)}
                          <div className="text-moto-steel text-[10px] mt-1">
                            {item.priceDiff !== 0 && (
                              <span className={item.priceDiff > 0 ? 'text-red-400' : 'text-green-400'}>
                                {item.priceDiff >= 0 ? '+' : ''}¥{item.priceDiff.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {renderPartRow(item, 'B')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SuggestionCard({ suggestion }: { suggestion: ReplacementSuggestion }) {
  const { partA, partB, suggestion: suggestionText, priceDiff, pros, cons, categoryName } = suggestion

  return (
    <div className="bg-carbon-800 rounded-xl border border-yellow-500/20 p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-orbitron">
          {categoryName}
        </span>
        <span className={`font-orbitron text-sm ${
          priceDiff > 0
            ? 'text-red-400'
            : priceDiff < 0
              ? 'text-green-400'
              : 'text-moto-steel'
        }`}>
          {priceDiff >= 0 ? '+' : ''}¥{priceDiff.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {partA && (
          <div className="flex-1">
            <img
              src={partA.image}
              alt={partA.name}
              className="w-full aspect-square rounded-lg bg-carbon-700 object-cover mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${partA.categoryId}+part+product+photo+dark+background&image_size=square`
              }}
            />
            <p className="text-moto-silver text-xs font-medium truncate">{partA.name}</p>
            <p className="text-moto-steel text-[10px]">¥{partA.price.toLocaleString()}</p>
          </div>
        )}
        <ArrowRight size={16} className="text-moto-steel shrink-0" />
        {partB && (
          <div className="flex-1">
            <img
              src={partB.image}
              alt={partB.name}
              className="w-full aspect-square rounded-lg bg-carbon-700 object-cover mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${partB.categoryId}+part+product+photo+dark+background&image_size=square`
              }}
            />
            <p className="text-moto-silver text-xs font-medium truncate">{partB.name}</p>
            <p className="text-moto-steel text-[10px]">¥{partB.price.toLocaleString()}</p>
          </div>
        )}
      </div>

      <p className="text-moto-silver text-sm mb-3">{suggestionText}</p>

      {pros.length > 0 && (
        <div className="mb-2">
          <p className="text-moto-steel text-[10px] mb-1">优点:</p>
          {pros.map((pro, idx) => (
            <div key={idx} className="flex items-start gap-1">
              <Check size={10} className="text-green-400 mt-0.5 shrink-0" />
              <span className="text-green-400 text-[10px]">{pro}</span>
            </div>
          ))}
        </div>
      )}

      {cons.length > 0 && (
        <div>
          <p className="text-moto-steel text-[10px] mb-1">缺点:</p>
          {cons.map((con, idx) => (
            <div key={idx} className="flex items-start gap-1">
              <X size={10} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-red-400 text-[10px]">{con}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
