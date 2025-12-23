import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';

export const TopToolbar = ({
  motionZones = [],
  summary = {},
  isConnected = true,
  isDemoMode = false,
  onLogout
}) => {
  const { lightsOn = 0, roomCount = 0, sceneCount = 0 } = summary;

  return (
    <div className="top-toolbar">
      <div className="toolbar-left">
        {motionZones.length > 0 && (
          <div className="toolbar-motion">
            <span className="toolbar-motion-label">{UI_TEXT.TOOLBAR_MOTION_LABEL}</span>
            <div className="toolbar-motion-dots">
              {motionZones.map((zone) => (
                <div key={zone.id} className="toolbar-motion-item">
                  <span className={`motion-dot ${zone.motionDetected ? 'active' : 'inactive'}`}>
                    {zone.motionDetected ? '🔴' : '🟢'}
                  </span>
                  <span>{zone.name?.replace(' MotionAware', '') || 'Zone'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-center">
        <div className="toolbar-stat">
          <span className="toolbar-stat-value">{lightsOn}</span>
          <span className="toolbar-stat-label">{UI_TEXT.LABEL_LIGHTS_ON}</span>
        </div>
        <div className="toolbar-stat">
          <span className="toolbar-stat-value">{roomCount}</span>
          <span className="toolbar-stat-label">{UI_TEXT.LABEL_ROOMS}</span>
        </div>
        <div className="toolbar-stat">
          <span className="toolbar-stat-value">{sceneCount}</span>
          <span className="toolbar-stat-label">{UI_TEXT.LABEL_SCENES}</span>
        </div>
      </div>

      <div className="toolbar-right">
        {isDemoMode && (
          <span className="toolbar-status" style={{ color: 'var(--accent-primary)' }}>
            {UI_TEXT.LABEL_DEMO_MODE}
          </span>
        )}
        <div className="toolbar-status">
          <span className={`toolbar-status-dot ${!isConnected ? 'disconnected' : ''}`} />
          <span>{isConnected ? UI_TEXT.STATUS_CONNECTED : 'Reconnecting...'}</span>
        </div>
        <button className="toolbar-logout" onClick={onLogout}>
          {UI_TEXT.BUTTON_LOGOUT}
        </button>
      </div>
    </div>
  );
};

TopToolbar.propTypes = {
  motionZones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      motionDetected: PropTypes.bool
    })
  ),
  summary: PropTypes.shape({
    lightsOn: PropTypes.number,
    roomCount: PropTypes.number,
    sceneCount: PropTypes.number
  }),
  isConnected: PropTypes.bool,
  isDemoMode: PropTypes.bool,
  onLogout: PropTypes.func.isRequired
};
