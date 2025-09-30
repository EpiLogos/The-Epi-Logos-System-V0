import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface SubsystemCarouselProps {
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  onNavigationRender?: (navigation: React.ReactNode) => void;
}

const carouselData = [
  { id: 1, title: 'Heart Health', description: 'Explore circulatory benefits and thermal regulation insights.' },
  { id: 2, title: 'Weight Loss', description: 'Metabolic activation and caloric expenditure mechanisms.' },
  { id: 3, title: 'Skin Health', description: 'Dermal rejuvenation and collagen support pathways.' },
  { id: 4, title: 'Immunity Boost', description: 'Immune modulation and cellular vitality improvements.' },
  { id: 5, title: 'Healthy Sleep', description: 'Circadian alignment and parasympathetic regulation.' },
  { id: 6, title: 'Pain Relief', description: 'Inflammatory down‑regulation and muscular relaxation.' }
];

export const SubsystemCarousel: React.FC<SubsystemCarouselProps> = ({
  className,
  showArrows = true,
  showDots = false,
  onNavigationRender
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Show 4 at a time, slide by 1 card
  const VISIBLE = 4;

  const [containerWidth, setContainerWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0); // left-most visible index

  const computeSizes = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    setContainerWidth(width);
  };

  useEffect(() => {
    computeSizes();
    const onResize = () => computeSizes();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;
    const itemWidth = containerWidth / VISIBLE;
    const translateX = -(currentIndex * itemWidth);
    trackRef.current.style.transform = `translateX(${translateX}px)`;
  }, [currentIndex, containerWidth]);

  const maxIndex = Math.max(0, carouselData.length - VISIBLE);
  const nextSlide = () => setCurrentIndex((i) => Math.min(i + 1, maxIndex));
  const prevSlide = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  // Touch/swipe support (page based)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return;
    const dist = touchStart - touchEnd;
    if (dist > 60) nextSlide();
    if (dist < -60) prevSlide();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex >= maxIndex;

  const itemWidth = containerWidth > 0 ? containerWidth / VISIBLE : 0;
  const itemHeight = Math.round(itemWidth * 1.5); // +50% taller than square
  const controlsMargin = Math.round(itemHeight * 0.03); // ~3% spacing below cards

  const NavigationComponent = (
    <div className="flex justify-center items-center gap-6" style={{ marginTop: controlsMargin }}>
      <button
        onClick={prevSlide}
        disabled={isPrevDisabled}
        className={cn(
          'w-10 h-10 rounded-full border bg-white/80 backdrop-blur-sm flex items-center justify-center text-base font-light transition-all duration-200 shadow-sm',
          isPrevDisabled
            ? 'opacity-40 cursor-not-allowed text-gray-400 border-[#89aeda]'
            : 'hover:bg-white hover:shadow-md text-[#315e8f] border-[#89aeda]'
        )}
      >
        ←
      </button>
      <button
        onClick={nextSlide}
        disabled={isNextDisabled}
        className={cn(
          'w-10 h-10 rounded-full border bg-white/80 backdrop-blur-sm flex items-center justify-center text-base font-light transition-all duration-200 shadow-sm',
          isNextDisabled
            ? 'opacity-40 cursor-not-allowed text-gray-400 border-[#89aeda]'
            : 'hover:bg-white hover:shadow-md text-[#315e8f] border-[#89aeda]'
        )}
      >
        →
      </button>
    </div>
  );

  useEffect(() => {
    if (onNavigationRender) onNavigationRender(NavigationComponent);
  }, [currentIndex, onNavigationRender]);

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      <div className="relative overflow-hidden w-full">
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: `${carouselData.length * (itemWidth || 0)}px` }}
        >
          {carouselData.map((project) => (
            <div
              key={project.id}
              className={cn('subsystem-carousel-item')}
              style={{ width: `${itemWidth}px`, height: `${itemHeight || 0}px` }}
            >
              <div className={cn(
                'relative subsystem-card rounded-none h-full w-full p-6 flex flex-col justify-between'
              )}>
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-[#1f3d5c] text-[18px] font-normal tracking-wide mb-3">
                      {project.title}
                    </h3>
                    <p className="text-[#2e4d70] text-xs leading-relaxed opacity-80">
                      {project.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline arrows if not externally rendered */}
      {showArrows && !onNavigationRender && NavigationComponent}

      {showDots && (
        <div className="flex justify-center gap-2" style={{ marginTop: controlsMargin }}>
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                currentIndex === i ? 'bg-[#315e8f]' : 'bg-[#89aeda] hover:bg-[#6d9ace]'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubsystemCarousel;
