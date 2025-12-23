import PropTypes from 'prop-types';
import { LightButton } from './LightButton';
import { SceneSelector } from './SceneSelector';

export const RoomCard = ({
  roomName,
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  togglingLights,
  isActivating
}) => {
  // Use pre-computed stats from backend
  const { lightsOnCount, totalLights, averageBrightness } = room.stats;
  const anyLightsOn = lightsOnCount > 0;

  // Get light UUIDs for toggling
  const lightUuids = room.lights.map(l => l.id);
  const allLightsToggling = lightUuids.every(uuid => togglingLights.has(uuid));

  return (
    <div className="room-group">
      <div className="room-header">
        <div className="room-title-row">
          <h4 className="room-name">{roomName}</h4>
          <div className="room-badges">
            <span className="room-status-badge">
              {lightsOnCount} of {totalLights} on
            </span>
            <span className="room-brightness-badge">
              {lightsOnCount > 0 ? `${Math.round(averageBrightness)}%` : '—'}
            </span>
          </div>
        </div>

        <div className="room-controls">
          <SceneSelector
            scenes={room.scenes}
            onActivate={onActivateScene}
            isActivating={isActivating}
          />
          <button
            onClick={() => onToggleRoom(room.id, lightUuids, !anyLightsOn)}
            disabled={allLightsToggling}
            className="room-control-button"
          >
            {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 All Off' : '💡 All On'}
          </button>
        </div>
      </div>

      <div className="room-lights-grid">
        {room.lights.map((light) => (
          <LightButton
            key={light.id}
            light={light}
            onToggle={onToggleLight}
            isToggling={togglingLights.has(light.id)}
          />
        ))}
      </div>
    </div>
  );
};

RoomCard.propTypes = {
  roomName: PropTypes.string.isRequired,
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    stats: PropTypes.shape({
      lightsOnCount: PropTypes.number.isRequired,
      totalLights: PropTypes.number.isRequired,
      averageBrightness: PropTypes.number.isRequired
    }).isRequired,
    lights: PropTypes.arrayOf(PropTypes.object).isRequired,
    scenes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired,
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set).isRequired,
  isActivating: PropTypes.bool
};
