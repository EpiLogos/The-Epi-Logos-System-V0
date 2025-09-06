# Living Placeholder System

A comprehensive design laboratory and placeholder system for undeveloped coordinate pages in the Epi-Logos System.

## Overview

The Living Placeholder system provides polished temporary experiences for coordinate pages that lack full UI/UX development. It leverages the existing coordinate resolution system and includes development mode for live design experimentation.

## Components

### Core Components

1. **PlaceholderPageTemplate** - Main template with navbar, coordinate display, and dev mode
2. **LivingPlaceholder** - The placeholder content with multiple template variations
3. **CoordinateDisplay** - Navbar component showing coordinate info with hover details
4. **DevModeModal** - Development mode controls for live styling experimentation

### Supporting Components

- **useCoordinateDisplay** - Hook for coordinate data management and caching

## Quick Start

### Basic Placeholder Page

```tsx
import { PlaceholderPageTemplate } from '@/components/placeholder/PlaceholderPageTemplate';

export default function CoordinatePage() {
  return (
    <PlaceholderPageTemplate
      coordinate="#2-3"  // Your coordinate
      enableDevMode={true}  // Enable in development
      onFeatureReady={() => {
        // Handle feature activation
        console.log('Feature ready!');
      }}
    />
  );
}
```

### Using Individual Components

```tsx
import { LivingPlaceholder } from '@/components/placeholder/LivingPlaceholder';
import { useCoordinateDisplay } from '@/components/placeholder/useCoordinateDisplay';

export function CustomPlaceholder({ coordinate }: { coordinate: string }) {
  const { coordinateData, isLoading, error } = useCoordinateDisplay({
    coordinate,
    autoResolve: true
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LivingPlaceholder
      coordinate={coordinateData}
      templateVariation="canvas"  // 'canvas' | 'card' | 'dynamic'
      replacementReady={false}
    />
  );
}
```

## Template Variations

### Canvas Style
Interactive canvas-like interface with coordinate visualization.

### Card Layout
Clean card-based information display with hover effects.

### Dynamic Flow
Flowing particle animations and dynamic visual elements.

## Development Mode

Development mode provides live design experimentation:

- **Coordinate Switching**: Test designs across different coordinates
- **Template Variations**: Switch between canvas, card, and dynamic styles
- **Live Styling Controls**: Real-time CSS adjustments
- **Export Settings**: Save successful design patterns

### Keyboard Shortcuts
- `Ctrl/Cmd + Shift + D`: Toggle development mode

### Usage

Development mode is automatically enabled in development environment and can be controlled:

```tsx
<PlaceholderPageTemplate
  coordinate="#1-2"
  enableDevMode={process.env.NODE_ENV === 'development'}
/>
```

## Styling

The system uses Tailwind CSS v4 with custom CSS-in-JS for component-specific styles. Styling is theme-aware based on subsystem colors:

- **#0 Anuttara**: Purple theme
- **#1 Paramasiva**: Pink theme  
- **#2 Parashakti**: Green theme
- **#3 Mahamaya**: Yellow theme
- **#4 Nara**: Red theme
- **#5 Epii**: Blue theme

## Integration with Existing Pages

To convert an existing coordinate page to use the placeholder system:

1. Replace your current page component with `PlaceholderPageTemplate`
2. Pass the coordinate string
3. Enable development mode for design testing
4. When your real feature is ready, implement a conditional render:

```tsx
import { PlaceholderPageTemplate } from '@/components/placeholder/PlaceholderPageTemplate';
import { RealFeatureComponent } from './RealFeatureComponent';

export default function CoordinatePage() {
  const hasRealFeature = checkFeatureStatus('#2-3');
  
  if (hasRealFeature) {
    return <RealFeatureComponent coordinate="#2-3" />;
  }
  
  return (
    <PlaceholderPageTemplate
      coordinate="#2-3"
      onFeatureReady={() => {
        // Handle activation request
        window.location.reload(); // Simple approach
      }}
    />
  );
}
```

## Testing

The system includes comprehensive tests for all components. To run tests:

```bash
# Run all placeholder tests
npm test src/components/placeholder/

# Run specific component tests  
npm test src/components/coordinate/
```

## Browser Testing

A demo page is available at `/placeholder-demo` when running in development mode. This page demonstrates:

- All template variations
- Development mode functionality
- Coordinate display integration
- Live styling controls

Visit `http://localhost:3000/placeholder-demo` to see the system in action.

## Architecture

The system follows the Decoupled Domain Pattern:

- **Domain Logic**: Coordinate resolution and styling calculations
- **Custom Hooks**: React state management and data fetching
- **Components**: Pure presentation layer consuming hooks

This ensures:
- Easy testing and maintenance
- Clean separation of concerns  
- Reusable patterns across the application

## Performance

- **Coordinate Caching**: Prevents repeated API calls
- **Lazy Loading**: Components load on demand
- **Minimal Dependencies**: Lightweight implementation
- **CSS-in-JS Optimization**: Scoped styles with minimal runtime impact

## Future Development

The placeholder system is designed for easy replacement:

1. Develop your real feature alongside the placeholder
2. Test using the same coordinate resolution system
3. Replace the placeholder with a simple conditional render
4. No navigation or routing changes required

This approach ensures continuity during development and provides users with a polished experience throughout the development process.