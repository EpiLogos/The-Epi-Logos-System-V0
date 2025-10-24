# Phase 5: Dashboard Implementation Plan
## Default Logged-In Modal State with 6-Circle Grid

### **Overview**
Implement dashboard as the **default authenticated user state** replacing `account-profile` as the primary post-PNG-click destination. Dashboard features 6 zen-circle.png images in a 3x2 grid with rotating animations and opacity effects matching the epi-png system.

---

## **Core Requirements**

### **Business Logic Changes**
- **Dashboard becomes default**: PNG click → `dashboard` state (not `account-profile`)
- **Account becomes secondary**: Dashboard → Account circle → `account-profile` state
- **Preserve auth flow**: Unauthenticated users still get `auth-signin`

### **Visual Specifications**
- **Base Image**: `zen-circle.png` for all 6 circles initially
- **Grid Layout**: 3 columns × 2 rows with consistent spacing
- **Animation System**: Each circle rotates at different phase rates
- **Opacity/Size Effects**: Match epi-png hover and transition behaviors
- **Future-Ready**: Designed for easy image swapping per route

---

## **File Modification List**

### **1. Business State Extension**
```typescript
// File: frontend/src/hooks/ui-system/useEpiLogosBusinessStates.ts
export type EpiLogosBusinessState = 
  | 'png-displayed'                    // PNG image shown (default)
  | 'dashboard'                        // NEW: Dashboard with 6 circles (default for authenticated)
  | 'auth-signin' | 'auth-signup'      // Authentication states
  | 'auth-oauth' | 'auth-success'      // OAuth flow states
  | 'account-profile' | 'account-security' | 'account-billing' // Account states
  | 'account-notifications' | 'account-sessions' | 'account-preferences';
```

### **2. PNG Click Logic Update**
```typescript
// File: frontend/src/ui-system/components/pages/EpiLogosPage.tsx
const handleDashboardClick = () => {
  epiLogosActions.transitionToDashboard();
  
  // CHANGED: Dashboard is now default for authenticated users
  if (isAuthenticated) {
    setBusinessState('dashboard'); // Was: 'account-profile'
  } else {
    setBusinessState('auth-signin');
  }
};
```

### **3. New Dashboard Components**
```
frontend/src/ui-system/components/dashboard/
├── DashboardModalContent.tsx        # Main dashboard container
├── DashboardGrid.tsx               # 3x2 grid layout manager
└── DashboardCircle.tsx             # Individual animated circle
```

### **4. Modal Content Manager Integration**
```typescript
// File: frontend/src/ui-system/components/modal/ModalContentManager.tsx
// Add dashboard state handling before auth/account states
if (businessState === 'dashboard') {
  return <DashboardModalContent onStateChange={onStateChange} />;
}
```

### **5. Account Modal Back Navigation**
```typescript
// File: frontend/src/ui-system/components/account/AccountModalContent.tsx
// Add "Back to Dashboard" button at top of account sections
```

---

## **Dashboard Circle Configuration**

### **Circle Definitions**
```typescript
const dashboardCircles = [
  { 
    id: 'account', 
    label: 'Account', 
    image: '/zen-circle.png',
    route: 'account-profile',
    enabled: true,
    rotationPhase: 0 
  },
  { 
    id: 'system', 
    label: 'System', 
    image: '/zen-circle.png',
    route: null,
    enabled: false,
    rotationPhase: 60 
  },
  { 
    id: 'subsystems', 
    label: 'Subsystems', 
    image: '/zen-circle.png',
    route: null,
    enabled: false,
    rotationPhase: 120 
  },
  { 
    id: 'coordinates', 
    label: 'Coordinates', 
    image: '/zen-circle.png',
    route: null,
    enabled: false,
    rotationPhase: 180 
  },
  { 
    id: 'agents', 
    label: 'Agents', 
    image: '/zen-circle.png',
    route: null,
    enabled: false,
    rotationPhase: 240 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    image: '/zen-circle.png',
    route: null,
    enabled: false,
    rotationPhase: 300 
  }
];
```

---

## **Animation System Specifications**

