import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const usersDataPath = path.resolve(__dirname, '../../data/users.json');
const partsDataPath = path.resolve(__dirname, '../../data/parts.json');
const templatesDataPath = path.resolve(__dirname, '../../data/templates.json');
const selectionsDataPath = path.resolve(__dirname, '../../data/selections.json');

function loadUsersData() {
  const raw = readFileSync(usersDataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveUsersData(data: any) {
  writeFileSync(usersDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadPartsData() {
  const raw = readFileSync(partsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function loadTemplatesData() {
  const raw = readFileSync(templatesDataPath, 'utf-8');
  return JSON.parse(raw);
}

function loadSelectionsData() {
  const raw = readFileSync(selectionsDataPath, 'utf-8');
  return JSON.parse(raw);
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString('base64');
}

function getUserFromToken(ctx: any): any {
  const authHeader = ctx.request.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];
    const data = loadUsersData();
    return data.users.find((u: any) => u.id === userId);
  } catch {
    return null;
  }
}

function sanitizeUser(user: any): any {
  const { password, ...safeUser } = user;
  return safeUser;
}

router.post('/api/auth/register', (ctx) => {
  const data = loadUsersData();
  const { username, email, password, nickname, phone } = ctx.request.body as any;

  if (!username || !email || !password) {
    ctx.status = 400;
    ctx.body = { error: '用户名、邮箱和密码不能为空' };
    return;
  }

  if (data.users.some((u: any) => u.username === username)) {
    ctx.status = 409;
    ctx.body = { error: '用户名已存在' };
    return;
  }

  if (data.users.some((u: any) => u.email === email)) {
    ctx.status = 409;
    ctx.body = { error: '邮箱已被注册' };
    return;
  }

  const now = new Date().toISOString();
  const userId = generateId('user');

  const newUser: any = {
    id: userId,
    username,
    email,
    password,
    phone: phone || undefined,
    nickname: nickname || username,
    avatar: '',
    bio: '',
    role: 'user',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  const newProfile: any = {
    userId,
    gender: undefined,
    location: undefined,
    bikeModel: undefined,
    ridingStyle: undefined,
    ridingExperience: undefined,
    favoriteBrands: [],
    socialLinks: { wechat: '', weibo: '' },
    updatedAt: now,
  };

  data.users.push(newUser);
  data.userProfiles.push(newProfile);
  saveUsersData(data);

  const token = generateToken(userId);

  ctx.status = 201;
  ctx.body = {
    user: sanitizeUser(newUser),
    profile: newProfile,
    token,
  };
});

router.post('/api/auth/login', (ctx) => {
  const data = loadUsersData();
  const { username, password } = ctx.request.body as any;

  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { error: '用户名和密码不能为空' };
    return;
  }

  const user = data.users.find(
    (u: any) => (u.username === username || u.email === username) && u.password === password
  );

  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '用户名或密码错误' };
    return;
  }

  const now = new Date().toISOString();
  user.lastLoginAt = now;
  user.updatedAt = now;
  saveUsersData(data);

  const token = generateToken(user.id);

  ctx.body = {
    user: sanitizeUser(user),
    token,
  };
});

router.post('/api/auth/logout', (ctx) => {
  ctx.body = { success: true };
});

router.get('/api/user/me', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const profile = data.userProfiles.find((p: any) => p.userId === user.id);

  ctx.body = {
    user: sanitizeUser(user),
    profile: profile || null,
  };
});

router.put('/api/user/profile', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const userIdx = data.users.findIndex((u: any) => u.id === user.id);
  if (userIdx === -1) {
    ctx.status = 404;
    ctx.body = { error: '用户不存在' };
    return;
  }

  const now = new Date().toISOString();
  const updates = ctx.request.body as any;

  if (updates.nickname !== undefined) data.users[userIdx].nickname = updates.nickname;
  if (updates.phone !== undefined) data.users[userIdx].phone = updates.phone;
  if (updates.avatar !== undefined) data.users[userIdx].avatar = updates.avatar;
  if (updates.bio !== undefined) data.users[userIdx].bio = updates.bio;
  data.users[userIdx].updatedAt = now;

  let profileIdx = data.userProfiles.findIndex((p: any) => p.userId === user.id);
  if (profileIdx === -1) {
    data.userProfiles.push({ userId: user.id, updatedAt: now });
    profileIdx = data.userProfiles.length - 1;
  }

  if (updates.gender !== undefined) data.userProfiles[profileIdx].gender = updates.gender;
  if (updates.location !== undefined) data.userProfiles[profileIdx].location = updates.location;
  if (updates.bikeModel !== undefined) data.userProfiles[profileIdx].bikeModel = updates.bikeModel;
  if (updates.ridingStyle !== undefined) data.userProfiles[profileIdx].ridingStyle = updates.ridingStyle;
  if (updates.ridingExperience !== undefined) data.userProfiles[profileIdx].ridingExperience = updates.ridingExperience;
  if (updates.favoriteBrands !== undefined) data.userProfiles[profileIdx].favoriteBrands = updates.favoriteBrands;
  if (updates.socialLinks !== undefined) data.userProfiles[profileIdx].socialLinks = { ...data.userProfiles[profileIdx].socialLinks, ...updates.socialLinks };
  data.userProfiles[profileIdx].updatedAt = now;

  saveUsersData(data);

  ctx.body = {
    user: sanitizeUser(data.users[userIdx]),
    profile: data.userProfiles[profileIdx],
  };
});

