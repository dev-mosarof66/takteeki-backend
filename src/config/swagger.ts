import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Football Backend API',
      version: '1.0.0',
      description: 'A RESTful API for Football Backend with authentication and role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 255,
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              example: 'user',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            token: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token for getting new access tokens',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token',
            },
          },
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            token: {
              type: 'string',
              description: 'New JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token (same or new)',
            },
          },
        },
        LogoutRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token to revoke',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'Server is running',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            shortName: {
              type: 'string',
            },
            logoUrl: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            location: {
              type: 'string',
            },
            coach: {
              type: 'string',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Player: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            profilePictureUrl: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
            },
            teamId: {
              type: 'string',
              format: 'uuid',
            },
            team: {
              $ref: '#/components/schemas/Team',
            },
            position: {
              type: 'string',
            },
            jerseyNumber: {
              type: 'integer',
            },
            heightCm: {
              type: 'number',
            },
            weightKg: {
              type: 'number',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            emergencyContactName: {
              type: 'string',
            },
            emergencyPhone: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreatePlayerRequest: {
          type: 'object',
          required: [
            'firstName',
            'lastName',
            'dateOfBirth',
            'teamId',
            'position',
            'jerseyNumber',
            'email',
            'phone',
            'emergencyContactName',
            'emergencyPhone',
          ],
          properties: {
            profilePictureUrl: {
              type: 'string',
              format: 'uri',
            },
            firstName: {
              type: 'string',
              maxLength: 100,
              example: 'John',
            },
            lastName: {
              type: 'string',
              maxLength: 100,
              example: 'Doe',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '2000-01-15',
            },
            teamId: {
              type: 'string',
              format: 'uuid',
            },
            position: {
              type: 'string',
              maxLength: 50,
              example: 'Forward',
            },
            jerseyNumber: {
              type: 'integer',
              minimum: 1,
              maximum: 99,
              example: 10,
            },
            heightCm: {
              type: 'number',
              minimum: 0,
              example: 180,
            },
            weightKg: {
              type: 'number',
              minimum: 0,
              example: 75,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              maxLength: 20,
              example: '+1234567890',
            },
            address: {
              type: 'string',
            },
            emergencyContactName: {
              type: 'string',
              maxLength: 255,
              example: 'Jane Doe',
            },
            emergencyPhone: {
              type: 'string',
              maxLength: 20,
              example: '+1234567891',
            },
            notes: {
              type: 'string',
            },
            isActive: {
              type: 'boolean',
              default: true,
            },
          },
        },
        UpdatePlayerRequest: {
          type: 'object',
          properties: {
            profilePictureUrl: {
              type: 'string',
              format: 'uri',
            },
            firstName: {
              type: 'string',
              maxLength: 100,
            },
            lastName: {
              type: 'string',
              maxLength: 100,
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
            },
            teamId: {
              type: 'string',
              format: 'uuid',
            },
            position: {
              type: 'string',
              maxLength: 50,
            },
            jerseyNumber: {
              type: 'integer',
              minimum: 1,
              maximum: 99,
            },
            heightCm: {
              type: 'number',
              minimum: 0,
            },
            weightKg: {
              type: 'number',
              minimum: 0,
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
              maxLength: 20,
            },
            address: {
              type: 'string',
            },
            emergencyContactName: {
              type: 'string',
            },
            emergencyPhone: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        PlayerResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              $ref: '#/components/schemas/Player',
            },
          },
        },
        PlayerListResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Player',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                },
                limit: {
                  type: 'integer',
                },
                total: {
                  type: 'integer',
                },
                totalPages: {
                  type: 'integer',
                },
              },
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            playerId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            },
            dueDate: {
              type: 'string',
              format: 'date',
            },
            completedAt: {
              type: 'string',
              format: 'date',
            },
            priority: {
              type: 'integer',
            },
            notes: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PlayerStatistics: {
          type: 'object',
          properties: {
            totalTasks: {
              type: 'integer',
            },
            completedTasks: {
              type: 'integer',
            },
            pendingTasks: {
              type: 'integer',
            },
            inProgressTasks: {
              type: 'integer',
            },
            completionRate: {
              type: 'number',
            },
          },
        },
        PlayerProfileResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              type: 'object',
              properties: {
                player: {
                  $ref: '#/components/schemas/Player',
                },
                statistics: {
                  $ref: '#/components/schemas/PlayerStatistics',
                },
                history: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
                analytics: {
                  type: 'object',
                },
                activities: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        UpdatePlayerStatusRequest: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: {
              type: 'boolean',
            },
          },
        },
        AddPlayerNoteRequest: {
          type: 'object',
          required: ['note'],
          properties: {
            note: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);



