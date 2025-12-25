// Re-export Lucide icons with consistent styling
// Using strokeWidth 1.5 to match our design
import {
  Lightbulb,
  Loader2,
  Moon as LucideMoon,
  Sun as LucideSun,
  Home as LucideHome,
  LayoutGrid,
  Power as LucidePower,
  LogOut,
  Sofa as LucideSofa,
  UtensilsCrossed,
  CookingPot,
  Bed as LucideBed,
  LampDesk,
  ShowerHead,
  Car as LucideCar,
  TreeDeciduous,
  DoorOpen,
  Menu as LucideMenu,
  X as LucideX,
  // Scene icons
  Sunrise,
  Sunset,
  Heart,
  Palette,
  Briefcase,
  Users,
  Focus,
  CloudMoon,
  Gamepad2,
  Sparkles,
  Coffee,
  Wine,
  Tv,
  PartyPopper,
  Flame,
  Snowflake,
  Zap,
  Eye,
  BookOpen,
  Music,
  Dumbbell,
  Bath,
  Baby,
  Star,
  // Weather icons
  Cloud as LucideCloud,
  CloudSun as LucideCloudSun,
  CloudRain as LucideCloudRain,
  CloudSnow as LucideCloudSnow,
  CloudDrizzle as LucideCloudDrizzle,
  CloudFog as LucideCloudFog,
  CloudLightning as LucideCloudLightning,
  Wind as LucideWind,
  Thermometer as LucideThermometer,
  MapPin as LucideMapPin,
  Settings as LucideSettings,
} from 'lucide-react';

// Default props for consistent styling
const defaultProps = {
  strokeWidth: 1.5,
};

// Light bulb - on state (filled)
export const LightbulbOn = (props) => (
  <Lightbulb {...defaultProps} fill="currentColor" {...props} />
);

// Light bulb - off state (outline only)
export const LightbulbOff = (props) => <Lightbulb {...defaultProps} {...props} />;

// Loading spinner with rotation animation

export const Spinner = ({ className = '', ...props }) => (
  <Loader2 {...defaultProps} className={`icon-spin ${className}`} {...props} />
);

// Moon icon (for "turn off")
export const Moon = (props) => <LucideMoon {...defaultProps} {...props} />;

// Sun icon (for "turn on")
export const Sun = (props) => <LucideSun {...defaultProps} {...props} />;

// Home icon (for rooms)
export const Home = (props) => <LucideHome {...defaultProps} {...props} />;

// Grid icon (for zones)
export const Grid = (props) => <LayoutGrid {...defaultProps} {...props} />;

// Power icon (for toggle buttons)
export const Power = (props) => <LucidePower {...defaultProps} {...props} />;

// Logout icon
export const Logout = (props) => <LogOut {...defaultProps} {...props} />;

// Menu icon (hamburger)
export const Menu = (props) => <LucideMenu {...defaultProps} {...props} />;

// X/Close icon
export const X = (props) => <LucideX {...defaultProps} {...props} />;

// Sofa icon (living room)
export const Sofa = (props) => <LucideSofa {...defaultProps} {...props} />;

// Dining table icon (dining room)
export const DiningTable = (props) => <UtensilsCrossed {...defaultProps} {...props} />;

// Saucepan/cooking pot icon (kitchen)
export const Saucepan = (props) => <CookingPot {...defaultProps} {...props} />;

// Bed icon (bedroom)
export const Bed = (props) => <LucideBed {...defaultProps} {...props} />;

// Desk lamp icon (office)
export const DeskLamp = (props) => <LampDesk {...defaultProps} {...props} />;

// Shower icon (bathroom)
export const Shower = (props) => <ShowerHead {...defaultProps} {...props} />;

// Car icon (garage)
export const Car = (props) => <LucideCar {...defaultProps} {...props} />;

// Tree icon (garden/outdoor)
export const Tree = (props) => <TreeDeciduous {...defaultProps} {...props} />;

// Door icon (hallway/entry)
export const Door = (props) => <DoorOpen {...defaultProps} {...props} />;

// ============================================
// Scene Icons
// ============================================

