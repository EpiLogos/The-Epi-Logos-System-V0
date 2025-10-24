# PHASE 1: NEW UI SYSTEM INTEGRATION - DETAILED TASK PLAN

## Overview
**CLEAN SWITCH APPROACH**: Wire in the new UI system as the primary interface, then selectively integrate valuable elements from the current system. This phase establishes the new animation framework as the foundation and adapts existing business logic to work within it.

## Success Criteria
- ✅ New UI system fully operational in Next.js environment
- ✅ JetBrains Mono font and new visual language active
- ✅ Animation framework functional with all three hooks
- ✅ Basic page routing working with new components
- ✅ Foundation ready for business logic integration

---

## TASK 1: COMPLETE UI SYSTEM INTEGRATION

### 1.1 Direct System Import

#### Subtasks:
- [ ] **1.1.1** Copy entire `ui-clones-extracted/src/` to `frontend/src/ui-system/`
- [ ] **1.1.2** Install new dependencies:
  - `@fontsource/jetbrains-mono` (new primary font)
  - Any missing utilities (`clsx`, `tailwind-merge`)
- [ ] **1.1.3** Verify all 27 UI components imported correctly
- [ ] **1.1.4** Test component compilation without errors

#### Acceptance Criteria:
- Complete UI system available in Next.js project
- All dependencies resolved
- No import or compilation errors

### 1.2 Font System Replacement

#### Subtasks:
- [ ] **1.2.1** **REPLACE** current font imports with JetBrains Mono
- [ ] **1.2.2** Update `frontend/src/app/globals.css` font declarations:
  ```css
  * {
    font-family: 'JetBrains Mono', monospace !important;
  }
  ```
- [ ] **1.2.3** Remove old font references (Tourney, Work Sans, etc.)
- [ ] **1.2.4** Test new typography across existing pages

#### Acceptance Criteria:
- JetBrains Mono active as primary font
- Consistent typography across all pages
- Clean, monospace aesthetic established
- No version conflicts identified
- Dependency analysis documented

---

## TASK 2: TAILWIND V4 CONFIGURATION MIGRATION

### 2.1 CSS Configuration Integration

#### Subtasks:
- [ ] **2.1.1** Backup current `frontend/src/app/globals.css`
- [ ] **2.1.2** Extract new utilities from `ui-clones-extracted/src/index.css`
- [ ] **2.1.3** Merge new `@utility` directives with existing globals.css
- [ ] **2.1.4** Preserve existing Epi-Logos color scheme and fonts
- [ ] **2.1.5** Add new UI system colors and utilities
- [ ] **2.1.6** Test CSS compilation without errors

#### Key Utilities to Migrate:
```css
/* Animation utilities */
@utility coordinate-text-overlay
@utility epi-panel-smooth-transition
@utility paramasiva-image-transition

/* Layout utilities */
@utility scrollable-text-positioning
@utility max-height-scrollable-default

/* Component-specific utilities */
@utility carousel-fade-in-delayed
@utility wave-fade-out-quick
```

#### Acceptance Criteria:
- All new utilities compile successfully
- No conflicts with existing styles
- Development server runs without CSS errors

### 2.2 Tailwind Config Updates
**Estimated Time: 30 minutes**

#### Subtasks:
- [ ] **2.2.1** Compare `ui-clones-extracted/tailwind.config.js` with current config
- [ ] **2.2.2** Add new color definitions (ui-gray, ui-panel, etc.)
- [ ] **2.2.3** Add new spacing and sizing utilities
- [ ] **2.2.4** Add new animation keyframes and timing functions
- [ ] **2.2.5** Preserve existing Epi-Logos theme variables

#### New Config Additions:
```javascript
colors: {
  'ui-gray': '#f5f5f5',
  'ui-dark': '#333',
  'ui-panel': '#090a09',
  'ui-panel-border': '#cacaca',
  'ui-coord-text': '#666666',
},
fontSize: {
  'coord': '72px',
  'coord-sm': '63px',
},
spacing: {
  'sidebar': '420px',
  'grid-sidebar': '300px',
}
```

#### Acceptance Criteria:
- New theme variables available in components
- No breaking changes to existing styles
- Tailwind IntelliSense recognizes new utilities

---

## TASK 3: ANIMATION HOOKS MIGRATION

### 3.1 Hook Compatibility Analysis
**Estimated Time: 45 minutes**

#### Subtasks:
- [ ] **3.1.1** Analyze `useModalTransition.ts` for Next.js compatibility
- [ ] **3.1.2** Analyze `useInterPageTransition.ts` for routing differences
- [ ] **3.1.3** Analyze `useEpiLogosTransition.ts` for SSR considerations
- [ ] **3.1.4** Identify React Router dependencies to replace
- [ ] **3.1.5** Document required changes for each hook

#### Compatibility Issues to Address:
- `useNavigate` from react-router-dom → `useRouter` from next/navigation
- Client-side only hooks (add 'use client' directives)
- SSR considerations for animation state

### 3.2 Hook Migration Implementation
**Estimated Time: 2 hours**

#### Subtasks:
- [ ] **3.2.1** Create `frontend/src/hooks/ui-system/` directory
- [ ] **3.2.2** Migrate `useModalTransition.ts`:
  - Add 'use client' directive
  - Test state management functionality
- [ ] **3.2.3** Migrate `useInterPageTransition.ts`:
  - Replace `useNavigate` with `useRouter`
  - Update navigation calls to Next.js format
  - Test transition state management
