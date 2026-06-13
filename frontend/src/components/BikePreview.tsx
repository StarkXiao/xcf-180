import { useStore } from '@/store/useStore'
import { useState } from 'react'
import { AlertTriangle, XCircle } from 'lucide-react'
import type { Part } from '@/types'

export default function BikePreview() {
  const {
    currentSelection,
    allParts,
    setActiveCategory,
    partConflictMap,
    compatibilityResult,
  } = useStore()
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  const selectedItems = currentSelection?.items ?? []
  const selectedParts = selectedItems
    .map((item) => allParts.find((p) => p.id === item.partId))
    .filter(Boolean) as Part[]

  const uniqueCategories = [...new Set(selectedParts.map((p) => p.categoryId))]

  const hasConflicts = compatibilityResult?.conflicts && compatibilityResult.conflicts.length > 0
  const hasWarnings = compatibilityResult?.warnings && compatibilityResult.warnings.length > 0

  const handleZoneClick = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
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
            const strokeColor = hasError ? '#ef4444' : hasWarning ? '#eab308' : '#ff6b35'
            const fillColor = hoveredPart === part.id
              ? (hasError ? 'rgba(239,68,68,0.35)' : hasWarning ? 'rgba(234,179,8,0.35)' : 'rgba(255,107,53,0.3)')
              : (hasError ? 'rgba(239,68,68,0.2)' : hasWarning ? 'rgba(234,179,8,0.2)' : 'rgba(255,107,53,0.15)')

            return (
              <g key={part.id} filter="url(#glow)">
                <rect
                  x={part.position.x}
                  y={part.position.y}
                  width={part.position.width}
                  height={part.position.height}
                  rx="1"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={hoveredPart === part.id ? 0.6 : (hasError || hasWarning ? 0.5 : 0.3)}
                  strokeDasharray={hoveredPart === part.id ? 'none' : (hasError || hasWarning ? 'none' : '1 1')}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleZoneClick(part.categoryId)}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                />
                {(hasError || hasWarning) && !hoveredPart && (
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
                {hoveredPart === part.id && (
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

          {[
            { id: 'exhaust', x: 62, y: 50, w: 20, h: 15, label: '排气' },
            { id: 'wheels', x: 10, y: 55, w: 20, h: 20, label: '轮毂' },
            { id: 'handlebar', x: 8, y: 12, w: 30, h: 12, label: '把手' },
            { id: 'lighting', x: 15, y: 5, w: 22, h: 12, label: '灯组' },
            { id: 'bodykit', x: 20, y: 22, w: 48, h: 35, label: '车身' },
            { id: 'brake', x: 10, y: 58, w: 15, h: 15, label: '制动' },
          ]
            .filter((zone) => !uniqueCategories.includes(zone.id))
            .map((zone) => (
              <g key={zone.id}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx="1"
                  fill="rgba(141,153,174,0.05)"
                  stroke="#8d99ae"
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                  className="cursor-pointer transition-all duration-200 hover:fill-[rgba(141,153,174,0.1)]"
                  onClick={() => handleZoneClick(zone.id)}
                />
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#8d99ae"
                  fontSize="2.5"
                  fontFamily="Noto Sans SC"
                  className="pointer-events-none"
                >
                  {zone.label}
                </text>
              </g>
            ))}
        </svg>

        {hoveredPart && (
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
    </div>
  )
}
