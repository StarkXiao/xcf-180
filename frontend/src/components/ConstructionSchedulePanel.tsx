import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  Play,
  Pause,
  Edit3,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Gauge,
  MapPin,
  FileText,
  Sparkles,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import {
  CONSTRUCTION_PHASE_LABELS,
  CONSTRUCTION_PHASE_ORDER,
  CONSTRUCTION_TASK_STATUS_COLORS,
  type ConstructionTaskStatus,
  type ConstructionPhase,
} from '@/types'
import type { ConstructionTask } from '@/types'

const STATUS_OPTIONS: { value: ConstructionTaskStatus; label: string; icon: any }[] = [
  { value: 'pending', label: '待开始', icon: CircleDashed },
  { value: 'in_progress', label: '进行中', icon: Play },
  { value: 'paused', label: '已暂停', icon: Pause },
  { value: 'completed', label: '已完成', icon: CheckCircle2 },
  { value: 'blocked', label: '已阻塞', icon: AlertTriangle },
]

const WORKERS = [
  { id: 'w1', name: '张师傅', role: '高级技师', avatar: '👨‍🔧' },
  { id: 'w2', name: '李师傅', role: '改装技师', avatar: '🧑‍🔧' },
  { id: 'w3', name: '王师傅', role: '电器技师', avatar: '👨‍💼' },
  { id: 'w4', name: '赵师傅', role: '喷漆技师', avatar: '👨‍🎨' },
]

const MOCK_TASKS: ConstructionTask[] = [
  {
    id: 't1',
    name: '车辆检查与评估',
    description: '全面检查车辆状况，评估改装可行性',
    phase: 'inspection',
    status: 'completed',
    priority: 'high',
    assignedTo: ['w1'],
    assignedWorkerNames: ['张师傅'],
    estimatedHours: 2,
    actualHours: 1.5,
    startDate: '2024-01-15T09:00:00',
    endDate: '2024-01-15T11:00:00',
    completedAt: '2024-01-15T10:30:00',
    order: 1,
  },
  {
    id: 't2',
    name: '原厂部件拆卸',
    description: '拆卸原厂排气、卡钳等需更换部件',
    phase: 'disassembly',
    status: 'completed',
    priority: 'high',
    assignedTo: ['w1', 'w2'],
    assignedWorkerNames: ['张师傅', '李师傅'],
    estimatedHours: 4,
    actualHours: 3.5,
    startDate: '2024-01-15T14:00:00',
    endDate: '2024-01-15T18:00:00',
    completedAt: '2024-01-15T17:30:00',
    order: 2,
  },
  {
    id: 't3',
    name: '配件准备与质检',
    description: '核对改装配件清单，检查配件质量与兼容性',
    phase: 'parts_prep',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: ['w3'],
    assignedWorkerNames: ['王师傅'],
    estimatedHours: 3,
    actualHours: 1,
    startDate: '2024-01-16T09:00:00',
    endDate: '2024-01-16T12:00:00',
    order: 3,
  },
  {
    id: 't4',
    name: '排气系统安装',
    description: '安装天蝎碳纤维全段排气系统',
    phase: 'installation',
    status: 'pending',
    priority: 'high',
    assignedTo: ['w1', 'w2'],
    assignedWorkerNames: ['张师傅', '李师傅'],
    estimatedHours: 6,
    actualHours: 0,
    order: 4,
  },
  {
    id: 't5',
    name: '制动系统安装',
    description: '安装Brembo M40卡钳、加大碟盘与钢喉',
    phase: 'installation',
    status: 'pending',
    priority: 'high',
    assignedTo: ['w1'],
    assignedWorkerNames: ['张师傅'],
    estimatedHours: 5,
    actualHours: 0,
    order: 5,
  },
  {
    id: 't6',
    name: '调试与路试',
    description: '电脑调试、排气声浪调校、道路测试',
    phase: 'testing',
    status: 'pending',
    priority: 'high',
    assignedTo: ['w1', 'w3'],
    assignedWorkerNames: ['张师傅', '王师傅'],
    estimatedHours: 4,
    actualHours: 0,
    order: 6,
  },
  {
    id: 't7',
    name: '最终质检与交车',
    description: '全面质量检查，清洁车辆，准备交付',
    phase: 'final_check',
    status: 'pending',
    priority: 'medium',
    assignedTo: ['w1'],
    assignedWorkerNames: ['张师傅'],
    estimatedHours: 2,
    actualHours: 0,
    order: 7,
  },
]

