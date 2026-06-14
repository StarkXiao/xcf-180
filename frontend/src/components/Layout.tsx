import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bike, Wrench, ClipboardList, AlertTriangle, XCircle, ArrowLeftRight, Settings2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ModelSelector from '@/components/ModelSelector'

const navItems = [
  { path: '/', label: '配件浏览', icon: Wrench },
  { path: '/preview', label: '机车预览', icon: Bike },
  { path: '/list', label: '选配清单', icon: ClipboardList },
  { path: '/compare', label: '方案对比', icon: ArrowLeftRight },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const {
    fetchCategories,
    fetchParts,
    fetchSelections,
    initDefaultSelection,
    compatibilityResult,
    partConflictMap,
    currentModelId,
    bikeModels,
  } = useStore()

  const currentModel = bikeModels.find((m) => m.id === currentModelId)

  useEffect(() => {
    const init = async () => {
      await fetchCategories()
      await fetchParts()
      await fetchSelections()
      await initDefaultSelection()
    }
    init()
  }, [])

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0
  const totalIssues = (compatibilityResult?.conflicts?.length ?? 0) + (compatibilityResult?.warnings?.length ?? 0)

  return (
    <div className="min-h-screen bg-carbon-900 font-body flex">
      <nav className="w-20 lg:w-56 bg-carbon-800 border-r border-carbon-500/30 flex flex-col fixed h-full z-30">
        <div className="p-4 lg:p-6 border-b border-carbon-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-moto-orange text-sm lg:text-xl font-bold tracking-wider">
                {currentModel ? currentModel.name : 'XCF-180'}
              </h1>
              <p className="text-moto-steel text-[10px] lg:text-xs mt-1 hidden lg:block">MOTO CUSTOM</p>
            </div>
            <button
              onClick={() => setModelSelectorOpen(true)}
              className="p-1.5 rounded-lg text-moto-steel hover:text-moto-orange hover:bg-moto-orange/10 transition-colors"
              title="切换车型"
            >
              <Settings2 size={16} />
            </button>
          </div>
          {currentModel && (
            <div className="mt-2 hidden lg:block">
              <p className="text-[10px] text-moto-steel line-clamp-1">{currentModel.description}</p>
            </div>
          )}
        </div>
        <div className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const showBadge = item.path === '/list' && (hasConflicts || hasWarnings)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 lg:px-6 py-3 text-sm transition-all duration-200 relative ${
                    isActive
                      ? 'text-moto-orange bg-moto-orange/10 border-r-2 border-moto-orange'
                      : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
                  }`
                }
              >
                <div className="relative">
                  <item.icon size={20} className={`${
                    item.path === '/list' && hasConflicts ? 'text-red-400' :
                    item.path === '/list' && hasWarnings ? 'text-yellow-500' : ''
                  }`} />
                  {showBadge && (
                    <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-orbitron text-white ${
                      hasConflicts ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      {totalIssues}
                    </span>
                  )}
                </div>
                <div className="hidden lg:inline flex items-center gap-2">
                  <span className={`${
                    item.path === '/list' && hasConflicts ? 'text-red-400' :
                    item.path === '/list' && hasWarnings ? 'text-yellow-500' : ''
                  }`}>{item.label}</span>
                  {showBadge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${
                      hasConflicts ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {hasConflicts ? '冲突' : '提醒'}
                    </span>
                  )}
                </div>
              </NavLink>
            )
          })}
        </div>
        {(hasConflicts || hasWarnings) && location.pathname !== '/list' && (
          <NavLink
            to="/list"
            className={`mx-3 mb-3 p-3 rounded-lg border transition-all duration-200 ${
              hasConflicts
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {hasConflicts
                ? <XCircle size={16} className="text-red-400 shrink-0" />
                : <AlertTriangle size={16} className="text-yellow-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  hasConflicts ? 'text-red-400' : 'text-yellow-500'
                }`}>
                  {hasConflicts ? '存在兼容冲突' : '有搭配提醒'}
                </p>
                <p className="text-[10px] text-moto-steel truncate">
                  共 {totalIssues} 项问题待处理
                </p>
              </div>
            </div>
          </NavLink>
        )}
        <div className="p-4 border-t border-carbon-500/30">
          <div className="text-moto-steel text-[10px] text-center lg:text-left hidden lg:block">© 2026 XCF Custom</div>
        </div>
      </nav>
      <main className="flex-1 ml-20 lg:ml-56">{children}</main>
      <ModelSelector isOpen={modelSelectorOpen} onClose={() => setModelSelectorOpen(false)} />
    </div>
  )
}
