import PropTypes from 'prop-types';

export const LightTile = ({ light, onToggle, isToggling }) => {
  // Use pre-computed color and shadow from backend
  const tileStyle = light.on && light.color ? {
    background: `linear-gradient(135deg, ${light.color} 0%, ${adjustColor(light.color, -20)} 100%)`,
    boxShadow: light.shadow
  } : {};

  return (
    <button
      onClick={() => onToggle(light.id)}
      disabled={isToggling}
      className={`light-tile ${light.on ? 'on' : 'off'} ${isToggling ? 'toggling' : ''}`}
      style={tileStyle}
    >
      {isToggling ? (
        <span className="light-tile-icon">⏳</span>
      ) : (
        <span className="light-tile-icon">{light.on ? '💡' : '🔌'}</span>
      )}
      <span className="light-tile-name">{light.name || 'Light'}</span>
      {light.on && light.brightness > 0 && (
        <span className="light-tile-brightness">{Math.round(light.brightness)}%</span>
      )}
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