router.put('/api/user/password', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const { oldPassword, newPassword } = ctx.request.body as any;
  if (!oldPassword || !newPassword) {
    ctx.status = 400;
    ctx.body = { error: '请输入原密码和新密码' };
    return;
  }

  const data = loadUsersData();
  const userIdx = data.users.findIndex((u: any) => u.id === user.id);

  if (data.users[userIdx].password !== oldPassword) {
    ctx.status = 400;
    ctx.body = { error: '原密码错误' };
    return;
  }

  const now = new Date().toISOString();
  data.users[userIdx].password = newPassword;
  data.users[userIdx].updatedAt = now;
  saveUsersData(data);

  ctx.body = { success: true };
});

router.get('/api/user/favorites', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const targetType = ctx.query.type as string;
  const data = loadUsersData();
  const partsData = loadPartsData();
  const templatesData = loadTemplatesData();
  const selectionsData = loadSelectionsData();

  let favorites = data.favorites.filter((f: any) => f.userId === user.id);
  if (targetType) {
    favorites = favorites.filter((f: any) => f.targetType === targetType);
  }

  const enriched = favorites.map((f: any) => {
    let detail: any = null;
    if (f.targetType === 'part') {
      detail = partsData.parts.find((p: any) => p.id === f.targetId) || null;
    } else if (f.targetType === 'template') {
      detail = templatesData.templates.find((t: any) => t.id === f.targetId) || null;
    } else if (f.targetType === 'selection') {
      detail = selectionsData.selections.find((s: any) => s.id === f.targetId) || null;
    }
    return { ...f, detail };
  }).sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  ctx.body = enriched;
});

router.post('/api/user/favorites', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const { targetType, targetId, targetName } = ctx.request.body as any;

  const existing = data.favorites.find(
    (f: any) => f.userId === user.id && f.targetType === targetType && f.targetId === targetId
  );

  if (existing) {
    ctx.body = { ...existing, favorited: true };
    return;
  }

  const newFavorite: any = {
    id: generateId('fav'),
    userId: user.id,
    targetType,
    targetId,
    targetName: targetName || undefined,
    addedAt: new Date().toISOString(),
  };

  data.favorites.push(newFavorite);
  saveUsersData(data);

  ctx.status = 201;
  ctx.body = { ...newFavorite, favorited: true };
});

router.delete('/api/user/favorites/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.favorites.findIndex(
    (f: any) => f.id === ctx.params.id && f.userId === user.id
  );

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '收藏不存在' };
    return;
  }

  const removed = data.favorites.splice(idx, 1)[0];
  saveUsersData(data);

  ctx.body = { ...removed, favorited: false };
});