### **Tailwind v4 Animation Classes**
```css
/* Dashboard-specific animations matching epi-png system */
.dashboard-circle-base {
  @apply transition-all duration-300 ease-out;
  animation: dashboardCircleRotate 12s linear infinite;
}

.dashboard-circle-hover {
  @apply hover:scale-110 hover:opacity-90;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.dashboard-circle-disabled {
  @apply opacity-40 cursor-not-allowed;
  filter: grayscale(0.6);
}

/* Rotation animations with phase offsets */
@keyframes dashboardCircleRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dashboard-circle-phase-0 { animation-delay: 0s; }
.dashboard-circle-phase-60 { animation-delay: -2s; }
.dashboard-circle-phase-120 { animation-delay: -4s; }
.dashboard-circle-phase-180 { animation-delay: -6s; }
.dashboard-circle-phase-240 { animation-delay: -8s; }
.dashboard-circle-phase-300 { animation-delay: -10s; }
```

### **Opacity and Size Effects**
- **Base State**: `opacity-80 scale-100`
- **Hover State**: `opacity-90 scale-110` (enabled circles)
- **Disabled State**: `opacity-40 scale-100 grayscale-60`
- **Transition**: `duration-300 ease-out` (matching epi-png)

---

## **Implementation Phases**

### **Phase 5.1: Core Structure (45 minutes)**
1. Update business state types
2. Create dashboard component files
3. Implement basic 3x2 grid layout
4. Add zen-circle.png to all positions

### **Phase 5.2: Animation Integration (30 minutes)**
1. Add rotation animations with phase offsets
2. Implement hover effects matching epi-png
3. Add disabled state styling
4. Test animation performance

### **Phase 5.3: Navigation Integration (30 minutes)**
1. Update ModalContentManager routing
2. Modify PNG click logic
3. Add account modal back navigation
4. Test complete user flow

### **Phase 5.4: Polish & Testing (15 minutes)**
1. Verify all animations work smoothly
2. Test authentication flow changes
3. Ensure responsive layout
4. Validate accessibility

---

## **Extension Guidelines**

### **Adding New Routes (Future)**
```typescript
// To enable a new circle:
1. Update circle config: enabled: true, route: 'new-state'
2. Add business state: 'new-state' to EpiLogosBusinessState
3. Add routing in ModalContentManager
4. Replace zen-circle.png with route-specific image
```

### **Image Replacement Pattern**
```typescript
// Each circle can have unique image:
const circleImage = circle.enabled 
  ? `/dashboard/${circle.id}-circle.png`  // Route-specific image
  : '/zen-circle.png';                    // Default zen circle
```

### **Animation Customization**
```css
/* Per-circle animation overrides */
.dashboard-circle-account { 
  animation-duration: 10s; /* Faster rotation */
}
.dashboard-circle-system { 
  animation-duration: 15s; /* Slower rotation */
}
```

---

## **Critical Implementation Notes**

### **⚠️ Do Not Over-Engineer**
- **Start Simple**: All circles use zen-circle.png initially
- **Enable Incrementally**: Only Account circle functional in v1
- **Preserve Patterns**: Follow existing modal/auth patterns exactly
- **Animation Consistency**: Match epi-png timing and easing

### **🎯 Key Success Criteria**
1. **Dashboard replaces account-profile** as default authenticated state
2. **All 6 circles rotate** at different phases smoothly
3. **Only Account circle clickable** initially
4. **Animations match epi-png** opacity/scale behaviors
5. **Back navigation works** from account to dashboard

### **🔄 User Flow Validation**
```
Authenticated PNG Click → Dashboard (6 circles) → Account Circle → Account Modal → Back Button → Dashboard
```

---

## **Detailed Component Specifications**

### **DashboardModalContent.tsx**
```typescript
interface DashboardModalContentProps {
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const DashboardModalContent: React.FC<DashboardModalContentProps> = ({
  onStateChange
}) => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-modal-container p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="dashboard-header mb-8 text-center">
        <h1 className="text-2xl font-mono text-ui-panel mb-2">
          Welcome, {user?.firstName || user?.name || 'User'}
        </h1>
        <p className="text-ui-coord-text font-mono text-sm">
          Epi:Logos System Dashboard
        </p>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid onNavigate={onStateChange} />

      {/* Footer */}
      <div className="dashboard-footer mt-12 pt-6 border-t border-ui-coord-text/20 text-center">
        <button
          onClick={() => signOut().then(() => onStateChange('auth-signin'))}
          className="text-ui-coord-text hover:text-ui-panel transition-colors font-mono text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
```

### **DashboardGrid.tsx**
```typescript
interface DashboardGridProps {
  onNavigate: (state: EpiLogosBusinessState) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ onNavigate }) => {
  return (
    <div className="dashboard-grid flex items-center justify-center min-h-[400px]">
      <div className="grid grid-cols-3 grid-rows-2 gap-12 w-full max-w-3xl">
        {dashboardCircles.map((circle) => (
          <DashboardCircle
            key={circle.id}
            {...circle}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};
```

