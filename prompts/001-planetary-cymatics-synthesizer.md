# Planetary Cymatics Synthesizer - Interactive Musical Interface

<objective>
Create a sophisticated, standalone web-based musical interface that generates arpeggiated scales with scientifically accurate cymatic pattern visualizations. This is a multi-purpose tool for education, performance, meditation, and exploratory sonic/visual experimentation. The interface must seamlessly integrate audio synthesis with real-time geometric rendering, allowing users to build complex layered compositions where musical parameters directly control visual cymatics.

**End Goal**: A fully-featured, production-ready interactive instrument that demonstrates the sacred geometry inherent in sound through scientifically accurate Chladni patterns, while providing professional-grade synthesis capabilities and intuitive layering controls.
</objective>

<context>
This is a standalone HTML/JavaScript application that does not integrate with any existing framework. It should be self-contained, performant, and visually stunning.

**Target Users**:
- Musicians and sound designers seeking innovative performance tools
- Educators teaching acoustics, physics, and harmonic relationships
- Meditation practitioners exploring sound healing
- Researchers investigating cymatics and sacred geometry
- Anyone curious about the visual nature of sound

**Technical Foundation**:
- Web Audio API for high-quality synthesis
- HTML5 Canvas (or WebGL if performance requires) for real-time rendering
- Pure JavaScript (ES6+) - no framework dependencies
- Responsive design that works on desktop and tablet
</context>

<requirements>

## Audio Synthesis Engine

1. **Scale Generation System**
   - Implement 8 planetary modes based on Greek modal system:
     - **Sun**: Ionian (Major) - C-D-E-F-G-A-B
     - **Moon**: Aeolian (Natural Minor) - A-B-C-D-E-F-G
     - **Mercury**: Dorian - D-E-F-G-A-B-C
     - **Venus**: Lydian - F-G-A-B-C-D-E
     - **Mars**: Phrygian - E-F-G-A-B-C-D
     - **Jupiter**: Mixolydian - G-A-B-C-D-E-F
     - **Saturn**: Locrian - B-C-D-E-F-G-A
     - **Earth**: Custom mode (Pentatonic Major for grounding) - C-D-E-G-A
   - Allow octave transposition (at least 3 octaves range)
   - Support custom root note selection

2. **Arpeggiation System**
   - Configurable arpeggio patterns: up, down, up-down, random, chord
   - Tempo control (30-300 BPM)
   - Note duration/gate control
   - Swing/humanization option

3. **Synthesis Architecture** (Go beyond basic oscillators)
   - Multiple oscillator types: sine, triangle, sawtooth, square, custom wavetables
   - **FM synthesis** with configurable modulation depth, ratio, and feedback
   - ADSR envelope for amplitude
   - Filter section (low-pass, high-pass, band-pass) with resonance
   - LFO modulation for vibrato/tremolo
   - Reverb and delay effects with parameter control

4. **Timbre Control**
   - Direct mapping to oscillator blend, filter cutoff, and FM depth
   - Smooth parameter interpolation to avoid audio clicks
   - Preset system for quick timbre selection

## Visual Rendering System

5. **Scientifically Accurate Cymatics**
   - Implement Chladni pattern mathematics based on frequency
   - Use eigenmodes of circular/square plates for pattern generation
   - Formula reference: Nodal patterns based on Bessel functions or similar mathematical models
   - Patterns should respond accurately to:
     - Frequency (higher notes = more complex patterns)
     - Amplitude (affects pattern intensity/brightness)
     - Harmonic content (overtones create interference patterns)

6. **Real-Time Rendering**
   - Render at minimum 30 FPS (prefer 60 FPS)
   - Use Canvas 2D API initially; consider WebGL for complex multi-layer scenarios
   - Smooth animation synchronized to audio tempo
   - Particle systems or line-based geometry for pattern visualization

7. **Layering System**
   - Support 8 simultaneous layers (matching 8 planetary modes)
   - Each layer has independent:
     - Scale/mode selection
     - Arpeggio pattern
     - Visual geometry color/style
     - All audio parameters
   - Layers blend additively in visual space
   - Visual layer opacity/blend modes

## Parameter Mapping

8. **Visual-Audio Correspondences** (WHY: These mappings create intuitive understanding of how sound shapes geometry)
   - **Vibrancy** (visual intensity/saturation/glow) ↔ **Timbre** (harmonic content, filter brightness)
     - More vibrancy = brighter, more harmonically rich sound
     - Implementation: Map to filter cutoff, oscillator blend, overtone emphasis

   - **Size** (scale of geometric pattern) ↔ **Volume** (amplitude)
     - Larger patterns = louder audio
     - Implementation: Direct mapping to gain/amplitude envelope

   - **Pulse** (animation speed, pattern rotation) ↔ **Time Signature** (per layer)
     - Polyrhythmic possibilities: Layer 1 at 4/4, Layer 2 at 3/4, etc.
     - Implementation: Independent tempo multipliers per layer
     - Visual sync: Pattern rotation/evolution speed matches rhythmic subdivision

