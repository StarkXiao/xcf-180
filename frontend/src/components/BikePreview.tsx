import { useStore } from '@/store/useStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertTriangle, XCircle, Plus, Check, ArrowRight, X } from 'lucide-react'
import type { Part } from '@/types'

const ZONE_MAP: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  exhaust: { x: 62, y: 50, w: 20, h: 15, label: '排气' },
  wheels: { x: 10, y: 55, w: 20, h: 20, label: '轮毂' },
  handlebar: { x: 8, y: 12, w: 30, h: 12, label: '把手' },
  lighting: { x: 15, y: 5, w: 22, h: 12, label: '灯组' },
  bodykit: { x: 20, y: 22, w: 48, h: 35, label: '车身' },
  brake: { x: 10, y: 58, w: 15, h: 15, label: '制动' },
}

export default function BikePreview() {
  const {
    currentSelection,
    allParts,
    activeCategory,
    setActiveCategory,
    partConflictMap,
    compatibilityResult,
    categories,
    addPartToSelection,
    removePartFromSelection,
  } = useStore()

  const [hoveredPart, setHoveredPart] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedItems = currentSelection?.items ?? []
  const selectedParts = selectedItems
    .map((item) => allParts.find((p) => p.id === item.partId))
    .filter(Boolean) as Part[]

  const uniqueCategories = [...new Set(selectedParts.map((p) => p.categoryId))]

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0

  const handleZoneClick = useCallback((categoryId: string) => {
    if (selectedZone === categoryId) {
      setSelectedZone(null)
      setPanelVisible(false)
      setActiveCategory('all')
    } else {
      setSelectedZone(categoryId)
      setActiveCategory(categoryId)
      setPanelVisible(true)
    }
  }, [selectedZone, setActiveCategory])

  useEffect(() => {
    if (activeCategory && activeCategory !== 'all' && activeCategory !== selectedZone) {
      setSelectedZone(activeCategory)
      setPanelVisible(true)
    }
  }, [activeCategory, selectedZone])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedZone(null)
        setPanelVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentZoneParts = selectedZone
    ? allParts.filter((p) => p.categoryId === selectedZone)
    : []

  const currentInstalledPart = selectedZone
    ? selectedParts.find((p) => p.categoryId === selectedZone) ?? null
    : null

  const alternativeParts = currentZoneParts.filter(
    (p) => p.id !== currentInstalledPart?.id
  )

  const handleReplace = async (newPartId: string) => {
    if (currentInstalledPart) {
      await removePartFromSelection(currentInstalledPart.id)
    }
    await addPartToSelection(newPartId)
  }

  const handleRemoveCurrent = async () => {
    if (currentInstalledPart) {
      await removePartFromSelection(currentInstalledPart.id)
    }
  }

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || ZONE_MAP[catId]?.label || catId
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-[16/9] bg-carbon-800 rounded-2xl overflow-hidden border border-carbon-500/20">
        <svg viewBox="0 0 100 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#16213e" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="selectedGlow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100" height="80" fill="url(#bikeGrad)" />

          <g stroke="#8d99ae" strokeWidth="0.3" fill="none" opacity="0.4">
            <ellipse cx="20" cy="65" rx="10" ry="10" />
            <ellipse cx="75" cy="65" rx="8" ry="8" />
            <line x1="20" y1="55" x2="30" y2="35" />
            <line x1="30" y1="35" x2="50" y2="30" />
            <line x1="50" y1="30" x2="65" y2="35" />
            <line x1="65" y1="35" x2="75" y2="55" />
            <line x1="30" y1="35" x2="28" y2="20" />
            <line x1="28" y1="20" x2="35" y2="18" />
            <line x1="50" y1="30" x2="50" y2="45" />
            <ellipse cx="50" cy="48" rx="8" ry="5" />
            <line x1="58" y1="45" x2="70" y2="40" />
            <line x1="70" y1="40" x2="75" y2="55" />
            <line x1="75" y1="55" x2="85" y2="58" />
            <line x1="85" y1="58" x2="85" y2="62" />
          </g>

          <g stroke="#e2e2e2" strokeWidth="0.5" fill="none" opacity="0.6">
            <ellipse cx="20" cy="65" rx="10" ry="10" />
            <ellipse cx="75" cy="65" rx="8" ry="8" />
            <path d="M 10 55 Q 20 30 35 18 L 38 17 Q 55 15 65 25 L 68 30 Q 72 35 75 55 L 85 58 L 85 62 L 75 60 Q 72 40 65 35 L 50 30 L 30 35 L 20 55 Z" />
            <ellipse cx="50" cy="48" rx="8" ry="5" />
          </g>

          {selectedParts.map((part) => {
            const conflictStatus = partConflictMap[part.id]
            const hasError = conflictStatus?.hasError
            const hasWarning = conflictStatus?.hasWarning
            const isSelected = selectedZone === part.categoryId
            const isHovered = hoveredPart === part.id

            let strokeColor = '#ff6b35'
            let fillColor = 'rgba(255,107,53,0.15)'
            let strokeWidth = 0.3
            let strokeDasharray = '1 1'

            if (hasError) {
              strokeColor = '#ef4444'
              fillColor = 'rgba(239,68,68,0.2)'
            } else if (hasWarning) {
              strokeColor = '#eab308'
              fillColor = 'rgba(234,179,8,0.2)'
            }

            if (isSelected) {
              strokeColor = '#ff6b35'
              fillColor = 'rgba(255,107,53,0.3)'
              strokeWidth = 0.8
              strokeDasharray = 'none'
            }

            if (isHovered) {
              if (hasError) fillColor = 'rgba(239,68,68,0.35)'
              else if (hasWarning) fillColor = 'rgba(234,179,8,0.35)'
              else fillColor = 'rgba(255,107,53,0.35)'
              strokeWidth = 0.6
              strokeDasharray = 'none'
            }

            if (isSelected && isHovered) {
              strokeWidth = 1.0
            }

            return (
              <g key={part.id} filter={isSelected ? 'url(#selectedGlow)' : 'url(#glow)'}>
                <rect
                  x={part.position.x}
                  y={part.position.y}
                  width={part.position.width}
                  height={part.position.height}
                  rx="1"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleZoneClick(part.categoryId)}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                />
                {isSelected && (
                  <rect
                    x={part.position.x}
                    y={part.position.y}
                    width={part.position.width}
                    height={part.position.height}
                    rx="1"
                    fill="none"
                    stroke="#ff6b35"
                    strokeWidth={0.3}
                    opacity={0.6}
                    className="animate-pulse pointer-events-none"
                  />
                )}
                {(hasError || hasWarning) && !isHovered && (
                  <g>
                    <circle
                      cx={part.position.x + part.position.width - 1.5}
                      cy={part.position.y + 1.5}
                      r="1.8"
                      fill={hasError ? '#ef4444' : '#eab308'}
                    />
                    <text
                      x={part.position.x + part.position.width - 1.5}
                      y={part.position.y + 2.3}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="2"
                      fontFamily="Orbitron"
                    >
                      {hasError ? '!' : '⚠'}
                    </text>
                  </g>
                )}
                {isHovered && (
                  <>
                    <text
                      x={part.position.x + part.position.width / 2}
                      y={part.position.y - 1}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="2.5"
                      fontFamily="Orbitron"
                    >
                      {part.name}
                    </text>
                    {(hasError || hasWarning) && (
                      <text
                        x={part.position.x + part.position.width / 2}
                        y={part.position.y - 4}
                        textAnchor="middle"
                        fill={hasError ? '#ef4444' : '#eab308'}
                        fontSize="2"
                        fontFamily="Noto Sans SC"
                      >
                        {hasError ? '存在冲突' : '搭配提醒'}
                      </text>
                    )}
                  </>
                )}
              </g>
            )
          })}

          {Object.entries(ZONE_MAP)
            .filter(([zoneId]) => !uniqueCategories.includes(zoneId))
            .map(([zoneId, zone]) => {
              const isSelected = selectedZone === zoneId
              return (
                <g key={zoneId}>
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.w}
                    height={zone.h}
                    rx="1"
                    fill={isSelected ? 'rgba(255,107,53,0.12)' : 'rgba(141,153,174,0.05)'}
                    stroke={isSelected ? '#ff6b35' : '#8d99ae'}
                    strokeWidth={isSelected ? 0.5 : 0.2}
                    strokeDasharray={isSelected ? 'none' : '1 1'}
                    className="cursor-pointer transition-all duration-200 hover:fill-[rgba(141,153,174,0.1)]"
                    onClick={() => handleZoneClick(zoneId)}
                    onMouseEnter={() => setHoveredPart(null)}
                    onMouseLeave={() => setHoveredPart(null)}
                  />
                  {isSelected && (
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      rx="1"
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth={0.3}
                      opacity={0.6}
                      className="animate-pulse pointer-events-none"
                    />
                  )}
                  <text
                    x={zone.x + zone.w / 2}
                    y={zone.y + zone.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ff6b35' : '#8d99ae'}
                    fontSize="2.5"
                    fontFamily="Noto Sans SC"
                    className="pointer-events-none"
                  >
                    {zone.label}
                  </text>
                </g>
              )
            })}
        </svg>

        {hoveredPart && !selectedZone && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur px-4 py-2 rounded-lg border animate-fade-in flex items-center gap-2 ${
            partConflictMap[hoveredPart]?.hasError
              ? 'bg-red-500/10 border-red-500/30'
              : partConflictMap[hoveredPart]?.hasWarning
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-carbon-800/95 border-moto-orange/30'
          }`}>
            {partConflictMap[hoveredPart]?.hasError && <XCircle size={14} className="text-red-400" />}
            {partConflictMap[hoveredPart]?.hasWarning && !partConflictMap[hoveredPart]?.hasError && <AlertTriangle size={14} className="text-yellow-500" />}
            <span className={`font-orbitron text-sm ${
              partConflictMap[hoveredPart]?.hasError
                ? 'text-red-400'
                : partConflictMap[hoveredPart]?.hasWarning
                  ? 'text-yellow-500'
                  : 'text-moto-orange'
            }`}>
              {selectedParts.find((p) => p.id === hoveredPart)?.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {Object.entries(ZONE_MAP).map(([zoneId, zone]) => {
          const hasInstalled = uniqueCategories.includes(zoneId)
          const isZoneSelected = selectedZone === zoneId
          const installedPart = hasInstalled
            ? selectedParts.find((p) => p.categoryId === zoneId)
            : null
          const hasError = installedPart && partConflictMap[installedPart.id]?.hasError
          const hasWarning = installedPart && partConflictMap[installedPart.id]?.hasWarning

          return (
            <button
              key={zoneId}
              onClick={() => handleZoneClick(zoneId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all duration-200 border ${
                isZoneSelected
                  ? 'bg-moto-orange/20 border-moto-orange/50 text-moto-orange shadow-lg shadow-moto-orange/10'
                  : hasError
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : hasWarning
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20'
                      : hasInstalled
                        ? 'bg-carbon-700/50 border-moto-orange/20 text-moto-silver hover:bg-carbon-600'
                        : 'bg-carbon-700/30 border-carbon-500/20 text-moto-steel hover:bg-carbon-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                hasError ? 'bg-red-500' : hasWarning ? 'bg-yellow-500' : hasInstalled ? 'bg-moto-orange' : 'bg-carbon-500'
              }`} />
              {zone.label}
              {installedPart && (
                <span className="text-[10px] opacity-70 truncate max-w-[60px]">
                  {installedPart.name}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {panelVisible && selectedZone && (
        <div
          ref={panelRef}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-carbon-900/95 backdrop-blur-lg rounded-xl border border-carbon-500/30 shadow-2xl animate-fade-in z-20 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-carbon-500/20">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-sm text-moto-orange">
                {getCategoryName(selectedZone)}
              </span>
              {currentInstalledPart && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-moto-orange/20 text-moto-orange font-orbitron">
                  已安装
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedZone(null)
                setPanelVisible(false)
                setActiveCategory('all')
              }}
              className="p-1 text-moto-steel hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {currentInstalledPart && (
            <div className={`px-4 py-3 border-b border-carbon-500/20 ${
              partConflictMap[currentInstalledPart.id]?.hasError
                ? 'bg-red-500/5'
                : partConflictMap[currentInstalledPart.id]?.hasWarning
                  ? 'bg-yellow-500/5'
                  : 'bg-carbon-800/50'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  src={currentInstalledPart.image}
                  alt={currentInstalledPart.name}
                  className="w-12 h-12 rounded-lg object-cover bg-carbon-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+${currentInstalledPart.categoryId}+part+icon+dark+minimal&image_size=square_hd`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-moto-silver text-sm font-medium truncate">
                      {currentInstalledPart.name}
                    </p>
                    {partConflictMap[currentInstalledPart.id]?.hasError && (
                      <XCircle size={12} className="text-red-400 shrink-0" />
                    )}
                    {partConflictMap[currentInstalledPart.id]?.hasWarning && !partConflictMap[currentInstalledPart.id]?.hasError && (
                      <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                    )}
                  </div>
                  <p className="font-orbitron text-xs text-moto-orange mt-0.5">
                    ¥{currentInstalledPart.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCurrent}
                  className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-orbitron"
                >
                  移除
                </button>
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto px-4 py-3">
            <p className="text-moto-steel text-[10px] mb-2 font-orbitron uppercase tracking-wider">
              {currentInstalledPart ? '可替换配件' : '可选配件'}
            </p>
            {alternativeParts.length === 0 ? (
              <p className="text-moto-steel text-xs text-center py-4">该分类暂无其他配件</p>
            ) : (
              <div className="space-y-2">
                {alternativeParts.map((part) => {
                  const conflictStatus = partConflictMap[part.id]
                  const pHasError = conflictStatus?.hasError
                  const pHasWarning = conflictStatus?.hasWarning
                  return (
                    <div
                      key={part.id}
                      className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                        pHasError
                          ? 'bg-red-500/5 border border-red-500/20'
                          : pHasWarning
                            ? 'bg-yellow-500/5 border border-yellow-500/20'
                            : 'bg-carbon-800/50 hover:bg-carbon-700/50 border border-transparent'
                      }`}
                    >
                      <img
                        src={part.image}
                        alt={part.name}
                        className="w-10 h-10 rounded object-cover bg-carbon-600 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=motorcycle+part+icon+dark+minimal&image_size=square_hd`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-moto-silver text-xs truncate">{part.name}</p>
                          {pHasError && <XCircle size={10} className="text-red-400 shrink-0" />}
                          {pHasWarning && !pHasError && <AlertTriangle size={10} className="text-yellow-500 shrink-0" />}
                        </div>
                        <p className="font-orbitron text-[10px] text-moto-orange mt-0.5">
                          ¥{part.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleReplace(part.id)}
                        className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-orbitron transition-colors ${
                          currentInstalledPart
                            ? 'bg-moto-orange/10 border border-moto-orange/30 text-moto-orange hover:bg-moto-orange/20'
                            : 'bg-carbon-600 text-moto-steel hover:text-white hover:bg-carbon-500'
                        }`}
                      >
                        {currentInstalledPart ? (
                          <><ArrowRight size={10} /> 替换</>
                        ) : (
                          <><Plus size={10} /> 添加</>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
