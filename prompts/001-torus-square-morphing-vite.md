# Interactive Torus-Square Morphing Animation

<objective>
Create a stunning, interactive 3D visualization where a torus smoothly morphs into a square plane based on user drag interaction, then elegantly folds back through intermediate states (square → tube → loop → torus). This should be a standalone Vite + React + Three.js project optimized for quick viewing and iterative editing, with beautiful shaders, warm lighting, and impressive visual polish.

The goal is to demonstrate elegant mathematical transformation with natural, organic animation qualities that feel responsive and delightful.
</objective>

<context>
This is a standalone creative coding project, separate from the main Epi-Logos application. It should showcase:
- Mathematical beauty of topological transformation
- Smooth, physics-inspired animation with natural easing
- Elegant shader work with warm, naturally light tones
- Responsive interaction that feels intuitive and satisfying

Tech stack:
- Vite for fast development and HMR
- React for component structure
- Three.js for WebGL rendering
- React Three Fiber (optional but recommended for React integration)
- Framer Motion (if beneficial for animation orchestration)

The transformation sequence should follow geometric logic:
1. **Square** (flat plane)
2. **Tube** (plane rolled into cylinder)
3. **Loop** (cylinder bent into ring)
4. **Torus** (ring with proper torus topology)
</context>

<requirements>
**Core Functionality:**
1. Interactive drag control (mouse + touch support)
2. Drag distance maps to transformation progress (0% = torus, 100% = square)
3. Release triggers smooth snap-back animation through all intermediate states
4. Transformation should be continuous and mathematically sound

**Visual Excellence:**
1. Beautiful custom shaders with warm, natural color palette (cream, warm whites, soft golds, gentle earth tones)
2. Sophisticated lighting setup (ambient + directional + subtle rim lighting)
3. Smooth surface with subtle texture or noise for visual interest
4. Optional: Iridescent or gradient effects that enhance the folding motion
5. Anti-aliasing and smooth edges
6. Subtle shadows or ambient occlusion

**Animation Quality:**
1. Physics-inspired easing (elastic or spring-based feel on snap-back)
2. Smooth 60fps performance during transformation
3. No jarring transitions - every frame should be geometrically valid
4. Micro-interactions: subtle rotation or wobble on release for personality

**Development Experience:**
1. Fast Vite HMR for rapid iteration
2. Clean, well-commented code structure
3. Easy-to-tweak parameters (colors, easing, transformation speed)
4. Dev UI with stats/controls for fine-tuning (optional but helpful)
</requirements>

<implementation>
**Project Structure:**
```
torus-morph/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   └── TorusSquareMorph.jsx
│   ├── shaders/
│   │   ├── vertex.glsl
│   │   └── fragment.glsl
│   └── styles/
│       └── global.css
```

**Approach Guidelines:**
1. **Geometry Transformation:**
   - Use vertex shader morphing OR procedural geometry updates
   - Calculate intermediate states mathematically (square → tube = rolling, tube → loop = bending, loop → torus = thickening)
   - Consider using parametric equations for smooth interpolation
   - Morph vertex positions based on drag progress (0.0 to 1.0)

2. **Interaction:**
   - Track pointer position on drag start
   - Calculate drag distance/direction
   - Map to morph progress (consider using spring physics for feel)
   - On release, animate progress back to 0 with elastic easing

3. **Shaders:**
   - Custom vertex shader for geometry morphing
   - Fragment shader for warm, elegant lighting
   - Consider: Fresnel effects, gradient mapping, or procedural noise
   - Use uniforms for animation progress, time, and color parameters

4. **Lighting:**
   - Warm ambient light (soft peachy or cream tone)
   - Directional light from top-right (simulate natural daylight)
   - Subtle fill light from opposite side
   - Optional: Point light that follows camera for rim lighting

