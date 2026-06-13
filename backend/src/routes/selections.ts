import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/selections.json');

function loadData() {
  const raw = readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function initSelectionVersions(selection: any) {
  if (!selection.versions) {
    selection.versions = [];
  }
  if (!selection.updatedAt) {
    selection.updatedAt = selection.createdAt || new Date().toISOString();
  }
  return selection;
}

function createVersionSnapshot(selection: any, description?: string): any {
  initSelectionVersions(selection);
  const versionNumber = selection.versions.length + 1;
  const version = {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: selection.name,
    items: JSON.parse(JSON.stringify(selection.items)),
    createdAt: new Date().toISOString(),
    description: description || `版本 ${versionNumber}`,
    versionNumber,
  };
  selection.versions.push(version);
  return version;
}

router.get('/api/selections', (ctx) => {
  const data = loadData();
  data.selections.forEach((s: any) => initSelectionVersions(s));
  saveData(data);
  ctx.body = data.selections;
});

router.post('/api/selections', (ctx) => {
  const data = loadData();
  const now = new Date().toISOString();
  const newSelection: any = {
    id: `sel-${Date.now()}`,
    name: ctx.request.body.name || 'Unnamed Selection',
    items: [],
    createdAt: now,
    updatedAt: now,
    versions: [],
    ...ctx.request.body,
  };
  if (!newSelection.versions) {
    newSelection.versions = [];
  }
  if (newSelection.items.length > 0 || newSelection.versions.length === 0) {
    createVersionSnapshot(newSelection, '初始版本');
  }
  data.selections.push(newSelection);
  saveData(data);
  ctx.status = 201;
  ctx.body = newSelection;
});

router.put('/api/selections/:id', (ctx) => {
  const data = loadData();
  const idx = data.selections.findIndex((s: any) => s.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(data.selections[idx]);
  const autoSnapshot = ctx.request.body.autoSnapshot !== false;
  if (autoSnapshot && ctx.request.body.items) {
    const oldItems = JSON.stringify(data.selections[idx].items);
    const newItems = JSON.stringify(ctx.request.body.items);
    if (oldItems !== newItems) {
      createVersionSnapshot(data.selections[idx], '自动保存');
    }
  }
  data.selections[idx] = {
    ...data.selections[idx],
    ...ctx.request.body,
    updatedAt: new Date().toISOString(),
  };
  if (ctx.request.body.autoSnapshot !== undefined) {
    delete data.selections[idx].autoSnapshot;
  }
  saveData(data);
  ctx.body = data.selections[idx];
});

router.delete('/api/selections/:id', (ctx) => {
  const data = loadData();
  const idx = data.selections.findIndex((s: any) => s.id === ctx.params.id);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  const removed = data.selections.splice(idx, 1);
  saveData(data);
  ctx.body = removed[0];
});

router.post('/api/selections/:id/items', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  createVersionSnapshot(selection, '添加配件前快照');
  selection.items.push(ctx.request.body);
  selection.updatedAt = new Date().toISOString();
  saveData(data);
  ctx.status = 201;
  ctx.body = selection;
});

router.delete('/api/selections/:id/items/:partId', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  const idx = selection.items.findIndex((item: any) => item.partId === ctx.params.partId);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Item not found in selection' };
    return;
  }
  initSelectionVersions(selection);
  createVersionSnapshot(selection, '移除配件前快照');
  selection.items.splice(idx, 1);
  selection.updatedAt = new Date().toISOString();
  saveData(data);
  ctx.body = selection;
});

router.get('/api/selections/:id/versions', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  ctx.body = selection.versions.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

router.post('/api/selections/:id/versions', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  const version = createVersionSnapshot(selection, ctx.request.body.description);
  saveData(data);
  ctx.status = 201;
  ctx.body = version;
});

router.get('/api/selections/:id/versions/:versionId', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  const version = selection.versions.find((v: any) => v.id === ctx.params.versionId);
  if (!version) {
    ctx.status = 404;
    ctx.body = { error: 'Version not found' };
    return;
  }
  ctx.body = version;
});

router.post('/api/selections/:id/versions/:versionId/rollback', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  const version = selection.versions.find((v: any) => v.id === ctx.params.versionId);
  if (!version) {
    ctx.status = 404;
    ctx.body = { error: 'Version not found' };
    return;
  }
  createVersionSnapshot(selection, `回滚前快照（版本 ${version.versionNumber}）`);
  selection.items = JSON.parse(JSON.stringify(version.items));
  selection.updatedAt = new Date().toISOString();
  saveData(data);
  ctx.body = selection;
});

router.delete('/api/selections/:id/versions/:versionId', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  const idx = selection.versions.findIndex((v: any) => v.id === ctx.params.versionId);
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Version not found' };
    return;
  }
  const removed = selection.versions.splice(idx, 1);
  saveData(data);
  ctx.body = removed[0];
});

router.get('/api/selections/:id/versions/compare', (ctx) => {
  const data = loadData();
  const selection = data.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }
  initSelectionVersions(selection);
  const { versionA, versionB } = ctx.query;
  const verA = selection.versions.find((v: any) => v.id === versionA);
  const verB = selection.versions.find((v: any) => v.id === versionB);
  if (!verA || !verB) {
    ctx.status = 404;
    ctx.body = { error: 'Version not found' };
    return;
  }
  ctx.body = {
    versionA: verA,
    versionB: verB,
  };
});

export const selectionsRoutes = router;
