import express from 'express';
import motionService from '../../services/motionService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('MOTION_ZONES');
const router = express.Router();

/**
 * GET /api/v1/motion-zones
 * Returns MotionAware zones with parsed motion data
 *
 * Auth: Session token, headers, or query params
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    logger.info('Fetching motion zones', { bridgeIp, authMethod: req.hue.authMethod });

    // Fetch and parse motion zones
    const result = await motionService.getMotionZones(bridgeIp, username);

    logger.debug('Found motion zones', { count: result.zones.length });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
