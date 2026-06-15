import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { VehicleModelProfileSummary, CreateVehicleModelProfileRequest, UpdateVehicleModelProfileRequest } from '@/types'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Filter,
  ChevronDown,
  Car,
  BookOpen,
  AlertTriangle,
  FileText,
  MapPin,
  Image,
  Gauge,
  Shield,
  Scale,
} from 'lucide-react'
import { STREET_LEGAL_STATUS_LABELS, STREET_LEGAL_STATUS_COLORS } from '@/types'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '已启用' },
  { value: 'inactive', label: '已禁用' },
]

export default function AdminVehicleProfilesPage() {
  const navigate = useNavigate()
  const {
    vehicleProfiles,
    vehicleProfilesLoading,
    bikeModels,
    fetchVehicleProfiles,
    createVehicleProfile,
    updateVehicleProfile,
    updateVehicleProfileStatus,
    deleteVehicleProfile,
    setVehicleProfileFilterModelId,
    setVehicleProfileFilterStatus,
    setVehicleProfileSearchKeyword,
    getFilteredVehicleProfiles,
    vehicleProfileFilterModelId,
    vehicleProfileFilterStatus,
    vehicleProfileSearchKeyword,
  } = useStore()

  const [submitting, setSubmitting] = useState(false)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<VehicleModelProfileSummary | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<VehicleModelProfileSummary | null>(null)

  const [formData, setFormData] = useState({
    modelId: '',
    modelName: '',
    modelNameEn: '',
    year: new Date().getFullYear(),
    trimLevel: '',
    basePrice: 0,
    description: '',
    imageUrl: '',
    streetLegalStatus: 'conditional' as 'legal' | 'conditional' | 'off_road_only',
  })

  const [modelFilterOpen, setModelFilterOpen] = useState(false)
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)

  useEffect(() => {
    fetchVehicleProfiles()
  }, [])

  const filteredProfiles = useMemo(() => {
    return getFilteredVehicleProfiles()
  }, [vehicleProfiles, vehicleProfileFilterModelId, vehicleProfileFilterStatus, vehicleProfileSearchKeyword])

  const selectedModel = bikeModels.find((m) => m.id === vehicleProfileFilterModelId)

  const openCreateModal = () => {
    setEditingProfile(null)
    setFormData({
      modelId: '',
      modelName: '',
      modelNameEn: '',
      year: new Date().getFullYear(),
      trimLevel: '',
      basePrice: 0,
      description: '',
      imageUrl: '',
      streetLegalStatus: 'conditional',
    })
    setIsFormModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.modelId || !formData.modelName || !formData.modelNameEn) {
      alert('请填写必填字段')
      return
    }

    setSubmitting(true)
    try {
      const requestData: CreateVehicleModelProfileRequest = {
        ...formData,
        specs: [],
        assemblyZones: [],
        modificationRestrictions: [],
        regulationNotes: [],
        diagrams: [],
        compatiblePartCategories: [],
      }

      if (editingProfile) {
        await updateVehicleProfile(editingProfile.id, requestData as UpdateVehicleModelProfileRequest)
      } else {
        const profile = await createVehicleProfile(requestData)
        if (profile) {
          navigate(`/admin/vehicle-profiles/${profile.id}`)
        }
      }
      setIsFormModalOpen(false)
    } catch (e) {
      console.error('Failed to save profile:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (profile: VehicleModelProfileSummary) => {
    try {
      await updateVehicleProfileStatus(profile.id, !profile.isActive)
    } catch (e) {
      console.error('Failed to update status:', e)
    }
  }

  const handleDelete = async () => {
    if (!deletingProfile) return
    try {
      await deleteVehicleProfile(deletingProfile.id)
      setIsDeleteModalOpen(false)
      setDeletingProfile(null)
    } catch (e) {
      console.error('Failed to delete profile:', e)
    }
  }

  const stats = useMemo(() => {
    const total = vehicleProfiles.length
    const active = vehicleProfiles.filter((p) => p.isActive).length
    const conditional = vehicleProfiles.filter((p) => p.streetLegalStatus === 'conditional').length
    const offRoadOnly = vehicleProfiles.filter((p) => p.streetLegalStatus === 'off_road_only').length
    return { total, active, conditional, offRoadOnly }
  }, [vehicleProfiles])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-moto-silver flex items-center gap-2">
            <BookOpen className="text-moto-orange" size={24} />
            车型资料中心
          </h1>
          <p className="text-sm text-moto-steel mt-1">统一管理车型参数、可装配区域、改装限制、法规备注与示意图配置</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span className="hidden lg:inline">新建车型资料</span>
          <span className="lg:hidden">新建</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Car className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-moto-steel">资料总数</p>
              <p className="text-2xl font-bold text-moto-silver">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ToggleRight className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-moto-steel">已启用</p>
              <p className="text-2xl font-bold text-moto-silver">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-moto-steel">有条件上路</p>
              <p className="text-2xl font-bold text-moto-silver">{stats.conditional}</p>
            </div>
          </div>
        </div>
        <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="text-red-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-moto-steel">仅限赛道</p>
              <p className="text-2xl font-bold text-moto-silver">{stats.offRoadOnly}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-carbon-800 rounded-xl border border-carbon-500/30">
        <div className="p-4 border-b border-carbon-500/30 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel" size={18} />
            <input
              type="text"
              placeholder="搜索车型名称、描述..."
              value={vehicleProfileSearchKeyword}
              onChange={(e) => setVehicleProfileSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver placeholder-moto-steel/50 focus:outline-none focus:border-moto-orange/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setModelFilterOpen(!modelFilterOpen)
                  setStatusFilterOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver hover:bg-carbon-700 transition-colors"
              >
                <Filter size={16} />
                <span>{selectedModel ? selectedModel.name : '全部车型'}</span>
                <ChevronDown size={14} className={cn('transition-transform', modelFilterOpen && 'rotate-180')} />
              </button>
              {modelFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-carbon-800 border border-carbon-500/30 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setVehicleProfileFilterModelId('')
                        setModelFilterOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        !vehicleProfileFilterModelId
                          ? 'bg-moto-orange/10 text-moto-orange'
                          : 'text-moto-steel hover:bg-carbon-700/50'
                      )}
                    >
                      全部车型
                    </button>
                    {bikeModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setVehicleProfileFilterModelId(model.id)
                          setModelFilterOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          vehicleProfileFilterModelId === model.id
                            ? 'bg-moto-orange/10 text-moto-orange'
                            : 'text-moto-steel hover:bg-carbon-700/50'
                        )}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setStatusFilterOpen(!statusFilterOpen)
                  setModelFilterOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver hover:bg-carbon-700 transition-colors"
              >
                <span>{STATUS_OPTIONS.find((o) => o.value === vehicleProfileFilterStatus)?.label}</span>
                <ChevronDown size={14} className={cn('transition-transform', statusFilterOpen && 'rotate-180')} />
              </button>
              {statusFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-carbon-800 border border-carbon-500/30 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setVehicleProfileFilterStatus(option.value)
                          setStatusFilterOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          vehicleProfileFilterStatus === option.value
                            ? 'bg-moto-orange/10 text-moto-orange'
                            : 'text-moto-steel hover:bg-carbon-700/50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {vehicleProfilesLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-moto-steel">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p>加载中...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-moto-steel">
            <FileText size={48} className="mb-3 opacity-50" />
            <p className="text-lg mb-1">暂无车型资料</p>
            <p className="text-sm opacity-70">点击上方按钮创建第一个车型资料</p>
          </div>
        ) : (
          <div className="divide-y divide-carbon-500/30">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="p-4 hover:bg-carbon-700/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="w-full lg:w-32 h-20 lg:h-16 bg-carbon-700/50 rounded-lg overflow-hidden flex-shrink-0">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.modelName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-moto-steel/50">
                        <Car size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-moto-silver truncate">{profile.modelName}</h3>
                      <span className="text-xs text-moto-steel/70">{profile.year}</span>
                      {profile.trimLevel && (
                        <span className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded">
                          {profile.trimLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-moto-steel/70 mb-2 line-clamp-1">{profile.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={cn(
                        'px-2 py-0.5 rounded border',
                        STREET_LEGAL_STATUS_COLORS[profile.streetLegalStatus]
                      )}>
                        {STREET_LEGAL_STATUS_LABELS[profile.streetLegalStatus]}
                      </span>
                      <span className="text-moto-orange font-medium">¥{profile.basePrice.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-moto-steel">
                        <Gauge size={12} />
                        <span>{profile.specsCount} 参数</span>
                      </div>
                      <div className="flex items-center gap-1 text-moto-steel">
                        <MapPin size={12} />
                        <span>{profile.zonesCount} 区域</span>
                      </div>
                      <div className="flex items-center gap-1 text-moto-steel">
                        <AlertTriangle size={12} />
                        <span>{profile.restrictionsCount} 限制</span>
                      </div>
                      <div className="flex items-center gap-1 text-moto-steel">
                        <FileText size={12} />
                        <span>{profile.regulationsCount} 法规</span>
                      </div>
                      <div className="flex items-center gap-1 text-moto-steel">
                        <Image size={12} />
                        <span>{profile.diagramsCount} 示意图</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(profile)}
                      className="p-2 text-moto-steel hover:text-moto-silver transition-colors"
                      title={profile.isActive ? '禁用' : '启用'}
                    >
                      {profile.isActive ? (
                        <ToggleRight size={20} className="text-green-400" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/vehicle-profiles/${profile.id}`)}
                      className="p-2 text-moto-steel hover:text-blue-400 transition-colors"
                      title="查看详情"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(profile)
                        setFormData({
                          modelId: profile.modelId,
                          modelName: profile.modelName,
                          modelNameEn: profile.modelNameEn,
                          year: profile.year,
                          trimLevel: profile.trimLevel || '',
                          basePrice: profile.basePrice,
                          description: profile.description,
                          imageUrl: profile.imageUrl || '',
                          streetLegalStatus: profile.streetLegalStatus,
                        })
                        setIsFormModalOpen(true)
                      }}
                      className="p-2 text-moto-steel hover:text-moto-orange transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingProfile(profile)
                        setIsDeleteModalOpen(true)
                      }}
                      className="p-2 text-moto-steel hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingProfile ? '编辑车型资料' : '新建车型资料'}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">关联车型 <span className="text-red-400">*</span></label>
                  <select
                    value={formData.modelId}
                    onChange={(e) => {
                      const model = bikeModels.find((m) => m.id === e.target.value)
                      setFormData({
                        ...formData,
                        modelId: e.target.value,
                        modelName: model?.name || formData.modelName,
                        modelNameEn: model?.nameEn || formData.modelNameEn,
                      })
                    }}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    <option value="">选择车型</option>
                    {bikeModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">年款</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">车型名称（中文） <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">车型名称（英文） <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.modelNameEn}
                    onChange={(e) => setFormData({ ...formData, modelNameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">配置等级</label>
                  <input
                    type="text"
                    value={formData.trimLevel}
                    onChange={(e) => setFormData({ ...formData, trimLevel: e.target.value })}
                    placeholder="如 Standard, Sport, Premium"
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">基础售价（元）</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">封面图片URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">车型描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver placeholder-moto-steel/50 focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">上路合法性</label>
                <select
                  value={formData.streetLegalStatus}
                  onChange={(e) => setFormData({ ...formData, streetLegalStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                >
                  <option value="legal">合法上路</option>
                  <option value="conditional">有条件上路</option>
                  <option value="off_road_only">仅限赛道</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {editingProfile ? '保存修改' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingProfile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-moto-silver">确认删除</h3>
                  <p className="text-sm text-moto-steel">此操作不可撤销</p>
                </div>
              </div>
              <p className="text-moto-steel mb-6">
                确定要删除车型资料 <span className="text-moto-silver font-medium">{deletingProfile.modelName}</span> 吗？
                所有相关数据将被永久删除。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setDeletingProfile(null)
                  }}
                  className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
