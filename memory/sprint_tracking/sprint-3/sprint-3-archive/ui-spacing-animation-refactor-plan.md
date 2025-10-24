# UI Spacing System Refactor Plan

**Status**: Phase 2 - Spacing Hook Implementation  
**Scope**: Normalize spacing definitions; support existing animations  
**Estimated Impact**: Medium - High (maintainability/extensibility)  
**Priority**: Phase 2 of constraint normalization

---

## Executive Summary - UPDATED

**Key Insight**: Animations are working well. The spacing system is a *support layer* for consistency, not a redesign.

The current system scatters spacing definitions across components, making changes risky. A systematic refactor will:
- Centralize spacing definitions in hooks + config
- Support existing animations without breaking them
- Use **Tailwind v4 @utility** syntax exclusively in `index.css`
- Improve maintainability by reducing duplication

---

## Current Architecture Problems

### 1. **Scattered Spacing Definitions** ❌

| Location | Definition | Issue |
|----------|-----------|-------|
| `Sidebar.tsx` | `px-10 py-8` (inline) | Hardcoded, no variants |
| `HexagonSidebarPanel.tsx` | `px-10 py-8` (conditional) | Duplicated from Sidebar |
| `globals.css` | `@utility sidebar-collapsed` (54px width only) | Incomplete - no padding override |
| `ContentPanel.tsx` | `m-[20px]`, `mt-5 mr-5 mb-5 ml-0` (inline) | Per-state hardcoding |
| `PortfolioContainer.tsx` | None (implied by flex) | Relies on child spacing |

**Problem**: Changing padding across a page variant requires hunting through 4+ files.

### 2. **Spacing Changes Break Animations** ❌

Current state:
```tsx
// Sidebar.tsx
isCollapsed ? "px-0" : "px-10"  // Spacing change
// + still uses sidebar-collapse-transition (600ms)
```

**Problem**: The 600ms transition was designed for width. When padding collapses, it animates with inconsistent timing.

### 3. **CSS Utility Duplication** ❌

- `globals.css`: 15+ transition utilities
- `ui-system/index.css`: 20+ duplicate/overlapping utilities
- No single source of truth
- Conflicting timing values

**Solution**: Consolidate in `index.css` only, using Tailwind v4 @utility syntax.

---

## Refactor Approach - SIMPLIFIED

### **Principle: Don't Redesign Animations**

Current animations (size/position/location changes with orchestrated timings) are working. We're not changing them.

Spacing system just needs to:
1. ✅ Have consistent, centralized definitions
2. ✅ Support smooth transitions alongside existing animations
3. ✅ Not require phase-aware logic (animations handle their own phases)

### **CSS Strategy: Tailwind v4 @utility in index.css Only**

```css
/* frontend/src/ui-system/index.css */

/* SPACING UTILITIES - Tailwind v4 syntax */
@utility sidebar-spacing-collapsed {
  padding-left: 0;
  padding-right: 0;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

@utility sidebar-spacing-normal {
  padding: 2rem 2.5rem;
}

/* TRANSITION UTILITIES - Tailwind v4 syntax */
@utility transition-sidebar-collapse {
  transition: width 600ms cubic-bezier(0.25, 0.1, 0.25, 1),
              padding 200ms cubic-bezier(0.25, 0.1, 0.25, 1) 200ms;
}
```

**No globals.css utilities**. Everything in `index.css` using Tailwind v4 @utility.

---

## Implementation Phases - UPDATED

### **Phase 1: Width Logic** ✅ COMPLETE
- [x] Create `useSidebarWidth` hook
- [x] Integrate into Sidebar component

### **Phase 2: Spacing System** (CURRENT - LOW RISK)
- [ ] Create `useSidebarSpacing` hook
- [ ] Create spacing constants file
- [ ] Update Sidebar + HexagonSidebarPanel
- [ ] Add @utility for spacing in `index.css`
- **Animations**: No changes — spacing interpolates smoothly via existing transitions

### **Phase 3: Layout Configuration** (MEDIUM RISK)
- [ ] Create `layoutSystem.ts` config (width + spacing + transitions)
- [ ] Update Sidebar to use layout config
- [ ] Update ContentPanel to use layout config
- **Animations**: Transitions now coordinated via config, animations untouched

