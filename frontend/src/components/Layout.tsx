import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Bike, Wrench, ClipboardList } from 'lucide-react'
import { useStore } from '@/store/useStore'

const navItems = [
  { path: '/', label: '配件浏览', icon: Wrench },
  { path: '/preview', label: '机车预览', icon: Bike },
  { path: '/list', label: '选配清单', icon: ClipboardList },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { fetchCategories, fetchParts, fetchSelections, initDefaultSelection } = useStore()

  useEffect(() => {
    const init = async () => {
      await fetchCategories()
      await fetchParts()
      await fetchSelections()
      await initDefaultSelection()
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-carbon-900 font-body flex">
      <nav className="w-20 lg:w-56 bg-carbon-800 border-r border-carbon-500/30 flex flex-col fixed h-full z-30">
        <div className="p-4 lg:p-6 border-b border-carbon-500/30">
          <h1 className="font-orbitron text-moto-orange text-sm lg:text-xl font-bold tracking-wider">XCF-180</h1>
          <p className="text-moto-steel text-[10px] lg:text-xs mt-1 hidden lg:block">MOTO CUSTOM</p>
        </div>
        <div className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 lg:px-6 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-moto-orange bg-moto-orange/10 border-r-2 border-moto-orange'
                    : 'text-moto-steel hover:text-moto-silver hover:bg-carbon-700/50'
                }`
              }
            >
              <item.icon size={20} />
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-carbon-500/30">
          <div className="text-moto-steel text-[10px] text-center lg:text-left hidden lg:block">© 2026 XCF Custom</div>
        </div>
      </nav>
      <main className="flex-1 ml-20 lg:ml-56">{children}</main>
    </div>
  )
}
