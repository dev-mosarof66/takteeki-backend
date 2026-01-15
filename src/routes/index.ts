import { Router } from 'express';
import authRoutes from './auth.routes';
import playerRoutes from './player.routes';
import teamRoutes from './team.routes';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Player routes
router.use('/players', playerRoutes);

// Team routes
router.use('/teams', teamRoutes);

export default router;

