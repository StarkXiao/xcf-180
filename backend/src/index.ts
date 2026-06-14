import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import path from 'path';
import { partsRoutes } from './routes/parts.js';
import { selectionsRoutes } from './routes/selections.js';
import { compatibilityRoutes } from './routes/compatibility.js';
import { sharesRoutes } from './routes/shares.js';
import { ordersRoutes } from './routes/orders.js';
import { templatesRoutes } from './routes/templates.js';

import { inventoryRoutes } from './routes/inventory.js';
import { quotesRoutes } from './routes/quotes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const PORT = 3001;

app.use(cors());
app.use(bodyParser());
app.use(serve(path.resolve(__dirname, '../public')));

app.use(partsRoutes.routes());
app.use(partsRoutes.allowedMethods());

app.use(selectionsRoutes.routes());
app.use(selectionsRoutes.allowedMethods());

app.use(compatibilityRoutes.routes());
app.use(compatibilityRoutes.allowedMethods());

app.use(sharesRoutes.routes());
app.use(sharesRoutes.allowedMethods());

app.use(ordersRoutes.routes());
app.use(ordersRoutes.allowedMethods());

app.use(templatesRoutes.routes());
app.use(templatesRoutes.allowedMethods());

app.use(inventoryRoutes.routes());
app.use(inventoryRoutes.allowedMethods());

app.use(quotesRoutes.routes());
app.use(quotesRoutes.allowedMethods());

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
