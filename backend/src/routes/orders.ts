import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const ordersDataPath = path.resolve(__dirname, '../../data/orders.json');
const selectionsDataPath = path.resolve(__dirname, '../../data/selections.json');
const partsDataPath = path.resolve(__dirname, '../../data/parts.json');

function loadOrdersData() {
  const raw = readFileSync(ordersDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveOrdersData(data: any) {
  writeFileSync(ordersDataPath, JSON.stringify(data, null, 2), 'utf-8');
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

function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

function createStatusHistory(status: string, changedBy: string, remark?: string): any {
  return {
    status,
    changedAt: new Date().toISOString(),
    changedBy,
    remark,
  };
}

router.get('/api/orders', (ctx) => {
  const data = loadOrdersData();
  const { status, dealerName, modelId } = ctx.query;

  let orders = data.orders;

  if (status) {
    orders = orders.filter((o: any) => o.status === status);
  }
  if (dealerName) {
    orders = orders.filter((o: any) =>
      o.dealerName.toLowerCase().includes((dealerName as string).toLowerCase())
    );
  }
  if (modelId) {
    orders = orders.filter((o: any) => o.modelId === modelId);
  }

  orders = orders.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ctx.body = orders;
});

router.get('/api/orders/:id', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }
  ctx.body = order;
});

router.post('/api/orders', (ctx) => {
  const ordersData = loadOrdersData();
  const selectionsData = loadSelectionsData();
  const partsData = loadPartsData();

  const body = ctx.request.body as any;
  const {
    selectionId,
    dealerName,
    dealerContact,
    dealerPhone,
    modelId,
    packageType,
    remark,
    expectedDeliveryDate,
    discount = 0,
  } = body;

  const selection = selectionsData.selections.find((s: any) => s.id === selectionId);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }

  const laborFeeRates: Record<string, number> = {
    exhaust: 0.15,
    brake: 0.18,
    wheels: 0.10,
    handlebar: 0.08,
    lighting: 0.05,
    bodykit: 0.12,
  };

  const items: any[] = [];
  let partsTotal = 0;
  let laborFeeTotal = 0;

  for (const item of selection.items) {
    const part = partsData.parts.find((p: any) => p.id === item.partId);
    if (!part) continue;

    const categoryName = getCategoryName(partsData.categories, part.categoryId);
    const price = part.price * item.quantity;
    const laborFee = Math.round(price * (laborFeeRates[part.categoryId] ?? 0.1));
    const subtotal = price + laborFee;

    items.push({
      partId: part.id,
      partName: part.name,
      partBrand: part.brand,
      partImage: part.image,
      categoryId: part.categoryId,
      categoryName,
      price: part.price,
      quantity: item.quantity,
      laborFee,
      subtotal,
    });

    partsTotal += price;
    laborFeeTotal += laborFee;
  }

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

  const now = new Date().toISOString();
  const newOrder: any = {
    id: `ord-${Date.now()}`,
    orderNo: generateOrderNo(),
    dealerName,
    dealerContact,
    dealerPhone,
    modelId,
    modelName: modelNames[modelId] || modelId,
    packageType: packageType || null,
    packageName: packageType ? packageNames[packageType] || '' : '',
    items,
    partsTotal,
    laborFeeTotal,
    discount,
    totalAmount: partsTotal + laborFeeTotal - discount,
    status: 'pending',
    statusHistory: [createStatusHistory('pending', 'system', '订单创建')],
    afterSaleNotes: [],
    remark: remark || '',
    createdAt: now,
    updatedAt: now,
    expectedDeliveryDate: expectedDeliveryDate || null,
  };

  ordersData.orders.push(newOrder);
  saveOrdersData(ordersData);

  ctx.status = 201;
  ctx.body = newOrder;
});

router.put('/api/orders/:id/status', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const { status, changedBy, remark } = ctx.request.body as any;
  if (!status || !changedBy) {
    ctx.status = 400;
    ctx.body = { error: 'status and changedBy are required' };
    return;
  }

  const validStatuses = ['pending', 'quoted', 'confirmed', 'in_production', 'shipped', 'delivered', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid status' };
    return;
  }

  order.status = status;
  order.statusHistory.push(createStatusHistory(status, changedBy, remark));
  order.updatedAt = new Date().toISOString();

  saveOrdersData(data);
  ctx.body = order;
});

router.put('/api/orders/:id/discount', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const { discount } = ctx.request.body as any;
  if (typeof discount !== 'number' || discount < 0) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid discount value' };
    return;
  }

  order.discount = discount;
  order.totalAmount = order.partsTotal + order.laborFeeTotal - discount;
  order.updatedAt = new Date().toISOString();

  saveOrdersData(data);
  ctx.body = order;
});

router.post('/api/orders/:id/after-sale-notes', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const { content, createdBy, type } = ctx.request.body as any;
  if (!content || !createdBy || !type) {
    ctx.status = 400;
    ctx.body = { error: 'content, createdBy, and type are required' };
    return;
  }

  const validTypes = ['comment', 'issue', 'solution', 'followup'];
  if (!validTypes.includes(type)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid note type' };
    return;
  }

  const note: any = {
    id: `asn-${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
    createdBy,
    type,
  };

  order.afterSaleNotes.push(note);
  order.updatedAt = new Date().toISOString();

  saveOrdersData(data);
  ctx.body = note;
});

router.delete('/api/orders/:id/after-sale-notes/:noteId', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const noteIndex = order.afterSaleNotes.findIndex((n: any) => n.id === ctx.params.noteId);
  if (noteIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Note not found' };
    return;
  }

  order.afterSaleNotes.splice(noteIndex, 1);
  order.updatedAt = new Date().toISOString();

  saveOrdersData(data);
  ctx.body = { success: true };
});

router.put('/api/orders/:id', (ctx) => {
  const data = loadOrdersData();
  const order = data.orders.find((o: any) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  const body = ctx.request.body as any;
  const updatableFields = ['dealerName', 'dealerContact', 'dealerPhone', 'remark', 'expectedDeliveryDate'];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      (order as any)[field] = body[field];
    }
  }

  order.updatedAt = new Date().toISOString();
  saveOrdersData(data);
  ctx.body = order;
});

router.delete('/api/orders/:id', (ctx) => {
  const data = loadOrdersData();
  const index = data.orders.findIndex((o: any) => o.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Order not found' };
    return;
  }

  data.orders.splice(index, 1);
  saveOrdersData(data);
  ctx.body = { success: true };
});

export const ordersRoutes = router;
