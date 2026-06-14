import { AlertTriangle, PackageX, Package } from 'lucide-react'
import type { StockLevel } from '@/types'

interface Props {
  stockLevel: StockLevel
  availableStock?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

const SIZE_MAP = {
  sm: { icon: 10, text: 'text-[9px]', px: 'px-1.5', py: 'py-0.5' },
  md: { icon: 12, text: 'text-[10px]', px: 'px-2', py: 'py-0.5' },
  lg: { icon: 14, text: 'text-xs', px: 'px-2.5', py: 'py-1' },
}

export default function StockAlertBadge({ stockLevel, availableStock, size = 'md', showCount = false }: Props) {
  const s = SIZE_MAP[size]

  if (stockLevel === 'in_stock') {
    if (!showCount) return null
    return (
      <span className={`inline-flex items-center gap-0.5 ${s.text} ${s.px} ${s.py} rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-orbitron`}>
        <Package size={s.icon} />
        {availableStock !== undefined && availableStock}
      </span>
    )
  }

  if (stockLevel === 'out_of_stock') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${s.text} ${s.px} ${s.py} rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-orbitron`}>
        <PackageX size={s.icon} />
        缺货
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${s.text} ${s.px} ${s.py} rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-orbitron`}>
      <AlertTriangle size={s.icon} />
      库存低
      {showCount && availableStock !== undefined && `(${availableStock})`}
    </span>
  )
}
