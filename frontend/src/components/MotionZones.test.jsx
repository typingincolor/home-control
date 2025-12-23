import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MotionZones } from './MotionZones';

// Mock the hooks
vi.mock('../hooks/useHueApi', () => ({
  useHueApi: vi.fn()
}));

vi.mock('../hooks/useDemoMode', () => ({
  useDemoMode: vi.fn()
}));

import { useHueApi } from '../hooks/useHueApi';
import { useDemoMode } from '../hooks/useDemoMode';

describe('MotionZones', () => {
  const mockGetMotionZones = vi.fn();
  const mockApi = {
    getMotionZones: mockGetMotionZones
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useHueApi.mockReturnValue(mockApi);
    useDemoMode.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockZones = [
    {
      id: 'zone-1',
      name: 'Hallway MotionAware',
      motionDetected: false,
      enabled: true,
      reachable: true,
      lastChanged: '2025-12-23T10:30:00Z'
    },
    {
      id: 'zone-2',
      name: 'Bedroom MotionAware',
      motionDetected: true,
      enabled: true,
      reachable: true,
      lastChanged: '2025-12-23T10:45:00Z'
    }
  ];

  it('should render motion zones', async () => {
    render(<MotionZones sessionToken="test-session-token" motionZones={mockZones} />);

    await waitFor(() => {
      expect(screen.getByText('Motion Zones')).toBeInTheDocument();
    });

    expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
    expect(screen.getByText('Bedroom MotionAware')).toBeInTheDocument();
  });

  it('should show green dot when no motion detected', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" motionZones={mockZones} />);

    await waitFor(() => {
      expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
    });

    const motionZones = screen.getAllByText('🟢');
    expect(motionZones.length).toBeGreaterThan(0);
  });

  it('should show red dot when motion detected', async () => {
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" motionZones={mockZones} />);

    await waitFor(() => {
      expect(screen.getByText('Bedroom MotionAware')).toBeInTheDocument();
    });

    const motionZones = screen.getAllByText('🔴');
    expect(motionZones.length).toBeGreaterThan(0);
  });

  it('should return null when no zones found', () => {
    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when no motionZones prop provided', () => {
    render(<MotionZones sessionToken="test-session-token" />);

    expect(screen.getByText('Loading sensors...')).toBeInTheDocument();
  });

  it('should fallback to API in demo mode', async () => {
    useDemoMode.mockReturnValue(true);
    mockGetMotionZones.mockResolvedValue({ zones: mockZones });

    render(<MotionZones sessionToken="test-session-token" />);

    await waitFor(() => {
      expect(mockGetMotionZones).toHaveBeenCalledWith('test-session-token');
    });

    expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();
  });

  it('should mark unreachable zones', () => {
    const zonesWithUnreachable = [
      { ...mockZones[0], reachable: false }
    ];

    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={zonesWithUnreachable} />
    );

    expect(screen.getByText('Hallway MotionAware')).toBeInTheDocument();

    const unreachableZone = container.querySelector('.unreachable');
    expect(unreachableZone).toBeInTheDocument();
  });


  it('should handle zones without motion data gracefully', () => {
    const incompleteZones = [
      {
        id: 'zone-1',
        name: 'Test Zone',
        motionDetected: false,
        enabled: true,
        reachable: true
      }
    ];

    render(<MotionZones sessionToken="test-session-token" motionZones={incompleteZones} />);

    expect(screen.getByText('Test Zone')).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(
      <MotionZones sessionToken="test-session-token" motionZones={mockZones} />
    );

    expect(screen.getByText('Motion Zones')).toBeInTheDocument();

    expect(container.querySelector('.motion-zones')).toBeInTheDocument();
    expect(container.querySelector('.motion-zones-header')).toBeInTheDocument();
    expect(container.querySelector('.motion-zones-row')).toBeInTheDocument();
  });

  it('should not render when missing credentials', () => {
    const { container } = render(
      <MotionZones sessionToken="" />
    );

    // Should not make API call without credentials
    expect(mockGetMotionZones).not.toHaveBeenCalled();
  });
});
