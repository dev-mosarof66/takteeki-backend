import { Router, Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { TeamService } from '../services/team.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const teamService = new TeamService();

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     description: Create a new team in the system
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - headCoachId
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Eagles
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: U16
 *               headCoachId:
 *                 type: string
 *                 format: uuid
 *               winRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *                 example: 67.5
 *               matchHistory:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [W, L, D]
 *                 example: [W, L, D, W, W]
 *               subCoachCount:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Head coach not found
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
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 50 }),
    body('headCoachId').notEmpty().withMessage('Head coach ID is required').isUUID(),
    body('winRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Win rate must be between 0 and 100'),
    body('matchHistory').optional().isArray().withMessage('Match history must be an array'),
    body('matchHistory.*').optional().isIn(['W', 'L', 'D']).withMessage('Match history items must be W, L, or D'),
    body('subCoachCount').optional().isInt({ min: 0 }).withMessage('Sub coach count must be a non-negative integer'),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.createTeam(req.body);
    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: List all teams with pagination and filters
 *     description: Get a paginated list of teams with optional filtering and search
 *     tags: [Teams]
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
 *         description: Search by name or category
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: headCoachId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by head coach ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, category, winRate, createdAt]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of teams
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('headCoachId').optional().isUUID(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['name', 'category', 'winRate', 'createdAt']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      headCoachId: req.query.headCoachId as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined,
    };
    const result = await teamService.getAllTeams(queryParams);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/{teamId}/players:
 *   get:
 *     summary: Get all players of a team
 *     description: Get a list of all players belonging to a specific team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: List of players in the team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerListResponse'
 *       404:
 *         description: Team not found
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
  '/:teamId/players',
  authenticate,
  [param('teamId').isUUID().withMessage('Invalid team ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.getTeamPlayers(req.params.teamId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   get:
 *     summary: Get team details
 *     description: Get detailed information about a specific team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 *       404:
 *         description: Team not found
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
  '/:teamId',
  authenticate,
  [param('teamId').isUUID().withMessage('Invalid team ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.getTeamById(req.params.teamId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   put:
 *     summary: Update team information
 *     description: Update team information
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               headCoachId:
 *                 type: string
 *                 format: uuid
 *               winRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               matchHistory:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [W, L, D]
 *               subCoachCount:
 *                 type: integer
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 *       404:
 *         description: Team or head coach not found
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
router.put(
  '/:teamId',
  authenticate,
  [
    param('teamId').isUUID().withMessage('Invalid team ID'),
    body('name').optional().trim().isLength({ max: 100 }),
    body('category').optional().trim().isLength({ max: 50 }),
    body('headCoachId').optional().isUUID(),
    body('winRate').optional().isFloat({ min: 0, max: 100 }),
    body('matchHistory').optional().isArray(),
    body('matchHistory.*').optional().isIn(['W', 'L', 'D']),
    body('subCoachCount').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.updateTeam(req.params.teamId, req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   delete:
 *     summary: Delete a team
 *     description: Soft delete a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Team not found
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
router.delete(
  '/:teamId',
  authenticate,
  [param('teamId').isUUID().withMessage('Invalid team ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.deleteTeam(req.params.teamId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/{teamId}/status:
 *   patch:
 *     summary: Update team status
 *     description: Update team active status
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Team status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 *       404:
 *         description: Team not found
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
router.patch(
  '/:teamId/status',
  authenticate,
  [
    param('teamId').isUUID().withMessage('Invalid team ID'),
    body('isActive').notEmpty().withMessage('isActive is required').isBoolean(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.updateTeamStatus(req.params.teamId, req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/teams/head-coach/{headCoachId}:
 *   get:
 *     summary: Get teams by head coach
 *     description: Get all teams managed by a specific head coach
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: headCoachId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Head coach ID
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/head-coach/:headCoachId',
  authenticate,
  [param('headCoachId').isUUID().withMessage('Invalid head coach ID')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await teamService.getTeamsByHeadCoach(req.params.headCoachId);
    res.json(result);
  })
);

export default router;

