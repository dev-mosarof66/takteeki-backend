import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { setupMiddleware, setupErrorHandling } from './middleware';
import routes from './routes';
import { swaggerSpec } from './config/swagger';

const app: Application = express();

// Setup middleware
setupMiddleware(app);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Football API Documentation',
}));

// Routes
app.use('/api', routes);

// Error handling (must be last)
setupErrorHandling(app);

export default app;

