import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, 'public', 'images', 'parts');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const partDesigns = {
  'exhaust-001': {
    name: '钛合金全段排气',
    category: 'exhaust',
    shapes: [
      { type: 'pipe', x: 30, y: 140, w: 280, h: 28, color: '#c0c0c0', stroke: '#808080' },
      { type: 'pipe', x: 280, y: 120, w: 80, h: 60, color: '#e8e8e8', stroke: '#a0a0a0' },
      { type: 'circle', cx: 350, cy: 150, r: 20, color: '#666', stroke: '#444' },
      { type: 'text', x: 170, y: 150, text: 'TITANIUM', color: '#ff6b35', size: 14 },
    ],
  },
  'exhaust-002': {
    name: '碳纤维尾段排气',
    category: 'exhaust',
    shapes: [
      { type: 'pipe', x: 60, y: 130, w: 240, h: 40, color: '#2a2a2a', stroke: '#1a1a1a' },
      { type: 'pattern', x: 60, y: 130, w: 240, h: 40, color: '#333' },
      { type: 'pipe', x: 280, y: 140, w: 60, h: 20, color: '#555', stroke: '#333' },
      { type: 'text', x: 180, y: 155, text: 'CARBON', color: '#ff6b35', size: 12 },
    ],
  },
  'exhaust-003': {
    name: '不锈钢中段排气',
    category: 'exhaust',
    shapes: [
      { type: 'pipe', x: 40, y: 140, w: 320, h: 24, color: '#b8b8b8', stroke: '#888' },
      { type: 'flange', x: 30, y: 128, w: 16, h: 48, color: '#999' },
      { type: 'flange', x: 354, y: 128, w: 16, h: 48, color: '#999' },
      { type: 'text', x: 200, y: 155, text: 'STAINLESS', color: '#ff6b35', size: 12 },
    ],
  },
  'wheels-001': {
    name: '锻造铝合金前轮毂',
    category: 'wheels',
    shapes: [
      { type: 'ring', cx: 200, cy: 150, r: 110, w: 20, color: '#c8c8c8', stroke: '#888' },
      { type: 'ring', cx: 200, cy: 150, r: 85, w: 8, color: '#a0a0a0', stroke: '#666' },
      { type: 'spokes', cx: 200, cy: 150, r1: 30, r2: 85, color: '#b0b0b0', count: 7 },
      { type: 'circle', cx: 200, cy: 150, r: 25, color: '#888', stroke: '#555' },
    ],
  },
  'wheels-002': {
    name: '高性能运动轮胎',
    category: 'wheels',
    shapes: [
      { type: 'ring', cx: 200, cy: 150, r: 115, w: 35, color: '#1a1a1a', stroke: '#0a0a0a' },
      { type: 'tread', cx: 200, cy: 150, r: 115, w: 35, color: '#2a2a2a' },
      { type: 'ring', cx: 200, cy: 150, r: 78, w: 6, color: '#555', stroke: '#333' },
      { type: 'text', x: 200, y: 155, text: 'SPORT', color: '#ff6b35', size: 16 },
    ],
  },
  'wheels-003': {
    name: '碳纤维轮毂盖',
    category: 'wheels',
    shapes: [
      { type: 'circle', cx: 200, cy: 150, r: 90, color: '#1e1e1e', stroke: '#111' },
      { type: 'cfpattern', cx: 200, cy: 150, r: 88, color: '#282828' },
      { type: 'circle', cx: 200, cy: 150, r: 35, color: '#333', stroke: '#222' },
      { type: 'text', x: 200, y: 155, text: 'CF', color: '#ff6b35', size: 28, bold: true },
    ],
  },
  'handlebar-001': {
    name: '可调节分离式把手',
    category: 'handlebar',
    shapes: [
      { type: 'bar', x1: 50, y1: 100, x2: 150, y2: 140, w: 10, color: '#444' },
      { type: 'bar', x1: 250, y1: 140, x2: 350, y2: 100, w: 10, color: '#444' },
      { type: 'clamp', x: 170, y: 130, w: 60, h: 40, color: '#666' },
      { type: 'grip', x: 30, y: 88, w: 40, h: 24, color: '#222' },
      { type: 'grip', x: 330, y: 88, w: 40, h: 24, color: '#222' },
      { type: 'adjust', x: 185, y: 175, w: 30, h: 15, color: '#ff6b35' },
    ],
  },
  'handlebar-002': {
    name: '快拆油门把手',
    category: 'handlebar',
    shapes: [
      { type: 'bar', x1: 40, y1: 150, x2: 360, y2: 150, w: 12, color: '#555' },
      { type: 'grip', x: 280, y: 130, w: 80, h: 40, color: '#222' },
      { type: 'quickrelease', x: 340, y: 120, w: 24, h: 60, color: '#c0c0c0' },
      { type: 'text', x: 100, y: 155, text: 'QUICK RELEASE', color: '#ff6b35', size: 11 },
    ],
  },
  'handlebar-003': {
    name: '竞技离合拉杆',
    category: 'handlebar',
    shapes: [
      { type: 'lever', x1: 60, y1: 140, x2: 260, y2: 80, w: 16, color: '#666', stroke: '#444' },
      { type: 'pivot', cx: 70, cy: 145, r: 22, color: '#888', stroke: '#555' },
      { type: 'adjuster', x: 40, y: 130, w: 25, h: 35, color: '#ff6b35' },
      { type: 'tip', x: 255, y: 65, w: 30, h: 30, color: '#333' },
    ],
  },
  'lighting-001': {
    name: 'LED透镜大灯总成',
    category: 'lighting',
    shapes: [
      { type: 'ellipse', cx: 200, cy: 150, rx: 130, ry: 90, color: '#1a1a2e', stroke: '#333' },
      { type: 'lens', cx: 200, cy: 150, rx: 95, ry: 60, color: '#e8f4ff', stroke: '#88bbee' },
      { type: 'circle', cx: 160, cy: 145, r: 25, color: '#fffacd', glow: true },
      { type: 'circle', cx: 240, cy: 145, r: 25, color: '#fffacd', glow: true },
      { type: 'text', x: 200, y: 150, text: 'LED', color: '#ff6b35', size: 20, bold: true },
    ],
  },
  'lighting-002': {
    name: '流水转向灯',
    category: 'lighting',
    shapes: [
      { type: 'bar', x1: 30, y1: 130, x2: 370, y2: 130, w: 40, color: '#111', stroke: '#333', rounded: true },
      { type: 'flowlight', x: 50, y: 130, color: '#ffaa00', count: 12 },
      { type: 'text', x: 200, y: 200, text: 'SEQUENTIAL LED', color: '#ff6b35', size: 12 },
    ],
  },
  'lighting-003': {
    name: '熏黑尾灯总成',
    category: 'lighting',
    shapes: [
      { type: 'rect', x: 60, y: 80, w: 280, h: 140, color: '#0d0d15', stroke: '#222', rounded: 16 },
      { type: 'smoked', x: 70, y: 90, w: 260, h: 120, color: '#1a0505' },
      { type: 'bar', x1: 90, y1: 160, x2: 310, y2: 160, w: 25, color: '#8b0000', glow: '#ff2222', rounded: true },
      { type: 'text', x: 200, y: 165, text: 'XCF-180', color: '#ff4444', size: 14, bold: true },
    ],
  },
  'bodykit-001': {
    name: '全包围碳纤维整流罩',
    category: 'bodykit',
    shapes: [
      { type: 'fairing', points: '50,200 80,80 200,40 320,80 350,200 200,250', color: '#1a1a1a', stroke: '#333' },
      { type: 'cfpattern-box', x: 50, y: 40, w: 300, h: 210, color: '#252525' },
      { type: 'vent', x: 100, y: 120, w: 80, h: 40, color: '#0a0a0a' },
      { type: 'vent', x: 220, y: 120, w: 80, h: 40, color: '#0a0a0a' },
      { type: 'text', x: 200, y: 195, text: 'FULL CARBON', color: '#ff6b35', size: 14, bold: true },
    ],
  },
  'bodykit-002': {
    name: '赛道风挡风玻璃',
    category: 'bodykit',
    shapes: [
      { type: 'windscreen', points: '80,250 120,50 280,50 320,250', color: '#88bbff22', stroke: '#4477aa' },
      { type: 'tint', x: 120, y: 50, w: 160, h: 200, color: '#4466aa22' },
      { type: 'line', x1: 120, y1: 90, x2: 280, y2: 90, w: 2, color: '#ff6b35' },
      { type: 'line', x1: 120, y1: 160, x2: 280, y2: 160, w: 2, color: '#ff6b35' },
      { type: 'text', x: 200, y: 130, text: 'RACE', color: '#ff6b35', size: 22, bold: true },
    ],
  },
  'bodykit-003': {
    name: '油箱保护贴',
    category: 'bodykit',
    shapes: [
      { type: 'tankpad', points: '100,80 300,80 280,220 120,220', color: '#1a1a1a', stroke: '#444' },
      { type: 'cfpattern-box', x: 100, y: 80, w: 200, h: 140, color: '#2a2a2a' },
      { type: 'grip', x: 120, y: 120, w: 160, h: 10, color: '#ff6b35', count: 6 },
      { type: 'text', x: 200, y: 160, text: 'XCF', color: '#ff6b35', size: 28, bold: true },
    ],
  },
  'brake-001': {
    name: '辐射式对向四活塞卡钳',
    category: 'brake',
    shapes: [
      { type: 'caliper', points: '70,100 330,100 310,200 90,200', color: '#cc2222', stroke: '#881111' },
      { type: 'piston', cx: 130, cy: 150, r: 22, color: '#333', stroke: '#111' },
      { type: 'piston', cx: 270, cy: 150, r: 22, color: '#333', stroke: '#111' },
      { type: 'piston', cx: 130, cy: 150, r: 12, color: '#111' },
      { type: 'piston', cx: 270, cy: 150, r: 12, color: '#111' },
      { type: 'pad', x: 170, y: 130, w: 60, h: 40, color: '#222' },
      { type: 'text', x: 200, y: 155, text: '4POT', color: '#fff', size: 14, bold: true },
    ],
  },
  'brake-002': {
    name: '浮动式刹车盘',
    category: 'brake',
    shapes: [
      { type: 'ring', cx: 200, cy: 150, r: 110, w: 25, color: '#c0c0c0', stroke: '#888' },
      { type: 'drilled', cx: 200, cy: 150, r: 110, count: 36, color: '#333' },
      { type: 'slotted', cx: 200, cy: 150, r1: 92, r2: 106, count: 12, color: '#555' },
      { type: 'ring', cx: 200, cy: 150, r: 65, w: 8, color: '#888', stroke: '#555' },
      { type: 'floaters', cx: 200, cy: 150, r: 80, count: 8, color: '#ff6b35' },
      { type: 'circle', cx: 200, cy: 150, r: 30, color: '#666', stroke: '#444' },
    ],
  },
  'brake-003': {
    name: '钢喉刹车油管',
    category: 'brake',
    shapes: [
      { type: 'hose', x1: 40, y1: 80, x2: 200, y2: 220, w: 10, braid: true, color: '#888' },
      { type: 'hose', x1: 360, y1: 80, x2: 200, y2: 220, w: 10, braid: true, color: '#888' },
      { type: 'fitting', x: 30, y: 68, w: 25, h: 25, color: '#c0c0c0', stroke: '#888' },
      { type: 'fitting', x: 350, y: 68, w: 25, h: 25, color: '#c0c0c0', stroke: '#888' },
      { type: 'fitting', x: 188, y: 212, w: 25, h: 25, color: '#c0c0c0', stroke: '#888' },
      { type: 'text', x: 200, y: 30, text: 'STEEL BRAIDED', color: '#ff6b35', size: 12 },
    ],
  },
};

