# Frontend Integration Lessons from Story 02.10

*Extracted from React Authentication and Account Management Implementation*

## Domain-Driven Design in React

### Clean Architecture Implementation
**Achievement**: Successful separation between domain logic, infrastructure, and UI layers

```typescript
// Domain layer - pure business logic (zero React dependencies)
import { processSignIn, processTokenRefresh } from '@/domains/auth';

// Infrastructure layer - external dependencies
import { APIClientAdapter, SessionStorageAdapter } from '@/infrastructure/auth';

// UI layer - React components (dumb components)
import { UnifiedAuthContext } from '@/auth/unified-auth-context';
```

### Critical Pattern: Dumb Components
- Domain layer contains zero framework dependencies
- Infrastructure adapters implement clean interfaces  
- UI components delegate business logic to domains
- Use dependency injection at service boundaries

## API Integration Methodologies

### Frontend-Backend Contract Alignment Issues

**Critical Discovery**: Excellent frontend implementation was completely blocked by missing backend endpoints.

**Backend Provides vs Frontend Expects:**
```typescript
// Backend provides:
PATCH /api/users/me

// Frontend expects:  
PUT /api/users/profile
GET /api/billing/subscription
POST /api/billing/create-checkout-session
GET /api/auth/sessions
PUT /api/users/preferences
```

### Integration Best Practices
**API-First Development**: Document and validate all endpoints before frontend development

**Error Handling Pattern**:
```typescript
// Graceful degradation example
try {
  await apiClient.signOut();
} catch (error) {
  console.warn('API sign-out failed, continuing with local sign-out:', error);
  // Continue with local cleanup
}
```

## State Management Excellence

### Authentication Context Architecture
```typescript
interface AccountContextValue {
  user: User | null;
  subscription: Subscription | null;
  sessions: UserSession[];
  isLoading: boolean;
  error: string | null;
  
  updateProfile: (updates: Partial<User>) => Promise<void>;
  upgradeToPatron: () => Promise<void>;
  manageBilling: () => Promise<void>;
  terminateSession: (sessionId: string) => Promise<void>;
}
```

### State Machine Patterns
- Use domain functions for state transitions: `processSignIn`, `processSignOut`, `processTokenRefresh`
- Centralized error state management with user-friendly messages
- Proper loading state handling across all operations

## Component Architecture Patterns

### Progressive Disclosure Design
- **Tabbed Interface Pattern**: Account management with expandable sections
- **Performance Optimization**: Lazy loading for complex components, React.memo for expensive operations
- **Accessibility First**: WCAG 2.1 AA compliance with comprehensive ARIA labels

### Design System Integration
```typescript
// Consistent navigation patterns
import { HexagonNavigation } from '@/components/navigation';

// Epi-Logos design tokens
const accountTheme = {
  '--color-primary': 'hsl(222.2 47.4% 11.2%)',
  '--color-account-bg': 'hsl(210 40% 98%)',
}
```

## Error Handling and User Experience

### Comprehensive Error Management
```typescript
// Error classification for better UX
class TokenExpiredError extends Error { }
class APIError extends Error { }
class NetworkError extends Error { }

// Domain-specific error handling
const handleAuthError = (error: Error) => {
  if (error instanceof TokenExpiredError) {
    return "Please sign in again";
  }
  if (error instanceof NetworkError) {
    return "Connection issue - please try again";
  }
  return "Something went wrong - please try again";
}
```

### User Experience Excellence
- **Loading States**: Consistent loading indicators across all operations
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Mobile Optimization**: Touch-friendly interface with responsive design
- **Graceful Degradation**: Fallback states when backend services unavailable

## Payment Integration Frontend Patterns

### Stripe Integration Architecture
```typescript
// Real API integration pattern
const handleUpgradeToPatron = async () => {
  setIsLoading(true);
  try {
    const session = await apiClient.createCheckoutSession({
      mode: 'subscription',
      tier: 'patron'
    });
    window.location.href = session.url;
  } catch (error) {
    setError('Failed to start upgrade process');
  } finally {
    setIsLoading(false);
  }
}
```

### Feature Gating UI Patterns
```typescript
// Tier-based UI rendering
const FeatureGatedComponent = ({ requiredTier, children }) => {
  const { user } = useAuth();
  
  if (user.tier < requiredTier) {
    return <UpgradePrompt targetTier={requiredTier} />;
  }
  
  return children;
}
```

## Testing Strategies for Frontend

### Comprehensive Test Coverage
```
frontend/src/
├── components/account/__tests__/
│   ├── AccountProfile.test.tsx
│   ├── BillingManagement.test.tsx
│   └── SessionManagement.test.tsx
├── contexts/__tests__/
│   └── OAuthContext.integration.test.tsx
└── hooks/__tests__/
    └── useFormError.test.tsx
```

### Testing Patterns
- **Component Testing**: 20 comprehensive test files covering all components and edge cases
- **Integration Testing**: OAuth Context functionality and authentication state management
- **Accessibility Testing**: axe-core integration for automated accessibility checks

## Tailwind CSS v4 Integration

### CRITICAL: v4 Configuration Requirements
```css
/* CORRECT v4 syntax in CSS */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
  --font-sans: var(--font-work-sans), system-ui, sans-serif;
}
```

**NEVER use v3 syntax:**
```css
@tailwind base;     /* WRONG - v3 syntax */
@tailwind components;
@tailwind utilities;
```

## Recommendations for CLAUDE.md Updates

### Frontend Architecture Requirements
```markdown
### Domain-Driven Design Standards
- Domain layer MUST contain zero React dependencies
- Infrastructure adapters MUST implement clean interfaces  
- UI components SHOULD delegate business logic to domains
- Use dependency injection at service boundaries

### API Integration Standards
- Implement API-first development with contract validation
- Document all endpoints before frontend development
- Use graceful degradation for API failures
- Implement proper error classification and user messaging
```

### Frontend Testing Requirements
```markdown
### Component Testing Standards
- Comprehensive test coverage for all components and edge cases
- Integration testing for context providers and custom hooks
- Accessibility testing with axe-core integration
- Error boundary testing for graceful failure handling
```

### Payment Integration Patterns
```markdown
### Stripe Integration Standards
- Always use real Stripe test API, never mock implementations
- Implement proper loading states for payment flows
- Use feature gating patterns for tier-based functionality
- Handle payment failures with clear user messaging
```