import Router from '@koa/router'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const SELECTIONS_FILE = path.join(DATA_DIR, 'reception-selections.json')

function loadSelections(): any[] {
  if (!fs.existsSync(SELECTIONS_FILE)) {
    return []
  }
  return JSON.parse(fs.readFileSync(SELECTIONS_FILE, 'utf8'))
}

function saveSelections(selections: any[]) {
  fs.writeFileSync(SELECTIONS_FILE, JSON.stringify(selections, null, 2), 'utf8')
}

function loadJSON<T>(filename: string): T[] {
  const file = path.join(DATA_DIR, filename)
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function saveJSON<T>(filename: string, data: T[]) {
  const file = path.join(DATA_DIR, filename)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateQuoteNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `QJ-${y}${m}${d}-${seq}`
}

function generateScheduleNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `SG-${y}${m}${d}-${seq}`
}

const CATEGORY_LABOR_MAP: Record<string, { phase: string; hours: number; rate: number }> = {
  exhaust: { phase: 'installation', hours: 3, rate: 0.15 },
  brake: { phase: 'installation', hours: 2.5, rate: 0.18 },
  wheels: { phase: 'installation', hours: 2, rate: 0.10 },
  handlebar: { phase: 'installation', hours: 1.5, rate: 0.08 },
  lighting: { phase: 'installation', hours: 1, rate: 0.05 },
  bodykit: { phase: 'installation', hours: 4, rate: 0.12 },
  suspension: { phase: 'installation', hours: 3.5, rate: 0.15 },
  engine: { phase: 'installation', hours: 8, rate: 0.2 },
  air_filter: { phase: 'installation', hours: 0.5, rate: 0.05 },
  default: { phase: 'installation', hours: 1.5, rate: 0.1 },
}

const router = new Router({ prefix: '/api/reception' })

router.get('/selections', (ctx) => {
  const { customerId } = ctx.query
  let selections = loadSelections()
  if (customerId) {
    selections = selections.filter((s) => s.customerId === customerId)
  }
  ctx.body = selections
})

