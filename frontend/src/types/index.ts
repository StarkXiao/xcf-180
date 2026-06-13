export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  description?: string
  sortOrder?: number
}

export interface PartPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface Part {
  id: string
  name: string
  categoryId: string
  price: number
  image: string
  description: string
  specs: Record<string, string | boolean | number>
  compatible: string[]
  position: PartPosition
}

export interface SelectionItem {
  partId: string
  quantity: number
}

export interface Selection {
  id: string
  name: string
  items: SelectionItem[]
  createdAt: string
  updatedAt: string
}
