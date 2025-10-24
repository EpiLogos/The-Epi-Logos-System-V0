import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface HorizontalTracingBeamProps {
  startPoint?: number; // default: 0.7 (70vh)
  endPoint?: number;   // default: 1.3 (130vh)
  className?: string;
}

export const HorizontalTracingBeam: React.FC<HorizontalTracingBeamProps> = ({
  startPoint = 0.7,
  endPoint = 1.3,
  className
}) => {
  const [svgWidth, setSvgWidth] = useState<number>(1200); // Fixed initial value for SSR/hydration match
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const beamRef = useRef<SVGLineElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Set mounted and initial width after hydration
  useEffect(() => {
    setMounted(true);
    setSvgWidth(window.innerWidth);
  }, []);

  // Handle resize
  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => setSvgWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // Handle scroll with rAF throttle
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      const handler = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const startPx = windowHeight * startPoint;
        const endPx = windowHeight * endPoint;

        let progress = 0;
        if (scrollTop > startPx) {
          progress = Math.min((scrollTop - startPx) / (endPx - startPx), 1);
        }
        setScrollProgress(easeOutCubic(progress));
        ticking = false;
      };
      if (!ticking) {
        window.requestAnimationFrame(handler);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    onScroll(); // initial
    return () => window.removeEventListener('scroll', onScroll);
  }, [startPoint, endPoint]);

  // Apply width/gradient based on progress
  useEffect(() => {
    if (!beamRef.current || !gradientRef.current) return;
    const maxWidth = svgWidth;
    const beamWidth = Math.max(0, maxWidth * (1 - scrollProgress));

    beamRef.current.setAttribute('x2', beamWidth.toString());

    const gradientX = Math.max(0, beamWidth - 400);
    gradientRef.current.setAttribute('x1', gradientX.toString());
    gradientRef.current.setAttribute('x2', (gradientX + 400).toString());
  }, [scrollProgress, svgWidth]);

  return (
    <div className={cn('horizontal-beam-container', className)}>
      <svg width="100%" height="4" viewBox={`0 0 ${svgWidth} 4`}>
        <defs>
          <linearGradient
            ref={gradientRef}
            id="horizontalBeamGradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="400"
            y2="0"
          >
            <stop offset="0%" stopColor="#090a09" stopOpacity="0" />
            <stop offset="20%" stopColor="#333333" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#666666" stopOpacity="1" />
            <stop offset="100%" stopColor="#090a09" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background line */}
        <line x1="0" y1="2" x2={svgWidth} y2="2" className="horizontal-beam-background-line" />
        {/* Animated line */}
        <line ref={beamRef} x1="0" y1="2" x2={svgWidth} y2="2" className={cn('horizontal-beam-animated-line', 'horizontal-beam-transition')} />
      </svg>
    </div>
  );
};

export default HorizontalTracingBeam;