router.post('/selections', (ctx) => {
  const body = ctx.request.body as any
  const selections = loadSelections()
  const items = body.items || []
  const totalPartsAmount = items.reduce(
    (sum: number, item: any) => sum + item.unitPrice * item.quantity,
    0
  )
  const totalLaborAmount = items.reduce(
    (sum: number, item: any) => sum + (item.laborHours || 0) * 180 * 0.5,
    0
  )

  const selection = {
    id: generateId('sel'),
    customerId: body.customerId,
    customerName: body.customerName,
    requirementId: body.requirementId,
    items,
    totalPartsAmount,
    totalLaborAmount,
    totalAmount: totalPartsAmount + totalLaborAmount,
    createdBy: 'sales_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  selections.unshift(selection)
  saveSelections(selections)
  ctx.body = selection
})

router.get('/selections/:id', (ctx) => {
  const selections = loadSelections()
  const selection = selections.find((s) => s.id === ctx.params.id)
  if (!selection) {
    ctx.status = 404
    ctx.body = { error: 'Selection not found' }
    return
  }
  ctx.body = selection
})

router.put('/selections/:id', (ctx) => {
  const selections = loadSelections()
  const idx = selections.findIndex((s) => s.id === ctx.params.id)
  if (idx === -1) {
    ctx.status = 404
    ctx.body = { error: 'Selection not found' }
    return
  }
  const body = ctx.request.body as any
  const items = body.items || selections[idx].items
  const totalPartsAmount = items.reduce(
    (sum: number, item: any) => sum + item.unitPrice * item.quantity,
    0
  )
  const totalLaborAmount = items.reduce(
    (sum: number, item: any) => sum + (item.laborHours || 0) * 180 * 0.5,
    0
  )
  selections[idx] = {
    ...selections[idx],
    ...body,
    items,
    totalPartsAmount,
    totalLaborAmount,
    totalAmount: totalPartsAmount + totalLaborAmount,
    updatedAt: new Date().toISOString(),
  }
  saveSelections(selections)
  ctx.body = selections[idx]
})

router.post('/selections/:id/create-quote', (ctx) => {
  const selections = loadSelections()
  const selection = selections.find((s) => s.id === ctx.params.id)
  if (!selection) {
    ctx.status = 404
    ctx.body = { error: 'Selection not found' }
    return
  }

  const quotes = loadJSON<any>('quotes.json')
  const body = ctx.request.body as any

  const quoteItems = selection.items.map((item: any) => {
    const catInfo = CATEGORY_LABOR_MAP[item.categoryId?.toLowerCase()] || CATEGORY_LABOR_MAP.default
    const laborFee =
      item.unitPrice * catInfo.rate * item.quantity + (item.laborHours || 0) * 180 * 0.5
    return {
      partId: item.partId,
      partName: item.partName,
      partBrand: item.partBrand,
      partImage: item.partImage,
      categoryId: item.categoryId,
      categoryName: item.categoryId,
      originalPrice: item.unitPrice,
      unitPrice: item.unitPrice,
      discountRate: 1,
      quantity: item.quantity,
      laborFee,
      subtotal: item.unitPrice * item.quantity + laborFee,
    }
  })

  const partsTotal = quoteItems.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0)
  const laborFeeTotal = quoteItems.reduce((sum: number, i: any) => sum + i.laborFee, 0)
  const discountRate = body.discountRate ?? 0
  const discountTotal = (partsTotal + laborFeeTotal) * (discountRate / 100)
  const subtotal = partsTotal + laborFeeTotal - discountTotal
  const taxRate = body.taxRate ?? 13
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount

  const planId = generateId('plan')
  const now = new Date().toISOString()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)

  const quote = {
    id: generateId('quote'),
    quoteNo: generateQuoteNo(),
    customerId: selection.customerId,
    customerName: selection.customerName || body.customerName || '客户',
    customerContact: body.customerContact || selection.customerName || '',
    customerPhone: body.customerPhone || '',
    customerEmail: body.customerEmail,
    requirementId: selection.requirementId,
    selectionId: selection.id,
    modelId: 'xcf-180',
    modelName: 'XCF-180',
    packageType: null,
    packageName: '现场选配方案',
    plans: [
      {
        id: planId,
        name: '标准方案',
        description: '根据现场选配自动生成',
        items: quoteItems,
        partsTotal,
        laborFeeTotal,
        discountTotal,
        totalAmount,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    activePlanId: planId,
    status: 'draft',
    approvalFlow: null,
    customerConfirmation: null,
    exportRecords: [],
    versions: [],
    currentVersion: 1,
    validUntil: body.validUntil || validUntil.toISOString(),
    remark: body.remark,
    internalNote: body.internalNote,
    createdBy: 'sales_01',
    createdAt: now,
    updatedAt: now,
    discountRate,
    taxRate,
    depositRatio: body.depositRatio ?? 30,
  }

  quotes.unshift(quote)
  saveJSON('quotes.json', quotes)
  ctx.body = quote
})

router.post('/create-quote', (ctx) => {
  const body = ctx.request.body as any
  const quotes = loadJSON<any>('quotes.json')

  const inputItems = body.items || []
  const quoteItems = inputItems.map((item: any) => {
    const catInfo = CATEGORY_LABOR_MAP[item.categoryId?.toLowerCase()] || CATEGORY_LABOR_MAP.default
    const laborFee =
      (item.unitPrice || 0) * catInfo.rate * (item.quantity || 1) +
      (item.laborHours || 0) * 180 * 0.5
    return {
      partId: item.partId || generateId('part'),
      partName: item.name || item.partName || '配件',
      partBrand: item.brand || item.partBrand || '',
      partImage: item.image || item.partImage || '',
      categoryId: item.categoryId || '',
      categoryName: item.category || item.categoryName || '',
      originalPrice: item.unitPrice || 0,
      unitPrice: item.unitPrice || 0,
      discountRate: item.discountRate || 1,
      quantity: item.quantity || 1,
      laborFee,
      subtotal: (item.unitPrice || 0) * (item.quantity || 1) + laborFee,
    }
  })

  const partsTotal = quoteItems.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0)
  const laborFeeTotal = quoteItems.reduce((sum: number, i: any) => sum + i.laborFee, 0)
  const discountRate = body.discountRate ?? 0
  const discountTotal = (partsTotal + laborFeeTotal) * (discountRate / 100)
  const subtotal = partsTotal + laborFeeTotal - discountTotal
  const taxRate = body.taxRate ?? 13
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount

  const planId = generateId('plan')
  const now = new Date().toISOString()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)

  const quote = {
    id: generateId('quote'),
    quoteNo: generateQuoteNo(),
    customerId: body.customerId,
    customerName: body.customerName || '客户',
    customerContact: body.customerContact || body.customerName || '',
    customerPhone: body.customerPhone || '',
    customerEmail: body.customerEmail,
    requirementId: body.requirementId,
    selectionId: body.selectionId,
    modelId: body.modelId || 'xcf-180',
    modelName: body.modelName || 'XCF-180',
    packageType: body.packageType || null,
    packageName: body.packageName || '门店接待方案',
    plans:
      body.plans && body.plans.length > 0
        ? body.plans.map((p: any) => ({
            ...p,
            id: p.id || generateId('plan'),
            createdAt: p.createdAt || now,
            updatedAt: now,
          }))
        : [
            {
              id: planId,
              name: '标准方案',
              description: '门店接待方案',
              items: quoteItems,
              partsTotal,
              laborFeeTotal,
              discountTotal,
              totalAmount,
              isDefault: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
    activePlanId: body.activePlanId || planId,
    status: 'draft',
    approvalFlow: null,
    customerConfirmation: null,
    exportRecords: [],
    versions: [],
    currentVersion: 1,
    validUntil: body.validUntil || validUntil.toISOString(),
    remark: body.remark,
    internalNote: body.internalNote,
    createdBy: 'sales_01',
    createdAt: now,
    updatedAt: now,
    discountRate,
    taxRate,
    depositRatio: body.depositRatio ?? 30,
  }

  quotes.unshift(quote)
  saveJSON('quotes.json', quotes)
  ctx.body = quote
})

router.get('/quotes', (ctx) => {
  const { customerId } = ctx.query
  let quotes = loadJSON<any>('quotes.json')
  if (customerId) {
    quotes = quotes.filter((q) => q.customerId === customerId)
  }
  ctx.body = quotes
})

router.put('/quotes/:id', (ctx) => {
  const quotes = loadJSON<any>('quotes.json')
  const idx = quotes.findIndex((q) => q.id === ctx.params.id)
  if (idx === -1) {
    ctx.status = 404
    ctx.body = { error: 'Quote not found' }
    return
  }
  const body = ctx.request.body as any

  let updatedPlans = quotes[idx].plans
  if (body.plans || body.items) {
    const inputItems = body.items
    if (inputItems) {
      const quoteItems = inputItems.map((item: any) => {
        const catInfo = CATEGORY_LABOR_MAP[item.categoryId?.toLowerCase()] || CATEGORY_LABOR_MAP.default
        const laborFee =
          (item.unitPrice || 0) * catInfo.rate * (item.quantity || 1) +
          (item.laborHours || 0) * 180 * 0.5
        return {
          ...item,
          laborFee,
          subtotal: (item.unitPrice || 0) * (item.quantity || 1) + laborFee,
        }
      })
      const partsTotal = quoteItems.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0)
      const laborFeeTotal = quoteItems.reduce((s: number, i: any) => s + i.laborFee, 0)
      const discountRate = body.discountRate ?? quotes[idx].discountRate ?? 0
      const discountTotal = (partsTotal + laborFeeTotal) * (discountRate / 100)
      const taxRate = body.taxRate ?? quotes[idx].taxRate ?? 13
      const subtotal = partsTotal + laborFeeTotal - discountTotal
      const taxAmount = subtotal * (taxRate / 100)
      const totalAmount = subtotal + taxAmount

      const planId = quotes[idx].activePlanId || generateId('plan')
      const now = new Date().toISOString()
      updatedPlans = [
        {
          id: planId,
          name: '标准方案',
          items: quoteItems,
          partsTotal,
          laborFeeTotal,
          discountTotal,
          totalAmount,
          isDefault: true,
          createdAt: quotes[idx].plans?.[0]?.createdAt || now,
          updatedAt: now,
        },
      ]
    }
  }

  quotes[idx] = {
    ...quotes[idx],
    ...body,
    plans: updatedPlans,
    updatedAt: new Date().toISOString(),
  }
  saveJSON('quotes.json', quotes)
  ctx.body = quotes[idx]
})

