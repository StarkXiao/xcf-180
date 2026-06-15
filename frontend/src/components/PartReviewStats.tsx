import React from 'react'
import { ReviewStats, DIFFICULTY_LABELS } from '@/types'

interface PartReviewStatsProps {
  stats: ReviewStats | null
  loading?: boolean
}

const PartReviewStats: React.FC<PartReviewStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const totalRatings = Object.values(stats.ratingDistribution).reduce((a, b) => a + b, 0)

  const renderStars = (rating: number, max: number = 5) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(max)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-600'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">用户评价</h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {stats.totalReviews} 条评价</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-zinc-900 dark:text-white">{stats.averageRating}</div>
            <div className="mt-2">{renderStars(stats.averageRating)}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">综合评分</div>
          </div>

          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star] || 0
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 w-8">{star}星</span>
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">适配评分</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '整体适配', value: stats.averageFitRating.overall },
              { label: '尺寸精度', value: stats.averageFitRating.dimensions },
              { label: '品质工艺', value: stats.averageFitRating.quality },
              { label: '兼容匹配', value: stats.averageFitRating.compatibility },
              { label: '耐用性能', value: stats.averageFitRating.durability },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  {renderStars(item.value)}
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.installationStats.averageInstallTime !== '0' && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">安装反馈</h4>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">平均安装时间：</span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{stats.installationStats.averageInstallTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">难度分布：</span>
              {Object.entries(stats.installationStats.difficultyDistribution).map(([diff, count]) => (
                <span
                  key={diff}
                  className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  {DIFFICULTY_LABELS[diff] || diff}: {count}人
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.commonTags.length > 0 && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">热门标签</h4>
          <div className="flex flex-wrap gap-2">
            {stats.commonTags.map((item, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              >
                {item.tag} ({item.count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">真实购买评价：</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{stats.verifiedReviewsCount} 条</span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">商家回复率：</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{stats.responseRate}%</span>
        </div>
      </div>
    </div>
  )
}

export default PartReviewStats
