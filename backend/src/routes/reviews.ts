import Router from 'koa-router';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router({ prefix: '/api/reviews' });

interface ReviewData {
  id: string;
  partId: string;
  partName: string;
  orderId?: string;
  userId: string;
  username: string;
  avatar?: string;
  title: string;
  content: string;
  overallRating: number;
  fitRating: {
    overall: number;
    dimensions: number;
    quality: number;
    compatibility: number;
    durability: number;
  };
  installationFeedback?: {
    difficulty: string;
    installTime: string;
    toolsRequired: string[];
    tips?: string;
    issuesEncountered?: string;
  };
  images: string[];
  tags: string[];
  bikeModel?: string;
  mileage?: number;
  usageMonths?: number;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  helpfulUsers: string[];
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

interface IssueData {
  id: string;
  reviewId: string;
  partId: string;
  partName: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  category: 'quality' | 'compatibility' | 'installation' | 'durability' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  assigneeName?: string;
  rating?: number;
  images: string[];
  processHistory: {
    id: string;
    status: string;
    comment: string;
    createdBy: string;
    createdAt: string;
  }[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WarningData {
  id: string;
  partId: string;
  partName: string;
  warningLevel: 'info' | 'warning' | 'danger';
  warningType: 'low_rating' | 'high_issue_rate' | 'quality_complaints' | 'compatibility_issues';
  title: string;
  description: string;
  affectedReviews: number;
  affectedIssues: number;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DataStore {
  reviews: ReviewData[];
  issues: IssueData[];
  warnings: WarningData[];
  parts: any[];
}

function loadData(): DataStore {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!data.reviews) data.reviews = [];
  if (!data.issues) data.issues = [];
  if (!data.warnings) data.warnings = [];
  if (!data.parts) data.parts = [];
  return data;
}

function saveData(data: DataStore) {
  const filePath = path.resolve(__dirname, '../../data/parts.json');
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function calculateReviewStats(partId: string, reviews: ReviewData[]) {
  const partReviews = reviews.filter(r => r.partId === partId && r.status === 'approved');
  
  if (partReviews.length === 0) {
    return {
      partId,
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageFitRating: {
        overall: 0,
        dimensions: 0,
        quality: 0,
        compatibility: 0,
        durability: 0,
      },
      installationStats: {
        difficultyDistribution: {},
        averageInstallTime: '0',
      },
      commonTags: [],
      verifiedReviewsCount: 0,
      responseRate: 0,
    };
  }

  const totalReviews = partReviews.length;
  const averageRating = partReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
  
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  partReviews.forEach(r => {
    ratingDistribution[r.overallRating] = (ratingDistribution[r.overallRating] || 0) + 1;
  });

  const fitRatings = partReviews
    .filter(r => r.fitRating)
    .reduce((acc, r) => {
      acc.overall += r.fitRating.overall;
      acc.dimensions += r.fitRating.dimensions;
      acc.quality += r.fitRating.quality;
      acc.compatibility += r.fitRating.compatibility;
      acc.durability += r.fitRating.durability;
      acc.count += 1;
      return acc;
    }, { overall: 0, dimensions: 0, quality: 0, compatibility: 0, durability: 0, count: 0 });

  const count = fitRatings.count || 1;
  const averageFitRating = {
    overall: Math.round((fitRatings.overall / count) * 10) / 10,
    dimensions: Math.round((fitRatings.dimensions / count) * 10) / 10,
    quality: Math.round((fitRatings.quality / count) * 10) / 10,
    compatibility: Math.round((fitRatings.compatibility / count) * 10) / 10,
    durability: Math.round((fitRatings.durability / count) * 10) / 10,
  };

  const installationFeedback = partReviews.filter(r => r.installationFeedback);
  const difficultyDistribution: Record<string, number> = {};
  let totalInstallTime = 0;
  installationFeedback.forEach(r => {
    const diff = r.installationFeedback!.difficulty;
    difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
    const timeMatch = r.installationFeedback!.installTime.match(/(\d+(\.\d+)?)/);
    if (timeMatch) {
      totalInstallTime += parseFloat(timeMatch[1]);
    }
  });

  const averageInstallTime = installationFeedback.length > 0 
    ? `${Math.round(totalInstallTime / installationFeedback.length * 10) / 10}小时`
    : '0';

  const tagCounts: Record<string, number> = {};
  partReviews.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const commonTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const verifiedReviewsCount = partReviews.filter(r => r.isVerified).length;
  const responseRate = partReviews.filter(r => r.response).length / totalReviews;

  return {
    partId,
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    averageFitRating,
    installationStats: {
      difficultyDistribution,
      averageInstallTime,
    },
    commonTags,
    verifiedReviewsCount,
    responseRate: Math.round(responseRate * 100),
  };
}

function checkAndCreateWarnings(partId: string, reviews: ReviewData[], issues: IssueData[], parts: any[], warnings: WarningData[]) {
  const part = parts.find(p => p.id === partId);
  if (!part) return;

  const partName = part.name;
  const approvedReviews = reviews.filter(r => r.partId === partId && r.status === 'approved');
  const partIssues = issues.filter(i => i.partId === partId && i.status !== 'closed');
  
  const newWarnings: WarningData[] = [];

  if (approvedReviews.length >= 3) {
    const avgRating = approvedReviews.reduce((sum, r) => sum + r.overallRating, 0) / approvedReviews.length;
    if (avgRating < 2.5) {
      const existingWarning = warnings.find(w => 
        w.partId === partId && 
        w.warningType === 'low_rating' && 
        w.isActive
      );
      if (!existingWarning) {
        newWarnings.push({
          id: genId('warn'),
          partId,
          partName,
          warningLevel: avgRating < 2.0 ? 'danger' : 'warning',
          warningType: 'low_rating',
          title: `低评分预警：平均评分${avgRating.toFixed(2)}分`,
          description: `该配件的用户平均评分为${avgRating.toFixed(2)}分（共${approvedReviews.length}条有效评价），低于系统阈值2.5分。存在显著的用户满意度问题。`,
          affectedReviews: approvedReviews.length,
          affectedIssues: partIssues.length,
          threshold: 2.5,
          currentValue: Math.round(avgRating * 100) / 100,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  const recentIssues = partIssues.filter(i => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return new Date(i.createdAt).getTime() > thirtyDaysAgo;
  });

  const qualityIssues = recentIssues.filter(i => i.category === 'quality');
  if (qualityIssues.length >= 1) {
    const existingWarning = warnings.find(w => 
      w.partId === partId && 
      w.warningType === 'quality_complaints' && 
      w.isActive
    );
    if (!existingWarning) {
      newWarnings.push({
        id: genId('warn'),
        partId,
        partName,
        warningLevel: qualityIssues.some(i => i.priority === 'urgent' || i.priority === 'high') ? 'danger' : 'warning',
        warningType: 'quality_complaints',
        title: `质量投诉预警：${qualityIssues.length}起质量问题`,
        description: `该配件在近期30天内出现${qualityIssues.length}起质量问题投诉。建议启动质量调查。`,
        affectedReviews: approvedReviews.filter(r => r.content.includes('质量') || r.tags.some(t => t.includes('质量'))).length,
        affectedIssues: qualityIssues.length,
        threshold: 1,
        currentValue: qualityIssues.length,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const compatibilityIssues = recentIssues.filter(i => i.category === 'compatibility');
  if (compatibilityIssues.length >= 2) {
    const existingWarning = warnings.find(w => 
      w.partId === partId && 
      w.warningType === 'compatibility_issues' && 
      w.isActive
    );
    if (!existingWarning) {
      newWarnings.push({
        id: genId('warn'),
        partId,
        partName,
        warningLevel: 'warning',
        warningType: 'compatibility_issues',
        title: `适配问题预警：${compatibilityIssues.length}起适配投诉`,
        description: `该配件近期出现${compatibilityIssues.length}起适配问题反馈，建议更新适配说明或联系厂家优化。`,
        affectedReviews: approvedReviews.filter(r => r.content.includes('适配') || r.tags.some(t => t.includes('适配'))).length,
        affectedIssues: compatibilityIssues.length,
        threshold: 2,
        currentValue: compatibilityIssues.length,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return newWarnings;
}

router.get('/parts/:partId', (ctx) => {
  const data = loadData();
  const { partId } = ctx.params;
  const { status, page = '1', pageSize = '10', sortBy = 'createdAt' } = ctx.query as any;
  
  let partReviews = data.reviews.filter(r => r.partId === partId);
  
  if (status) {
    partReviews = partReviews.filter(r => r.status === status);
  } else {
    partReviews = partReviews.filter(r => r.status === 'approved');
  }

  partReviews.sort((a, b) => {
    if (sortBy === 'helpful') {
      return b.helpfulCount - a.helpfulCount;
    } else if (sortBy === 'rating') {
      return b.overallRating - a.overallRating;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const startIndex = (pageNum - 1) * pageSizeNum;
  const paginatedReviews = partReviews.slice(startIndex, startIndex + pageSizeNum);

  const stats = calculateReviewStats(partId, data.reviews);

  ctx.body = {
    reviews: paginatedReviews,
    total: partReviews.length,
    page: pageNum,
    pageSize: pageSizeNum,
    stats,
  };
});

router.get('/stats/:partId', (ctx) => {
  const data = loadData();
  const { partId } = ctx.params;
  const stats = calculateReviewStats(partId, data.reviews);
  ctx.body = stats;
});

router.post('/', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;
  
  const part = data.parts.find(p => p.id === body.partId);
  if (!part) {
    ctx.status = 404;
    ctx.body = { error: '配件不存在' };
    return;
  }

  const newReview: ReviewData = {
    id: genId('rev'),
    partId: body.partId,
    partName: part.name,
    orderId: body.orderId,
    userId: body.userId || 'user-guest',
    username: body.username || '匿名用户',
    avatar: body.avatar || '',
    title: body.title,
    content: body.content,
    overallRating: body.overallRating,
    fitRating: body.fitRating,
    installationFeedback: body.installationFeedback,
    images: body.images || [],
    tags: body.tags || [],
    bikeModel: body.bikeModel,
    mileage: body.mileage,
    usageMonths: body.usageMonths,
    status: 'pending',
    helpfulCount: 0,
    helpfulUsers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: !!body.orderId,
  };

  data.reviews.push(newReview);
  saveData(data);

  ctx.body = newReview;
});

router.post('/:reviewId/helpful', (ctx) => {
  const data = loadData();
  const { reviewId } = ctx.params;
  const body = ctx.request.body as any;
  const userId = body.userId || 'guest';

  const reviewIndex = data.reviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: '评价不存在' };
    return;
  }

  const review = data.reviews[reviewIndex];
  
  if (review.helpfulUsers.includes(userId)) {
    review.helpfulUsers = review.helpfulUsers.filter(u => u !== userId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulUsers.push(userId);
    review.helpfulCount += 1;
  }

  review.updatedAt = new Date().toISOString();
  data.reviews[reviewIndex] = review;
  saveData(data);

  ctx.body = { helpful: !review.helpfulUsers.includes(userId), helpfulCount: review.helpfulCount };
});

router.get('/admin/list', (ctx) => {
  const data = loadData();
  const { status, partId, page = '1', pageSize = '20' } = ctx.query as any;
  
  let reviews = [...data.reviews];
  
  if (status) {
    reviews = reviews.filter(r => r.status === status);
  }
  if (partId) {
    reviews = reviews.filter(r => r.partId === partId);
  }

  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const startIndex = (pageNum - 1) * pageSizeNum;
  const paginatedReviews = reviews.slice(startIndex, startIndex + pageSizeNum);

  ctx.body = {
    reviews: paginatedReviews,
    total: reviews.length,
    page: pageNum,
    pageSize: pageSizeNum,
  };
});

router.post('/admin/:reviewId/process', (ctx) => {
  const data = loadData();
  const { reviewId } = ctx.params;
  const body = ctx.request.body as any;

  const reviewIndex = data.reviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: '评价不存在' };
    return;
  }

  const review = data.reviews[reviewIndex];
  review.status = body.status;
  if (body.response) {
    review.response = body.response;
    review.respondedBy = body.processedBy;
    review.respondedAt = new Date().toISOString();
  }
  review.updatedAt = new Date().toISOString();

  data.reviews[reviewIndex] = review;

  if (body.status === 'approved' && (review.overallRating <= 2 || review.content.includes('问题') || review.content.includes('坏') || review.content.includes('漏'))) {
    const existingIssue = data.issues.find(i => i.reviewId === reviewId);
    if (!existingIssue) {
      const categoryMap: Record<string, IssueData['category']> = {
        '质量': 'quality',
        '适配': 'compatibility',
        '安装': 'installation',
        '耐用': 'durability',
      };
      
      let category: IssueData['category'] = 'other';
      for (const [key, value] of Object.entries(categoryMap)) {
        if (review.content.includes(key) || review.tags.some(t => t.includes(key))) {
          category = value;
          break;
        }
      }

      const priority: IssueData['priority'] = review.overallRating <= 1 ? 'urgent' : review.overallRating <= 2 ? 'high' : 'medium';

      const newIssue: IssueData = {
        id: genId('issue'),
        reviewId: review.id,
        partId: review.partId,
        partName: review.partName,
        userId: review.userId,
        username: review.username,
        title: review.title,
        description: review.content,
        category,
        priority,
        status: 'open',
        rating: review.overallRating,
        images: review.images,
        processHistory: [{
          id: genId('hist'),
          status: 'open',
          comment: '系统自动根据差评创建问题工单',
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.issues.push(newIssue);
    }
  }

  saveData(data);

  const newWarnings = checkAndCreateWarnings(review.partId, data.reviews, data.issues, data.parts, data.warnings);
  if (newWarnings && newWarnings.length > 0) {
    data.warnings.push(...newWarnings);
    saveData(data);
  }

  ctx.body = review;
});

router.get('/issues', (ctx) => {
  const data = loadData();
  const { status, priority, partId, category, page = '1', pageSize = '20' } = ctx.query as any;
  
  let issues = [...data.issues];
  
  if (status) issues = issues.filter(i => i.status === status);
  if (priority) issues = issues.filter(i => i.priority === priority);
  if (partId) issues = issues.filter(i => i.partId === partId);
  if (category) issues = issues.filter(i => i.category === category);

  issues.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { open: 0, investigating: 1, resolved: 2, closed: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const startIndex = (pageNum - 1) * pageSizeNum;
  const paginatedIssues = issues.slice(startIndex, startIndex + pageSizeNum);

  ctx.body = {
    issues: paginatedIssues,
    total: issues.length,
    page: pageNum,
    pageSize: pageSizeNum,
  };
});

router.post('/issues', (ctx) => {
  const data = loadData();
  const body = ctx.request.body as any;

  const review = data.reviews.find(r => r.id === body.reviewId);
  if (!review) {
    ctx.status = 404;
    ctx.body = { error: '评价不存在' };
    return;
  }

  const newIssue: IssueData = {
    id: genId('issue'),
    reviewId: body.reviewId,
    partId: review.partId,
    partName: review.partName,
    userId: review.userId,
    username: review.username,
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    status: 'open',
    rating: review?.overallRating,
    images: body.images || [],
    processHistory: [{
      id: genId('hist'),
      status: 'open',
      comment: '手动创建问题工单',
      createdBy: body.createdBy || 'admin',
      createdAt: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.issues.push(newIssue);
  saveData(data);

  const newWarnings = checkAndCreateWarnings(review.partId, data.reviews, data.issues, data.parts, data.warnings);
  if (newWarnings && newWarnings.length > 0) {
    data.warnings.push(...newWarnings);
    saveData(data);
  }

  ctx.body = newIssue;
});

router.put('/issues/:issueId/status', (ctx) => {
  const data = loadData();
  const { issueId } = ctx.params;
  const body = ctx.request.body as any;

  const issueIndex = data.issues.findIndex(i => i.id === issueId);
  if (issueIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: '问题不存在' };
    return;
  }

  const issue = data.issues[issueIndex];
  const oldStatus = issue.status;
  issue.status = body.status;
  if (body.assignedTo) {
    issue.assignedTo = body.assignedTo;
    issue.assigneeName = body.assigneeName;
  }
  if (body.resolution) {
    issue.resolution = body.resolution;
  }
  if (body.status === 'resolved') {
    issue.resolvedAt = new Date().toISOString();
  }
  issue.updatedAt = new Date().toISOString();

  issue.processHistory.push({
    id: genId('hist'),
    status: body.status,
    comment: body.comment,
    createdBy: body.updatedBy,
    createdAt: new Date().toISOString(),
  });

  data.issues[issueIndex] = issue;
  saveData(data);

  ctx.body = issue;
});

router.get('/warnings', (ctx) => {
  const data = loadData();
  const { isActive, warningLevel, partId, page = '1', pageSize = '20' } = ctx.query as any;
  
  let warnings = [...data.warnings];
  
  if (isActive !== undefined) {
    warnings = warnings.filter(w => w.isActive === (isActive === 'true'));
  }
  if (warningLevel) {
    warnings = warnings.filter(w => w.warningLevel === warningLevel);
  }
  if (partId) {
    warnings = warnings.filter(w => w.partId === partId);
  }

  warnings.sort((a, b) => {
    const levelOrder: Record<string, number> = { danger: 0, warning: 1 };
    const levelDiff = (levelOrder[a.warningLevel] ?? 99) - (levelOrder[b.warningLevel] ?? 99);
    if (levelDiff !== 0) return levelDiff;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const startIndex = (pageNum - 1) * pageSizeNum;
  const paginatedWarnings = warnings.slice(startIndex, startIndex + pageSizeNum);

  const summary = {
    total: warnings.length,
    active: warnings.filter(w => w.isActive).length,
    danger: warnings.filter(w => w.isActive && w.warningLevel === 'danger').length,
    warning: warnings.filter(w => w.isActive && w.warningLevel === 'warning').length,
    unacknowledged: warnings.filter(w => w.isActive && !w.acknowledgedBy).length,
  };

  ctx.body = {
    warnings: paginatedWarnings,
    total: warnings.length,
    page: pageNum,
    pageSize: pageSizeNum,
    summary,
  };
});

router.put('/warnings/:warningId/acknowledge', (ctx) => {
  const data = loadData();
  const { warningId } = ctx.params;
  const body = ctx.request.body as any;

  const warningIndex = data.warnings.findIndex(w => w.id === warningId);
  if (warningIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: '预警不存在' };
    return;
  }

  const warning = data.warnings[warningIndex];
  warning.acknowledgedBy = body.acknowledgedBy;
  warning.acknowledgedAt = new Date().toISOString();
  if (body.resolution) {
    warning.resolution = body.resolution;
    warning.isActive = false;
    warning.resolvedAt = new Date().toISOString();
  }
  warning.updatedAt = new Date().toISOString();

  data.warnings[warningIndex] = warning;
  saveData(data);

  ctx.body = warning;
});

router.delete('/warnings/:warningId', (ctx) => {
  const data = loadData();
  const { warningId } = ctx.params;

  const warningIndex = data.warnings.findIndex(w => w.id === warningId);
  if (warningIndex === -1) {
    ctx.status = 404;
    ctx.body = { error: '预警不存在' };
    return;
  }

  const [removed] = data.warnings.splice(warningIndex, 1);
  saveData(data);

  ctx.body = { success: true, removed };
});

export const reviewsRoutes = router;