const categoryNames = {
  exhaust: '排气系统',
  wheels: '轮毂轮胎',
  handlebar: '把手控制',
  lighting: '灯组照明',
  bodykit: '车身套件',
  brake: '制动系统',
};

function renderShape(shape) {
  switch (shape.type) {
    case 'pipe':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="${shape.h/2}" ry="${shape.h/2}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>`;
    case 'circle':
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.color}" ${shape.stroke ? `stroke="${shape.stroke}" stroke-width="2"` : ''}/>`;
    case 'ring': {
      const rOuter = shape.r;
      const rInner = shape.r - shape.w;
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${rOuter}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>
              <circle cx="${shape.cx}" cy="${shape.cy}" r="${rInner}" fill="#1a1a2e"/>`;
    }
    case 'rect':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="${shape.rounded || 4}" ry="${shape.rounded || 4}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>`;
    case 'bar': {
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const length = Math.sqrt(dx*dx + dy*dy);
      return `<g transform="translate(${shape.x1}, ${shape.y1}) rotate(${angle})">
                <rect x="0" y="${-shape.w/2}" width="${length}" height="${shape.w}" rx="${shape.rounded ? shape.w/2 : 2}" ry="${shape.rounded ? shape.w/2 : 2}" fill="${shape.color}" ${shape.glow ? `filter="drop-shadow(0 0 8px ${shape.glow})"` : ''} stroke="${shape.stroke || 'none'}" stroke-width="2"/>
              </g>`;
    }
    case 'flange':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}" stroke="#555" stroke-width="2"/>
              <circle cx="${shape.x + shape.w/2}" cy="${shape.y + 12}" r="3" fill="#333"/>
              <circle cx="${shape.x + shape.w/2}" cy="${shape.y + shape.h - 12}" r="3" fill="#333"/>`;
    case 'text':
      return `<text x="${shape.x}" y="${shape.y}" text-anchor="middle" fill="${shape.color}" font-family="Orbitron, Arial, sans-serif" font-size="${shape.size}" font-weight="${shape.bold ? 'bold' : 'normal'}" style="text-shadow: 0 0 10px ${shape.color}44;">${shape.text}</text>`;
    case 'grip':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="6" ry="6" fill="${shape.color}" stroke="#444" stroke-width="1"/>
              <line x1="${shape.x + 8}" y1="${shape.y + 6}" x2="${shape.x + 8}" y2="${shape.y + shape.h - 6}" stroke="#444" stroke-width="1"/>
              <line x1="${shape.x + 16}" y1="${shape.y + 6}" x2="${shape.x + 16}" y2="${shape.y + shape.h - 6}" stroke="#444" stroke-width="1"/>
              <line x1="${shape.x + 24}" y1="${shape.y + 6}" x2="${shape.x + 24}" y2="${shape.y + shape.h - 6}" stroke="#444" stroke-width="1"/>`;
    case 'clamp':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}" stroke="#444" stroke-width="2"/>
              <circle cx="${shape.x + 15}" cy="${shape.y + shape.h/2}" r="5" fill="#333"/>
              <circle cx="${shape.x + shape.w - 15}" cy="${shape.y + shape.h/2}" r="5" fill="#333"/>`;
    case 'adjust':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}"/>
              <text x="${shape.x + shape.w/2}" y="${shape.y + shape.h - 3}" text-anchor="middle" fill="#fff" font-family="Arial" font-size="9">ADJ</text>`;
    case 'quickrelease':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="3" ry="3" fill="${shape.color}" stroke="#888" stroke-width="1"/>
              <circle cx="${shape.x + shape.w/2}" cy="${shape.y + 12}" r="4" fill="#333"/>
              <line x1="${shape.x + shape.w/2 - 6}" y1="${shape.y + shape.h - 18}" x2="${shape.x + shape.w/2 + 6}" y2="${shape.y + shape.h - 6}" stroke="#333" stroke-width="3"/>`;
    case 'lever': {
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const length = Math.sqrt(dx*dx + dy*dy);
      return `<g transform="translate(${shape.x1}, ${shape.y1}) rotate(${angle})">
                <rect x="0" y="${-shape.w/2}" width="${length}" height="${shape.w}" rx="${shape.w/2}" ry="${shape.w/2}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>
                <rect x="${length - 30}" y="${-shape.w/2 + 3}" width="25" height="${shape.w - 6}" rx="4" ry="4" fill="#444"/>
              </g>`;
    }
    case 'pivot':
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>
              <circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r/2.5}" fill="#222"/>`;
    case 'adjuster':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}" stroke="#ff8866" stroke-width="1"/>
              <text x="${shape.x + shape.w/2}" y="${shape.y + shape.h/2 + 3}" text-anchor="middle" fill="#fff" font-family="Arial" font-size="8">4WAY</text>`;
    case 'tip':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="6" ry="6" fill="${shape.color}"/>`;
    case 'ellipse':
      return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="3"/>`;
    case 'lens':
      return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2" filter="url(#lensGlow)"/>`;
    case 'fairing':
      return `<polygon points="${shape.points}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>`;
    case 'vent':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="${shape.h/2}" ry="${shape.h/2}" fill="${shape.color}" stroke="#333" stroke-width="1"/>`;
    case 'windscreen':
      return `<polygon points="${shape.points}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>`;
    case 'tint':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" fill="${shape.color}"/>`;
    case 'line':
      return `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" stroke="${shape.color}" stroke-width="${shape.w}" stroke-dasharray="8 4"/>`;
    case 'tankpad':
      return `<polygon points="${shape.points}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>`;
    case 'caliper':
      return `<polygon points="${shape.points}" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="3" rx="8"/>`;
    case 'piston':
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.color}" ${shape.stroke ? `stroke="${shape.stroke}" stroke-width="2"` : ''}/>`;
    case 'pad':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}"/>`;
    case 'fitting':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="4" ry="4" fill="${shape.color}" stroke="${shape.stroke}" stroke-width="2"/>
              <circle cx="${shape.x + shape.w/2}" cy="${shape.y + shape.h/2}" r="4" fill="#444"/>`;
    case 'pattern':
    case 'cfpattern-box': {
      let lines = '';
      for (let i = 0; i < 40; i++) {
        const x = shape.x + Math.random() * (shape.w - 10);
        const y = shape.y + Math.random() * (shape.h - 10);
        lines += `<rect x="${x}" y="${y}" width="8" height="8" fill="${shape.color}" transform="rotate(${Math.random()*60-30} ${x+4} ${y+4})" opacity="0.3"/>`;
      }
      return lines;
    }
    case 'cfpattern': {
      let lines = '';
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * 360;
        const dist = Math.random() * (shape.r - 10);
        const x = shape.cx + Math.cos(angle * Math.PI / 180) * dist;
        const y = shape.cy + Math.sin(angle * Math.PI / 180) * dist;
        lines += `<rect x="${x-4}" y="${y-4}" width="8" height="8" fill="${shape.color}" transform="rotate(${Math.random()*60-30} ${x} ${y})" opacity="0.4"/>`;
      }
      return lines;
    }
    case 'tread': {
      let lines = '';
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * 360;
        const rad = angle * Math.PI / 180;
        const r1 = shape.r - shape.w + 5;
        const r2 = shape.r - 5;
        lines += `<line x1="${shape.cx + Math.cos(rad) * r1}" y1="${shape.cy + Math.sin(rad) * r1}" x2="${shape.cx + Math.cos(rad) * r2}" y2="${shape.cy + Math.sin(rad) * r2}" stroke="${shape.color}" stroke-width="3" opacity="0.5"/>`;
      }
      return lines;
    }
    case 'spokes': {
      let lines = '';
      for (let i = 0; i < shape.count; i++) {
        const angle = (i / shape.count) * 360;
        const rad = angle * Math.PI / 180;
        lines += `<line x1="${shape.cx + Math.cos(rad) * shape.r1}" y1="${shape.cy + Math.sin(rad) * shape.r1}" x2="${shape.cx + Math.cos(rad) * shape.r2}" y2="${shape.cy + Math.sin(rad) * shape.r2}" stroke="${shape.color}" stroke-width="6" stroke-linecap="round"/>`;
      }
      return lines;
    }
    case 'drilled': {
      let circles = '';
      for (let i = 0; i < shape.count; i++) {
        const angle = (i / shape.count) * 360;
        const rad = angle * Math.PI / 180;
        const r = shape.r - 12;
        circles += `<circle cx="${shape.cx + Math.cos(rad) * r}" cy="${shape.cy + Math.sin(rad) * r}" r="3.5" fill="${shape.color}"/>`;
      }
      return circles;
    }
    case 'slotted': {
      let lines = '';
      for (let i = 0; i < shape.count; i++) {
        const angle = (i / shape.count) * 360 + 15;
        const rad = angle * Math.PI / 180;
        lines += `<line x1="${shape.cx + Math.cos(rad) * shape.r1}" y1="${shape.cy + Math.sin(rad) * shape.r1}" x2="${shape.cx + Math.cos(rad) * shape.r2}" y2="${shape.cy + Math.sin(rad) * shape.r2}" stroke="${shape.color}" stroke-width="3" stroke-linecap="round"/>`;
      }
      return lines;
    }
    case 'floaters': {
      let circles = '';
      for (let i = 0; i < shape.count; i++) {
        const angle = (i / shape.count) * 360 + 22.5;
        const rad = angle * Math.PI / 180;
        circles += `<circle cx="${shape.cx + Math.cos(rad) * shape.r}" cy="${shape.cy + Math.sin(rad) * shape.r}" r="4" fill="${shape.color}"/>`;
      }
      return circles;
    }
    case 'hose': {
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const length = Math.sqrt(dx*dx + dy*dy);
      let braidPattern = '';
      if (shape.braid) {
        for (let i = 0; i < length; i += 8) {
          braidPattern += `<line x1="${i}" y1="0" x2="${i+4}" y2="${shape.w}" stroke="#666" stroke-width="1" opacity="0.6"/>
                           <line x1="${i+4}" y1="0" x2="${i}" y2="${shape.w}" stroke="#aaa" stroke-width="1" opacity="0.6"/>`;
        }
      }
      return `<g transform="translate(${shape.x1}, ${shape.y1}) rotate(${angle})">
                <rect x="0" y="${-shape.w/2}" width="${length}" height="${shape.w}" rx="${shape.w/2}" ry="${shape.w/2}" fill="${shape.color}" stroke="#555" stroke-width="1"/>
                ${braidPattern}
              </g>`;
    }
    case 'smoked':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="12" ry="12" fill="${shape.color}" opacity="0.7"/>`;
    case 'flowlight': {
      let circles = '';
      for (let i = 0; i < shape.count; i++) {
        const x = shape.x + (i / (shape.count - 1)) * 280;
        const alpha = 0.3 + (i / shape.count) * 0.7;
        circles += `<circle cx="${x}" cy="${shape.y + 20}" r="10" fill="${shape.color}" opacity="${alpha}" filter="url(#ledGlow)"/>`;
      }
      return circles;
    }
    case 'grip': {
      let lines = '';
      for (let i = 0; i < shape.count; i++) {
        const y = shape.y + (i * shape.h);
        lines += `<rect x="${shape.x}" y="${y}" width="${shape.w}" height="${shape.h/2}" rx="${shape.h/4}" ry="${shape.h/4}" fill="${shape.color}" opacity="0.6"/>`;
      }
      return lines;
    }
    default:
      return '';
  }
}

