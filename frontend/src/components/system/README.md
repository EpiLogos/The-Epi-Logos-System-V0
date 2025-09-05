# System Components

Global components that apply across the entire Epi-Logos System live here.

## Components

- **EpiiNavigation.tsx**: Main navigation component used across all pages
- **WorkingThreeScene.tsx**: Global 3D scene component for system-level visualization
- **GlowParticles.tsx**: Global particle effects system

## Guidelines

- Components here should be truly global/system-wide
- Subsystem-specific components belong in `src/components/subsystems/<id>/`
- Shared subsystem components can live in `src/components/subsystems/`
- Keep system components focused on core functionality that spans the entire application

## Usage

Import system components using the new path:
```typescript
import { EpiiNavigation } from '@/components/system/EpiiNavigation'
import { WorkingThreeScene } from '@/components/system/WorkingThreeScene'
import { GlowParticles } from '@/components/system/GlowParticles'
```
