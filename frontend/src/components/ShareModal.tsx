import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { X, Copy, Check, Share2, Calendar, Clock, Eye, Link2, AlertCircle } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { currentSelection, createShare, shares, sharesLoading, fetchShares, updateShare, deleteShare } = useStore()
  const [note, setNote] = useState('')
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('')
  const [expiresAt, setExpiresAt] = useState('')
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  if (!isOpen || !currentSelection) return null

  const getShareUrl = (shareId: string) => {
    return `${window.location.origin}/share/${shareId}`
  }

  const copyToClipboard = async (shareId: string) => {
    const url = getShareUrl(shareId)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(shareId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const handleCreateShare = async () => {
    setCreating(true)
    try {
      const data: any = { note: note || undefined }
      if (useCustomDate && expiresAt) {
        data.expiresAt = new Date(expiresAt).toISOString()
      } else if (expiresInDays && expiresInDays > 0) {
        data.expiresInDays = expiresInDays
      }
      await createShare(data)
      setNote('')
      setExpiresInDays('')
      setExpiresAt('')
      setUseCustomDate(false)
      await fetchShares()
    } catch (e) {
      console.error('Failed to create share:', e)
    } finally {
      setCreating(false)
    }
  }

  const toggleShareActive = async (shareId: string, isActive: boolean) => {
    await updateShare(shareId, { isActive: !isActive })
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

  const isExpired = (share: any) => {
    if (!share.isActive) return true
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) return true
    return false
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-carbon-900 rounded-2xl border border-carbon-500/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-500/20">
          <div className="flex items-center gap-3">
            <Share2 className="text-moto-orange" size={20} />
            <h2 className="font-orbitron text-lg text-moto-silver">分享选配清单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-moto-steel hover:text-white hover:bg-carbon-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 mb-6">
            <h3 className="font-orbitron text-sm text-moto-silver mb-4">生成分享链接</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-moto-steel mb-1.5">备注说明（可选）</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="添加备注，方便接收方了解方案背景..."
                  className="w-full px-4 py-3 bg-carbon-700 border border-carbon-500/30 rounded-lg text-sm text-moto-silver placeholder-moto-steel/50 focus:outline-none focus:border-moto-orange/50 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">有效期</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <select
                      value={expiresInDays}
                      onChange={(e) => {
                        setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))
                        if (e.target.value !== '') setUseCustomDate(false)
                      }}
                      className="w-full px-4 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-sm text-moto-silver focus:outline-none focus:border-moto-orange/50"
                      disabled={useCustomDate}
                    >
                      <option value="">永不过期</option>
                      <option value="1">1 天</option>
                      <option value="7">7 天</option>
                      <option value="30">30 天</option>
                      <option value="90">90 天</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="customDate"
                      checked={useCustomDate}
                      onChange={(e) => {
                        setUseCustomDate(e.target.checked)
                        if (e.target.checked) setExpiresInDays('')
                      }}
                      className="w-4 h-4 accent-moto-orange"
                    />
                    <label htmlFor="customDate" className="text-xs text-moto-steel">自定义日期</label>
                  </div>
                </div>
              </div>

              {useCustomDate && (
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">失效日期</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-sm text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              <button
                onClick={handleCreateShare}
                disabled={creating || currentSelection.items.length === 0}
                className="w-full py-3 bg-moto-orange text-white rounded-lg font-orbitron text-sm hover:bg-moto-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Link2 size={16} />
                {creating ? '生成中...' : '生成只读分享链接'}
              </button>

              {currentSelection.items.length === 0 && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  清单为空，无法分享
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-orbitron text-sm text-moto-silver mb-3">历史分享记录</h3>
            {sharesLoading ? (
              <div className="text-center py-8 text-moto-steel text-sm">加载中...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 bg-carbon-800/50 rounded-xl border border-dashed border-carbon-500/20">
                <Share2 size={32} className="mx-auto text-carbon-500 mb-2" />
                <p className="text-moto-steel text-sm">暂无分享记录</p>
                <p className="text-moto-steel/60 text-xs mt-1">生成的分享链接将显示在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={`bg-carbon-800 rounded-xl border p-4 transition-all ${
                      isExpired(share)
                        ? 'border-carbon-500/10 opacity-60'
                        : 'border-carbon-500/20 hover:border-moto-orange/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isExpired(share) ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-carbon-700 text-moto-steel">
                              已失效
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                              有效
                            </span>
                          )}
                          <span className="font-orbitron text-xs text-moto-orange">
                            {share.id}
                          </span>
                        </div>
                        {share.note && (
                          <p className="text-xs text-moto-silver mb-2 line-clamp-2">{share.note}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-moto-steel">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(share.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            {share.accessCount} 次访问
                          </span>
                          {share.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              有效期至 {formatDate(share.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-carbon-700 rounded-lg px-3 py-2 text-xs text-moto-steel font-mono truncate">
                        {getShareUrl(share.id)}
                      </div>
                      <button
                        onClick={() => copyToClipboard(share.id)}
                        className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                          copiedId === share.id
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-carbon-700 text-moto-steel hover:text-moto-silver'
                        }`}
                      >
                        {copiedId === share.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === share.id ? '已复制' : '复制'}
                      </button>
                      <button
                        onClick={() => toggleShareActive(share.id, share.isActive)}
                        className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                          share.isActive
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                        }`}
                      >
                        {share.isActive ? '撤销' : '恢复'}
                      </button>
                      <button
                        onClick={() => deleteShare(share.id)}
                        className="px-3 py-2 rounded-lg text-xs bg-carbon-700 text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
