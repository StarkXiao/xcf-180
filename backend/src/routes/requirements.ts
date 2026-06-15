import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/requirements.json');
const customersPath = path.resolve(__dirname, '../../data/customers.json');

function loadData() {
  const raw = readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadCustomers() {
  const raw = readFileSync(customersPath, 'utf-8');
  return JSON.parse(raw);
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

router.get('/api/requirements', (ctx) => {
  const data = loadData();
  const { customerId, status, vehicleId } = ctx.query;

  let requirements = data.requirements;

  if (customerId) {
    requirements = requirements.filter((r: any) => r.customerId === customerId);
  }
  if (status) {
    requirements = requirements.filter((r: any) => r.status === status);
  }
  if (vehicleId) {
    requirements = requirements.filter((r: any) => r.vehicleId === vehicleId);
  }

  requirements = requirements.sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  ctx.body = requirements;
});

router.get('/api/requirements/:id', (ctx) => {
  const data = loadData();
  const req = data.requirements.find((r: any) => r.id === ctx.params.id);
  if (!req) {
    ctx.status = 404;
    ctx.body = { error: 'Requirement not found' };
    return;
  }
  ctx.body = req;
});

router.post('/api/requirements', (ctx) => {
  const data = loadData();
  const customersData = loadCustomers();
  const body = ctx.request.body as any;
  const now = new Date().toISOString();

  const customer = customersData.customers.find((c: any) => c.id === body.customerId);
  if (!customer) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }

  const items = (body.items || []).map((item: any) => ({
    id: generateId('item'),
    type: item.type,
    description: item.description,
    priority: item.priority || 'medium',
    budgetRange: item.budgetRange,
    preferredBrands: item.preferredBrands || [],
    remark: item.remark || '',
  }));

  let vehicleInfo = '';
  if (body.vehicleId) {
    const vehicle = customer.vehicles.find((v: any) => v.id === body.vehicleId);
    if (vehicle) {
      vehicleInfo = `${vehicle.licensePlate} / ${vehicle.modelName}`;
    }
  }

  const requirement: any = {
    id: generateId('req'),
    customerId: body.customerId,
    customerName: customer.name,
    vehicleId: body.vehicleId,
    vehicleInfo,
    items,
    overallBudget: body.overallBudget,
    expectedDeliveryDate: body.expectedDeliveryDate,
    stylePreference: body.stylePreference || '',
    usageScenario: body.usageScenario || '',
    specialRequirements: body.specialRequirements || '',
    recordedBy: body.recordedBy || 'system',
    recordedAt: now,
    remark: body.remark || '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  data.requirements.push(requirement);
  saveData(data);
  ctx.body = requirement;
});

router.put('/api/requirements/:id', (ctx) => {
  const data = loadData();
  const index = data.requirements.findIndex((r: any) => r.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Requirement not found' };
    return;
  }

  const body = ctx.request.body as any;
  const req = data.requirements[index];

  let items = req.items;
  if (body.items) {
    items = body.items.map((item: any) => ({
      id: item.id || generateId('item'),
      type: item.type,
      description: item.description,
      priority: item.priority || 'medium',
      budgetRange: item.budgetRange,
      preferredBrands: item.preferredBrands || [],
      remark: item.remark || '',
    }));
  }

  data.requirements[index] = {
    ...req,
    ...body,
    id: req.id,
    items,
    customerId: req.customerId,
    customerName: req.customerName,
    recordedBy: req.recordedBy,
    recordedAt: req.recordedAt,
    createdAt: req.createdAt,
    updatedAt: new Date().toISOString(),
  };

  saveData(data);
  ctx.body = data.requirements[index];
});

router.delete('/api/requirements/:id', (ctx) => {
  const data = loadData();
  const index = data.requirements.findIndex((r: any) => r.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Requirement not found' };
    return;
  }
  data.requirements.splice(index, 1);
  saveData(data);
  ctx.body = { success: true };
});

export const requirementsRoutes = router;
