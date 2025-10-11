# Frontend Architecture — Current State

updated_at: 2025-10-10
updated_by: codex

Overview
- Next.js app with major Sprint 3 UI overhaul (external UI import + remediation), full auth flows, and account/billing UI integration.
- Tailwind v4 only; adhere to utility constraints (nested pseudos inside blocks; avoid animation override collisions).

Key Features (Sprint 3)
- Authentication flows (unified sign-in/sign-up; OAuth callback; account linking):
  - `frontend/src/app/auth/signin/page.tsx`
  - `frontend/src/app/auth/callback/page.tsx`
  - `frontend/src/app/auth/link-account/page.tsx`
- Account management dashboard (with billing):
  - `frontend/src/app/account/page.tsx`
  - `frontend/src/components/account/SubscriptionManager.tsx`
  - `frontend/src/services/billing-service.ts`
- Auth context, protection, and status components:
  - `frontend/src/auth/unified-auth-context.tsx` (UnifiedAuthProvider)
  - `frontend/src/auth/components/ProtectedRoute.tsx`
  - `frontend/src/auth/components/AuthStatus.tsx`
- UI overhaul integration points and remediation:
  - Auth modal remediation plan applied (see memory/active_sprint/external-UI-Import-overhaul/auth-modal-remediation-plan.md)
  - Dashboard centering postmortem (fixes applied)
  - Critical fixes and phased migration plans executed (Phase 1→5)
- Dev/sprint visualization:
  - `frontend/src/app/dev/sprint/[sprint]/` and `frontend/src/components/dev/`
  - `frontend/src/components/dev/SprintProgressTracker.tsx`

Architectural Choices
- Preserve domain-driven partitioning: domain logic, hooks, components kept decoupled from UI layer.
- Protect routes via `ProtectedRoute`; expose auth state via UnifiedAuthProvider.
- Use service layer for billing (Stripe integration) behind `billing-service.ts`.

Key Constraints
- Tailwind v4 parsing rules; avoid pseudo-selectors in utility names.
- Prefer single animation utility that sets the full animation list to avoid overrides.

Open Items
- Thread history sidebar (Phase 6) planned.
- UI for semantic search/graph ops to be expanded in future sprints.
