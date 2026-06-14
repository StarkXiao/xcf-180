import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

interface InventoryReservation {
  id: string;
  selectionId: string;
  partId: string;
  quantity: number;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'released' | 'consumed';
}

type PurchaseOrderStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';

interface PurchaseOrderItem {
  partId: string;
  partName: string;
  partSku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expectedDate?: string;
  receivedDate?: string;
}

interface StockAlert {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  categoryId: string;
  currentStock: number;
  alertThreshold: number;
  alertType: 'out_of_stock' | 'low_stock';
  isRead: boolean;
  createdAt: string;
}

interface InventoryData {
  reservations: InventoryReservation[];
  purchaseOrders: PurchaseOrder[];
  stockAlerts: StockAlert[];
  alertConfig: {
    defaultThreshold: number;
    lowStockRatio: number;
  };
}

interface PartData {
  categories: any[];
  parts: any[];
  priceHistory: any[];
  statusHistory: any[];
  compatibilityRelations: any[];
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function loadInventoryData(): InventoryData {
  const filePath = path.resolve(__dirname, '../../data/inventory.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!data.reservations) data.reservations = [];
  if (!data.purchaseOrders) data.purchaseOrders = [];
  if (!data.stockAlerts) data.stockAlerts = [];
  if (!data.alertConfig) data.alertConfig = { defaultThreshold: 10, lowStockRatio: 0.2 };
  return data;
}

function saveInventoryData(data: InventoryData) {
  const filePath = path.resolve(__dirname, '../../data/inventory.json');
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadPartsData(): PartData {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function savePartsData(data: PartData) {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getStockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

function checkAndGenerateAlerts() {
  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const threshold = invData.alertConfig.defaultThreshold;
  const ratio = invData.alertConfig.lowStockRatio;

  partsData.parts.forEach((part: any) => {
    const activeReservations = invData.reservations.filter(
      (r) => r.partId === part.id && r.status === 'active'
    );
    const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
    const available = (part.stock || 0) - reservedQty;
    const effectiveThreshold = Math.max(threshold, Math.ceil((part.stock || 0) * ratio));
    const level = getStockLevel(available, effectiveThreshold);

    if (level === 'out_of_stock' || level === 'low_stock') {
      const existingAlert = invData.stockAlerts.find(
        (a) => a.partId === part.id && a.alertType === (level === 'out_of_stock' ? 'out_of_stock' : 'low_stock') && !a.isRead
      );
      if (!existingAlert) {
        invData.stockAlerts.push({
          id: genId('sa'),
          partId: part.id,
          partName: part.name,
          partSku: part.sku || part.id,
          categoryId: part.categoryId,
          currentStock: available,
          alertThreshold: effectiveThreshold,
          alertType: level === 'out_of_stock' ? 'out_of_stock' : 'low_stock',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  saveInventoryData(invData);
}

router.get('/api/inventory/overview', (ctx) => {
  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const threshold = invData.alertConfig.defaultThreshold;
  const ratio = invData.alertConfig.lowStockRatio;

  let totalParts = partsData.parts.length;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let totalReserved = 0;

  const inventoryMap: Record<string, any> = {};

  partsData.parts.forEach((part: any) => {
    const activeReservations = invData.reservations.filter(
      (r) => r.partId === part.id && r.status === 'active'
    );
    const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
    totalReserved += reservedQty;
    const available = (part.stock || 0) - reservedQty;
    const effectiveThreshold = Math.max(threshold, Math.ceil((part.stock || 0) * ratio));
    const level = getStockLevel(available, effectiveThreshold);

    if (level === 'out_of_stock') outOfStockCount++;
    if (level === 'low_stock') lowStockCount++;

    inventoryMap[part.id] = {
      partId: part.id,
      totalStock: part.stock || 0,
      reservedStock: reservedQty,
      availableStock: available,
      stockLevel: level,
      alertThreshold: effectiveThreshold,
    };
  });

  const unreadAlerts = invData.stockAlerts.filter((a) => !a.isRead).length;

  ctx.body = {
    totalParts,
    outOfStockCount,
    lowStockCount,
    inStockCount: totalParts - outOfStockCount - lowStockCount,
    totalReserved,
    unreadAlerts,
    inventory: inventoryMap,
  };
});

router.get('/api/inventory/part/:partId', (ctx) => {
  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const partId = ctx.params.partId;
  const part = partsData.parts.find((p: any) => p.id === partId);

  if (!part) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }

  const activeReservations = invData.reservations.filter(
    (r) => r.partId === partId && r.status === 'active'
  );
  const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
  const available = (part.stock || 0) - reservedQty;
  const threshold = invData.alertConfig.defaultThreshold;
  const ratio = invData.alertConfig.lowStockRatio;
  const effectiveThreshold = Math.max(threshold, Math.ceil((part.stock || 0) * ratio));

  ctx.body = {
    partId: part.id,
    totalStock: part.stock || 0,
    reservedStock: reservedQty,
    availableStock: available,
    stockLevel: getStockLevel(available, effectiveThreshold),
    alertThreshold: effectiveThreshold,
  };
});

router.post('/api/inventory/reserve', (ctx) => {
  const body = ctx.request.body as any;
  const { selectionId, items } = body;

  if (!selectionId || !items || !Array.isArray(items)) {
    ctx.status = 400;
    ctx.body = { error: 'selectionId and items are required' };
    return;
  }

  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const reservations: InventoryReservation[] = [];
  const failedItems: { partId: string; reason: string }[] = [];

  for (const item of items) {
    const part = partsData.parts.find((p: any) => p.id === item.partId);
    if (!part) {
      failedItems.push({ partId: item.partId, reason: '配件不存在' });
      continue;
    }

    const activeReservations = invData.reservations.filter(
      (r) => r.partId === item.partId && r.status === 'active'
    );
    const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
    const available = (part.stock || 0) - reservedQty;

    if (available < item.quantity) {
      failedItems.push({
        partId: item.partId,
        reason: `库存不足，可用 ${available}，需要 ${item.quantity}`,
      });
      continue;
    }

    const reservation: InventoryReservation = {
      id: genId('res'),
      selectionId,
      partId: item.partId,
      quantity: item.quantity,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    };
    invData.reservations.push(reservation);
    reservations.push(reservation);
  }

  saveInventoryData(invData);
  checkAndGenerateAlerts();

  ctx.body = {
    success: failedItems.length === 0,
    reservations,
    failedItems,
  };
});

router.post('/api/inventory/release', (ctx) => {
  const body = ctx.request.body as any;
  const { selectionId, partIds } = body;

  if (!selectionId) {
    ctx.status = 400;
    ctx.body = { error: 'selectionId is required' };
    return;
  }

  const invData = loadInventoryData();
  let releasedCount = 0;

  invData.reservations.forEach((r) => {
    if (r.selectionId === selectionId && r.status === 'active') {
      if (!partIds || partIds.includes(r.partId)) {
        r.status = 'released';
        releasedCount++;
      }
    }
  });

  saveInventoryData(invData);

  ctx.body = { success: true, releasedCount };
});

router.post('/api/inventory/consume', (ctx) => {
  const body = ctx.request.body as any;
  const { selectionId } = body;

  if (!selectionId) {
    ctx.status = 400;
    ctx.body = { error: 'selectionId is required' };
    return;
  }

  const invData = loadInventoryData();
  const partsData = loadPartsData();
  let consumedCount = 0;

  invData.reservations.forEach((r) => {
    if (r.selectionId === selectionId && r.status === 'active') {
      r.status = 'consumed';
      const part = partsData.parts.find((p: any) => p.id === r.partId);
      if (part) {
        part.stock = Math.max(0, (part.stock || 0) - r.quantity);
      }
      consumedCount++;
    }
  });

  saveInventoryData(invData);
  savePartsData(partsData);
  checkAndGenerateAlerts();

  ctx.body = { success: true, consumedCount };
});

router.get('/api/inventory/alerts', (ctx) => {
  const invData = loadInventoryData();
  const { unread, alertType } = ctx.query as any;
  let alerts = [...invData.stockAlerts];

  if (unread === 'true' || unread === '1') {
    alerts = alerts.filter((a) => !a.isRead);
  }
  if (alertType) {
    alerts = alerts.filter((a) => a.alertType === alertType);
  }

  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  ctx.body = alerts;
});

router.put('/api/inventory/alerts/:id/read', (ctx) => {
  const invData = loadInventoryData();
  const alert = invData.stockAlerts.find((a) => a.id === ctx.params.id);
  if (!alert) {
    ctx.status = 404;
    ctx.body = { error: 'Alert not found' };
    return;
  }
  alert.isRead = true;
  saveInventoryData(invData);
  ctx.body = alert;
});

router.put('/api/inventory/alerts/read-all', (ctx) => {
  const invData = loadInventoryData();
  invData.stockAlerts.forEach((a) => { a.isRead = true; });
  saveInventoryData(invData);
  ctx.body = { success: true, count: invData.stockAlerts.length };
});

router.get('/api/inventory/substitutes/:partId', (ctx) => {
  const partId = ctx.params.partId;
  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const threshold = invData.alertConfig.defaultThreshold;

  const currentPart = partsData.parts.find((p: any) => p.id === partId);
  if (!currentPart) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }

  const substitutes: any[] = [];

  partsData.parts.forEach((part: any) => {
    if (part.id === partId) return;
    if (part.status !== 'active') return;
    if (part.categoryId !== currentPart.categoryId) return;

    const activeReservations = invData.reservations.filter(
      (r) => r.partId === part.id && r.status === 'active'
    );
    const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
    const available = (part.stock || 0) - reservedQty;
    const level = getStockLevel(available, threshold);

    if (level === 'out_of_stock') return;

    let score = 0;
    const reasons: string[] = [];
    const priceDiff = part.price - currentPart.price;

    const commonModels = currentPart.compatibleModels.filter(
      (m: string) => part.compatibleModels.includes(m)
    );
    score += commonModels.length * 25;
    if (commonModels.length > 0) reasons.push(`兼容 ${commonModels.length} 款相同车型`);

    if (part.brand === currentPart.brand) {
      score += 20;
      reasons.push('同品牌');
    }

    const specOverlap = Object.keys(currentPart.specs).filter(
      (k) => k in part.specs && part.specs[k] === currentPart.specs[k]
    );
    score += specOverlap.length * 10;
    if (specOverlap.length > 0) reasons.push(`${specOverlap.length} 项规格相同`);

    if (available > 0) {
      score += 15;
      reasons.push(`库存充足 (${available})`);
    }

    if (priceDiff < 0) {
      reasons.push(`节省 ¥${Math.abs(priceDiff).toLocaleString()}`);
    } else if (priceDiff > 0) {
      reasons.push(`需加 ¥${priceDiff.toLocaleString()}`);
    }

    substitutes.push({
      partId: part.id,
      part: {
        id: part.id,
        name: part.name,
        brand: part.brand,
        categoryId: part.categoryId,
        price: part.price,
        originalPrice: part.originalPrice,
        image: part.image,
        description: part.description,
        specs: part.specs,
        compatibleModels: part.compatibleModels,
        position: part.position,
      },
      matchScore: score,
      reasons,
      priceDiff,
      stockLevel: level,
      availableStock: available,
    });
  });

  substitutes.sort((a, b) => b.matchScore - a.matchScore);
  ctx.body = substitutes;
});

router.get('/api/inventory/purchase-orders', (ctx) => {
  const invData = loadInventoryData();
  const { status } = ctx.query as any;
  let orders = [...invData.purchaseOrders];
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  ctx.body = orders;
});

router.post('/api/inventory/purchase-orders', (ctx) => {
  const body = ctx.request.body as any;
  const { supplier, items, remark, expectedDate, createdBy } = body;

  if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
    ctx.status = 400;
    ctx.body = { error: 'supplier and items are required' };
    return;
  }

  const partsData = loadPartsData();
  const orderItems: PurchaseOrderItem[] = items.map((item: any) => {
    const part = partsData.parts.find((p: any) => p.id === item.partId);
    return {
      partId: item.partId,
      partName: part?.name || item.partId,
      partSku: part?.sku || item.partId,
      quantity: item.quantity,
      unitCost: item.unitCost || part?.costPrice || 0,
      subtotal: (item.unitCost || part?.costPrice || 0) * item.quantity,
    };
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order: PurchaseOrder = {
    id: genId('po'),
    orderNo: `PO-${Date.now().toString().slice(-8)}`,
    supplier,
    items: orderItems,
    totalAmount,
    status: 'pending',
    remark,
    createdBy: createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expectedDate,
  };

  const invData = loadInventoryData();
  invData.purchaseOrders.push(order);
  saveInventoryData(invData);

  ctx.body = order;
});

router.put('/api/inventory/purchase-orders/:id/status', (ctx) => {
  const invData = loadInventoryData();
  const order = invData.purchaseOrders.find((o) => o.id === ctx.params.id);
  if (!order) {
    ctx.status = 404;
    ctx.body = { error: 'Purchase order not found' };
    return;
  }

  const body = ctx.request.body as any;
  const newStatus = body.status;

  if (!['pending', 'approved', 'shipped', 'received', 'cancelled'].includes(newStatus)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid status' };
    return;
  }

  order.status = newStatus;
  order.updatedAt = new Date().toISOString();

  if (newStatus === 'received') {
    order.receivedDate = new Date().toISOString();
    const partsData = loadPartsData();
    order.items.forEach((item) => {
      const part = partsData.parts.find((p: any) => p.id === item.partId);
      if (part) {
        part.stock = (part.stock || 0) + item.quantity;
      }
    });
    savePartsData(partsData);
    checkAndGenerateAlerts();
  }

  saveInventoryData(invData);
  ctx.body = order;
});

router.put('/api/inventory/purchase-orders/:id', (ctx) => {
  const invData = loadInventoryData();
  const idx = invData.purchaseOrders.findIndex((o) => o.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Purchase order not found' };
    return;
  }

  const body = ctx.request.body as any;
  invData.purchaseOrders[idx] = {
    ...invData.purchaseOrders[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  saveInventoryData(invData);
  ctx.body = invData.purchaseOrders[idx];
});

router.delete('/api/inventory/purchase-orders/:id', (ctx) => {
  const invData = loadInventoryData();
  const idx = invData.purchaseOrders.findIndex((o) => o.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Purchase order not found' };
    return;
  }
  const [removed] = invData.purchaseOrders.splice(idx, 1);
  saveInventoryData(invData);
  ctx.body = { success: true, removed };
});

router.get('/api/inventory/batch-info', (ctx) => {
  const { partIds } = ctx.query as any;
  if (!partIds) {
    ctx.body = {};
    return;
  }
  const ids = String(partIds).split(',');
  const invData = loadInventoryData();
  const partsData = loadPartsData();
  const threshold = invData.alertConfig.defaultThreshold;
  const ratio = invData.alertConfig.lowStockRatio;
  const result: Record<string, any> = {};

  ids.forEach((partId: string) => {
    const part = partsData.parts.find((p: any) => p.id === partId);
    if (!part) return;
    const activeReservations = invData.reservations.filter(
      (r) => r.partId === partId && r.status === 'active'
    );
    const reservedQty = activeReservations.reduce((sum: number, r: InventoryReservation) => sum + r.quantity, 0);
    const available = (part.stock || 0) - reservedQty;
    const effectiveThreshold = Math.max(threshold, Math.ceil((part.stock || 0) * ratio));
    result[partId] = {
      partId,
      totalStock: part.stock || 0,
      reservedStock: reservedQty,
      availableStock: available,
      stockLevel: getStockLevel(available, effectiveThreshold),
      alertThreshold: effectiveThreshold,
    };
  });

  ctx.body = result;
});

export const inventoryRoutes = router;
