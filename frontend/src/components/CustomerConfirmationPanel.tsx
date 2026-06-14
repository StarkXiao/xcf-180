import { useState } from 'react'
import type { Quote } from '@/types'
import {
  CheckCircle,
  XCircle,
  User,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react'

interface Props {
  quote: Quote
  onConfirm: (data: {
    planId?: string
    confirmedBy: string
    contactInfo: string
    note?: string
  }) => void
  onReject: (data: {
    confirmedBy: string
    contactInfo: string
    note?: string
  }) => void
  onClose: () => void
}

type ConfirmMode = 'idle' | 'confirm' | 'reject'

export default function CustomerConfirmationPanel({
  quote,
  onConfirm,
  onReject,
  onClose,
}: Props) {
  const [mode, setMode] = useState<ConfirmMode>('idle')
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    quote.plans.find((p) => p.isDefault)?.id || quote.plans[0]?.id || ''
  )
  const [confirmedBy, setConfirmedBy] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const confirmation = quote.customerConfirmation
  const isConfirmed = quote.status === 'customer_confirmed'
  const isRejected = quote.status === 'customer_rejected'
  const isPending = !isConfirmed && !isRejected

  const selectedPlan = quote.plans.find((p) => p.id === selectedPlanId)

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return {
      date: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!confirmedBy.trim()) newErrors.confirmedBy = '请输入客户姓名'
    if (!contactInfo.trim()) newErrors.contactInfo = '请输入联系方式'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = () => {
    if (!validate()) return
    onConfirm({
      planId: quote.plans.length > 1 ? selectedPlanId : undefined,
      confirmedBy: confirmedBy.trim(),
      contactInfo: contactInfo.trim(),
      note: note.trim() || undefined,
    })
  }

  const handleReject = () => {
    if (!validate()) return
    onReject({
      confirmedBy: confirmedBy.trim(),
      contactInfo: contactInfo.trim(),
      note: note.trim() || undefined,
    })
  }

  const resetForm = () => {
    setMode('idle')
    setErrors({})
  }

  return (
    <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 overflow-hidden shadow-xl">
      <div className="sticky top-0 bg-carbon-800 z-10 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-moto-orange/15 flex items-center justify-center">
            <ShieldCheck size={20} className="text-moto-orange" />
          </div>
          <div>
            <h2 className="font-orbitron text-lg text-moto-silver">客户确认留痕</h2>
            <p className="text-xs text-moto-steel mt-0.5">报价单号：{quote.quoteNo}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {isConfirmed && confirmation && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-orbitron text-emerald-400 font-medium">已确认</p>
                <p className="text-xs text-moto-steel mt-0.5">客户已确认该报价方案</p>
              </div>
            </div>

            <div className="bg-carbon-700/50 rounded-xl border border-carbon-500/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-carbon-500/20 bg-carbon-700/50">
                <h3 className="font-orbitron text-sm text-moto-silver flex items-center gap-2">
                  <ShieldCheck size={14} className="text-moto-orange" />
                  确认留痕信息
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <User size={16} className="text-moto-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">客户签名 / 确认人</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {confirmation.confirmedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-moto-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">联系信息</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {confirmation.contactInfo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-moto-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">确认日期</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {formatDateTime(confirmation.confirmedAt).date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-moto-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">确认时间</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {formatDateTime(confirmation.confirmedAt).time}
                      </p>
                    </div>
                  </div>
                </div>

                {confirmation.selectedPlanId && (
                  <div className="pt-3 border-t border-carbon-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-moto-orange/15 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} className="text-moto-orange" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-moto-steel mb-1">选择的方案</p>
                        <div className="bg-carbon-600/50 rounded-lg px-4 py-3 border border-moto-orange/20">
                          <p className="text-sm text-moto-silver font-medium font-orbitron">
                            {quote.plans.find((p) => p.id === confirmation.selectedPlanId)?.name || '默认方案'}
                          </p>
                          <p className="text-xs text-moto-steel mt-1">
                            方案总价：
                            <span className="text-moto-orange font-orbitron ml-1">
                              ¥
                              {quote.plans
                                .find((p) => p.id === confirmation.selectedPlanId)
                                ?.totalAmount.toLocaleString() || '0'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmation.note && (
                  <div className="pt-3 border-t border-carbon-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} className="text-moto-orange" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-moto-steel mb-1">备注留言</p>
                        <div className="bg-carbon-600/50 rounded-lg px-4 py-3 border border-carbon-500/30">
                          <p className="text-sm text-moto-silver">{confirmation.note}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isRejected && confirmation && (
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <XCircle size={24} className="text-rose-400" />
              </div>
              <div>
                <p className="font-orbitron text-rose-400 font-medium">已拒绝</p>
                <p className="text-xs text-moto-steel mt-0.5">客户已拒绝该报价</p>
              </div>
            </div>

            <div className="bg-carbon-700/50 rounded-xl border border-carbon-500/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-carbon-500/20 bg-carbon-700/50">
                <h3 className="font-orbitron text-sm text-moto-silver flex items-center gap-2">
                  <XCircle size={14} className="text-rose-400" />
                  拒绝详情
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <User size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">拒绝人</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {confirmation.confirmedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">联系信息</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {confirmation.contactInfo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">拒绝日期</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {formatDateTime(confirmation.confirmedAt).date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-carbon-600 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs text-moto-steel mb-1">拒绝时间</p>
                      <p className="text-sm text-moto-silver font-medium">
                        {formatDateTime(confirmation.confirmedAt).time}
                      </p>
                    </div>
                  </div>
                </div>

                {confirmation.note && (
                  <div className="pt-3 border-t border-carbon-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} className="text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-moto-steel mb-1">拒绝原因</p>
                        <div className="bg-rose-500/5 rounded-lg px-4 py-3 border border-rose-500/20">
                          <p className="text-sm text-moto-silver">{confirmation.note}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="space-y-5">
            <div className="bg-moto-orange/10 border border-moto-orange/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-moto-orange/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} className="text-moto-orange" />
              </div>
              <div>
                <p className="font-orbitron text-moto-orange font-medium">待客户确认</p>
                <p className="text-xs text-moto-steel mt-0.5">请客户填写以下信息完成确认或拒绝</p>
              </div>
            </div>

            {quote.plans.length > 1 && mode !== 'reject' && (
              <div>
                <label className="block text-xs text-moto-steel mb-2 font-orbitron">
                  选择方案
                </label>
                <div className="space-y-2">
                  {quote.plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedPlanId === plan.id
                          ? 'bg-moto-orange/10 border-moto-orange/50 shadow-lg shadow-moto-orange/10'
                          : 'bg-carbon-700/50 border-carbon-500/30 hover:border-carbon-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedPlanId === plan.id
                                ? 'border-moto-orange bg-moto-orange'
                                : 'border-carbon-500'
                            }`}
                          >
                            {selectedPlanId === plan.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-moto-silver font-orbitron">
                              {plan.name}
                              {plan.isDefault && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-moto-orange/20 text-moto-orange rounded">
                                  默认
                                </span>
                              )}
                            </p>
                            {plan.description && (
                              <p className="text-xs text-moto-steel mt-0.5">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-orbitron text-lg text-moto-orange font-bold">
                          ¥{plan.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quote.plans.length === 1 && selectedPlan && (
              <div className="bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-moto-steel">当前方案</p>
                    <p className="text-sm font-orbitron text-moto-silver mt-0.5">
                      {selectedPlan.name}
                    </p>
                  </div>
                  <p className="font-orbitron text-xl text-moto-orange font-bold">
                    ¥{selectedPlan.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <User size={10} className="inline mr-1" />
                  客户姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={confirmedBy}
                  onChange={(e) => {
                    setConfirmedBy(e.target.value)
                    setErrors((prev) => ({ ...prev, confirmedBy: '' }))
                  }}
                  placeholder="请输入客户姓名"
                  className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                    errors.confirmedBy
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                  }`}
                />
                {errors.confirmedBy && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmedBy}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <Phone size={10} className="inline mr-1" />
                  联系方式 <span className="text-red-400">*</span>
                  <span className="text-moto-steel ml-1">(电话/微信)</span>
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value)
                    setErrors((prev) => ({ ...prev, contactInfo: '' }))
                  }}
                  placeholder="请输入手机号或微信号"
                  className={`w-full px-3 py-2.5 bg-carbon-700 border rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 transition-colors ${
                    errors.contactInfo
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-carbon-500/30 focus:ring-moto-orange focus:border-moto-orange'
                  }`}
                />
                {errors.contactInfo && (
                  <p className="text-red-400 text-xs mt-1">{errors.contactInfo}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">
                  <MessageSquare size={10} className="inline mr-1" />
                  {mode === 'reject' ? '拒绝原因' : '备注留言'}
                  <span className="text-moto-steel ml-1">(选填)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    mode === 'reject'
                      ? '请输入拒绝该报价的原因...'
                      : '如有特殊要求或补充说明，请在此填写...'
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isPending && (
        <div className="sticky bottom-0 bg-carbon-800 border-t border-carbon-500/20 px-6 py-4">
          {mode === 'idle' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('reject')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/40 text-rose-400 rounded-xl font-orbitron text-sm hover:bg-rose-500/20 hover:border-rose-500/60 transition-colors"
              >
                <XCircle size={16} />
                拒绝报价
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-orbitron text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle size={16} />
                确认报价
              </button>
            </div>
          )}

          {mode === 'reject' && (
            <div className="flex items-center gap-3">
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carbon-700 text-moto-steel rounded-xl font-orbitron text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-orbitron text-sm hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20"
              >
                <XCircle size={16} />
                确认拒绝
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
