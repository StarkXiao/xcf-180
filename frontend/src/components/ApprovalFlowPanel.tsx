import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Send,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import type { ApprovalFlow, QuoteStatus, ApprovalRole } from '@/types'
import { APPROVAL_ROLE_LABELS } from '@/types'

interface ApprovalFlowPanelProps {
  flow: ApprovalFlow | null
  quoteStatus: QuoteStatus
  onApprove?: (nodeId: string, comment?: string) => void
  onReject?: (nodeId: string, comment?: string) => void
  onReturn?: (nodeId: string, comment?: string) => void
  onSubmit?: () => void
  disabled?: boolean
}

const FLOW_ROLES: ApprovalRole[] = ['sales', 'sales_manager', 'finance', 'general_manager']

const STATUS_CONFIG = {
  pending: {
    label: '待处理',
    bg: 'bg-carbon-600',
    border: 'border-carbon-500',
    text: 'text-moto-steel',
    icon: Clock,
    iconBg: 'bg-carbon-600',
    iconColor: 'text-moto-steel',
  },
  approved: {
    label: '已通过',
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
    icon: CheckCircle,
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
  },
  rejected: {
    label: '已拒绝',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    icon: XCircle,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
  },
  returned: {
    label: '已退回',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    icon: RotateCcw,
    iconBg: 'bg-yellow-500',
    iconColor: 'text-white',
  },
  skipped: {
    label: '已跳过',
    bg: 'bg-carbon-700/50',
    border: 'border-carbon-500/30',
    text: 'text-carbon-500',
    icon: ChevronRight,
    iconBg: 'bg-carbon-600',
    iconColor: 'text-carbon-500',
  },
}

