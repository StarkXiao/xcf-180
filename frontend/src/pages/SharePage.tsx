import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { Part, Share } from '@/types'
import { AlertTriangle, Clock, Eye, FileText, ArrowLeft, Lock, Calendar, Package } from 'lucide-react'

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>()
  const [share, setShare] = useState<Share | null>(null)
  const [allParts, setAllParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'notfound' | 'expired' | 'other' | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!shareId) return
      setLoading(true)
      setError(null)
      setErrorType(null)
      try {
        const [shareData, partsData] = await Promise.all([
          api.getShare(shareId),
          api.getParts(),
        ])
        setShare(shareData)
        setAllParts(partsData)
      } catch (e: any) {
        if (e.message.includes('404')) {
          setError('分享链接不存在或已被删除')
          setErrorType('notfound')
        } else if (e.message.includes('410')) {
          try {
            const errData = await e.json?.().catch(() => ({}))
            setError(errData.message || '该分享链接已失效')
            setErrorType('expired')
          } catch {
            setError('该分享链接已失效')
            setErrorType('expired')
          }
        } else {
          setError('加载分享内容失败，请稍后重试')
          setErrorType('other')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [shareId])

  const getTotalPrice = () => {
    if (!share) return 0
    return share.items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return total + (part ? part.price * item.quantity : 0)
    }, 0)
  }

  const getCategorySubtotal = (categoryId: string) => {
    if (!share) return 0
    return share.items.reduce((total, item) => {
      const part = allParts.find((p) => p.id === item.partId)
      if (part && part.categoryId === categoryId) {
        return total + part.price * item.quantity
      }
      return total
    }, 0)
  }

  const getCategoryName = (categoryId: string) => {
    const names: Record<string, string> = {
      exhaust: '排气系统',
      wheels: '轮毂轮胎',
      handlebar: '车把手',
      lighting: '灯光系统',
      bodykit: '车身套件',
      brake: '制动系统',
    }
    return names[categoryId] || categoryId
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-moto-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-moto-steel text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {errorType === 'expired' ? (
            <Lock size={48} className="mx-auto text-moto-steel mb-4" />
          ) : (
            <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          )}
          <h2 className="font-orbitron text-xl text-moto-silver mb-2">
            {errorType === 'expired' ? '分享已失效' : '无法访问'}
          </h2>
          <p className="text-moto-steel text-sm mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-moto-orange text-white rounded-lg font-orbitron text-sm hover:bg-moto-orange-light transition-colors"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = getTotalPrice()
  const selectedParts = share.items
    .map((item) => {
      const part = allParts.find((p) => p.id === item.partId)
      return part ? { part, quantity: item.quantity } : null
    })
    .filter(Boolean) as { part: Part; quantity: number }[]

  const groupedByCategory = selectedParts.reduce<Record<string, typeof selectedParts>>((acc, item) => {
    const cat = item.part.categoryId
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-moto-orange/10 text-moto-orange text-xs font-orbitron rounded border border-moto-orange/30">
                  只读分享
                </span>
                <span className="text-xs text-moto-steel font-mono">{share.id}</span>
              </div>
              <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
                {share.name}
              </h1>
              <p className="text-moto-steel text-sm mt-1">
                共 {selectedParts.length} 件配件 · 配件合计 ¥{totalPrice.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-moto-steel/70 mt-2">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  分享于 {formatDate(share.createdAt)}
                </span>
                {share.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    有效期至 {formatDate(share.expiresAt)}
                  </span>
                )}
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </div>

          {share.note && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-400 font-medium mb-1">分享备注</p>
                  <p className="text-sm text-moto-silver">{share.note}</p>
                </div>
              </div>
            </div>
          )}

          {selectedParts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-carbon-800/30 rounded-2xl border border-carbon-500/20">
              <Package size={64} className="text-carbon-500 mb-6" />
              <h2 className="font-orbitron text-moto-silver text-xl mb-2">清单为空</h2>
              <p className="text-moto-steel text-sm">该分享清单没有包含任何配件</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByCategory).map(([categoryId, items]) => {
                const subtotal = getCategorySubtotal(categoryId)
                const categoryName = getCategoryName(categoryId)
                return (
                  <div key={categoryId} className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
                    <div className="px-6 py-4 border-b border-carbon-500/20 flex items-center justify-between">
                      <div>
                        <h3 className="font-orbitron text-moto-silver text-sm">{categoryName}</h3>
                        <p className="text-moto-steel text-xs mt-0.5">{items.length} 项配件</p>
                      </div>
                      <div className="text-right">
                        <p className="text-moto-orange font-orbitron text-sm">¥{subtotal.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="divide-y divide-carbon-500/10">
                      {items.map(({ part, quantity }) => (
                        <div
                          key={part.id}
                          className="px-6 py-4 flex items-center gap-4"
                        >
                          <div className="shrink-0">
                            <img
                              src={part.image}
                              alt={part.name}
                              className="w-16 h-16 rounded-lg object-cover bg-carbon-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${part.categoryId}+part+${part.name}+product+photo+dark+background&image_size=square`
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-moto-silver text-sm font-medium">{part.name}</h4>
                              <span className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded">
                                × {quantity}
                              </span>
                            </div>
                            <p className="text-moto-steel text-xs mt-1 line-clamp-1">{part.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(part.specs).slice(0, 2).map(([key, val]) => (
                                <span key={key} className="text-[10px] px-2 py-0.5 bg-carbon-700 rounded text-moto-steel">
                                  {key}: {String(val)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0 w-28">
                            <p className="font-orbitron text-moto-orange text-lg">¥{(part.price * quantity).toLocaleString()}</p>
                            {quantity > 1 && (
                              <p className="text-moto-steel text-xs">单价 ¥{part.price.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-3 bg-carbon-700/30 border-t border-carbon-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-moto-steel text-sm">分类小计</span>
                        <span className="text-moto-orange font-orbitron font-bold">¥{subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-6 sticky bottom-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-moto-silver">费用汇总</p>
                    <p className="text-moto-steel text-xs mt-1">
                      共 {selectedParts.reduce((s, i) => s + i.quantity, 0)} 件配件
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-moto-steel text-xs mb-1">配件总价</p>
                    <p className="font-orbitron text-3xl font-bold text-moto-orange">
                      ¥{totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-moto-steel/50">
            <p className="flex items-center justify-center gap-1">
              <Eye size={12} />
              此为只读分享链接，所有内容无法修改
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
