import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from '../config/env';
import { errorHandler, notFoundHandler } from './errorHandler';

export const setupMiddleware = (app: Application): void => {
  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Body parsing (built into Express 4.16+)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Compression
  app.use(compression());

  // Logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
};

export const setupErrorHandling = (app: Application): void => {
  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);
};