// Scene icon mapping - maps scene name patterns to icons
const sceneIconMap = {
  // Brightness/Energy scenes
  bright: Sun,
  energize: Zap,
  concentrate: Focus,
  focus: Focus,
  work: Briefcase,
  meeting: Users,
  read: BookOpen,
  reading: BookOpen,

  // Relaxation scenes
  relax: Sofa,
  calm: CloudMoon,
  dimmed: LucideMoon,
  nightlight: LucideMoon,
  night: LucideMoon,

  // Time of day scenes
  morning: Sunrise,
  sunrise: Sunrise,
  evening: Sunset,
  sunset: Sunset,

  // Dining/Social scenes
  dinner: UtensilsCrossed,
  dining: UtensilsCrossed,
  romantic: Heart,
  date: Heart,
  party: PartyPopper,

  // Activity scenes
  movie: Tv,
  tv: Tv,
  gaming: Gamepad2,
  game: Gamepad2,
  play: Gamepad2,
  music: Music,
  workout: Dumbbell,
  exercise: Dumbbell,

  // Mood scenes
  creative: Palette,
  warm: Flame,
  cozy: Flame,
  cool: Snowflake,
  arctic: Snowflake,

  // Special scenes
  welcome: DoorOpen,
  away: Eye,
  coffee: Coffee,
  wine: Wine,
  bath: Bath,
  spa: Bath,
  nap: LucideBed,
  sleep: LucideBed,
  baby: Baby,
  nursery: Baby,

  // Default
  default: Sparkles,
};

// Get the appropriate icon component for a scene name
export const getSceneIcon = (sceneName) => {
  if (!sceneName) return Sparkles;

  const normalizedName = sceneName.toLowerCase().trim();

  // Check for exact match first
  if (sceneIconMap[normalizedName]) {
    return sceneIconMap[normalizedName];
  }

  // Check for partial matches
  for (const [key, IconComponent] of Object.entries(sceneIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return IconComponent;
    }
  }

  // Default icon for custom/unknown scenes
  return Star;
};

// Scene icon component that auto-selects icon based on name

export const SceneIcon = ({ name, ...props }) => {
  // Get the icon component constructor - this is a valid pattern for dynamic icon selection
  const IconComponent = getSceneIcon(name);

  return <IconComponent {...defaultProps} {...props} />;
};

// ============================================
// Weather Icons
// ============================================

// Weather icon exports
export const Cloud = (props) => <LucideCloud {...defaultProps} {...props} />;
export const CloudSun = (props) => <LucideCloudSun {...defaultProps} {...props} />;
export const CloudRain = (props) => <LucideCloudRain {...defaultProps} {...props} />;
export const CloudSnow = (props) => <LucideCloudSnow {...defaultProps} {...props} />;
export const CloudDrizzle = (props) => <LucideCloudDrizzle {...defaultProps} {...props} />;
export const CloudFog = (props) => <LucideCloudFog {...defaultProps} {...props} />;
export const CloudLightning = (props) => <LucideCloudLightning {...defaultProps} {...props} />;
export const Wind = (props) => <LucideWind {...defaultProps} {...props} />;
export const Thermometer = (props) => <LucideThermometer {...defaultProps} {...props} />;
export const MapPin = (props) => <LucideMapPin {...defaultProps} {...props} />;
export const Settings = (props) => <LucideSettings {...defaultProps} {...props} />;

// Weather code to icon mapping
// See: https://open-meteo.com/en/docs#weathervariables
const weatherIconMap = {
  // Clear sky
  0: LucideSun,
  // Mainly clear, partly cloudy
  1: LucideCloudSun,
  2: LucideCloudSun,
  // Overcast
  3: LucideCloud,
  // Fog
  45: LucideCloudFog,
  48: LucideCloudFog,
  // Drizzle
  51: LucideCloudDrizzle,
  53: LucideCloudDrizzle,
  55: LucideCloudDrizzle,
  56: LucideCloudDrizzle,
  57: LucideCloudDrizzle,
  // Rain
  61: LucideCloudRain,
  63: LucideCloudRain,
  65: LucideCloudRain,
  66: LucideCloudRain,
  67: LucideCloudRain,
  // Snow
  71: LucideCloudSnow,
  73: LucideCloudSnow,
  75: LucideCloudSnow,
  77: LucideCloudSnow,
  // Rain showers
  80: LucideCloudRain,
  81: LucideCloudRain,
  82: LucideCloudRain,
  // Snow showers
  85: LucideCloudSnow,
  86: LucideCloudSnow,
  // Thunderstorm
  95: LucideCloudLightning,
  96: LucideCloudLightning,
  99: LucideCloudLightning,
};

/**
 * Get the weather icon component for a weather code
 * @param {number} weatherCode - Open-Meteo weather code
 * @returns {React.Component} Icon component
 */
export const getWeatherIcon = (weatherCode) => {
  return weatherIconMap[weatherCode] || LucideSun;
};

/**
 * Weather icon component that auto-selects icon based on weather code
 */
export const WeatherIcon = ({ code, ...props }) => {
  const IconComponent = getWeatherIcon(code);
  return <IconComponent {...defaultProps} {...props} />;
};
