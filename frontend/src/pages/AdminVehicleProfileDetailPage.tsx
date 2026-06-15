import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type {
  VehicleModelProfile,
  VehicleSpec,
  AssemblyZone,
  ModificationRestriction,
  RegulationNote,
  DiagramConfig,
  UpdateVehicleModelProfileRequest,
} from '@/types'
import {
  ArrowLeft,
  Save,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  Car,
  Gauge,
  MapPin,
  AlertTriangle,
  FileText,
  Image,
  BookOpen,
  Settings,
  Shield,
  Clock,
  Wrench,
  Info,
} from 'lucide-react'
import {
  SPEC_CATEGORY_LABELS,
  RESTRICTION_TYPE_LABELS,
  RESTRICTION_SEVERITY_COLORS,
  NOTE_TYPE_LABELS,
  DIAGRAM_TYPE_LABELS,
  STREET_LEGAL_STATUS_LABELS,
  STREET_LEGAL_STATUS_COLORS,
} from '@/types'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

type TabType = 'overview' | 'specs' | 'zones' | 'restrictions' | 'regulations' | 'diagrams'

const TABS: { key: TabType; label: string; icon: typeof Gauge }[] = [
  { key: 'overview', label: '概览', icon: BookOpen },
  { key: 'specs', label: '车型参数', icon: Gauge },
  { key: 'zones', label: '可装配区域', icon: MapPin },
  { key: 'restrictions', label: '改装限制', icon: AlertTriangle },
  { key: 'regulations', label: '法规备注', icon: FileText },
  { key: 'diagrams', label: '示意图配置', icon: Image },
]

