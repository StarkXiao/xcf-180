import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const afterSalesDataPath = path.resolve(__dirname, '../../data/after-sales.json');
const ordersDataPath = path.resolve(__dirname, '../../data/orders.json');
const partsDataPath = path.resolve(__dirname, '../../data/parts.json');

function loadAfterSalesData() {
  try {
    const raw = readFileSync(afterSalesDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { afterSalesRecords: [], warranties: [] };
  }
}

function saveAfterSalesData(data: any) {
  writeFileSync(afterSalesDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadOrdersData() {
  const raw = readFileSync(ordersDataPath, 'utf-8');
  return JSON.parse(raw);
}

function loadPartsData() {
  const raw = readFileSync(partsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function generateAfterSalesNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AS-${dateStr}-${random}`;
}

function createProgress(status: string, changedBy: string, comment?: string): any {
  return {
    id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status,
    changedAt: new Date().toISOString(),
    changedBy,
    comment,
    attachments: [],
  };
}

function calculateWarrantyStatus(purchaseDate: string, months: number): { status: string; expiryDate: string } {
  const purchase = new Date(purchaseDate);
  const expiry = new Date(purchase);
  expiry.setMonth(expiry.getMonth() + months);
  const now = new Date();
  const status = now > expiry ? 'expired' : 'valid';
  return { status, expiryDate: expiry.toISOString() };
}

router.get('/api/after-sales', (ctx) => {
  const data = loadAfterSalesData();
  const { status, priority, type, orderId, customerName, issueCategory } = ctx.query;

  let records = data.afterSalesRecords;

  if (status) {
    records = records.filter((r: any) => r.status === status);
  }
  if (priority) {
    records = records.filter((r: any) => r.priority === priority);
  }
  if (type) {
    records = records.filter((r: any) => r.type === type);
  }
  if (orderId) {
    records = records.filter((r: any) => r.orderId === orderId);
  }
  if (customerName) {
    records = records.filter((r: any) =>
      r.customerName.toLowerCase().includes((customerName as string).toLowerCase())
    );
  }
  if (issueCategory) {
    records = records.filter((r: any) => r.issueCategory === issueCategory);
  }

  records = records.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ctx.body = records;
});

router.get('/api/after-sales/:id', (ctx) => {
  const data = loadAfterSalesData();
  const record = data.afterSalesRecords.find((r: any) => r.id === ctx.params.id);
  if (!record) {
    ctx.status = 404;
    ctx.body = { error: 'After-sales record not found' };
    return;
  }
  ctx.body = record;
});

router.get('/api/after-sales/order/:orderId', (ctx) => {
  const data = loadAfterSalesData();
  const records = data.afterSalesRecords.filter((r: any) => r.orderId === ctx.params.orderId);
  ctx.body = records;
});

router.post('/api/after-sales', (ctx) => {
  const data = loadAfterSalesData();
  const ordersData = loadOrdersData();
  const body = ctx.request.body as any;

  const {
    type,
    orderId,
    customerId,
    customerName,
    customerContact,
    customerPhone,
    vehicleInfo,
    modelId,
    items,
    issueCategory,
    issueDescription,
    images = [],
    priority,
    laborFee = 0,
    partsCost = 0,
    customerCharge = 0,
    warrantyCoverage = 0,
    assignedTo,
    expectedCompletionDate,
    createdBy,
    remark,
  } = body;

  const order = ordersData.orders.find((o: any) => o.id === orderId);

  const now = new Date().toISOString();
  const totalCost = laborFee + partsCost;

  const newRecord: any = {
    id: `as-${Date.now()}`,
    afterSalesNo: generateAfterSalesNo(),
    type,
    orderId,
    orderNo: order?.orderNo || '',
    customerId,
    customerName,
    customerContact,
    customerPhone,
    vehicleInfo,
    modelId: modelId || order?.modelId,
    modelName: order?.modelName || '',
    items,
    issueCategory,
    issueDescription,
    images,
    priority,
    status: 'pending',
    progress: [createProgress('pending', createdBy, '售后工单创建')],
    rootCause: '',
    solution: '',
    laborFee,
    partsCost,
    totalCost,
    customerCharge,
    warrantyCoverage,
    assignedTo,
    assigneeName: assignedTo || '',
    expectedCompletionDate: expectedCompletionDate || null,
    actualCompletionDate: null,
    createdAt: now,
    updatedAt: now,
    createdBy,
    closedBy: null,
    closedAt: null,
    remark: remark || '',
  };

  data.afterSalesRecords.push(newRecord);
  saveAfterSalesData(data);

  ctx.status = 201;
  ctx.body = newRecord;
});

router.put('/api/after-sales/:id', (ctx) => {
  const data = loadAfterSalesData();
  const record = data.afterSalesRecords.find((r: any) => r.id === ctx.params.id);
  if (!record) {
    ctx.status = 404;
    ctx.body = { error: 'After-sales record not found' };
    return;
  }

  const body = ctx.request.body as any;
  const updatableFields = [
    'type', 'priority', 'issueCategory', 'issueDescription', 'images', 'items',
    'rootCause', 'solution', 'laborFee', 'partsCost', 'customerCharge',
    'warrantyCoverage', 'assignedTo', 'assigneeName', 'expectedCompletionDate',
    'actualCompletionDate', 'remark'
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      (record as any)[field] = body[field];
    }
  }

  if (body.laborFee !== undefined || body.partsCost !== undefined) {
    record.totalCost = (record.laborFee || 0) + (record.partsCost || 0);
  }

  record.updatedAt = new Date().toISOString();
  saveAfterSalesData(data);
  ctx.body = record;
});

router.put('/api/after-sales/:id/status', (ctx) => {
  const data = loadAfterSalesData();
  const record = data.afterSalesRecords.find((r: any) => r.id === ctx.params.id);
  if (!record) {
    ctx.status = 404;
    ctx.body = { error: 'After-sales record not found' };
    return;
  }

  const { status, changedBy, comment, attachments } = ctx.request.body as any;
  if (!status || !changedBy) {
    ctx.status = 400;
    ctx.body = { error: 'status and changedBy are required' };
    return;
  }

  const validStatuses = [
    'pending', 'inspecting', 'parts_ordered', 'repairing', 'testing',
    'completed', 'customer_pickup', 'closed', 'cancelled'
  ];
  if (!validStatuses.includes(status)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid status' };
    return;
  }

  record.status = status;
  record.progress.push(createProgress(status, changedBy, comment));

  if (status === 'closed' || status === 'completed') {
    record.actualCompletionDate = new Date().toISOString();
    if (status === 'closed') {
      record.closedBy = changedBy;
      record.closedAt = new Date().toISOString();
    }
  }

  record.updatedAt = new Date().toISOString();
  saveAfterSalesData(data);
  ctx.body = record;
});

router.delete('/api/after-sales/:id', (ctx) => {
  const data = loadAfterSalesData();
  const index = data.afterSalesRecords.findIndex((r: any) => r.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'After-sales record not found' };
    return;
  }

  data.afterSalesRecords.splice(index, 1);
  saveAfterSalesData(data);
  ctx.body = { success: true };
});

router.get('/api/after-sales/warranties', (ctx) => {
  const data = loadAfterSalesData();
  const { orderId, partId, status } = ctx.query;

  let warranties = data.warranties || [];

  if (orderId) {
    warranties = warranties.filter((w: any) => w.orderId === orderId);
  }
  if (partId) {
    warranties = warranties.filter((w: any) => w.partId === partId);
  }
  if (status) {
    warranties = warranties.filter((w: any) => w.status === status);
  }

  ctx.body = warranties;
});

router.get('/api/after-sales/warranties/:id', (ctx) => {
  const data = loadAfterSalesData();
  const warranty = (data.warranties || []).find((w: any) => w.id === ctx.params.id);
  if (!warranty) {
    ctx.status = 404;
    ctx.body = { error: 'Warranty not found' };
    return;
  }
  ctx.body = warranty;
});

router.get('/api/after-sales/warranties/order/:orderId', (ctx) => {
  const ordersData = loadOrdersData();
  const order = ordersData.orders.find((o: any) => o.id === ctx.params.orderId);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const warranties = order.items.map((item: any) => {
    const warrantyMonths = [
      'exhaust', 'brake', 'engine'
    ].includes(item.categoryId) ? 12 : 6;
    const { status, expiryDate } = calculateWarrantyStatus(order.createdAt, warrantyMonths);

    return {
      id: `warranty-${order.id}-${item.partId}`,
      partId: item.partId,
      partName: item.partName,
      orderId: order.id,
      orderNo: order.orderNo,
      warrantyPeriodMonths: warrantyMonths,
      purchaseDate: order.createdAt,
      expiryDate,
      status,
      terms: '标准保修条款',
      coverage: ['质量问题', '制造缺陷'],
      exclusions: ['人为损坏', '不当使用', '正常损耗'],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  ctx.body = warranties;
});

router.post('/api/after-sales/warranties', (ctx) => {
  const data = loadAfterSalesData();
  if (!data.warranties) data.warranties = [];

  const body = ctx.request.body as any;
  const {
    partId,
    partName,
    orderId,
    orderNo,
    warrantyPeriodMonths,
    purchaseDate,
    terms,
    coverage = [],
    exclusions = [],
  } = body;

  const { status, expiryDate } = calculateWarrantyStatus(purchaseDate, warrantyPeriodMonths);
  const now = new Date().toISOString();

  const warranty: any = {
    id: `warranty-${Date.now()}`,
    partId,
    partName,
    orderId,
    orderNo,
    warrantyPeriodMonths,
    purchaseDate,
    expiryDate,
    status,
    terms: terms || '标准保修条款',
    coverage,
    exclusions,
    createdAt: now,
    updatedAt: now,
  };

  data.warranties.push(warranty);
  saveAfterSalesData(data);

  ctx.status = 201;
  ctx.body = warranty;
});

router.get('/api/after-sales/stats/summary', (ctx) => {
  const data = loadAfterSalesData();
  const records = data.afterSalesRecords || [];

  const stats = {
    total: records.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byIssueCategory: {} as Record<string, number>,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    totalCost: 0,
    totalCustomerCharge: 0,
    totalWarrantyCoverage: 0,
  };

  const inProgressStatuses = ['inspecting', 'parts_ordered', 'repairing', 'testing', 'customer_pickup'];
  const completedStatuses = ['completed', 'closed'];

  for (const r of records) {
    stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
    stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1;
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    stats.byIssueCategory[r.issueCategory] = (stats.byIssueCategory[r.issueCategory] || 0) + 1;

    if (r.status === 'pending') stats.pendingCount++;
    if (inProgressStatuses.includes(r.status)) stats.inProgressCount++;
    if (completedStatuses.includes(r.status)) stats.completedCount++;

    stats.totalCost += r.totalCost || 0;
    stats.totalCustomerCharge += r.customerCharge || 0;
    stats.totalWarrantyCoverage += r.warrantyCoverage || 0;
  }

  ctx.body = stats;
});

export const afterSalesRoutes = router;