### **DashboardCircle.tsx**
```typescript
interface DashboardCircleProps {
  id: string;
  label: string;
  image: string;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: number;
  onNavigate: (state: EpiLogosBusinessState) => void;
}

export const DashboardCircle: React.FC<DashboardCircleProps> = ({
  id, label, image, route, enabled, rotationPhase, onNavigate
}) => {
  const handleClick = () => {
    if (enabled && route) {
      onNavigate(route);
    }
  };

  return (
    <div
      className={cn(
        "dashboard-circle-container relative flex flex-col items-center justify-center",
        "w-32 h-32 mx-auto",
        enabled && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      {/* Zen Circle Image with Animations */}
      <div className={cn(
        "dashboard-circle-wrapper relative w-24 h-24",
        "dashboard-circle-base",
        enabled && "dashboard-circle-hover",
        !enabled && "dashboard-circle-disabled",
        `dashboard-circle-phase-${rotationPhase}`
      )}>
        <img
          src={image}
          alt={`${label} Dashboard Circle`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Label */}
      <span className={cn(
        "mt-3 text-sm font-mono text-center",
        enabled ? "text-ui-coord-text" : "text-ui-coord-text/50"
      )}>
        {label}
      </span>
    </div>
  );
};
```

---

## **CSS Animation Specifications**

### **Required Tailwind v4 Utilities**
```css
/* Add to globals.css */

/* Dashboard Circle Base Animation */
.dashboard-circle-base {
  @apply transition-all duration-300 ease-out opacity-80;
  animation: dashboardCircleRotate 12s linear infinite;
  transform-origin: center;
}

/* Hover Effects (Enabled Circles) */
.dashboard-circle-hover:hover {
  @apply scale-110 opacity-90;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

/* Disabled State */
.dashboard-circle-disabled {
  @apply opacity-40 cursor-not-allowed;
  filter: grayscale(0.6) brightness(0.7);
}

/* Rotation Keyframes */
@keyframes dashboardCircleRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Phase Offset Classes */
.dashboard-circle-phase-0 { animation-delay: 0s; }
.dashboard-circle-phase-60 { animation-delay: -2s; }
.dashboard-circle-phase-120 { animation-delay: -4s; }
.dashboard-circle-phase-180 { animation-delay: -6s; }
.dashboard-circle-phase-240 { animation-delay: -8s; }
.dashboard-circle-phase-300 { animation-delay: -10s; }

/* Container Styling */
.dashboard-modal-container {
  @apply relative;
  min-height: 600px;
}

.dashboard-grid {
  @apply relative;
}

.dashboard-circle-wrapper {
  @apply relative overflow-hidden rounded-full;
}
```

---

## **Integration Points**

### **ModalContentManager.tsx Update**
```typescript
// Add after PNG state, before auth states
if (businessState === 'dashboard') {
  return (
    <div className={cn(
      'content-transition-container',
      showContent ? 'content-visible' : 'content-hidden'
    )}>
      <DashboardModalContent onStateChange={onStateChange} />
    </div>
  );
}
```

### **AccountModalContent.tsx Back Button**
```typescript
// Add at top of account sections
<div className="account-header mb-6">
  <button
    onClick={() => onStateChange('dashboard')}
    className="flex items-center text-ui-coord-text hover:text-ui-panel transition-colors font-mono text-sm mb-4"
  >
    <ChevronLeftIcon className="w-4 h-4 mr-2" />
    Back to Dashboard
  </button>
</div>
```

---

## **Testing Checklist**

### **Animation Verification**
- [ ] All 6 circles rotate at different phases
- [ ] Rotation is smooth and continuous
- [ ] Hover effects work on enabled circles only
- [ ] Disabled circles show grayscale effect
- [ ] Animations match epi-png timing

### **Navigation Flow**
- [ ] PNG click → Dashboard (authenticated)
- [ ] PNG click → Auth (unauthenticated)
- [ ] Account circle → Account modal
- [ ] Back button → Dashboard
- [ ] Sign out → Auth modal

### **Responsive Design**
- [ ] Grid adapts to different screen sizes
- [ ] Circles maintain aspect ratio
- [ ] Labels remain readable
- [ ] Spacing is consistent

---

## **Next Steps**
1. Confirm zen-circle.png location in public directory
2. Begin Phase 5.1 implementation
3. Test each phase before proceeding
4. Validate complete authentication flow
