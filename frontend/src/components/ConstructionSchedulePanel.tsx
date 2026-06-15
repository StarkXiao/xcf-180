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
  Loader2,
  X,
  Save,
  UserPlus,
  Timer,
} from 'lucide-react'
import {
  CONSTRUCTION_PHASE_LABELS,
  CONSTRUCTION_PHASE_ORDER,
  CONSTRUCTION_TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  type ConstructionTaskStatus,
  type ConstructionPhase,
  type RequirementPriority,
} from '@/types'
import type { ConstructionTask, UpdateConstructionTaskRequest } from '@/types'

const STATUS_OPTIONS: { value: ConstructionTaskStatus; label: string; icon: any }[] = [
  { value: 'pending', label: '待开始', icon: CircleDashed },
  { value: 'in_progress', label: '进行中', icon: Play },
  { value: 'paused', label: '已暂停', icon: Pause },
  { value: 'completed', label: '已完成', icon: CheckCircle2 },
  { value: 'blocked', label: '已阻塞', icon: AlertTriangle },
]

const PRIORITY_OPTIONS: { value: RequirementPriority; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'medium', label: '中', color: 'text-moto-silver bg-carbon-700 border-carbon-500/30' },
  { value: 'high', label: '高', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
]

const WORKERS = [
  { id: 'w1', name: '张师傅', role: '高级技师', avatar: '👨‍🔧' },
  { id: 'w2', name: '李师傅', role: '改装技师', avatar: '🧑‍🔧' },
  { id: 'w3', name: '王师傅', role: '电器技师', avatar: '👨‍💼' },
  { id: 'w4', name: '赵师傅', role: '喷漆技师', avatar: '👨‍🎨' },
]

interface TaskEditForm {
  name: string
  description: string
  priority: RequirementPriority
  estimatedHours: number
  actualHours: number
  assignedTo: string[]
  startDate: string
  endDate: string
  order: number
}

function formatDateForInput(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN')
}

