import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/templates.json');
const partsDataPath = path.resolve(__dirname, '../../data/parts.json');
const selectionsDataPath = path.resolve(__dirname, '../../data/selections.json');
const compatibilityDataPath = path.resolve(__dirname, '../../data/compatibility.json');

function loadData() {
  const raw = readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadPartsData() {
  const raw = readFileSync(partsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function loadSelectionsData() {
  const raw = readFileSync(selectionsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveSelectionsData(data: any) {
  writeFileSync(selectionsDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadCompatibilityData() {
  try {
    const raw = readFileSync(compatibilityDataPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { relations: [] };
  }
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function checkPartCompatibility(partIds: string[], compatibilityRelations: any[]) {
  const conflicts: any[] = [];
  const warnings: any[] = [];
  const partsData = loadPartsData();
  const partsMap = new Map(partsData.parts.map((p: any) => [p.id, p]));

  for (let i = 0; i < partIds.length; i++) {
    for (let j = i + 1; j < partIds.length; j++) {
      const partIdA = partIds[i];
      const partIdB = partIds[j];

      const relation = compatibilityRelations.find(
        (r: any) =>
          (r.partIdA === partIdA && r.partIdB === partIdB) ||
          (r.partIdA === partIdB && r.partIdB === partIdA)
      );

      if (relation && relation.type === 'conflict') {
        const partA = partsMap.get(partIdA);
        const partB = partsMap.get(partIdB);
        const conflict = {
          partId: partIdA,
          conflictPartId: partIdB,
          partName: partA?.name || partIdA,
          conflictPartName: partB?.name || partIdB,
          severity: relation.severity || 'error',
          message: relation.remark || `${partA?.name || partIdA} 与 ${partB?.name || partIdB} 存在冲突`,
        };
        if (relation.severity === 'warning') {
          warnings.push(conflict);
        } else {
          conflicts.push(conflict);
        }
      }
    }
  }

  return { conflicts, warnings };
}

function calculatePrice(items: any[], partsData: any, laborFeeRates: Record<string, number>) {
  const partsMap = new Map(partsData.parts.map((p: any) => [p.id, p]));
  let totalPrice = 0;
  let totalLaborFee = 0;

  items.forEach((item: any) => {
    const part = partsMap.get(item.partId);
    if (part) {
      const itemPrice = part.price * item.quantity;
      totalPrice += itemPrice;
      const rate = laborFeeRates[part.categoryId] ?? 0.1;
      totalLaborFee += Math.round(itemPrice * rate);
    }
  });

  return { totalPrice, totalLaborFee, grandTotal: totalPrice + totalLaborFee };
}

const laborFeeRates: Record<string, number> = {
  exhaust: 0.15,
  brake: 0.18,
  wheels: 0.10,
  handlebar: 0.08,
  lighting: 0.05,
  bodykit: 0.12,
};

router.get('/api/templates', (ctx) => {
  const data = loadData();
  const { category, status, modelId, keyword, isHot, isRecommended } = ctx.query;

  let templates = [...data.templates];

  if (category && category !== 'all') {
    if (category === 'hot') {
      templates = templates.filter((t: any) => t.isHot || t.isRecommended);
    } else {
      templates = templates.filter((t: any) => t.category === category);
    }
  }

  if (status && status !== 'all') {
    templates = templates.filter((t: any) => t.status === status);
  }

  if (modelId) {
    templates = templates.filter((t: any) => t.modelIds.includes(modelId));
  }

  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    templates = templates.filter(
      (t: any) =>
        t.name.toLowerCase().includes(kw) ||
        t.description.toLowerCase().includes(kw) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(kw))
    );
  }

  if (isHot === 'true') {
    templates = templates.filter((t: any) => t.isHot);
  }

  if (isRecommended === 'true') {
    templates = templates.filter((t: any) => t.isRecommended);
  }

  templates.sort((a: any, b: any) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  ctx.body = {
    templates,
    categories: data.templateCategories,
    favorites: data.favorites || [],
  };
});

router.get('/api/templates/combine', (ctx) => {
  const data = loadData();
  const { templateIds } = ctx.query;

  if (!templateIds) {
    ctx.status = 400;
    ctx.body = { error: 'templateIds is required' };
    return;
  }

  const ids = (templateIds as string).split(',');
  const templates = data.templates.filter((t: any) => ids.includes(t.id));

  if (templates.length === 0) {
    ctx.status = 404;
    ctx.body = { error: 'No templates found' };
    return;
  }

  const combinedItems: any[] = [];
  const seenCategories = new Set<string>();
  const partsData = loadPartsData();

  templates.forEach((template: any) => {
    template.items.forEach((item: any) => {
      const part = partsData.parts.find((p: any) => p.id === item.partId);
      if (part && !seenCategories.has(part.categoryId)) {
        combinedItems.push({ ...item });
        seenCategories.add(part.categoryId);
      }
    });
  });

  const compatData = loadCompatibilityData();
  const partIds = combinedItems.map((item) => item.partId);
  const { conflicts, warnings } = checkPartCompatibility(partIds, compatData.relations || []);

  const { totalPrice, totalLaborFee, grandTotal } = calculatePrice(combinedItems, partsData, laborFeeRates);

  ctx.body = {
    templates: templates.map((t: any) => ({ id: t.id, name: t.name })),
    combinedItems,
    conflicts,
    warnings,
    totalPrice,
    totalLaborFee,
    grandTotal,
    isValid: conflicts.length === 0,
  };
});

router.get('/api/templates/:id', (ctx) => {
  const data = loadData();
  const template = data.templates.find((t: any) => t.id === ctx.params.id);

  if (!template) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  template.viewCount = (template.viewCount || 0) + 1;
  saveData(data);

  ctx.body = template;
});

router.post('/api/templates', (ctx) => {
  const data = loadData();
  const now = new Date().toISOString();

  const newTemplate: any = {
    id: generateId('tpl'),
    name: ctx.request.body.name,
    nameEn: ctx.request.body.nameEn || '',
    description: ctx.request.body.description || '',
    coverImage: ctx.request.body.coverImage || '/images/parts/bodykit-001.svg',
    category: ctx.request.body.category || 'basic',
    modelIds: ctx.request.body.modelIds || [],
    items: ctx.request.body.items || [],
    status: 'draft',
    isHot: false,
    isRecommended: false,
    sortOrder: data.templates.length + 1,
    useCount: 0,
    favoriteCount: 0,
    viewCount: 0,
    tags: ctx.request.body.tags || [],
    author: ctx.request.body.author || '系统',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  data.templates.push(newTemplate);
  saveData(data);

  ctx.status = 201;
  ctx.body = newTemplate;
});

router.put('/api/templates/:id', (ctx) => {
  const data = loadData();
  const idx = data.templates.findIndex((t: any) => t.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  const oldStatus = data.templates[idx].status;
  const newStatus = ctx.request.body.status;

  data.templates[idx] = {
    ...data.templates[idx],
    ...ctx.request.body,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus && newStatus === 'published' && oldStatus !== 'published') {
    data.templates[idx].publishedAt = new Date().toISOString();
  }

  saveData(data);
  ctx.body = data.templates[idx];
});

router.delete('/api/templates/:id', (ctx) => {
  const data = loadData();
  const idx = data.templates.findIndex((t: any) => t.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  const removed = data.templates.splice(idx, 1);
  saveData(data);
  ctx.body = removed[0];
});

router.post('/api/templates/batch-publish', (ctx) => {
  const data = loadData();
  const { templateIds, publishAt } = ctx.request.body;
  const now = publishAt || new Date().toISOString();
  const published: any[] = [];

  templateIds.forEach((id: string) => {
    const template = data.templates.find((t: any) => t.id === id);
    if (template) {
      template.status = 'published';
      template.publishedAt = now;
      template.updatedAt = now;
      published.push(template);
    }
  });

  saveData(data);
  ctx.body = { success: true, publishedCount: published.length, published };
});

router.post('/api/templates/batch-status', (ctx) => {
  const data = loadData();
  const { templateIds, status } = ctx.request.body;
  const now = new Date().toISOString();
  const updated: any[] = [];

  templateIds.forEach((id: string) => {
    const template = data.templates.find((t: any) => t.id === id);
    if (template) {
      template.status = status;
      template.updatedAt = now;
      if (status === 'published' && !template.publishedAt) {
        template.publishedAt = now;
      }
      updated.push(template);
    }
  });

  saveData(data);
  ctx.body = { success: true, updatedCount: updated.length, updated };
});

router.post('/api/templates/:id/check-compatibility', (ctx) => {
  const data = loadData();
  const template = data.templates.find((t: any) => t.id === ctx.params.id);

  if (!template) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  const partsData = loadPartsData();
  const compatData = loadCompatibilityData();
  const bikeModels = [
    { id: 'XCF-180', name: 'XCF-180 标准版' },
    { id: 'XCF-180R', name: 'XCF-180R 运动版' },
    { id: 'XCF-180S', name: 'XCF-180S 街道版' },
  ];

  const partIds = template.items.map((item: any) => item.partId);
  const { conflicts, warnings } = checkPartCompatibility(partIds, compatData.relations || []);

  const modelCompatibility = template.modelIds.map((modelId: string) => {
    const model = bikeModels.find((m) => m.id === modelId);
    const incompatibleParts: string[] = [];

    partIds.forEach((partId: string) => {
      const part = partsData.parts.find((p: any) => p.id === partId);
      if (part && !part.compatibleModels.includes(modelId)) {
        incompatibleParts.push(part.name);
      }
    });

    return {
      modelId,
      modelName: model?.name || modelId,
      isCompatible: incompatibleParts.length === 0,
      incompatibleParts,
    };
  });

  const { totalPrice, totalLaborFee, grandTotal } = calculatePrice(template.items, partsData, laborFeeRates);

  ctx.body = {
    isValid: conflicts.length === 0 && modelCompatibility.every((m: any) => m.isCompatible),
    modelCompatibility,
    partConflicts: conflicts,
    partWarnings: warnings,
    totalPrice,
    totalLaborFee,
    grandTotal,
  };
});

router.post('/api/templates/:id/apply', (ctx) => {
  const data = loadData();
  const template = data.templates.find((t: any) => t.id === ctx.params.id);

  if (!template) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  const selectionsData = loadSelectionsData();
  const now = new Date().toISOString();

  const newSelection: any = {
    id: generateId('sel'),
    name: template.name,
    items: JSON.parse(JSON.stringify(template.items)),
    createdAt: now,
    updatedAt: now,
    versions: [
      {
        id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `基于模板「${template.name}」创建`,
        items: JSON.parse(JSON.stringify(template.items)),
        createdAt: now,
        description: `从模板 ${template.id} 应用`,
        versionNumber: 1,
      },
    ],
  };

  selectionsData.selections.push(newSelection);
  saveSelectionsData(selectionsData);

  template.useCount = (template.useCount || 0) + 1;
  saveData(data);

  const partsData = loadPartsData();
  const compatData = loadCompatibilityData();
  const bikeModels = [
    { id: 'XCF-180', name: 'XCF-180 标准版' },
    { id: 'XCF-180R', name: 'XCF-180R 运动版' },
    { id: 'XCF-180S', name: 'XCF-180S 街道版' },
  ];

  const partIds = template.items.map((item: any) => item.partId);
  const { conflicts, warnings } = checkPartCompatibility(partIds, compatData.relations || []);

  const modelCompatibility = template.modelIds.map((modelId: string) => {
    const model = bikeModels.find((m: any) => m.id === modelId);
    const incompatibleParts: string[] = [];

    partIds.forEach((partId: string) => {
      const part = partsData.parts.find((p: any) => p.id === partId);
      if (part && !part.compatibleModels.includes(modelId)) {
        incompatibleParts.push(part.name);
      }
    });

    return {
      modelId,
      modelName: model?.name || modelId,
      isCompatible: incompatibleParts.length === 0,
      incompatibleParts,
    };
  });

  const { totalPrice, totalLaborFee, grandTotal } = calculatePrice(template.items, partsData, laborFeeRates);

  ctx.status = 201;
  ctx.body = {
    success: true,
    selection: newSelection,
    compatibility: {
      isValid: conflicts.length === 0 && modelCompatibility.every((m: any) => m.isCompatible),
      modelCompatibility,
      partConflicts: conflicts,
      partWarnings: warnings,
      totalPrice,
      totalLaborFee,
      grandTotal,
    },
  };
});

router.post('/api/templates/:id/favorite', (ctx) => {
  const data = loadData();
  const template = data.templates.find((t: any) => t.id === ctx.params.id);

  if (!template) {
    ctx.status = 404;
    ctx.body = { error: 'Template not found' };
    return;
  }

  if (!data.favorites) data.favorites = [];

  const favIndex = data.favorites.findIndex((f: any) => f.templateId === ctx.params.id);

  if (favIndex !== -1) {
    data.favorites.splice(favIndex, 1);
    template.favoriteCount = Math.max(0, (template.favoriteCount || 0) - 1);
    ctx.body = { favorited: false, favoriteCount: template.favoriteCount };
  } else {
    data.favorites.push({
      templateId: ctx.params.id,
      addedAt: new Date().toISOString(),
    });
    template.favoriteCount = (template.favoriteCount || 0) + 1;
    ctx.body = { favorited: true, favoriteCount: template.favoriteCount };
  }

  saveData(data);
});

router.get('/api/templates/favorites/list', (ctx) => {
  const data = loadData();
  const favorites = data.favorites || [];

  const favoriteTemplates = favorites
    .map((f: any) => {
      const template = data.templates.find((t: any) => t.id === f.templateId);
      return template ? { ...template, favoritedAt: f.addedAt } : null;
    })
    .filter(Boolean);

  ctx.body = favoriteTemplates;
});

export const templatesRoutes = router;
