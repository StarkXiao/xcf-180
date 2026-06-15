import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/vehicle-model-profiles.json');

function loadData() {
  try {
    const raw = readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { profiles: [] };
  }
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toSummary(profile: any) {
  return {
    id: profile.id,
    modelId: profile.modelId,
    modelName: profile.modelName,
    modelNameEn: profile.modelNameEn,
    year: profile.year,
    trimLevel: profile.trimLevel,
    basePrice: profile.basePrice,
    description: profile.description,
    imageUrl: profile.imageUrl,
    specsCount: profile.specs?.length ?? 0,
    zonesCount: profile.assemblyZones?.length ?? 0,
    restrictionsCount: profile.modificationRestrictions?.length ?? 0,
    regulationsCount: profile.regulationNotes?.length ?? 0,
    diagramsCount: profile.diagrams?.length ?? 0,
    streetLegalStatus: profile.streetLegalStatus,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

router.get('/api/vehicle-model-profiles', async (ctx) => {
  const data = loadData();
  const { keyword, modelId, isActive, streetLegalStatus } = ctx.query;

  let profiles = data.profiles;

  if (keyword) {
    const q = String(keyword).toLowerCase();
    profiles = profiles.filter(
      (p: any) =>
        p.modelName.toLowerCase().includes(q) ||
        p.modelNameEn.toLowerCase().includes(q) ||
        p.modelId.toLowerCase().includes(q) ||
        (p.description?.toLowerCase() ?? '').includes(q)
    );
  }
  if (modelId) {
    profiles = profiles.filter((p: any) => p.modelId === modelId);
  }
  if (isActive !== undefined) {
    const active = isActive === 'true' || isActive === true;
    profiles = profiles.filter((p: any) => p.isActive === active);
  }
  if (streetLegalStatus) {
    profiles = profiles.filter((p: any) => p.streetLegalStatus === streetLegalStatus);
  }

  const summaries = profiles.map(toSummary);
  ctx.body = summaries;
});

router.get('/api/vehicle-model-profiles/:id', async (ctx) => {
  const data = loadData();
  const profile = data.profiles.find((p: any) => p.id === ctx.params.id);
  if (!profile) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }
  ctx.body = profile;
});

router.get('/api/vehicle-model-profiles/by-model/:modelId', async (ctx) => {
  const data = loadData();
  const profile = data.profiles.find((p: any) => p.modelId === ctx.params.modelId);
  if (!profile) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }
  ctx.body = profile;
});

router.post('/api/admin/vehicle-model-profiles', async (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;

  const now = new Date().toISOString();
  const newProfile = {
    id: generateId('profile'),
    ...body,
    specs: (body.specs || []).map((s: any) => ({ ...s, id: generateId('spec') })),
    assemblyZones: (body.assemblyZones || []).map((z: any) => ({ ...z, id: generateId('zone') })),
    modificationRestrictions: (body.modificationRestrictions || []).map((r: any) => ({
      ...r,
      id: generateId('restrict'),
      createdAt: now,
      updatedAt: now,
    })),
    regulationNotes: (body.regulationNotes || []).map((n: any) => ({
      ...n,
      id: generateId('reg'),
      createdAt: now,
      updatedAt: now,
    })),
    diagrams: (body.diagrams || []).map((d: any) => ({
      ...d,
      id: generateId('diag'),
      createdAt: now,
      updatedAt: now,
    })),
    isActive: body.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  data.profiles.push(newProfile);
  saveData(data);
  ctx.body = newProfile;
});

router.put('/api/admin/vehicle-model-profiles/:id', async (ctx) => {
  const data = loadData();
  const index = data.profiles.findIndex((p: any) => p.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }

  const body = ctx.request.body as any;
  const existing = data.profiles[index];
  const now = new Date().toISOString();

  const updatedProfile = {
    ...existing,
    ...body,
    updatedAt: now,
  };

  if (body.specs) {
    updatedProfile.specs = body.specs.map((s: any) =>
      s.id ? s : { ...s, id: generateId('spec') }
    );
  }
  if (body.assemblyZones) {
    updatedProfile.assemblyZones = body.assemblyZones.map((z: any) =>
      z.id ? z : { ...z, id: generateId('zone') }
    );
  }
  if (body.modificationRestrictions) {
    updatedProfile.modificationRestrictions = body.modificationRestrictions.map((r: any) =>
      r.id ? { ...r, updatedAt: now } : { ...r, id: generateId('restrict'), createdAt: now, updatedAt: now }
    );
  }
  if (body.regulationNotes) {
    updatedProfile.regulationNotes = body.regulationNotes.map((n: any) =>
      n.id ? { ...n, updatedAt: now } : { ...n, id: generateId('reg'), createdAt: now, updatedAt: now }
    );
  }
  if (body.diagrams) {
    updatedProfile.diagrams = body.diagrams.map((d: any) =>
      d.id ? { ...d, updatedAt: now } : { ...d, id: generateId('diag'), createdAt: now, updatedAt: now }
    );
  }

  data.profiles[index] = updatedProfile;
  saveData(data);
  ctx.body = updatedProfile;
});

router.delete('/api/admin/vehicle-model-profiles/:id', async (ctx) => {
  const data = loadData();
  const index = data.profiles.findIndex((p: any) => p.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }

  const [removed] = data.profiles.splice(index, 1);
  saveData(data);
  ctx.body = { success: true, removed };
});

router.put('/api/admin/vehicle-model-profiles/:id/toggle', async (ctx) => {
  const data = loadData();
  const profile = data.profiles.find((p: any) => p.id === ctx.params.id);
  if (!profile) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }

  profile.isActive = !profile.isActive;
  profile.updatedAt = new Date().toISOString();
  saveData(data);
  ctx.body = profile;
});

export { router as vehicleModelsRoutes };
