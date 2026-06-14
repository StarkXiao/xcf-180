import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

interface PartPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type PartStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected';

interface Part {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  image: string;
  description: string;
  specs: Record<string, string | boolean | number>;
  compatible: string[];
  compatibleModels: string[];
  conflictsWith: string[];
  position: PartPosition;
  sku?: string;
  stock?: number;
  status?: PartStatus;
  originalPrice?: number;
  costPrice?: number;
  reviewRemark?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DataStore {
  categories: Category[];
  parts: Part[];
  priceHistory: any[];
  statusHistory: any[];
  compatibilityRelations: any[];
}

function loadData(): DataStore {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!data.priceHistory) data.priceHistory = [];
  if (!data.statusHistory) data.statusHistory = [];
  if (!data.compatibilityRelations) data.compatibilityRelations = [];
  data.categories = data.categories.map((c: Category) => ({
    ...c,
    isActive: c.isActive ?? true,
    createdAt: c.createdAt ?? new Date().toISOString(),
    updatedAt: c.updatedAt ?? new Date().toISOString(),
    sortOrder: c.sortOrder ?? 0,
  }));
  
  let needsMigration = false;
  data.parts = data.parts.map((p: Part) => {
    const hasOldCompatible = p.compatible && !p.compatibleModels;
    if (hasOldCompatible) needsMigration = true;
    return {
      ...p,
      compatibleModels: p.compatibleModels ?? p.compatible ?? [],
      compatible: undefined,
      sku: p.sku ?? p.id.toUpperCase(),
      stock: p.stock ?? 100,
      status: p.status ?? 'active',
      originalPrice: p.originalPrice ?? Math.round(p.price * 1.2),
      costPrice: p.costPrice ?? Math.round(p.price * 0.6),
      createdAt: p.createdAt ?? new Date().toISOString(),
      updatedAt: p.updatedAt ?? new Date().toISOString(),
      createdBy: p.createdBy ?? 'system',
      conflictsWith: p.conflictsWith ?? [],
    };
  });
  
  const hasOldConflicts = data.parts.some((p: Part) => (p.conflictsWith ?? []).length > 0);
  const hasNoRelations = data.compatibilityRelations.length === 0;
  
  if (hasOldConflicts && hasNoRelations) {
    needsMigration = true;
    const processed = new Set<string>();
    data.parts.forEach((p: Part) => {
      (p.conflictsWith ?? []).forEach((conflictId: string) => {
        const pairKey = [p.id, conflictId].sort().join('-');
        if (processed.has(pairKey)) return;
        processed.add(pairKey);
        
        const conflictPart = data.parts.find((x: Part) => x.id === conflictId);
        const isSameCategory = conflictPart && conflictPart.categoryId === p.categoryId;
        
        data.compatibilityRelations.push({
          id: genId('rel'),
          partIdA: p.id,
          partIdB: conflictId,
          type: 'conflict',
          severity: isSameCategory ? 'error' : 'warning',
          remark: '从旧数据迁移',
          createdAt: new Date().toISOString(),
        });
      });
    });
  }
  
  if (needsMigration) {
    saveData(data);
  }
  
  return data;
}