export default function AdminVehicleProfileDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    fetchVehicleProfileDetail,
    currentVehicleProfile,
    vehicleProfilesLoading,
    updateVehicleProfile,
    updateVehicleProfileStatus,
    categories,
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<VehicleModelProfile | null>(null)

  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false)
  const [editingSpec, setEditingSpec] = useState<VehicleSpec | null>(null)
  const [specFormData, setSpecFormData] = useState<Partial<VehicleSpec>>({})

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<AssemblyZone | null>(null)
  const [zoneFormData, setZoneFormData] = useState<Partial<AssemblyZone>>({})

  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false)
  const [editingRestriction, setEditingRestriction] = useState<ModificationRestriction | null>(null)
  const [restrictionFormData, setRestrictionFormData] = useState<Partial<ModificationRestriction>>({})

  const [isRegulationModalOpen, setIsRegulationModalOpen] = useState(false)
  const [editingRegulation, setEditingRegulation] = useState<RegulationNote | null>(null)
  const [regulationFormData, setRegulationFormData] = useState<Partial<RegulationNote>>({})

  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false)
  const [editingDiagram, setEditingDiagram] = useState<DiagramConfig | null>(null)
  const [diagramFormData, setDiagramFormData] = useState<Partial<DiagramConfig>>({})

  useEffect(() => {
    if (id) {
      fetchVehicleProfileDetail(id)
    }
  }, [id])

  useEffect(() => {
    if (currentVehicleProfile) {
      setProfile({ ...currentVehicleProfile })
    }
  }, [currentVehicleProfile])

  const handleSave = async () => {
    if (!profile || !id) return
    setSaving(true)
    try {
      const updateData: UpdateVehicleModelProfileRequest = {
        modelName: profile.modelName,
        modelNameEn: profile.modelNameEn,
        year: profile.year,
        trimLevel: profile.trimLevel,
        basePrice: profile.basePrice,
        description: profile.description,
        imageUrl: profile.imageUrl,
        specs: profile.specs,
        assemblyZones: profile.assemblyZones,
        modificationRestrictions: profile.modificationRestrictions,
        regulationNotes: profile.regulationNotes,
        diagrams: profile.diagrams,
        compatiblePartCategories: profile.compatiblePartCategories,
        streetLegalStatus: profile.streetLegalStatus,
        warrantyNotes: profile.warrantyNotes,
        maintenanceSchedule: profile.maintenanceSchedule,
        isActive: profile.isActive,
      }
      await updateVehicleProfile(id, updateData)
    } catch (e) {
      console.error('Failed to save profile:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!profile || !id) return
    try {
      await updateVehicleProfileStatus(id, !profile.isActive)
      setProfile({ ...profile, isActive: !profile.isActive })
    } catch (e) {
      console.error('Failed to update status:', e)
    }
  }

  const specsByCategory = useMemo(() => {
    if (!profile) return {}
    const grouped: Record<string, VehicleSpec[]> = {}
    profile.specs.forEach((spec) => {
      if (!grouped[spec.category]) {
        grouped[spec.category] = []
      }
      grouped[spec.category].push(spec)
    })
    Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.sortOrder - b.sortOrder))
    return grouped
  }, [profile?.specs])

  if (vehicleProfilesLoading && !profile) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-moto-steel">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p>加载中...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-moto-steel">
        <AlertTriangle size={48} className="mb-3 opacity-50" />
        <p className="text-lg mb-1">未找到车型资料</p>
        <button
          onClick={() => navigate('/admin/vehicle-profiles')}
          className="mt-4 px-4 py-2 bg-moto-orange text-white rounded-lg"
        >
          返回列表
        </button>
      </div>
    )
  }

  const openCreateSpecModal = () => {
    setEditingSpec(null)
    setSpecFormData({
      category: 'engine',
      name: '',
      value: '',
      valueType: 'string',
      isModifiable: false,
      sortOrder: (profile?.specs.length || 0) + 1,
    })
    setIsSpecModalOpen(true)
  }

  const handleSaveSpec = () => {
    if (!profile || !specFormData.name || !specFormData.value) {
      alert('请填写必填字段')
      return
    }

    if (editingSpec) {
      const newSpecs = profile.specs.map((s) =>
        s.id === editingSpec.id ? { ...s, ...specFormData } as VehicleSpec : s
      )
      setProfile({ ...profile, specs: newSpecs })
    } else {
      const newSpec: VehicleSpec = {
        id: `spec-${Date.now()}`,
        category: specFormData.category || 'engine',
        name: specFormData.name,
        value: specFormData.value,
        valueType: specFormData.valueType || 'string',
        unit: specFormData.unit,
        minValue: specFormData.minValue,
        maxValue: specFormData.maxValue,
        isModifiable: specFormData.isModifiable || false,
        modificationImpact: specFormData.modificationImpact,
        sortOrder: specFormData.sortOrder || (profile.specs.length + 1),
      }
      setProfile({ ...profile, specs: [...profile.specs, newSpec] })
    }
    setIsSpecModalOpen(false)
  }

  const handleDeleteSpec = (specId: string) => {
    if (!confirm('确定删除此参数？')) return
    if (!profile) return
    setProfile({ ...profile, specs: profile.specs.filter((s) => s.id !== specId) })
  }

  const handleMoveSpec = (specId: string, direction: 'up' | 'down') => {
    if (!profile) return
    const specs = [...profile.specs]
    const index = specs.findIndex((s) => s.id === specId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= specs.length) return

    const currentCategory = specs[index].category
    if (specs[targetIndex].category !== currentCategory) return

    ;[specs[index], specs[targetIndex]] = [specs[targetIndex], specs[index]]

    specs.forEach((s, i) => {
      if (s.category === currentCategory) {
        s.sortOrder = i + 1
      }
    })

    setProfile({ ...profile, specs })
  }

  const openCreateZoneModal = () => {
    setEditingZone(null)
    setZoneFormData({
      name: '',
      nameEn: '',
      description: '',
      position: { x: 0, y: 0, width: 100, height: 100 },
      categoryIds: [],
      sortOrder: (profile?.assemblyZones.length || 0) + 1,
      isActive: true,
    })
    setIsZoneModalOpen(true)
  }

  const handleSaveZone = () => {
    if (!profile || !zoneFormData.name || !zoneFormData.nameEn) {
      alert('请填写必填字段')
      return
    }

    if (editingZone) {
      const newZones = profile.assemblyZones.map((z) =>
        z.id === editingZone.id ? { ...z, ...zoneFormData } as AssemblyZone : z
      )
      setProfile({ ...profile, assemblyZones: newZones })
    } else {
      const newZone: AssemblyZone = {
        id: `zone-${Date.now()}`,
        name: zoneFormData.name,
        nameEn: zoneFormData.nameEn,
        description: zoneFormData.description,
        position: zoneFormData.position || { x: 0, y: 0, width: 100, height: 100 },
        categoryIds: zoneFormData.categoryIds || [],
        sortOrder: zoneFormData.sortOrder || (profile.assemblyZones.length + 1),
        isActive: zoneFormData.isActive !== undefined ? zoneFormData.isActive : true,
      }
      setProfile({ ...profile, assemblyZones: [...profile.assemblyZones, newZone] })
    }
    setIsZoneModalOpen(false)
  }

  const handleDeleteZone = (zoneId: string) => {
    if (!confirm('确定删除此装配区域？')) return
    if (!profile) return
    setProfile({ ...profile, assemblyZones: profile.assemblyZones.filter((z) => z.id !== zoneId) })
  }

  const openCreateRestrictionModal = () => {
    setEditingRestriction(null)
    setRestrictionFormData({
      modelId: profile.modelId,
      restrictionType: 'limited',
      title: '',
      description: '',
      severity: 'warning',
      isActive: true,
    })
    setIsRestrictionModalOpen(true)
  }

  const handleSaveRestriction = () => {
    if (!profile || !restrictionFormData.title || !restrictionFormData.description) {
      alert('请填写必填字段')
      return
    }

    const now = new Date().toISOString()
    if (editingRestriction) {
      const newRestrictions = profile.modificationRestrictions.map((r) =>
        r.id === editingRestriction.id
          ? { ...r, ...restrictionFormData, updatedAt: now } as ModificationRestriction
          : r
      )
      setProfile({ ...profile, modificationRestrictions: newRestrictions })
    } else {
      const newRestriction: ModificationRestriction = {
        id: `restriction-${Date.now()}`,
        modelId: profile.modelId,
        zoneId: restrictionFormData.zoneId,
        categoryId: restrictionFormData.categoryId,
        restrictionType: restrictionFormData.restrictionType || 'limited',
        title: restrictionFormData.title,
        description: restrictionFormData.description,
        regulationReference: restrictionFormData.regulationReference,
        severity: restrictionFormData.severity || 'warning',
        affectedPartIds: restrictionFormData.affectedPartIds,
        exceptions: restrictionFormData.exceptions,
        effectiveDate: restrictionFormData.effectiveDate,
        expiryDate: restrictionFormData.expiryDate,
        isActive: restrictionFormData.isActive !== undefined ? restrictionFormData.isActive : true,
        createdAt: now,
        updatedAt: now,
      }
      setProfile({
        ...profile,
        modificationRestrictions: [...profile.modificationRestrictions, newRestriction],
      })
    }
    setIsRestrictionModalOpen(false)
  }

  const handleDeleteRestriction = (restrictionId: string) => {
    if (!confirm('确定删除此改装限制？')) return
    if (!profile) return
    setProfile({
      ...profile,
      modificationRestrictions: profile.modificationRestrictions.filter((r) => r.id !== restrictionId),
    })
  }

  const openCreateRegulationModal = () => {
    setEditingRegulation(null)
    setRegulationFormData({
      modelId: profile.modelId,
      title: '',
      content: '',
      noteType: 'national',
      isActive: true,
    })
    setIsRegulationModalOpen(true)
  }

  const handleSaveRegulation = () => {
    if (!profile || !regulationFormData.title || !regulationFormData.content) {
      alert('请填写必填字段')
      return
    }

    const now = new Date().toISOString()
    if (editingRegulation) {
      const newRegulations = profile.regulationNotes.map((r) =>
        r.id === editingRegulation.id
          ? { ...r, ...regulationFormData, updatedAt: now } as RegulationNote
          : r
      )
      setProfile({ ...profile, regulationNotes: newRegulations })
    } else {
      const newRegulation: RegulationNote = {
        id: `regulation-${Date.now()}`,
        modelId: profile.modelId,
        title: regulationFormData.title,
        content: regulationFormData.content,
        noteType: regulationFormData.noteType || 'national',
        region: regulationFormData.region,
        regulationCode: regulationFormData.regulationCode,
        effectiveDate: regulationFormData.effectiveDate,
        expiryDate: regulationFormData.expiryDate,
        attachments: regulationFormData.attachments,
        isActive: regulationFormData.isActive !== undefined ? regulationFormData.isActive : true,
        createdAt: now,
        updatedAt: now,
      }
      setProfile({ ...profile, regulationNotes: [...profile.regulationNotes, newRegulation] })
    }
    setIsRegulationModalOpen(false)
  }

  const handleDeleteRegulation = (regulationId: string) => {
    if (!confirm('确定删除此法规备注？')) return
    if (!profile) return
    setProfile({
      ...profile,
      regulationNotes: profile.regulationNotes.filter((r) => r.id !== regulationId),
    })
  }

  const openCreateDiagramModal = () => {
    setEditingDiagram(null)
    setDiagramFormData({
      modelId: profile.modelId,
      name: '',
      description: '',
      diagramType: 'side',
      imageUrl: '',
      zones: [],
      hotspots: [],
      sortOrder: (profile?.diagrams.length || 0) + 1,
      isActive: true,
    })
    setIsDiagramModalOpen(true)
  }

  const handleSaveDiagram = () => {
    if (!profile || !diagramFormData.name || !diagramFormData.imageUrl) {
      alert('请填写必填字段')
      return
    }

    const now = new Date().toISOString()
    if (editingDiagram) {
      const newDiagrams = profile.diagrams.map((d) =>
        d.id === editingDiagram.id
          ? { ...d, ...diagramFormData, updatedAt: now } as DiagramConfig
          : d
      )
      setProfile({ ...profile, diagrams: newDiagrams })
    } else {
      const newDiagram: DiagramConfig = {
        id: `diagram-${Date.now()}`,
        modelId: profile.modelId,
        name: diagramFormData.name,
        description: diagramFormData.description,
        diagramType: diagramFormData.diagramType || 'side',
        imageUrl: diagramFormData.imageUrl,
        zones: diagramFormData.zones || [],
        hotspots: diagramFormData.hotspots || [],
        sortOrder: diagramFormData.sortOrder || (profile.diagrams.length + 1),
        isActive: diagramFormData.isActive !== undefined ? diagramFormData.isActive : true,
        createdAt: now,
        updatedAt: now,
      }
      setProfile({ ...profile, diagrams: [...profile.diagrams, newDiagram] })
    }
    setIsDiagramModalOpen(false)
  }

  const handleDeleteDiagram = (diagramId: string) => {
    if (!confirm('确定删除此示意图？')) return
    if (!profile) return
    setProfile({ ...profile, diagrams: profile.diagrams.filter((d) => d.id !== diagramId) })
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/vehicle-profiles')}
            className="p-2 text-moto-steel hover:text-moto-silver transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-moto-silver flex items-center gap-2">
              {profile.modelName}
              <span className="text-sm text-moto-steel/70 font-normal">{profile.year}</span>
              {profile.trimLevel && (
                <span className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded">
                  {profile.trimLevel}
                </span>
              )}
            </h1>
            <p className="text-sm text-moto-steel mt-1">{profile.modelNameEn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className="flex items-center gap-2 px-3 py-2 text-moto-steel hover:text-moto-silver transition-colors"
          >
            {profile.isActive ? (
              <ToggleRight size={20} className="text-green-400" />
            ) : (
              <ToggleLeft size={20} />
            )}
            <span className="hidden lg:inline">{profile.isActive ? '已启用' : '已禁用'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} />
            <span className="hidden lg:inline">保存</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-carbon-500/30">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-moto-orange/10 text-moto-orange'
                : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-6 space-y-4">
                <h3 className="text-lg font-bold text-moto-silver flex items-center gap-2">
                  <Info size={20} className="text-moto-orange" />
                  基本信息
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">车型名称（中文）</label>
                    <input
                      type="text"
                      value={profile.modelName}
                      onChange={(e) => setProfile({ ...profile, modelName: e.target.value })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">车型名称（英文）</label>
                    <input
                      type="text"
                      value={profile.modelNameEn}
                      onChange={(e) => setProfile({ ...profile, modelNameEn: e.target.value })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">年款</label>
                    <input
                      type="number"
                      value={profile.year}
                      onChange={(e) => setProfile({ ...profile, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">配置等级</label>
                    <input
                      type="text"
                      value={profile.trimLevel || ''}
                      onChange={(e) => setProfile({ ...profile, trimLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">基础售价（元）</label>
                    <input
                      type="number"
                      value={profile.basePrice}
                      onChange={(e) => setProfile({ ...profile, basePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">上路合法性</label>
                    <select
                      value={profile.streetLegalStatus}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          streetLegalStatus: e.target.value as 'legal' | 'conditional' | 'off_road_only',
                        })
                      }
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    >
                      <option value="legal">合法上路</option>
                      <option value="conditional">有条件上路</option>
                      <option value="off_road_only">仅限赛道</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">封面图片URL</label>
                  <input
                    type="text"
                    value={profile.imageUrl || ''}
                    onChange={(e) => setProfile({ ...profile, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">车型描述</label>
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">保修说明</label>
                  <textarea
                    value={profile.warrantyNotes || ''}
                    onChange={(e) => setProfile({ ...profile, warrantyNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                  />
                </div>
              </div>

              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-6 space-y-4">
                <h3 className="text-lg font-bold text-moto-silver flex items-center gap-2">
                  <Clock size={20} className="text-moto-orange" />
                  维护周期
                </h3>
                <div className="space-y-3">
                  {profile.maintenanceSchedule?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-carbon-700/30 rounded-lg"
                    >
                      <div className="p-2 bg-moto-orange/10 rounded-lg">
                        <Wrench size={16} className="text-moto-orange" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-moto-silver">
                            {item.intervalKm.toLocaleString()} 公里
                          </span>
                        </div>
                        <div className="text-sm text-moto-steel">
                          {item.items.join('、')}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newSchedule = [...(profile.maintenanceSchedule || [])]
                          newSchedule.splice(index, 1)
                          setProfile({ ...profile, maintenanceSchedule: newSchedule })
                        }}
                        className="p-1 text-moto-steel hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newSchedule = [...(profile.maintenanceSchedule || [])]
                      newSchedule.push({ intervalKm: 5000, items: [] })
                      setProfile({ ...profile, maintenanceSchedule: newSchedule })
                    }}
                    className="w-full py-2 border border-dashed border-carbon-500/30 rounded-lg text-moto-steel hover:text-moto-orange hover:border-moto-orange/50 transition-colors text-sm"
                  >
                    + 添加维护周期
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 overflow-hidden">
                <div className="aspect-video bg-carbon-700/50">
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt={profile.modelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moto-steel/50">
                      <Car size={48} />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border',
                    STREET_LEGAL_STATUS_COLORS[profile.streetLegalStatus]
                  )}>
                    <Shield size={12} />
                    {STREET_LEGAL_STATUS_LABELS[profile.streetLegalStatus]}
                  </div>
                  <div className="text-2xl font-bold text-moto-orange">
                    ¥{profile.basePrice.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={16} className="text-blue-400" />
                    <span className="text-xs text-moto-steel">车型参数</span>
                  </div>
                  <div className="text-2xl font-bold text-moto-silver">{profile.specs.length}</div>
                </div>
                <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-green-400" />
                    <span className="text-xs text-moto-steel">装配区域</span>
                  </div>
                  <div className="text-2xl font-bold text-moto-silver">{profile.assemblyZones.length}</div>
                </div>
                <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-yellow-400" />
                    <span className="text-xs text-moto-steel">改装限制</span>
                  </div>
                  <div className="text-2xl font-bold text-moto-silver">{profile.modificationRestrictions.length}</div>
                </div>
                <div className="bg-carbon-800 rounded-xl p-4 border border-carbon-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-purple-400" />
                    <span className="text-xs text-moto-steel">法规备注</span>
                  </div>
                  <div className="text-2xl font-bold text-moto-silver">{profile.regulationNotes.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-moto-silver">车型参数</h2>
            <button
              onClick={openCreateSpecModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加参数
            </button>
          </div>

          {Object.keys(specsByCategory).length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-12 flex flex-col items-center justify-center text-moto-steel">
              <Gauge size={48} className="mb-3 opacity-50" />
              <p className="text-lg mb-1">暂无参数</p>
              <p className="text-sm opacity-70">点击上方按钮添加第一个参数</p>
            </div>
          ) : (
            Object.entries(specsByCategory).map(([category, specs]) => (
              <div
                key={category}
                className="bg-carbon-800 rounded-xl border border-carbon-500/30 overflow-hidden"
              >
                <div className="px-4 py-3 bg-carbon-700/30 border-b border-carbon-500/30">
                  <h3 className="font-medium text-moto-silver">
                    {SPEC_CATEGORY_LABELS[category as keyof typeof SPEC_CATEGORY_LABELS] || category}
                  </h3>
                </div>
                <div className="divide-y divide-carbon-500/30">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="p-4 flex items-center gap-4 hover:bg-carbon-700/20 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveSpec(spec.id, 'up')}
                          className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveSpec(spec.id, 'down')}
                          className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-moto-silver">{spec.name}</span>
                          {spec.nameEn && (
                            <span className="text-xs text-moto-steel/70">{spec.nameEn}</span>
                          )}
                          {spec.isModifiable && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                              可改装
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-moto-orange font-medium">
                          {spec.value}
                          {spec.unit && <span className="text-moto-steel ml-1">{spec.unit}</span>}
                        </div>
                        {spec.modificationImpact && (
                          <div className="text-xs text-moto-steel/70 mt-1">
                            改装影响：{spec.modificationImpact}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSpec(spec)
                            setSpecFormData({ ...spec })
                            setIsSpecModalOpen(true)
                          }}
                          className="p-2 text-moto-steel hover:text-moto-orange transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSpec(spec.id)}
                          className="p-2 text-moto-steel hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-moto-silver">可装配区域</h2>
            <button
              onClick={openCreateZoneModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加区域
            </button>
          </div>

          {profile.assemblyZones.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-12 flex flex-col items-center justify-center text-moto-steel">
              <MapPin size={48} className="mb-3 opacity-50" />
              <p className="text-lg mb-1">暂无装配区域</p>
              <p className="text-sm opacity-70">点击上方按钮添加第一个装配区域</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {profile.assemblyZones
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-moto-silver">{zone.name}</h3>
                        <p className="text-xs text-moto-steel/70">{zone.nameEn}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingZone(zone)
                            setZoneFormData({ ...zone })
                            setIsZoneModalOpen(true)
                          }}
                          className="p-1.5 text-moto-steel hover:text-moto-orange transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-1.5 text-moto-steel hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {zone.description && (
                      <p className="text-sm text-moto-steel">{zone.description}</p>
                    )}
                    <div className="text-xs text-moto-steel/70">
                      位置: X:{zone.position.x}, Y:{zone.position.y}, W:{zone.position.width}, H:{zone.position.height}
                    </div>
                    {zone.categoryIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {zone.categoryIds.map((catId) => {
                          const cat = categories.find((c) => c.id === catId)
                          return (
                            <span
                              key={catId}
                              className="text-xs px-2 py-0.5 bg-carbon-700 text-moto-steel rounded"
                            >
                              {cat?.name || catId}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-carbon-500/30">
                      {zone.isActive ? (
                        <span className="text-xs text-green-400">已启用</span>
                      ) : (
                        <span className="text-xs text-moto-steel">已禁用</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'restrictions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-moto-silver">改装限制</h2>
            <button
              onClick={openCreateRestrictionModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加限制
            </button>
          </div>

          {profile.modificationRestrictions.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-12 flex flex-col items-center justify-center text-moto-steel">
              <AlertTriangle size={48} className="mb-3 opacity-50" />
              <p className="text-lg mb-1">暂无改装限制</p>
              <p className="text-sm opacity-70">点击上方按钮添加第一条改装限制</p>
            </div>
          ) : (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 overflow-hidden">
              <div className="divide-y divide-carbon-500/30">
                {profile.modificationRestrictions.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="p-4 hover:bg-carbon-700/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            RESTRICTION_SEVERITY_COLORS[restriction.severity]
                          )} />
                          <span className="font-medium text-moto-silver">{restriction.title}</span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            restriction.restrictionType === 'prohibited'
                              ? 'bg-red-500/10 text-red-400'
                              : restriction.restrictionType === 'limited'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : restriction.restrictionType === 'requires_approval'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-green-500/10 text-green-400'
                          )}>
                            {RESTRICTION_TYPE_LABELS[restriction.restrictionType]}
                          </span>
                        </div>
                        <p className="text-sm text-moto-steel mb-2">{restriction.description}</p>
                        {restriction.regulationReference && (
                          <p className="text-xs text-moto-steel/70">
                            法规依据：{restriction.regulationReference}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRestriction(restriction)
                            setRestrictionFormData({ ...restriction })
                            setIsRestrictionModalOpen(true)
                          }}
                          className="p-2 text-moto-steel hover:text-moto-orange transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRestriction(restriction.id)}
                          className="p-2 text-moto-steel hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'regulations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-moto-silver">法规备注</h2>
            <button
              onClick={openCreateRegulationModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加备注
            </button>
          </div>

          {profile.regulationNotes.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-12 flex flex-col items-center justify-center text-moto-steel">
              <FileText size={48} className="mb-3 opacity-50" />
              <p className="text-lg mb-1">暂无法规备注</p>
              <p className="text-sm opacity-70">点击上方按钮添加第一条法规备注</p>
            </div>
          ) : (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 overflow-hidden">
              <div className="divide-y divide-carbon-500/30">
                {profile.regulationNotes.map((regulation) => (
                  <div
                    key={regulation.id}
                    className="p-4 hover:bg-carbon-700/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-moto-silver">{regulation.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                            {NOTE_TYPE_LABELS[regulation.noteType]}
                          </span>
                          {regulation.region && (
                            <span className="text-xs text-moto-steel/70">
                              {regulation.region}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-moto-steel mb-2 whitespace-pre-wrap">{regulation.content}</p>
                        {regulation.regulationCode && (
                          <p className="text-xs text-moto-steel/70">
                            法规编号：{regulation.regulationCode}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRegulation(regulation)
                            setRegulationFormData({ ...regulation })
                            setIsRegulationModalOpen(true)
                          }}
                          className="p-2 text-moto-steel hover:text-moto-orange transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRegulation(regulation.id)}
                          className="p-2 text-moto-steel hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagrams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-moto-silver">示意图配置</h2>
            <button
              onClick={openCreateDiagramModal}
              className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加示意图
            </button>
          </div>

          {profile.diagrams.length === 0 ? (
            <div className="bg-carbon-800 rounded-xl border border-carbon-500/30 p-12 flex flex-col items-center justify-center text-moto-steel">
              <Image size={48} className="mb-3 opacity-50" />
              <p className="text-lg mb-1">暂无示意图</p>
              <p className="text-sm opacity-70">点击上方按钮添加第一张示意图</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {profile.diagrams
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((diagram) => (
                  <div
                    key={diagram.id}
                    className="bg-carbon-800 rounded-xl border border-carbon-500/30 overflow-hidden"
                  >
                    <div className="aspect-video bg-carbon-700/50 relative">
                      {diagram.imageUrl ? (
                        <img
                          src={diagram.imageUrl}
                          alt={diagram.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-moto-steel/50">
                          <Image size={32} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="text-xs px-2 py-0.5 bg-black/60 text-white rounded">
                          {DIAGRAM_TYPE_LABELS[diagram.diagramType]}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-moto-silver">{diagram.name}</h3>
                          {diagram.description && (
                            <p className="text-xs text-moto-steel/70 mt-1">{diagram.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingDiagram(diagram)
                              setDiagramFormData({ ...diagram })
                              setIsDiagramModalOpen(true)
                            }}
                            className="p-1.5 text-moto-steel hover:text-moto-orange transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDiagram(diagram.id)}
                            className="p-1.5 text-moto-steel hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-moto-steel pt-2 border-t border-carbon-500/30">
                        <span>{diagram.zones.length} 区域</span>
                        <span>{diagram.hotspots.length} 热点</span>
                        <span className={diagram.isActive ? 'text-green-400' : 'text-moto-steel'}>
                          {diagram.isActive ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {isSpecModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingSpec ? '编辑参数' : '添加参数'}
              </h2>
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">分类</label>
                  <select
                    value={specFormData.category || 'engine'}
                    onChange={(e) => setSpecFormData({ ...specFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    {Object.entries(SPEC_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">值类型</label>
                  <select
                    value={specFormData.valueType || 'string'}
                    onChange={(e) => setSpecFormData({ ...specFormData, valueType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    <option value="string">字符串</option>
                    <option value="number">数值</option>
                    <option value="boolean">布尔</option>
                    <option value="range">范围</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">参数名称 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={specFormData.name || ''}
                  onChange={(e) => setSpecFormData({ ...specFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">英文名称</label>
                <input
                  type="text"
                  value={specFormData.nameEn || ''}
                  onChange={(e) => setSpecFormData({ ...specFormData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">参数值 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={specFormData.value || ''}
                    onChange={(e) => setSpecFormData({ ...specFormData, value: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">单位</label>
                  <input
                    type="text"
                    value={specFormData.unit || ''}
                    onChange={(e) => setSpecFormData({ ...specFormData, unit: e.target.value })}
                    placeholder="如: cc, kW, kg"
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              {specFormData.valueType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">最小值</label>
                    <input
                      type="number"
                      value={specFormData.minValue || ''}
                      onChange={(e) => setSpecFormData({ ...specFormData, minValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-moto-steel mb-1">最大值</label>
                    <input
                      type="number"
                      value={specFormData.maxValue || ''}
                      onChange={(e) => setSpecFormData({ ...specFormData, maxValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="spec-modifiable"
                  checked={specFormData.isModifiable || false}
                  onChange={(e) => setSpecFormData({ ...specFormData, isModifiable: e.target.checked })}
                  className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                />
                <label htmlFor="spec-modifiable" className="text-sm text-moto-silver">
                  支持改装
                </label>
              </div>
              {specFormData.isModifiable && (
                <div>
                  <label className="block text-sm text-moto-steel mb-1">改装影响说明</label>
                  <textarea
                    value={specFormData.modificationImpact || ''}
                    onChange={(e) => setSpecFormData({ ...specFormData, modificationImpact: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSpec}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
              >
                {editingSpec ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingZone ? '编辑装配区域' : '添加装配区域'}
              </h2>
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">区域名称（中文） <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={zoneFormData.name || ''}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">区域名称（英文） <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={zoneFormData.nameEn || ''}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">区域描述</label>
                <textarea
                  value={zoneFormData.description || ''}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">位置坐标</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-moto-steel/70 mb-1">X</label>
                    <input
                      type="number"
                      value={zoneFormData.position?.x || 0}
                      onChange={(e) => setZoneFormData({
                        ...zoneFormData,
                        position: { ...zoneFormData.position!, x: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1.5 bg-carbon-700/50 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel/70 mb-1">Y</label>
                    <input
                      type="number"
                      value={zoneFormData.position?.y || 0}
                      onChange={(e) => setZoneFormData({
                        ...zoneFormData,
                        position: { ...zoneFormData.position!, y: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1.5 bg-carbon-700/50 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel/70 mb-1">宽度</label>
                    <input
                      type="number"
                      value={zoneFormData.position?.width || 100}
                      onChange={(e) => setZoneFormData({
                        ...zoneFormData,
                        position: { ...zoneFormData.position!, width: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1.5 bg-carbon-700/50 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-moto-steel/70 mb-1">高度</label>
                    <input
                      type="number"
                      value={zoneFormData.position?.height || 100}
                      onChange={(e) => setZoneFormData({
                        ...zoneFormData,
                        position: { ...zoneFormData.position!, height: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1.5 bg-carbon-700/50 border border-carbon-500/30 rounded text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">关联分类</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-1 px-2 py-1 bg-carbon-700/50 rounded text-sm cursor-pointer hover:bg-carbon-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={zoneFormData.categoryIds?.includes(cat.id) || false}
                        onChange={(e) => {
                          const currentIds = zoneFormData.categoryIds || []
                          if (e.target.checked) {
                            setZoneFormData({ ...zoneFormData, categoryIds: [...currentIds, cat.id] })
                          } else {
                            setZoneFormData({ ...zoneFormData, categoryIds: currentIds.filter((id) => id !== cat.id) })
                          }
                        }}
                        className="w-3 h-3 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                      />
                      <span className="text-moto-silver">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="zone-active"
                  checked={zoneFormData.isActive !== undefined ? zoneFormData.isActive : true}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                />
                <label htmlFor="zone-active" className="text-sm text-moto-silver">
                  启用此区域
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveZone}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
              >
                {editingZone ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRestrictionModalOpen && editingRestriction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingRestriction.id.startsWith('restriction-') ? '编辑改装限制' : '添加改装限制'}
              </h2>
              <button
                onClick={() => setIsRestrictionModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">限制类型</label>
                  <select
                    value={restrictionFormData.restrictionType || 'limited'}
                    onChange={(e) => setRestrictionFormData({ ...restrictionFormData, restrictionType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    {Object.entries(RESTRICTION_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">严重程度</label>
                  <select
                    value={restrictionFormData.severity || 'warning'}
                    onChange={(e) => setRestrictionFormData({ ...restrictionFormData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    <option value="info">提示</option>
                    <option value="warning">警告</option>
                    <option value="danger">危险</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">标题 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={restrictionFormData.title || ''}
                  onChange={(e) => setRestrictionFormData({ ...restrictionFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">描述 <span className="text-red-400">*</span></label>
                <textarea
                  value={restrictionFormData.description || ''}
                  onChange={(e) => setRestrictionFormData({ ...restrictionFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">法规依据</label>
                <input
                  type="text"
                  value={restrictionFormData.regulationReference || ''}
                  onChange={(e) => setRestrictionFormData({ ...restrictionFormData, regulationReference: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">生效日期</label>
                  <input
                    type="date"
                    value={restrictionFormData.effectiveDate || ''}
                    onChange={(e) => setRestrictionFormData({ ...restrictionFormData, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">失效日期</label>
                  <input
                    type="date"
                    value={restrictionFormData.expiryDate || ''}
                    onChange={(e) => setRestrictionFormData({ ...restrictionFormData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">例外情况</label>
                <input
                  type="text"
                  value={restrictionFormData.exceptions?.join(', ') || ''}
                  onChange={(e) => setRestrictionFormData({ ...restrictionFormData, exceptions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="用逗号分隔多个例外情况"
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restriction-active"
                  checked={restrictionFormData.isActive !== undefined ? restrictionFormData.isActive : true}
                  onChange={(e) => setRestrictionFormData({ ...restrictionFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                />
                <label htmlFor="restriction-active" className="text-sm text-moto-silver">
                  启用此限制
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsRestrictionModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRestriction}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
              >
                {editingRestriction.id.startsWith('restriction-') ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRegulationModalOpen && editingRegulation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingRegulation.id.startsWith('regulation-') ? '编辑法规备注' : '添加法规备注'}
              </h2>
              <button
                onClick={() => setIsRegulationModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">备注类型</label>
                  <select
                    value={regulationFormData.noteType || 'national'}
                    onChange={(e) => setRegulationFormData({ ...regulationFormData, noteType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    {Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">适用地区</label>
                  <input
                    type="text"
                    value={regulationFormData.region || ''}
                    onChange={(e) => setRegulationFormData({ ...regulationFormData, region: e.target.value })}
                    placeholder="如: 全国, 北京市, 广东省"
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">标题 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={regulationFormData.title || ''}
                  onChange={(e) => setRegulationFormData({ ...regulationFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">内容 <span className="text-red-400">*</span></label>
                <textarea
                  value={regulationFormData.content || ''}
                  onChange={(e) => setRegulationFormData({ ...regulationFormData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">法规编号</label>
                <input
                  type="text"
                  value={regulationFormData.regulationCode || ''}
                  onChange={(e) => setRegulationFormData({ ...regulationFormData, regulationCode: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">生效日期</label>
                  <input
                    type="date"
                    value={regulationFormData.effectiveDate || ''}
                    onChange={(e) => setRegulationFormData({ ...regulationFormData, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">失效日期</label>
                  <input
                    type="date"
                    value={regulationFormData.expiryDate || ''}
                    onChange={(e) => setRegulationFormData({ ...regulationFormData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regulation-active"
                  checked={regulationFormData.isActive !== undefined ? regulationFormData.isActive : true}
                  onChange={(e) => setRegulationFormData({ ...regulationFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                />
                <label htmlFor="regulation-active" className="text-sm text-moto-silver">
                  启用此备注
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsRegulationModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRegulation}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
              >
                {editingRegulation.id.startsWith('regulation-') ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDiagramModalOpen && editingDiagram && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-moto-silver">
                {editingDiagram.id.startsWith('diagram-') ? '编辑示意图' : '添加示意图'}
              </h2>
              <button
                onClick={() => setIsDiagramModalOpen(false)}
                className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-moto-steel mb-1">示意图类型</label>
                  <select
                    value={diagramFormData.diagramType || 'side'}
                    onChange={(e) => setDiagramFormData({ ...diagramFormData, diagramType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  >
                    {Object.entries(DIAGRAM_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-moto-steel mb-1">排序</label>
                  <input
                    type="number"
                    value={diagramFormData.sortOrder || 1}
                    onChange={(e) => setDiagramFormData({ ...diagramFormData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">名称 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={diagramFormData.name || ''}
                  onChange={(e) => setDiagramFormData({ ...diagramFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">描述</label>
                <textarea
                  value={diagramFormData.description || ''}
                  onChange={(e) => setDiagramFormData({ ...diagramFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-moto-steel mb-1">图片URL <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={diagramFormData.imageUrl || ''}
                  onChange={(e) => setDiagramFormData({ ...diagramFormData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-carbon-700/50 border border-carbon-500/30 rounded-lg text-moto-silver focus:outline-none focus:border-moto-orange/50"
                />
              </div>
              {diagramFormData.imageUrl && (
                <div className="aspect-video bg-carbon-700/50 rounded-lg overflow-hidden">
                  <img
                    src={diagramFormData.imageUrl}
                    alt="预览"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="diagram-active"
                  checked={diagramFormData.isActive !== undefined ? diagramFormData.isActive : true}
                  onChange={(e) => setDiagramFormData({ ...diagramFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-carbon-500 text-moto-orange focus:ring-moto-orange"
                />
                <label htmlFor="diagram-active" className="text-sm text-moto-silver">
                  启用此示意图
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-carbon-500/30 flex justify-end gap-3">
              <button
                onClick={() => setIsDiagramModalOpen(false)}
                className="px-4 py-2 text-moto-steel hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveDiagram}
                className="px-6 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white rounded-lg transition-colors"
              >
                {editingDiagram.id.startsWith('diagram-') ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}