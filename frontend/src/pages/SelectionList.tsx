import { useStore } from '@/store/useStore'
import SelectionPanel from '@/components/SelectionPanel'
import { Trash2, Minus, Plus, Download, RotateCcw, Package, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SelectionList() {
  const { currentSelection, parts, removePartFromSelection, setQuantity, clearSelection, getTotalPrice } = useStore()
  const totalPrice = getTotalPrice()
  const selectedItems = currentSelection?.items ?? []

  const selectedParts = selectedItems
    .map((item) => {
      const part = parts.find((p) => p.id === item.partId)
      return part ? { part, quantity: item.quantity } : null
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof parts.find>>; quantity: number }[]

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
      lines.push(`【${cat}】`)
      items.forEach(({ part, quantity }) => {
        lines.push(`  ${part.name} × ${quantity}  ¥${(part.price * quantity).toLocaleString()}`)
      })
      const subtotal = items.reduce((s, i) => s + i.part.price * i.quantity, 0)
      lines.push(`  小计: ¥${subtotal.toLocaleString()}`)
      lines.push('')
    })

    lines.push('───────────────────────────────────')
    lines.push(`  总计: ¥${totalPrice.toLocaleString()}`)
    lines.push('═══════════════════════════════════')

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
              已选 {selectedParts.length} 件配件 · 合计 ¥{totalPrice.toLocaleString()}
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
                  onClick={clearSelection}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                >
                  <RotateCcw size={14} />
                  清空
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm font-orbitron hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
                >
                  <Download size={14} />
                  导出清单
                </button>
              </>
            )}
          </div>
        </div>

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
              const subtotal = items.reduce((s, i) => s + i.part.price * i.quantity, 0)
              return (
                <div key={categoryId} className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                  <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
                    <h3 className="font-orbitron text-moto-silver text-sm">{categoryId}</h3>
                    <span className="text-moto-orange font-orbitron text-sm">¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-carbon-500/10">
                    {items.map(({ part, quantity }) => (
                      <div key={part.id} className="px-6 py-4 flex items-center gap-4 hover:bg-carbon-700/30 transition-colors">
                        <img
                          src={part.image}
                          alt={part.name}
                          className="w-16 h-16 rounded-lg object-cover bg-carbon-700 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background&image_size=square`
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-moto-silver text-sm font-medium">{part.name}</h4>
                          <p className="text-moto-steel text-xs mt-1 line-clamp-1">{part.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(part.specs).slice(0, 3).map(([key, val]) => (
                              <span key={key} className="text-[10px] px-2 py-0.5 bg-carbon-700 rounded text-moto-steel">
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
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
                          className="p-2 text-moto-steel hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6 sticky bottom-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-moto-steel text-sm">选配总计</p>
                  <p className="text-moto-steel text-xs mt-1">共 {selectedParts.reduce((s, i) => s + i.quantity, 0)} 件配件</p>
                </div>
                <div className="text-right">
                  <p className="font-orbitron text-moto-orange text-3xl font-bold">
                    ¥{totalPrice.toLocaleString()}
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
