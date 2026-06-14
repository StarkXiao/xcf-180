import { useState } from 'react'
import { FileDown, Printer, FileSpreadsheet, FileText, X, Calendar, User, Phone, MessageSquare } from 'lucide-react'
import type { Quote, QuotePlan } from '@/types'

interface Props {
  quote: Quote
  selectedPlan?: QuotePlan
  onExport: (format: 'pdf' | 'excel' | 'print') => void
  onClose: () => void
}

const digitToChinese = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const unitSection = ['', '拾', '佰', '仟']
const unitBig = ['', '万', '亿', '兆']

function numberToChinese(num: number): string {
  if (num === 0) return '零元整'
  if (isNaN(num) || !isFinite(num)) return ''
  const negative = num < 0
  num = Math.abs(num)
  const yuan = Math.floor(num)
  const jiao = Math.floor((num - yuan) * 10)
  const fen = Math.floor((num - yuan) * 100) % 10

  const convertInteger = (n: number): string => {
    if (n === 0) return '零'
    let result = ''
    let zeroFlag = false
    const str = n.toString()
    const len = str.length
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str[i])
      const pos = len - 1 - i
      const sectionPos = Math.floor(pos / 4)
      const unitPos = pos % 4
      if (digit === 0) {
        zeroFlag = true
      } else {
        if (zeroFlag) {
          result += '零'
          zeroFlag = false
        }
        result += digitToChinese[digit] + unitSection[unitPos]
      }
      if (unitPos === 0 && sectionPos > 0) {
        if (!zeroFlag || result.slice(-1) !== unitBig[sectionPos]) {
          result += unitBig[sectionPos]
        }
        zeroFlag = false
      }
    }
    return result
  }

  let result = negative ? '负' : ''
  result += convertInteger(yuan) + '元'

  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) {
      result += digitToChinese[jiao] + '角'
    } else if (yuan > 0) {
      result += '零'
    }
    if (fen > 0) {
      result += digitToChinese[fen] + '分'
    }
  }
  return result
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatLabels: Record<'pdf' | 'excel' | 'print', string> = {
  pdf: 'PDF',
  excel: 'Excel',
  print: '打印',
}

