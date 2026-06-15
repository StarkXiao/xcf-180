import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

interface AssemblyZone {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  categoryIds: string[];
  sortOrder: number;
  isActive: boolean;
}

interface ModificationRestriction {
  id: string;
  modelId: string;
  zoneId?: string;
  categoryId?: string;
  restrictionType: 'prohibited' | 'limited' | 'requires_approval' | 'street_legal';
  title: string;
  description: string;
  regulationReference?: string;
  severity: 'warning' | 'danger' | 'info';
  affectedPartIds?: string[];
  exceptions?: string[];
  effectiveDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegulationNote {
  id: string;
  modelId: string;
  title: string;
  content: string;
  noteType: 'national' | 'local' | 'industry' | 'internal';
  region?: string;
  regulationCode?: string;
  effectiveDate?: string;
  expiryDate?: string;
  attachments?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DiagramConfig {
  id: string;
  modelId: string;
  name: string;
  description?: string;
  diagramType: 'front' | 'side' | 'rear' | 'top' | 'exploded' | 'custom';
  imageUrl: string;
  zones: AssemblyZone[];
  hotspots: {
    id: string;
    zoneId?: string;
    partId?: string;
    position: { x: number; y: number };
    label: string;
    description?: string;
  }[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VehicleSpec {
  id: string;
  category: 'engine' | 'chassis' | 'body' | 'electrical' | 'performance' | 'dimensions' | 'other';
  name: string;
  nameEn?: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'range';
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isModifiable: boolean;
  modificationImpact?: string;
  sortOrder: number;
}

interface VehicleModelProfile {
  id: string;
  modelId: string;
  modelName: string;
  modelNameEn: string;
  year: number;
  trimLevel?: string;
  basePrice: number;
  description: string;
  imageUrl?: string;
  specs: VehicleSpec[];
  assemblyZones: AssemblyZone[];
  modificationRestrictions: ModificationRestriction[];
  regulationNotes: RegulationNote[];
  diagrams: DiagramConfig[];
  compatiblePartCategories: string[];
  streetLegalStatus: 'legal' | 'conditional' | 'off_road_only';
  warrantyNotes?: string;
  maintenanceSchedule?: {
    intervalKm: number;
    items: string[];
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DataStore {
  profiles: VehicleModelProfile[];
}

function loadData(): DataStore {
  const filePath = path.resolve(__dirname, '../../data/vehicle-profiles.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: DataStore) {
  const filePath = path.resolve(__dirname, '../../data/vehicle-profiles.json');
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function toSummary(profile: VehicleModelProfile) {
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
    specsCount: profile.specs.length,
    zonesCount: profile.assemblyZones.length,
    restrictionsCount: profile.modificationRestrictions.length,
    regulationsCount: profile.regulationNotes.length,
    diagramsCount: profile.diagrams.length,
    streetLegalStatus: profile.streetLegalStatus,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

router.get('/api/vehicle-profiles', (ctx) => {
  const data = loadData();
  const { modelId, year, status, keyword } = ctx.query as any;
  
  let profiles = data.profiles;
  
  if (modelId) {
    profiles = profiles.filter((p) => p.modelId === modelId);
  }
  if (year) {
    profiles = profiles.filter((p) => p.year === Number(year));
  }
  if (status === 'active') {
    profiles = profiles.filter((p) => p.isActive);
  } else if (status === 'inactive') {
    profiles = profiles.filter((p) => !p.isActive);
  }
  if (keyword) {
    const q = String(keyword).toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.modelName.toLowerCase().includes(q) ||
        p.modelNameEn.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  
  const summaries = profiles.map(toSummary);
  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  ctx.body = summaries;
});

router.get('/api/vehicle-profiles/:id', (ctx) => {
  const data = loadData();
  const profile = data.profiles.find((p) => p.id === ctx.params.id);
  
  if (profile) {
    ctx.body = profile;
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
  }
});

router.get('/api/vehicle-profiles/model/:modelId', (ctx) => {
  const data = loadData();
  const profiles = data.profiles.filter((p) => p.modelId === ctx.params.modelId && p.isActive);
  
  if (profiles.length > 0) {
    ctx.body = profiles.map(toSummary);
  } else {
    ctx.status = 404;
    ctx.body = { error: 'No profiles found for this model' };
  }
});

router.post('/api/vehicle-profiles', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  
  const now = new Date().toISOString();
  
  const specs = (body.specs || []).map((s: any) => ({
    ...s,
    id: genId('spec'),
  }));
  
  const assemblyZones = (body.assemblyZones || []).map((z: any) => ({
    ...z,
    id: genId('zone'),
  }));
  
  const modificationRestrictions = (body.modificationRestrictions || []).map((r: any) => ({
    ...r,
    id: genId('restrict'),
    createdAt: now,
    updatedAt: now,
  }));
  
  const regulationNotes = (body.regulationNotes || []).map((n: any) => ({
    ...n,
    id: genId('note'),
    createdAt: now,
    updatedAt: now,
  }));
  
  const diagrams = (body.diagrams || []).map((d: any) => ({
    ...d,
    id: genId('diagram'),
    hotspots: (d.hotspots || []).map((h: any) => ({
      ...h,
      id: h.id || genId('hotspot'),
    })),
    createdAt: now,
    updatedAt: now,
  }));
  
  const newProfile: VehicleModelProfile = {
    id: body.id || genId('profile'),
    modelId: body.modelId,
    modelName: body.modelName,
    modelNameEn: body.modelNameEn,
    year: Number(body.year) || new Date().getFullYear(),
    trimLevel: body.trimLevel,
    basePrice: Number(body.basePrice) || 0,
    description: body.description || '',
    imageUrl: body.imageUrl,
    specs,
    assemblyZones,
    modificationRestrictions,
    regulationNotes,
    diagrams,
    compatiblePartCategories: body.compatiblePartCategories || [],
    streetLegalStatus: body.streetLegalStatus || 'conditional',
    warrantyNotes: body.warrantyNotes,
    maintenanceSchedule: body.maintenanceSchedule,
    isActive: body.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };
  
  data.profiles.push(newProfile);
  saveData(data);
  ctx.body = newProfile;
});

router.put('/api/vehicle-profiles/:id', (ctx) => {
  const data = loadData();
  const idx = data.profiles.findIndex((p) => p.id === ctx.params.id);
  
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }
  
  const body = ctx.request.body as any;
  const oldProfile = data.profiles[idx];
  const now = new Date().toISOString();
  
  const updated = {
    ...oldProfile,
    ...body,
    basePrice: body.basePrice !== undefined ? Number(body.basePrice) : oldProfile.basePrice,
    year: body.year !== undefined ? Number(body.year) : oldProfile.year,
    updatedAt: now,
  };
  
  if (body.specs) {
    updated.specs = body.specs.map((s: any) => ({
      ...s,
      id: s.id || genId('spec'),
    }));
  }
  
  if (body.assemblyZones) {
    updated.assemblyZones = body.assemblyZones.map((z: any) => ({
      ...z,
      id: z.id || genId('zone'),
    }));
  }
  
  if (body.modificationRestrictions) {
    updated.modificationRestrictions = body.modificationRestrictions.map((r: any) => ({
      ...r,
      id: r.id || genId('restrict'),
      createdAt: r.createdAt || now,
      updatedAt: now,
    }));
  }
  
  if (body.regulationNotes) {
    updated.regulationNotes = body.regulationNotes.map((n: any) => ({
      ...n,
      id: n.id || genId('note'),
      createdAt: n.createdAt || now,
      updatedAt: now,
    }));
  }
  
  if (body.diagrams) {
    updated.diagrams = body.diagrams.map((d: any) => ({
      ...d,
      id: d.id || genId('diagram'),
      hotspots: (d.hotspots || []).map((h: any) => ({
        ...h,
        id: h.id || genId('hotspot'),
      })),
      createdAt: d.createdAt || now,
      updatedAt: now,
    }));
  }
  
  data.profiles[idx] = updated;
  saveData(data);
  ctx.body = updated;
});

router.delete('/api/vehicle-profiles/:id', (ctx) => {
  const data = loadData();
  const idx = data.profiles.findIndex((p) => p.id === ctx.params.id);
  
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }
  
  const [removed] = data.profiles.splice(idx, 1);
  saveData(data);
  ctx.body = { success: true, removed };
});

router.patch('/api/vehicle-profiles/:id/status', (ctx) => {
  const data = loadData();
  const idx = data.profiles.findIndex((p) => p.id === ctx.params.id);
  
  if (idx === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Profile not found' };
    return;
  }
  
  const body = ctx.request.body as any;
  data.profiles[idx] = {
    ...data.profiles[idx],
    isActive: body.isActive,
    updatedAt: new Date().toISOString(),
  };
  
  saveData(data);
  ctx.body = data.profiles[idx];
});

router.get('/api/vehicle-profiles/:modelId/restrictions', (ctx) => {
  const data = loadData();
  const profiles = data.profiles.filter((p) => p.modelId === ctx.params.modelId && p.isActive);
  
  if (profiles.length === 0) {
    ctx.status = 404;
    ctx.body = { error: 'No profiles found for this model' };
    return;
  }
  
  const allRestrictions = profiles.flatMap((p) => p.modificationRestrictions.filter((r) => r.isActive));
  ctx.body = allRestrictions;
});

router.get('/api/vehicle-profiles/:modelId/regulations', (ctx) => {
  const data = loadData();
  const profiles = data.profiles.filter((p) => p.modelId === ctx.params.modelId && p.isActive);
  
  if (profiles.length === 0) {
    ctx.status = 404;
    ctx.body = { error: 'No profiles found for this model' };
    return;
  }
  
  const allNotes = profiles.flatMap((p) => p.regulationNotes.filter((n) => n.isActive));
  ctx.body = allNotes;
});

router.get('/api/vehicle-profiles/:modelId/zones', (ctx) => {
  const data = loadData();
  const profiles = data.profiles.filter((p) => p.modelId === ctx.params.modelId && p.isActive);
  
  if (profiles.length === 0) {
    ctx.status = 404;
    ctx.body = { error: 'No profiles found for this model' };
    return;
  }
  
  const allZones = profiles.flatMap((p) => p.assemblyZones.filter((z) => z.isActive));
  ctx.body = allZones;
});

export const vehicleProfilesRoutes = router;
