import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import {
  Users,
  FileText,
  Package,
  Calculator,
  CalendarClock,
  Bell,
  Search,
  Sparkles,
  CircleDot,
} from 'lucide-react'
import CustomerProfilePanel from '@/components/CustomerProfilePanel'
import RequirementRecordPanel from '@/components/RequirementRecordPanel'
import OnSiteSelectionPanel from '@/components/OnSiteSelectionPanel'
import BudgetEstimatePanel from '@/components/BudgetEstimatePanel'
import ConstructionSchedulePanel from '@/components/ConstructionSchedulePanel'

type TabKey = 'customer' | 'requirement' | 'selection' | 'budget' | 'schedule'

const TABS: {
  key: TabKey
  label: string
  icon: any
  description: string
}[] = [
  {
    key: 'customer',
    label: '客户建档',
    icon: Users,
    description: '管理客户基本信息、联系方式与车辆档案',
  },
  {
    key: 'requirement',
    label: '需求记录',
    icon: FileText,
    description: '记录客户改装需求、预算范围与偏好',
  },
  {
    key: 'selection',
    label: '现场选配',
    icon: Package,
    description: '浏览配件目录，为客户挑选合适的改装配件',
  },
  {
    key: 'budget',
    label: '预算测算',
    icon: Calculator,
    description: '自动计算配件费用、工时费与优惠方案',
  },
  {
    key: 'schedule',
    label: '施工排期',
    icon: CalendarClock,
    description: '安排施工任务、分配人员、跟踪进度',
  },
]

