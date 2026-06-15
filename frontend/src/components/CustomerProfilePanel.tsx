import { useState } from 'react'
import { useStore } from '@/store/useStore'
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CalendarClock,
  Tag,
  Car,
  Edit,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Star,
  User,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ConstructionTask } from '@/types'
import {
  CUSTOMER_LEVEL_LABELS,
  CUSTOMER_LEVEL_COLORS,
  CUSTOMER_SOURCE_LABELS,
  type CreateCustomerRequest,
  type CustomerLevel,
  type CustomerSource,
} from '@/types'

const LEVEL_OPTIONS: { value: CustomerLevel; label: string }[] = [
  { value: 'normal', label: '普通客户' },
  { value: 'silver', label: '银卡会员' },
  { value: 'gold', label: '金卡会员' },
  { value: 'platinum', label: '铂金会员' },
]

const SOURCE_OPTIONS: { value: CustomerSource; label: string }[] = [
  { value: 'walk_in', label: '到店咨询' },
  { value: 'phone', label: '电话咨询' },
  { value: 'online', label: '网络预约' },
  { value: 'referral', label: '客户推荐' },
  { value: 'social_media', label: '社交媒体' },
  { value: 'other', label: '其他渠道' },
]

export default function CustomerProfilePanel() {
  const {
    customers,
    customersLoading,
    currentCustomer,
    customerSearchKeyword,
    customerFilterLevel,
    customerFilterSource,
    fetchCustomers,
    createCustomer,
    setCurrentCustomer,
    setCustomerSearchKeyword,
    setCustomerFilterLevel,
    setCustomerFilterSource,
    getFilteredCustomers,
    currentSchedule,
    setReceptionActiveTab,
  } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    contact: '',
    email: '',
    gender: 'male',
    level: 'normal',
    source: 'walk_in',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [vehicleForm, setVehicleForm] = useState({
    show: false,
    licensePlate: '',
    modelId: 'xcf-180',
    modelName: 'XCF-180',
    mileage: 0,
    color: '',
  })
  const [scheduleTasksExpanded, setScheduleTasksExpanded] = useState(true)

  const handleSearch = () => {
    fetchCustomers({
      keyword: customerSearchKeyword,
      level: customerFilterLevel !== 'all' ? customerFilterLevel : undefined,
      source: customerFilterSource !== 'all' ? customerFilterSource : undefined,
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      alert('请填写客户姓名和联系电话')
      return
    }

    const submitData: CreateCustomerRequest = { ...formData }
    if (vehicleForm.show && vehicleForm.licensePlate) {
      submitData.vehicle = {
        licensePlate: vehicleForm.licensePlate,
        modelId: vehicleForm.modelId,
        modelName: vehicleForm.modelName,
        mileage: vehicleForm.mileage,
        color: vehicleForm.color,
      }
    }

    await createCustomer(submitData)
    setShowForm(false)
    setFormData({
      name: '',
      phone: '',
      contact: '',
      email: '',
      gender: 'male',
      level: 'normal',
      source: 'walk_in',
      tags: [],
    })
    setTagInput('')
    setVehicleForm({
      show: false,
      licensePlate: '',
      modelId: 'xcf-180',
      modelName: 'XCF-180',
      mileage: 0,
      color: '',
    })
    fetchCustomers()
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) || [] })
  }

  const filteredCustomers = getFilteredCustomers()

  return (
    <div className="h-full flex">
      <div className="w-80 shrink-0 border-r border-carbon-500/30 flex flex-col">
        <div className="p-4 border-b border-carbon-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron text-moto-silver font-semibold">客户列表</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-xs hover:bg-moto-orange/20 transition-colors"
            >
              <UserPlus size={14} />
              新建客户
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
              <Search size={14} className="text-moto-steel shrink-0" />
              <input
                type="text"
                value={customerSearchKeyword}
                onChange={(e) => {
                  setCustomerSearchKeyword(e.target.value)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索姓名/电话..."
                className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 flex-1 min-w-0"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={customerFilterLevel}
                onChange={(e) => {
                  setCustomerFilterLevel(e.target.value as CustomerLevel | 'all')
                }}
                className="flex-1 bg-carbon-800 rounded-lg px-3 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none"
              >
                <option value="all">全部等级</option>
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={customerFilterSource}
                onChange={(e) => {
                  setCustomerFilterSource(e.target.value as CustomerSource | 'all')
                }}
                className="flex-1 bg-carbon-800 rounded-lg px-3 py-1.5 border border-carbon-500/20 text-moto-silver text-xs focus:outline-none"
              >
                <option value="all">全部来源</option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {customersLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-carbon-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-moto-steel">
              <User size={40} className="mb-2 opacity-30" />
              <p className="text-sm">暂无客户</p>
            </div>
          ) : (
            <div className="divide-y divide-carbon-500/20">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setCurrentCustomer(customer)}
                  className={`w-full p-4 text-left transition-colors ${
                    currentCustomer?.id === customer.id
                      ? 'bg-moto-orange/10'
                      : 'hover:bg-carbon-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm text-moto-silver font-medium">{customer.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        CUSTOMER_LEVEL_COLORS[customer.level]
                      }`}
                    >
                      {CUSTOMER_LEVEL_LABELS[customer.level]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-moto-steel mb-1">
                    <Phone size={10} />
                    {customer.phone}
                  </div>
                  <div className="text-[10px] text-carbon-500">
                    到店 {customer.totalVisits} 次 · 消费 ¥{customer.totalSpent.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {showForm ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-orbitron text-xl text-moto-silver font-bold">新建客户档案</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-moto-steel hover:text-moto-silver transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    客户姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    placeholder="请输入客户姓名"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">
                    联系电话 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">联系人称呼</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    placeholder="如：张先生"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">邮箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    placeholder="请输入邮箱地址"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">性别</label>
                  <select
                    value={formData.gender || 'male'}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">客户等级</label>
                  <select
                    value={formData.level || 'normal'}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value as CustomerLevel })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-1.5">来源渠道</label>
                  <select
                    value={formData.source || 'walk_in'}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value as CustomerSource })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                  >
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">客户标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded text-xs"
                    >
                      <Tag size={10} />
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                        <X size={10} />
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
                    className="flex-1 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                    placeholder="输入标签后回车添加"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-carbon-700 text-moto-silver rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">地址</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                  placeholder="请输入详细地址"
                />
              </div>

              <div>
                <button
                  onClick={() => setVehicleForm({ ...vehicleForm, show: !vehicleForm.show })}
                  className="flex items-center gap-2 text-sm text-moto-orange hover:text-moto-orange/80 transition-colors"
                >
                  <Car size={16} />
                  {vehicleForm.show ? '收起车辆信息' : '添加车辆信息'}
                </button>
              </div>

              {vehicleForm.show && (
                <div className="p-4 bg-carbon-800/50 rounded-lg border border-carbon-500/20 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-moto-steel mb-1.5">车牌号</label>
                      <input
                        type="text"
                        value={vehicleForm.licensePlate}
                        onChange={(e) =>
                          setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })
                        }
                        className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                        placeholder="如：京A·12345"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-moto-steel mb-1.5">车型</label>
                      <input
                        type="text"
                        value={vehicleForm.modelName}
                        onChange={(e) =>
                          setVehicleForm({ ...vehicleForm, modelName: e.target.value })
                        }
                        className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-moto-steel mb-1.5">里程数 (km)</label>
                      <input
                        type="number"
                        value={vehicleForm.mileage}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            mileage: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-moto-steel mb-1.5">车身颜色</label>
                      <input
                        type="text"
                        value={vehicleForm.color}
                        onChange={(e) =>
                          setVehicleForm({ ...vehicleForm, color: e.target.value })
                        }
                        className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50"
                        placeholder="如：哑光黑"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-moto-steel mb-1.5">备注</label>
                <textarea
                  value={formData.remark || ''}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  rows={3}
                  className="w-full bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 resize-none"
                  placeholder="填写客户偏好、特殊需求等备注信息"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-carbon-700 text-moto-silver rounded-lg text-sm hover:bg-carbon-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-moto-orange text-white rounded-lg text-sm hover:bg-moto-orange/90 transition-colors"
                >
                  <CheckCircle2 size={16} />
                  保存客户档案
                </button>
              </div>
            </div>
          </div>
        ) : currentCustomer ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-moto-orange to-orange-700 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-orbitron text-xl text-moto-silver font-bold">
                      {currentCustomer.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        CUSTOMER_LEVEL_COLORS[currentCustomer.level]
                      }`}
                    >
                      <Star size={10} className="inline mr-1" />
                      {CUSTOMER_LEVEL_LABELS[currentCustomer.level]}
                    </span>
                  </div>
                  <p className="text-sm text-moto-steel">
                    {CUSTOMER_SOURCE_LABELS[currentCustomer.source]}
                    {currentCustomer.sourceRemark && ` · ${currentCustomer.sourceRemark}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-700 text-moto-silver rounded-lg text-xs hover:bg-carbon-600 transition-colors">
                  <Edit size={14} />
                  编辑
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
                <p className="text-xs text-moto-steel mb-1">累计消费</p>
                <p className="font-orbitron text-2xl text-moto-orange">
                  ¥{currentCustomer.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
                <p className="text-xs text-moto-steel mb-1">到店次数</p>
                <p className="font-orbitron text-2xl text-moto-silver">
                  {currentCustomer.totalVisits} 次
                </p>
              </div>
              <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
                <p className="text-xs text-moto-steel mb-1">最近到店</p>
                <p className="font-orbitron text-lg text-moto-silver">
                  {currentCustomer.lastVisitAt
                    ? new Date(currentCustomer.lastVisitAt).toLocaleDateString('zh-CN')
                    : '首次到店'}
                </p>
              </div>
            </div>

            {currentSchedule && currentSchedule.customerId === currentCustomer.id && (
              <div className="bg-green-500/5 rounded-lg border border-green-500/20 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                    <CalendarClock size={16} />
                    当前施工排期
                    <span className="text-[10px] text-moto-steel font-normal">
                      ({(currentSchedule as any).scheduleNo || `#${currentSchedule.id.slice(-6)}`})
                    </span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScheduleTasksExpanded((v) => !v)}
                      className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
                      title={scheduleTasksExpanded ? '收起任务明细' : '展开任务明细'}
                    >
                      {scheduleTasksExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                    <button
                      onClick={() => setReceptionActiveTab('schedule')}
                      className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                      查看详情
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-moto-steel mb-1">施工状态</p>
                    <span
                      className={`text-sm font-medium ${
                        currentSchedule.status === 'completed'
                          ? 'text-green-400'
                          : currentSchedule.status === 'in_progress'
                          ? 'text-moto-orange'
                          : currentSchedule.status === 'delayed'
                          ? 'text-red-400'
                          : 'text-moto-steel'
                      }`}
                    >
                      {currentSchedule.status === 'completed'
                        ? '已完成'
                        : currentSchedule.status === 'in_progress'
                        ? '进行中'
                        : currentSchedule.status === 'delayed'
                        ? '已延期'
                        : '已排期'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-moto-steel mb-1">完成进度</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-carbon-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                          style={{ width: `${currentSchedule.progress || 0}%` }}
                        />
                      </div>
                      <span className="font-orbitron text-sm text-moto-orange">
                        {currentSchedule.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-moto-steel mb-1">任务总数</p>
                    <p className="font-orbitron text-sm text-moto-silver">
                      {currentSchedule.tasks?.length || 0} 项
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-moto-steel mb-1 flex items-center gap-1">
                      <Clock size={10} />
                      预计总工时
                    </p>
                    <p className="font-orbitron text-sm text-moto-silver">
                      {(currentSchedule as any).totalEstimatedHours ||
                        (currentSchedule.tasks?.reduce(
                          (s: number, t: ConstructionTask) => s + (t.estimatedHours || 0),
                          0
                        ) || 0)}
                      {' '}h
                    </p>
                  </div>
                </div>

                {currentSchedule.plannedStartDate && (
                  <div className="pt-4 border-t border-green-500/10 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-moto-steel mb-1">计划工期</p>
                      <p className="text-xs text-moto-silver">
                        {new Date(currentSchedule.plannedStartDate).toLocaleDateString('zh-CN')}
                        {' → '}
                        {currentSchedule.plannedEndDate
                          ? new Date(currentSchedule.plannedEndDate).toLocaleDateString('zh-CN')
                          : '-'}
                        {currentSchedule.plannedStartDate && currentSchedule.plannedEndDate && (
                          <span className="text-moto-steel ml-2">
                            (
                            {Math.max(
                              1,
                              Math.ceil(
                                (new Date(currentSchedule.plannedEndDate).getTime() -
                                  new Date(currentSchedule.plannedStartDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            天)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {currentSchedule.tasks && currentSchedule.tasks.length > 0 && (
                  <div className="pt-4 border-t border-green-500/10 mb-4">
                    <p className="text-xs text-moto-steel mb-2 flex items-center gap-1">
                      <User size={10} />
                      施工人员分配
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          currentSchedule.tasks
                            .flatMap((t) => t.assignedWorkerNames || [])
                            .filter(Boolean)
                        )
                      ).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-carbon-700 text-moto-silver rounded text-xs"
                        >
                          <User size={10} />
                          {name}
                        </span>
                      ))}
                      {Array.from(
                        new Set(
                          currentSchedule.tasks
                            .flatMap((t) => t.assignedWorkerNames || [])
                            .filter(Boolean)
                        )
                      ).length === 0 && (
                        <span className="text-xs text-moto-steel">暂未分配施工人员</span>
                      )}
                    </div>
                  </div>
                )}

                {!scheduleTasksExpanded &&
                  currentSchedule.tasks &&
                  currentSchedule.tasks.length > 0 && (
                    <button
                      onClick={() => setScheduleTasksExpanded(true)}
                      className="w-full flex items-center justify-center gap-1 py-2 mt-2 text-xs text-green-400 hover:text-green-300 transition-colors bg-green-500/5 rounded border border-green-500/10"
                    >
                      展开任务明细 ({currentSchedule.tasks.length} 项)
                      <ChevronUp size={12} />
                    </button>
                  )}

                {scheduleTasksExpanded &&
                  currentSchedule.tasks &&
                  currentSchedule.tasks.length > 0 && (
                    <div className="pt-4 border-t border-green-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] text-moto-steel font-medium">施工任务明细</p>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {currentSchedule.tasks.map((task: ConstructionTask) => (
                          <div
                            key={task.id}
                            className="bg-carbon-800/60 rounded-lg border border-carbon-500/20 p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                                      task.status === 'completed'
                                        ? 'bg-green-400'
                                        : task.status === 'in_progress'
                                        ? 'bg-moto-orange'
                                        : task.status === 'blocked' || task.status === 'paused'
                                        ? 'bg-red-400'
                                        : 'bg-moto-steel'
                                    }`}
                                  />
                                  <span className="text-xs text-moto-silver font-medium">
                                    {task.name}
                                  </span>
                                  {task.priority && task.priority !== 'low' && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        task.priority === 'high'
                                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                          : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/20'
                                      }`}
                                    >
                                      {task.priority === 'high' ? '高优' : '中优'}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      task.status === 'completed'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : task.status === 'in_progress'
                                        ? 'bg-moto-orange/10 text-moto-orange border border-moto-orange/20'
                                        : task.status === 'blocked' || task.status === 'paused'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-carbon-700 text-moto-steel border border-carbon-500/20'
                                    }`}
                                  >
                                    {task.status === 'completed'
                                      ? '已完成'
                                      : task.status === 'in_progress'
                                      ? '进行中'
                                      : task.status === 'blocked' || task.status === 'paused'
                                      ? '已暂停'
                                      : '待开始'}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-[11px] text-moto-steel mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <Clock size={10} className="text-moto-steel shrink-0" />
                                <span className="text-moto-steel">工时：</span>
                                <span className="text-moto-silver font-medium">
                                  预估 {task.estimatedHours || 0}h
                                  {task.actualHours != null && task.actualHours > 0 && (
                                    <span className="text-green-400 ml-1">
                                      · 实际 {task.actualHours}h
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <User size={10} className="text-moto-steel shrink-0" />
                                <span className="text-moto-steel">技师：</span>
                                <span className="text-moto-silver truncate">
                                  {task.assignedWorkerNames &&
                                  task.assignedWorkerNames.length > 0
                                    ? task.assignedWorkerNames.join('、')
                                    : '未分配'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2">
                                <CalendarClock size={10} className="text-moto-steel shrink-0" />
                                <span className="text-moto-steel">计划：</span>
                                <span className="text-moto-silver">
                                  {task.startDate
                                    ? new Date(task.startDate).toLocaleDateString('zh-CN')
                                    : '-'}
                                  {' → '}
                                  {task.endDate
                                    ? new Date(task.endDate).toLocaleDateString('zh-CN')
                                    : '-'}
                                </span>
                              </div>
                              {(task.actualStartAt || task.actualEndAt) && (
                                <div className="flex items-center gap-1.5 col-span-2">
                                  <CheckCircle2 size={10} className="text-green-400 shrink-0" />
                                  <span className="text-green-400/80">实际：</span>
                                  <span className="text-green-400">
                                    {task.actualStartAt
                                      ? new Date(task.actualStartAt).toLocaleDateString('zh-CN')
                                      : '-'}
                                    {' → '}
                                    {task.actualEndAt
                                      ? new Date(task.actualEndAt).toLocaleDateString('zh-CN')
                                      : '-'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
                <h4 className="text-sm font-medium text-moto-silver mb-3">联系信息</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-moto-steel" />
                    <span className="text-moto-silver">{currentCustomer.phone}</span>
                  </div>
                  {currentCustomer.contact && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-moto-steel" />
                      <span className="text-moto-silver">{currentCustomer.contact}</span>
                    </div>
                  )}
                  {currentCustomer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-moto-steel" />
                      <span className="text-moto-silver">{currentCustomer.email}</span>
                    </div>
                  )}
                  {currentCustomer.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={14} className="text-moto-steel mt-0.5 shrink-0" />
                      <span className="text-moto-silver">{currentCustomer.address}</span>
                    </div>
                  )}
                  {currentCustomer.birthday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-moto-steel" />
                      <span className="text-moto-silver">{currentCustomer.birthday}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
                <h4 className="text-sm font-medium text-moto-silver mb-3">客户标签</h4>
                {currentCustomer.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentCustomer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-full text-xs"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-moto-steel">暂无标签</p>
                )}
                {currentCustomer.remark && (
                  <div className="mt-4 pt-4 border-t border-carbon-500/20">
                    <p className="text-xs text-moto-steel mb-1">备注信息</p>
                    <p className="text-sm text-moto-silver">{currentCustomer.remark}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-moto-silver">名下车辆</h4>
                <button className="flex items-center gap-1 text-xs text-moto-orange hover:text-moto-orange/80 transition-colors">
                  <Plus size={12} />
                  添加车辆
                </button>
              </div>
              {currentCustomer.vehicles.length > 0 ? (
                <div className="space-y-3">
                  {currentCustomer.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3 bg-carbon-800 rounded-lg border border-carbon-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-carbon-700 flex items-center justify-center">
                          <Car size={20} className="text-moto-orange" />
                        </div>
                        <div>
                          <p className="text-sm text-moto-silver font-medium">
                            {vehicle.licensePlate}
                          </p>
                          <p className="text-xs text-moto-steel">
                            {vehicle.modelName}
                            {vehicle.color && ` · ${vehicle.color}`}
                            {vehicle.mileage ? ` · ${vehicle.mileage.toLocaleString()} km` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-moto-steel hover:text-moto-silver transition-colors">
                          <Edit size={14} />
                        </button>
                        <button className="p-1.5 text-moto-steel hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-moto-steel">
                  <Car size={36} className="mb-2 opacity-30" />
                  <p className="text-sm">暂无车辆信息</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-moto-steel">
            <User size={64} className="mb-4 opacity-20" />
            <p className="text-lg mb-2">选择或新建客户</p>
            <p className="text-sm opacity-60">从左侧列表选择客户查看详情，或点击新建客户创建档案</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-lg text-sm hover:bg-moto-orange/20 transition-colors"
            >
              <UserPlus size={16} />
              新建客户档案
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
