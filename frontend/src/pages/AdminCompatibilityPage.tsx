import { useEffect, useState, useMemo } from 'react'
import { api } from '@/api/client'
import type { CompatibilityRelation, PartAdmin } from '@/types'
import {
  Plus,
  Trash2,
  Search,
  Filter,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

interface PartOption {
  id: string
  name: string
  brand: string
}

export default function AdminCompatibilityPage() {
  const [relations, setRelations] = useState<CompatibilityRelation[]>([])
  const [parts, setParts] = useState<PartAdmin[]>([])
  const [loading, setLoading] = useState(false)
  const [partsLoading, setPartsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [partIdA, setPartIdA] = useState('')
  const [partIdB, setPartIdB] = useState('')
  const [relationType, setRelationType] = useState<'compatible' | 'conflict'>('compatible')
  const [severity, setSeverity] = useState<'warning' | 'error'>('warning')
  const [remark, setRemark] = useState('')

  const [searchPartId, setSearchPartId] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'compatible' | 'conflict'>('all')
  const [selectedPartFilter, setSelectedPartFilter] = useState<string | null>(null)

  const [searchPartA, setSearchPartA] = useState('')
  const [searchPartB, setSearchPartB] = useState('')
  const [dropdownOpenA, setDropdownOpenA] = useState(false)
  const [dropdownOpenB, setDropdownOpenB] = useState(false)

  const [partsListSearch, setPartsListSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; partA: string; partB: string } | null>(null)

  useEffect(() => {
    loadData()
    loadParts()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.adminGetCompatibilityRelations()
      setRelations(data)
    } catch (e) {
      console.error('Failed to load relations:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadParts = async () => {
    setPartsLoading(true)
    try {
      const data = await api.adminGetParts()
      setParts(data)
    } catch (e) {
      console.error('Failed to load parts:', e)
    } finally {
      setPartsLoading(false)
    }
  }

  const partOptions: PartOption[] = useMemo(() => {
    return parts.map((p) => ({ id: p.id, name: p.name, brand: p.brand }))
  }, [parts])

  const filteredPartOptionsA = useMemo(() => {
    const query = searchPartA.trim().toLowerCase()
    return partOptions
      .filter((p) => p.id !== partIdB)
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      )
      .slice(0, 50)
  }, [partOptions, searchPartA, partIdB])

  const filteredPartOptionsB = useMemo(() => {
    const query = searchPartB.trim().toLowerCase()
    return partOptions
      .filter((p) => p.id !== partIdA)
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      )
      .slice(0, 50)
  }, [partOptions, searchPartB, partIdA])

  const filteredPartsList = useMemo(() => {
    const query = partsListSearch.trim().toLowerCase()
    return parts.filter(
      (p) =>
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    )
  }, [parts, partsListSearch])

  const filteredRelations = useMemo(() => {
    return relations.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (selectedPartFilter && r.partIdA !== selectedPartFilter && r.partIdB !== selectedPartFilter) return false
      if (searchPartId.trim()) {
        const q = searchPartId.trim().toLowerCase()
        if (!r.partIdA.toLowerCase().includes(q) && !r.partIdB.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [relations, filterType, selectedPartFilter, searchPartId])

  const getPartName = (id: string) => {
    const p = parts.find((x) => x.id === id)
    return p ? `${p.name} (${p.brand})` : id
  }

  const handleAdd = async () => {
    if (!partIdA || !partIdB) return
    if (partIdA === partIdB) return

    setSubmitting(true)
    try {
      const data: {
        partIdA: string
        partIdB: string
        type: 'compatible' | 'conflict'
        severity?: 'warning' | 'error'
        remark?: string
      } = {
        partIdA,
        partIdB,
        type: relationType,
        remark: remark.trim() || undefined,
      }
      if (relationType === 'conflict') {
        data.severity = severity
      }
      await api.adminCreateCompatibilityRelation(data)
      setPartIdA('')
      setPartIdB('')
      setSearchPartA('')
      setSearchPartB('')
      setRelationType('compatible')
      setSeverity('warning')
      setRemark('')
      await loadData()
    } catch (e) {
      console.error('Failed to create relation:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.adminDeleteCompatibilityRelation(id)
      setDeleteConfirm(null)
      await loadData()
    } catch (e) {
      console.error('Failed to delete relation:', e)
    }
  }

  const selectPartA = (id: string, name: string) => {
    setPartIdA(id)
    setSearchPartA(name)
    setDropdownOpenA(false)
  }

  const selectPartB = (id: string, name: string) => {
    setPartIdB(id)
    setSearchPartB(name)
    setDropdownOpenB(false)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 lg:w-72 bg-carbon-800 border-r border-carbon-500/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-carbon-500/30">
          <h2 className="font-orbitron text-moto-silver text-sm mb-3">配件列表</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel" />
            <input
              type="text"
              value={partsListSearch}
              onChange={(e) => setPartsListSearch(e.target.value)}
              placeholder="搜索配件..."
              className="w-full bg-carbon-700/50 border border-carbon-500/30 rounded-lg pl-8 pr-3 py-2 text-xs text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
            />
          </div>
          {selectedPartFilter && (
            <button
              onClick={() => setSelectedPartFilter(null)}
              className="mt-2 flex items-center gap-1 text-xs text-moto-orange hover:text-moto-orange-light transition-colors"
            >
              <X size={12} />
              清除筛选
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {partsLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 size={20} className="text-moto-orange animate-spin" />
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredPartsList.map((part) => {
                const relationCount = relations.filter(
                  (r) => r.partIdA === part.id || r.partIdB === part.id
                ).length
                return (
                  <button
                    key={part.id}
                    onClick={() =>
                      setSelectedPartFilter(selectedPartFilter === part.id ? null : part.id)
                    }
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedPartFilter === part.id
                        ? 'bg-moto-orange/10 border-moto-orange/40'
                        : 'bg-carbon-700/30 border-transparent hover:bg-carbon-700/60 hover:border-carbon-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Wrench
                        size={14}
                        className={`mt-0.5 shrink-0 ${
                          selectedPartFilter === part.id ? 'text-moto-orange' : 'text-moto-steel'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-moto-silver font-medium truncate">{part.name}</p>
                        <p className="text-[10px] text-moto-steel mt-0.5">{part.brand}</p>
                        <p className="text-[10px] text-moto-steel mt-0.5 font-orbitron">
                          {part.sku} · {relationCount} 条关系
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filteredPartsList.length === 0 && (
                <div className="p-4 text-center text-xs text-moto-steel">未找到配件</div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-orbitron text-2xl lg:text-3xl text-moto-silver font-bold">
            兼容关系配置
          </h1>
          <p className="text-moto-steel text-sm mt-1">
            管理配件之间的兼容与冲突关系
          </p>
        </div>

        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 p-5 mb-6">
          <h2 className="font-orbitron text-sm text-moto-silver mb-4 flex items-center gap-2">
            <Plus size={14} className="text-moto-orange" />
            添加新关系
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <label className="block text-xs text-moto-steel mb-1.5">配件 A</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel z-10" />
                <input
                  type="text"
                  value={searchPartA}
                  onChange={(e) => {
                    setSearchPartA(e.target.value)
                    if (!partIdA || e.target.value !== getPartName(partIdA)) {
                      setPartIdA('')
                    }
                    setDropdownOpenA(true)
                  }}
                  onFocus={() => setDropdownOpenA(true)}
                  placeholder="搜索配件..."
                  className="w-full bg-carbon-700 border border-carbon-500/30 rounded-lg pl-8 pr-3 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
                {dropdownOpenA && filteredPartOptionsA.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-carbon-700 border border-carbon-500/30 rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto animate-scale-in">
                    {filteredPartOptionsA.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPartA(p.id, p.name)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-carbon-600 transition-colors border-b border-carbon-500/20 last:border-b-0"
                      >
                        <p className="text-moto-silver">{p.name}</p>
                        <p className="text-moto-steel text-[10px]">{p.brand} · {p.id}</p>
                      </button>
                    ))}
                  </div>
                )}
                {dropdownOpenA && (
                  <div className="fixed inset-0 z-20" onClick={() => setDropdownOpenA(false)} />
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs text-moto-steel mb-1.5">配件 B</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-moto-steel z-10" />
                <input
                  type="text"
                  value={searchPartB}
                  onChange={(e) => {
                    setSearchPartB(e.target.value)
                    if (!partIdB || e.target.value !== getPartName(partIdB)) {
                      setPartIdB('')
                    }
                    setDropdownOpenB(true)
                  }}
                  onFocus={() => setDropdownOpenB(true)}
                  placeholder="搜索配件..."
                  className="w-full bg-carbon-700 border border-carbon-500/30 rounded-lg pl-8 pr-3 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
                />
                {dropdownOpenB && filteredPartOptionsB.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-carbon-700 border border-carbon-500/30 rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto animate-scale-in">
                    {filteredPartOptionsB.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPartB(p.id, p.name)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-carbon-600 transition-colors border-b border-carbon-500/20 last:border-b-0"
                      >
                        <p className="text-moto-silver">{p.name}</p>
                        <p className="text-moto-steel text-[10px]">{p.brand} · {p.id}</p>
                      </button>
                    ))}
                  </div>
                )}
                {dropdownOpenB && (
                  <div className="fixed inset-0 z-20" onClick={() => setDropdownOpenB(false)} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-moto-steel mb-1.5">关系类型</label>
              <div className="flex items-center gap-2 bg-carbon-700 rounded-lg px-3 py-2 border border-carbon-500/30">
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value as 'compatible' | 'conflict')}
                  className="w-full bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
                >
                  <option value="compatible" className="bg-carbon-800">兼容</option>
                  <option value="conflict" className="bg-carbon-800">冲突</option>
                </select>
              </div>
            </div>

            {relationType === 'conflict' && (
              <div>
                <label className="block text-xs text-moto-steel mb-1.5">严重程度</label>
                <div className="flex items-center gap-2 bg-carbon-700 rounded-lg px-3 py-2 border border-carbon-500/30">
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'warning' | 'error')}
                    className="w-full bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="warning" className="bg-carbon-800">Warning</option>
                    <option value="error" className="bg-carbon-800">Error</option>
                  </select>
                </div>
              </div>
            )}

            <div className={relationType === 'conflict' ? 'xl:col-span-1' : 'xl:col-span-2'}>
              <label className="block text-xs text-moto-steel mb-1.5">备注</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可选备注说明..."
                className="w-full bg-carbon-700 border border-carbon-500/30 rounded-lg px-3 py-2.5 text-sm text-moto-silver placeholder:text-carbon-500 focus:outline-none focus:border-moto-orange/50 transition-colors"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAdd}
                disabled={!partIdA || !partIdB || partIdA === partIdB || submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-moto-orange text-white rounded-lg font-orbitron text-sm hover:bg-moto-orange-light transition-colors shadow-lg shadow-moto-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                添加
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Search size={14} className="text-moto-steel" />
            <input
              type="text"
              value={searchPartId}
              onChange={(e) => setSearchPartId(e.target.value)}
              placeholder="按配件ID搜索..."
              className="bg-transparent text-moto-silver text-sm focus:outline-none placeholder:text-carbon-500 w-44"
            />
          </div>
          <div className="flex items-center gap-2 bg-carbon-800 rounded-lg px-3 py-2 border border-carbon-500/20">
            <Filter size={14} className="text-moto-steel" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'compatible' | 'conflict')}
              className="bg-transparent text-moto-silver text-sm focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-carbon-800">全部类型</option>
              <option value="compatible" className="bg-carbon-800">仅兼容</option>
              <option value="conflict" className="bg-carbon-800">仅冲突</option>
            </select>
          </div>
          {selectedPartFilter && (
            <div className="flex items-center gap-2 bg-moto-orange/10 rounded-lg px-3 py-2 border border-moto-orange/30">
              <span className="text-xs text-moto-orange">
                已筛选: {getPartName(selectedPartFilter)}
              </span>
              <button
                onClick={() => setSelectedPartFilter(null)}
                className="p-0.5 text-moto-orange hover:text-moto-orange-light transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-carbon-800 rounded-xl border border-carbon-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-carbon-700/50 border-b border-carbon-500/30">
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">配件 A</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">配件 B</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">关系类型</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">严重程度</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">备注</th>
                  <th className="text-left px-4 py-3 text-xs font-orbitron text-moto-steel">添加时间</th>
                  <th className="text-right px-4 py-3 text-xs font-orbitron text-moto-steel">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 size={24} className="text-moto-orange animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredRelations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Wrench size={40} className="text-carbon-500 mx-auto mb-3" />
                      <p className="text-sm text-moto-steel">暂无兼容关系数据</p>
                    </td>
                  </tr>
                ) : (
                  filteredRelations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-carbon-500/20 last:border-b-0 hover:bg-carbon-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-moto-silver font-medium">{getPartName(r.partIdA)}</p>
                        <p className="text-[10px] text-moto-steel font-orbitron mt-0.5">{r.partIdA}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-moto-silver font-medium">{getPartName(r.partIdB)}</p>
                        <p className="text-[10px] text-moto-steel font-orbitron mt-0.5">{r.partIdB}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.type === 'compatible' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-green-500/10 text-green-400 border border-green-500/30">
                            <CheckCircle2 size={10} />
                            兼容
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-red-500/10 text-red-400 border border-red-500/30">
                            <XCircle size={10} />
                            冲突
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.type === 'conflict' && r.severity ? (
                          r.severity === 'error' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/40 font-orbitron">
                              <XCircle size={9} />
                              ERROR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/15 text-yellow-500 border border-yellow-500/40 font-orbitron">
                              <AlertTriangle size={9} />
                              WARNING
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-moto-steel">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-moto-steel max-w-[200px] truncate">{r.remark || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-moto-steel">{new Date(r.createdAt).toLocaleString('zh-CN')}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: r.id,
                              partA: getPartName(r.partIdA),
                              partB: getPartName(r.partIdB),
                            })
                          }
                          className="p-1.5 rounded-lg text-moto-steel hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredRelations.length > 0 && (
            <div className="px-4 py-3 border-t border-carbon-500/20 flex items-center justify-between">
              <p className="text-xs text-moto-steel">
                共 <span className="font-orbitron text-moto-silver">{filteredRelations.length}</span> 条关系
              </p>
            </div>
          )}
        </div>
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-carbon-800 rounded-2xl border border-carbon-500/30 w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-orbitron text-moto-silver text-lg">确认删除</h3>
                <p className="text-xs text-moto-steel mt-0.5">此操作无法撤销</p>
              </div>
            </div>
            <div className="bg-carbon-700/50 rounded-lg p-4 mb-5 border border-carbon-500/20">
              <p className="text-sm text-moto-silver mb-2">即将删除以下兼容关系：</p>
              <div className="space-y-1 text-xs text-moto-steel">
                <p>
                  <span className="text-moto-silver">配件 A：</span>
                  {deleteConfirm.partA}
                </p>
                <p>
                  <span className="text-moto-silver">配件 B：</span>
                  {deleteConfirm.partB}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-carbon-700 text-moto-steel rounded-lg text-sm hover:bg-carbon-600 hover:text-moto-silver transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
