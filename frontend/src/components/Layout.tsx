import { useEffect, useState, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bike, Wrench, ClipboardList, AlertTriangle, XCircle, ArrowLeftRight, Settings2, FileText, FileCheck, Folder, Package, Link2, TrendingUp, CheckSquare, ChevronDown, ChevronRight, LayoutGrid, Layers, Warehouse, Percent, User, LogIn, LogOut, Heart, Clock, FileEdit, Users, BookOpen, Shield, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ModelSelector from '@/components/ModelSelector'

const navItems = [
  { path: '/', label: '配件浏览', icon: Wrench },
  { path: '/preview', label: '机车预览', icon: Bike },
  { path: '/list', label: '选配清单', icon: ClipboardList },
  { path: '/compare', label: '方案对比', icon: ArrowLeftRight },
  { path: '/templates', label: '模板中心', icon: LayoutGrid },
  { path: '/reception', label: '门店接待', icon: Users },
  { path: '/quotes', label: '报价审批', icon: FileCheck },
  { path: '/orders', label: '订单管理', icon: FileText },
  { path: '/after-sales', label: '售后服务', icon: Shield },
]

const adminNavItems = [
  { path: '/admin/categories', label: '分类维护', icon: Folder },
  { path: '/admin/parts', label: '配件录入', icon: Package },
  { path: '/admin/templates', label: '模板管理', icon: Layers },
  { path: '/admin/compatibility', label: '兼容配置', icon: Link2 },
  { path: '/admin/price', label: '价格调整', icon: TrendingUp },
  { path: '/admin/discount-rules', label: '折扣规则', icon: Percent },
  { path: '/admin/review', label: '上下架审核', icon: CheckSquare },
  { path: '/admin/inventory', label: '库存联动', icon: Warehouse },
  { path: '/admin/vehicle-profiles', label: '车型资料', icon: BookOpen },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const isAdminPage = location.pathname.startsWith('/admin')
  const {
    fetchCategories,
    fetchParts,
    fetchSelections,
    initDefaultSelection,
    compatibilityResult,
    partConflictMap,
    currentModelId,
    bikeModels,
    fetchInventoryOverview,
    isAuthenticated,
    currentUser,
    fetchCurrentUser,
    logout,
  } = useStore()

  useEffect(() => {
    if (localStorage.getItem('xcf-auth-token') && !isAuthenticated) {
      fetchCurrentUser()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const currentModel = bikeModels.find((m) => m.id === currentModelId)

  useEffect(() => {
    const init = async () => {
      await fetchCategories()
      await fetchParts()
      await fetchSelections()
      await initDefaultSelection()
      fetchInventoryOverview()
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
        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const showBadge = item.path === '/list' && (hasConflicts || hasWarnings)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 lg:px-6 py-3 text-sm transition-all duration-200 relative ${
                    isActive && !isAdminPage
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

          <div className="px-4 lg:px-6 pt-4 pb-2">
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="w-full flex items-center justify-between text-xs font-orbitron text-moto-steel hover:text-moto-silver transition-colors uppercase tracking-wider"
            >
              <span>运营管理</span>
              {adminMenuOpen ? (
                <ChevronDown size={14} className={isAdminPage ? 'text-moto-orange' : ''} />
              ) : (
                <ChevronRight size={14} className={isAdminPage ? 'text-moto-orange' : ''} />
              )}
            </button>
          </div>

          {adminMenuOpen && (
            <div className="space-y-0.5">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 lg:px-6 py-2.5 text-sm transition-all duration-200 relative ${
                      isActive
                        ? 'text-moto-orange bg-moto-orange/10 border-r-2 border-moto-orange'
                        : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <div className="hidden lg:inline">
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
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
      <div className="flex-1 ml-20 lg:ml-56 flex flex-col">
        <header className="bg-carbon-800/80 backdrop-blur border-b border-carbon-500/30 sticky top-0 z-20">
          <div className="flex items-center justify-end px-4 lg:px-6 py-3">
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated && currentUser ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-carbon-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-moto-orange to-orange-700 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm text-moto-silver font-medium">
                        {currentUser.nickname || currentUser.username}
                      </p>
                      <p className="text-[10px] text-moto-steel">
                        {currentUser.role === 'admin' ? '管理员' : '普通用户'}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-moto-steel transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-carbon-800 border border-carbon-500/30 rounded-lg shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-carbon-500/30 bg-carbon-700/30">
                        <p className="text-sm font-medium text-moto-silver">
                          {currentUser.nickname || currentUser.username}
                        </p>
                        <p className="text-xs text-moto-steel truncate">{currentUser.email}</p>
                      </div>
                      <div className="py-1">
                        <NavLink
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                        >
                          <User size={16} />
                          <span>个人中心</span>
                        </NavLink>
                        <NavLink
                          to="/profile?tab=favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                        >
                          <Heart size={16} />
                          <span>我的收藏</span>
                        </NavLink>
                        <NavLink
                          to="/profile?tab=history"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                        >
                          <Clock size={16} />
                          <span>浏览记录</span>
                        </NavLink>
                        <NavLink
                          to="/profile?tab=archives"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50 transition-colors"
                        >
                          <FileEdit size={16} />
                          <span>改装档案</span>
                        </NavLink>
                      </div>
                      <div className="border-t border-carbon-500/30 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>退出登录</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-moto-orange hover:bg-moto-orange/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <LogIn size={16} />
                  <span className="hidden lg:inline">登录/注册</span>
                </NavLink>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <ModelSelector isOpen={modelSelectorOpen} onClose={() => setModelSelectorOpen(false)} />
    </div>
  )
}
