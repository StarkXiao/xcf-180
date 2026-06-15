import React, { useState } from 'react'
import { CreatePartReviewRequest, ReviewRating, FitRating, InstallationFeedback, DIFFICULTY_LABELS } from '@/types'

interface PartReviewFormProps {
  partId: string
  partName: string
  onSubmit: (data: CreatePartReviewRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const PartReviewForm: React.FC<PartReviewFormProps> = ({ partId, partName, onSubmit, onCancel, loading }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [overallRating, setOverallRating] = useState<ReviewRating>(5)
  const [fitRating, setFitRating] = useState<FitRating>({
    overall: 5,
    dimensions: 5,
    quality: 5,
    compatibility: 5,
    durability: 5,
  })
  const [showInstallationFeedback, setShowInstallationFeedback] = useState(false)
  const [installationFeedback, setInstallationFeedback] = useState<InstallationFeedback>({
    difficulty: 'moderate',
    installTime: '',
    toolsRequired: [],
    tips: '',
    issuesEncountered: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [bikeModel, setBikeModel] = useState('')
  const [mileage, setMileage] = useState('')
  const [usageMonths, setUsageMonths] = useState('')

  const renderStarInput = (value: ReviewRating, onChange: (v: ReviewRating) => void, label: string) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400 w-20">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star as ReviewRating)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <svg
              className={`w-6 h-6 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-yellow-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      return
    }

    const data: CreatePartReviewRequest = {
      partId,
      title: title.trim(),
      content: content.trim(),
      overallRating,
      fitRating,
      tags,
      bikeModel: bikeModel || undefined,
      mileage: mileage ? parseInt(mileage) : undefined,
      usageMonths: usageMonths ? parseInt(usageMonths) : undefined,
    }

    if (showInstallationFeedback && installationFeedback.installTime) {
      data.installationFeedback = {
        ...installationFeedback,
        toolsRequired: installationFeedback.toolsRequired.filter((t) => t.trim()),
      }
    }

    await onSubmit(data)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">发表评价</h3>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        评价配件：<span className="font-medium text-zinc-700 dark:text-zinc-300">{partName}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">综合评分</label>
          {renderStarInput(overallRating, setOverallRating, '总体评价')}
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">适配评分</label>
          {renderStarInput(fitRating.overall, (v) => setFitRating({ ...fitRating, overall: v }), '整体适配')}
          {renderStarInput(fitRating.dimensions, (v) => setFitRating({ ...fitRating, dimensions: v }), '尺寸精度')}
          {renderStarInput(fitRating.quality, (v) => setFitRating({ ...fitRating, quality: v }), '品质工艺')}
          {renderStarInput(fitRating.compatibility, (v) => setFitRating({ ...fitRating, compatibility: v }), '兼容匹配')}
          {renderStarInput(fitRating.durability, (v) => setFitRating({ ...fitRating, durability: v }), '耐用性能')}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">评价标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入评价标题..."
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">评价内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请详细描述您的使用体验、安装感受等..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 text-right">{content.length}/1000</div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowInstallationFeedback(!showInstallationFeedback)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showInstallationFeedback ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
            {showInstallationFeedback ? '收起安装反馈' : '添加安装反馈'}
          </button>

          {showInstallationFeedback && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">安装难度</label>
                <div className="flex gap-2">
                  {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setInstallationFeedback({ ...installationFeedback, difficulty: key as any })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        installationFeedback.difficulty === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">安装时间</label>
                <input
                  type="text"
                  value={installationFeedback.installTime}
                  onChange={(e) => setInstallationFeedback({ ...installationFeedback, installTime: e.target.value })}
                  placeholder="例如：2小时"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">所需工具（用逗号分隔）</label>
                <input
                  type="text"
                  value={installationFeedback.toolsRequired.join(', ')}
                  onChange={(e) => setInstallationFeedback({ ...installationFeedback, toolsRequired: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  placeholder="例如：套筒扳手, 扭矩扳手, 橡胶锤"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">安装技巧</label>
                <textarea
                  value={installationFeedback.tips}
                  onChange={(e) => setInstallationFeedback({ ...installationFeedback, tips: e.target.value })}
                  placeholder="分享您的安装经验和技巧..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">遇到的问题</label>
                <textarea
                  value={installationFeedback.issuesEncountered}
                  onChange={(e) => setInstallationFeedback({ ...installationFeedback, issuesEncountered: e.target.value })}
                  placeholder="安装过程中遇到了什么问题？如何解决的？"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">标签（最多5个）</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="输入标签后按回车添加..."
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={tags.length >= 5}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={tags.length >= 5}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">车型</label>
            <input
              type="text"
              value={bikeModel}
              onChange={(e) => setBikeModel(e.target.value)}
              placeholder="例如：XCF-180R"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">行驶里程（km）</label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="例如：5000"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">使用时长（月）</label>
            <input
              type="number"
              value={usageMonths}
              onChange={(e) => setUsageMonths(e.target.value)}
              placeholder="例如：3"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                提交中...
              </>
            ) : (
              '提交评价'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PartReviewForm