export default function ConstructionSchedulePanel() {
  const {
    currentCustomer,
    currentQuote,
    currentSchedule,
    createScheduleFromQuote,
    setCurrentSchedule,
    setReceptionActiveTab,
  } = useStore()
  const [tasks, setTasks] = useState<ConstructionTask[]>(() => {
    if (currentSchedule?.tasks && currentSchedule.tasks.length > 0) {
      return currentSchedule.tasks
    }
    return MOCK_TASKS
  })
  const [expandedPhase, setExpandedPhase] = useState<ConstructionPhase | 'all'>('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [generating, setGenerating] = useState(false)

  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  const totalActual = tasks.reduce((sum, t) => sum + t.actualHours, 0)
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const progress = Math.round((completedCount / tasks.length) * 100)

  const groupedTasks = CONSTRUCTION_PHASE_ORDER.map((phase) => ({
    phase,
    tasks: tasks.filter((t) => t.phase === phase),
  })).filter((g) => g.tasks.length > 0)

  const updateTaskStatus = (taskId: string, status: ConstructionTaskStatus) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
            }
          : t
      )
    )
  }

  const getWorkerInfo = (workerId: string) => {
    return WORKERS.find((w) => w.id === workerId)
  }

  const handleGenerateFromQuote = async () => {
    if (!currentCustomer) {
      alert('请先在「客户建档」中选择客户')
      setReceptionActiveTab('customer')
      return
    }
    if (!currentQuote) {
      alert('请先生成报价单，再创建施工排期')
      setReceptionActiveTab('budget')
      return
    }
    setGenerating(true)
    try {
      const schedule = await createScheduleFromQuote({
        quoteId: currentQuote.id,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        quoteNo: currentQuote.quoteNo,
        totalAmount: currentQuote.totalAmount || 0,
        autoGenerateTasks: true,
      })
      if (schedule) {
        setCurrentSchedule(schedule)
        if (schedule.tasks && schedule.tasks.length > 0) {
          setTasks(schedule.tasks)
        }
        alert(`施工排期「${(schedule as any).scheduleNo || schedule.id}」创建成功！`)
      }
    } catch (e) {
      console.error(e)
      alert('创建施工排期失败')
    } finally {
      setGenerating(false)
    }
  }

  const hasRealSchedule = (currentSchedule?.tasks?.length || 0) > 0

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-orbitron text-lg text-moto-silver font-bold flex items-center gap-2">
              <Calendar size={20} className="text-moto-orange" />
              施工排期
            </h3>
            {currentSchedule && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                <ListTodo size={12} />
                {(currentSchedule as any).scheduleNo || `排期#${currentSchedule.id.slice(-6)}`}
              </span>
            )}
            {currentQuote && !currentSchedule && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-medium">
                <FileText size={12} />
                关联报价 {currentQuote.quoteNo}
              </span>
            )}
          </div>
          <p className="text-xs text-moto-steel mt-0.5">
            {currentCustomer
              ? `${currentCustomer.name} 的改装项目`
              : '请先选择客户'}
            {currentQuote && ` · 基于报价 ${currentQuote.quoteNo}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasRealSchedule && currentQuote && (
            <button
              onClick={handleGenerateFromQuote}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600/90 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generating ? '生成中...' : '一键生成施工任务'}
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg text-sm transition-colors">
            <Users size={16} />
            人员管理
          </button>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              showAddTask
                ? 'bg-carbon-700 text-moto-silver'
                : 'bg-moto-orange/10 text-moto-orange border border-moto-orange/30 hover:bg-moto-orange/20'
            }`}
          >
            <Plus size={16} />
            新建任务
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-carbon-500/30 bg-carbon-800/30">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListTodo size={16} className="text-moto-steel" />
              <span className="text-xs text-moto-steel">总任务数</span>
            </div>
            <p className="font-orbitron text-2xl text-moto-silver">{tasks.length}</p>
          </div>
          <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-moto-steel">完成进度</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="font-orbitron text-2xl text-green-400">{progress}%</p>
              <p className="text-xs text-moto-steel">
                {completedCount}/{tasks.length}
              </p>
            </div>
          </div>
          <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-moto-orange" />
              <span className="text-xs text-moto-steel">预计工时</span>
            </div>
            <p className="font-orbitron text-2xl text-moto-orange">{totalEstimated}h</p>
          </div>
          <div className="bg-carbon-800/50 rounded-lg border border-carbon-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={16} className="text-moto-silver" />
              <span className="text-xs text-moto-steel">已用工时</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="font-orbitron text-2xl text-moto-silver">{totalActual}h</p>
              <p className="text-xs text-moto-steel">/ {totalEstimated}h</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-moto-steel">整体进度</span>
            <span className="text-xs text-moto-silver font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-moto-orange to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {groupedTasks.map(({ phase, tasks: phaseTasks }) => {
              const isExpanded = expandedPhase === 'all' || expandedPhase === phase
              const phaseProgress = Math.round(
                (phaseTasks.filter((t) => t.status === 'completed').length / phaseTasks.length) *
                  100
              )
              return (
                <div
                  key={phase}
                  className="bg-carbon-800/50 rounded-xl border border-carbon-500/20 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedPhase(expandedPhase === phase ? 'all' : phase)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-carbon-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-moto-orange/10 flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-moto-orange" />
                        ) : (
                          <ChevronDown size={20} className="text-moto-orange" />
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-moto-silver">
                          {CONSTRUCTION_PHASE_LABELS[phase]}
                        </h4>
                        <p className="text-xs text-moto-steel">
                          {phaseTasks.filter((t) => t.status === 'completed').length}/
                          {phaseTasks.length} 项已完成
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-carbon-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-moto-orange rounded-full"
                          style={{ width: `${phaseProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-orbitron text-moto-orange w-10 text-right">
                        {phaseProgress}%
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-carbon-500/20 divide-y divide-carbon-500/20">
                      {phaseTasks.map((task) => {
                        const statusConfig = STATUS_OPTIONS.find(
                          (s) => s.value === task.status
                        ) || STATUS_OPTIONS[0]
                        const StatusIcon = statusConfig.icon
                        return (
                          <div
                            key={task.id}
                            className="p-4 hover:bg-carbon-800/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                      CONSTRUCTION_TASK_STATUS_COLORS[task.status]
                                    }`}
                                  >
                                    <StatusIcon size={10} />
                                    {statusConfig.label}
                                  </span>
                                  {task.priority === 'high' && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded">
                                      <AlertTriangle size={8} />
                                      高优先
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-sm font-medium text-moto-silver">
                                  {task.name}
                                </h5>
                                {task.description && (
                                  <p className="text-xs text-moto-steel mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <button className="p-1.5 text-moto-steel hover:text-moto-silver transition-colors">
                                <Edit3 size={14} />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-moto-steel">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} />
                                工位 #{task.order}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} />
                                预计 {task.estimatedHours}h
                                {task.actualHours > 0 && (
                                  <span className="text-moto-silver">
                                    · 已用 {task.actualHours}h
                                  </span>
                                )}
                              </div>
                              {task.startDate && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={12} />
                                  {new Date(task.startDate).toLocaleDateString('zh-CN')}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-carbon-500/10">
                              <div className="flex items-center gap-2">
                                <Users size={12} className="text-moto-steel" />
                                <div className="flex -space-x-1">
                                  {task.assignedTo.map((workerId) => {
                                    const worker = getWorkerInfo(workerId)
                                    return worker ? (
                                      <div
                                        key={workerId}
                                        className="w-6 h-6 rounded-full bg-carbon-700 flex items-center justify-center text-xs border border-carbon-800"
                                        title={worker.name}
                                      >
                                        {worker.avatar}
                                      </div>
                                    ) : null
                                  })}
                                </div>
                                <span className="text-xs text-moto-steel">
                                  {task.assignedWorkerNames?.join('、') || '未分配'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {STATUS_OPTIONS.map((opt) => {
                                  const Icon = opt.icon
                                  return (
                                    <button
                                      key={opt.value}
                                      onClick={() => updateTaskStatus(task.id, opt.value)}
                                      className={`p-1.5 rounded transition-colors ${
                                        task.status === opt.value
                                          ? 'bg-moto-orange/20 text-moto-orange'
                                          : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700'
                                      }`}
                                      title={opt.label}
                                    >
                                      <Icon size={14} />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-72 shrink-0 border-l border-carbon-500/30 bg-carbon-900/50 overflow-y-auto">
          <div className="p-4 border-b border-carbon-500/30">
            <h4 className="font-orbitron text-moto-silver font-semibold flex items-center gap-2 mb-3">
              <Users size={16} className="text-moto-orange" />
              施工人员
            </h4>
            <div className="space-y-2">
              {WORKERS.map((worker) => {
                const workerTasks = tasks.filter((t) => t.assignedTo.includes(worker.id))
                const activeTask = workerTasks.find(
                  (t) => t.status === 'in_progress'
                )
                return (
                  <div
                    key={worker.id}
                    className="p-3 bg-carbon-800 rounded-lg border border-carbon-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-carbon-700 flex items-center justify-center text-lg">
                        {worker.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-moto-silver font-medium">
                          {worker.name}
                        </p>
                        <p className="text-[10px] text-moto-steel">{worker.role}</p>
                      </div>
                      {activeTask ? (
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-moto-steel" />
                      )}
                    </div>
                    <div className="text-[10px] text-moto-steel">
                      {activeTask ? (
                        <span className="text-green-400">
                          正在进行：{activeTask.name}
                        </span>
                      ) : workerTasks.some((t) => t.status === 'pending') ? (
                        <span className="text-moto-orange">
                          待开始 {workerTasks.filter((t) => t.status === 'pending').length} 项
                        </span>
                      ) : (
                        <span className="text-moto-steel">暂无任务</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4">
            <h4 className="font-orbitron text-moto-silver font-semibold flex items-center gap-2 mb-3">
              <Gauge size={16} className="text-moto-orange" />
              工期概览
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-moto-steel">计划开始</span>
                <span className="text-xs text-moto-silver">2024-01-15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-moto-steel">计划交付</span>
                <span className="text-xs text-moto-silver">2024-01-18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-moto-steel">预计工期</span>
                <span className="text-xs text-moto-silver">4 个工作日</span>
              </div>
              <div className="pt-3 border-t border-carbon-500/20 flex items-center justify-between">
                <span className="text-xs text-moto-steel">剩余工期</span>
                <span className="text-xs text-moto-orange font-medium">约 2.5 天</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-moto-orange/5 rounded-lg border border-moto-orange/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-moto-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-moto-orange font-medium">提示</p>
                  <p className="text-[10px] text-moto-steel mt-0.5">
                    排气系统安装需在配件质检完成后开始，预计耗时较长，请合理安排工位。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
