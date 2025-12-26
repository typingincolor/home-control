import { describe, it, expect, vi, beforeEach } from 'vitest';
import automationService from '../../services/automationService.js';

// Mock hueClient
const mockHueClient = {
  getResource: vi.fn(),
  triggerSmartScene: vi.fn(),
};

vi.mock('../../services/hueClientFactory.js', () => ({
  getHueClientForBridge: vi.fn(() => mockHueClient),
}));

describe('AutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseAutomations', () => {
    it('should return empty array when behaviorsData is null', () => {
      const result = automationService.parseAutomations(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when behaviorsData.data is undefined', () => {
      const result = automationService.parseAutomations({});
      expect(result).toEqual([]);
    });

    it('should parse behavior_instance automations correctly', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Go to sleep' },
            script_id: 'go_to_sleep',
            enabled: true,
            configuration: {
              when: { time_point: { time: { hour: 22, minute: 30 } } },
            },
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'behavior-1',
        name: 'Go to sleep',
        type: 'behavior_instance',
        scriptId: 'go_to_sleep',
        enabled: true,
        triggerTime: { hour: 22, minute: 30 },
      });
    });

    it('should handle missing metadata.name', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            script_id: 'wake_up',
            enabled: true,
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      expect(result[0].name).toBe('Unknown Automation');
    });

    it('should handle disabled automations', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Disabled Automation' },
            script_id: 'timer',
            enabled: false,
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      expect(result[0].enabled).toBe(false);
    });

    it('should filter out motion-related behavior_instances', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Go to sleep' },
            script_id: 'go_to_sleep',
            enabled: true,
          },
          {
            id: 'motion-behavior-1',
            metadata: { name: 'Living Room Motion' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rid: 'motion-sensor-1',
                  rtype: 'convenience_area_motion',
                },
              },
            },
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      // Should only include non-motion automations
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Go to sleep');
    });

    it('should sort automations alphabetically by name', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Zebra Automation' },
            script_id: 'timer',
            enabled: true,
          },
          {
            id: 'behavior-2',
            metadata: { name: 'Apple Automation' },
            script_id: 'wake_up',
            enabled: true,
          },
          {
            id: 'behavior-3',
            metadata: { name: 'Mango Automation' },
            script_id: 'go_to_sleep',
            enabled: true,
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      expect(result[0].name).toBe('Apple Automation');
      expect(result[1].name).toBe('Mango Automation');
      expect(result[2].name).toBe('Zebra Automation');
    });

    it('should handle missing script_id', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'No Script Automation' },
            enabled: true,
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      expect(result[0].scriptId).toBeUndefined();
    });

    it('should handle undefined enabled field as true', () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'No Enabled Field' },
            script_id: 'timer',
          },
        ],
      };

      const result = automationService.parseAutomations(behaviorsData);

      // Undefined enabled should be treated as enabled (default behavior)
      expect(result[0].enabled).toBe(true);
    });
  });

  describe('getAutomations', () => {
    const bridgeIp = '192.168.1.100';
    const username = 'test-user';

    it('should fetch behavior_instance resource and parse automations', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Go to sleep' },
            script_id: 'go_to_sleep',
            enabled: true,
          },
        ],
      };

      mockHueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce({ data: [] }) // rooms
        .mockResolvedValueOnce({ data: [] }); // lights

      const result = await automationService.getAutomations(bridgeIp, username);

      // CRITICAL: Should fetch behavior_instance, NOT smart_scene
      expect(mockHueClient.getResource).toHaveBeenCalledWith(
        bridgeIp,
        username,
        'behavior_instance'
      );
      expect(result.automations).toHaveLength(1);
      expect(result.automations[0].name).toBe('Go to sleep');
    });

    it('should return empty automations when none exist', async () => {
      mockHueClient.getResource
        .mockResolvedValueOnce({ data: [] }) // behaviors
        .mockResolvedValueOnce({ data: [] }) // rooms
        .mockResolvedValueOnce({ data: [] }); // lights

      const result = await automationService.getAutomations(bridgeIp, username);

      expect(result.automations).toHaveLength(0);
    });

    it('should throw error when hueClient fails', async () => {
      mockHueClient.getResource.mockRejectedValue(new Error('Network error'));

      await expect(automationService.getAutomations(bridgeIp, username)).rejects.toThrow(
        'Failed to get automations: Network error'
      );
    });

    it('should exclude motion behavior_instances from results', async () => {
      const behaviorsData = {
        data: [
          {
            id: 'behavior-1',
            metadata: { name: 'Go to sleep' },
            script_id: 'go_to_sleep',
            enabled: true,
          },
          {
            id: 'motion-behavior-1',
            metadata: { name: 'Living Room Motion' },
            enabled: true,
            configuration: {
              motion: {
                motion_service: {
                  rid: 'motion-sensor-1',
                  rtype: 'convenience_area_motion',
                },
              },
            },
          },
        ],
      };

      mockHueClient.getResource
        .mockResolvedValueOnce(behaviorsData)
        .mockResolvedValueOnce({ data: [] }) // rooms
        .mockResolvedValueOnce({ data: [] }); // lights

      const result = await automationService.getAutomations(bridgeIp, username);

      expect(result.automations).toHaveLength(1);
      expect(result.automations[0].name).toBe('Go to sleep');
    });
  });

  describe('triggerAutomation', () => {
    const bridgeIp = '192.168.1.100';
    const username = 'test-user';
    const automationId = 'behavior-1';

    it('should trigger automation successfully', async () => {
      mockHueClient.triggerSmartScene.mockResolvedValueOnce({ success: true });

      const result = await automationService.triggerAutomation(bridgeIp, username, automationId);

      expect(mockHueClient.triggerSmartScene).toHaveBeenCalledWith(
        bridgeIp,
        username,
        automationId
      );
      expect(result.success).toBe(true);
    });

    it('should throw error when trigger fails', async () => {
      mockHueClient.triggerSmartScene.mockRejectedValue(new Error('Trigger failed'));

      await expect(
        automationService.triggerAutomation(bridgeIp, username, automationId)
      ).rejects.toThrow('Failed to trigger automation: Trigger failed');
    });

    it('should throw error for invalid automation ID', async () => {
      mockHueClient.triggerSmartScene.mockRejectedValue(new Error('Resource not found'));

      await expect(
        automationService.triggerAutomation(bridgeIp, username, 'invalid-id')
      ).rejects.toThrow('Failed to trigger automation: Resource not found');
    });
  });
});