function saveData(data: DataStore) {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

router.get('/api/categories', (ctx) => {
  const data = loadData();
  ctx.body = data.categories;
});

router.post('/api/admin/categories', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const newCat: Category = {
    id: genId('cat'),
    name: body.name,
    nameEn: body.nameEn,
    icon: body.icon,
    description: body.description,
    sortOrder: body.sortOrder ?? data.categories.length,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.categories.push(newCat);
  saveData(data);
  ctx.body = newCat;
});

router.put('/api/admin/categories/:id', (ctx) => {
  const data = loadData();
  const idx = data.categories.findIndex((c) => c.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Category not found' };
    return;
  }
  const body = ctx.request.body as any;
  data.categories[idx] = {
    ...data.categories[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  ctx.body = data.categories[idx];
});

router.delete('/api/admin/categories/:id', (ctx) => {
  const data = loadData();
  const idx = data.categories.findIndex((c) => c.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Category not found' };
    return;
  }
  const partsInCat = data.parts.filter((p) => p.categoryId === ctx.params.id);
  if (partsInCat.length > 0) {
    ctx.status = 400;
    ctx.body = { error: `该分类下还有 ${partsInCat.length} 个配件，无法删除` };
    return;
  }
  const [removed] = data.categories.splice(idx, 1);
  saveData(data);
  ctx.body = removed;
});

function transformPartForFrontend(part: Part) {
  return {
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
  };
}

router.get('/api/parts', (ctx) => {
  const data = loadData();
  const { category, status, keyword, brand, admin } = ctx.query as any;
  let parts = data.parts;
  
  const isAdmin = admin === '1' || admin === 'true';
  
  if (!isAdmin) {
    parts = parts.filter((p) => p.status === 'active');
  }
  
  if (category) {
    parts = parts.filter((p) => p.categoryId === category);
  }
  if (status && isAdmin) {
    parts = parts.filter((p) => p.status === status);
  }
  if (brand) {
    parts = parts.filter((p) => p.brand === brand);
  }
  if (keyword) {
    const q = String(keyword).toLowerCase();
    parts = parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }
  
  if (!isAdmin) {
    ctx.body = parts.map(transformPartForFrontend);
  } else {
    ctx.body = parts;
  }
});

router.get('/api/parts/:id', (ctx) => {
  const data = loadData();
  const { admin } = ctx.query as any;
  const part = data.parts.find((p) => p.id === ctx.params.id);
  
  const isAdmin = admin === '1' || admin === 'true';
  
  if (part) {
    if (!isAdmin && part.status !== 'active') {
      ctx.status = 404;
      ctx.body = { error: 'Part not found' };
      return;
    }
    if (!isAdmin) {
      ctx.body = transformPartForFrontend(part);
    } else {
      ctx.body = part;
    }
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
  }
});

router.post('/api/admin/parts', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const newPart: Part = {
    id: body.id || genId('part'),
    name: body.name,
    brand: body.brand,
    categoryId: body.categoryId,
    price: Number(body.price),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
    costPrice: body.costPrice ? Number(body.costPrice) : undefined,
    sku: body.sku,
    stock: Number(body.stock) || 0,
    image: body.image || '/images/parts/default.svg',
    description: body.description,
    specs: body.specs || {},
    compatibleModels: body.compatibleModels || [],
    compatible: [],
    conflictsWith: body.conflictsWith || [],
    position: body.position || { x: 50, y: 50, width: 20, height: 20 },
    status: body.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: body.createdBy || 'admin',
  };
  data.parts.push(newPart);
  saveData(data);
  ctx.body = newPart;
});

router.put('/api/admin/parts/:id', (ctx) => {
  const data = loadData();
  const idx = data.parts.findIndex((p) => p.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }
  const body = ctx.request.body as any;
  const oldPart = data.parts[idx];
  if (body.price !== undefined && Number(body.price) !== oldPart.price) {
    data.priceHistory.push({
      id: genId('ph'),
      partId: oldPart.id,
      partName: oldPart.name,
      oldPrice: oldPart.price,
      newPrice: Number(body.price),
      changedAt: new Date().toISOString(),
      changedBy: body.changedBy || 'admin',
      reason: body.priceReason,
    });
  }
  if (body.status !== undefined && body.status !== oldPart.status) {
    data.statusHistory.push({
      id: genId('sh'),
      partId: oldPart.id,
      partName: oldPart.name,
      oldStatus: oldPart.status,
      newStatus: body.status,
      changedAt: new Date().toISOString(),
      changedBy: body.changedBy || 'admin',
      reason: body.statusReason,
    });
  }
  data.parts[idx] = {
    ...oldPart,
    ...body,
    price: body.price !== undefined ? Number(body.price) : oldPart.price,
    originalPrice: body.originalPrice !== undefined ? Number(body.originalPrice) : oldPart.originalPrice,
    costPrice: body.costPrice !== undefined ? Number(body.costPrice) : oldPart.costPrice,
    stock: body.stock !== undefined ? Number(body.stock) : oldPart.stock,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  ctx.body = data.parts[idx];
});

router.delete('/api/admin/parts/:id', (ctx) => {
  const data = loadData();
  const idx = data.parts.findIndex((p) => p.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }
  const [removed] = data.parts.splice(idx, 1);
  data.parts.forEach((p) => {
    p.conflictsWith = p.conflictsWith.filter((id) => id !== removed.id);
  });
  data.compatibilityRelations = data.compatibilityRelations.filter(
    (r) => r.partIdA !== removed.id && r.partIdB !== removed.id
  );
  saveData(data);
  ctx.body = { success: true, removed };
});

router.post('/api/admin/parts/:id/review', (ctx) => {
  const data = loadData();
  const idx = data.parts.findIndex((p) => p.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }
  const body = ctx.request.body as any;
  const oldStatus = data.parts[idx].status;
  data.parts[idx] = {
    ...data.parts[idx],
    status: body.status,
    reviewRemark: body.reviewRemark,
    reviewedBy: body.reviewedBy,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (body.status !== oldStatus) {
    data.statusHistory.push({
      id: genId('sh'),
      partId: data.parts[idx].id,
      partName: data.parts[idx].name,
      oldStatus,
      newStatus: body.status,
      changedAt: new Date().toISOString(),
      changedBy: body.reviewedBy || 'admin',
      reason: body.reviewRemark,
    });
  }
  saveData(data);
  ctx.body = data.parts[idx];
});

router.post('/api/admin/parts/batch-price', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const { partIds, adjustType, adjustValue, reason } = body;
  const updated: Part[] = [];
  partIds.forEach((pid: string) => {
    const idx = data.parts.findIndex((p) => p.id === pid);
    if (idx !== -1) {
      const oldPrice = data.parts[idx].price;
      let newPrice: number;
      if (adjustType === 'fixed') {
        newPrice = Math.max(0, oldPrice + adjustValue);
      } else {
        newPrice = Math.max(0, Math.round(oldPrice * (1 + adjustValue / 100)));
      }
      data.priceHistory.push({
        id: genId('ph'),
        partId: data.parts[idx].id,
        partName: data.parts[idx].name,
        oldPrice,
        newPrice,
        changedAt: new Date().toISOString(),
        changedBy: 'admin',
        reason,
      });
      data.parts[idx] = {
        ...data.parts[idx],
        price: newPrice,
        updatedAt: new Date().toISOString(),
      };
      updated.push(data.parts[idx]);
    }
  });
  saveData(data);
  ctx.body = { success: true, updatedCount: updated.length, updated };
});

router.post('/api/admin/parts/batch-status', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const { partIds, status, reason } = body;
  const updated: Part[] = [];
  partIds.forEach((pid: string) => {
    const idx = data.parts.findIndex((p) => p.id === pid);
    if (idx !== -1 && data.parts[idx].status !== status) {
      const oldStatus = data.parts[idx].status;
      data.statusHistory.push({
        id: genId('sh'),
        partId: data.parts[idx].id,
        partName: data.parts[idx].name,
        oldStatus,
        newStatus: status,
        changedAt: new Date().toISOString(),
        changedBy: 'admin',
        reason,
      });
      data.parts[idx] = {
        ...data.parts[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      updated.push(data.parts[idx]);
    }
  });
  saveData(data);
  ctx.body = { success: true, updatedCount: updated.length, updated };
});

router.get('/api/admin/price-history', (ctx) => {
  const data = loadData();
  const { partId } = ctx.query as any;
  let history = data.priceHistory;
  if (partId) {
    history = history.filter((h) => h.partId === partId);
  }
  history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  ctx.body = history;
});

router.get('/api/admin/status-history', (ctx) => {
  const data = loadData();
  const { partId } = ctx.query as any;
  let history = data.statusHistory;
  if (partId) {
    history = history.filter((h) => h.partId === partId);
  }
  history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  ctx.body = history;
});

router.get('/api/admin/compatibility-relations', (ctx) => {
  const data = loadData();
  ctx.body = data.compatibilityRelations;
});

router.post('/api/admin/compatibility-relations', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const relation = {
    id: genId('cr'),
    partIdA: body.partIdA,
    partIdB: body.partIdB,
    type: body.type,
    severity: body.severity,
    remark: body.remark,
    createdAt: new Date().toISOString(),
  };
  data.compatibilityRelations.push(relation);
  const partA = data.parts.find((p) => p.id === body.partIdA);
  const partB = data.parts.find((p) => p.id === body.partIdB);
  if (body.type === 'conflict') {
    if (partA && !partA.conflictsWith.includes(body.partIdB)) {
      partA.conflictsWith.push(body.partIdB);
    }
    if (partB && !partB.conflictsWith.includes(body.partIdA)) {
      partB.conflictsWith.push(body.partIdA);
    }
  } else if (body.type === 'compatible') {
    if (partA && !partA.compatible.includes(body.partIdB)) {
      partA.compatible.push(body.partIdB);
    }
    if (partB && !partB.compatible.includes(body.partIdA)) {
      partB.compatible.push(body.partIdA);
    }
  }
  saveData(data);
  ctx.body = relation;
});

router.delete('/api/admin/compatibility-relations/:id', (ctx) => {
  const data = loadData();
  const idx = data.compatibilityRelations.findIndex((r) => r.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Relation not found' };
    return;
  }
  const [removed] = data.compatibilityRelations.splice(idx, 1);
  const partA = data.parts.find((p) => p.id === removed.partIdA);
  const partB = data.parts.find((p) => p.id === removed.partIdB);
  if (removed.type === 'conflict') {
    if (partA) partA.conflictsWith = partA.conflictsWith.filter((id) => id !== removed.partIdB);
    if (partB) partB.conflictsWith = partB.conflictsWith.filter((id) => id !== removed.partIdA);
  } else if (removed.type === 'compatible') {
    if (partA) partA.compatible = partA.compatible.filter((id) => id !== removed.partIdB);
    if (partB) partB.compatible = partB.compatible.filter((id) => id !== removed.partIdA);
  }
  saveData(data);
  ctx.body = { success: true, removed };
});

router.get('/api/admin/brands', (ctx) => {
  const data = loadData();
  const brands = Array.from(new Set(data.parts.map((p) => p.brand))).sort();
  ctx.body = brands;
});

export const partsRoutes = router;
