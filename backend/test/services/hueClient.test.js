import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the class methods, so we'll import the class
// and create instances or mock the _request method
describe('HueClient', () => {
  describe('getHierarchyData', () => {
    it('should fetch lights, rooms, and devices in parallel', async () => {
      // Import fresh instance for each test
      const { default: hueClient } = await import('../../services/hueClient.js');

      // Mock the individual methods
      const mockLights = { data: [{ id: 'light-1' }] };
      const mockRooms = { data: [{ id: 'room-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue(mockRooms);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);

      const result = await hueClient.getHierarchyData('192.168.1.100', 'test-user');

      expect(hueClient.getLights).toHaveBeenCalledWith('192.168.1.100', 'test-user');
      expect(hueClient.getRooms).toHaveBeenCalledWith('192.168.1.100', 'test-user');
      expect(hueClient.getDevices).toHaveBeenCalledWith('192.168.1.100', 'test-user');

      expect(result).toEqual({
        lightsData: mockLights,
        roomsData: mockRooms,
        devicesData: mockDevices
      });
    });

    it('should propagate errors from getLights', async () => {
      const { default: hueClient } = await import('../../services/hueClient.js');

      vi.spyOn(hueClient, 'getLights').mockRejectedValue(new Error('Connection failed'));
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue({ data: [] });
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue({ data: [] });

      await expect(hueClient.getHierarchyData('192.168.1.100', 'test-user'))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('getZoneHierarchyData', () => {
    it('should fetch lights, zones, and devices in parallel', async () => {
      const { default: hueClient } = await import('../../services/hueClient.js');

      const mockLights = { data: [{ id: 'light-1' }] };
      const mockZones = { data: [{ id: 'zone-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getZones').mockResolvedValue(mockZones);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);

      const result = await hueClient.getZoneHierarchyData('192.168.1.100', 'test-user');

      expect(hueClient.getLights).toHaveBeenCalledWith('192.168.1.100', 'test-user');
      expect(hueClient.getZones).toHaveBeenCalledWith('192.168.1.100', 'test-user');
      expect(hueClient.getDevices).toHaveBeenCalledWith('192.168.1.100', 'test-user');

      expect(result).toEqual({
        lightsData: mockLights,
        zonesData: mockZones,
        devicesData: mockDevices
      });
    });
  });

  describe('getDashboardData', () => {
    it('should fetch lights, rooms, devices, and scenes in parallel', async () => {
      const { default: hueClient } = await import('../../services/hueClient.js');

      const mockLights = { data: [{ id: 'light-1' }] };
      const mockRooms = { data: [{ id: 'room-1' }] };
      const mockDevices = { data: [{ id: 'device-1' }] };
      const mockScenes = { data: [{ id: 'scene-1' }] };

      vi.spyOn(hueClient, 'getLights').mockResolvedValue(mockLights);
      vi.spyOn(hueClient, 'getRooms').mockResolvedValue(mockRooms);
      vi.spyOn(hueClient, 'getDevices').mockResolvedValue(mockDevices);
      vi.spyOn(hueClient, 'getScenes').mockResolvedValue(mockScenes);

      const result = await hueClient.getDashboardData('192.168.1.100', 'test-user');

      expect(result).toEqual({
        lightsData: mockLights,
        roomsData: mockRooms,
        devicesData: mockDevices,
        scenesData: mockScenes
      });
    });
  });
});