const ACTION_CONFIG = {
  approve: { label: '通过', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600 shadow-green-500/20' },
  reject: { label: '拒绝', icon: XCircle, color: 'bg-red-500 hover:bg-red-600 shadow-red-500/20' },
  return: { label: '退回', icon: RotateCcw, color: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionLabel(action: string) {
  switch (action) {
    case 'approve':
      return '通过'
    case 'reject':
      return '拒绝'
    case 'return':
      return '退回'
    default:
      return action
  }
}

export default function ApprovalFlowPanel({
  flow,
  quoteStatus,
  onApprove,
  onReject,
  onReturn,
  onSubmit,
  disabled = false,
}: ApprovalFlowPanelProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const nodes = flow?.nodes ?? []
  const history = flow?.history ?? []
  const currentNode = nodes.find((n) => n.status === 'pending')
  const isDraft = quoteStatus === 'draft'

  const handleAction = (nodeId: string, action: 'approve' | 'reject' | 'return') => {
    if (disabled) return
    const finalComment = comment.trim() || undefined
    if (action === 'approve') onApprove?.(nodeId, finalComment)
    if (action === 'reject') onReject?.(nodeId, finalComment)
    if (action === 'return') onReturn?.(nodeId, finalComment)
    setComment('')
    setActiveNodeId(null)
  }

  return (
    <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-carbon-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-moto-orange/10 flex items-center justify-center">
            <CheckCircle size={16} className="text-moto-orange" />
          </div>
          <div>
            <h3 className="font-orbitron text-sm text-moto-silver">审批流程</h3>
            <p className="text-[11px] text-moto-steel mt-0.5">四级审批机制</p>
          </div>
        </div>
        {isDraft && onSubmit && (
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange text-white rounded-lg text-xs font-orbitron hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            提交审批
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="relative">
          <div className="flex items-stretch gap-1">
            {FLOW_ROLES.map((role, index) => {
              const node = nodes.find((n) => n.role === role)
              const status = node?.status ?? 'pending'
              const config = STATUS_CONFIG[status]
              const StatusIcon = config.icon
              const isCurrent = node?.status === 'pending'
              const isLast = index === FLOW_ROLES.length - 1

              return (
                <div key={role} className="flex-1 flex items-stretch">
                  <div className="flex-1 flex flex-col">
                    <div
                      className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${
                        config.bg
                      } ${config.border} ${
                        isCurrent ? 'ring-2 ring-moto-orange ring-offset-2 ring-offset-carbon-800 animate-pulse-glow' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 relative ${
                          config.iconBg
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute inset-0 rounded-full bg-moto-orange/30 animate-ping" />
                        )}
                        <StatusIcon
                          size={20}
                          className={`${config.iconColor} relative z-10`}
                        />
                      </div>
                      <span className={`text-xs font-orbitron ${config.text}`}>
                        {APPROVAL_ROLE_LABELS[role]}
                      </span>
                      <span className={`text-[10px] mt-1 ${config.text}`}>
                        {config.label}
                      </span>
                      {node?.approverName && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-moto-steel">
                          <User size={10} />
                          <span className="truncate max-w-[80px]">{node.approverName}</span>
                        </div>
                      )}
                      {node?.comment && (
                        <div className="mt-2 px-2 py-1.5 bg-carbon-700/70 rounded border border-carbon-500/30 text-[10px] text-moto-steel leading-snug max-w-[140px] line-clamp-3" title={node.comment}>
                          <span className="opacity-70">意见：</span>{node.comment}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex items-center px-1">
                      <ChevronRight
                        size={16}
                        className={`${
                          index < (flow?.currentStep ?? 0)
                            ? 'text-moto-orange'
                            : 'text-carbon-500'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {currentNode && !isDraft && (
          <div className="mt-5 bg-carbon-700/50 rounded-xl p-4 border border-carbon-500/20">
            {activeNodeId === currentNode.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-moto-orange/20 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-moto-orange" />
                  </div>
                  <span className="text-sm text-moto-silver">
                    {APPROVAL_ROLE_LABELS[currentNode.role]} 审批操作
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="输入审批备注（可选）"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-moto-silver text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(currentNode.id, 'approve')}
                    disabled={disabled}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-lg text-xs font-orbitron transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${ACTION_CONFIG.approve.color}`}
                  >
                    <CheckCircle size={14} />
                    通过
                  </button>
                  <button
                    onClick={() => handleAction(currentNode.id, 'return')}
                    disabled={disabled}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-lg text-xs font-orbitron transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${ACTION_CONFIG.return.color}`}
                  >
                    <RotateCcw size={14} />
                    退回
                  </button>
                  <button
                    onClick={() => handleAction(currentNode.id, 'reject')}
                    disabled={disabled}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-lg text-xs font-orbitron transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${ACTION_CONFIG.reject.color}`}
                  >
                    <XCircle size={14} />
                    拒绝
                  </button>
                  <button
                    onClick={() => {
                      setActiveNodeId(null)
                      setComment('')
                    }}
                    className="px-3 py-2.5 bg-carbon-600 text-moto-steel rounded-lg text-xs hover:bg-carbon-500 hover:text-moto-silver transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-moto-orange/20 flex items-center justify-center relative">
                    <span className="absolute inset-0 rounded-full bg-moto-orange/20 animate-ping" />
                    <Clock size={18} className="text-moto-orange relative z-10" />
                  </div>
                  <div>
                    <p className="text-sm text-moto-silver font-medium">
                      等待 {APPROVAL_ROLE_LABELS[currentNode.role]} 审批
                    </p>
                    <p className="text-xs text-moto-steel mt-0.5">
                      当前节点正在等待处理
                    </p>
                  </div>
                </div>
                {!disabled && (onApprove || onReject || onReturn) && (
                  <button
                    onClick={() => setActiveNodeId(currentNode.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange/20 text-moto-orange border border-moto-orange/30 rounded-lg text-xs font-orbitron hover:bg-moto-orange/30 transition-colors"
                  >
                    执行审批
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-5 pt-5 border-t border-carbon-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-moto-orange" />
              <h4 className="font-orbitron text-xs text-moto-silver">审批历史</h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-700 text-moto-steel font-orbitron">
                {history.length} 条记录
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-carbon-500/30" />
              <div className="space-y-4">
                {history.map((record, index) => {
                  const actionColor =
                    record.action === 'approve'
                      ? 'text-green-400 bg-green-500/20'
                      : record.action === 'reject'
                        ? 'text-red-400 bg-red-500/20'
                        : 'text-yellow-400 bg-yellow-500/20'
                  const ActionIcon =
                    record.action === 'approve'
                      ? CheckCircle
                      : record.action === 'reject'
                        ? XCircle
                        : RotateCcw

                  return (
                    <div key={index} className="relative pl-8">
                      <div
                        className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${actionColor}`}
                      >
                        <ActionIcon size={12} />
                      </div>
                      <div className="bg-carbon-700/30 rounded-lg p-3 border border-carbon-500/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-moto-silver">
                                {record.approverName || '系统'}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${actionColor}`}
                              >
                                {getActionLabel(record.action)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-carbon-600 text-moto-steel font-orbitron">
                                {APPROVAL_ROLE_LABELS[record.role]}
                              </span>
                            </div>
                            {record.comment && (
                              <div className="flex items-start gap-1.5 mt-2">
                                <MessageSquare size={10} className="text-moto-steel mt-0.5 shrink-0" />
                                <p className="text-xs text-moto-steel leading-relaxed">
                                  {record.comment}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-moto-steel shrink-0">
                            <Clock size={10} />
                            <span>{formatDate(record.actedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!flow && !isDraft && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Clock size={36} className="text-carbon-600 mb-3" />
            <p className="text-sm text-moto-steel">暂无审批流程</p>
            <p className="text-xs text-moto-steel/60 mt-1">
              提交审批后将显示流程状态
            </p>
          </div>
        )}

        {isDraft && !flow && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Send size={36} className="text-carbon-600 mb-3" />
            <p className="text-sm text-moto-steel">报价单处于草稿状态</p>
            <p className="text-xs text-moto-steel/60 mt-1">
              点击"提交审批"按钮启动审批流程
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
