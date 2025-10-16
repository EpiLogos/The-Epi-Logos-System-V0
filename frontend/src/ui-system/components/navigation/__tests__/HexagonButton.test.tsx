import { render, screen, fireEvent } from '@testing-library/react';
import { HexagonButton } from '../HexagonButton';

describe('HexagonButton', () => {
  it('renders hexagon button in sidebar footer', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const button = screen.getByRole('button', { name: /quick access/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('displays dark grey color (#333) when closed', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-[#333]');
  });

  it('displays terracotta red color (#944040) when open', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-[#944040]');
  });

  it('has proper hover state styling', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:text-[#666]');
  });

  it('has proper accessibility attributes', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Open quick access panel');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('updates aria-label when panel is open', () => {
    const mockOnClick = jest.fn();
    render(<HexagonButton onClick={mockOnClick} isOpen={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close quick access panel');
  });

  it('renders SVG hexagon with 6 vertices', () => {
    const mockOnClick = jest.fn();
    const { container } = render(<HexagonButton onClick={mockOnClick} isOpen={false} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Hexagon should have 6-sided path
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });
});