router.post('/api/user/favorites/check', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const { targetType, targetId } = ctx.request.body as any;

  const existing = data.favorites.find(
    (f: any) => f.userId === user.id && f.targetType === targetType && f.targetId === targetId
  );

  ctx.body = {
    favorited: !!existing,
    id: existing?.id || null,
  };
});

router.get('/api/user/history', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const partsData = loadPartsData();
  const templatesData = loadTemplatesData();
  const selectionsData = loadSelectionsData();
  const limit = parseInt(ctx.query.limit as string) || 50;

  let history = data.browsingHistory
    .filter((h: any) => h.userId === user.id)
    .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    .slice(0, limit);

  const enriched = history.map((h: any) => {
    let detail: any = null;
    if (h.targetType === 'part') {
      detail = partsData.parts.find((p: any) => p.id === h.targetId) || null;
    } else if (h.targetType === 'template') {
      detail = templatesData.templates.find((t: any) => t.id === h.targetId) || null;
    } else if (h.targetType === 'selection') {
      detail = selectionsData.selections.find((s: any) => s.id === h.targetId) || null;
    }
    return { ...h, detail };
  });

  ctx.body = enriched;
});

router.post('/api/user/history', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const { targetType, targetId, targetName, targetImage, duration } = ctx.request.body as any;

  data.browsingHistory = data.browsingHistory.filter(
    (h: any) => !(h.userId === user.id && h.targetType === targetType && h.targetId === targetId)
  );

  const newRecord: any = {
    id: generateId('hist'),
    userId: user.id,
    targetType,
    targetId,
    targetName: targetName || undefined,
    targetImage: targetImage || undefined,
    viewedAt: new Date().toISOString(),
    duration: duration || undefined,
  };

  data.browsingHistory.push(newRecord);

  const MAX_HISTORY = 200;
  const userHistory = data.browsingHistory
    .filter((h: any) => h.userId === user.id)
    .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
  if (userHistory.length > MAX_HISTORY) {
    const toRemove = userHistory.slice(MAX_HISTORY);
    data.browsingHistory = data.browsingHistory.filter(
      (h: any) => !toRemove.some((r: any) => r.id === h.id)
    );
  }

  saveUsersData(data);

  ctx.status = 201;
  ctx.body = newRecord;
});

router.delete('/api/user/history/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.browsingHistory.findIndex(
    (h: any) => h.id === ctx.params.id && h.userId === user.id
  );

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '记录不存在' };
    return;
  }

  data.browsingHistory.splice(idx, 1);
  saveUsersData(data);

  ctx.body = { success: true };
});

router.delete('/api/user/history', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  data.browsingHistory = data.browsingHistory.filter((h: any) => h.userId !== user.id);
  saveUsersData(data);

  ctx.body = { success: true };
});

router.get('/api/user/archives', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const status = ctx.query.status as string;

  let archives = data.archives.filter((a: any) => a.userId === user.id);
  if (status) {
    archives = archives.filter((a: any) => a.status === status);
  }

  archives.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  ctx.body = archives;
});

router.get('/api/user/archives/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const archive = data.archives.find((a: any) => a.id === ctx.params.id);

  if (!archive) {
    ctx.status = 404;
    ctx.body = { error: '档案不存在' };
    return;
  }

  if (archive.userId !== user.id && user.role !== 'admin') {
    if (!archive.isPublic || archive.status !== 'published') {
      ctx.status = 403;
      ctx.body = { error: '无权访问' };
      return;
    }
  }

  if (archive.userId === user.id) {
    archive.views = (archive.views || 0) + 0;
  } else {
    archive.views = (archive.views || 0) + 1;
    saveUsersData(data);
  }

  ctx.body = archive;
});

router.post('/api/user/archives', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const now = new Date().toISOString();
  const body = ctx.request.body as any;

  const newArchive: any = {
    id: generateId('archive'),
    userId: user.id,
    title: body.title,
    description: body.description || '',
    coverImage: body.coverImage || '',
    bikeModel: body.bikeModel,
    items: body.items || [],
    totalCost: body.totalCost || 0,
    tags: body.tags || [],
    isPublic: body.isPublic !== undefined ? body.isPublic : false,
    status: 'draft',
    likes: 0,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  data.archives.push(newArchive);
  saveUsersData(data);

  ctx.status = 201;
  ctx.body = newArchive;
});

