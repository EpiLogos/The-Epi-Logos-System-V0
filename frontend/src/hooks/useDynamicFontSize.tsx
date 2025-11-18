import { useEffect, useState } from 'react';

// ============================================================================
// RESPONSIVE TYPOGRAPHY CONTROLS
// ============================================================================
// Formula: fontSize = BASE + (width × WIDTH_SCALE) + (height × HEIGHT_SCALE)
// Width has MORE influence because text wraps based on width
const BASE_SIZE = 2.7;               // Desktop base size
const DESKTOP_WIDTH_SCALE = 0.006;   // Desktop width influence (primary)
const DESKTOP_HEIGHT_SCALE = 0.002;  // Desktop height influence (secondary)
const MOBILE_WIDTH_SCALE = 0.005;    // Mobile width influence (primary)
const MOBILE_HEIGHT_SCALE = 0.0018;  // Mobile height influence (higher for portrait fill)

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
      const baseSize = isMobile ? 5.7 : 2.7;

      // Choose scales based on device type
      const widthScale = isMobile ? MOBILE_WIDTH_SCALE : DESKTOP_WIDTH_SCALE;
      const heightScale = isMobile ? MOBILE_HEIGHT_SCALE : DESKTOP_HEIGHT_SCALE;

      // Width-dominant formula with separate height contribution
      const widthContribution = width * widthScale;
      const heightContribution = height * heightScale;

      const calculatedSize = baseSize + widthContribution + heightContribution;

      console.log('[RESPONSIVE FONT]', {
        viewport: `${width} × ${height}`,
        isMobile,
        baseSize,
        heightScale,
        widthContribution: widthContribution.toFixed(2),
        heightContribution: heightContribution.toFixed(2),
        fontSize: calculatedSize.toFixed(2),
      });

      setFontSize(calculatedSize);

      // Also set as CSS variable on :root for universal access
      document.documentElement.style.setProperty('--dynamic-font-size', `${calculatedSize}px`);

      // Set heading size (smaller on mobile)
      const headingSize = isMobile ? calculatedSize * 1.3 : calculatedSize * 1.5;
      document.documentElement.style.setProperty('--dynamic-heading-size', `${headingSize}px`);

      // Set spacing (smaller on mobile)
      const spacing = isMobile ? calculatedSize * 0.7 : calculatedSize * 1.0;
      document.documentElement.style.setProperty('--dynamic-spacing', `${spacing}px`);
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