### **Phase 4: CSS Consolidation** (LOW RISK - CLEANUP)
- [ ] Audit `globals.css` transitions
- [ ] Migrate to `index.css` using Tailwind v4 @utility
- [ ] Remove duplicate utilities
- [ ] Delete from globals.css
- **Animations**: No changes — just consolidation

### **Phase 5: Testing & Documentation** (FINAL)
- [ ] Test collapse/expand smoothness
- [ ] Test modal expansion
- [ ] Verify all transitions work
- [ ] Update docs

---

## Success Criteria - UPDATED

**Phase 2 Complete When**:
- ✅ Spacing is centralized in hooks + config
- ✅ All spacing uses consistent naming convention
- ✅ Animations remain smooth (no visual changes)
- ✅ TypeScript types pass
- ✅ No console warnings

**Full Refactor Complete When**:
- ✅ All spacing defined in hooks/config
- ✅ All transitions in `index.css` only
- ✅ `globals.css` has zero spacing/transition utilities
- ✅ All animations smooth at 60fps
- ✅ Documentation updated

---

## Architecture - TARGET STATE

```
Layout System (Tailwind v4 friendly)
├─ useSidebarWidth() → width class
├─ useSidebarSpacing() → spacing object
└─ useLayoutConfig() → complete layout object
     ├─ width
     ├─ spacing (px, py)
     └─ transition properties

ui-system/index.css (single source of truth)
├─ @utility spacing-* variants
├─ @utility transition-* variants
└─ @keyframes (animation definitions)

Components (simplified)
├─ Sidebar.tsx (uses hooks for spacing/width)
├─ ContentPanel.tsx (uses layout config)
└─ Page components (animations untouched)
```

---

## Phase 2: Spacing Hook Implementation

### **Step 1: Create Spacing Constants**

File: `frontend/src/hooks/useSidebarSpacing.ts`

Defines all spacing variants in one place:
```typescript
interface SidebarSpacing {
  px: number;
  py: number;
  description: string;
}

const SIDEBAR_SPACING = {
  collapsed: { px: 0, py: 8 },    // 0px horizontal, 2rem vertical
  normal: { px: 10, py: 8 },      // 2.5rem horizontal, 2rem vertical
  expanded: { px: 10, py: 8 },    // Same as normal for consistency
} as const;
```

### **Step 2: Add Spacing Utilities to index.css**

```css
@utility sidebar-spacing-collapsed {
  padding-left: 0;
  padding-right: 0;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

@utility sidebar-spacing-normal {
  padding: 2rem 2.5rem;
}
```

### **Step 3: Update Components**

Sidebar + HexagonSidebarPanel now use:
```tsx
const spacing = useSidebarSpacing(isCollapsed);
className={cn(
  `px-${spacing.px} py-${spacing.py}`,
  // OR use utility:
  isCollapsed ? 'sidebar-spacing-collapsed' : 'sidebar-spacing-normal',
  // ... rest
)}
```

### **Step 4: Verify**

- ✅ No visual changes
- ✅ Spacing centered in hooks
- ✅ Animations still smooth
- ✅ Ready for Phase 3

---

## Questions for This Phase

1. Should spacing hook return class string (utility name) or object with px/py values?
   - **Recommendation**: Return object for flexibility, use utilities in components
2. Should we migrate existing hardcoded spacing in ContentPanel in Phase 2 or Phase 3?
   - **Recommendation**: Phase 3 (focus Phase 2 on Sidebar only)
3. Do we need spacing variants for expanded states, or just collapsed/normal?
   - **Recommendation**: Stick with collapsed/normal (expanded = normal)

---

## Related Documents

- `useSidebarWidth` hook: `frontend/src/hooks/useSidebarWidth.ts` (Phase 1 complete)
- Current CSS utilities: `frontend/src/ui-system/index.css` + `frontend/src/app/globals.css`
- Affected components: Sidebar, HexagonSidebarPanel, ContentPanel
- Tailwind v4 docs: Focus on @utility syntax (no v3 directives)

---

## Next Steps

1. ✅ Implement Phase 2 (this task)
2. Review Phase 2 results
3. Proceed to Phase 3 (layout config system)
4. Proceed to Phase 4 (CSS consolidation)
5. Phase 5 (testing + docs)
