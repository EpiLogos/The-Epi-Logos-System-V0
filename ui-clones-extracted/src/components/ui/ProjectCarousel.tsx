import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ProjectCarouselProps {
  className?: string;
  visible?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  variant?: 'modal' | 'projects'; // Differentiate between modal and projects page usage
  onNavigationRender?: (navigation: React.ReactNode) => void;
}

const carouselData = [
  {
    id: 1,
    title: "SPATIAL DESIGN",
    description: "Explore innovative spatial design concepts that revolutionize how we interact with physical and digital environments."
  },
  {
    id: 2,
    title: "VISUAL IDENTITY",
    description: "Discover comprehensive visual identity systems that create lasting brand impressions across all touchpoints."
  },
  {
    id: 3,
    title: "INTERACTIVE MEDIA",
    description: "Learn about cutting-edge interactive media installations that engage audiences through immersive experiences."
  },
  {
    id: 4,
    title: "MOTION GRAPHICS",
    description: "See how motion graphics bring static designs to life, creating dynamic visual narratives that captivate viewers."
  },
  {
    id: 5,
    title: "DIGITAL INSTALLATIONS",
    description: "Explore digital installations that blur the boundaries between art, technology, and human interaction."
  },
  {
    id: 6,
    title: "CREATIVE DIRECTION",
    description: "Discover comprehensive creative direction strategies that guide visual storytelling across multiple platforms."
  }
];

// Map index to gradient background utility
const getCardBackgroundClass = (index: number) => {
  const classes = ['card-bg-1', 'card-bg-2', 'card-bg-3', 'card-bg-4', 'card-bg-5', 'card-bg-6'];
  return classes[index % classes.length];
};


export const ProjectCarousel: React.FC<ProjectCarouselProps> = ({
  className,
  showArrows = true,
  showDots = true,
  variant = 'modal',
  onNavigationRender
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemWidth = 340; // Width of each item including margin
  const visibleItems = 3.5; // Show ~4 cards

  const updateCarousel = () => {
    if (trackRef.current) {
      const translateX = -currentIndex * itemWidth;
      trackRef.current.style.transform = `translateX(${translateX}px)`;
    }
  };

  const nextSlide = () => {
    if (currentIndex < carouselData.length - visibleItems) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    updateCarousel();
  }, [currentIndex]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex >= carouselData.length - visibleItems;

  // Create navigation component
  const NavigationComponent = (
    <div className="flex justify-center items-center gap-6">
      <button
        onClick={prevSlide}
        disabled={isPrevDisabled}
        className={cn(
          "w-10 h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center text-base font-light transition-all duration-200 shadow-sm",
          isPrevDisabled
            ? "opacity-40 cursor-not-allowed text-gray-400"
            : "hover:bg-white hover:border-gray-400 hover:shadow-md text-gray-600 cursor-pointer"
        )}
      >
        ←
      </button>

      <button
        onClick={nextSlide}
        disabled={isNextDisabled}
        className={cn(
          "w-10 h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center text-base font-light transition-all duration-200 shadow-sm",
          isNextDisabled
            ? "opacity-40 cursor-not-allowed text-gray-400"
            : "hover:bg-white hover:border-gray-400 hover:shadow-md text-gray-600 cursor-pointer"
        )}
      >
        →
      </button>
    </div>
  );

  // Pass navigation to parent if callback provided
  useEffect(() => {
    if (onNavigationRender) {
      onNavigationRender(NavigationComponent);
    }
  }, [currentIndex, onNavigationRender]);

  return (
    <div className={cn(
      "w-full max-w-full",
      className
    )}>
      {/* Carousel Container */}
      <div className="relative overflow-hidden w-full">
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: `${carouselData.length * itemWidth}px`
          }}
        >
          {carouselData.map((project) => (
            <div
              key={project.id}
              className={cn(
                variant === 'projects' ? 'projects-carousel-item' : 'modal-carousel-item'
              )}
              style={{ width: `${itemWidth}px` }}
            >
              <div className={cn(
                "relative border border-gray-400/[0.05] rounded p-6 h-[400px] flex flex-col justify-between",
                "carousel-card-transition",
                getCardBackgroundClass((project.id - 1))
              )}>
                {/* No additional background layers */}

                {/* Card Content */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-gray-100 text-sm font-medium tracking-wider mb-3">
                      {project.title}
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="text-gray-400 text-xs tracking-wider cursor-pointer hover:text-gray-200 transition-colors duration-200">
                    Read more →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - only show if not using external navigation */}
      {showArrows && !onNavigationRender && NavigationComponent}

      {/* Dots indicator */}
      {showDots && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(carouselData.length - visibleItems + 1) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                currentIndex === index
                  ? "bg-gray-600"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectCarousel;