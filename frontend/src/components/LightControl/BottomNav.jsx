import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Home, Grid } from './Icons';

export const BottomNav = ({
  rooms = [],
  zones = [],
  selectedId,
  onSelect
}) => {
  const isZonesSelected = selectedId === 'zones';

  return (
    <nav className="bottom-nav">
      {rooms.map((room) => {
        const isActive = selectedId === room.id;
        const lightsOn = room.stats?.lightsOnCount || 0;

        return (
          <button
            key={room.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(room.id)}
          >
            <Home size={28} className="nav-tab-icon" />
            <span className="nav-tab-label">{room.name}</span>
            {lightsOn > 0 && (
              <span className="nav-tab-badge">{lightsOn}</span>
            )}
          </button>
        );
      })}

      {zones.length > 0 && (
        <button
          className={`nav-tab ${isZonesSelected ? 'active' : ''}`}
          onClick={() => onSelect('zones')}
        >
          <Grid size={28} className="nav-tab-icon" />
          <span className="nav-tab-label">{UI_TEXT.NAV_ZONES}</span>
          <span className="nav-tab-badge">{zones.length}</span>
        </button>
      )}
    </nav>
  );
};

BottomNav.propTypes = {
  rooms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        lightsOnCount: PropTypes.number
      })
    })
  ),
  zones: PropTypes.array,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};
