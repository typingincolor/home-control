import PropTypes from 'prop-types';

export const SceneSelector = ({ scenes, onActivate, isActivating }) => {
  if (!scenes || scenes.length === 0) return null;

  return (
    <div className="scene-control">
      <select
        onChange={(e) => {
          if (e.target.value) {
            onActivate(e.target.value);
            e.target.value = '';
          }
        }}
        disabled={isActivating}
        className="scene-selector"
        value=""
      >
        <option value="">
          {isActivating ? '⏳ Activating...' : '🎨 Select Scene'}
        </option>
        {scenes.map((scene) => (
          <option key={scene.id} value={scene.id}>
            {scene.name}
          </option>
        ))}
      </select>
    </div>
  );
};

SceneSelector.propTypes = {
  scenes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onActivate: PropTypes.func.isRequired,
  isActivating: PropTypes.bool
};
