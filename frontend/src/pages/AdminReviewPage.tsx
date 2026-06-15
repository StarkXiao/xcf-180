import React, { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import {
  PartReview,
  PartIssue,
  PartWarning,
  ReviewStatus,
  IssueStatus,
  IssuePriority,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_COLORS,
  WARNING_LEVEL_LABELS,
  WARNING_LEVEL_COLORS,
  ISSUE_CATEGORY_LABELS,
} from '@/types'
import PartWarningPanel from '@/components/PartWarningPanel'

type TabType = 'reviews' | 'issues' | 'warnings'

const AdminReviewPage: React.FC = () => {
  const {
    adminReviews,
    adminReviewsLoading,
    adminReviewsTotal,
    issues,
    issuesLoading,
    issuesTotal,
    warnings,
    warningsLoading,
    warningsSummary,
    fetchAdminReviews,
    processReview,
    fetchIssues,
    updateIssueStatus,
    fetchWarnings,
    acknowledgeWarning,
    deleteWarning,
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('reviews')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all')
  const [selectedReview, setSelectedReview] = useState<PartReview | null>(null)
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [processStatus, setProcessStatus] = useState<ReviewStatus>('approved')
  const [processResponse, setProcessResponse] = useState('')

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchAdminReviews({ page, pageSize, status: statusFilter === 'all' ? undefined : statusFilter })
    } else if (activeTab === 'issues') {
      fetchIssues({ page, pageSize })
    } else if (activeTab === 'warnings') {
      fetchWarnings()
    }
  }, [activeTab, page, statusFilter, pageSize, fetchAdminReviews, fetchIssues, fetchWarnings])

  const renderStars = (rating: number, max: number = 5) => (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-600'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  const handleProcessReview = async () => {
    if (!selectedReview) return
    await processReview(selectedReview.id, {
      status: processStatus,
      response: processResponse || undefined,
      processedBy: '管理员',
    })
    setProcessModalOpen(false)
    setSelectedReview(null)
    setProcessResponse('')
  }

  const handleUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus) => {
    await updateIssueStatus(issueId, {
      status: newStatus,
      comment: `状态更新为${newStatus}`,
      updatedBy: '管理员',
    })
  }

  const handleAcknowledgeWarning = async (warningId: string) => {
    await acknowledgeWarning(warningId, { acknowledgedBy: '管理员' })
  }

  const handleDismissWarning = async (warningId: string) => {
    await deleteWarning(warningId)
  }

  const totalPages = Math.ceil(adminReviewsTotal / pageSize)
  const totalIssuePages = Math.ceil(issuesTotal / pageSize)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">评价管理</h1>

        <div className="bg-white dark:bg-zinc-900 rounded-xl mb-6">
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {[
              { key: 'reviews', label: '评价审核', count: adminReviewsTotal },
              { key: 'issues', label: '问题追踪', count: issuesTotal },
              { key: 'warnings', label: '预警处理', count: warningsSummary?.unacknowledged || 0 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as TabType)
                  setPage(1)
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    tab.key === 'warnings' && warningsSummary?.unacknowledged
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'reviews' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">状态筛选：</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any)
                      setPage(1)
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                  </select>
                </div>
              </div>

              {adminReviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : adminReviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 dark:text-zinc-400">暂无评价数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">用户</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">配件</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">评分</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">内容</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">状态</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">时间</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReviews.map((review) => (
                        <tr key={review.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                {review.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-zinc-900 dark:text-white">{review.username}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-zinc-900 dark:text-white">{review.partName}</td>
                          <td className="py-4 px-4">{renderStars(review.overallRating)}</td>
                          <td className="py-4 px-4 max-w-xs">
                            <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">{review.title}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{review.content}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${REVIEW_STATUS_COLORS[review.status]}`}>
                              {REVIEW_STATUS_LABELS[review.status]}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="py-4 px-4">
                            {review.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedReview(review)
                                    setProcessStatus('approved')
                                    setProcessModalOpen(true)
                                  }}
                                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                  通过
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReview(review)
                                    setProcessStatus('rejected')
                                    setProcessModalOpen(true)
                                  }}
                                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                  拒绝
                                </button>
                              </div>
                            )}
                            {review.status === 'approved' && review.overallRating <= 2 && (
                              <span className="text-xs text-orange-600 dark:text-orange-400">已生成工单</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    第 {page} / {totalPages} 页，共 {adminReviewsTotal} 条
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="p-6">
              {issuesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">暂无问题工单</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">当前没有需要处理的问题</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div key={issue.id} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${ISSUE_PRIORITY_COLORS[issue.priority]}`}>
                              {ISSUE_PRIORITY_LABELS[issue.priority]}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${ISSUE_STATUS_COLORS[issue.status]}`}>
                              {ISSUE_STATUS_LABELS[issue.status]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs">
                              {ISSUE_CATEGORY_LABELS[issue.category] || issue.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-zinc-900 dark:text-white">{issue.title}</h4>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">{issue.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">配件：</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{issue.partName}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">用户：</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{issue.username}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">评分：</span>
                          {renderStars(issue.rating || 0)}
                        </div>
                        {issue.assignedTo && (
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-400">处理人：</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{issue.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      {issue.processHistory && issue.processHistory.length > 0 && (
                        <div className="mb-4 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">处理记录</div>
                          <div className="space-y-2">
                            {issue.processHistory.map((record, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  {new Date(record.createdAt).toLocaleString('zh-CN')} - {record.createdBy}：
                                </span>
                                <span className="text-zinc-700 dark:text-zinc-300 ml-1">{record.comment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {issue.status !== 'closed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">更新状态：</span>
                          {issue.status === 'open' && (
                            <button
                              onClick={() => handleUpdateIssueStatus(issue.id, 'investigating')}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              开始调查
                            </button>
                          )}
                          {issue.status === 'investigating' && (
                            <button
                              onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              标记已解决
                            </button>
                          )}
                          {issue.status === 'resolved' && (
                            <button
                              onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                              className="px-3 py-1 text-xs bg-zinc-500 text-white rounded hover:bg-zinc-600 transition-colors"
                            >
                              关闭工单
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                            className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                          >
                            直接关闭
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {totalIssuePages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    第 {page} / {totalIssuePages} 页，共 {issuesTotal} 条
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalIssuePages}
                    className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="p-6">
              {warningsSummary && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-xs text-red-600 dark:text-red-400 mb-1">严重预警</div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{warningsSummary.danger}</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">警告</div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{warningsSummary.warning}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">活跃预警</div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{warningsSummary.active}</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">待确认</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{warningsSummary.unacknowledged}</div>
                  </div>
                </div>
              )}

              <PartWarningPanel
                warnings={warnings}
                loading={warningsLoading}
                onAcknowledge={handleAcknowledgeWarning}
                onDismiss={handleDismissWarning}
              />
            </div>
          )}
        </div>
      </div>

      {processModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              {processStatus === 'approved' ? '通过评价' : '拒绝评价'}
            </h3>

            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-zinc-900 dark:text-white">{selectedReview.username}</span>
                {renderStars(selectedReview.overallRating)}
              </div>
              <div className="font-medium text-zinc-900 dark:text-white mb-1">{selectedReview.title}</div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedReview.content}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {processStatus === 'approved' ? '回复内容（可选）' : '拒绝原因'}
              </label>
              <textarea
                value={processResponse}
                onChange={(e) => setProcessResponse(e.target.value)}
                placeholder={processStatus === 'approved' ? '输入回复内容...' : '请输入拒绝原因...'}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {processStatus === 'approved' && selectedReview.overallRating <= 2 && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  这是一条差评（{selectedReview.overallRating}星），通过后将自动创建问题工单。
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setProcessModalOpen(false)
                  setSelectedReview(null)
                  setProcessResponse('')
                }}
                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleProcessReview}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  processStatus === 'approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                确认{processStatus === 'approved' ? '通过' : '拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReviewPage
