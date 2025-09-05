import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Epi-Logos System V0.1');
  });

  it('renders the description', () => {
    render(<Home />);
    
    const description = screen.getByText('Tri-laminar architecture for wisdom synthesis');
    expect(description).toBeInTheDocument();
  });
});
