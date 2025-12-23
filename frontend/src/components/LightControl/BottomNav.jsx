import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';

// Room icons based on common room names
const getRoomIcon = (name) => {
  const lower = name?.toLowerCase() || '';
  if (lower.includes('living')) return '🛋️';
  if (lower.includes('bedroom') || lower.includes('bed room')) return '🛏️';
  if (lower.includes('kitchen')) return '🍳';
  if (lower.includes('bathroom') || lower.includes('bath')) return '🚿';
  if (lower.includes('office') || lower.includes('study')) return '💼';
  if (lower.includes('dining')) return '🍽️';
  if (lower.includes('garage')) return '🚗';
  if (lower.includes('garden') || lower.includes('outdoor') || lower.includes('patio')) return '🌳';
  if (lower.includes('hall') || lower.includes('entry') || lower.includes('foyer')) return '🚪';
  if (lower.includes('basement')) return '🏠';
  if (lower.includes('attic')) return '🏠';
  if (lower.includes('nursery') || lower.includes('kid')) return '🧸';
  if (lower.includes('gym') || lower.includes('exercise')) return '🏋️';
  if (lower.includes('laundry')) return '🧺';
  return '💡';
};

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
            <span className="nav-tab-icon">{getRoomIcon(room.name)}</span>
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
          <span className="nav-tab-icon">📦</span>
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