router.put('/api/user/archives/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.archives.findIndex((a: any) => a.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '档案不存在' };
    return;
  }

  if (data.archives[idx].userId !== user.id && user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { error: '无权修改' };
    return;
  }

  const now = new Date().toISOString();
  const body = ctx.request.body as any;

  if (body.title !== undefined) data.archives[idx].title = body.title;
  if (body.description !== undefined) data.archives[idx].description = body.description;
  if (body.coverImage !== undefined) data.archives[idx].coverImage = body.coverImage;
  if (body.bikeModel !== undefined) data.archives[idx].bikeModel = body.bikeModel;
  if (body.items !== undefined) data.archives[idx].items = body.items;
  if (body.totalCost !== undefined) data.archives[idx].totalCost = body.totalCost;
  if (body.tags !== undefined) data.archives[idx].tags = body.tags;
  if (body.isPublic !== undefined) data.archives[idx].isPublic = body.isPublic;
  if (body.status !== undefined) {
    data.archives[idx].status = body.status;
    if (body.status === 'published' && !data.archives[idx].publishedAt) {
      data.archives[idx].publishedAt = now;
    }
  }
  data.archives[idx].updatedAt = now;

  saveUsersData(data);

  ctx.body = data.archives[idx];
});

router.delete('/api/user/archives/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.archives.findIndex((a: any) => a.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '档案不存在' };
    return;
  }

  if (data.archives[idx].userId !== user.id && user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { error: '无权删除' };
    return;
  }

  const removed = data.archives.splice(idx, 1)[0];
  saveUsersData(data);

  ctx.body = removed;
});

router.post('/api/user/archives/:id/like', (ctx) => {
  const data = loadUsersData();
  const idx = data.archives.findIndex((a: any) => a.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '档案不存在' };
    return;
  }

  data.archives[idx].likes = (data.archives[idx].likes || 0) + 1;
  saveUsersData(data);

  ctx.body = { likes: data.archives[idx].likes };
});

router.get('/api/user/shared', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();

  const owned = data.sharedResources.filter((s: any) => s.ownerId === user.id);
  const collaborated = data.sharedResources.filter(
    (s: any) => s.collaborators.some((c: any) => c.userId === user.id)
  );

  ctx.body = {
    owned,
    collaborated,
  };
});

router.get('/api/user/shared/:id', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const resource = data.sharedResources.find((r: any) => r.id === ctx.params.id);

  if (!resource) {
    ctx.status = 404;
    ctx.body = { error: '资源不存在' };
    return;
  }

  const isOwner = resource.ownerId === user.id;
  const isCollaborator = resource.collaborators.some((c: any) => c.userId === user.id);
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isCollaborator && !isAdmin) {
    ctx.status = 403;
    ctx.body = { error: '无权访问' };
    return;
  }

  ctx.body = resource;
});

router.post('/api/user/shared', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const now = new Date().toISOString();
  const { resourceType, resourceId, resourceName } = ctx.request.body as any;

  const existing = data.sharedResources.find(
    (s: any) => s.resourceType === resourceType && s.resourceId === resourceId && s.ownerId === user.id
  );

  if (existing) {
    ctx.body = existing;
    return;
  }

  const newResource: any = {
    id: generateId('shared'),
    resourceType,
    resourceId,
    resourceName,
    ownerId: user.id,
    collaborators: [],
    createdAt: now,
    updatedAt: now,
  };

  data.sharedResources.push(newResource);
  saveUsersData(data);

  ctx.status = 201;
  ctx.body = newResource;
});

router.post('/api/user/shared/:id/invite', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.sharedResources.findIndex((s: any) => s.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '资源不存在' };
    return;
  }

  if (data.sharedResources[idx].ownerId !== user.id && user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { error: '无权邀请' };
    return;
  }

  const { email, username, permission } = ctx.request.body as any;
  const invitee = data.users.find(
    (u: any) => u.email === email || u.username === username
  );

  if (!invitee) {
    ctx.status = 404;
    ctx.body = { error: '用户不存在' };
    return;
  }

  if (invitee.id === user.id) {
    ctx.status = 400;
    ctx.body = { error: '不能邀请自己' };
    return;
  }

  const existingCollaborator = data.sharedResources[idx].collaborators.find(
    (c: any) => c.userId === invitee.id
  );

  if (existingCollaborator) {
    ctx.status = 409;
    ctx.body = { error: '用户已是协作者' };
    return;
  }

  const now = new Date().toISOString();
  const collaborator: any = {
    userId: invitee.id,
    username: invitee.username,
    nickname: invitee.nickname,
    avatar: invitee.avatar,
    permission,
    addedAt: now,
    addedBy: user.id,
  };

  data.sharedResources[idx].collaborators.push(collaborator);
  data.sharedResources[idx].updatedAt = now;
  saveUsersData(data);

  ctx.status = 201;
  ctx.body = collaborator;
});

router.put('/api/user/shared/:id/collaborators/:userId', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.sharedResources.findIndex((s: any) => s.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '资源不存在' };
    return;
  }

  if (data.sharedResources[idx].ownerId !== user.id && user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { error: '无权修改' };
    return;
  }

  const collabIdx = data.sharedResources[idx].collaborators.findIndex(
    (c: any) => c.userId === ctx.params.userId
  );

  if (collabIdx === -1) {
    ctx.status = 404;
    ctx.body = { error: '协作者不存在' };
    return;
  }

  const { permission } = ctx.request.body as any;
  data.sharedResources[idx].collaborators[collabIdx].permission = permission;
  data.sharedResources[idx].updatedAt = new Date().toISOString();
  saveUsersData(data);

  ctx.body = data.sharedResources[idx].collaborators[collabIdx];
});

router.delete('/api/user/shared/:id/collaborators/:userId', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();
  const idx = data.sharedResources.findIndex((s: any) => s.id === ctx.params.id);

  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: '资源不存在' };
    return;
  }

  if (data.sharedResources[idx].ownerId !== user.id && user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { error: '无权删除' };
    return;
  }

  const collabIdx = data.sharedResources[idx].collaborators.findIndex(
    (c: any) => c.userId === ctx.params.userId
  );

  if (collabIdx === -1) {
    ctx.status = 404;
    ctx.body = { error: '协作者不存在' };
    return;
  }

  const removed = data.sharedResources[idx].collaborators.splice(collabIdx, 1)[0];
  data.sharedResources[idx].updatedAt = new Date().toISOString();
  saveUsersData(data);

  ctx.body = removed;
});

router.get('/api/user/stats', (ctx) => {
  const user = getUserFromToken(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: '未登录' };
    return;
  }

  const data = loadUsersData();

  const favoriteParts = data.favorites.filter((f: any) => f.userId === user.id && f.targetType === 'part').length;
  const favoriteTemplates = data.favorites.filter((f: any) => f.userId === user.id && f.targetType === 'template').length;
  const browsingHistoryCount = data.browsingHistory.filter((h: any) => h.userId === user.id).length;
  const archives = data.archives.filter((a: any) => a.userId === user.id);
  const archivesCount = archives.length;
  const publishedArchivesCount = archives.filter((a: any) => a.status === 'published').length;
  const ownedResources = data.sharedResources.filter((s: any) => s.ownerId === user.id).length;
  const collaboratedResources = data.sharedResources.filter(
    (s: any) => s.ownerId !== user.id && s.collaborators.some((c: any) => c.userId === user.id)
  ).length;
  const collaborationsCount = ownedResources + collaboratedResources;
  const totalSpent = archives.reduce((sum: number, a: any) => sum + (a.totalCost || 0), 0);

  ctx.body = {
    favoriteParts,
    favoriteTemplates,
    browsingHistoryCount,
    archivesCount,
    publishedArchivesCount,
    collaborationsCount,
    totalSpent,
  };
});

export const usersRoutes = router;
