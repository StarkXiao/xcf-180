import type { BikeModel, ModelPackageConfig } from '@/types'

export const BIKE_MODELS: BikeModel[] = [
  {
    id: 'XCF-180',
    name: 'XCF-180 标准版',
    nameEn: 'XCF-180 Standard',
    description: '经典街车造型，均衡性能表现，适合日常通勤与周末兜风',
    basePrice: 29800,
  },
  {
    id: 'XCF-180R',
    name: 'XCF-180R 运动版',
    nameEn: 'XCF-180R Sport',
    description: '赛道基因加持，轻量化设计，追求极致操控与动力表现',
    basePrice: 36800,
  },
  {
    id: 'XCF-180S',
    name: 'XCF-180S 街道版',
    nameEn: 'XCF-180S Street',
    description: '时尚街跑风格，舒适骑行姿态，城市街道的个性之选',
    basePrice: 32800,
  },
]

export const MODEL_PACKAGE_CONFIGS: ModelPackageConfig[] = [
  {
    modelId: 'XCF-180',
    packages: [
      {
        type: 'basic',
        name: '基础入门包',
        description: '性价比之选，提升基础骑行体验',
        categoryParts: {
          exhaust: 'exhaust-003',
          wheels: 'wheels-002',
          handlebar: 'handlebar-003',
          lighting: 'lighting-002',
          bodykit: 'bodykit-003',
          brake: 'brake-003',
        },
      },
      {
        type: 'sport',
        name: '运动进阶包',
        description: '均衡升级，兼顾性能与外观',
        categoryParts: {
          exhaust: 'exhaust-002',
          wheels: 'wheels-002',
          handlebar: 'handlebar-001',
          lighting: 'lighting-001',
          bodykit: 'bodykit-002',
          brake: 'brake-002',
        },
      },
      {
        type: 'street',
        name: '街潮个性包',
        description: '外观控首选，彰显独特品味',
        categoryParts: {
          exhaust: 'exhaust-002',
          wheels: 'wheels-002',
          handlebar: 'handlebar-002',
          lighting: 'lighting-003',
          bodykit: 'bodykit-002',
          brake: 'brake-003',
        },
      },
    ],
  },
  {
    modelId: 'XCF-180R',
    packages: [
      {
        type: 'basic',
        name: '赛道基础包',
        description: '入门级赛道化改装，基础性能提升',
        categoryParts: {
          exhaust: 'exhaust-001',
          wheels: 'wheels-001',
          handlebar: 'handlebar-001',
          lighting: 'lighting-002',
          bodykit: 'bodykit-002',
          brake: 'brake-002',
        },
      },
      {
        type: 'sport',
        name: '竞技强化包',
        description: '专业级性能升级，赛道利器',
        categoryParts: {
          exhaust: 'exhaust-001',
          wheels: 'wheels-001',
          handlebar: 'handlebar-001',
          lighting: 'lighting-001',
          bodykit: 'bodykit-001',
          brake: 'brake-001',
        },
      },
      {
        type: 'street',
        name: '运动街跑包',
        description: '赛道基因街道化，性能与实用兼备',
        categoryParts: {
          exhaust: 'exhaust-001',
          wheels: 'wheels-003',
          handlebar: 'handlebar-001',
          lighting: 'lighting-001',
          bodykit: 'bodykit-001',
          brake: 'brake-003',
        },
      },
    ],
  },
  {
    modelId: 'XCF-180S',
    packages: [
      {
        type: 'basic',
        name: '城市通勤包',
        description: '舒适实用导向，城市通勤无忧',
        categoryParts: {
          exhaust: 'exhaust-002',
          wheels: 'wheels-002',
          handlebar: 'handlebar-002',
          lighting: 'lighting-002',
          bodykit: 'bodykit-002',
          brake: 'brake-002',
        },
      },
      {
        type: 'sport',
        name: '街跑运动包',
        description: '运动与舒适平衡，街道利器',
        categoryParts: {
          exhaust: 'exhaust-002',
          wheels: 'wheels-002',
          handlebar: 'handlebar-002',
          lighting: 'lighting-001',
          bodykit: 'bodykit-002',
          brake: 'brake-001',
        },
      },
      {
        type: 'street',
        name: '潮流风尚包',
        description: '颜值即正义，街头最靓的仔',
        categoryParts: {
          exhaust: 'exhaust-002',
          wheels: 'wheels-002',
          handlebar: 'handlebar-002',
          lighting: 'lighting-003',
          bodykit: 'bodykit-002',
          brake: 'brake-002',
        },
      },
    ],
  },
]

export function getBikeModelById(modelId: string): BikeModel | undefined {
  return BIKE_MODELS.find((m) => m.id === modelId)
}

export function getPackagesForModel(modelId: string) {
  const config = MODEL_PACKAGE_CONFIGS.find((c) => c.modelId === modelId)
  return config?.packages ?? []
}

export function getPackagePartIds(
  modelId: string,
  packageType: 'basic' | 'sport' | 'street'
): string[] {
  const packages = getPackagesForModel(modelId)
  const pkg = packages.find((p) => p.type === packageType)
  if (!pkg) return []
  return Object.values(pkg.categoryParts)
}
