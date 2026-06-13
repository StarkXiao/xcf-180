import { Search } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore()

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜索配件..."
        className="w-full bg-carbon-700/50 border border-carbon-500/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-moto-silver placeholder-moto-steel/50 focus:outline-none focus:border-moto-orange/50 transition-colors"
      />
    </div>
  )
}
