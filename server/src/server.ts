import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { searchRouter } from './routes/search';
import { healthRouter } from './routes/health';

const app = express();

app.use(corsMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.use('/search', searchRouter);
app.use('/health', healthRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', code: 'not_found' });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
