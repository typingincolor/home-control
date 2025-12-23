import PropTypes from 'prop-types';

// Reusable SVG icon component
const Icon = ({ children, size = 24, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

Icon.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object
};

// Light bulb - on state (filled)
export const LightbulbOn = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21h6" />
    <path d="M10 17h4" />
    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6z" fill="currentColor" strokeWidth="1.5" />
  </Icon>
);

LightbulbOn.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Light bulb - off state (outline only)
export const LightbulbOff = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21h6" />
    <path d="M10 17h4" />
    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6z" />
  </Icon>
);

LightbulbOff.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Loading spinner
export const Spinner = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={`icon-spin ${className}`} style={style}>
    <path d="M12 2v4" />
    <path d="M12 18v4" opacity="0.3" />
    <path d="M4.93 4.93l2.83 2.83" opacity="0.9" />
    <path d="M16.24 16.24l2.83 2.83" opacity="0.2" />
    <path d="M2 12h4" opacity="0.7" />
    <path d="M18 12h4" opacity="0.4" />
    <path d="M4.93 19.07l2.83-2.83" opacity="0.5" />
    <path d="M16.24 7.76l2.83-2.83" opacity="0.6" />
  </Icon>
);

Spinner.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Moon icon (for "turn off")
export const Moon = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

Moon.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Sun icon (for "turn on")
export const Sun = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Icon>
);

Sun.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Home icon (for rooms)
export const Home = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

Home.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Grid icon (for zones)
export const Grid = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Icon>
);

Grid.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Power icon (for toggle buttons)
export const Power = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </Icon>
);

Power.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Logout icon
export const Logout = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

Logout.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };
