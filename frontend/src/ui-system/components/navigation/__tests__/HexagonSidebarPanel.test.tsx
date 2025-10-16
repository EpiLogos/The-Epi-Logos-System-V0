import { render, screen, fireEvent } from '@testing-library/react';
import { HexagonSidebarPanel } from '../HexagonSidebarPanel';

const mockSubsystems = [
  {
    id: '1',
    coordinate: '#1',
    name: 'Paramasiva',
    icon: '/ui-system/paramasiva-icon.png',
    leftFeature: { label: 'Coming soon', comingSoon: true },
    rightFeature: { label: 'Coming soon', comingSoon: true },
  },
  {
    id: '4',
    coordinate: '#4',
    name: 'Nara',
    icon: '/ui-system/nara-icon.png',
    leftFeature: { label: 'Journal', route: '/nara/journal', comingSoon: false },
    rightFeature: { label: 'Pratibimba', route: '/nara/pratibimba', comingSoon: false },
  },
  {
    id: '5',
    coordinate: '#5',
    name: 'Epii',
    icon: '/ui-system/epii-icon.png',
    leftFeature: { label: 'Etymology', route: '/epii/etymology', comingSoon: false },
    rightFeature: { label: 'Bimba Explorer', route: '/epii/bimba-explorer', comingSoon: false },
  },
];

describe('HexagonSidebarPanel', () => {
  const mockOnToggleCollapse = jest.fn();

  it('renders panel header with "QUICK ACCESS" title', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    expect(screen.getByText('QUICK ACCESS')).toBeInTheDocument();
  });

  it('renders SidebarToggle component', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    // SidebarToggle renders a button - verify it exists
    const toggleButtons = screen.getAllByRole('button');
    expect(toggleButtons.length).toBeGreaterThan(0);
  });

  it('renders close hexagon icon button at bottom center', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close quick access/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close quick access/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders content area for 3x2 subsystem grid', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    const { container } = render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const contentArea = container.querySelector('.hexagon-panel-content');
    expect(contentArea).toBeInTheDocument();
  });

  it('renders footer area for action buttons', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    const { container } = render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const footerArea = container.querySelector('.hexagon-panel-footer');
    expect(footerArea).toBeInTheDocument();
  });

  it('has sidebar background color (#f5f5f5)', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    const { container } = render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const panel = container.firstChild;
    expect(panel).toHaveClass('bg-[#f5f5f5]');
  });

  it('has fade-in animation by default', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    const { container } = render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const panel = container.firstChild;
    expect(panel).toHaveClass('animate-fade-in');
  });

  it('has fade-out animation when transitioning', () => {
    const mockOnClose = jest.fn();
    const mockOnFeatureClick = jest.fn();

    const { container } = render(
      <HexagonSidebarPanel
        subsystems={mockSubsystems}
        onClose={mockOnClose}
        onFeatureClick={mockOnFeatureClick}
        onNotesClick={jest.fn()}
        onChatClick={jest.fn()}
        isCollapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
        isTransitioning={true}
      />
    );

    const panel = container.firstChild;
    expect(panel).toHaveClass('animate-fade-out');
  });
});
