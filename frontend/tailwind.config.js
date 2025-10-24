/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'jetbrains': ['JetBrains Mono', 'monospace'],
        'sans': ['JetBrains Mono', 'monospace'], // Make JetBrains Mono the default
      },
      colors: {
        // UI Clones exact colors
        'ui-gray': '#f5f5f5',
        'ui-dark': '#333',
        'ui-medium': '#666',
        'ui-border': '#e0e0e0', 
        'ui-panel': '#090a09',
        'ui-panel-border': '#cacaca',
        'ui-coord-text': '#666666',
      },
      spacing: {
        // UI Clones exact dimensions
        'sidebar': '420px',
        'grid-sidebar': '300px',
        '30': '30px',
        '40': '40px',
        '50': '50px',
        '90': '90px',
      },
      fontSize: {
        // UI Clones exact font sizes
        'coord': '72px',
        'coord-sm': '63px',
        'ui-sm': '11px',
        '90': '90px',
      },
      width: {
        'grid-sidebar': '300px',
      },
      brightness: {
        150: '1.5',
        180: '1.8',
      },
      contrast: {
        100: '1',
      },
      zIndex: {
        30: '30',
        35: '35',
      },
      borderOpacity: {
        '5': '0.05',
      },
      height: {
        'portfolio': '60vh',
      },
      borderWidth: {
        'panel': '1.222px',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)', 
            filter: 'blur(4px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)', 
            filter: 'blur(0px)' 
          },
        },
        'page-fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(15px)',
            filter: 'blur(3px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            filter: 'blur(0px)'
          }
        },
        'paramasiva-image-fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(0.95)',
            filter: 'contrast(1.5) brightness(1.2) blur(3px)'
          },
          '100%': {
            opacity: '0.7',
            transform: 'translate(-50%, -50%) scale(1)',
            filter: 'contrast(1) brightness(1.5) blur(0px)'
          }
        },
        'white-fade-out': {
          '0%': {
            opacity: '1'
          },
          '100%': {
            opacity: '0'
          }
        },
        'content-blur-in': {
          '0%': {
            filter: 'blur(4px)'
          },
          '100%': {
            filter: 'blur(0px)'
          }
        },
        'carousel-fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 400ms ease-out forwards',
        'page-fade-in': 'page-fade-in 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 800ms forwards',
        'grid-page-fade-in': 'page-fade-in 400ms ease-out 800ms forwards',
        'carousel-fade-in': 'carousel-fade-in 800ms ease-out forwards',
      },
      transitionTimingFunction: {
        // Original CSS transition curves from style.css - VERIFIED FROM ORIGINAL
        'paramasiva': 'cubic-bezier(0.19, 1, 0.22, 1)', // --paramasiva-easing from style.css
        'gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',   // --gentle-easing from style.css
      },
      transitionDuration: {
        // Original CSS timing variables from style.css
        'text-fade': '200ms',      // --text-fade-out
        'panel-height': '800ms',   // --panel-height  
        'panel-width': '1000ms',   // --panel-width
        'icon-move': '1800ms',     // --icon-move (tripled from 600ms)
        'text-fade-in': '400ms',   // --text-fade-in
        'transition-standard': '800ms', // Standard transition timing
        'hover-quick': '300ms',    // Quick hover effects
        'coord-text': '800ms',     // Coordinate text animations
      },
      transitionDelay: {
        // Multi-phase coordination delays - HARDCODED (Tailwind doesn't support calc())
        'phase-1': '0ms',                    // Text fade-out (immediate)
        'text-fade': '200ms',                // Layout changes after text fade (200ms)
        'phase-2a': '200ms',                 // Panel height (after text-fade-out)
        'phase-2b': '1000ms',                // Panel width (200ms + 800ms = 1000ms)
        'phase-2c': '2000ms',                // Icon move (200ms + 800ms + 1000ms = 2000ms) 
        'phase-3': '2600ms',                 // Text fade-in (200ms + 800ms + 1000ms + 600ms = 2600ms)
        '2200': '1000ms',                    // Paramasiva image specific delay (reduced from 2200ms)
        '3000ms': '3000ms',                  // SVG reappear delay (3 second delay for EpiLogos)
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      // SCROLLBAR UTILITIES MOVED TO @utility IN INDEX.CSS (TAILWIND V4 APPROACH)

      // Text size utilities for expansion states
      const expansionUtilities = {
        '.text-responsive-expand': {
          'transition': 'font-size 800ms cubic-bezier(0.4, 0, 0.2, 1), line-height 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.text-expanded-label': {
          'font-size': '18px',
          'line-height': '1.4',
          'margin-bottom': '12px',
        },
        '.text-expanded-value': {
          'font-size': '14px',
          'line-height': '1.6', 
          'margin-bottom': '20px',
        },
      };

      // Left-sidebar expansion utilities (Reverse Modal Pattern)
      // Following the EpiLogos Pattern: base transition + state utilities
      const leftSidebarUtilities = {
        // BASE TRANSITION: Always applied for smooth bidirectional transitions
        '.epi-sidebar-smooth-transition': {
          'transition': 'width 1000ms cubic-bezier(0.19, 1, 0.22, 1)',
        },
        
        // STATE UTILITIES: Only change width values, never declare transitions
        '.epi-sidebar-normal-state': {
          'width': '420px', // EpiLogos expanded state width
        },
        
        '.epi-sidebar-expanded-state': {
          'width': 'calc(100vw - 300px)', // Expanded to fill screen (minus target subsystems sidebar)
        },
        
        // CONTENT PANEL: Coordinated morphing for reverse modal
        '.epi-content-smooth-transition': {
          'transition': 'width 800ms cubic-bezier(0.19, 1, 0.22, 1) 200ms, opacity 400ms ease-out 200ms',
        },
        
        '.epi-content-normal-state': {
          'width': 'calc(100vw - 420px - 40px)', // Normal content panel width
          'opacity': '1',
        },
        
        '.epi-content-morphing-state': {
          'width': '300px', // Morphs to subsystems sidebar width
          'opacity': '0.3', // Fades during transition
        },
      };

      // ContentPanel transitions - Moved to src/index.css using @utility directive (Tailwind v4 approach)

      // ParamasivaImage - Moved to src/index.css using @utility directive (Tailwind v4 approach)

      // Conditional opacity and visibility utilities
      const conditionalStateUtilities = {
        '.opacity-conditional-visible': {
          'opacity': '1',
        },
        '.opacity-conditional-hidden': {
          'opacity': '0',
        },
        '.pointer-events-conditional-auto': {
          'pointer-events': 'auto',
        },
        '.pointer-events-conditional-none': {
          'pointer-events': 'none',
        },
      };

      // Dynamic height utilities for ScrollableContent - SYNCED WITH WORKING VALUES
      const scrollableHeightUtilities = {
        '.max-height-scrollable-default': {
          'max-height': 'calc(100vh - 200px)', // MATCHES working commit and default prop
        },
        '.min-height-scrollable': {
          'min-height': '300px', // MATCHES working commit minHeight
        },
      };

      // ProjectCarousel dynamic width and background utilities
      const carouselUtilities = {
        '.bg-carousel-card': {
          'background-color': 'rgba(128, 128, 128, 0.02)',
        },
      };

      // Canvas positioning utilities for background effects
      const canvasUtilities = {
        '.canvas-absolute-fullscreen': {
          'position': 'absolute',
          'top': '0',
          'left': '0',
          'width': '100%',
          'height': '100%',
          'pointer-events': 'none',
        },
        '.canvas-wave-layer': {
          'z-index': '2', // Above particles but below content
        },
      };

      addUtilities(expansionUtilities);
      addUtilities(leftSidebarUtilities);
      addUtilities(conditionalStateUtilities);
      addUtilities(scrollableHeightUtilities);
      addUtilities(carouselUtilities);
      addUtilities(canvasUtilities);
    }
  ]
}