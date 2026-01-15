# Football Backend API

A production-ready Express.js backend application built with TypeScript and PostgreSQL, following best practices for code organization and structure.

## 🚀 Features

- **TypeScript** - Type-safe development
- **Express.js** - Fast, minimalist web framework
- **PostgreSQL** - Robust relational database
- **TypeORM** - Powerful ORM with decorators, migrations, and type safety
- **Swagger/OpenAPI** - Interactive API documentation
- **Docker** - Containerized development and production environments
- **Best Practices** - Clean architecture, error handling, and middleware setup
- **Security** - Helmet, CORS, and input validation ready
- **Logging** - Morgan for HTTP request logging

## 📁 Project Structure

```
football/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # TypeORM DataSource configuration
│   │   └── env.ts       # Environment variables
│   ├── entities/        # TypeORM entities (database models)
│   │   ├── Base.entity.ts
│   │   └── User.entity.ts
│   ├── repositories/    # Data access layer
│   │   ├── User.repository.ts
│   │   └── RefreshToken.repository.ts
│   ├── migrations/      # Database migrations
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── asyncHandler.ts
│   │   ├── auth.middleware.ts
│   │   ├── validateRequest.ts
│   │   └── index.ts
│   ├── routes/          # API routes
│   │   └── index.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── logger.ts
│   ├── app.ts           # Express app setup
│   ├── index.ts         # Application entry point
│   └── data-source.ts   # TypeORM CLI configuration
├── docker-compose.yml       # Development Docker setup
├── docker-compose.prod.yml  # Production Docker setup
├── Dockerfile               # Application Docker image
├── package.json
├── tsconfig.json
├── ormconfig.json          # TypeORM configuration
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Node.js 20+ 
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=football_db
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=*

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d
   ```

## 🐳 Docker Setup

### Development Environment

Start the development environment with hot-reload:

```bash
docker-compose up
```

This will:
- Start PostgreSQL database
- Start the Express app with hot-reload
- Mount source code for live updates

### Production Environment

1. **Create production environment file:**
   ```bash
   cp .env.prod.example .env.prod
   ```

2. **Update production environment variables** in `.env.prod`

3. **Start production environment:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

### Docker Commands

- **View logs:**
  ```bash
  docker-compose logs -f app
  ```

- **Stop containers:**
  ```bash
  docker-compose down
  ```

- **Rebuild containers:**
  ```bash
  docker-compose build --no-cache
  ```

## 💻 Local Development (without Docker)

### Start PostgreSQL

If you have PostgreSQL installed locally, make sure it's running, or use Docker just for the database:

```bash
docker-compose up postgres
```

### Run the Application

```bash
# Development mode with hot-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Type check without building
- `npm run migration:generate -- -n MigrationName` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## 📚 API Documentation (Swagger)

The API is fully documented with Swagger/OpenAPI. Once the server is running, access the interactive documentation at:

**http://localhost:3000/api-docs**

### Features:
- Interactive API testing
- Request/response schemas
- Authentication testing with "Authorize" button
- All endpoints documented with examples

### Using Swagger UI:
1. Start the server: `npm run dev`
2. Open browser: `http://localhost:3000/api-docs`
3. Click "Authorize" button to add JWT token for protected endpoints
4. Test endpoints directly from the UI

## 🧪 Testing the API

Once the server is running, test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📚 Adding New Features

### Creating a New Route

1. Create a new route file in `src/routes/`:
   ```typescript
   import { Router } from 'express';
   const router = Router();
   
   router.get('/', asyncHandler(async (req, res) => {
     // Your route logic
   }));
   
   export default router;
   ```

2. Import and use in `src/routes/index.ts`:
   ```typescript
   import newRoute from './newRoute';
   router.use('/new-route', newRoute);
   ```

### Working with TypeORM

#### Creating an Entity

1. Create a new entity in `src/entities/`:
   ```typescript
   import { Entity, Column } from 'typeorm';
   import { BaseEntity } from './Base.entity';
   
   @Entity('products')
   export class Product extends BaseEntity {
     @Column({ type: 'varchar', length: 255 })
     name!: string;
     
     @Column({ type: 'decimal', precision: 10, scale: 2 })
     price!: number;
   }
   ```

#### Creating a Repository

