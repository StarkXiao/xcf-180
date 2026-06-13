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

router.get('/api/selections', (ctx) => {
  const data = loadData();
  ctx.body = data.selections;
});

router.post('/api/selections', (ctx) => {
  const data = loadData();
  const newSelection = {
    id: `sel-${Date.now()}`,
    name: ctx.request.body.name || 'Unnamed Selection',
    items: [],
    createdAt: new Date().toISOString(),
    ...ctx.request.body,
  };
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
  data.selections[idx] = { ...data.selections[idx], ...ctx.request.body };
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
  selection.items.push(ctx.request.body);
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
  selection.items.splice(idx, 1);
  saveData(data);
  ctx.body = selection;
});

export const selectionsRoutes = router;
