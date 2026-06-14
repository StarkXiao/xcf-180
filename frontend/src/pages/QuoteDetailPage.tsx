import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  ArrowLeft, Clock, User, Phone, Wrench, Mail, CalendarDays, FileText,
  ChevronRight, Plus, Layers, ArrowLeftRight, Send, CheckCircle2,
  XCircle, ShieldCheck, Trash2, Edit2, Download, Printer, FileSpreadsheet,
  DollarSign, Mail as MailIcon, Package, Eye, X, Star, Percent,
} from 'lucide-react'
import type { QuoteStatus, QuotePlan, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, ApprovalRole } from '@/types'
import { QUOTE_STATUS_LABELS as STATUS_LABELS, APPROVAL_ROLE_LABELS } from '@/types'
import ApprovalFlowPanel from '@/components/ApprovalFlowPanel'
import PlanComparison from '@/components/PlanComparison'
import QuoteExportPanel from '@/components/QuoteExportPanel'
import CustomerConfirmationPanel from '@/components/CustomerConfirmationPanel'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  draft: { label: '草稿', color: 'text-gray-400', bgColor: 'bg-gray-500', borderColor: 'border-gray-500', icon: <Clock size={14} /> },
  pending_approval: { label: '待审批', color: 'text-yellow-500', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500', icon: <Clock size={14} /> },
  approved: { label: '已通过', color: 'text-green-400', bgColor: 'bg-green-500', borderColor: 'border-green-500', icon: <CheckCircle2 size={14} /> },
  rejected: { label: '已拒绝', color: 'text-red-400', bgColor: 'bg-red-500', borderColor: 'border-red-500', icon: <XCircle size={14} /> },
  sent_to_customer: { label: '已发客户', color: 'text-blue-400', bgColor: 'bg-blue-500', borderColor: 'border-blue-500', icon: <Send size={14} /> },
  customer_confirmed: { label: '客户确认', color: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500', icon: <ShieldCheck size={14} /> },
  customer_rejected: { label: '客户拒绝', color: 'text-rose-400', bgColor: 'bg-rose-500', borderColor: 'border-rose-500', icon: <XCircle size={14} /> },
  expired: { label: '已过期', color: 'text-zinc-400', bgColor: 'bg-zinc-500', borderColor: 'border-zinc-500', icon: <Clock size={14} /> },
  converted: { label: '已转订单', color: 'text-purple-400', bgColor: 'bg-purple-500', borderColor: 'border-purple-500', icon: <CheckCircle2 size={14} /> },
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    quotes, currentQuote, quotesLoading,
    fetchQuotes, fetchQuoteDetail, updateQuote, deleteQuote,
    createQuotePlan, deleteQuotePlan,
    submitQuoteApproval, processQuoteApproval, sendQuoteToCustomer,
    customerConfirmQuote, customerRejectQuote, exportQuote, convertQuoteToOrder,
    setPlanComparison, planComparison, compareQuotePlans,
    fetchDiscountRules, discountRules, applyDiscountToPlan, downloadQuoteFile,
  } = useStore()

  const [activeTab, setActiveTab] = useState<'plans' | 'approval' | 'customer' | 'export'>('plans')
  const [showComparison, setShowComparison] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showCustomerConfirm, setShowCustomerConfirm] = useState(false)
  const [comparePlanA, setComparePlanA] = useState('')
  const [comparePlanB, setComparePlanB] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    customerName: '', customerContact: '', customerPhone: '', customerEmail: '',
    remark: '', internalNote: '', validUntil: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchQuoteDetail(id)
    if (quotes.length === 0) fetchQuotes()
    fetchDiscountRules({ isActive: true })
  }, [id])

  const quote = currentQuote?.id === id ? currentQuote : quotes.find((q) => q.id === id)

  useEffect(() => {
    if (quote) {
      setEditForm({
        customerName: quote.customerName,
        customerContact: quote.customerContact,
        customerPhone: quote.customerPhone,
        customerEmail: quote.customerEmail || '',
        remark: quote.remark || '',
        internalNote: quote.internalNote || '',
        validUntil: quote.validUntil || '',
      })
    }
  }, [quote?.id])

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText size={64} className="text-carbon-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-moto-silver text-xl mb-2">报价单不存在</h2>
          <button
            onClick={() => navigate('/quotes')}
            className="px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors"
          >
            返回报价列表
          </button>
        </div>
      </div>
    )
  }

  const activePlan: QuotePlan | undefined = quote.plans.find((p) => p.id === quote.activePlanId) || quote.plans[0]

  const statusConfig = STATUS_CONFIG[quote.status]

  const handleSaveEdit = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await updateQuote(id, {
        customerName: editForm.customerName,
        customerContact: editForm.customerContact,
        customerPhone: editForm.customerPhone,
        customerEmail: editForm.customerEmail || undefined,
        remark: editForm.remark || undefined,
        internalNote: editForm.internalNote || undefined,
        validUntil: editForm.validUntil || undefined,
      })
      setEditMode(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('确定要删除此报价单吗？此操作不可恢复。')) return
    await deleteQuote(id)
    navigate('/quotes')
  }

  const handleSubmitApproval = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await submitQuoteApproval(id, { submitter: '当前用户', comment: '请审批' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprovalAction = async (nodeId: string, action: 'approve' | 'reject' | 'return', comment?: string) => {
    if (!id) return
    const node = quote.approvalFlow?.nodes.find((n) => n.id === nodeId)
    if (!node) return
    setSubmitting(true)
    try {
      await processQuoteApproval(id, nodeId, {
        nodeId,
        role: node.role,
        action,
        approverName: '当前用户',
        comment,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendToCustomer = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await sendQuoteToCustomer(id)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomerConfirm = async (data: { planId?: string; confirmedBy: string; contactInfo: string; note?: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await customerConfirmQuote(id, data)
      setShowCustomerConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomerReject = async (data: { confirmedBy: string; contactInfo: string; note?: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await customerRejectQuote(id, data)
      setShowCustomerConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'print') => {
    if (!id) return
    setSubmitting(true)
    try {
      if (format === 'print') {
        await exportQuote(id, {
          format,
          planId: activePlan?.id,
          exportedBy: '当前用户',
        })
        const printWin = window.open('', '_blank', 'width=900,height=1200')
        if (printWin && activePlan) {
          const title = `${quote.quoteNo} 报价单`
          const partsHTML = buildPrintHTML(quote, activePlan)
          printWin.document.write(partsHTML)
          printWin.document.title = title
          printWin.document.close()
          printWin.focus()
          setTimeout(() => {
            printWin.print()
          }, 400)
        }
      } else {
        await downloadQuoteFile(format, id, activePlan?.id, '当前用户')
      }
      setShowExport(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConvert = async () => {
    if (!id) return
    if (!confirm('确定将此报价单转为正式订单吗？')) return
    setSubmitting(true)
    try {
      await convertQuoteToOrder(id)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPlan = async () => {
    if (!id || !activePlan) return
    const name = prompt('请输入新方案名称：', `${activePlan.name} 副本`)
    if (!name) return
    setSubmitting(true)
    try {
      await createQuotePlan(id, {
        quoteId: id,
        name,
        description: '基于已有方案创建的变体方案',
        items: activePlan.items.map((i) => ({
          partId: i.partId,
          unitPrice: i.unitPrice,
          discountRate: i.discountRate,
          quantity: i.quantity,
        })),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!id) return
    if (!confirm('确定要删除此方案吗？')) return
    setSubmitting(true)
    try {
      await deleteQuotePlan(id, planId)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetActivePlan = async (planId: string) => {
    if (!id) return
    await updateQuote(id, { activePlanId: planId })
  }

  const handleApplyDiscount = async (planId: string) => {
    if (!id) return
    setSubmitting(true)
    try {
      await applyDiscountToPlan(id, planId)
    } finally {
      setSubmitting(false)
    }
  }

  const groupedItems = useMemo(() => {
    if (!activePlan) return {}
    return activePlan.items.reduce<Record<string, typeof activePlan.items>>((acc, item) => {
      if (!acc[item.categoryId]) acc[item.categoryId] = []
      acc[item.categoryId].push(item)
      return acc
    }, {})
  }, [activePlan])

  const buildPrintHTML = (q: any, plan: any): string => {
    const grouped: Record<string, any[]> = {}
    for (const item of plan.items) {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = []
      grouped[item.categoryId].push(item)
    }
    let rows = ''
    let idx = 0
    for (const [, items] of Object.entries(grouped)) {
      const catName = items[0]?.categoryName ?? '未分类'
      const catSub = items.reduce((s: number, it: any) => s + it.subtotal, 0)
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        idx++
        rows += `<tr>
          <td class="bdr" style="text-align:center">${idx}</td>
          ${i === 0 ? `<td class="bdr" style="font-weight:600;background:#f9fafb" rowspan="${items.length}">${catName}</td>` : ''}
          <td class="bdr">${it.partName}</td>
          <td class="bdr" style="text-align:center">${it.partBrand}</td>
          <td class="bdr" style="text-align:center">×${it.quantity}</td>
          <td class="bdr" style="text-align:right">¥${it.originalPrice.toLocaleString()}</td>
          <td class="bdr" style="text-align:right">¥${it.unitPrice.toLocaleString()}</td>
          <td class="bdr" style="text-align:center">${Math.round((it.discountRate || 0) * 100)}%</td>
          <td class="bdr" style="text-align:right;font-weight:600">¥${it.subtotal.toLocaleString()}</td>
        </tr>`
      }
      rows += `<tr style="background:#f9fafb">
        <td class="bdr" colspan="8" style="text-align:right;font-style:italic;color:#6b7280;font-size:12px">${catName} 小计</td>
        <td class="bdr" style="text-align:right;font-weight:700">¥${catSub.toLocaleString()}</td>
      </tr>`
    }
    const rules = (plan.appliedDiscountRules ?? []).map((r: any) => `<div>· ${r.description}（-¥${r.appliedAmount.toLocaleString()}）</div>`).join('')
    const approvalHistory = (q.approvalFlow?.history ?? []).map((h: any) => {
      const roleLabels: Record<string, string> = { sales: '销售', sales_manager: '销售经理', finance: '财务', general_manager: '总经理' }
      const actionLabels: Record<string, string> = { approve: '通过', reject: '拒绝', return: '退回' }
      const date = h.actedAt ? new Date(h.actedAt).toLocaleString('zh-CN') : ''
      return `<div style="margin:8px 0;padding:10px 12px;background:#f9fafb;border-left:3px solid #f97316;border-radius:4px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span><b>${h.approverName || '系统'}</b>（${roleLabels[h.role] || h.role}）<span style="margin-left:8px;padding:2px 6px;background:#fee2e2;color:#b91c1c;border-radius:4px;font-size:12px">${actionLabels[h.action] || h.action}</span></span>
          <span style="color:#6b7280;font-size:12px">${date}</span>
        </div>
        ${h.comment ? `<div style="color:#4b5563;margin-top:4px">📝 ${h.comment}</div>` : ''}
      </div>`
    }).join('')
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>${q.quoteNo} 报价单</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:#fff;color:#111827;padding:48px 56px;line-height:1.6;font-size:14px}
h1{font-size:28px;font-weight:700;text-align:center;letter-spacing:2px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;margin-bottom:32px}
.sub{text-align:center;color:#6b7280;font-size:13px;margin-top:-24px;margin-bottom:32px;letter-spacing:3px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 48px;margin-bottom:28px}
.info-label{color:#6b7280;min-width:80px}
.info-val{font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
th{background:#f3f4f6;border:1px solid #d1d5db;padding:10px 8px;font-weight:600;text-align:center}
.bdr{border:1px solid #d1d5db;padding:8px}
.sum{background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #e5e7eb}
.sum-row{display:flex;justify-content:space-between;padding:6px 0}
.sum-final{font-size:22px;font-weight:700;color:#ea580c}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding-top:32px;border-top:1px solid #e5e7eb}
.sign-label{font-size:14px;color:#6b7280;margin-bottom:48px}
.sign-line{border-top:1px solid #6b7280;padding-top:8px;display:flex;justify-content:space-between;font-size:12px;color:#6b7280}
.foot{margin-top:32px;padding-top:16px;border-top:1px dashed #d1d5db;text-align:center;font-size:12px;color:#9ca3af}
.ht{font-weight:700;margin:24px 0 12px;font-size:15px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}
@media print{body{padding:24px}}
</style></head>
<body>
<h1>XCF-180 摩托车改装报价单</h1>
<div class="sub">MOTORCYCLE CUSTOMIZATION QUOTATION</div>
<div class="info-grid">
  <div><span class="info-label">报价单号：</span><span class="info-val">${q.quoteNo}</span></div>
  <div><span class="info-label">日 期：</span><span class="info-val">${new Date(q.createdAt).toLocaleDateString('zh-CN')}</span></div>
  <div><span class="info-label">客户名称：</span><span class="info-val">${q.customerName}</span></div>
  <div><span class="info-label">联 系 人：</span><span class="info-val">${q.customerContact}</span></div>
  <div><span class="info-label">联系电话：</span><span class="info-val">${q.customerPhone}</span></div>
  <div><span class="info-label">有效期至：</span><span class="info-val">${q.validUntil ? new Date(q.validUntil).toLocaleDateString('zh-CN') : '-'}</span></div>
  <div style="grid-column:span 2"><span class="info-label">车 型：</span><span class="info-val">${q.modelName}${q.packageName ? '（' + q.packageName + '）' : ''}</span></div>
  ${q.plans.length > 1 ? `<div style="grid-column:span 2"><span class="info-label">方 案：</span><span class="info-val">${plan.name}${plan.description ? ' — ' + plan.description : ''}</span></div>` : ''}
</div>
<table>
  <thead><tr>
    <th style="width:6%">序号</th><th style="width:12%">分类</th><th>配件名称</th><th style="width:10%">品牌</th>
    <th style="width:8%">数量</th><th style="width:10%">原价</th><th style="width:10%">单价</th>
    <th style="width:7%">折扣</th><th style="width:12%">小计</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="sum">
  <div class="sum-row"><span>配件小计：</span><span class="info-val">¥${plan.partsTotal.toLocaleString()}</span></div>
  <div class="sum-row"><span>工费合计：</span><span class="info-val">¥${plan.laborFeeTotal.toLocaleString()}</span></div>
  <div class="sum-row"><span style="color:#059669">优惠金额：</span><span style="color:#059669;font-weight:600">-¥${plan.discountTotal.toLocaleString()}</span></div>
  ${rules ? `<div style="padding:8px 0 4px 24px;color:#059669;font-size:13px">${rules}</div>` : ''}
  <div class="sum-row" style="padding-top:12px;border-top:1px solid #e5e7eb;margin-top:8px">
    <span>报价总计（小写）：</span><span class="sum-final">¥${plan.totalAmount.toLocaleString()}</span>
  </div>
</div>
${q.remark ? `<div class="sum-row" style="padding:12px 0"><span style="color:#6b7280">备注：</span><span>${q.remark}</span></div>` : ''}
${approvalHistory ? `<div class="ht">📋 审批意见留痕</div>${approvalHistory}` : ''}
<div class="sign">
  <div><div class="sign-label">审批人签字：</div><div class="sign-line"><span>签字：_______________</span><span>日期：_______________</span></div></div>
  <div><div class="sign-label">客户确认：</div><div class="sign-line"><span>签字：_______________</span><span>日期：_______________</span></div></div>
</div>
<div class="foot">本报价单由 XCF-180 摩托车改装系统自动生成 | 如有疑问请联系销售人员</div>
</body></html>`
  }

  const tabs = [
    { key: 'plans' as const, label: '方案管理', icon: Layers },
    { key: 'approval' as const, label: '审批流程', icon: ShieldCheck },
    { key: 'customer' as const, label: '客户确认', icon: User },
    { key: 'export' as const, label: '导出打印', icon: Download },
  ]

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/quotes')}
              className="flex items-center gap-2 px-3 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <ArrowLeft size={14} />
              返回
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-orbitron text-xl lg:text-2xl text-moto-silver font-bold">
                  {quote.quoteNo}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color} border-current/30 bg-current/10`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-moto-steel text-xs mt-1">
                创建于 {new Date(quote.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quote.status === 'draft' && (
              <>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
                >
                  <Edit2 size={14} />
                  编辑
                </button>
                <button
                  onClick={handleSubmitApproval}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  提交审批
                </button>
              </>
            )}
            {quote.status === 'approved' && (
              <button
                onClick={handleSendToCustomer}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                <MailIcon size={14} />
                发送给客户
              </button>
            )}
            {(quote.status === 'sent_to_customer' || quote.status === 'customer_confirmed') && (
              <button
                onClick={() => setShowCustomerConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
              >
                <ShieldCheck size={14} />
                客户确认
              </button>
            )}
            {quote.status === 'customer_confirmed' && !quote.convertedOrderId && (
              <button
                onClick={handleConvert}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                转为订单
              </button>
            )}
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
            >
              <Download size={14} />
              导出
            </button>
            {quote.status === 'draft' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} />
                删除
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-moto-silver text-sm font-bold">客户信息</h3>
                {editMode ? (
                  <button
                    onClick={handleSaveEdit}
                    disabled={submitting}
                    className="text-xs text-moto-orange hover:underline disabled:opacity-50"
                  >
                    保存
                  </button>
                ) : null}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">客户名称</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm px-3 py-2 rounded-lg border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    />
                  ) : (
                    <p className="text-moto-silver text-sm flex items-center gap-2">
                      <User size={12} className="text-moto-steel" />
                      {quote.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">联系人</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editForm.customerContact}
                      onChange={(e) => setEditForm({ ...editForm, customerContact: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm px-3 py-2 rounded-lg border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    />
                  ) : (
                    <p className="text-moto-silver text-sm">{quote.customerContact}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">联系电话</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full bg-carbon-700 text-moto-silver text-sm px-3 py-2 rounded-lg border border-carbon-500/30 focus:outline-none focus:border-moto-orange/50"
                    />
                  ) : (
                    <p className="text-moto-silver text-sm flex items-center gap-2">
                      <Phone size={12} className="text-moto-steel" />
                      {quote.customerPhone}
                    </p>
                  )}
                </div>
                {quote.customerEmail && !editMode && (
                  <div>
                    <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">邮箱</label>
                    <p className="text-moto-silver text-sm flex items-center gap-2">
                      <Mail size={12} className="text-moto-steel" />
                      {quote.customerEmail}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
              <h3 className="font-orbitron text-moto-silver text-sm font-bold mb-4">车型信息</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-moto-orange" />
                  <span className="text-moto-silver text-sm">{quote.modelName}</span>
                </div>
                {quote.packageName && (
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-moto-steel" />
                    <span className="text-moto-steel text-sm">{quote.packageName}</span>
                  </div>
                )}
                {quote.validUntil && (
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-moto-steel" />
                    <span className="text-moto-steel text-sm">有效期至 {new Date(quote.validUntil).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>

            {activePlan && (
              <div className="bg-carbon-800 rounded-xl border border-moto-orange/30 p-5">
                <h3 className="font-orbitron text-moto-orange text-sm font-bold mb-4 flex items-center gap-2">
                  <DollarSign size={14} />
                  报价合计
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-moto-steel">配件小计</span>
                    <span className="text-moto-silver font-orbitron">¥{activePlan.partsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-moto-steel">工费合计</span>
                    <span className="text-moto-silver font-orbitron">¥{activePlan.laborFeeTotal.toLocaleString()}</span>
                  </div>
                  {activePlan.discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">优惠减免</span>
                      <span className="text-green-400 font-orbitron">-¥{activePlan.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {activePlan.appliedDiscountRules && activePlan.appliedDiscountRules.length > 0 && (
                    <div className="pl-3 space-y-0.5 py-1 border-l-2 border-emerald-500/30">
                      {activePlan.appliedDiscountRules.map((r: any) => (
                        <div key={r.ruleId} className="flex justify-between text-[11px]">
                          <span className="text-moto-steel">{r.description}</span>
                          <span className="text-emerald-400">-¥{r.appliedAmount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-carbon-500/30 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-moto-silver font-medium">总计</span>
                      <span className="text-moto-orange text-xl font-orbitron font-bold">¥{activePlan.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {quote.remark && !editMode && (
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
                <h3 className="font-orbitron text-moto-silver text-sm font-bold mb-2">备注</h3>
                <p className="text-moto-steel text-sm">{quote.remark}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
              <div className="flex border-b border-carbon-500/20">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'text-moto-orange border-moto-orange bg-moto-orange/5'
                        : 'text-moto-steel border-transparent hover:text-moto-silver hover:bg-carbon-700/50'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === 'plans' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-orbitron text-moto-silver text-sm font-bold flex items-center gap-2">
                        <Layers size={14} />
                        方案列表（{quote.plans.length}）
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddPlan}
                          disabled={submitting || quote.status !== 'draft'}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-xs hover:bg-moto-orange/20 transition-colors disabled:opacity-50"
                        >
                          <Plus size={12} />
                          新增方案
                        </button>
                        {quote.plans.length >= 2 && (
                          <button
                            onClick={() => {
                              setComparePlanA(quote.plans[0]?.id || '')
                              setComparePlanB(quote.plans[1]?.id || '')
                              setShowComparison(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-700 text-moto-steel rounded-lg text-xs hover:bg-carbon-600 hover:text-moto-silver transition-colors"
                          >
                            <ArrowLeftRight size={12} />
                            方案比价
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {quote.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`rounded-xl border p-4 transition-all ${
                            plan.id === quote.activePlanId
                              ? 'border-moto-orange/50 bg-moto-orange/5'
                              : 'border-carbon-500/20 bg-carbon-700/30 hover:border-carbon-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {plan.id === quote.activePlanId ? (
                                <Star size={16} className="text-moto-orange fill-moto-orange shrink-0 mt-0.5" />
                              ) : (
                                <Layers size={16} className="text-carbon-500 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-orbitron text-moto-silver text-sm font-medium">{plan.name}</h5>
                                  {plan.isDefault && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-moto-orange/20 text-moto-orange">默认</span>
                                  )}
                                  {plan.id === quote.activePlanId && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">当前方案</span>
                                  )}
                                </div>
                                {plan.description && (
                                  <p className="text-moto-steel text-xs mb-2">{plan.description}</p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  <span className="text-moto-steel">
                                    <Package size={10} className="inline mr-1" />
                                    {plan.items.length} 项配件
                                  </span>
                                  <span className="text-moto-steel">
                                    配件 ¥{plan.partsTotal.toLocaleString()}
                                  </span>
                                  <span className="text-moto-steel">
                                    工费 ¥{plan.laborFeeTotal.toLocaleString()}
                                  </span>
                                  <span className="text-moto-orange font-orbitron font-medium">
                                    合计 ¥{plan.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                                {plan.appliedDiscountRules && plan.appliedDiscountRules.length > 0 && (
                                  <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Percent size={12} className="text-emerald-400" />
                                      <span className="text-[11px] font-orbitron text-emerald-400 uppercase tracking-wider">已应用折扣规则</span>
                                    </div>
                                    <div className="space-y-1">
                                      {plan.appliedDiscountRules.map((r: any) => (
                                        <div key={r.ruleId} className="flex items-center justify-between text-xs">
                                          <span className="text-moto-silver">
                                            {r.description}
                                            <span className="mx-1.5 text-carbon-500">·</span>
                                            <span className="text-moto-steel">{r.ruleName}</span>
                                          </span>
                                          <span className="text-emerald-400 font-orbitron">-¥{r.appliedAmount.toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              {quote.status === 'draft' && discountRules.length > 0 && (
                                <button
                                  onClick={() => handleApplyDiscount(plan.id)}
                                  disabled={submitting}
                                  className="p-1.5 text-moto-steel hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                  title={`应用折扣规则（共 ${discountRules.length} 条启用）`}
                                >
                                  <Percent size={14} />
                                </button>
                              )}
                              {plan.id !== quote.activePlanId && quote.status === 'draft' && (
                                <button
                                  onClick={() => handleSetActivePlan(plan.id)}
                                  className="p-1.5 text-moto-steel hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                  title="设为当前方案"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}
                              {quote.plans.length > 1 && quote.status === 'draft' && (
                                <button
                                  onClick={() => handleDeletePlan(plan.id)}
                                  className="p-1.5 text-moto-steel hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="删除方案"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {plan.id === quote.activePlanId && (
                            <div className="mt-4 pt-4 border-t border-carbon-500/20">
                              {Object.entries(groupedItems).map(([categoryId, items]) => (
                                <div key={categoryId} className="mb-4 last:mb-0">
                                  <h6 className="text-xs text-moto-orange font-orbitron font-medium mb-2">
                                    {items[0]?.categoryName || categoryId}
                                  </h6>
                                  <div className="space-y-1">
                                    {items.map((item) => (
                                      <div
                                        key={item.partId}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-carbon-700/30"
                                      >
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={item.partImage}
                                            alt={item.partName}
                                            className="w-10 h-10 object-cover rounded-lg bg-carbon-600"
                                          />
                                          <div>
                                            <p className="text-moto-silver text-sm">{item.partName}</p>
                                            <p className="text-moto-steel text-[10px]">{item.partBrand} × {item.quantity}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {item.discountRate > 0 && (
                                            <p className="text-[10px] text-green-400 line-through">¥{item.originalPrice.toLocaleString()}</p>
                                          )}
                                          <p className="text-moto-orange font-orbitron text-sm">¥{item.subtotal.toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'approval' && (
                  <ApprovalFlowPanel
                    flow={quote.approvalFlow}
                    quoteStatus={quote.status}
                    onSubmit={handleSubmitApproval}
                    onApprove={(nodeId, comment) => handleApprovalAction(nodeId, 'approve', comment)}
                    onReject={(nodeId, comment) => handleApprovalAction(nodeId, 'reject', comment)}
                    onReturn={(nodeId, comment) => handleApprovalAction(nodeId, 'return', comment)}
                  />
                )}

                {activeTab === 'customer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-orbitron text-moto-silver text-sm font-bold">客户确认留痕</h4>
                      {(quote.status === 'sent_to_customer' || quote.status === 'customer_confirmed' || quote.status === 'customer_rejected') && (
                        <button
                          onClick={() => setShowCustomerConfirm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-xs hover:bg-moto-orange/20 transition-colors"
                        >
                          <ShieldCheck size={12} />
                          {quote.customerConfirmation ? '查看/修改' : '录入确认'}
                        </button>
                      )}
                    </div>
                    {quote.customerConfirmation ? (
                      <div className={`rounded-xl p-5 border ${
                        quote.status === 'customer_confirmed'
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          {quote.status === 'customer_confirmed' ? (
                            <div className="p-2 rounded-full bg-emerald-500/20">
                              <CheckCircle2 size={20} className="text-emerald-400" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-rose-500/20">
                              <XCircle size={20} className="text-rose-400" />
                            </div>
                          )}
                          <div>
                            <p className={`font-orbitron font-bold ${
                              quote.status === 'customer_confirmed' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {quote.status === 'customer_confirmed' ? '客户已确认' : '客户已拒绝'}
                            </p>
                            <p className="text-moto-steel text-xs">
                              {new Date(quote.customerConfirmation.confirmedAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">确认人</label>
                            <p className="text-moto-silver">{quote.customerConfirmation.confirmedBy}</p>
                          </div>
                          <div>
                            <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">联系方式</label>
                            <p className="text-moto-silver">{quote.customerConfirmation.contactInfo}</p>
                          </div>
                          {quote.customerConfirmation.selectedPlanId && (
                            <div className="col-span-2">
                              <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">选定方案</label>
                              <p className="text-moto-orange">
                                {quote.plans.find((p) => p.id === quote.customerConfirmation?.selectedPlanId)?.name || '-'}
                              </p>
                            </div>
                          )}
                          {quote.customerConfirmation.note && (
                            <div className="col-span-2">
                              <label className="text-[10px] text-moto-steel uppercase tracking-wider mb-1 block">客户留言</label>
                              <p className="text-moto-silver bg-carbon-700/50 rounded-lg p-3">{quote.customerConfirmation.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <User size={48} className="text-carbon-500 mx-auto mb-4" />
                        <p className="text-moto-silver mb-1">暂无客户确认记录</p>
                        <p className="text-moto-steel text-sm">报价单发送给客户后可在此录入确认信息</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-orbitron text-moto-silver text-sm font-bold">导出与打印</h4>
                      <button
                        onClick={() => setShowExport(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20"
                      >
                        <Download size={14} />
                        立即导出
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={submitting}
                        className="p-4 rounded-xl border border-carbon-500/20 bg-carbon-700/30 hover:bg-carbon-700/50 hover:border-red-500/30 transition-all text-left group"
                      >
                        <div className="p-2.5 w-fit rounded-lg bg-red-500/10 text-red-400 mb-3 group-hover:bg-red-500/20 transition-colors">
                          <FileText size={20} />
                        </div>
                        <p className="text-moto-silver text-sm font-medium">导出 PDF</p>
                        <p className="text-moto-steel text-xs mt-1">适合发送给客户审阅</p>
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        disabled={submitting}
                        className="p-4 rounded-xl border border-carbon-500/20 bg-carbon-700/30 hover:bg-carbon-700/50 hover:border-green-500/30 transition-all text-left group"
                      >
                        <div className="p-2.5 w-fit rounded-lg bg-green-500/10 text-green-400 mb-3 group-hover:bg-green-500/20 transition-colors">
                          <FileSpreadsheet size={20} />
                        </div>
                        <p className="text-moto-silver text-sm font-medium">导出 Excel</p>
                        <p className="text-moto-steel text-xs mt-1">适合财务统计核算</p>
                      </button>
                      <button
                        onClick={() => handleExport('print')}
                        disabled={submitting}
                        className="p-4 rounded-xl border border-carbon-500/20 bg-carbon-700/30 hover:bg-carbon-700/50 hover:border-moto-orange/30 transition-all text-left group"
                      >
                        <div className="p-2.5 w-fit rounded-lg bg-moto-orange/10 text-moto-orange mb-3 group-hover:bg-moto-orange/20 transition-colors">
                          <Printer size={20} />
                        </div>
                        <p className="text-moto-silver text-sm font-medium">打印报价单</p>
                        <p className="text-moto-steel text-xs mt-1">适合纸质签字存档</p>
                      </button>
                    </div>

                    <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5">
                      <h5 className="font-orbitron text-moto-silver text-sm font-bold mb-4 flex items-center gap-2">
                        <Clock size={14} />
                        导出历史
                      </h5>
                      {quote.exportRecords.length === 0 ? (
                        <p className="text-moto-steel text-sm text-center py-6">暂无导出记录</p>
                      ) : (
                        <div className="space-y-2">
                          {[...quote.exportRecords].reverse().map((record) => (
                            <div key={record.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-carbon-700/30">
                              <div className="flex items-center gap-3">
                                {record.format === 'pdf' && <FileText size={14} className="text-red-400" />}
                                {record.format === 'excel' && <FileSpreadsheet size={14} className="text-green-400" />}
                                {record.format === 'print' && <Printer size={14} className="text-moto-orange" />}
                                <span className="text-moto-silver text-sm capitalize">{record.format}</span>
                                <span className="text-moto-steel text-xs">版本 v{record.version}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-moto-silver text-xs">{record.exportedBy}</p>
                                <p className="text-moto-steel text-[10px]">
                                  {new Date(record.exportedAt).toLocaleString('zh-CN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showComparison && (
        <PlanComparison
          plans={quote.plans}
          planAId={comparePlanA}
          planBId={comparePlanB}
          comparison={planComparison}
          onPlanASelect={setComparePlanA}
          onPlanBSelect={setComparePlanB}
          onCompare={() => compareQuotePlans(quote.id, comparePlanA, comparePlanB)}
          onClose={() => {
            setShowComparison(false)
            setPlanComparison(null)
          }}
        />
      )}

      {showExport && activePlan && (
        <QuoteExportPanel
          quote={quote}
          selectedPlan={activePlan}
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}

      {showCustomerConfirm && (
        <CustomerConfirmationPanel
          quote={quote}
          onConfirm={handleCustomerConfirm}
          onReject={handleCustomerReject}
          onClose={() => setShowCustomerConfirm(false)}
        />
      )}
    </div>
  )
}
