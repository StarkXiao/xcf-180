import Router from 'koa-router';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

function loadData() {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

router.get('/api/categories', (ctx) => {
  const data = loadData();
  ctx.body = data.categories;
});

router.get('/api/parts', (ctx) => {
  const data = loadData();
  const { category } = ctx.query;
  let parts = data.parts;
  if (category) {
    parts = parts.filter((p: any) => p.categoryId === category);
  }
  ctx.body = parts;
});

router.get('/api/parts/:id', (ctx) => {
  const data = loadData();
  const part = data.parts.find((p: any) => p.id === ctx.params.id);
  if (part) {
    ctx.body = part;
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Part not found' };
  }
});

export const partsRoutes = router;
