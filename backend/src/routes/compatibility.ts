import Router from 'koa-router';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

interface DataStore {
  parts: any[];
  compatibilityRelations: any[];
}

function loadData(): DataStore {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return {
    parts: data.parts || [],
    compatibilityRelations: data.compatibilityRelations || [],
  };
}

interface ConflictInfo {
  partId: string;
  conflictPartId: string;
  partName: string;
  conflictPartName: string;
  severity: 'warning' | 'error';
  message: string;
}

function buildConflictMessage(partName: string, conflictPartName: string): string {
  return `「${partName}」与「${conflictPartName}」存在安装冲突，无法同时选配`;
}

function buildWarningMessage(partName: string, conflictPartName: string): string {
  return `「${partName}」与「${conflictPartName}」搭配可能需要专业调校，建议咨询技术人员`;
}

router.post('/api/compatibility/check', (ctx) => {
  const { partIds } = ctx.request.body as { partIds: string[] };

  if (!partIds || !Array.isArray(partIds)) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid partIds array' };
    return;
  }

  const data = loadData();
  const partsMap = new Map<string, any>();
  data.parts.forEach((p: any) => partsMap.set(p.id, p));

  const conflicts: ConflictInfo[] = [];
  const warnings: ConflictInfo[] = [];
  const processed = new Set<string>();

  for (const partId of partIds) {
    const part = partsMap.get(partId);
    if (!part) continue;

    const relations = data.compatibilityRelations.filter(
      (r) =>
        (r.partIdA === partId || r.partIdB === partId) &&
        r.type === 'conflict'
    );

    for (const rel of relations) {
      const conflictId = rel.partIdA === partId ? rel.partIdB : rel.partIdA;
      if (!partIds.includes(conflictId)) continue;

      const pairKey = [partId, conflictId].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const conflictPart = partsMap.get(conflictId);
      if (!conflictPart) continue;

      const info: ConflictInfo = {
        partId,
        conflictPartId: conflictId,
        partName: part.name,
        conflictPartName: conflictPart.name,
        severity: rel.severity || 'warning',
        message: rel.severity === 'error'
          ? buildConflictMessage(part.name, conflictPart.name)
          : buildWarningMessage(part.name, conflictPart.name),
      };

      if (info.severity === 'error') {
        conflicts.push(info);
      } else {
        warnings.push(info);
      }
    }
  }

  ctx.body = {
    hasConflicts: conflicts.length > 0 || warnings.length > 0,
    conflicts,
    warnings,
  };
});

router.post('/api/compatibility/part/:partId/check', (ctx) => {
  const { partId } = ctx.params;
  const { partIds } = ctx.request.body as { partIds: string[] };
  const selectedIds = Array.isArray(partIds) ? partIds : [];

  const data = loadData();
  const partsMap = new Map<string, any>();
  data.parts.forEach((p: any) => partsMap.set(p.id, p));

  const targetPart = partsMap.get(partId);
  if (!targetPart) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }

  const conflicts: ConflictInfo[] = [];
  const warnings: ConflictInfo[] = [];

  const targetRelations = data.compatibilityRelations.filter(
    (r) =>
      (r.partIdA === partId || r.partIdB === partId) &&
      r.type === 'conflict'
  );

  for (const selectedId of selectedIds) {
    if (selectedId === partId) continue;
    
    const relation = targetRelations.find(
      (r) =>
        (r.partIdA === partId && r.partIdB === selectedId) ||
        (r.partIdA === selectedId && r.partIdB === partId)
    );
    
    if (!relation) continue;
    
    const selectedPart = partsMap.get(selectedId);
    if (!selectedPart) continue;

    const info: ConflictInfo = {
      partId: targetPart.id,
      conflictPartId: selectedPart.id,
      partName: targetPart.name,
      conflictPartName: selectedPart.name,
      severity: relation.severity || 'warning',
      message: relation.severity === 'error'
        ? buildConflictMessage(targetPart.name, selectedPart.name)
        : buildWarningMessage(targetPart.name, selectedPart.name),
    };

    if (info.severity === 'error') {
      conflicts.push(info);
    } else {
      warnings.push(info);
    }
  }

  ctx.body = {
    hasConflicts: conflicts.length > 0 || warnings.length > 0,
    conflicts,
    warnings,
  };
});

router.get('/api/compatibility/part/:partId', (ctx) => {
  const { partId } = ctx.params;
  const data = loadData();
  const part = data.parts.find((p: any) => p.id === partId);

  if (!part) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }

  const relations = data.compatibilityRelations.filter(
    (r) =>
      (r.partIdA === partId || r.partIdB === partId) &&
      r.type === 'conflict'
  );

  const conflictParts = relations
    .map((r) => {
      const conflictId = r.partIdA === partId ? r.partIdB : r.partIdA;
      return data.parts.find((p: any) => p.id === conflictId);
    })
    .filter(Boolean);

  ctx.body = {
    partId: part.id,
    partName: part.name,
    conflictsWith: conflictParts.map((p: any) => ({
      partId: p.id,
      partName: p.name,
      categoryId: p.categoryId,
      isSameCategory: p.categoryId === part.categoryId,
    })),
  };
});

export const compatibilityRoutes = router;