Create a repository in `src/repositories/`:
```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product.entity';

export class ProductRepository {
  private repository: Repository<Product>;
  
  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }
  
  async findAll(): Promise<Product[]> {
    return this.repository.find();
  }
  
  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }
  
  async create(data: Partial<Product>): Promise<Product> {
    const product = this.repository.create(data);
    return this.repository.save(product);
  }
}
```

#### Using in Routes

```typescript
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ProductRepository } from '../repositories/Product.repository';

const router = Router();
const productRepo = new ProductRepository();

router.get('/', asyncHandler(async (req, res) => {
  const products = await productRepo.findAll();
  res.json({ status: 'success', data: products });
}));

export default router;
```

#### Database Migrations

Generate a migration:
```bash
npm run migration:generate -- -n CreateProductsTable
```

Run migrations:
```bash
npm run migration:run
```

Revert last migration:
```bash
npm run migration:revert
```

## 🔒 Security Best Practices

- Environment variables are used for sensitive data
- Helmet.js is configured for security headers
- CORS is configurable per environment
- Input validation ready (express-validator included)
- Non-root user in Docker production image

## 🏗️ Architecture Decisions

- **Separation of Concerns**: Config, middleware, routes, and utilities are separated
- **Error Handling**: Centralized error handling middleware
- **Async/Await**: AsyncHandler wrapper for route handlers
- **Type Safety**: Full TypeScript support with strict mode
- **Environment Configuration**: Centralized config management

## 📦 Dependencies

### Production
- `express` - Web framework
- `pg` - PostgreSQL client
- `typeorm` - TypeORM ORM
- `reflect-metadata` - Required for TypeORM decorators
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logger
- `compression` - Response compression
- `express-validator` - Input validation
- `jsonwebtoken` - JWT token generation and verification
- `bcryptjs` - Password hashing
- `swagger-ui-express` - Swagger UI for API documentation
- `swagger-jsdoc` - Generate Swagger specs from JSDoc comments

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Hot-reload
- `eslint` - Linting
- `@types/*` - TypeScript type definitions

## 🔐 Authentication & Authorization

### User Roles

The system supports three user roles:
- **USER** - Default role for regular users
- **ADMIN** - Administrative access
- **MODERATOR** - Moderator access

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // optional, defaults to "user"
}
```

Response:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Refresh Access Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

Response:
```json
{
  "status": "success",
  "token": "new-access-token...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

#### Logout
```bash
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

#### Logout from All Devices
```bash
POST /api/auth/logout-all
Authorization: Bearer <access-token>
```

#### Get Current User Profile
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

#### Admin Only Route (Example)
```bash
GET /api/auth/admin
Authorization: Bearer <token>
```

### Using Authentication in Routes

#### Protect a Route (Any Authenticated User)
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../types/auth';

const router = Router();

router.get('/protected', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  // req.user is available here
  res.json({ user: req.user });
}));
```

#### Protect a Route (Specific Roles)
```typescript
import { requireAuth } from '../middleware/auth.middleware';
import { UserRole } from '../types/auth';

// Admin only
router.get('/admin-only', requireAuth([UserRole.ADMIN]), handler);

// Admin or Moderator
router.get('/moderator', requireAuth([UserRole.ADMIN, UserRole.MODERATOR]), handler);
```

### Refresh Token System

The authentication system uses a **refresh token pattern** for enhanced security:

- **Access Token**: Short-lived (default: 15 minutes) - Used for API requests
- **Refresh Token**: Long-lived (default: 30 days) - Stored in database, used to get new access tokens
- **Token Rotation**: Refresh tokens are stored securely and can be revoked
- **Security Features**:
  - Refresh tokens are stored in the database
  - Tokens can be revoked individually or for all devices
  - IP address and user agent tracking for security
  - Automatic expiration handling

### Token Flow

1. **Login/Register**: Returns both `token` (access) and `refreshToken`
2. **API Requests**: Use `token` in `Authorization: Bearer <token>` header
3. **Token Expiry**: When access token expires, use refresh token to get a new one
4. **Logout**: Revoke the refresh token to invalidate the session

### Environment Variables for JWT

Add these to your `.env` file:
```env
JWT_SECRET=your-very-secure-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d
```

**Important**: 
- Always use strong, random secrets in production!
- Access tokens should be short-lived (15m-1h recommended)
- Refresh tokens should be long-lived (7d-30d recommended)

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript types
3. Add error handling
4. Write clean, readable code
5. Test your changes

## 📄 License

ISC

