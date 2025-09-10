# Frontend Layer - Experience Vessel

The Frontend Layer serves as the **Experience Vessel** of the Epi-Logos System, providing an intuitive and powerful interface for users to interact with the six-subsystem coordinate architecture.

## Architecture Overview

### Core Principles
- **Domain-Driven Design** - Clean separation of business logic and UI
- **Decoupled Domain Pattern** - Power Plant → Wall Sockets → Appliances
- **Subsystem-Aware UI** - Coordinate-based navigation and theming
- **Progressive Web App** - Modern web capabilities with offline support
- **Type-Safe Integration** - End-to-end TypeScript with GraphQL

### Technology Stack
- **Next.js 15** - App Router with React 19
- **Tailwind CSS v4** - CSS-first configuration with @theme directive
- **TypeScript** - Comprehensive type safety
- **GraphQL** - Coordinate resolution and data fetching

## Domain-Driven Architecture

### Three-Layer Pattern

#### 1. Domain Layer (Power Plant)
Pure TypeScript functions with zero dependencies:
```typescript
// domains/auth/auth.domain.ts
export const processSignIn = (
  state: AuthState, 
  user: User, 
  tokens: AuthTokens
): AuthState => {
  // Pure business logic
  return createAuthenticatedState(user, tokens);
};
```

#### 2. Orchestration Layer (Wall Sockets)
React hooks that bridge domain logic with UI:
```typescript
// subsystems/auth/useAuth.ts
export function useAuth() {
  const [state, setState] = useState(initialAuthState);
  
  const signIn = useCallback(async (credentials) => {
    const newState = processSignIn(state, user, tokens);
    setState(newState);
  }, [state]);
  
  return { ...state, signIn };
}
```

#### 3. Component Layer (Appliances)
Presentation components with minimal logic:
```typescript
// components/auth/SignInForm.tsx
export function SignInForm() {
  const { signIn, isLoading } = useAuth();
  return <form onSubmit={signIn}>...</form>;
}
```

## Subsystem Integration

### Six-Coordinate Navigation
Each subsystem has dedicated views and navigation:

- **#0 Anuttara** - Proto-logical interface with virtue exploration
- **#1 Paramasiva** - Quaternal Logic engine with QL visualization
- **#2 Parashakti** - Vibrational processing with harmonic interfaces
- **#3 Mahamaya** - Symbolic transcription with I-Ching integration
- **#4 Nara** - Personal dashboard with user management
- **#5 Epii** - Synthesis hub with agent orchestration

### Route Structure
```
app/
├── (auth)/                 # Authentication flow
│   ├── auth/              # Sign in/up pages
│   └── account/           # User dashboard
├── (system)/              # Main application
│   ├── system/            # Subsystem hub
│   └── scene/             # Experience portal
└── layout.tsx             # Root layout with providers
```

## Authentication Architecture

### Unified Auth System
- **Domain-driven auth logic** - Pure functions for state management
- **OAuth 2.0 integration** - Google OAuth with PKCE
- **Session management** - Browser storage with security
- **Route protection** - Component-level access control

### Auth Flow
1. **Domain Logic** - Process authentication state transitions
2. **Infrastructure** - API clients and storage adapters
3. **Context Provider** - React context for global state
4. **Route Guards** - Protect authenticated routes

## AGUI Integration

### AG-UI Protocol Support
Real-time communication with the Agentic Layer:
```typescript
// domains/agui/streaming.domain.ts
export const processAGUIStream = (
  events: AGUIEvent[]
): ConversationState => {
  // Process streaming events from agents
  return updateConversationWithEvents(events);
};
```

### Streaming Architecture
- **SSE Connection** - Server-Sent Events for real-time updates
- **Event Processing** - Domain logic for stream handling
- **UI Updates** - React state synchronization
- **Error Recovery** - Graceful degradation patterns

## UI/UX Design System

### Coordinate-Aware Theming
- **Subsystem Colors** - Unique color palettes per coordinate
- **Hexagonal Navigation** - Visual coordinate representation
- **Animated Transitions** - Smooth subsystem switching
- **Responsive Design** - Mobile-first approach

### Component Architecture
```
components/
├── ui/                    # Base UI components
├── navigation/            # Coordinate navigation
├── auth/                  # Authentication UI
├── agui/                  # Agent interface
└── subsystems/            # Subsystem-specific components
```

## Development Patterns

### Import Standards
```typescript
// Domain imports (pure functions)
import { processSignIn } from '@/domains/auth';

// Hook imports (React integration)
import { useAuth } from '@/subsystems/auth';

// Component imports (UI layer)
import { SignInForm } from '@/components/auth';
```

### State Management
- **Domain State** - Pure functions with immutable updates
- **React State** - useState/useReducer in hooks layer
- **Context State** - Global state via React Context
- **Server State** - GraphQL with caching

## Performance Optimization

### Loading Strategies
- **Route-based Code Splitting** - Automatic with Next.js App Router
- **Component Lazy Loading** - Dynamic imports for heavy components
- **Image Optimization** - Next.js Image component
- **Font Optimization** - Google Fonts with display swap

### Caching Patterns
- **GraphQL Caching** - Apollo Client with coordinate-aware cache
- **Browser Storage** - Session and local storage for auth
- **Service Worker** - PWA caching strategies

## Testing Strategy

### Domain Testing
```typescript
// Pure function testing
describe('processSignIn', () => {
  it('should create authenticated state', () => {
    const result = processSignIn(initialState, user, tokens);
    expect(result.isAuthenticated).toBe(true);
  });
});
```

### Integration Testing
- **Hook Testing** - React Testing Library
- **Component Testing** - Jest + Testing Library
- **E2E Testing** - Playwright for user flows

## Deployment Configuration

### Build Optimization
- **Static Generation** - Pre-rendered pages where possible
- **Edge Runtime** - Optimized for Vercel deployment
- **Bundle Analysis** - Webpack bundle analyzer
- **Performance Monitoring** - Core Web Vitals tracking

### Environment Management
- **Environment Variables** - Next.js environment configuration
- **API Endpoints** - Dynamic endpoint configuration
- **Feature Flags** - Conditional feature rendering

## Future Evolution

The Frontend Layer provides a scalable foundation for:
- **Subsystem Expansion** - Additional coordinate interfaces
- **Enhanced Interactions** - Advanced AGUI capabilities
- **Mobile Applications** - React Native integration
- **Offline Capabilities** - Enhanced PWA features

This architecture ensures the Frontend Layer remains an intuitive and powerful **Experience Vessel** for the Epi-Logos System.
