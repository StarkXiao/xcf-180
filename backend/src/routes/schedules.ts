import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const dataPath = path.resolve(__dirname, '../../data/schedules.json');

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

function calculateProgress(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function calculateTotalHours(tasks: any[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
}

function calculateActualHours(tasks: any[]): number {
  return tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
}

function determineScheduleStatus(tasks: any[], plannedEndDate: string): string {
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;

  if (completedCount === tasks.length) return 'completed';
  if (blockedCount > 0) return 'delayed';
  if (inProgressCount > 0 || completedCount > 0) return 'in_progress';
  return 'scheduled';
}

router.get('/api/schedules', (ctx) => {
  const data = loadData();
  const { customerId, status, date } = ctx.query;

  let schedules = data.schedules;

  if (customerId) {
    schedules = schedules.filter((s: any) => s.customerId === customerId);
  }
  if (status) {
    schedules = schedules.filter((s: any) => s.status === status);
  }
  if (date) {
    const d = date as string;
    schedules = schedules.filter((s: any) =>
      s.plannedStartDate <= d && s.plannedEndDate >= d
    );
  }

  schedules = schedules.sort((a: any, b: any) =>
    new Date(b.plannedStartDate).getTime() - new Date(a.plannedStartDate).getTime()
  );

  ctx.body = schedules;
});

router.get('/api/schedules/:id', (ctx) => {
  const data = loadData();
  const schedule = data.schedules.find((s: any) => s.id === ctx.params.id);
  if (!schedule) {
    ctx.status = 404;
    ctx.body = { error: 'Schedule not found' };
    return;
  }
  ctx.body = schedule;
});

router.post('/api/schedules', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  const now = new Date().toISOString();

  const tasks = (body.tasks || []).map((task: any) => ({
    id: generateId('task'),
    phase: task.phase,
    name: task.name,
    description: task.description || '',
    assignee: task.assignee,
    estimatedHours: task.estimatedHours || 2,
    actualHours: task.actualHours,
    status: task.status || 'pending',
    startAt: task.startAt,
    endAt: task.endAt,
    actualStartAt: task.actualStartAt,
    actualEndAt: task.actualEndAt,
    remark: task.remark || '',
    dependencies: task.dependencies || [],
  }));

  const schedule: any = {
    id: generateId('sch'),
    orderId: body.orderId,
    quoteId: body.quoteId,
    customerId: body.customerId,
    customerName: body.customerName,
    vehicleId: body.vehicleId,
    vehicleInfo: body.vehicleInfo || '',
    tasks,
    plannedStartDate: body.plannedStartDate,
    plannedEndDate: body.plannedEndDate,
    actualStartDate: tasks.some((t) => t.actualStartAt) ? now : undefined,
    actualEndDate: undefined,
    totalEstimatedHours: calculateTotalHours(tasks),
    totalActualHours: calculateActualHours(tasks),
    progress: calculateProgress(tasks),
    status: determineScheduleStatus(tasks, body.plannedEndDate),
    createdBy: body.createdBy || 'system',
    createdAt: now,
    updatedAt: now,
    remark: body.remark || '',
  };

  data.schedules.push(schedule);
  saveData(data);
  ctx.body = schedule;
});

router.put('/api/schedules/:id', (ctx) => {
  const data = loadData();
  const index = data.schedules.findIndex((s: any) => s.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Schedule not found' };
    return;
  }

  const body = ctx.request.body as any;
  const schedule = data.schedules[index];

  let tasks = schedule.tasks;
  if (body.tasks) {
    tasks = body.tasks.map((task: any) => ({
      id: task.id || generateId('task'),
      phase: task.phase,
      name: task.name,
      description: task.description || '',
      assignee: task.assignee,
      estimatedHours: task.estimatedHours || 2,
      actualHours: task.actualHours,
      status: task.status || 'pending',
      startAt: task.startAt,
      endAt: task.endAt,
      actualStartAt: task.actualStartAt,
      actualEndAt: task.actualEndAt,
      remark: task.remark || '',
      dependencies: task.dependencies || [],
    }));
  }

  const progress = calculateProgress(tasks);
  const status = body.status || determineScheduleStatus(tasks, body.plannedEndDate || schedule.plannedEndDate);

  data.schedules[index] = {
    ...schedule,
    ...body,
    id: schedule.id,
    tasks,
    totalEstimatedHours: calculateTotalHours(tasks),
    totalActualHours: calculateActualHours(tasks),
    progress,
    status,
    actualEndDate: progress === 100 ? new Date().toISOString() : schedule.actualEndDate,
    createdAt: schedule.createdAt,
    updatedAt: new Date().toISOString(),
  };

  saveData(data);
  ctx.body = data.schedules[index];
});

router.delete('/api/schedules/:id', (ctx) => {
  const data = loadData();
  const index = data.schedules.findIndex((s: any) => s.id === ctx.params.id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Schedule not found' };
    return;
  }
  data.schedules.splice(index, 1);
  saveData(data);
  ctx.body = { success: true };
});

router.put('/api/schedules/:scheduleId/tasks/:taskId', (ctx) => {
  const data = loadData();
  const schedule = data.schedules.find((s: any) => s.id === ctx.params.scheduleId);
  if (!schedule) {
    ctx.status = 404;
    ctx.body = { error: 'Schedule not found' };
    return;
  }

  const taskIndex = schedule.tasks.findIndex((t: any) => t.id === ctx.params.taskId);
  if (taskIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Task not found' };
    return;
  }

  const body = ctx.request.body as any;
  const now = new Date().toISOString();

  const updatedTask = {
    ...schedule.tasks[taskIndex],
    ...body,
    id: schedule.tasks[taskIndex].id,
  };

  if (body.status === 'in_progress' && !updatedTask.actualStartAt) {
    updatedTask.actualStartAt = now;
  }
  if (body.status === 'completed' && !updatedTask.actualEndAt) {
    updatedTask.actualEndAt = now;
  }

  schedule.tasks[taskIndex] = updatedTask;
  schedule.progress = calculateProgress(schedule.tasks);
  schedule.totalActualHours = calculateActualHours(schedule.tasks);
  schedule.status = determineScheduleStatus(schedule.tasks, schedule.plannedEndDate);
  if (schedule.progress === 100 && !schedule.actualEndDate) {
    schedule.actualEndDate = now;
  }
  if (schedule.progress > 0 && !schedule.actualStartDate) {
    schedule.actualStartDate = now;
  }
  schedule.updatedAt = now;

  saveData(data);
  ctx.body = schedule;
});

export const schedulesRoutes = router;
