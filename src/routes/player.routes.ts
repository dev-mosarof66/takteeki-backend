import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param } from 'express-validator';
import multer from 'multer';
import { PlayerService } from '../services/player.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { upload, getFileUrl } from '../config/upload';

const router = Router();
const playerService = new PlayerService();

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Create a new player
 *     description: Create a new player in the system. Profile picture can be uploaded as a file.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - teamId
 *               - position
 *               - jerseyNumber
 *               - email
 *               - phone
 *               - emergencyContactName
 *               - emergencyPhone
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture image file (JPEG, PNG, GIF, WebP, max 5MB)
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *                 example: John
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 example: Doe
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2000-01-15
 *               teamId:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: string
 *                 maxLength: 50
 *                 example: Forward
 *               jerseyNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 99
 *                 example: 10
 *               heightCm:
 *                 type: number
 *                 minimum: 0
 *                 example: 180
 *               weightKg:
 *                 type: number
 *                 minimum: 0
 *                 example: 75
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 example: +1234567890
 *               address:
 *                 type: string
 *               emergencyContactName:
 *                 type: string
 *                 maxLength: 255
 *                 example: Jane Doe
 *               emergencyPhone:
 *                 type: string
 *                 maxLength: 20
 *                 example: +1234567891
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlayerRequest'
 *     responses:
 *       201:
 *         description: Player created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       400:
 *         description: Validation error or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email or jersey number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        const error = err as multer.MulterError | Error;
        res.status(400).json({
          status: 'error',
          message: error.message || 'File upload error',
        });
        return;
      }
      next();
    });
  },
  [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601(),
    body('teamId').notEmpty().withMessage('Team ID is required').isUUID(),
    body('position').trim().notEmpty().withMessage('Position is required').isLength({ max: 50 }),
    body('jerseyNumber').isInt({ min: 1, max: 99 }).withMessage('Jersey number must be between 1 and 99'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
    body('emergencyContactName').trim().notEmpty().withMessage('Emergency contact name is required'),
    body('emergencyPhone').trim().notEmpty().withMessage('Emergency phone is required'),
    body('heightCm').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    body('weightKg').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    body('address').optional().isString(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const playerData = { ...req.body };
    
    // If file is uploaded, set profilePictureUrl
    if (req.file) {
      playerData.profilePictureUrl = getFileUrl(req.file.filename);
    }
    
    const result = await playerService.createPlayer(playerData);
    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: List all players with pagination and filters
 *     description: Get a paginated list of players with optional filtering and search
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, createdAt, jerseyNumber]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of players
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString(),
    query('teamId').optional().isUUID(),
    query('position').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['firstName', 'lastName', 'createdAt', 'jerseyNumber']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      search: req.query.search as string | undefined,
      teamId: req.query.teamId as string | undefined,
      position: req.query.position as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined,
    };
    const result = await playerService.getAllPlayers(queryParams);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   get:
 *     summary: Get player details
 *     description: Get detailed information about a specific player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerById(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   put:
 *     summary: Update player information
 *     description: Update player information. Profile picture can be uploaded as a file.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture image file (JPEG, PNG, GIF, WebP, max 5MB)
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               teamId:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: string
 *                 maxLength: 50
 *               jerseyNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 99
 *               heightCm:
 *                 type: number
 *                 minimum: 0
 *               weightKg:
 *                 type: number
 *                 minimum: 0
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               address:
 *                 type: string
 *               emergencyContactName:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlayerRequest'
 *     responses:
 *       200:
 *         description: Player updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:playerId',
  authenticate,
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        const error = err as multer.MulterError | Error;
        res.status(400).json({
          status: 'error',
          message: error.message || 'File upload error',
        });
        return;
      }
      next();
    });
  },
  [
    param('playerId').isUUID().withMessage('Invalid player ID'),
    body('firstName').optional().trim().isLength({ max: 100 }),
    body('lastName').optional().trim().isLength({ max: 100 }),
    body('dateOfBirth').optional().isISO8601(),
    body('teamId').optional().isUUID(),
    body('position').optional().trim().isLength({ max: 50 }),
    body('jerseyNumber').optional().isInt({ min: 1, max: 99 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('heightCm').optional().isFloat({ min: 0 }),
    body('weightKg').optional().isFloat({ min: 0 }),
    body('address').optional().isString(),
    body('emergencyContactName').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('notes').optional().isString(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const updateData = { ...req.body };

    console.log('update data ' , updateData);
    
    // If file is uploaded, set profilePictureUrl
    if (req.file) {
      updateData.profilePictureUrl = getFileUrl(req.file.filename);
    }
    
    const result = await playerService.updatePlayer(req.params.playerId, updateData);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   delete:
 *     summary: Delete a player
 *     description: Soft delete a player.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:playerId',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.deletePlayer(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/search:
 *   get:
 *     summary: Search players
 *     description: Search players by name or email
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or email)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/search',
  authenticate,
  [
    query('q').notEmpty().withMessage('Search query is required').isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await playerService.searchPlayers(searchTerm, limit);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/assigned-tasks/{playerId}:
 *   get:
 *     summary: Get player's assigned tasks
 *     description: Get all tasks assigned to a specific player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: List of assigned tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/assigned-tasks/:playerId',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerTasks(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/status:
 *   patch:
 *     summary: Update player status
 *     description: Update player active status.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlayerStatusRequest'
 *     responses:
 *       200:
 *         description: Player status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:playerId/status',
  authenticate,
  [
    param('playerId').isUUID().withMessage('Invalid player ID'),
    body('isActive').notEmpty().withMessage('isActive is required').isBoolean(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.updatePlayerStatus(req.params.playerId, req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/profile:
 *   get:
 *     summary: Get complete player profile
 *     description: Get complete player profile including statistics, history, analytics, and activities
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Complete player profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerProfileResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/profile',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerProfile(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/statistics:
 *   get:
 *     summary: Get player statistics
 *     description: Get player task statistics including completion rates
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PlayerStatistics'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/statistics',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerStatistics(req.params.playerId);
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/players/{playerId}/history:
 *   get:
 *     summary: Get player history
 *     description: Get player activity history including task assignments and completions
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/history',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerHistory(req.params.playerId);
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/players/{playerId}/analytics:
 *   get:
 *     summary: Get player analytics
 *     description: Get player performance analytics and activity level
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     performanceScore:
 *                       type: number
 *                     activityLevel:
 *                       type: string
 *                       enum: [high, medium, low]
 *                     lastActiveDate:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/analytics',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerAnalytics(req.params.playerId);
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/players/{playerId}/activities:
 *   get:
 *     summary: Get player activity timeline
 *     description: Get chronological timeline of player activities
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/activities',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerActivities(req.params.playerId);
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/players/{playerId}/profile:
 *   put:
 *     summary: Update player profile
 *     description: Update player profile information.
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlayerRequest'
 *     responses:
 *       200:
 *         description: Player profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:playerId/profile',
  authenticate,
  [
    param('playerId').isUUID().withMessage('Invalid player ID'),
    body('firstName').optional().trim().isLength({ max: 100 }),
    body('lastName').optional().trim().isLength({ max: 100 }),
    body('dateOfBirth').optional().isISO8601(),
    body('teamId').optional().isUUID(),
    body('position').optional().trim().isLength({ max: 50 }),
    body('jerseyNumber').optional().isInt({ min: 1, max: 99 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('heightCm').optional().isFloat({ min: 0 }),
    body('weightKg').optional().isFloat({ min: 0 }),
    body('profilePictureUrl').optional().isURL(),
    body('address').optional().isString(),
    body('emergencyContactName').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.updatePlayerProfile(req.params.playerId, req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/notes:
 *   post:
 *     summary: Add notes to player profile
 *     description: Add a note to the player's profile.
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddPlayerNoteRequest'
 *     responses:
 *       200:
 *         description: Note added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:playerId/notes',
  authenticate,
  [
    param('playerId').isUUID().withMessage('Invalid player ID'),
    body('note').notEmpty().withMessage('Note is required').isString(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.addPlayerNote(req.params.playerId, req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/notes:
 *   get:
 *     summary: Get player notes
 *     description: Get all notes associated with a player's profile
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: string
 *                       nullable: true
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/notes',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerNotes(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/timeline:
 *   get:
 *     summary: Get player timeline events
 *     description: Get chronological timeline of all player events and activities
 *     tags: [Player Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player timeline
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       metadata:
 *                         type: object
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:playerId/timeline',
  authenticate,
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await playerService.getPlayerTimeline(req.params.playerId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/players/{playerId}/profile-picture:
 *   post:
 *     summary: Upload player profile picture
 *     description: Upload a profile picture for a player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture image file (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerResponse'
 *       400:
 *         description: No file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:playerId/profile-picture',
  authenticate,
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        const error = err as multer.MulterError | Error;
        res.status(400).json({
          status: 'error',
          message: error.message || 'File upload error',
        });
        return;
      }
      next();
    });
  },
  [param('playerId').isUUID().withMessage('Invalid player ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded. Please upload a profile picture.',
      });
      return;
    }

    const profilePictureUrl = getFileUrl(req.file.filename);
    const result = await playerService.updatePlayer(req.params.playerId, {
      profilePictureUrl,
    });
    
    res.json(result);
  })
);

export default router;