- [ ] **3.2.4** Migrate `useEpiLogosTransition.ts`:
  - Add 'use client' directive
  - Test animation sequences
- [ ] **3.2.5** Create hook integration tests

#### Next.js Specific Changes:
```typescript
// Before (React Router)
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/paramasiva');

// After (Next.js)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/paramasiva');
```

#### Acceptance Criteria:
- All hooks compile without errors
- State management functions correctly
- Navigation integration works with Next.js
- No SSR hydration issues

---

## TASK 4: ASSET HANDLING MIGRATION

### 4.1 Image Asset Analysis
**Estimated Time: 30 minutes**

#### Subtasks:
- [ ] **4.1.1** Inventory all images in `ui-clones-extracted/public/`
- [ ] **4.1.2** Compare with existing `frontend/public/` assets
- [ ] **4.1.3** Identify duplicates and conflicts
- [ ] **4.1.4** Plan asset organization strategy

#### Asset Categories:
- Coordinate system hexagon images
- Background images and textures
- Icon assets
- Generated images

### 4.2 Asset Migration Implementation
**Estimated Time: 45 minutes**

#### Subtasks:
- [ ] **4.2.1** Copy new assets to `frontend/public/ui-system/`
- [ ] **4.2.2** Update image import statements in components:
  - Change from Vite string imports to Next.js object imports
  - Add `.src` property where needed
- [ ] **4.2.3** Test image loading in development
- [ ] **4.2.4** Verify no broken image references

#### Import Statement Changes:
```typescript
// Before (Vite)
import image from './img.png'; // Returns string URL
<img src={image} />

// After (Next.js)
import image from './img.png'; // Returns object with src property
<img src={image.src} />
// OR use Next.js Image component
import Image from 'next/image';
<Image src={image} alt="description" />
```

#### Acceptance Criteria:
- All images load correctly
- No 404 errors for assets
- Image optimization working properly

---

## TASK 5: BASIC PAGE STRUCTURE CREATION

### 5.1 Page Route Planning
**Estimated Time: 30 minutes**

#### Subtasks:
- [ ] **5.1.1** Map React Router routes to Next.js App Router structure:
  - `/` → `frontend/src/app/ui-demo/page.tsx`
  - `/subsystems` → `frontend/src/app/ui-demo/subsystems/page.tsx`
  - `/paramasiva` → `frontend/src/app/ui-demo/paramasiva/page.tsx`
  - `/epi-logos` → `frontend/src/app/ui-demo/epi-logos/page.tsx`
  - `/quaternal-logic` → `frontend/src/app/ui-demo/quaternal-logic/page.tsx`
- [ ] **5.1.2** Plan layout hierarchy for shared components
- [ ] **5.1.3** Document routing strategy

### 5.2 Page Implementation
**Estimated Time: 2 hours**

#### Subtasks:
- [ ] **5.2.1** Create `frontend/src/app/ui-demo/layout.tsx`:
  - Add 'use client' directive
  - Import necessary providers
  - Set up basic layout structure
- [ ] **5.2.2** Convert `SubsystemsPage.tsx` to Next.js page component
- [ ] **5.2.3** Convert `ParamasivaPage.tsx` to Next.js page component  
- [ ] **5.2.4** Convert `EpiLogosPage.tsx` to Next.js page component
- [ ] **5.2.5** Convert `QuaternalLogicPage.tsx` to Next.js page component
- [ ] **5.2.6** Update all component imports to use new paths

#### Page Component Template:
```typescript
'use client';

import React from 'react';
import { SubsystemsPage } from '@/ui-system/components/pages/SubsystemsPage';

export default function UISubsystemsDemo() {
  return <SubsystemsPage />;
}
```

#### Acceptance Criteria:
- All pages accessible via Next.js routing
- No compilation errors
- Basic navigation between pages works
- Components render without crashes

---

## TASK 6: DEVELOPMENT ENVIRONMENT VALIDATION

### 6.1 Integration Testing
**Estimated Time: 1 hour**

#### Subtasks:
- [ ] **6.1.1** Test development server startup
- [ ] **6.1.2** Verify hot reload functionality
- [ ] **6.1.3** Test basic page navigation
- [ ] **6.1.4** Verify animation hooks initialize correctly
- [ ] **6.1.5** Check browser console for errors
- [ ] **6.1.6** Test responsive behavior

### 6.2 Performance Baseline
**Estimated Time: 30 minutes**

#### Subtasks:
- [ ] **6.2.1** Measure initial page load times
- [ ] **6.2.2** Check bundle size impact
- [ ] **6.2.3** Verify animation performance (60fps)
- [ ] **6.2.4** Document performance metrics

#### Acceptance Criteria:
- Development server runs without errors
- Page navigation smooth and functional
- No console errors or warnings
- Animation performance acceptable
- Hot reload working properly

---

## PHASE 1 COMPLETION CHECKLIST

### Technical Validation:
- [ ] All new UI components successfully imported
- [ ] Tailwind v4 configuration merged without conflicts
- [ ] Animation hooks compatible with Next.js
- [ ] Asset handling properly configured
- [ ] Basic page routing functional

### Quality Assurance:
- [ ] No TypeScript compilation errors
- [ ] No runtime JavaScript errors
- [ ] All images loading correctly
- [ ] CSS utilities applying properly
- [ ] Development environment stable

### Documentation:
- [ ] Migration notes updated
- [ ] Dependency changes documented
- [ ] Known issues logged
- [ ] Next phase preparation notes

**Estimated Total Time: 8-10 hours**

**Ready for Phase 2: Component Integration**