export default function QuoteExportPanel({ quote, selectedPlan, onExport, onClose }: Props) {
  const [currentPlanId, setCurrentPlanId] = useState<string>(selectedPlan?.id ?? quote.activePlanId ?? quote.plans[0]?.id ?? '')

  const currentPlan = quote.plans.find((p) => p.id === currentPlanId) ?? quote.plans[0]

  const groupedItems = currentPlan?.items.reduce<Record<string, typeof currentPlan.items>>((acc, item) => {
    if (!acc[item.categoryId]) acc[item.categoryId] = []
    acc[item.categoryId].push(item)
    return acc
  }, {}) ?? {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-carbon-900 rounded-2xl border border-carbon-500/30 w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
        <div className="sticky top-0 z-20 bg-carbon-900 border-b border-carbon-500/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="text-moto-orange" size={22} />
            <h2 className="font-orbitron text-lg text-moto-silver">导出报价单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-moto-steel hover:text-white hover:bg-carbon-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {quote.plans.length > 1 && (
          <div className="px-6 py-3 bg-carbon-800/50 border-b border-carbon-500/20 flex items-center gap-3 shrink-0">
            <span className="text-xs text-moto-steel">选择方案：</span>
            <select
              value={currentPlanId}
              onChange={(e) => setCurrentPlanId(e.target.value)}
              className="px-3 py-1.5 bg-carbon-700 border border-carbon-500/30 rounded-lg text-sm text-moto-silver focus:outline-none focus:ring-1 focus:ring-moto-orange focus:border-moto-orange transition-colors"
            >
              {quote.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '(默认)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white rounded-xl p-8 text-gray-900 shadow-inner">
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h1 className="font-orbitron text-2xl font-bold text-gray-900 tracking-wider">
                XCF-180 摩托车改装报价单
              </h1>
              <p className="text-sm text-gray-500 mt-2">MOTORCYCLE CUSTOMIZATION QUOTATION</p>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-8 mb-6 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 shrink-0 w-16">报价单号：</span>
                <span className="font-medium text-gray-900">{quote.quoteNo}</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-500 shrink-0">日期：</span>
                <span className="font-medium text-gray-900">{formatDate(quote.createdAt)}</span>
              </div>
              <div className="flex items-start gap-2">
                <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-500 shrink-0 w-16">客户名称：</span>
                <span className="font-medium text-gray-900">{quote.customerName}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 shrink-0">联 系 人：</span>
                <span className="font-medium text-gray-900">{quote.customerContact}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-500 shrink-0 w-16">联系电话：</span>
                <span className="font-medium text-gray-900">{quote.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-500 shrink-0">有效期至：</span>
                <span className="font-medium text-gray-900">{formatDate(quote.validUntil)}</span>
              </div>
              <div className="col-span-2 flex items-start gap-2">
                <span className="text-gray-500 shrink-0 w-16">车型：</span>
                <span className="font-medium text-gray-900">
                  {quote.modelName}
                  {quote.packageName && ` (${quote.packageName})`}
                </span>
              </div>
              {currentPlan && quote.plans.length > 1 && (
                <div className="col-span-2 flex items-start gap-2">
                  <span className="text-gray-500 shrink-0 w-16">方案：</span>
                  <span className="font-medium text-gray-900">
                    {currentPlan.name}
                    {currentPlan.description && ` — ${currentPlan.description}`}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-12">序号</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-24">分类</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold">配件名称</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-20">品牌</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-20">规格数量</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-20">原价</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-20">单价</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-16">折扣</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold w-24">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([categoryId, items], catIdx) => {
                    const categorySubtotal = items.reduce((s, it) => s + it.subtotal, 0)
                    const categoryName = items[0]?.categoryName ?? '未分类'
                    return (
                      <>
                        {items.map((item, idx) => {
                          const globalIdx = Object.values(groupedItems)
                            .slice(0, catIdx)
                            .reduce((s, arr) => s + arr.length, 0) + idx + 1
                          const isFirstInCategory = idx === 0
                          return (
                            <tr key={item.partId}>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                                {globalIdx}
                              </td>
                              {isFirstInCategory ? (
                                <td
                                  className="border border-gray-300 px-2 py-2 text-center font-medium text-gray-800 bg-gray-50"
                                  rowSpan={items.length}
                                >
                                  {categoryName}
                                </td>
                              ) : null}
                              <td className="border border-gray-300 px-2 py-2 text-gray-800">{item.partName}</td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-700">{item.partBrand}</td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-700">×{item.quantity}</td>
                              <td className="border border-gray-300 px-2 py-2 text-right text-gray-600">
                                ¥{item.originalPrice.toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-right text-gray-800">
                                ¥{item.unitPrice.toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                                {Math.round(item.discountRate * 100)}%
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-right font-medium text-gray-900">
                                ¥{item.subtotal.toLocaleString()}
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 text-right text-xs text-gray-500 italic" colSpan={8}>
                            {categoryName} 小计
                          </td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right text-sm font-semibold text-gray-800">
                            ¥{categorySubtotal.toLocaleString()}
                          </td>
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">配件小计：</span>
                  <span className="font-medium text-gray-900">¥{currentPlan?.partsTotal.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">工费合计：</span>
                  <span className="font-medium text-gray-900">¥{currentPlan?.laborFeeTotal.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">优惠金额：</span>
                  <span className="font-medium text-green-600">-¥{currentPlan?.discountTotal.toLocaleString() ?? 0}</span>
                </div>
                {currentPlan && (currentPlan.appliedDiscountRules ?? []).length > 0 && (
                  <div className="col-span-2 pl-4 space-y-0.5 py-1 border-l-2 border-green-400/40 text-xs text-green-700">
                    {currentPlan.appliedDiscountRules.map((r: any) => (
                      <div key={r.ruleId} className="flex justify-between">
                        <span>{r.description}</span>
                        <span className="font-medium">-¥{r.appliedAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">报价总计（小写）：</span>
                  <span className="font-orbitron text-xl font-bold text-orange-600">
                    ¥{currentPlan?.totalAmount.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="col-span-2 flex items-start justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">报价总计（大写）：</span>
                  <span className="font-semibold text-gray-900 tracking-wide">
                    {numberToChinese(currentPlan?.totalAmount ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {quote.remark && (
              <div className="mb-6 text-sm">
                <span className="text-gray-500">备注：</span>
                <span className="text-gray-800">{quote.remark}</span>
              </div>
            )}

            {quote.approvalFlow?.history?.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-orbitron font-bold text-sm text-orange-700 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} /> 审批意见留痕
                </div>
                <div className="space-y-2">
                  {quote.approvalFlow.history.map((h: any, i: number) => {
                    const roleMap: Record<string,string> = {sales:'销售',sales_manager:'销售经理',finance:'财务',general_manager:'总经理'}
                    const actMap: Record<string,string> = {approve:'通过',reject:'拒绝',return:'退回'}
                    const actColor = h.action==='approve'?'text-green-600 bg-green-100':h.action==='reject'?'text-red-600 bg-red-100':'text-yellow-700 bg-yellow-100'
                    return (
                      <div key={i} className="bg-white rounded border border-orange-100 p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{h.approverName || '系统'}</span>
                            <span className="text-gray-500 text-xs">· {roleMap[h.role] || h.role}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${actColor}`}>{actMap[h.action] || h.action}</span>
                          </div>
                          <span className="text-[11px] text-gray-500">{h.actedAt ? new Date(h.actedAt).toLocaleString('zh-CN') : '-'}</span>
                        </div>
                        {h.comment && (
                          <div className="mt-2 pl-3 border-l-2 border-orange-300 text-gray-700 text-xs">
                            📝 {h.comment}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
              <div>
                <div className="text-sm text-gray-600 mb-12">审批人签字：</div>
                <div className="border-t border-gray-400 pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>签字：_______________</span>
                  <span>日期：_______________</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-12">客户确认：</div>
                <div className="border-t border-gray-400 pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>签字：_______________</span>
                  <span>日期：_______________</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-400">
              本报价单由 XCF-180 摩托车改装系统自动生成 | 如有疑问请联系销售人员
            </div>
          </div>

          <div className="bg-carbon-800/50 rounded-xl p-5 border border-carbon-500/20">
            <h3 className="font-orbitron text-sm text-moto-silver mb-4">导出记录</h3>
            {quote.exportRecords.length === 0 ? (
              <div className="text-center py-6 text-moto-steel text-sm">
                <FileDown size={28} className="mx-auto text-carbon-500 mb-2" />
                暂无导出记录
              </div>
            ) : (
              <div className="space-y-2">
                {[...quote.exportRecords].reverse().map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between bg-carbon-700/50 rounded-lg px-4 py-3 border border-carbon-500/20"
                  >
                    <div className="flex items-center gap-3">
                      {record.format === 'pdf' ? (
                        <FileText size={16} className="text-red-400" />
                      ) : record.format === 'excel' ? (
                        <FileSpreadsheet size={16} className="text-green-400" />
                      ) : (
                        <Printer size={16} className="text-blue-400" />
                      )}
                      <div>
                        <span className="text-sm text-moto-silver">{record.exportedBy}</span>
                        <span className="text-xs text-moto-steel mx-2">导出了</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          record.format === 'pdf'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : record.format === 'excel'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {formatLabels[record.format]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-moto-steel">
                      <Calendar size={12} />
                      <span>{formatDateTime(record.exportedAt)}</span>
                      <span className="text-carbon-500">|</span>
                      <span>v{record.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-carbon-900 border-t border-carbon-500/20 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
          >
            关闭
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onExport('pdf')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/30 transition-colors font-medium"
            >
              <FileDown size={16} />
              导出 PDF
            </button>
            <button
              onClick={() => onExport('excel')}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-600/30 transition-colors font-medium"
            >
              <FileSpreadsheet size={16} />
              导出 Excel
            </button>
            <button
              onClick={() => onExport('print')}
              className="flex items-center gap-2 px-5 py-2.5 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange-light transition-colors font-orbitron shadow-lg shadow-moto-orange/20"
            >
              <Printer size={16} />
              打印
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
