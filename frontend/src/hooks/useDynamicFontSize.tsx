import { useEffect, useState } from 'react';

// ============================================================================
// RESPONSIVE TYPOGRAPHY CONTROLS
// ============================================================================
// Formula: fontSize = BASE + (width × WIDTH_SCALE) + (height × HEIGHT_SCALE)
// Width has MORE influence because text wraps based on width
const BASE_SIZE = 2.7;           // Minimum size (mobile portrait)
const WIDTH_SCALE = 0.006;     // Width influence (primary)
const HEIGHT_SCALE = 0.002;    // Height influence (secondary)

/**
 * Responsive font size hook using width-primary scaling
 *
 * Width is the main factor (text wraps based on width)
 * Height is secondary (affects vertical space available)
 *
 * This creates font sizes that adapt to:
 * - Mobile portrait (narrow, tall): Small font (width constrained)
 * - Desktop landscape (wide, short): Larger font (width allows it)
 * - Desktop tall: Even larger font (width + height both contribute)
 */
export function useDynamicFontSize() {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const updateFontSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Mobile detection (viewport < 768px = mobile)
      const isMobile = width < 768;
      const baseSize = isMobile ? 4 : 2.7;

      // Width-dominant formula
      const calculatedSize = baseSize + (width * WIDTH_SCALE) + (height * HEIGHT_SCALE);

      console.log('[RESPONSIVE FONT]', {
        viewport: `${width} × ${height}`,
        widthContribution: (width * WIDTH_SCALE).toFixed(2),
        heightContribution: (height * HEIGHT_SCALE).toFixed(2),
        fontSize: calculatedSize.toFixed(2),
      });

      setFontSize(calculatedSize);

      // Also set as CSS variable on :root for universal access
      document.documentElement.style.setProperty('--dynamic-font-size', `${calculatedSize}px`);
    };

    // Initial calculation
    updateFontSize();

    // Update on resize with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateFontSize, 50);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return fontSize;
}
