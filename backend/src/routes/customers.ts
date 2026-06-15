import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/customers.json');

function loadData() {
  const raw = readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

router.get('/api/customers', (ctx) => {
  const data = loadData();
  const { keyword, level, source, phone } = ctx.query;

  let customers = data.customers;

  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    customers = customers.filter((c: any) =>
      c.name.toLowerCase().includes(kw) ||
      c.phone.includes(kw) ||
      (c.contact && c.contact.toLowerCase().includes(kw))
    );
  }
  if (level) {
    customers = customers.filter((c: any) => c.level === level);
  }
  if (source) {
    customers = customers.filter((c: any) => c.source === source);
  }
  if (phone) {
    customers = customers.filter((c: any) => c.phone.includes(phone as string));
  }

  customers = customers.sort((a: any, b: any) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  ctx.body = customers;
});

router.get('/api/customers/:id', (ctx) => {
  const data = loadData();
  const customer = data.customers.find((c: any) => c.id === ctx.params.id);
  if (!customer) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }
  ctx.body = customer;
});

router.post('/api/customers', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const now = new Date().toISOString();

  const customerId = generateId('cust');
  const customer: any = {
    id: customerId,
    name: body.name,
    phone: body.phone,
    contact: body.contact || body.name,
    email: body.email || '',
    gender: body.gender || undefined,
    birthday: body.birthday || undefined,
    address: body.address || '',
    level: body.level || 'normal',
    source: body.source || 'walk_in',
    sourceRemark: body.sourceRemark || '',
    tags: body.tags || [],
    remark: body.remark || '',
    vehicles: [],
    totalSpent: 0,
    totalVisits: 1,
    lastVisitAt: now,
    createdBy: body.createdBy || 'system',
    createdAt: now,
    updatedAt: now,
  };

  if (body.vehicle) {
    const vehicleId = generateId('veh');
    customer.vehicles.push({
      id: vehicleId,
      customerId,
      licensePlate: body.vehicle.licensePlate,
      modelId: body.vehicle.modelId,
      modelName: body.vehicle.modelName,
      vin: body.vehicle.vin || '',
      mileage: body.vehicle.mileage || 0,
      purchaseDate: body.vehicle.purchaseDate || undefined,
      lastServiceDate: body.vehicle.lastServiceDate || undefined,
      color: body.vehicle.color || '',
      remark: body.vehicle.remark || '',
      createdAt: now,
      updatedAt: now,
    });
  }

  data.customers.push(customer);
  saveData(data);
  ctx.body = customer;
});

router.put('/api/customers/:id', (ctx) => {
  const data = loadData();
  const index = data.customers.findIndex((c: any) => c.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }

  const body = ctx.request.body as any;
  const customer = data.customers[index];
  data.customers[index] = {
    ...customer,
    ...body,
    id: customer.id,
    vehicles: customer.vehicles,
    totalSpent: customer.totalSpent,
    totalVisits: customer.totalVisits,
    createdAt: customer.createdAt,
    updatedAt: new Date().toISOString(),
  };

  saveData(data);
  ctx.body = data.customers[index];
});

router.delete('/api/customers/:id', (ctx) => {
  const data = loadData();
  const index = data.customers.findIndex((c: any) => c.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }
  data.customers.splice(index, 1);
  saveData(data);
  ctx.body = { success: true };
});

router.post('/api/customers/:id/vehicles', (ctx) => {
  const data = loadData();
  const customer = data.customers.find((c: any) => c.id === ctx.params.id);
  if (!customer) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }

  const body = ctx.request.body as any;
  const now = new Date().toISOString();
  const vehicle: any = {
    id: generateId('veh'),
    customerId: customer.id,
    licensePlate: body.licensePlate,
    modelId: body.modelId,
    modelName: body.modelName,
    vin: body.vin || '',
    mileage: body.mileage || 0,
    purchaseDate: body.purchaseDate || undefined,
    lastServiceDate: body.lastServiceDate || undefined,
    color: body.color || '',
    remark: body.remark || '',
    createdAt: now,
    updatedAt: now,
  };

  customer.vehicles.push(vehicle);
  customer.updatedAt = now;
  saveData(data);
  ctx.body = vehicle;
});

router.put('/api/customers/:customerId/vehicles/:vehicleId', (ctx) => {
  const data = loadData();
  const customer = data.customers.find((c: any) => c.id === ctx.params.customerId);
  if (!customer) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }

  const vIndex = customer.vehicles.findIndex((v: any) => v.id === ctx.params.vehicleId);
  if (vIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Vehicle not found' };
    return;
  }

  const body = ctx.request.body as any;
  const now = new Date().toISOString();
  customer.vehicles[vIndex] = {
    ...customer.vehicles[vIndex],
    ...body,
    id: customer.vehicles[vIndex].id,
    customerId: customer.id,
    createdAt: customer.vehicles[vIndex].createdAt,
    updatedAt: now,
  };
  customer.updatedAt = now;
  saveData(data);
  ctx.body = customer.vehicles[vIndex];
});

router.delete('/api/customers/:customerId/vehicles/:vehicleId', (ctx) => {
  const data = loadData();
  const customer = data.customers.find((c: any) => c.id === ctx.params.customerId);
  if (!customer) {
    ctx.status = 404;
    ctx.body = { error: 'Customer not found' };
    return;
  }

  const vIndex = customer.vehicles.findIndex((v: any) => v.id === ctx.params.vehicleId);
  if (vIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Vehicle not found' };
    return;
  }

  customer.vehicles.splice(vIndex, 1);
  customer.updatedAt = new Date().toISOString();
  saveData(data);
  ctx.body = { success: true };
});

export const customersRoutes = router;
