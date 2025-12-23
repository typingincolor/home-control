import express from 'express';
import hueClient from '../../services/hueClient.js';
import roomService from '../../services/roomService.js';
import { enrichLight } from '../../utils/colorConversion.js';
import { extractCredentials } from '../../middleware/auth.js';
import { SCENE_APPLY_DELAY_MS } from '../../constants/timings.js';

const router = express.Router();

/**
 * POST /api/v1/scenes/:id/activate
 * Activate a scene and return affected lights
 *
 * Auth: Session token, headers, or query params
 */
router.post('/:id/activate', extractCredentials, async (req, res, next) => {
  try {
    const { id: sceneId } = req.params;
    const { bridgeIp, username } = req.hue;

    console.log(`[SCENES] Activating scene ${sceneId} (auth: ${req.hue.authMethod})`);

    // Activate scene
    await hueClient.activateScene(bridgeIp, username, sceneId);

    // Wait for lights to update (Hue Bridge takes time to apply scene)
    await new Promise(resolve => setTimeout(resolve, SCENE_APPLY_DELAY_MS));

    // Fetch updated light states
    const { lightsData, roomsData, devicesData, scenesData } = await hueClient.getDashboardData(bridgeIp, username);

    // Find the scene to determine affected room
    const scene = scenesData.data.find(s => s.id === sceneId);
    if (!scene) {
      // Scene activated but couldn't find it - just return success
      return res.json({
        success: true,
        affectedLights: []
      });
    }

    // Get lights in the scene's room
    const roomMap = roomService.buildRoomHierarchy(lightsData, roomsData, devicesData);
    const room = Object.values(roomMap).find(r => r.roomUuid === scene.group?.rid);

    const affectedLights = room
      ? room.lights.map(light => enrichLight(light))
      : [];

    console.log(`[SCENES] Scene activated, ${affectedLights.length} lights affected`);

    res.json({
      success: true,
      affectedLights
    });
  } catch (error) {
    next(error);
  }
});

export default router;
