import { useEffect, useState } from 'react';
import { hueApi } from '../services/hueApi';

export const MotionZones = ({ bridgeIp, username }) => {

  const [behaviors, setBehaviors] = useState(null);
  const [motionAreas, setMotionAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse MotionAware data by combining behaviors (for names) with convenience_area_motion (for status)
  const getMotionSensors = (behaviorsData, motionAreasData) => {
    if (!behaviorsData?.data || !motionAreasData?.data) return [];

    // Create a map of motion area IDs to their motion status
    const motionStatusMap = {};
    motionAreasData.data.forEach(area => {
      motionStatusMap[area.id] = {
        motionDetected: area.motion?.motion || false,
        motionValid: area.motion?.motion_valid !== false,
        enabled: area.enabled !== false,
        lastChanged: area.motion?.motion_report?.changed
      };
    });

    // Extract MotionAware zones from behaviors and combine with motion status
    const motionZones = behaviorsData.data
      .filter(behavior =>
        behavior.configuration?.motion?.motion_service?.rtype === 'convenience_area_motion'
      )
      .map(behavior => {
        const motionServiceId = behavior.configuration.motion.motion_service.rid;
        const status = motionStatusMap[motionServiceId] || {};

        return {
          id: behavior.id,
          name: behavior.metadata?.name || 'Unknown Zone',
          motionDetected: status.motionDetected || false,
          enabled: behavior.enabled && status.enabled,
          reachable: status.motionValid !== false,
          lastChanged: status.lastChanged
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    return motionZones;
  };

  // Fetch MotionAware data using API
  const fetchSensors = async () => {
    try {
      // Fetch behaviors (for zone names)
      const behaviorsData = await hueApi.getResource(bridgeIp, username, 'behavior_instance');

      // Fetch convenience_area_motion (for motion status)
      const motionAreasData = await hueApi.getResource(bridgeIp, username, 'convenience_area_motion');

      setBehaviors(behaviorsData);
      setMotionAreas(motionAreasData);
      setError(null);
    } catch (err) {
      console.error('[MotionZones] Failed to fetch MotionAware data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (bridgeIp && username) {
      fetchSensors();
    }
  }, [bridgeIp, username]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!bridgeIp || !username) return;

    const intervalId = setInterval(() => {
      fetchSensors();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [bridgeIp, username]);

  const motionSensors = getMotionSensors(behaviors, motionAreas);

  // Don't render if no MotionAware zones found
  if (!loading && motionSensors.length === 0) {
    return null;
  }

  return (
    <div className="motion-zones">
      <div className="motion-zones-header">
        <h3>Motion Zones</h3>
        {loading && <span className="loading-text">Loading sensors...</span>}
      </div>

      {error && (
        <div className="motion-zones-error">
          Failed to load sensors: {error}
        </div>
      )}

      {!loading && motionSensors.length > 0 && (
        <div className="motion-zones-row">
          {motionSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`motion-zone ${!sensor.reachable ? 'unreachable' : ''}`}
              title={!sensor.reachable ? 'Sensor unreachable' : ''}
            >
              <span className={`motion-dot ${sensor.motionDetected ? 'active' : 'inactive'}`}>
                {sensor.motionDetected ? '🔴' : '🟢'}
              </span>
              <span className="motion-zone-name">{sensor.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
