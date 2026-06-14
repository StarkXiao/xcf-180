import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const quotesDataPath = path.resolve(__dirname, '../../data/quotes.json');
const discountRulesDataPath = path.resolve(__dirname, '../../data/discount-rules.json');
const selectionsDataPath = path.resolve(__dirname, '../../data/selections.json');
const partsDataPath = path.resolve(__dirname, '../../data/parts.json');

function loadQuotesData() {
  const raw = readFileSync(quotesDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveQuotesData(data: any) {
  writeFileSync(quotesDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadDiscountRulesData() {
  const raw = readFileSync(discountRulesDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveDiscountRulesData(data: any) {
  writeFileSync(discountRulesDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadSelectionsData() {
  const raw = readFileSync(selectionsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function loadPartsData() {
  const raw = readFileSync(partsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function getCategoryName(categories: any[], categoryId: string): string {
  return categories.find((c: any) => c.id === categoryId)?.name || categoryId;
}

const laborFeeRates: Record<string, number> = {
  exhaust: 0.15,
  brake: 0.18,
  wheels: 0.10,
  handlebar: 0.08,
  lighting: 0.05,
  bodykit: 0.12,
};

const modelNames: Record<string, string> = {
  'XCF-180': 'XCF-180 标准版',
  'XCF-180R': 'XCF-180R 运动版',
  'XCF-180S': 'XCF-180S 街道版',
};

const packageNames: Record<string, string> = {
  basic: '基础版',
  sport: '运动版',
  street: '街潮版',
};

function generateQuoteNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${dateStr}-${random}`;
}

function createApprovalFlow(): any {
  return {
    id: `flow-${Date.now()}`,
    currentStep: 0,
    nodes: [
      { id: 'node-sales', role: 'sales', status: 'pending' },
      { id: 'node-sales-manager', role: 'sales_manager', status: 'pending' },
      { id: 'node-finance', role: 'finance', status: 'pending' },
      { id: 'node-gm', role: 'general_manager', status: 'pending' },
    ],
    history: [],
  };
}

function buildQuoteItems(
  selectionItems: any[],
  partsData: any,
  overridePrices?: Map<string, { unitPrice?: number; discountRate?: number }>
): { items: any[]; partsTotal: number; laborFeeTotal: number; discountTotal: number } {
  const items: any[] = [];
  let partsTotal = 0;
  let laborFeeTotal = 0;
  let discountTotal = 0;

  for (const selItem of selectionItems) {
    const part = partsData.parts.find((p: any) => p.id === selItem.partId);
    if (!part) continue;

    const categoryName = getCategoryName(partsData.categories, part.categoryId);
    const override = overridePrices?.get(selItem.partId);
    const originalPrice = part.price;
    const userSetUnitPrice = override?.unitPrice ?? originalPrice;
    const discountRate = override?.discountRate ?? 0;
    const finalUnitPrice = userSetUnitPrice * (1 - discountRate / 100);
    const originalLineTotal = originalPrice * selItem.quantity;
    const finalLineTotal = finalUnitPrice * selItem.quantity;
    const laborFee = Math.round(finalLineTotal * (laborFeeRates[part.categoryId] ?? 0.1));
    const subtotal = finalLineTotal + laborFee;
    const discountAmount = originalLineTotal - finalLineTotal;

    items.push({
      partId: part.id,
      partName: part.name,
      partBrand: part.brand,
      partImage: part.image,
      categoryId: part.categoryId,
      categoryName,
      originalPrice,
      unitPrice: finalUnitPrice,
      discountRate,
      quantity: selItem.quantity,
      laborFee,
      subtotal,
    });

    partsTotal += originalLineTotal;
    laborFeeTotal += laborFee;
    discountTotal += discountAmount;
  }

  return { items, partsTotal, laborFeeTotal, discountTotal };
}

function calculatePlanTotals(items: any[]): { partsTotal: number; laborFeeTotal: number; discountTotal: number; totalAmount: number } {
  let partsTotal = 0;
  let laborFeeTotal = 0;
  let discountTotal = 0;
  for (const item of items) {
    const originalLineTotal = item.originalPrice * item.quantity;
    const finalUnitPrice = item.originalPrice * (1 - (item.discountRate ?? 0) / 100);
    const finalLineTotal = finalUnitPrice * item.quantity;
    partsTotal += originalLineTotal;
    laborFeeTotal += item.laborFee ?? 0;
    discountTotal += originalLineTotal - finalLineTotal;
  }
  const totalAmount = Math.max(0, Math.round(partsTotal + laborFeeTotal - discountTotal));
  return {
    partsTotal: Math.round(partsTotal),
    laborFeeTotal: Math.round(laborFeeTotal),
    discountTotal: Math.round(discountTotal),
    totalAmount,
  };
}

router.get('/api/quotes', (ctx) => {
  const data = loadQuotesData();
  const { status, customerName, modelId } = ctx.query;

  let quotes = data.quotes;

  if (status) {
    quotes = quotes.filter((q: any) => q.status === status);
  }
  if (customerName) {
    quotes = quotes.filter((q: any) =>
      q.customerName.toLowerCase().includes((customerName as string).toLowerCase())
    );
  }
  if (modelId) {
    quotes = quotes.filter((q: any) => q.modelId === modelId);
  }

  quotes = quotes.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ctx.body = quotes;
});

router.get('/api/quotes/:id', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }
  ctx.body = quote;
});

router.post('/api/quotes', (ctx) => {
  const quotesData = loadQuotesData();
  const selectionsData = loadSelectionsData();
  const partsData = loadPartsData();

  const body = ctx.request.body as any;
  const {
    selectionId,
    customerName,
    customerContact,
    customerPhone,
    customerEmail,
    modelId,
    packageType,
    remark,
    validUntil,
  } = body;

  const selection = selectionsData.selections.find((s: any) => s.id === selectionId);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }

  const { items, partsTotal, laborFeeTotal, discountTotal } = buildQuoteItems(selection.items, partsData);

  const now = new Date().toISOString();
  const planId = `plan-${Date.now()}`;
  const plan: any = {
    id: planId,
    name: '标准方案',
    description: '基于选配清单生成的标准报价方案',
    items,
    partsTotal,
    laborFeeTotal,
    discountTotal,
    totalAmount: Math.max(0, partsTotal + laborFeeTotal - discountTotal),
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };

  const newQuote: any = {
    id: `quote-${Date.now()}`,
    quoteNo: generateQuoteNo(),
    customerName,
    customerContact,
    customerPhone,
    customerEmail: customerEmail || '',
    modelId,
    modelName: modelNames[modelId] || modelId,
    packageType: packageType || null,
    packageName: packageType ? packageNames[packageType] || '' : '',
    plans: [plan],
    activePlanId: planId,
    status: 'draft',
    approvalFlow: null,
    customerConfirmation: null,
    exportRecords: [],
    versions: [],
    currentVersion: 1,
    validUntil: validUntil || null,
    remark: remark || '',
    internalNote: '',
    createdBy: 'current-user',
    createdAt: now,
    updatedAt: now,
  };

  quotesData.quotes.push(newQuote);
  saveQuotesData(quotesData);

  ctx.status = 201;
  ctx.body = newQuote;
});

router.put('/api/quotes/:id', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const body = ctx.request.body as any;
  const updatableFields = [
    'customerName', 'customerContact', 'customerPhone', 'customerEmail',
    'remark', 'internalNote', 'validUntil', 'activePlanId'
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      (quote as any)[field] = body[field];
    }
  }

  quote.updatedAt = new Date().toISOString();
  saveQuotesData(data);
  ctx.body = quote;
});

router.delete('/api/quotes/:id', (ctx) => {
  const data = loadQuotesData();
  const index = data.quotes.findIndex((q: any) => q.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  data.quotes.splice(index, 1);
  saveQuotesData(data);
  ctx.body = { success: true };
});

router.post('/api/quotes/:id/plans', (ctx) => {
  const data = loadQuotesData();
  const partsData = loadPartsData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const body = ctx.request.body as any;
  const { name, description, items: planItems, isDefault } = body;

  const overridePrices = new Map<string, { unitPrice?: number; discountRate?: number }>();
  planItems.forEach((item: any) => {
    overridePrices.set(item.partId, {
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
    });
  });

  const { items, partsTotal, laborFeeTotal, discountTotal } = buildQuoteItems(planItems, partsData, overridePrices);

  const now = new Date().toISOString();
  const newPlan: any = {
    id: `plan-${Date.now()}`,
    name: name || '新方案',
    description: description || '',
    items,
    partsTotal,
    laborFeeTotal,
    discountTotal,
    totalAmount: Math.max(0, partsTotal + laborFeeTotal - discountTotal),
    isDefault: isDefault || false,
    createdAt: now,
    updatedAt: now,
  };

  if (isDefault) {
    quote.plans.forEach((p: any) => { p.isDefault = false; });
  }

  quote.plans.push(newPlan);
  quote.updatedAt = now;
  saveQuotesData(data);

  ctx.status = 201;
  ctx.body = newPlan;
});

router.put('/api/quotes/:id/plans/:planId', (ctx) => {
  const data = loadQuotesData();
  const partsData = loadPartsData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const plan = quote.plans.find((p: any) => p.id === ctx.params.planId);
  if (!plan) {
    ctx.status = 404;
    ctx.body = { error: 'Plan not found' };
    return;
  }

  const body = ctx.request.body as any;
  const { name, description, items: planItems, isDefault } = body;

  if (name !== undefined) plan.name = name;
  if (description !== undefined) plan.description = description;
  if (isDefault !== undefined) {
    quote.plans.forEach((p: any) => { p.isDefault = false; });
    plan.isDefault = isDefault;
  }

  if (planItems) {
    const overridePrices = new Map<string, { unitPrice?: number; discountRate?: number }>();
    planItems.forEach((item: any) => {
      overridePrices.set(item.partId, {
        unitPrice: item.unitPrice,
        discountRate: item.discountRate,
      });
    });

    const { items, partsTotal, laborFeeTotal, discountTotal } = buildQuoteItems(planItems, partsData, overridePrices);
    plan.items = items;
    plan.partsTotal = partsTotal;
    plan.laborFeeTotal = laborFeeTotal;
    plan.discountTotal = discountTotal;
    plan.totalAmount = Math.max(0, partsTotal + laborFeeTotal - discountTotal);
  }

  plan.updatedAt = new Date().toISOString();
  quote.updatedAt = plan.updatedAt;
  saveQuotesData(data);

  ctx.body = plan;
});

router.delete('/api/quotes/:id/plans/:planId', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const planIndex = quote.plans.findIndex((p: any) => p.id === ctx.params.planId);
  if (planIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Plan not found' };
    return;
  }

  if (quote.plans.length <= 1) {
    ctx.status = 400;
    ctx.body = { error: 'Cannot delete the only plan' };
    return;
  }

  const deletedPlan = quote.plans[planIndex];
  quote.plans.splice(planIndex, 1);

  if (deletedPlan.isDefault || quote.activePlanId === deletedPlan.id) {
    quote.plans[0].isDefault = true;
    quote.activePlanId = quote.plans[0].id;
  }

  quote.updatedAt = new Date().toISOString();
  saveQuotesData(data);
  ctx.body = { success: true };
});

router.get('/api/quotes/:id/compare', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const { planA: planAId, planB: planBId } = ctx.query;
  const planA = quote.plans.find((p: any) => p.id === planAId);
  const planB = quote.plans.find((p: any) => p.id === planBId);

  if (!planA || !planB) {
    ctx.status = 400;
    ctx.body = { error: 'Both plans are required' };
    return;
  }

  const totalDiff = planB.totalAmount - planA.totalAmount;
  const totalDiffPercent = planA.totalAmount > 0 ? (totalDiff / planA.totalAmount) * 100 : 0;

  const mapA = new Map<string, any>();
  const mapB = new Map<string, any>();
  planA.items.forEach((item: any) => mapA.set(item.partId, item));
  planB.items.forEach((item: any) => mapB.set(item.partId, item));

  const allPartIds = new Set([...mapA.keys(), ...mapB.keys()]);
  const comparedItems: any[] = [];

  allPartIds.forEach((partId) => {
    const itemA = mapA.get(partId);
    const itemB = mapB.get(partId);
    const quantityA = itemA?.quantity || 0;
    const quantityB = itemB?.quantity || 0;
    const priceA = itemA?.subtotal || 0;
    const priceB = itemB?.subtotal || 0;

    let diffType: string;
    if (quantityA === 0 && quantityB > 0) diffType = 'added';
    else if (quantityA > 0 && quantityB === 0) diffType = 'removed';
    else if (quantityA !== quantityB || priceA !== priceB) diffType = 'modified';
    else diffType = 'unchanged';

    comparedItems.push({
      partId,
      partName: itemA?.partName || itemB?.partName || partId,
      quantityA,
      quantityB,
      priceA,
      priceB,
      priceDiff: priceB - priceA,
      diffType,
    });
  });

  ctx.body = {
    planA,
    planB,
    totalDiff,
    totalDiffPercent,
    items: comparedItems,
  };
});

router.post('/api/quotes/:id/submit-approval', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  if (quote.status !== 'draft') {
    ctx.status = 400;
    ctx.body = { error: 'Only draft quotes can be submitted for approval' };
    return;
  }

  const body = ctx.request.body as any;
  const { submitter, comment } = body;

  quote.approvalFlow = createApprovalFlow();
  quote.approvalFlow.startedAt = new Date().toISOString();
  quote.status = 'pending_approval';
  quote.updatedAt = quote.approvalFlow.startedAt;

  if (comment) {
    quote.approvalFlow.history.push({
      nodeId: 'submit',
      role: 'sales',
      approverName: submitter,
      action: 'approve',
      comment,
      actedAt: quote.updatedAt,
    });
  }

  saveQuotesData(data);
  ctx.body = quote;
});

router.put('/api/quotes/:id/approval/:nodeId', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote || !quote.approvalFlow) {
    ctx.status = 404;
    ctx.body = { error: 'Quote or approval flow not found' };
    return;
  }

  const body = ctx.request.body as any;
  const { role, action, approverName, comment } = body;

  const node = quote.approvalFlow.nodes.find((n: any) => n.id === ctx.params.nodeId);
  if (!node) {
    ctx.status = 404;
    ctx.body = { error: 'Approval node not found' };
    return;
  }

  const now = new Date().toISOString();
  node.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned';
  node.approverName = approverName;
  node.actionAt = now;
  node.comment = comment;

  quote.approvalFlow.history.push({
    nodeId: node.id,
    role,
    approverName,
    action,
    comment,
    actedAt: now,
  });

  if (action === 'reject') {
    quote.status = 'rejected';
    quote.approvalFlow.completedAt = now;
  } else if (action === 'return') {
    quote.status = 'draft';
    quote.approvalFlow.currentStep = 0;
    quote.approvalFlow.nodes.forEach((n: any) => {
      if (n.status === 'pending' || n.status === 'approved') n.status = 'pending';
    });
  } else {
    const currentIndex = quote.approvalFlow.nodes.findIndex((n: any) => n.id === node.id);
    quote.approvalFlow.currentStep = currentIndex + 1;

    if (currentIndex === quote.approvalFlow.nodes.length - 1) {
      quote.status = 'approved';
      quote.approvalFlow.completedAt = now;
    }
  }

  quote.updatedAt = now;
  saveQuotesData(data);
  ctx.body = quote;
});

router.post('/api/quotes/:id/send-to-customer', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  if (quote.status !== 'approved') {
    ctx.status = 400;
    ctx.body = { error: 'Only approved quotes can be sent to customer' };
    return;
  }

  quote.status = 'sent_to_customer';
  quote.updatedAt = new Date().toISOString();
  saveQuotesData(data);
  ctx.body = quote;
});

router.post('/api/quotes/:id/customer-confirm', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const body = ctx.request.body as any;
  const { planId, confirmedBy, contactInfo, signature, note } = body;

  quote.customerConfirmation = {
    id: `confirm-${Date.now()}`,
    confirmedBy,
    confirmedAt: new Date().toISOString(),
    contactInfo,
    signature,
    note,
    selectedPlanId: planId || quote.activePlanId,
  };

  quote.status = 'customer_confirmed';
  if (planId) quote.activePlanId = planId;
  quote.updatedAt = quote.customerConfirmation.confirmedAt;

  saveQuotesData(data);
  ctx.body = quote;
});

router.post('/api/quotes/:id/customer-reject', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const body = ctx.request.body as any;
  quote.customerConfirmation = {
    id: `confirm-${Date.now()}`,
    confirmedBy: body.confirmedBy || 'customer',
    confirmedAt: new Date().toISOString(),
    contactInfo: body.contactInfo || '',
    note: body.note || '',
  };

  quote.status = 'customer_rejected';
  quote.updatedAt = quote.customerConfirmation.confirmedAt;

  saveQuotesData(data);
  ctx.body = quote;
});

router.post('/api/quotes/:id/export', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  const body = ctx.request.body as any;
  const { format, planId, exportedBy } = body;

  const exportRecord: any = {
    id: `export-${Date.now()}`,
    exportedBy,
    exportedAt: new Date().toISOString(),
    format,
    version: quote.currentVersion,
  };

  quote.exportRecords.push(exportRecord);
  quote.updatedAt = exportRecord.exportedAt;
  saveQuotesData(data);

  const plan = planId ? quote.plans.find((p: any) => p.id === planId) : quote.plans.find((p: any) => p.id === quote.activePlanId);

  ctx.body = {
    success: true,
    quote,
    plan: plan || quote.plans[0],
    exportRecord,
  };
});

router.post('/api/quotes/:id/convert', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }

  if (quote.status !== 'customer_confirmed') {
    ctx.status = 400;
    ctx.body = { error: 'Only customer confirmed quotes can be converted' };
    return;
  }

  const body = ctx.request.body as any;
  quote.status = 'converted';
  quote.convertedOrderId = body?.orderId || `ord-${Date.now()}`;
  quote.updatedAt = new Date().toISOString();
  saveQuotesData(data);
  ctx.body = quote;
});

router.get('/api/discount-rules', (ctx) => {
  const data = loadDiscountRulesData();
  const { isActive } = ctx.query;

  let rules = data.rules;
  if (isActive !== undefined) {
    rules = rules.filter((r: any) => r.isActive === (isActive === 'true'));
  }

  rules = rules.sort((a: any, b: any) => a.priority - b.priority);
  ctx.body = rules;
});

router.post('/api/discount-rules', (ctx) => {
  const data = loadDiscountRulesData();
  const body = ctx.request.body as any;

  const now = new Date().toISOString();
  const newRule: any = {
    id: `rule-${Date.now()}`,
    name: body.name,
    description: body.description || '',
    type: body.type,
    value: body.value,
    minAmount: body.minAmount,
    maxAmount: body.maxAmount,
    categoryId: body.categoryId,
    brand: body.brand,
    minQuantity: body.minQuantity,
    priority: body.priority || data.rules.length,
    isActive: body.isActive !== undefined ? body.isActive : true,
    createdAt: now,
    updatedAt: now,
  };

  data.rules.push(newRule);
  saveDiscountRulesData(data);

  ctx.status = 201;
  ctx.body = newRule;
});

router.put('/api/discount-rules/:id', (ctx) => {
  const data = loadDiscountRulesData();
  const rule = data.rules.find((r: any) => r.id === ctx.params.id);
  if (!rule) {
    ctx.status = 404;
    ctx.body = { error: 'Discount rule not found' };
    return;
  }

  const body = ctx.request.body as any;
  const updatableFields = [
    'name', 'description', 'type', 'value', 'minAmount', 'maxAmount',
    'categoryId', 'brand', 'minQuantity', 'priority', 'isActive'
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      (rule as any)[field] = body[field];
    }
  }

  rule.updatedAt = new Date().toISOString();
  saveDiscountRulesData(data);
  ctx.body = rule;
});

router.delete('/api/discount-rules/:id', (ctx) => {
  const data = loadDiscountRulesData();
  const index = data.rules.findIndex((r: any) => r.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Discount rule not found' };
    return;
  }

  data.rules.splice(index, 1);
  saveDiscountRulesData(data);
  ctx.body = { success: true };
});

router.post('/api/discount-rules/calculate', (ctx) => {
  const rulesData = loadDiscountRulesData();
  const body = ctx.request.body as any;
  const { items, totalAmount } = body;

  const activeRules = rulesData.rules
    .filter((r: any) => r.isActive)
    .sort((a: any, b: any) => a.priority - b.priority);

  const results: any[] = [];
  let totalDiscount = 0;

  for (const rule of activeRules) {
    let applied = false;
    let appliedAmount = 0;
    let description = '';

    switch (rule.type) {
      case 'percentage':
        if ((!rule.minAmount || totalAmount >= rule.minAmount) &&
            (!rule.maxAmount || totalAmount <= rule.maxAmount)) {
          appliedAmount = totalAmount * (rule.value / 100);
          description = `订单满${rule.minAmount || 0}元，享受${rule.value}%折扣`;
          applied = true;
        }
        break;
      case 'fixed':
        if ((!rule.minAmount || totalAmount >= rule.minAmount) &&
            (!rule.maxAmount || totalAmount <= rule.maxAmount)) {
          appliedAmount = rule.value;
          description = `订单满${rule.minAmount || 0}元，立减${rule.value}元`;
          applied = true;
        }
        break;
      case 'category':
        const catItems = items.filter((i: any) => i.categoryId === rule.categoryId);
        if (catItems.length > 0) {
          const catTotal = catItems.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
          appliedAmount = catTotal * (rule.value / 100);
          description = `分类折扣：${rule.value}% off`;
          applied = true;
        }
        break;
      case 'brand':
        const brandItems = items.filter((i: any) => i.brand === rule.brand);
        if (brandItems.length > 0) {
          const brandTotal = brandItems.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
          appliedAmount = brandTotal * (rule.value / 100);
          description = `品牌${rule.brand}折扣：${rule.value}% off`;
          applied = true;
        }
        break;
      case 'volume':
        const qty = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
        if (rule.minQuantity && qty >= rule.minQuantity) {
          appliedAmount = totalAmount * (rule.value / 100);
          description = `购买${rule.minQuantity}件以上，享受${rule.value}%折扣`;
          applied = true;
        }
        break;
    }

    if (applied && appliedAmount > 0) {
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        appliedAmount: Math.round(appliedAmount),
        description,
      });
      totalDiscount += appliedAmount;
    }
  }

  ctx.body = {
    results,
    totalDiscount: Math.round(totalDiscount),
    finalAmount: Math.round(totalAmount - totalDiscount),
  };
});

router.post('/api/quotes/:id/plans/:planId/apply-discount', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }
  const plan = quote.plans.find((p: any) => p.id === ctx.params.planId);
  if (!plan) {
    ctx.status = 404;
    ctx.body = { error: 'Plan not found' };
    return;
  }
  if (quote.status !== 'draft') {
    ctx.status = 400;
    ctx.body = { error: 'Only draft quotes can apply discount rules' };
    return;
  }

  const rulesData = loadDiscountRulesData();
  const activeRules = rulesData.rules
    .filter((r: any) => r.isActive)
    .sort((a: any, b: any) => a.priority - b.priority);

  const calcItems = plan.items.map((i: any) => ({
    partId: i.partId,
    categoryId: i.categoryId,
    brand: i.partBrand,
    unitPrice: i.originalPrice,
    quantity: i.quantity,
  }));
  const basePartsTotal = plan.items.reduce((s: number, i: any) => s + i.originalPrice * i.quantity, 0);
  const baseTotal = basePartsTotal + plan.laborFeeTotal;

  const appliedRules: any[] = [];
  let totalDiscount = plan.discountTotal;

  for (const rule of activeRules) {
    let appliedAmount = 0;
    let description = '';
    let applied = false;

    switch (rule.type) {
      case 'percentage':
        if ((!rule.minAmount || baseTotal >= rule.minAmount) &&
            (!rule.maxAmount || baseTotal <= rule.maxAmount)) {
          appliedAmount = baseTotal * (rule.value / 100);
          description = `满${rule.minAmount || 0}元${rule.value}%折扣`;
          applied = true;
        }
        break;
      case 'fixed':
        if ((!rule.minAmount || baseTotal >= rule.minAmount) &&
            (!rule.maxAmount || baseTotal <= rule.maxAmount)) {
          appliedAmount = rule.value;
          description = `满${rule.minAmount || 0}元立减${rule.value}元`;
          applied = true;
        }
        break;
      case 'category':
        const catItems = calcItems.filter((i: any) => i.categoryId === rule.categoryId);
        if (catItems.length > 0) {
          const catTotal = catItems.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
          appliedAmount = catTotal * (rule.value / 100);
          description = `分类${rule.value}% off`;
          applied = true;
        }
        break;
      case 'brand':
        const brandItems = calcItems.filter((i: any) => i.brand === rule.brand);
        if (brandItems.length > 0) {
          const brandTotal = brandItems.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
          appliedAmount = brandTotal * (rule.value / 100);
          description = `品牌${rule.brand}${rule.value}% off`;
          applied = true;
        }
        break;
      case 'volume':
        const qty = calcItems.reduce((s: number, i: any) => s + i.quantity, 0);
        if (rule.minQuantity && qty >= rule.minQuantity) {
          appliedAmount = baseTotal * (rule.value / 100);
          description = `${rule.minQuantity}件以上${rule.value}% off`;
          applied = true;
        }
        break;
    }

    if (applied && appliedAmount > 0) {
      appliedRules.push({ ruleId: rule.id, ruleName: rule.name, appliedAmount: Math.round(appliedAmount), description });
      totalDiscount += Math.round(appliedAmount);
    }
  }

  plan.discountTotal = Math.round(totalDiscount);
  plan.totalAmount = Math.max(0, plan.partsTotal + plan.laborFeeTotal - plan.discountTotal);
  plan.appliedDiscountRules = appliedRules;
  plan.updatedAt = new Date().toISOString();
  quote.updatedAt = plan.updatedAt;
  saveQuotesData(data);

  ctx.body = {
    success: true,
    plan,
    appliedRules,
    totalDiscount: plan.discountTotal,
    totalAmount: plan.totalAmount,
  };
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function buildQuotationHTML(quote: any, plan: any): string {
  const groupedItems: Record<string, any[]> = {};
  for (const item of plan.items) {
    if (!groupedItems[item.categoryId]) groupedItems[item.categoryId] = [];
    groupedItems[item.categoryId].push(item);
  }

  let rowsHTML = '';
  let globalIdx = 0;
  for (const [categoryId, items] of Object.entries(groupedItems)) {
    const categoryName = items[0]?.categoryName ?? '未分类';
    const categorySubtotal = items.reduce((s: number, it: any) => s + it.subtotal, 0);
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const isFirst = idx === 0;
      globalIdx++;
      rowsHTML += `<tr>
        <td class="bdr" style="text-align:center">${globalIdx}</td>
        ${isFirst ? `<td class="bdr" style="font-weight:600;background:#f9fafb" rowspan="${items.length}">${categoryName}</td>` : ''}
        <td class="bdr">${item.partName}</td>
        <td class="bdr" style="text-align:center">${item.partBrand}</td>
        <td class="bdr" style="text-align:center">×${item.quantity}</td>
        <td class="bdr" style="text-align:right">¥${item.originalPrice.toLocaleString()}</td>
        <td class="bdr" style="text-align:right">¥${item.unitPrice.toLocaleString()}</td>
        <td class="bdr" style="text-align:center">${Math.round((item.discountRate || 0) * 100)}%</td>
        <td class="bdr" style="text-align:right;font-weight:600">¥${item.subtotal.toLocaleString()}</td>
      </tr>`;
    }
    rowsHTML += `<tr style="background:#f9fafb">
      <td class="bdr" colspan="8" style="text-align:right;font-style:italic;color:#6b7280;font-size:12px">${categoryName} 小计</td>
      <td class="bdr" style="text-align:right;font-weight:700">¥${categorySubtotal.toLocaleString()}</td>
    </tr>`;
  }

  const digitToChinese = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
  const unitSection = ['','拾','佰','仟'];
  const unitBig = ['','万','亿','兆'];
  const num = plan.totalAmount;
  let cnAmount = '零元整';
  if (num > 0) {
    const yuan = Math.floor(num);
    const jiao = Math.floor((num - yuan) * 10);
    const convertInt = (n: number): string => {
      if (n === 0) return '零';
      let res = '', zeroFlag = false;
      const str = n.toString();
      for (let i = 0; i < str.length; i++) {
        const d = parseInt(str[i]);
        const pos = str.length - 1 - i;
        const sp = Math.floor(pos / 4);
        const up = pos % 4;
        if (d === 0) { zeroFlag = true; }
        else {
          if (zeroFlag) { res += '零'; zeroFlag = false; }
          res += digitToChinese[d] + unitSection[up];
        }
        if (up === 0 && sp > 0) { if (!zeroFlag || res.slice(-1) !== unitBig[sp]) res += unitBig[sp]; zeroFlag = false; }
      }
      return res;
    };
    cnAmount = convertInt(yuan) + '元' + (jiao > 0 ? digitToChinese[jiao] + '角' : '整');
  }

  const approvalHistory = (quote.approvalFlow?.history ?? []).map((h: any) => {
    const roleLabels: Record<string,string> = {sales:'销售',sales_manager:'销售经理',finance:'财务',general_manager:'总经理'};
    const actionLabels: Record<string,string> = {approve:'通过',reject:'拒绝',return:'退回'};
    const date = h.actedAt ? new Date(h.actedAt).toLocaleString('zh-CN') : '';
    return `<div style="margin:8px 0;padding:10px 12px;background:#f9fafb;border-left:3px solid #f97316;border-radius:4px;font-size:13px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span><b>${h.approverName || '系统'}</b>（${roleLabels[h.role] || h.role}）<span style="margin-left:8px;padding:2px 6px;background:#fee2e2;color:#b91c1c;border-radius:4px;font-size:12px">${actionLabels[h.action] || h.action}</span></span>
        <span style="color:#6b7280;font-size:12px">${date}</span>
      </div>
      ${h.comment ? `<div style="color:#4b5563;margin-top:4px">📝 ${h.comment}</div>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${quote.quoteNo} 报价单</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:#fff;color:#111827;padding:48px 56px;line-height:1.6;font-size:14px}
  h1{font-size:28px;font-weight:700;text-align:center;letter-spacing:2px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;margin-bottom:32px}
  .sub{text-align:center;color:#6b7280;font-size:13px;margin-top:-24px;margin-bottom:32px;letter-spacing:3px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 48px;margin-bottom:28px;font-size:14px}
  .info-item{display:flex;gap:6px}
  .info-label{color:#6b7280;min-width:80px;flex-shrink:0}
  .info-val{font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
  th{background:#f3f4f6;border:1px solid #d1d5db;padding:10px 8px;font-weight:600;text-align:center}
  .bdr{border:1px solid #d1d5db;padding:8px 8px}
  .sum{background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #e5e7eb}
  .sum-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
  .sum-final{font-size:22px;font-weight:700;color:#ea580c;letter-spacing:1px}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding-top:32px;border-top:1px solid #e5e7eb}
  .sign-box{padding:12px 0}
  .sign-label{font-size:14px;color:#6b7280;margin-bottom:48px}
  .sign-line{border-top:1px solid #6b7280;padding-top:8px;display:flex;justify-content:space-between;font-size:12px;color:#6b7280}
  .foot{margin-top:32px;padding-top:16px;border-top:1px dashed #d1d5db;text-align:center;font-size:12px;color:#9ca3af}
  .remark{padding:12px 0;margin-bottom:16px;font-size:14px}
  .history-title{font-weight:700;margin:24px 0 12px;font-size:15px;color:#1f2937;padding-bottom:8px;border-bottom:1px solid #e5e7eb}
  @media print{body{padding:24px}}
</style>
</head>
<body>
  <h1>XCF-180 摩托车改装报价单</h1>
  <div class="sub">MOTORCYCLE CUSTOMIZATION QUOTATION</div>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">报价单号：</span><span class="info-val">${quote.quoteNo}</span></div>
    <div class="info-item"><span class="info-label">日 期：</span><span class="info-val">${formatDate(quote.createdAt)}</span></div>
    <div class="info-item"><span class="info-label">客户名称：</span><span class="info-val">${quote.customerName}</span></div>
    <div class="info-item"><span class="info-label">联 系 人：</span><span class="info-val">${quote.customerContact}</span></div>
    <div class="info-item"><span class="info-label">联系电话：</span><span class="info-val">${quote.customerPhone}</span></div>
    <div class="info-item"><span class="info-label">有效期至：</span><span class="info-val">${formatDate(quote.validUntil)}</span></div>
    <div class="info-item" style="grid-column:span 2"><span class="info-label">车 型：</span><span class="info-val">${quote.modelName}${quote.packageName ? '（' + quote.packageName + '）' : ''}</span></div>
    ${quote.plans.length > 1 ? `<div class="info-item" style="grid-column:span 2"><span class="info-label">方 案：</span><span class="info-val">${plan.name}${plan.description ? ' — ' + plan.description : ''}</span></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:6%">序号</th>
        <th style="width:12%">分类</th>
        <th>配件名称</th>
        <th style="width:10%">品牌</th>
        <th style="width:8%">数量</th>
        <th style="width:10%">原价</th>
        <th style="width:10%">单价</th>
        <th style="width:7%">折扣</th>
        <th style="width:12%">小计</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>

  <div class="sum">
    <div class="sum-row"><span>配件小计：</span><span class="info-val">¥${plan.partsTotal.toLocaleString()}</span></div>
    <div class="sum-row"><span>工费合计：</span><span class="info-val">¥${plan.laborFeeTotal.toLocaleString()}</span></div>
    <div class="sum-row"><span style="color:#059669">优惠金额：</span><span style="color:#059669;font-weight:600">-¥${plan.discountTotal.toLocaleString()}</span></div>
    ${(plan.appliedDiscountRules ?? []).length > 0 ? `<div style="padding:8px 0 4px 24px;color:#059669;font-size:13px">
      ${plan.appliedDiscountRules.map((r: any) => `· ${r.description}（-¥${r.appliedAmount.toLocaleString()}）`).join('<br>')}
    </div>` : ''}
    <div class="sum-row" style="padding-top:12px;border-top:1px solid #e5e7eb;margin-top:8px">
      <span>报价总计（小写）：</span>
      <span class="sum-final">¥${plan.totalAmount.toLocaleString()}</span>
    </div>
    <div class="sum-row" style="padding-top:8px">
      <span>报价总计（大写）：</span>
      <span class="info-val" style="letter-spacing:1px">${cnAmount}</span>
    </div>
  </div>

  ${quote.remark ? `<div class="remark"><span style="color:#6b7280">备注：</span><span>${quote.remark}</span></div>` : ''}

  ${approvalHistory ? `<div class="history-title">📋 审批意见留痕</div>${approvalHistory}` : ''}

  <div class="sign">
    <div class="sign-box">
      <div class="sign-label">审批人签字：</div>
      <div class="sign-line"><span>签字：_______________</span><span>日期：_______________</span></div>
    </div>
    <div class="sign-box">
      <div class="sign-label">客户确认：</div>
      <div class="sign-line"><span>签字：_______________</span><span>日期：_______________</span></div>
    </div>
  </div>

  <div class="foot">本报价单由 XCF-180 摩托车改装系统自动生成 | 如有疑问请联系销售人员</div>
</body>
</html>`;
}

router.get('/api/quotes/:id/export/pdf', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }
  const planId = (ctx.query.planId as string) || quote.activePlanId;
  const plan = quote.plans.find((p: any) => p.id === planId) || quote.plans[0];

  const body = ctx.request.body as any;
  const exportedBy = (ctx.query.exportedBy as string) || '系统';
  const exportRecord: any = {
    id: `export-${Date.now()}`,
    exportedBy,
    exportedAt: new Date().toISOString(),
    format: 'pdf',
    version: quote.currentVersion,
  };
  quote.exportRecords.push(exportRecord);
  quote.updatedAt = exportRecord.exportedAt;
  saveQuotesData(data);

  const html = buildQuotationHTML(quote, plan);
  const fileName = `${quote.quoteNo}-${plan.name}.pdf`;
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.html"`);
  ctx.set('X-Quotation-Mode', 'pdf-printable');
  ctx.body = html;
});

router.get('/api/quotes/:id/export/excel', (ctx) => {
  const data = loadQuotesData();
  const quote = data.quotes.find((q: any) => q.id === ctx.params.id);
  if (!quote) {
    ctx.status = 404;
    ctx.body = { error: 'Quote not found' };
    return;
  }
  const planId = (ctx.query.planId as string) || quote.activePlanId;
  const plan = quote.plans.find((p: any) => p.id === planId) || quote.plans[0];

  const exportedBy = (ctx.query.exportedBy as string) || '系统';
  const exportRecord: any = {
    id: `export-${Date.now()}`,
    exportedBy,
    exportedAt: new Date().toISOString(),
    format: 'excel',
    version: quote.currentVersion,
  };
  quote.exportRecords.push(exportRecord);
  quote.updatedAt = exportRecord.exportedAt;
  saveQuotesData(data);

  const groupedItems: Record<string, any[]> = {};
  for (const item of plan.items) {
    if (!groupedItems[item.categoryId]) groupedItems[item.categoryId] = [];
    groupedItems[item.categoryId].push(item);
  }

  const esc = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n\t]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  let csv = '\uFEFF';
  csv += 'XCF-180 摩托车改装报价单\n';
  csv += `报价单号,${esc(quote.quoteNo)},日期,${esc(formatDate(quote.createdAt))}\n`;
  csv += `客户名称,${esc(quote.customerName)},联系人,${esc(quote.customerContact)}\n`;
  csv += `联系电话,${esc(quote.customerPhone)},有效期至,${esc(formatDate(quote.validUntil))}\n`;
  csv += `车型,${esc(quote.modelName)}${quote.packageName ? '（' + quote.packageName + '）' : ''},方案,${esc(plan.name)}${plan.description ? ' - ' + esc(plan.description) : ''}\n\n`;

  csv += '序号,分类,配件名称,品牌,数量,原价,单价,折扣(%),小计\n';
  let idx = 0;
  for (const [, items] of Object.entries(groupedItems)) {
    const catName = items[0]?.categoryName ?? '未分类';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      idx++;
      csv += `${idx},${esc(i === 0 ? catName : '')},${esc(it.partName)},${esc(it.partBrand)},${it.quantity},${it.originalPrice},${it.unitPrice.toFixed(2)},${Math.round((it.discountRate || 0) * 100)},${it.subtotal}\n`;
    }
    const catSub = items.reduce((s: number, it: any) => s + it.subtotal, 0);
    csv += `,,,,,,,,${catSub} 分类小计\n`;
  }

  csv += '\n';
  csv += `配件小计,,,,,,,,,${plan.partsTotal}\n`;
  csv += `工费合计,,,,,,,,,${plan.laborFeeTotal}\n`;
  csv += `优惠金额,,,,,,,,,-${plan.discountTotal}\n`;
  if ((plan.appliedDiscountRules ?? []).length > 0) {
    for (const r of plan.appliedDiscountRules) {
      csv += `  ${esc(r.description)},,,,,,,,,-${r.appliedAmount}\n`;
    }
  }
  csv += `报价总计,,,,,,,,,${plan.totalAmount}\n`;
  if (quote.remark) csv += `\n备注,${esc(quote.remark)}\n`;

  if ((quote.approvalFlow?.history ?? []).length > 0) {
    csv += '\n\n审批意见留痕\n';
    csv += '审批人,角色,动作,时间,备注\n';
    const roleLabels: Record<string, string> = { sales: '销售', sales_manager: '销售经理', finance: '财务', general_manager: '总经理' };
    const actionLabels: Record<string, string> = { approve: '通过', reject: '拒绝', return: '退回' };
    for (const h of quote.approvalFlow.history) {
      const date = h.actedAt ? new Date(h.actedAt).toLocaleString('zh-CN') : '';
      csv += `${esc(h.approverName || '系统')},${esc(roleLabels[h.role] || h.role)},${esc(actionLabels[h.action] || h.action)},${esc(date)},${esc(h.comment || '')}\n`;
    }
  }

  const fileName = `${quote.quoteNo}-${plan.name}.csv`;
  ctx.set('Content-Type', 'text/csv; charset=utf-8');
  ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  ctx.body = csv;
});

export const quotesRoutes = router;
