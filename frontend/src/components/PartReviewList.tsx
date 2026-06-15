import React, { useState } from 'react'
import { PartReview, DIFFICULTY_LABELS, REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS } from '@/types'
import { useStore } from '@/store/useStore'

interface PartReviewListProps {
  reviews: PartReview[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  sortBy?: string
  onSortChange?: (sort: string) => void
}

const PartReviewList: React.FC<PartReviewListProps> = ({
  reviews,
  loading,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  sortBy = 'createdAt',
  onSortChange,
}) => {
  const { markReviewHelpful } = useStore()
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  const renderStars = (rating: number, max: number = 5) => {
    return (
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
  }

  const handleHelpful = async (reviewId: string) => {
    await markReviewHelpful(reviewId)
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
                <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">评价列表</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">排序：</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">最新发布</option>
            <option value="helpful">最有帮助</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-zinc-500 dark:text-zinc-400">暂无评价，快来发表第一条评价吧！</p>
        </div>
      ) : (
        <>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {review.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-zinc-900 dark:text-white">{review.username}</span>
                    {review.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        真实购买
                      </span>
                    )}
                    {review.status !== 'approved' && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${REVIEW_STATUS_COLORS[review.status]}`}>
                        {REVIEW_STATUS_LABELS[review.status]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.overallRating)}
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    {review.bikeModel && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        车型：{review.bikeModel}
                      </span>
                    )}
                  </div>

                  {review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {review.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-zinc-900 dark:text-white mb-2">{review.title}</h4>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{review.content}</p>
              </div>

              {review.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                        图片 {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {review.installationFeedback && (
                <div>
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedReview === review.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                    {expandedReview === review.id ? '收起安装反馈' : '查看安装反馈'}
                  </button>

                  {expandedReview === review.id && (
                    <div className="mt-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">安装难度：</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {DIFFICULTY_LABELS[review.installationFeedback.difficulty] || review.installationFeedback.difficulty}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">安装时间：</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{review.installationFeedback.installTime}</span>
                        </div>
                      </div>
                      {review.installationFeedback.toolsRequired.length > 0 && (
                        <div>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">所需工具：</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {review.installationFeedback.toolsRequired.map((tool, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {review.installationFeedback.tips && (
                        <div>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">安装技巧：</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{review.installationFeedback.tips}</p>
                        </div>
                      )}
                      {review.installationFeedback.issuesEncountered && (
                        <div>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">遇到的问题：</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{review.installationFeedback.issuesEncountered}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {review.fitRating && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {[
                      { label: '整体适配', value: review.fitRating.overall },
                      { label: '尺寸精度', value: review.fitRating.dimensions },
                      { label: '品质工艺', value: review.fitRating.quality },
                      { label: '兼容匹配', value: review.fitRating.compatibility },
                      { label: '耐用性能', value: review.fitRating.durability },
                    ].map((item, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-zinc-500 dark:text-zinc-400 mb-1">{item.label}</div>
                        {renderStars(item.value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(review.mileage || review.usageMonths) && (
                <div className="flex gap-6 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  {review.mileage && <span>行驶里程：{review.mileage.toLocaleString()} km</span>}
                  {review.usageMonths && <span>使用时长：{review.usageMonths} 个月</span>}
                </div>
              )}

              {review.response && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">商家回复</span>
                    {review.respondedBy && (
                      <span className="text-xs text-blue-600 dark:text-blue-500">{review.respondedBy}</span>
                    )}
                    {review.respondedAt && (
                      <span className="text-xs text-blue-500 dark:text-blue-400/70">
                        {new Date(review.respondedAt).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{review.response}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  有帮助 ({review.helpfulCount})
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PartReviewList
