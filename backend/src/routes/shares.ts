import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const sharesDataPath = path.resolve(__dirname, '../../data/shares.json');
const selectionsDataPath = path.resolve(__dirname, '../../data/selections.json');

function loadSharesData() {
  const raw = readFileSync(sharesDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveSharesData(data: any) {
  writeFileSync(sharesDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadSelectionsData() {
  const raw = readFileSync(selectionsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isShareExpired(share: any): boolean {
  if (!share.isActive) return true;
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return true;
  return false;
}

function getClientIp(ctx: any): string {
  return ctx.request.ip || 
         ctx.request.headers['x-forwarded-for'] || 
         ctx.request.headers['x-real-ip'] || 
         'unknown';
}

function recordAccess(share: any, ctx: any) {
  const ip = getClientIp(ctx);
  const userAgent = ctx.request.headers['user-agent'] || '';
  
  share.accessCount += 1;
  share.lastAccessedAt = new Date().toISOString();
  share.accessLogs.unshift({
    accessedAt: new Date().toISOString(),
    ip,
    userAgent,
  });
  
  if (share.accessLogs.length > 100) {
    share.accessLogs = share.accessLogs.slice(0, 100);
  }
}

router.post('/api/selections/:id/share', (ctx) => {
  const selectionsData = loadSelectionsData();
  const sharesData = loadSharesData();
  
  const selection = selectionsData.selections.find((s: any) => s.id === ctx.params.id);
  if (!selection) {
    ctx.status = 404;
    ctx.body = { error: 'Selection not found' };
    return;
  }

  const { note, expiresInDays, expiresAt } = ctx.request.body as any;
  
  let finalExpiresAt: string | undefined;
  if (expiresAt) {
    finalExpiresAt = expiresAt;
  } else if (expiresInDays && expiresInDays > 0) {
    const date = new Date();
    date.setDate(date.getDate() + expiresInDays);
    finalExpiresAt = date.toISOString();
  }

  const now = new Date().toISOString();
  const shareId = generateShortId();

  const newShare: any = {
    id: shareId,
    selectionId: selection.id,
    name: selection.name,
    items: JSON.parse(JSON.stringify(selection.items)),
    note: note || undefined,
    createdAt: now,
    expiresAt: finalExpiresAt,
    isActive: true,
    accessCount: 0,
    accessLogs: [],
  };

  sharesData.shares.push(newShare);
  saveSharesData(sharesData);

  ctx.status = 201;
  ctx.body = newShare;
});

router.get('/api/selections/:id/shares', (ctx) => {
  const sharesData = loadSharesData();
  const shares = sharesData.shares
    .filter((s: any) => s.selectionId === ctx.params.id)
    .sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  ctx.body = shares;
});

router.get('/api/shares/:shareId', (ctx) => {
  const sharesData = loadSharesData();
  const share = sharesData.shares.find((s: any) => s.id === ctx.params.shareId);
  
  if (!share) {
    ctx.status = 404;
    ctx.body = { error: 'Share not found' };
    return;
  }

  if (isShareExpired(share)) {
    ctx.status = 410;
    ctx.body = { 
      error: 'Share expired',
      message: share.isActive 
        ? '该分享链接已过期' 
        : '该分享链接已被所有者撤销' 
    };
    return;
  }

  recordAccess(share, ctx);
  saveSharesData(sharesData);

  ctx.body = {
    id: share.id,
    selectionId: share.selectionId,
    name: share.name,
    items: share.items,
    note: share.note,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
  };
});

router.put('/api/shares/:shareId', (ctx) => {
  const sharesData = loadSharesData();
  const share = sharesData.shares.find((s: any) => s.id === ctx.params.shareId);
  
  if (!share) {
    ctx.status = 404;
    ctx.body = { error: 'Share not found' };
    return;
  }

  const { note, expiresAt, isActive } = ctx.request.body as any;
  
  if (note !== undefined) share.note = note;
  if (expiresAt !== undefined) share.expiresAt = expiresAt;
  if (isActive !== undefined) share.isActive = isActive;

  saveSharesData(sharesData);
  ctx.body = share;
});

router.delete('/api/shares/:shareId', (ctx) => {
  const sharesData = loadSharesData();
  const idx = sharesData.shares.findIndex((s: any) => s.id === ctx.params.shareId);
  
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Share not found' };
    return;
  }

  const removed = sharesData.shares.splice(idx, 1)[0];
  saveSharesData(sharesData);
  ctx.body = removed;
});

router.get('/api/shares/:shareId/stats', (ctx) => {
  const sharesData = loadSharesData();
  const share = sharesData.shares.find((s: any) => s.id === ctx.params.shareId);
  
  if (!share) {
    ctx.status = 404;
    ctx.body = { error: 'Share not found' };
    return;
  }

  ctx.body = {
    id: share.id,
    accessCount: share.accessCount,
    lastAccessedAt: share.lastAccessedAt,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    isActive: share.isActive,
    isExpired: isShareExpired(share),
    accessLogs: share.accessLogs.slice(0, 20),
  };
});

export const sharesRoutes = router;
