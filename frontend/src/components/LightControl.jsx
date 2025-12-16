import { useEffect, useState } from 'react';
import { hueApi } from '../services/hueApi';
import { MotionZones } from './MotionZones';

export const LightControl = ({
  bridgeIp,
  username,
  onLogout
}) => {
  // API data
  const [lights, setLights] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [devices, setDevices] = useState(null);
  const [scenes, setScenes] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);

  // Initial data fetch on mount
  useEffect(() => {
    if (bridgeIp && username) {
      fetchAllData();
    }
  }, [bridgeIp, username]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!bridgeIp || !username) return;

    const intervalId = setInterval(() => {
      console.log('[Auto-refresh] Refreshing all data...');
      fetchAllData();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [bridgeIp, username]);

  // Fetch all data from API
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
        hueApi.getLights(bridgeIp, username),
        hueApi.getRooms(bridgeIp, username),
        hueApi.getResource(bridgeIp, username, 'device'),
        hueApi.getScenes(bridgeIp, username)
      ]);

      setLights(lightsData);
      setRooms(roomsData);
      setDevices(devicesData);
      setScenes(scenesData);

      console.log('[ConnectionTest] Fetched all data successfully');
    } catch (err) {
      console.error('[ConnectionTest] Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get light by UUID
  const getLightByUuid = (uuid) => {
    return lights?.data?.find(light => light.id === uuid);
  };

  // Helper: Get room by UUID
  const getRoomByUuid = (uuid) => {
    return rooms?.data?.find(room => room.id === uuid);
  };

  const toggleLight = async (lightUuid) => {
    setTogglingLights(prev => new Set(prev).add(lightUuid));

    try {
      const light = getLightByUuid(lightUuid);
      if (!light) throw new Error('Light not found');

      const currentState = light.on?.on || false;
      const newState = { on: { on: !currentState } };

      await hueApi.setLightState(bridgeIp, username, lightUuid, newState);

      // Update local state for responsive UI
      setLights(prev => ({
        ...prev,
        data: prev.data.map(l =>
          l.id === lightUuid
            ? { ...l, on: { on: !currentState } }
            : l
        )
      }));
    } catch (err) {
      console.error('Failed to toggle light:', err);
      alert(`Failed to toggle light: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        newSet.delete(lightUuid);
        return newSet;
      });
    }
  };

  const toggleRoom = async (lightUuids, turnOn) => {
    setTogglingLights(prev => {
      const newSet = new Set(prev);
      lightUuids.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: { on: turnOn } };

      await Promise.all(
        lightUuids.map(uuid => hueApi.setLightState(bridgeIp, username, uuid, newState))
      );

      // Update local state
      setLights(prev => ({
        ...prev,
        data: prev.data.map(l =>
          lightUuids.includes(l.id)
            ? { ...l, on: { on: turnOn } }
            : l
        )
      }));
    } catch (err) {
      console.error('Failed to toggle room:', err);
      alert(`Failed to toggle room lights: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        lightUuids.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSceneChange = async (sceneUuid, roomName) => {
    if (!sceneUuid) return;

    setActivatingScene(sceneUuid);
    try {
      await hueApi.activateScene(bridgeIp, username, sceneUuid);
      console.log(`Activated scene ${sceneUuid} for room ${roomName}`);
      // Refresh lights to show updated states
      setTimeout(() => fetchAllData(), 500);
    } catch (err) {
      console.error('Failed to activate scene:', err);
      alert(`Failed to activate scene: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  // Get scenes for a specific room UUID
  const getScenesForRoom = (roomUuid) => {
    if (!scenes?.data) return [];

    return scenes.data
      .filter(scene => scene.group?.rid === roomUuid)
      .map(scene => ({
        uuid: scene.id,
        name: scene.metadata?.name || 'Unknown Scene'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Build room → device → lights hierarchy
  const getLightsByRoom = () => {
    if (!lights?.data || !rooms?.data || !devices?.data) return null;

    // Build device → lights map
    const deviceToLights = {};
    devices.data.forEach(device => {
      const lightUuids = device.services
        ?.filter(s => s.rtype === 'light')
        .map(s => s.rid) || [];
      deviceToLights[device.id] = lightUuids;
    });

    const roomMap = {};

    // Build rooms with their lights
    rooms.data.forEach(room => {
      const lightUuids = [];

      // Get lights from room's devices
      room.children?.forEach(child => {
        if (child.rtype === 'device') {
          const deviceLights = deviceToLights[child.rid] || [];
          lightUuids.push(...deviceLights);
        } else if (child.rtype === 'light') {
          lightUuids.push(child.rid);
        }
      });

      if (lightUuids.length > 0) {
        roomMap[room.metadata?.name || 'Unknown Room'] = {
          roomUuid: room.id,
          lightUuids: [...new Set(lightUuids)], // Deduplicate
          lights: lightUuids
            .map(uuid => getLightByUuid(uuid))
            .filter(Boolean)
        };
      }
    });

    // Add unassigned lights
    const assignedLightUuids = new Set(
      Object.values(roomMap).flatMap(r => r.lightUuids)
    );
    const unassignedLights = lights.data.filter(
      light => !assignedLightUuids.has(light.id)
    );

    if (unassignedLights.length > 0) {
      roomMap['Unassigned'] = {
        roomUuid: null,
        lightUuids: unassignedLights.map(l => l.id),
        lights: unassignedLights
      };
    }

    return roomMap;
  };

  const lightsCount = lights?.data?.length || 0;
  const lightsByRoom = getLightsByRoom();

  return (
    <div className="light-control">
      <div className="header-with-status">
        <h2>Light Control</h2>
        <div className="header-actions">
          <div className="status-indicator connected" title="Connected to bridge"></div>
          {onLogout && (
            <button onClick={onLogout} className="logout-button" title="Logout and disconnect">
              Logout
            </button>
          )}
        </div>
      </div>

      {loading && !lights && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to bridge...</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <h4>Connection Failed</h4>
          <p className="error-message">{error}</p>
          <div className="troubleshooting">
            <h5>Troubleshooting:</h5>
            <ul>
              <li>Ensure your device is on the same network as the bridge</li>
              <li>Check if the bridge IP is correct: {bridgeIp}</li>
              <li>Make sure the proxy server is running</li>
            </ul>
          </div>
        </div>
      )}

      {lights && !error && (
        <>
          <MotionZones bridgeIp={bridgeIp} username={username} />

          <div className="lights-control">
          <div className="lights-header">
            <h3>Lights ({lightsCount})</h3>
          </div>

          {lightsByRoom ? (
            // Show lights grouped by room
            <div className="rooms-list">
              {Object.entries(lightsByRoom).map(([roomName, roomData]) => {
                // Check if any lights in room are on
                const anyLightsOn = roomData.lights.some(light => light.on?.on);
                const allLightsToggling = roomData.lightUuids.every(uuid => togglingLights.has(uuid));
                const roomScenes = roomData.roomUuid ? getScenesForRoom(roomData.roomUuid) : [];
                const isActivating = activatingScene && roomScenes.some(s => s.uuid === activatingScene);

                return (
                  <div key={roomName} className="room-group">
                    <div className="room-header">
                      <h4 className="room-name">{roomName}</h4>
                      <div className="room-controls">
                        {roomScenes.length > 0 && (
                          <div className="scene-control">
                            <select
                              onChange={(e) => handleSceneChange(e.target.value, roomName)}
                              disabled={isActivating}
                              className="scene-selector"
                              value=""
                            >
                              <option value="">
                                {isActivating ? '⏳ Activating...' : '🎨 Select Scene'}
                              </option>
                              {roomScenes.map((scene) => (
                                <option key={scene.uuid} value={scene.uuid}>
                                  {scene.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          onClick={() => toggleRoom(roomData.lightUuids, !anyLightsOn)}
                          disabled={allLightsToggling}
                          className="room-control-button"
                        >
                          {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 All Off' : '💡 All On'}
                        </button>
                      </div>
                    </div>
                    <div className="room-lights-grid">
                    {roomData.lights.map((light) => (
                      <div key={light.id} className="light-card">
                        <button
                          onClick={() => toggleLight(light.id)}
                          disabled={togglingLights.has(light.id)}
                          className={`light-bulb-button ${light.on?.on ? 'on' : 'off'}`}
                        >
                          {togglingLights.has(light.id) ? (
                            <span className="bulb-loading">⏳</span>
                          ) : (
                            <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                              <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                            </svg>
                          )}
                        </button>
                        <span className="light-label">{light.metadata?.name || 'Unknown Light'}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show lights without grouping (fallback)
            <div className="lights-grid-simple">
              {lights?.data?.map((light) => (
                <div key={light.id} className="light-card">
                  <button
                    onClick={() => toggleLight(light.id)}
                    disabled={togglingLights.has(light.id)}
                    className={`light-bulb-button ${light.on?.on ? 'on' : 'off'}`}
                  >
                    {togglingLights.has(light.id) ? (
                      <span className="bulb-loading">⏳</span>
                    ) : (
                      <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                      </svg>
                    )}
                  </button>
                  <span className="light-label">{light.metadata?.name || 'Unknown Light'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};
