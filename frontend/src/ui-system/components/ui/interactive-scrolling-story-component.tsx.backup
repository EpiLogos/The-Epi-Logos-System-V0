'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SlideData {
  title: string;
  description: string;
  content?: React.ReactNode;
  image?: string;
  bgColor: string;
  textColor: string;
  isHero?: boolean;
}

interface ScrollingFeatureShowcaseProps {
  slides: SlideData[];
  showImages?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonHref?: string;
}

interface TransitionState {
  activeIndex: number;
  scrollProgress: number; // 0-100 within current section
  blurAmount: number; // 0-8px blur during transitions
}

export function ScrollingFeatureShowcase({
  slides,
  showImages = false,
  showButton = false,
  buttonText = "Get Started",
  buttonHref = "#"
}: ScrollingFeatureShowcaseProps) {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    activeIndex: 0,
    scrollProgress: 0,
    blurAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyPanelRef = useRef<HTMLDivElement>(null);

  // Initial page load splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        rafId = requestAnimationFrame(() => {
          const currentScroll = container.scrollTop;
          const viewportHeight = window.innerHeight;

          // Calculate active index - clamped between 0 and slides.length-1
          const rawIndex = Math.floor(currentScroll / viewportHeight);
          const newActiveIndex = Math.max(0, Math.min(slides.length - 1, rawIndex));

          // Calculate progress within current section (0-100)
          // Use safe calculation to prevent negative values
          const sectionStart = newActiveIndex * viewportHeight;
          const scrollInSection = Math.max(0, currentScroll - sectionStart);
          const scrollProgress = Math.min(100, (scrollInSection / viewportHeight) * 100);

          // Calculate blur - only in transition zones
          const MAX_BLUR = 8;
          const THRESHOLD = 10; // Increased from 7% to 10% for smoother feel

          let blurAmount = 0;

          if (scrollProgress >= (100 - THRESHOLD)) {
            // Approaching next section (90-100%)
            const exitProgress = (scrollProgress - (100 - THRESHOLD)) / THRESHOLD;
            blurAmount = exitProgress * MAX_BLUR;
          } else if (scrollProgress <= THRESHOLD && scrollProgress > 0) {
            // Just entered section (0-10%)
            const enterProgress = (THRESHOLD - scrollProgress) / THRESHOLD;
            blurAmount = enterProgress * MAX_BLUR;
          }
          // else: Middle of section (10-90%), no blur

          setTransitionState({
            activeIndex: newActiveIndex,
            scrollProgress,
            blurAmount: Math.max(0, Math.min(MAX_BLUR, blurAmount)),
          });

          isScrolling = false;
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [slides.length]);

  const { activeIndex, scrollProgress, blurAmount } = transitionState;

  const dynamicStyles = {
    backgroundColor: slides[activeIndex].bgColor,
    color: slides[activeIndex].textColor,
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };

  // Helper to calculate blur and gradient mask for each slide
  const getSlideStyles = (index: number) => {
    const isActive = index === activeIndex;

    if (!isActive) {
      // Non-active slides: completely hidden
      return {
        filter: 'blur(0px)',
        opacity: 0,
        translateY: 0,
        pointerEvents: 'none' as const,
        contentOpacity: 0,
      };
    }

    // Active slide: always visible, blur only during transitions
    const MAX_BLUR = 8;
    const filter = blurAmount > 0 ? `blur(${blurAmount}px)` : 'blur(0px)';

    // Content opacity: hide when blur is active, show when clear
    // Threshold: start showing content when blur < 3px (more than halfway clear)
    const contentOpacity = blurAmount < 3 ? 1 : 0;

    return {
      filter,
      opacity: 1, // Container always visible
      translateY: 0,
      pointerEvents: 'auto' as const,
      contentOpacity,
    };
  };

  const gridPatternStyle = {
    '--grid-color': 'rgba(255, 255, 255, 0.05)',
    backgroundImage: `
      linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
    `,
    backgroundSize: '3.5rem 3.5rem',
  } as React.CSSProperties;

  return (
    <>
      {/* Initial Loading Splash Screen */}
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoading ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ pointerEvents: isLoading ? 'auto' : 'none' }}
      >
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Image
            src="/ui-system/epi-logos-logo-vibes.png"
            alt="Epi-Logos"
            width={450}
            height={450}
            priority
          />
        </motion.div>
      </motion.div>

      <div
        ref={scrollContainerRef}
        className="h-screen w-full overflow-y-scroll relative"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Logo - Sticky Top Left */}
        <div className="sticky top-4 left-4 z-50 float-left ml-4">
        <Image
          src="/ui-system/epi-logos-logo-vibes.png"
          alt="Epi-Logos"
          width={60}
          height={60}
          priority
        />
      </div>

      {/* Pagination Dots - Sticky to the right of logo */}
      <div className="sticky top-8 left-20 flex space-x-2 z-50 ml-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                // Scroll to viewport-based position
                container.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
              }
            }}
            className={`h-1 rounded-full transition-all duration-500 ease-in-out ${
              index === activeIndex ? 'w-12 bg-white/80' : 'w-6 bg-white/20'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scrollable sections with snap points */}
      <div className="relative">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const slideStyles = getSlideStyles(idx);

          return (
            <div
              key={`section-${idx}`}
              ref={idx === activeIndex ? stickyPanelRef : undefined}
              style={{
                height: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                backgroundColor: slide.bgColor,
                color: slide.textColor,
              }}
              className="relative w-full"
            >
              <div className="h-full w-full">
                <div className={`grid ${showImages && !slide.isHero ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} h-full w-full`}>

            {/* Content Column */}
            <div className={`relative flex flex-col justify-center ${showImages && !slides[activeIndex]?.isHero ? 'border-r border-gray-700/20 p-8 md:p-16' : ''}`}>
              {/* Pagination moved to fixed position above */}
              <div className="absolute top-16 left-16 flex space-x-2 z-10" style={{ display: 'none' }}>
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const container = scrollContainerRef.current;
                      if (container) {
                        const scrollableHeight = container.scrollHeight - window.innerHeight;
                        const stepHeight = scrollableHeight / slides.length;
                        container.scrollTo({ top: stepHeight * index, behavior: 'smooth' });
                      }
                    }}
                    className={`h-1 rounded-full transition-all duration-500 ease-in-out ${
                      index === activeIndex ? 'w-12 bg-white/80' : 'w-6 bg-white/20'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <div className="relative min-h-[500px] w-full">
                {slides.map((slide, index) => {
                  const slideStyles = getSlideStyles(index);
                  return (
                    <motion.div
                      key={index}
                      className="absolute inset-0"
                      animate={{
                        opacity: slideStyles.opacity,
                        y: slideStyles.translateY,
                        filter: slideStyles.filter,
                      }}
                      transition={{
                        duration: 0.15,
                        ease: 'linear',
                      }}
                      style={{
                        pointerEvents: slideStyles.pointerEvents,
                      }}
                    >
                      <motion.div
                        animate={{
                          opacity: slideStyles.contentOpacity,
                        }}
                        transition={{
                          duration: 0.25,
                          ease: 'easeOut',
                        }}
                      >
                        {slide.title && (
                          <h2 className="text-3xl md:text-4xl font-normal tracking-[3px] mb-10 text-white">
                            {slide.title}
                          </h2>
                        )}
                        <div className="text-base md:text-lg max-w-4xl leading-[2] tracking-[0.5px] mx-auto">
                          {slide.content || <p>{slide.description}</p>}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Get Started Button */}
              {showButton && (
                <div className="absolute bottom-16 left-16">
                  <a
                    href={buttonHref}
                    className="px-10 py-4 bg-white text-black text-[13px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
                  >
                    {buttonText}
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Image Content with Grid Background - Hidden for hero */}
            {showImages && !slides[activeIndex]?.isHero && (
              <div className="hidden md:flex items-center justify-center p-8" style={gridPatternStyle}>
                <div className="relative w-[50%] h-[80vh] rounded-sm overflow-hidden shadow-2xl border border-gray-700/20">
                  <div
                    className="absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateY(-${activeIndex * 100}%)` }}
                  >
                    {slides.map((slide, index) => (
                      <div key={index} className="w-full h-full">
                        {slide.image && (
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
