import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';

export const MotionZones = ({ sessionToken, motionZones }) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use WebSocket data if available, otherwise fallback to API
  useEffect(() => {
    if (motionZones) {
      // WebSocket data available (real-time)
      setZones(motionZones);
      setLoading(false);
      setError(null);
    } else if (sessionToken) {
      // Fallback: fetch from API (for demo mode or when backend doesn't send motionZones yet)
      const fetchSensors = async () => {
        try {
          const motionData = await api.getMotionZones(sessionToken);
          setZones(motionData.zones || []);
          setError(null);
        } catch (err) {
          console.error('[MotionZones] Failed to fetch MotionAware data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSensors();
    }
  }, [sessionToken, motionZones, api]);

  // Don't render if no MotionAware zones found
  if (!loading && zones.length === 0) {
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

      {!loading && zones.length > 0 && (
        <div className="motion-zones-row">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`motion-zone ${!zone.reachable ? 'unreachable' : ''}`}
              title={!zone.reachable ? 'Sensor unreachable' : ''}
            >
              <span className={`motion-dot ${zone.motionDetected ? 'active' : 'inactive'}`}>
                {zone.motionDetected ? '🔴' : '🟢'}
              </span>
              <span className="motion-zone-name">{zone.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MotionZones.propTypes = {
  sessionToken: PropTypes.string.isRequired,
  motionZones: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    motionDetected: PropTypes.bool.isRequired,
    enabled: PropTypes.bool,
    reachable: PropTypes.bool
  }))
};
