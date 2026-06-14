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
    const unitPrice = override?.unitPrice ?? originalPrice;
    const discountRate = override?.discountRate ?? 0;
    const finalUnitPrice = unitPrice * (1 - discountRate / 100);
    const price = finalUnitPrice * selItem.quantity;
    const laborFee = Math.round(price * (laborFeeRates[part.categoryId] ?? 0.1));
    const subtotal = price + laborFee;
    const discountAmount = (originalPrice - finalUnitPrice) * selItem.quantity;

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

    partsTotal += price;
    laborFeeTotal += laborFee;
    discountTotal += discountAmount;
  }

  return { items, partsTotal, laborFeeTotal, discountTotal };
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
    totalAmount: partsTotal + laborFeeTotal,
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
    totalAmount: partsTotal + laborFeeTotal,
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
    plan.totalAmount = partsTotal + laborFeeTotal;
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

export const quotesRoutes = router;