9. **Interactive Controls**
   - Click/drag on canvas to modify active layer parameters
   - Visual handles for size, vibrancy adjustments
   - Mouse wheel for volume control
   - Keyboard shortcuts for common operations

## User Interface

10. **Control Panel** (Should be elegant and non-intrusive)
    - Planetary mode selector (visual icons for each planet)
    - Scale/root note selector
    - Tempo/BPM slider with tap tempo
    - Master volume and effects controls
    - Per-layer controls (expandable/collapsible):
      - Enable/disable layer
      - Solo/mute
      - Parameter sliders: vibrancy, size, pulse multiplier
      - Timbre preset selector
      - Arpeggio pattern selector

11. **Visual Aesthetics**
    - Dark theme optimized for visual prominence of cymatics
    - Planetary color scheme (sun = gold, moon = silver, mars = red, etc.)
    - Smooth CSS transitions
    - Professional typography
    - Responsive layout (desktop primary, tablet compatible)

12. **Advanced Features** (Go beyond basics - include as many as feasible)
    - **Preset System**: Save/load complete configurations (all layers)
    - **MIDI Input**: Optional MIDI controller support for live performance
    - **Audio Export**: Record output to WAV file
    - **Visual Export**: Save cymatic patterns as PNG/SVG
    - **Sequence Recording**: Record and loop arpeggio patterns
    - **Randomization**: "Cosmic dice" button for generative exploration
    - **Educational Mode**: Show frequency values, pattern equations, modal theory

</requirements>

<implementation>

## Technical Approach

**Audio Architecture**:
- Use Web Audio API's `OscillatorNode`, `GainNode`, `BiquadFilterNode`
- For FM synthesis, use one oscillator to modulate another's frequency
- Create an `AudioLayer` class to encapsulate each layer's audio graph
- Use `AudioContext.currentTime` for precise scheduling of arpeggio notes
- Implement audio parameter ramping (`linearRampToValueAtTime`) to avoid clicks

**Visual Architecture**:
- Create a `CymaticRenderer` class handling Canvas rendering
- Implement Chladni pattern generation using:
  ```javascript
  // Simplified example - you should research accurate formulas
  function chladniPattern(x, y, frequency, modeX, modeY) {
    return Math.sin(modeX * Math.PI * x) * Math.sin(modeY * Math.PI * y);
  }
  ```
- Use `requestAnimationFrame` for smooth rendering loop
- Consider using `OffscreenCanvas` or double-buffering for complex scenes

**Performance Considerations** (WHY: Real-time audio + graphics demands efficiency):
- Optimize pattern calculations with lookup tables or WebGL shaders if needed
- Throttle UI updates separate from audio/visual render loops
- Use Web Workers for heavy computations if blocking occurs
- Profile with Chrome DevTools to identify bottlenecks

**Code Organization**:
```
planetary-cymatics/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── app.js              # Main application logic, initialization
├── audio/
│   ├── AudioEngine.js      # Web Audio API management
│   ├── AudioLayer.js       # Individual layer audio graph
│   ├── Synthesizer.js      # Oscillator/FM synthesis logic
│   └── scales.js           # Scale definitions and music theory
├── visual/
│   ├── CymaticRenderer.js  # Canvas rendering engine
│   ├── patterns.js         # Chladni pattern mathematics
│   └── colors.js           # Planetary color schemes
└── ui/
    ├── ControlPanel.js     # UI component management
    └── presets.js          # Preset save/load system
```

**What to Avoid and WHY**:
- ❌ Don't use `setInterval` for audio timing (imprecise, causes drift) - use `AudioContext.currentTime`
- ❌ Don't create new oscillators on every note (expensive) - use a pool and reuse
- ❌ Don't update canvas on every audio callback (too frequent) - use separate render loop at 60 FPS
- ❌ Don't block the main thread with heavy calculations - use Web Workers if needed
- ❌ Don't ignore cross-browser compatibility - test in Chrome, Firefox, Safari
- ❌ Don't hardcode values - use constants and configuration objects for maintainability

**Scientifically Accurate Cymatics**:
Research and implement accurate Chladni pattern mathematics. Reference sources:
- Bessel functions for circular membranes
- Standing wave equations for rectangular plates
- Consider frequency-dependent mode numbers
- Model real-world physics constraints (damping, boundary conditions)

