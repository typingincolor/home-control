import PropTypes from 'prop-types';
import { LightTile } from './LightTile';
import { SceneSelector } from './SceneSelector';
import { UI_TEXT } from '../../constants/uiText';

export const RoomContent = ({
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  togglingLights = new Set(),
  isActivatingScene = false
}) => {
  if (!room) {
    return (
      <div className="empty-state-dark">
        <div className="empty-state-dark-icon">🏠</div>
        <div className="empty-state-dark-text">Select a room from the navigation below</div>
      </div>
    );
  }

  const { lights = [], scenes = [], stats = {} } = room;
  const allOn = stats.lightsOnCount === stats.totalLights && stats.totalLights > 0;
  const anyOn = stats.lightsOnCount > 0;

  return (
    <div className="room-content">
      <div className="room-header-bar">
        <div className="scene-selector">
          <SceneSelector
            scenes={scenes}
            onActivate={onActivateScene}
            isActivating={isActivatingScene}
          />
        </div>
        <button
          className={`room-toggle-all ${allOn ? 'all-on' : ''}`}
          onClick={() => onToggleRoom(room.id, !anyOn)}
        >
          {anyOn ? `🌙 ${UI_TEXT.BUTTON_ALL_OFF}` : `💡 ${UI_TEXT.BUTTON_ALL_ON}`}
        </button>
      </div>

      {lights.length === 0 ? (
        <div className="empty-state-dark">
          <div className="empty-state-dark-icon">💡</div>
          <div className="empty-state-dark-text">No lights in this room</div>
        </div>
      ) : (
        <div className="light-tiles-grid">
          {lights.map((light) => (
            <LightTile
              key={light.id}
              light={light}
              onToggle={onToggleLight}
              isToggling={togglingLights.has(light.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

RoomContent.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    lights: PropTypes.array,
    scenes: PropTypes.array,
    stats: PropTypes.shape({
      lightsOnCount: PropTypes.number,
      totalLights: PropTypes.number,
      averageBrightness: PropTypes.number
    })
  }),
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set),
  isActivatingScene: PropTypes.bool
};
