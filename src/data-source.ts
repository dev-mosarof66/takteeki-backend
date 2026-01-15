import { DataSource } from 'typeorm';
import { config } from './config/env';

// This file is used by TypeORM CLI for migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // Never use synchronize in production
  logging: config.nodeEnv === 'development',
  entities: ['src/entities/**/*.entity{.ts,.js}'],
  migrations: ['migrations/**/*{.ts,.js}'],
  subscribers: ['src/subscribers/**/*{.ts,.js}'],
});