export default function ConstructionSchedulePanel() {
  const {
    currentCustomer,
    currentQuote,
    currentSchedule,
    createScheduleFromQuote,
    setCurrentSchedule,
    setReceptionActiveTab,
    updateScheduleTask,
    updateSchedule,
  } = useStore()

  const [expandedPhase, setExpandedPhase] = useState<ConstructionPhase | 'all'>('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<ConstructionTask | null>(null)
  const [taskForm, setTaskForm] = useState<TaskEditForm | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [editingScheduleDates, setEditingScheduleDates] = useState(false)
  const [scheduleStartDate, setScheduleStartDate] = useState('')
  const [scheduleEndDate, setScheduleEndDate] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)

  const tasks = useMemo<ConstructionTask[]>(() => {
    return currentSchedule?.tasks || []
  }, [currentSchedule])

  const totalEstimated = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
    [tasks]
  )
  const totalActual = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
    [tasks]
  )
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks]
  )
  const progress = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((completedCount / tasks.length) * 100)
  }, [tasks, completedCount])

  const groupedTasks = useMemo(
    () =>
      CONSTRUCTION_PHASE_ORDER.map((phase) => ({
        phase,
        tasks: tasks.filter((t) => t.phase === phase),
      })).filter((g) => g.tasks.length > 0),
    [tasks]
  )

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
        alert(`施工排期「${(schedule as any).scheduleNo || schedule.id}」创建成功！`)
      }
    } catch (e) {
      console.error(e)
      alert('创建施工排期失败')
    } finally {
      setGenerating(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: ConstructionTaskStatus) => {
    if (!currentSchedule?.id) return
    setUpdatingTaskId(taskId)
    try {
      const now = new Date().toISOString()
      const updates: any = { status }
      if (status === 'in_progress') {
        updates.actualStartAt = now
      }
      if (status === 'completed') {
        updates.completedAt = now
        updates.actualEndAt = now
      }
      const updatedSchedule = await updateScheduleTask(currentSchedule.id, taskId, updates)
      if (updatedSchedule) {
        setCurrentSchedule(updatedSchedule)
      }
    } catch (e) {
      console.error('Failed to update task status:', e)
      alert('更新任务状态失败')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const openEditTask = (task: ConstructionTask) => {
    setEditingTask(task)
    setTaskForm({
      name: task.name,
      description: task.description || '',
      priority: (task.priority as RequirementPriority) || 'medium',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      assignedTo: [...(task.assignedTo || [])],
      startDate: formatDateForInput(task.startDate || task.startAt),
      endDate: formatDateForInput(task.endDate || task.endAt),
      order: task.order || 0,
    })
  }

  const closeEditTask = () => {
    setEditingTask(null)
    setTaskForm(null)
  }

  const toggleWorker = (workerId: string) => {
    if (!taskForm) return
    const current = taskForm.assignedTo
    const next = current.includes(workerId)
      ? current.filter((id) => id !== workerId)
      : [...current, workerId]
    setTaskForm({ ...taskForm, assignedTo: next })
  }

  const handleSaveTask = async () => {
    if (!editingTask || !taskForm || !currentSchedule?.id) return
    setSavingTask(true)
    try {
      const assignedWorkerNames = taskForm.assignedTo
        .map((id) => WORKERS.find((w) => w.id === id)?.name)
        .filter(Boolean) as string[]

      const updates: UpdateConstructionTaskRequest = {
        name: taskForm.name,
        description: taskForm.description,
        priority: taskForm.priority,
        estimatedHours: taskForm.estimatedHours,
        actualHours: taskForm.actualHours,
        assignedTo: taskForm.assignedTo,
        assignedWorkerNames,
        startDate: taskForm.startDate || undefined,
        endDate: taskForm.endDate || undefined,
        order: taskForm.order,
      }

      const updatedSchedule = await updateScheduleTask(currentSchedule.id, editingTask.id, updates)
      if (updatedSchedule) {
        setCurrentSchedule(updatedSchedule)
        closeEditTask()
      }
    } catch (e) {
      console.error('Failed to save task:', e)
      alert('保存任务失败')
    } finally {
      setSavingTask(false)
    }
  }

  const openEditScheduleDates = () => {
    if (!currentSchedule) return
    setScheduleStartDate(formatDateForInput(currentSchedule.plannedStartDate))
    setScheduleEndDate(formatDateForInput(currentSchedule.plannedEndDate))
    setEditingScheduleDates(true)
  }

  const closeEditScheduleDates = () => {
    setEditingScheduleDates(false)
  }

  const handleSaveScheduleDates = async () => {
    if (!currentSchedule?.id || !scheduleStartDate || !scheduleEndDate) return
    if (new Date(scheduleStartDate) > new Date(scheduleEndDate)) {
      alert('开始日期不能晚于结束日期')
      return
    }
    setSavingSchedule(true)
    try {
      const updatedSchedule = await updateSchedule(currentSchedule.id, {
        plannedStartDate: new Date(scheduleStartDate).toISOString(),
        plannedEndDate: new Date(scheduleEndDate).toISOString(),
      })
      if (updatedSchedule) {
        setCurrentSchedule(updatedSchedule)
        closeEditScheduleDates()
      }
    } catch (e) {
      console.error('Failed to save schedule dates:', e)
      alert('保存工期失败')
    } finally {
      setSavingSchedule(false)
    }
  }

  const getWorkerInfo = (workerId: string) => {
    return WORKERS.find((w) => w.id === workerId)
  }

  const hasRealSchedule = (currentSchedule?.tasks?.length || 0) > 0
  const scheduleNo = (currentSchedule as any)?.scheduleNo || (currentSchedule?.id ? `排期#${currentSchedule.id.slice(-6)}` : '')

  const plannedStartDate = currentSchedule?.plannedStartDate
  const plannedEndDate = currentSchedule?.plannedEndDate
  const scheduleProgress = currentSchedule?.progress ?? progress

  const workerTaskStats = useMemo(() => {
    return WORKERS.map((worker) => {
      const workerTasks = tasks.filter((t) => (t.assignedTo || []).includes(worker.id))
      const activeTask = workerTasks.find((t) => t.status === 'in_progress')
      const pendingCount = workerTasks.filter((t) => t.status === 'pending').length
      const completedCount = workerTasks.filter((t) => t.status === 'completed').length
      const totalHours = workerTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
      return { ...worker, workerTasks, activeTask, pendingCount, completedCount, totalHours }
    })
  }, [tasks])

  if (!hasRealSchedule && !currentQuote) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-carbon-500/30 flex items-center justify-between">
          <div>
            <h3 className="font-orbitron text-lg text-moto-silver font-bold flex items-center gap-2">
              <Calendar size={20} className="text-moto-orange" />
              施工排期
            </h3>
            <p className="text-xs text-moto-steel mt-0.5">暂无施工排期</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-carbon-800 flex items-center justify-center mx-auto mb-4">
              <Calendar size={36} className="text-moto-steel opacity-40" />
            </div>
            <p className="text-moto-silver font-medium mb-2">暂无施工排期</p>
            <p className="text-sm text-moto-steel opacity-70 mb-6 max-w-sm">
              请先在「现场选配」和「预算测算」中完成客户的配件选型和报价确认，再生成施工排期。
            </p>
            <button
              onClick={() => setReceptionActiveTab('selection')}
              className="px-6 py-2.5 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange/90 transition-colors"
            >
              前往现场选配
            </button>
          </div>
        </div>
      </div>
    )
  }

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
                {scheduleNo}
              </span>
            )}
            {currentQuote && !currentSchedule && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-medium">
                <FileText size={12} />
                关联报价 {currentQuote.quoteNo}
              </span>
            )}
            {updatingTaskId && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs">
                <RefreshCw size={12} className="animate-spin" />
                同步中...
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

      {hasRealSchedule && (
        <>
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
                  <p className="font-orbitron text-2xl text-green-400">{scheduleProgress}%</p>
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
                <span className="text-xs text-moto-silver font-medium">{scheduleProgress}%</span>
              </div>
              <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-moto-orange to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${scheduleProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {groupedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <ListTodo size={40} className="text-moto-steel opacity-30 mb-3" />
                    <p className="text-moto-silver font-medium">暂无施工任务</p>
                    <p className="text-sm text-moto-steel opacity-70 mt-1">
                      点击右上方「新建任务」添加施工任务
                    </p>
                  </div>
                ) : (
                  groupedTasks.map(({ phase, tasks: phaseTasks }) => {
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
                              const isUpdating = updatingTaskId === task.id
                              const priorityConfig = PRIORITY_OPTIONS.find(
                                (p) => p.value === task.priority
                              )
                              return (
                                <div
                                  key={task.id}
                                  className={`p-4 hover:bg-carbon-800/30 transition-colors ${
                                    isUpdating ? 'bg-blue-500/5' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                            CONSTRUCTION_TASK_STATUS_COLORS[task.status]
                                          }`}
                                        >
                                          {isUpdating ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : (
                                            <StatusIcon size={10} />
                                          )}
                                          {statusConfig.label}
                                        </span>
                                        {priorityConfig && task.priority !== 'medium' && (
                                          <span
                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded border ${priorityConfig.color}`}
                                          >
                                            {priorityConfig.label}优先
                                          </span>
                                        )}
                                        {(task.assignedTo || []).length > 0 && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-moto-steel bg-carbon-700 rounded">
                                            <User size={8} />
                                            {(task.assignedTo || []).length} 人
                                          </span>
                                        )}
                                        {(task.startDate || task.startAt) && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-moto-steel bg-carbon-700 rounded">
                                            <Calendar size={8} />
                                            {formatDate(task.startDate || task.startAt)}
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
                                    <button
                                      onClick={() => openEditTask(task)}
                                      className="p-1.5 text-moto-steel hover:text-moto-silver hover:bg-carbon-700 rounded transition-colors"
                                      title="编辑任务"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-4 text-xs text-moto-steel flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={12} />
                                      工位 #{task.order ?? '-'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Timer size={12} />
                                      预计 {task.estimatedHours}h
                                      {(task.actualHours || 0) > 0 && (
                                        <span className="text-moto-silver">
                                          · 已用 {task.actualHours}h
                                        </span>
                                      )}
                                    </div>
                                    {(task.startDate || task.startAt) && (task.endDate || task.endAt) && (
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        {formatDate(task.startDate || task.startAt)} → {formatDate(task.endDate || task.endAt)}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-carbon-500/10">
                                    <div className="flex items-center gap-2">
                                      <Users size={12} className="text-moto-steel" />
                                      <div className="flex -space-x-1">
                                        {(task.assignedTo || []).map((workerId) => {
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
                                        const isActive = task.status === opt.value
                                        return (
                                          <button
                                            key={opt.value}
                                            onClick={() =>
                                              !isUpdating &&
                                              !isActive &&
                                              updateTaskStatus(task.id, opt.value)
                                            }
                                            disabled={isUpdating}
                                            className={`p-1.5 rounded transition-colors ${
                                              isActive
                                                ? 'bg-moto-orange/20 text-moto-orange'
                                                : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700'
                                            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={opt.label}
                                          >
                                            {isUpdating && isActive ? (
                                              <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                              <Icon size={14} />
                                            )}
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
                  })
                )}
              </div>
            </div>

            <div className="w-72 shrink-0 border-l border-carbon-500/30 bg-carbon-900/50 overflow-y-auto">
              <div className="p-4 border-b border-carbon-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-orbitron text-moto-silver font-semibold flex items-center gap-2">
                    <Calendar size={16} className="text-moto-orange" />
                    工期概览
                  </h4>
                  <button
                    onClick={openEditScheduleDates}
                    className="p-1 text-moto-steel hover:text-moto-silver transition-colors"
                    title="编辑工期"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-moto-steel">计划开始</span>
                    <span className="text-xs text-moto-silver">
                      {plannedStartDate
                        ? new Date(plannedStartDate).toLocaleDateString('zh-CN')
                        : '未设置'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-moto-steel">计划交付</span>
                    <span className="text-xs text-moto-silver">
                      {plannedEndDate
                        ? new Date(plannedEndDate).toLocaleDateString('zh-CN')
                        : '未设置'}
                    </span>
                  </div>
                  {plannedStartDate && plannedEndDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-moto-steel">预计工期</span>
                      <span className="text-xs text-moto-silver">
                        {Math.ceil(
                          (new Date(plannedEndDate).getTime() -
                            new Date(plannedStartDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        个工作日
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-carbon-500/20 flex items-center justify-between">
                    <span className="text-xs text-moto-steel">施工状态</span>
                    <span
                      className={`text-xs font-medium ${
                        currentSchedule?.status === 'completed'
                          ? 'text-green-400'
                          : currentSchedule?.status === 'in_progress'
                          ? 'text-moto-orange'
                          : currentSchedule?.status === 'delayed'
                          ? 'text-red-400'
                          : 'text-moto-steel'
                      }`}
                    >
                      {currentSchedule?.status === 'completed'
                        ? '已完成'
                        : currentSchedule?.status === 'in_progress'
                        ? '进行中'
                        : currentSchedule?.status === 'delayed'
                        ? '已延期'
                        : currentSchedule?.status === 'scheduled'
                        ? '已排期'
                        : '待开始'}
                    </span>
                  </div>
                </div>

                {currentSchedule?.remark && (
                  <div className="mt-4 p-3 bg-moto-orange/5 rounded-lg border border-moto-orange/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-moto-orange shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-moto-orange font-medium">备注</p>
                        <p className="text-[10px] text-moto-steel mt-0.5">
                          {currentSchedule.remark}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentQuote && (
                  <div className="mt-4 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <FileText size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-400 font-medium">关联报价</p>
                        <p className="text-[10px] text-moto-silver mt-0.5 truncate">
                          {currentQuote.quoteNo} · ¥
                          {(currentQuote.totalAmount || 0)
                            .toFixed(0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h4 className="font-orbitron text-moto-silver font-semibold flex items-center gap-2 mb-3">
                  <Users size={16} className="text-moto-orange" />
                  施工人员
                </h4>
                <div className="space-y-2">
                  {workerTaskStats.map((worker) => {
                    const { workerTasks, activeTask, pendingCount, completedCount, totalHours } = worker
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
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-moto-steel">
                          <div>
                            <span className="block text-green-400">{completedCount}</span>
                            已完成
                          </div>
                          <div>
                            <span className="block text-moto-orange">{pendingCount}</span>
                            待开始
                          </div>
                          <div>
                            <span className="block text-moto-silver">{totalHours}h</span>
                            总工时
                          </div>
                        </div>
                        <div className="text-[10px] text-moto-steel mt-2">
                          {activeTask ? (
                            <span className="text-green-400">
                              正在：{activeTask.name}
                            </span>
                          ) : pendingCount > 0 ? (
                            <span className="text-moto-orange">
                              待开始 {pendingCount} 项
                            </span>
                          ) : workerTasks.length > 0 ? (
                            <span className="text-moto-steel">任务已全部完成</span>
                          ) : (
                            <span className="text-moto-steel">暂无任务分配</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!hasRealSchedule && currentQuote && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-carbon-800 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={36} className="text-green-400 opacity-60" />
            </div>
            <p className="text-moto-silver font-medium mb-2">一键生成施工排期</p>
            <p className="text-sm text-moto-steel opacity-70 mb-6 max-w-md">
              系统将根据报价单中的配件分类，自动生成完整的施工任务流程，包括车辆检查、部件拆卸、配件准备、安装调试、最终质检等阶段。
            </p>
            <button
              onClick={handleGenerateFromQuote}
              disabled={generating}
              className="px-8 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generating ? '正在生成...' : '一键生成施工任务'}
            </button>
          </div>
        </div>
      )}

      {editingTask && taskForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-900 border border-carbon-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-carbon-500/20">
              <div>
                <h3 className="font-orbitron text-lg text-moto-silver font-semibold">
                  编辑施工任务
                </h3>
                <p className="text-xs text-moto-steel mt-1">
                  {TASK_STATUS_LABELS[editingTask.status]} · {CONSTRUCTION_PHASE_LABELS[editingTask.phase]}
                </p>
              </div>
              <button
                onClick={closeEditTask}
                className="p-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs text-moto-steel mb-2 font-medium">
                  任务名称
                </label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  placeholder="请输入任务名称"
                />
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-2 font-medium">
                  任务描述
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors resize-none"
                  placeholder="请输入任务描述（可选）"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium">
                    优先级
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as RequirementPriority })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium">
                    预估工时 (h)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={taskForm.estimatedHours}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium">
                    实际工时 (h)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={taskForm.actualHours}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, actualHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium flex items-center gap-1">
                    <Calendar size={11} />
                    计划开始日期
                  </label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium flex items-center gap-1">
                    <Calendar size={11} />
                    计划完成日期
                  </label>
                  <input
                    type="date"
                    value={taskForm.endDate}
                    onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-3 font-medium flex items-center gap-1">
                  <UserPlus size={11} />
                  分配施工人员
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {WORKERS.map((worker) => {
                    const isSelected = taskForm.assignedTo.includes(worker.id)
                    return (
                      <button
                        key={worker.id}
                        type="button"
                        onClick={() => toggleWorker(worker.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-moto-orange/10 border-moto-orange/40 text-moto-silver'
                            : 'bg-carbon-800 border-carbon-500/20 text-moto-steel hover:border-carbon-500/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-carbon-700 flex items-center justify-center text-base">
                          {worker.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{worker.name}</p>
                          <p className="text-[10px] opacity-70">{worker.role}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-moto-orange" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-moto-steel mb-2 font-medium">
                  工位序号
                </label>
                <input
                  type="number"
                  min={0}
                  value={taskForm.order}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
              </div>
            </div>

            <div className="p-5 border-t border-carbon-500/20 flex items-center justify-end gap-3">
              <button
                onClick={closeEditTask}
                className="px-5 py-2.5 text-moto-steel hover:text-moto-silver text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTask}
                disabled={savingTask || !taskForm.name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange/90 transition-colors disabled:opacity-50"
              >
                {savingTask ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingTask ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingScheduleDates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-carbon-900 border border-carbon-500/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-carbon-500/20">
              <h3 className="font-orbitron text-lg text-moto-silver font-semibold">
                调整施工工期
              </h3>
              <button
                onClick={closeEditScheduleDates}
                className="p-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium flex items-center gap-1">
                    <Calendar size={11} />
                    计划开始日期
                  </label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-moto-steel mb-2 font-medium flex items-center gap-1">
                    <Calendar size={11} />
                    计划交付日期
                  </label>
                  <input
                    type="date"
                    value={scheduleEndDate}
                    onChange={(e) => setScheduleEndDate(e.target.value)}
                    className="w-full bg-carbon-800 rounded-lg px-4 py-2.5 border border-carbon-500/30 text-moto-silver text-sm focus:outline-none focus:border-moto-orange/50 transition-colors"
                  />
                </div>
              </div>

              {scheduleStartDate && scheduleEndDate && (
                <div className="p-4 bg-carbon-800/50 rounded-lg border border-carbon-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-moto-steel">预计工期</span>
                    <span className="text-moto-silver font-orbitron">
                      {Math.ceil(
                        (new Date(scheduleEndDate).getTime() -
                          new Date(scheduleStartDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      个工作日
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-carbon-500/20 flex items-center justify-end gap-3">
              <button
                onClick={closeEditScheduleDates}
                className="px-5 py-2.5 text-moto-steel hover:text-moto-silver text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveScheduleDates}
                disabled={savingSchedule || !scheduleStartDate || !scheduleEndDate}
                className="flex items-center gap-2 px-6 py-2.5 bg-moto-orange text-white rounded-lg text-sm font-medium hover:bg-moto-orange/90 transition-colors disabled:opacity-50"
              >
                {savingSchedule ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingSchedule ? '保存中...' : '保存工期'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
