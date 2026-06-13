import Router from 'koa-router';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

function loadPartsData() {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
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

  const data = loadPartsData();
  const partsMap = new Map<string, any>();
  data.parts.forEach((p: any) => partsMap.set(p.id, p));

  const conflicts: ConflictInfo[] = [];
  const warnings: ConflictInfo[] = [];
  const processed = new Set<string>();

  for (const partId of partIds) {
    const part = partsMap.get(partId);
    if (!part || !part.conflictsWith) continue;

    for (const conflictId of part.conflictsWith) {
      if (!partIds.includes(conflictId)) continue;

      const pairKey = [partId, conflictId].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const conflictPart = partsMap.get(conflictId);
      if (!conflictPart) continue;

      const isSameCategory = part.categoryId === conflictPart.categoryId;

      const info: ConflictInfo = {
        partId,
        conflictPartId: conflictId,
        partName: part.name,
        conflictPartName: conflictPart.name,
        severity: isSameCategory ? 'error' : 'warning',
        message: isSameCategory
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

  const data = loadPartsData();
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

  for (const selectedId of selectedIds) {
    if (selectedId === partId) continue;
    const hasDirect = (targetPart.conflictsWith || []).includes(selectedId);
    const selectedPart = partsMap.get(selectedId);
    const hasReverse = selectedPart && (selectedPart.conflictsWith || []).includes(partId);

    if (!hasDirect && !hasReverse) continue;
    if (!selectedPart) continue;

    const isSameCategory = targetPart.categoryId === selectedPart.categoryId;
    const info: ConflictInfo = {
      partId: targetPart.id,
      conflictPartId: selectedPart.id,
      partName: targetPart.name,
      conflictPartName: selectedPart.name,
      severity: isSameCategory ? 'error' : 'warning',
      message: isSameCategory
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
  const data = loadPartsData();
  const part = data.parts.find((p: any) => p.id === partId);

  if (!part) {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
    return;
  }

  const conflictParts = (part.conflictsWith || [])
    .map((id: string) => data.parts.find((p: any) => p.id === id))
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
