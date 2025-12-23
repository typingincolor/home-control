import PropTypes from 'prop-types';
import { LightbulbOn, LightbulbOff, Spinner } from './Icons';

export const LightTile = ({ light, onToggle, isToggling }) => {
  const brightness = light.on ? (light.brightness || 0) : 0;
  const fillHeight = `${brightness}%`;

  // Fill color from backend, or default warm color
  const fillColor = light.color || 'rgb(255, 200, 130)';
  const fillGradient = `linear-gradient(to top, ${fillColor} 0%, ${adjustColor(fillColor, 20)} 100%)`;

  // Shadow only when brightness is high enough
  const shadowStyle = light.on && brightness >= 50 && light.shadow ? {
    boxShadow: light.shadow
  } : {};

  // Content color: dark on bright fills for contrast, light on dark/empty
  const contentColor = brightness > 50 ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';

  return (
    <button
      onClick={() => onToggle(light.id)}
      disabled={isToggling}
      className={`light-tile ${light.on ? 'on' : 'off'} ${isToggling ? 'toggling' : ''}`}
      style={shadowStyle}
    >
      {/* Brightness fill - rises from bottom */}
      <div
        className="light-tile-fill"
        style={{
          height: fillHeight,
          background: fillGradient
        }}
      />

      {/* Content layer */}
      <div className="light-tile-content">
        {isToggling ? (
          <Spinner size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : light.on ? (
          <LightbulbOn size={48} className="light-tile-icon" style={{ color: contentColor }} />
        ) : (
          <LightbulbOff size={48} className="light-tile-icon" style={{ color: contentColor }} />
        )}
        <span className="light-tile-name" style={{ color: contentColor }}>{light.name || 'Light'}</span>
      </div>
    </button>
  );
};

// Helper to adjust color brightness for gradient effect
function adjustColor(color, amount) {
  if (!color) return color;

  // Parse rgb(r, g, b) format
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;

  const r = Math.max(0, Math.min(255, parseInt(match[1]) + amount));
  const g = Math.max(0, Math.min(255, parseInt(match[2]) + amount));
  const b = Math.max(0, Math.min(255, parseInt(match[3]) + amount));

  return `rgb(${r}, ${g}, ${b})`;
}

LightTile.propTypes = {
  light: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    on: PropTypes.bool.isRequired,
    brightness: PropTypes.number,
    color: PropTypes.string,
    shadow: PropTypes.string
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  isToggling: PropTypes.bool
};
