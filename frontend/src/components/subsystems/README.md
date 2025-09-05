# Subsystems Components

Subsystem‑specific UI lives here, grouped by subsystem as needed. Global components that apply across the whole system live in `src/components/system`.

Guidelines:
- Place components used only by one subsystem under `src/components/subsystems/<id>/`.
- Components shared across multiple subsystems can live directly under `src/components/subsystems/` or in `src/components/system/` if they apply globally.
- Keep page logic in `src/app/subsystems/<id>/*` and keep visual/behavioral pieces here.

Routing:
- Pages are explicit under `src/app/subsystems/<id>` (no dynamic routes). The navbar links to these explicit paths.

Config:
- Current palette and copy live in `src/lib/constants/subsystems.ts`. We plan to move this into `src/config/subsystems/<id>.ts` and `src/config/types.ts` when the contract is finalized.