router.get('/quotes/:id/details', (ctx) => {
  const quotes = loadJSON<any>('quotes.json')
  const customers = loadJSON<any>('customers.json')
  const requirements = loadJSON<any>('requirements.json')
  const schedules = loadJSON<any>('schedules.json')

  const quote = quotes.find((q) => q.id === ctx.params.id)
  if (!quote) {
    ctx.status = 404
    ctx.body = { error: 'Quote not found' }
    return
  }

  const customer = customers.find((c) => c.id === quote.customerId)
  const requirement = requirements.find((r) => r.id === quote.requirementId)
  const schedule = schedules.find(
    (s) => s.quoteId === quote.id || s.id === quote.convertedScheduleId
  )

  ctx.body = { ...quote, customer, requirement, schedule }
})

router.post('/quotes/create-schedule', (ctx) => {
  const body = ctx.request.body as any
  const schedules = loadJSON<any>('schedules.json')
  const quotes = loadJSON<any>('quotes.json')

  const quote = quotes.find((q) => q.id === body.quoteId)
  const plan = quote?.plans?.find((p: any) => p.id === quote.activePlanId) || quote?.plans?.[0]
  const items: any[] = plan?.items || []

  const byCategory = new Map<string, any[]>()
  items.forEach((item) => {
    const cat = item.categoryId || 'default'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(item)
  })

  const now = new Date()
  const startDate = body.plannedStartDate || now.toISOString()
  const endDateObj = new Date(now)
  endDateObj.setDate(endDateObj.getDate() + Math.max(2, Math.ceil(items.length / 3)))
  const endDate = body.plannedEndDate || endDateObj.toISOString()

  const tasks: any[] = [
    {
      id: generateId('task'),
      name: '车辆检查与评估',
      description: '全面检查车辆状况，核对改装配件清单',
      phase: 'inspection',
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: 2,
      actualHours: 0,
      order: 1,
      startDate: startDate,
      endDate: startDate,
    },
    {
      id: generateId('task'),
      name: '原厂部件拆卸',
      description: '拆卸原厂待更换部件，妥善保管配件',
      phase: 'disassembly',
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: Math.min(6, 2 + items.length * 0.5),
      actualHours: 0,
      order: 2,
    },
    {
      id: generateId('task'),
      name: '配件准备与质检',
      description: '核对所有改装配件，检查配件完整性与质量',
      phase: 'parts_prep',
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: 1 + items.length * 0.3,
      actualHours: 0,
      order: 3,
    },
  ]

  let order = 4
  byCategory.forEach((catItems, cat) => {
    const catInfo = CATEGORY_LABOR_MAP[cat.toLowerCase()] || CATEGORY_LABOR_MAP.default
    tasks.push({
      id: generateId('task'),
      name: `${catItems.map((i) => i.partName).slice(0, 2).join('、')}${catItems.length > 2 ? '等' : ''}安装`,
      description: `安装 ${catItems.length} 项配件：${catItems.map((i) => i.partName).join('、')}`,
      phase: catInfo.phase,
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: catItems.reduce(
        (sum: number, _: any, idx: number) => sum + catInfo.hours / Math.max(1, catItems.length - idx),
        0
      ) || catInfo.hours,
      actualHours: 0,
      order: order++,
    })
  })

  tasks.push(
    {
      id: generateId('task'),
      name: '调试与路试',
      description: 'ECU 调试、功能测试、道路实车测试',
      phase: 'testing',
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: 3,
      actualHours: 0,
      order: order++,
    },
    {
      id: generateId('task'),
      name: '最终质检与交付准备',
      description: '全车质量检查、车辆清洁、准备客户交车',
      phase: 'final_check',
      status: 'pending',
      assignedTo: [],
      assignedWorkerNames: [],
      estimatedHours: 2,
      actualHours: 0,
      order: order++,
    }
  )

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)

  const schedule = {
    id: generateId('sched'),
    scheduleNo: generateScheduleNo(),
    orderId: quote?.convertedOrderId,
    quoteId: body.quoteId,
    customerId: body.customerId,
    customerName: body.customerName,
    vehicleId: quote?.vehicleId,
    vehicleInfo: `${quote?.modelName || 'XCF-180'}`,
    tasks,
    plannedStartDate: startDate,
    plannedEndDate: endDate,
    totalEstimatedHours: Math.round(totalEstimatedHours * 10) / 10,
    totalActualHours: 0,
    progress: 0,
    status: 'scheduled',
    createdBy: 'sales_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    remark: body.remark,
    totalAmount: body.totalAmount,
  }

  schedules.unshift(schedule)
  saveJSON('schedules.json', schedules)

  if (quote) {
    const quoteIdx = quotes.findIndex((q) => q.id === body.quoteId)
    if (quoteIdx !== -1) {
      quotes[quoteIdx].convertedScheduleId = schedule.id
      quotes[quoteIdx].updatedAt = new Date().toISOString()
      saveJSON('quotes.json', quotes)
    }
  }

  ctx.body = schedule
})

export default router
