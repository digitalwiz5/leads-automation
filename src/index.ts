import express from 'express';
import { config } from './config';
import { logger } from './middleware/logger';
import webhookRouter from './routes/webhook';
import adminRouter from './routes/admin';
import facebookBridge from './routes/facebook-bridge';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/webhook', webhookRouter);
app.use('/admin', adminRouter);
app.use('/facebook-bridge', facebookBridge);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  logger.info(`Leads automation server started`, { port: config.port, env: config.nodeEnv });
});

export default app;
