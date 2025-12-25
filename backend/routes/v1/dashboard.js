import express from 'express';
import dashboardService from '../../services/dashboardService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('DASHBOARD_ROUTE');
const router = express.Router();

/**
 * GET /api/v1/dashboard
 * Returns unified dashboard data with pre-computed colors, shadows, and statistics
 *
 * Auth: Session token, headers, or query params
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    logger.info('Fetching data', { bridgeIp, authMethod: req.hue.authMethod });

    const data = await dashboardService.getDashboard(bridgeIp, username);

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
