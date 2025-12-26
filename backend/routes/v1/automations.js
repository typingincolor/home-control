import express from 'express';
import automationService from '../../services/automationService.js';
import { extractCredentials } from '../../middleware/auth.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('AUTOMATIONS');
const router = express.Router();

/**
 * GET /api/v1/automations
 * Get all automations (behavior_instances)
 *
 * Auth: Session token required
 */
router.get('/', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    logger.info('Getting automations', { authMethod: req.hue.authMethod });

    const result = await automationService.getAutomations(bridgeIp, username);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/automations/raw
 * Get raw behavior_instance data for debugging
 *
 * Auth: Session token required
 */
router.get('/raw', extractCredentials, async (req, res, next) => {
  try {
    const { bridgeIp, username } = req.hue;

    logger.info('Getting raw behavior_instance data', { authMethod: req.hue.authMethod });

    const result = await automationService.getRawBehaviors(bridgeIp, username);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/automations/:id/trigger
 * Trigger an automation (behavior_instance)
 *
 * Auth: Session token required
 */
router.post('/:id/trigger', extractCredentials, async (req, res, next) => {
  try {
    const { id: automationId } = req.params;
    const { bridgeIp, username } = req.hue;

    logger.info('Triggering automation', { automationId, authMethod: req.hue.authMethod });

    const result = await automationService.triggerAutomation(bridgeIp, username, automationId);

    logger.info('Automation triggered successfully', { automationId });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
