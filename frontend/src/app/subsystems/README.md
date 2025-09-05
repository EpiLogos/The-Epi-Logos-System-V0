# Subsystems Routing

This directory contains explicit routes for each of the six Epi‑Logos subsystems.

Pattern:
- Canonical path: `/subsystems/<id>` where `<id>` ∈ `anuttara | paramasiva | parashakti | mahamaya | nara | epii`.
- Each subsystem can have up to six feature pages under the same folder, for example:
  - `/subsystems/nara/flow`, `/subsystems/nara/streams`, `/subsystems/nara/perception`, etc.

Why explicit:
- Clear discoverability in the repo (no dynamic routing surprises)
- Easier assignation for contributors working per‑subsystem
- Mirrors backend “views” structure for consistency

Sources of truth:
- UI constants: `src/lib/constants/subsystems.ts` (to be moved to `src/config/subsystems/*` when finalized)
- Shared components: `src/components/subsystems/*`
- Global (system‑level) pages live at `src/app/system`

