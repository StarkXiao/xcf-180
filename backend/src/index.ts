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

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