**Thoroughly explore multiple approaches** for pattern generation and choose the most visually striking while remaining scientifically grounded.

</implementation>

<output>
Create a self-contained web application with the following structure:

**Primary Files**:
- `./planetary-cymatics/index.html` - Main HTML with canvas element, control panel structure
- `./planetary-cymatics/styles.css` - Complete styling (dark theme, responsive, professional)
- `./planetary-cymatics/app.js` - Application entry point and initialization

**Audio Module Files**:
- `./planetary-cymatics/audio/AudioEngine.js` - Web Audio API context management, master controls
- `./planetary-cymatics/audio/AudioLayer.js` - Individual layer audio graph (oscillators, filters, effects)
- `./planetary-cymatics/audio/Synthesizer.js` - Low-level synthesis (FM, envelopes, modulation)
- `./planetary-cymatics/audio/scales.js` - Musical scale definitions and mode data

**Visual Module Files**:
- `./planetary-cymatics/visual/CymaticRenderer.js` - Canvas rendering engine with layer compositing
- `./planetary-cymatics/visual/patterns.js` - Chladni pattern mathematics and generation
- `./planetary-cymatics/visual/colors.js` - Planetary color palettes and visual themes

**UI Module Files**:
- `./planetary-cymatics/ui/ControlPanel.js` - UI component management and event handling
- `./planetary-cymatics/ui/presets.js` - Configuration save/load system

**Documentation**:
- `./planetary-cymatics/README.md` - Usage instructions, feature overview, technical notes

**File Organization**:
All files should be in the `./planetary-cymatics/` directory with subdirectories for logical grouping.

</output>

<verification>
Before declaring this complete, thoroughly verify:

**Audio System**:
1. All 8 planetary modes play correct scale degrees
2. Arpeggiation works at various tempos without timing drift
3. FM synthesis produces harmonically rich timbres with audible feedback
4. All effects (reverb, delay, filter) work correctly
5. No audio clicks, pops, or artifacts during parameter changes
6. Multiple layers play simultaneously without performance issues

**Visual System**:
1. Cymatic patterns accurately reflect frequency changes (higher = more complex)
2. Rendering maintains 60 FPS with multiple active layers
3. Visual parameters (vibrancy, size, pulse) correctly map to audio parameters
4. Layers blend visually in an aesthetically pleasing way
5. Patterns are scientifically recognizable as Chladni-type figures

**Interaction**:
1. All UI controls respond immediately and smoothly
2. Parameter changes affect both audio and visual in real-time
3. Preset save/load works correctly
4. Layer enable/disable/solo/mute functions properly
5. Responsive design works on different screen sizes

**Performance**:
1. No dropped frames during intensive use (8 layers active)
2. No memory leaks after extended use
3. CPU usage remains reasonable (<50% on modern hardware)
4. Audio buffer remains stable (no glitches or dropouts)

**Cross-Browser**:
1. Test in Chrome, Firefox, Safari (minimum)
2. Verify Web Audio API compatibility
3. Check Canvas rendering consistency

**Code Quality**:
1. Well-commented, especially mathematical formulas
2. Consistent code style throughout
3. No console errors or warnings
4. Clean separation of concerns (audio/visual/UI modules)

</verification>

<success_criteria>
This project is complete when:

✓ A user can open `index.html` in a modern browser and immediately interact with a fully functional instrument
✓ All 8 planetary modes produce distinct, musically correct arpeggios
✓ Cymatic patterns are scientifically accurate and visually stunning
✓ The visual-audio parameter mappings (vibrancy↔timbre, size↔volume, pulse↔time signature) work intuitively
✓ Multiple layers can play simultaneously with independent controls
✓ The interface is polished, professional, and delightful to use
✓ Performance is smooth (60 FPS visual, no audio glitches) even with complex multi-layer compositions
✓ The application serves educational, performative, meditative, and exploratory purposes effectively
✓ Code is clean, well-documented, and maintainable

**Ambition Level**: This should be a portfolio-worthy piece that demonstrates mastery of Web Audio API, Canvas rendering, mathematical pattern generation, and sophisticated interactive design. Go beyond the basics to create something truly remarkable.
</success_criteria>

<research>
Before beginning implementation, research:
1. Chladni pattern mathematics (Bessel functions, standing waves)
2. Web Audio API best practices for FM synthesis
3. High-performance Canvas rendering techniques
4. Musical mode theory and planetary correspondences
5. Real-time audio-visual synchronization strategies

Consider examining scientific papers on cymatics and acoustics for accurate pattern generation formulas.
</research>
