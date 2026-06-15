import { useState } from 'react'
import { useStore } from '@/store/useStore'
import {
  Search,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Filter,
  Star,
  X,
  CheckCircle2,
  Tag,
  ChevronRight,
  Layers,
  Save,
  ArrowRight,
} from 'lucide-react'
import type { Part, Category } from '@/types'

interface SelectedPart {
  part: Part
  quantity: number
}

export default function OnSiteSelectionPanel() {
  const {
    allParts,
    categories,
    currentRequirement,
    currentCustomer,
    createReceptionSelection,
    createQuoteFromSelection,
    setReceptionActiveTab,
    currentReceptionSelection,
    currentQuote,
    setCurrentQuote,
    setCurrentReceptionSelection,
  } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedParts, setSelectedParts] = useState<Record<string, SelectedPart>>({})
  const [showCart, setShowCart] = useState(true)
  const [saving, setSaving] = useState(false)

  const displayedCategories: { value: string; label: string }[] = [
    { value: 'all', label: '全部配件' },
    ...categories
      .filter((c) => c.status === 'active' && c.visible)
      .map((c: Category) => ({ value: c.id, label: c.name })),
  ]

  const filteredParts = allParts.filter((part) => {
    if (selectedCategory !== 'all' && part.categoryId !== selectedCategory) return false
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase()
      if (
        !part.name.toLowerCase().includes(q) &&
        !part.brand.toLowerCase().includes(q) &&
        !(part.description || '').toLowerCase().includes(q) &&
        !(part.model || '').toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return part.inStock && part.status === 'active'
  })

  const addPart = (part: Part) => {
    setSelectedParts((prev) => {
      if (prev[part.id]) {
        return {
          ...prev,
          [part.id]: { ...prev[part.id], quantity: prev[part.id].quantity + 1 },
        }
      }
      return { ...prev, [part.id]: { part, quantity: 1 } }
    })
  }

  const removePart = (partId: string) => {
    setSelectedParts((prev) => {
      if (!prev[partId]) return prev
      if (prev[partId].quantity <= 1) {
        const next = { ...prev }
        delete next[partId]
        return next
      }
      return {
        ...prev,
        [partId]: { ...prev[partId], quantity: prev[partId].quantity - 1 },
      }
    })
  }

  const deletePart = (partId: string) => {
    setSelectedParts((prev) => {
      const next = { ...prev }
      delete next[partId]
      return next
    })
  }

  const selectedPartsArray = Object.values(selectedParts)
  const totalCount = selectedPartsArray.reduce((sum, s) => sum + s.quantity, 0)
  const totalPrice = selectedPartsArray.reduce(
    (sum, s) => sum + s.part.price * s.quantity,
    0
  )

  const handleAddToQuote = async () => {
    if (selectedPartsArray.length === 0) {
      alert('请先选择配件')
      return
    }
    if (!currentCustomer) {
      alert('请先在「客户建档」中选择客户')
      setReceptionActiveTab('customer')
      return
    }
    setSaving(true)
    try {
      const items = selectedPartsArray.map(({ part, quantity }) => ({
        partId: part.id,
        partName: part.name,
        partBrand: part.brand,
        partImage: part.imageUrl || part.image || '',
        categoryId: part.categoryId,
        unitPrice: part.price,
        quantity,
        laborHours: 0,
      }))
      const selection = await createReceptionSelection({
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        requirementId: currentRequirement?.id,
        items,
      })
      if (!selection) {
        throw new Error('保存选配失败')
      }
      const quote = await createQuoteFromSelection(selection.id, {
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerContact: currentCustomer.contact || currentCustomer.name,
        customerPhone: currentCustomer.phone,
        customerEmail: currentCustomer.email,
        requirementId: currentRequirement?.id,
      })
      if (quote) {
        alert(`报价单「${quote.quoteNo}」创建成功！`)
        setCurrentQuote(quote)
        setCurrentReceptionSelection(selection)
        setReceptionActiveTab('budget')
      }
    } catch (e) {
      console.error(e)
      alert('创建报价失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSelectionOnly = async () => {
    if (selectedPartsArray.length === 0) {
      alert('请先选择配件')
      return
    }
    if (!currentCustomer) {
      alert('请先在「客户建档」中选择客户')
      setReceptionActiveTab('customer')
      return
    }
    setSaving(true)
    try {
      const items = selectedPartsArray.map(({ part, quantity }) => ({
        partId: part.id,
        partName: part.name,
        partBrand: part.brand,
        partImage: part.imageUrl || part.image || '',
        categoryId: part.categoryId,
        unitPrice: part.price,
        quantity,
        laborHours: 0,
      }))
      await createReceptionSelection({
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        requirementId: currentRequirement?.id,
        items,
      })
      alert('选配清单已保存！')
    } catch (e) {
      console.error(e)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-carbon-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-orbitron text-lg text-moto-silver font-bold">现场选配</h3>
            {currentCustomer && (
              <p className="text-xs text-moto-steel mt-0.5">
                正在为 {currentCustomer.name} 选择配件
                {currentRequirement && ` · 需求 #${currentRequirement.id.slice(-4)}`}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors relative ${
              showCart
                ? 'bg-carbon-700 text-moto-silver'
                : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30'
            }`}
          >
            <ShoppingCart size={16} />
            已选配件
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-moto-orange text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Search size={16} className="text-moto-steel shrink-0" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索配件名称、品牌、型号..."
              className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 flex-1 min-w-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-moto-steel shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none"
            >
              {displayedCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filteredParts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-moto-steel">
              <Package size={56} className="mb-4 opacity-20" />
              <p className="text-lg mb-2">暂无配件</p>
              <p className="text-sm opacity-60">试试其他关键词或分类</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredParts.map((part) => {
                const selected = selectedParts[part.id]
                return (
                  <div
                    key={part.id}
                    className="bg-carbon-800/50 rounded-xl border border-carbon-500/20 overflow-hidden hover:border-carbon-500/40 transition-all group"
                  >
                    <div className="h-36 bg-carbon-900 relative overflow-hidden">
                      {part.imageUrl ? (
                        <img
                          src={part.imageUrl}
                          alt={part.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={40} className="text-moto-steel opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {part.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-moto-orange text-white text-[10px] rounded">
                            <Star size={8} fill="white" />
                            推荐
                          </span>
                        )}
                        {part.discount && part.discount < 1 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">
                            {Math.round((1 - part.discount) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-moto-orange rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {selected.quantity}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="text-sm font-medium text-moto-silver line-clamp-1 flex-1 min-w-0">
                          {part.name}
                        </h4>
                        {part.rating > 0 && (
                          <span className="text-[10px] text-yellow-400 ml-2 shrink-0">
                            {getRatingStars(part.rating)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-moto-steel mb-2 line-clamp-1">{part.brand}</p>
                      {part.tags && part.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {part.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-carbon-700 text-moto-steel text-[10px] rounded"
                            >
                              <Tag size={8} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-orbitron text-lg text-moto-orange">
                            ¥{part.price.toLocaleString()}
                          </span>
                          {part.originalPrice && part.originalPrice > part.price && (
                            <span className="ml-1.5 text-[10px] text-moto-steel line-through">
                              ¥{part.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-green-400">
                          库存 {part.stock}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected ? (
                          <>
                            <button
                              onClick={() => removePart(part.id)}
                              className="w-8 h-8 flex items-center justify-center bg-carbon-700 text-moto-silver rounded-lg hover:bg-carbon-600 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="flex-1 text-center text-sm font-medium text-moto-silver">
                              {selected.quantity}
                            </span>
                            <button
                              onClick={() => addPart(part)}
                              disabled={selected.quantity >= part.stock}
                              className="w-8 h-8 flex items-center justify-center bg-moto-orange/20 text-moto-orange rounded-lg hover:bg-moto-orange/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addPart(part)}
                            disabled={part.stock <= 0}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                            添加
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showCart && (
          <div className="w-80 shrink-0 border-l border-carbon-500/30 flex flex-col bg-carbon-900/50">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h4 className="font-orbitron text-moto-silver font-semibold flex items-center gap-2">
                <ShoppingCart size={16} className="text-moto-orange" />
                已选配件
              </h4>
              <span className="text-xs text-moto-steel">{totalCount} 件</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedPartsArray.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-moto-steel">
                  <ShoppingCart size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">购物车为空</p>
                  <p className="text-xs opacity-60">从左侧选择配件加入</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPartsArray.map(({ part, quantity }) => (
                    <div
                      key={part.id}
                      className="p-3 bg-carbon-800 rounded-lg border border-carbon-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg bg-carbon-900 shrink-0 overflow-hidden">
                          {part.imageUrl ? (
                            <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-moto-steel opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm text-moto-silver font-medium line-clamp-1">
                            {part.name}
                          </h5>
                          <p className="text-[10px] text-moto-steel mb-1.5">{part.brand}</p>
                          <p className="font-orbitron text-sm text-moto-orange">
                            ¥{part.price.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deletePart(part.id)}
                          className="p-1 text-moto-steel hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-carbon-500/20">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removePart(part.id)}
                            className="w-6 h-6 flex items-center justify-center bg-carbon-700 text-moto-silver rounded text-xs hover:bg-carbon-600 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-moto-silver">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addPart(part)}
                            disabled={quantity >= part.stock}
                            className="w-6 h-6 flex items-center justify-center bg-moto-orange/20 text-moto-orange rounded text-xs hover:bg-moto-orange/30 transition-colors disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-orbitron text-sm text-moto-silver">
                          ¥{(part.price * quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPartsArray.length > 0 && (
              <div className="p-4 border-t border-carbon-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-moto-steel">商品小计</span>
                  <span className="font-orbitron text-lg text-moto-orange">
                    ¥{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedParts({})}
                    className="flex-1 px-4 py-2 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={handleSaveSelectionOnly}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? '保存中...' : '保存选配'}
                  </button>
                  <button
                    onClick={handleAddToQuote}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-moto-orange text-white rounded-lg text-xs hover:bg-moto-orange/90 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    {saving ? '创建中...' : '生成报价'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (currentQuote) {
                      setReceptionActiveTab('budget')
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs transition-colors ${
                    currentQuote
                      ? 'text-moto-orange hover:text-moto-orange/80'
                      : 'text-moto-steel cursor-not-allowed opacity-50'
                  }`}
                >
                  <ChevronRight size={14} />
                  {currentQuote
                    ? `查看当前报价「${currentQuote.quoteNo}」`
                    : '先生成报价后再查看'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