export default function StoreReceptionPage() {
  const {
    receptionActiveTab,
    setReceptionActiveTab,
    fetchCustomers,
    fetchRequirements,
    fetchSchedules,
    fetchParts,
    fetchCategories,
    currentCustomer,
    currentRequirement,
    currentReceptionSelection,
    currentQuote,
    currentSchedule,
    customers,
    requirements,
    schedules,
    fetchQuoteWithDetails,
    setCurrentSchedule,
    getScheduleById,
    restoreReceptionContext,
  } = useStore()

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchCustomers(),
        fetchRequirements(),
        fetchSchedules(),
        fetchParts(),
        fetchCategories(),
      ])
      await restoreReceptionContext()
    }
    init()
  }, [fetchCustomers, fetchRequirements, fetchSchedules, fetchParts, fetchCategories, restoreReceptionContext])

  useEffect(() => {
    if (currentQuote?.id) {
      fetchQuoteWithDetails(currentQuote.id)
    }
  }, [currentQuote?.id, fetchQuoteWithDetails])

  useEffect(() => {
    if (schedules.length === 0) return
    if (currentSchedule?.id && getScheduleById(currentSchedule.id)) return
    const convertedId = currentQuote && (currentQuote as any)?.convertedScheduleId
    const matched =
      (convertedId && getScheduleById(convertedId)) ||
      schedules.find(
        (s) =>
          (currentQuote && s.quoteId === currentQuote.id) ||
          (currentCustomer && s.customerId === currentCustomer.id)
      )
    if (matched) {
      setCurrentSchedule(matched)
    }
  }, [schedules, currentQuote, currentCustomer, currentSchedule, getScheduleById, setCurrentSchedule])

  const activeTab = TABS.find((t) => t.key === receptionActiveTab) || TABS[0]
  const Icon = activeTab.icon

  const scheduleProgress = (() => {
    const tasks = currentSchedule?.tasks
    if (!tasks || tasks.length === 0) return 0
    const done = tasks.filter((t) => t.status === 'completed').length
    return Math.round((done / tasks.length) * 100)
  })()

  return (
    <div className="h-full flex flex-col bg-carbon-900">
      <header className="border-b border-carbon-500/30 bg-gradient-to-r from-carbon-900 via-carbon-800/50 to-carbon-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-moto-orange to-orange-700 flex items-center justify-center shadow-lg shadow-moto-orange/20">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron text-xl text-moto-silver font-bold tracking-wide">
                    门店接待工作台
                  </h1>
                  <p className="text-xs text-moto-steel mt-0.5">
                    {new Date().toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
                <Search size={14} className="text-moto-steel" />
                <input
                  type="text"
                  placeholder="全局搜索客户、订单..."
                  className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-48"
                />
              </div>

              <button className="relative p-2 text-moto-steel hover:text-moto-silver hover:bg-carbon-800 rounded-lg transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-moto-orange rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {TABS.map((tab) => {
              const TabIcon = tab.icon
              const isActive = receptionActiveTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setReceptionActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-moto-orange/10 border-moto-orange/40 text-moto-orange shadow-lg shadow-moto-orange/5'
                      : 'bg-carbon-800/30 border-carbon-500/20 text-moto-steel hover:text-moto-silver hover:border-carbon-500/40 hover:bg-carbon-800/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive
                        ? 'bg-moto-orange/20'
                        : 'bg-carbon-700'
                    }`}
                  >
                    <TabIcon size={16} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? 'text-moto-orange' : 'text-moto-silver'
                      }`}
                    >
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-moto-steel truncate">
                      {tab.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {(currentCustomer ||
        currentRequirement ||
        currentReceptionSelection ||
        currentQuote ||
        currentSchedule ||
        receptionActiveTab === 'customer' ||
        receptionActiveTab === 'selection') && (
        <div className="px-6 py-3 border-b border-carbon-500/30 bg-carbon-800/20">
          <div className="flex items-center gap-4 flex-wrap">
            {currentCustomer && (
              <button
                onClick={() => setReceptionActiveTab('customer')}
                className="flex items-center gap-2 px-3 py-1.5 bg-moto-orange/10 text-moto-orange border border-moto-orange/30 rounded-full hover:bg-moto-orange/15 transition-colors"
              >
                <Users size={14} />
                <span className="text-sm font-medium">{currentCustomer.name}</span>
                <span className="text-xs opacity-70">· {currentCustomer.phone}</span>
              </button>
            )}
            {currentRequirement && (
              <button
                onClick={() => setReceptionActiveTab('requirement')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full hover:bg-blue-500/15 transition-colors"
              >
                <FileText size={14} />
                <span className="text-sm">需求 #{currentRequirement.id.slice(-4)}</span>
                <span className="text-xs opacity-70">· {currentRequirement.items.length} 项</span>
              </button>
            )}
            {currentReceptionSelection && (
              <button
                onClick={() => setReceptionActiveTab('selection')}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full hover:bg-purple-500/15 transition-colors"
              >
                <Package size={14} />
                <span className="text-sm">选配</span>
                <span className="text-xs opacity-70">
                  · {currentReceptionSelection.items.length} 件 · ¥{currentReceptionSelection.totalAmount.toFixed(0).toLocaleString()}
                </span>
              </button>
            )}
            {currentQuote && (
              <button
                onClick={() => setReceptionActiveTab('budget')}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full hover:bg-amber-500/15 transition-colors"
              >
                <Calculator size={14} />
                <span className="text-sm">报价 {currentQuote.quoteNo}</span>
                <span className="text-xs opacity-70">
                  · ¥{(currentQuote.totalAmount || 0).toFixed(0).toLocaleString()}
                </span>
                {currentQuote.convertedScheduleId && (
                  <Sparkles size={12} className="text-green-400 ml-1" />
                )}
              </button>
            )}
            {currentSchedule && (
              <button
                onClick={() => setReceptionActiveTab('schedule')}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full hover:bg-green-500/15 transition-colors"
              >
                <CalendarClock size={14} />
                <span className="text-sm">施工排期</span>
                <span className="flex items-center gap-1 text-xs opacity-70">
                  · <CircleDot size={10} /> {scheduleProgress}%
                </span>
              </button>
            )}
            <div className="flex-1 min-w-[200px]" />
            <div className="flex items-center gap-6 text-xs text-moto-steel">
              <span>
                客户总数:{' '}
                <span className="text-moto-silver font-medium">{customers.length}</span>
              </span>
              <span>
                需求记录:{' '}
                <span className="text-moto-silver font-medium">{requirements.length}</span>
              </span>
              <span>
                施工项目:{' '}
                <span className="text-moto-silver font-medium">{schedules.length}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {receptionActiveTab === 'customer' && <CustomerProfilePanel />}
        {receptionActiveTab === 'requirement' && <RequirementRecordPanel />}
        {receptionActiveTab === 'selection' && <OnSiteSelectionPanel />}
        {receptionActiveTab === 'budget' && <BudgetEstimatePanel />}
        {receptionActiveTab === 'schedule' && <ConstructionSchedulePanel />}
      </main>
    </div>
  )
}
