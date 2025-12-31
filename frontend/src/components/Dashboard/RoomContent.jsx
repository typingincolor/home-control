import PropTypes from 'prop-types';
import { LightTile } from './LightTile';
import { SceneTile } from './SceneTile';
import { AllOnOffTile } from './AllOnOffTile';
import { Home, LightbulbOff } from './Icons';

export const RoomContent = ({
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  onColorTemperatureChange,
  togglingLights = new Set(),
  isActivatingScene = false,
}) => {
  if (!room) {
    return (
      <div className="empty-state-dark">
        <Home size={48} className="empty-state-dark-icon" />
        <div className="empty-state-dark-text">Select a room from the navigation below</div>
      </div>
    );
  }

  const { lights = [], scenes = [] } = room;
  // Calculate from actual light states (not pre-computed stats) so toggle updates immediately
  const lightsOn = lights.filter((l) => l.on).length;
  const anyOn = lightsOn > 0;

  if (lights.length === 0) {
    return (
      <div className="room-content">
        <div className="empty-state-dark">
          <LightbulbOff size={48} className="empty-state-dark-icon" />
          <div className="empty-state-dark-text">No lights in this room</div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-content">
      <div className="tiles-grid">
        {/* Row 1: All On/Off tile + Scene tiles */}
        <AllOnOffTile
          anyOn={anyOn}
          onToggle={onToggleRoom}
          roomId={room.id}
          isToggling={isActivatingScene}
        />
        {scenes.map((scene) => (
          <SceneTile
            key={scene.id}
            scene={scene}
            onActivate={onActivateScene}
            isActivating={isActivatingScene}
          />
        ))}

        {/* Row 2: Light tiles */}
        {lights.map((light) => (
          <LightTile
            key={light.id}
            light={light}
            onToggle={onToggleLight}
            onColorTemperatureChange={onColorTemperatureChange}
            isToggling={togglingLights.has(light.id)}
          />
        ))}
      </div>
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
      averageBrightness: PropTypes.number,
    }),
  }),
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  onColorTemperatureChange: PropTypes.func,
  togglingLights: PropTypes.instanceOf(Set),
  isActivatingScene: PropTypes.bool,
};
