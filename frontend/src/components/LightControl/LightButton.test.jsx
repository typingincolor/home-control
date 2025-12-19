import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightButton } from './LightButton';

// Mock the color utilities
vi.mock('../../utils/colorConversion', () => ({
  getLightColor: vi.fn((light) => {
    if (!light.on?.on) return null;
    return 'rgb(255, 200, 100)';
  }),
  getLightShadow: vi.fn((light, color) => {
    if (!color || !light.on?.on) return null;
    return '0 4px 8px rgba(255, 200, 100, 0.5)';
  })
}));

describe('LightButton', () => {
  const mockLight = {
    id: 'light-1',
    on: { on: true },
    dimming: { brightness: 75 },
    metadata: { name: 'Living Room Light' }
  };

  it('should render light name', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
  });

  it('should show Unknown Light when name is missing', () => {
    const lightWithoutName = { ...mockLight, metadata: {} };
    const onToggle = vi.fn();
    render(<LightButton light={lightWithoutName} onToggle={onToggle} isToggling={false} />);

    expect(screen.getByText('Unknown Light')).toBeInTheDocument();
  });

  it('should call onToggle with light ID when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggle).toHaveBeenCalledWith('light-1');
  });

  it('should be disabled when toggling', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not be disabled when not toggling', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should have "on" class when light is on', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('on');
  });

  it('should have "off" class when light is off', () => {
    const offLight = { ...mockLight, on: { on: false } };
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={offLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('off');
  });

  it('should render bulb icon', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const svg = container.querySelector('.bulb-icon');
    expect(svg).toBeInTheDocument();
  });

  it('should apply custom style for light color', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button.style.background).toContain('rgb(255, 200, 100)');
  });

  it('should apply custom shadow style', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button.style.boxShadow).toBeTruthy();
  });

  it('should have correct structure', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    expect(container.querySelector('.light-card')).toBeInTheDocument();
    expect(container.querySelector('.light-bulb-button')).toBeInTheDocument();
    expect(container.querySelector('.light-label')).toBeInTheDocument();
  });

  it('should handle missing on state gracefully', () => {
    const lightWithoutOnState = {
      id: 'light-2',
      metadata: { name: 'Bedroom Light' }
    };
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={lightWithoutOnState} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('off'); // Should default to off
  });

  it('should handle isToggling undefined', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});