function generateSVG(partId, design) {
  const shapesSvg = design.shapes.map(renderShape).join('\n    ');
  const catName = categoryNames[design.category] || '';

  let filterDef = '';
  if (design.category === 'lighting') {
    filterDef = `
  <defs>
    <filter id="lensGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="ledGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  ${filterDef}
  <defs>
    <linearGradient id="bgGrad${partId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0f0f1a"/>
    </linearGradient>
    <linearGradient id="borderGrad${partId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#ff6b35" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ff6b35" stop-opacity="0.3"/>
    </linearGradient>
  </defs>

  <rect width="400" height="300" fill="url(#bgGrad${partId})"/>
  <rect x="4" y="4" width="392" height="292" rx="8" ry="8" fill="none" stroke="url(#borderGrad${partId})" stroke-width="2"/>

  <g transform="translate(0, -10)">
    ${shapesSvg}
  </g>

  <rect x="0" y="258" width="400" height="42" fill="#0d0d15" opacity="0.95"/>
  <line x1="0" y1="258" x2="400" y2="258" stroke="#ff6b35" stroke-width="1" opacity="0.5"/>
  <text x="20" y="278" fill="#8d99ae" font-family="Arial, sans-serif" font-size="10" opacity="0.7">${catName.toUpperCase()}</text>
  <text x="380" y="278" fill="#8d99ae" font-family="Orbitron, Arial, sans-serif" font-size="10" text-anchor="end" opacity="0.7">XCF-180</text>
  <text x="200" y="283" text-anchor="middle" fill="#e2e2e2" font-family="Orbitron, Arial, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">${design.name}</text>
  <text x="200" y="296" text-anchor="middle" fill="#ff6b35" font-family="Orbitron, Arial, sans-serif" font-size="8" opacity="0.8">${partId.toUpperCase()}</text>
</svg>`;
}

console.log('🎨 正在生成配件图片...\n');

let count = 0;
for (const [partId, design] of Object.entries(partDesigns)) {
  const svgContent = generateSVG(partId, design);
  const outputPath = join(outputDir, `${partId}.svg`);
  writeFileSync(outputPath, svgContent, 'utf-8');
  count++;
  console.log(`  ✅ ${String(count).padStart(2, '0')}. ${partId}.svg - ${design.name}`);
}

console.log(`\n🎉 完成！共生成 ${count} 张配件 SVG 图片`);
console.log(`   输出目录: ${outputDir}\n`);
