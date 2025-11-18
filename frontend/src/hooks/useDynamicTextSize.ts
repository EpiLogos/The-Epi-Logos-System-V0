import { useState, useEffect, RefObject } from 'react';

interface UseDynamicTextSizeOptions {
  /**
   * Base font size in pixels (default: 14)
   */
  baseSize?: number;

  /**
   * Minimum font size in pixels (default: 9)
   */
  minSize?: number;

  /**
   * Maximum font size in pixels (default: 18)
   */
  maxSize?: number;

  /**
   * How much text should grow per 100px of container width (default: 0.4)
   * Example: 0.4 means for every 100px of width, text grows 0.4px
   */
  widthFactor?: number;

  /**
   * How much text should grow per 100px of container height (default: 0.3)
   * Example: 0.3 means for every 100px of height, text grows 0.3px
   */
  heightFactor?: number;
}

/**
 * Hook that calculates responsive font size based on container dimensions
 *
 * @param containerRef - Reference to the container element to measure
 * @param options - Configuration options for text sizing
 * @returns Font size in pixels
 */
export function useDynamicTextSize(
  containerRef: RefObject<HTMLElement>,
  options: UseDynamicTextSizeOptions = {}
): number {
  const {
    baseSize = 14,
    minSize = 9,
    maxSize = 18,
    widthFactor = 0.4,
    heightFactor = 0.3,
  } = options;

  const [fontSize, setFontSize] = useState(baseSize);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateFontSize = () => {
      const { width, height } = container.getBoundingClientRect();

      // Calculate size based on both dimensions
      const widthContribution = (width / 100) * widthFactor;
      const heightContribution = (height / 100) * heightFactor;

      // Base size + contributions from both dimensions
      let calculatedSize = baseSize + widthContribution + heightContribution;

      // Clamp to min/max
      calculatedSize = Math.max(minSize, Math.min(maxSize, calculatedSize));

      setFontSize(calculatedSize);
    };

    // Initial calculation
    updateFontSize();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateFontSize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, baseSize, minSize, maxSize, widthFactor, heightFactor]);

  return fontSize;
}