5. **Colors & Aesthetics:**
   - Base color: Warm off-white or cream (#FFF8F0, #FFFAF5)
   - Accent: Soft gold or peachy highlights
   - Shadows: Warm browns rather than grays
   - Consider: Subtle color shift during transformation (torus = warmer, square = cooler)

**Libraries to Consider:**
- `@react-three/fiber` - React renderer for Three.js (recommended)
- `@react-three/drei` - Useful helpers (OrbitControls, etc.)
- `three` - Core Three.js library
- `leva` - Optional dev GUI for parameter tweaking
- `maath` - Math utilities for easing/interpolation

**Creative Freedom:**
Go beyond the basics. Impress with:
- Unexpected but elegant shader effects
- Subtle particle systems or trails during transformation
- Beautiful camera angles or auto-rotation when idle
- Sound design hooks (silent but ready for audio)
- Delightful micro-animations
- Professional color grading and post-processing (bloom, tone mapping)

**What to Avoid:**
- Harsh, cold lighting - keep it warm and inviting
- Jarring or linear animations - use natural easing curves
- Over-complicated controls - interaction should be intuitive
- Performance issues - prioritize smooth 60fps
- Generic Three.js examples - make this unique and polished
</implementation>

<output>
Create a complete Vite + React + Three.js project:

**Required Files:**
- `./torus-morph/package.json` - Dependencies and scripts (vite, react, three, @react-three/fiber, etc.)
- `./torus-morph/vite.config.js` - Vite configuration with GLSL shader support
- `./torus-morph/index.html` - Entry HTML file
- `./torus-morph/src/main.jsx` - React app entry point
- `./torus-morph/src/App.jsx` - Main app component
- `./torus-morph/src/components/TorusSquareMorph.jsx` - Core interactive 3D component
- `./torus-morph/src/shaders/vertex.glsl` - Vertex shader for morphing
- `./torus-morph/src/shaders/fragment.glsl` - Fragment shader for lighting/color
- `./torus-morph/src/styles/global.css` - Minimal styling
- `./torus-morph/.gitignore` - Standard Node.js gitignore
- `./torus-morph/README.md` - Setup and usage instructions

**Optional but Recommended:**
- Dev controls UI for tweaking parameters
- TypeScript support if it enhances the development experience
- Post-processing effects (bloom, chromatic aberration)
</output>

<verification>
Before declaring complete, verify:

1. **Build & Run:**
   - `npm install` completes without errors
   - `npm run dev` starts development server
   - Project opens in browser without console errors

2. **Interaction:**
   - Drag works on both mouse and touch
   - Transformation is smooth and continuous
   - Release triggers smooth snap-back animation
   - All intermediate states (square → tube → loop → torus) are visible

3. **Visual Quality:**
   - Lighting is warm and natural
   - Colors are elegant and not harsh
   - Shaders render correctly without artifacts
   - Animation runs at 60fps (check dev tools)

4. **Code Quality:**
   - Well-structured and commented
   - Easy to find and tweak parameters (colors, speeds, easing)
   - No hard-coded magic numbers - use named constants
   - Follows React and Three.js best practices

5. **Polish:**
   - Smooth anti-aliasing
   - No visual glitches during transformation
   - Professional aesthetic throughout
   - Delightful to interact with
</verification>

<success_criteria>
- **Functional:** Drag-to-morph interaction works flawlessly with smooth snap-back
- **Mathematical:** Transformation follows logical sequence (square → tube → loop → torus)
- **Beautiful:** Warm, elegant shaders with sophisticated lighting that impresses
- **Performant:** Smooth 60fps animation throughout interaction
- **Polished:** Professional-grade visual quality, not a demo or prototype
- **Developer-Friendly:** Fast HMR, easy to edit, well-documented code
- **Impressive:** Goes beyond basics with creative shader work and delightful details
</success_criteria>

<research_guidance>
If you need inspiration or technical references:
- Research torus topology and parametric equations
- Explore Three.js shader examples for morphing techniques
- Reference elegant shader art from shadertoy or similar platforms
- Consider physics-based animation principles for natural motion
- Look at premium 3D web experiences for polish inspiration

All research should inform implementation - no external documentation needed in deliverables.
</research_guidance>
