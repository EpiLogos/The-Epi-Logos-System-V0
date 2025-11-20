'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDynamicFontSize } from '@/hooks/useDynamicFontSize';

interface SlideData {
  title: string;
  description: string;
  content?: React.ReactNode;
  image?: string;
  bgColor: string;
  textColor: string;
  isHero?: boolean;
  overlay?: React.ReactNode;
}

interface ScrollingFeatureShowcaseProps {
  slides: SlideData[];
  showImages?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonHref?: string;
  hidePagination?: boolean;
  onSectionChange?: (index: number) => void;
  customNavigateEvent?: string;
  isLightMode?: boolean;
}

export const ScrollingFeatureShowcase = React.forwardRef<
  { navigateToSection: (index: number) => void },
  ScrollingFeatureShowcaseProps
>(function ScrollingFeatureShowcase({
  slides,
  showImages = false,
  showButton = false,
  buttonText = "Get Started",
  buttonHref = "#",
  hidePagination = false,
  onSectionChange,
  customNavigateEvent,
  isLightMode = false
}, ref) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyPanelRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate responsive font size (now sets global CSS variable)
  useDynamicFontSize();

  const lastTriggerTimeRef = useRef(0);

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Expose navigation method via ref
  React.useImperativeHandle(ref, () => ({
    navigateToSection: (index: number) => {
      const container = scrollContainerRef.current;
      if (container && index >= 0 && index < slides.length) {
        lastTriggerTimeRef.current = Date.now();
        const targetScroll = index * window.innerHeight + (window.innerHeight * 0.5);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        setActiveIndex(index);
        onSectionChange?.(index);
      }
    }
  }));

  // Listen for custom navigation events (e.g., sidebarSectionNavigate)
  useEffect(() => {
    if (!customNavigateEvent) return;

    const handleNavigateEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ index: number }>;
      const container = scrollContainerRef.current;
      if (container && customEvent.detail && customEvent.detail.index >= 0 && customEvent.detail.index < slides.length) {
        lastTriggerTimeRef.current = Date.now();
        const targetScroll = customEvent.detail.index * window.innerHeight + (window.innerHeight * 0.5);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        setActiveIndex(customEvent.detail.index);
        onSectionChange?.(customEvent.detail.index);
      }
    };

    window.addEventListener(customNavigateEvent, handleNavigateEvent);
    return () => window.removeEventListener(customNavigateEvent, handleNavigateEvent);
  }, [customNavigateEvent, slides.length, onSectionChange]);

  // Set initial scroll position to center of first section
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Small delay to ensure logo overlay is visible first
    const timer = setTimeout(() => {
      container.scrollTop = window.innerHeight * 0.5;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Wheel-triggered section jumping
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationRafId: number;
    const LOCK_DURATION = 1200;

    const animate = (startTime: number, startScroll: number, targetScroll: number, targetIndex: number) => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const duration = 600;
      const progress = Math.min(elapsed / duration, 1);

      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollTop = startScroll + (targetScroll - startScroll) * eased;

      if (progress < 1) {
        animationRafId = requestAnimationFrame(() => animate(startTime, startScroll, targetScroll, targetIndex));
      } else {
        setActiveIndex(targetIndex);
        onSectionChange?.(targetIndex);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();

      if (now - lastTriggerTimeRef.current < LOCK_DURATION) return;
      lastTriggerTimeRef.current = now;

      const direction = e.deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + direction));

      if (newIndex === activeIndex) return;

      const startScroll = container.scrollTop;
      const targetScroll = newIndex * window.innerHeight + (window.innerHeight * 0.5);

      animate(performance.now(), startScroll, targetScroll, newIndex);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (animationRafId) cancelAnimationFrame(animationRafId);
    };
  }, [slides.length, activeIndex]);

  // Touch gesture handling for mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationRafId: number;
    const LOCK_DURATION = 1200;
    const SWIPE_THRESHOLD = 50; // minimum pixels for a swipe
    const VELOCITY_THRESHOLD = 0.3; // pixels per millisecond for quick flicks
    const ANGLE_RATIO = 2; // horizontal must be 2x vertical to be horizontal swipe

    const animate = (startTime: number, startScroll: number, targetScroll: number, targetIndex: number) => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const duration = 600;
      const progress = Math.min(elapsed / duration, 1);

      // easeInOutCubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollTop = startScroll + (targetScroll - startScroll) * eased;

      if (progress < 1) {
        animationRafId = requestAnimationFrame(() => animate(startTime, startScroll, targetScroll, targetIndex));
      } else {
        setActiveIndex(targetIndex);
        onSectionChange?.(targetIndex);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single-finger gestures
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      // We need to prevent default during move for vertical swipes
      // to stop native scrolling, but only if we're likely doing a gesture
      if (!touchStartRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // If this looks like a vertical swipe, prevent default to stop native scroll
      if (absY > 10 && absY > absX) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      // Get the final position from changedTouches
      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const elapsed = Date.now() - touchStartRef.current.time;

      // Calculate velocities (px/ms)
      const velocityX = elapsed > 0 ? absX / elapsed : 0;
      const velocityY = elapsed > 0 ? absY / elapsed : 0;

      touchStartRef.current = null;

      // Determine if this is a horizontal or vertical swipe
      const isHorizontalSwipe = absX > absY * ANGLE_RATIO;
      const isVerticalSwipe = absY > absX;

      // Handle horizontal swipe for sidebar toggle
      if (isHorizontalSwipe && (absX >= SWIPE_THRESHOLD || velocityX >= VELOCITY_THRESHOLD)) {
        // Dispatch sidebar toggle event
        // Swipe left (negative deltaX) or right (positive deltaX)
        const direction = deltaX > 0 ? 'right' : 'left';
        const event = new CustomEvent('sidebarSwipeToggle', {
          detail: { direction }
        });
        window.dispatchEvent(event);
        return;
      }

      // Handle vertical swipe for section navigation
      if (isVerticalSwipe && (absY >= SWIPE_THRESHOLD || velocityY >= VELOCITY_THRESHOLD)) {
        const now = Date.now();

        // Check lock duration
        if (now - lastTriggerTimeRef.current < LOCK_DURATION) return;
        lastTriggerTimeRef.current = now;

        // Swipe up (negative deltaY) = next section, swipe down (positive deltaY) = previous section
        const direction = deltaY < 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + direction));

        if (newIndex === activeIndex) return;

        const startScroll = container.scrollTop;
        const targetScroll = newIndex * window.innerHeight + (window.innerHeight * 0.5);

        animate(performance.now(), startScroll, targetScroll, newIndex);
      }
    };

    // Use passive: false for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (animationRafId) cancelAnimationFrame(animationRafId);
    };
  }, [slides.length, activeIndex, onSectionChange]);

  // Update blur based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number;

    const updateBlur = () => {
      const currentScroll = container.scrollTop;
      const viewportHeight = window.innerHeight;
      const rawIndex = Math.floor(currentScroll / viewportHeight);
      const currentIndex = Math.max(0, Math.min(slides.length - 1, rawIndex));

      const sectionStart = currentIndex * viewportHeight;
      const scrollInSection = currentScroll - sectionStart;
      const scrollProgress = Math.min(100, (scrollInSection / viewportHeight) * 100);

      const THRESHOLD = 15;
      let blur = 0;

      const isFirst = currentIndex === 0;
      const isLast = currentIndex === slides.length - 1;

      // Only apply blur in valid transition zones
      if (!isFirst && scrollProgress < THRESHOLD && scrollProgress >= 0) {
        blur = ((THRESHOLD - scrollProgress) / THRESHOLD) * 8;
      } else if (!isLast && scrollProgress > (100 - THRESHOLD) && scrollProgress <= 100) {
        blur = ((scrollProgress - (100 - THRESHOLD)) / THRESHOLD) * 8;
      }

      const slide = slideRefs.current[currentIndex];
      if (slide) {
        slide.style.setProperty('--blur-amount', `${blur}px`);
        slide.style.setProperty('--content-opacity', blur < 3 ? '1' : '0');
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBlur);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [slides.length]);

  const gridPatternStyle = {
    '--grid-color': isLightMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
    backgroundImage: `
      linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
    `,
    backgroundSize: '3.5rem 3.5rem',
  } as React.CSSProperties;

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="h-screen w-full overflow-y-auto relative"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Tall inner container to create scroll space - extra 100vh for last section positioning */}
        <div style={{ height: `${(slides.length + 1) * 100}vh` }} className="relative">
          {/* Pagination Dots - Fixed right side, responsive orientation */}
          {!hidePagination && !slides[activeIndex]?.isHero && (
            <div className="fixed md:top-8 top-1/2 md:-translate-y-0 -translate-y-1/2 md:right-12 right-4 z-50 flex md:flex-row flex-col md:space-x-2 space-y-2 md:space-y-0">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const container = scrollContainerRef.current;
                    if (container && (Date.now() - lastTriggerTimeRef.current >= 1200)) {
                      lastTriggerTimeRef.current = Date.now();
                      const targetScroll = index * window.innerHeight + (window.innerHeight * 0.5);
                      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
                      setActiveIndex(index);
                      onSectionChange?.(index);
                    }
                  }}
                  className={cn(
                    "h-1 rounded-full transition-colors duration-300",
                    index === activeIndex
                      ? isLightMode
                        ? "w-2 md:w-12 bg-gray-800/80"
                        : "w-2 md:w-12 bg-white/80"
                      : isLightMode
                        ? "w-2 md:w-6 bg-gray-800/20 hover:bg-gray-800/40"
                        : "w-2 md:w-6 bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Sticky panel that holds all slides */}
          <div ref={stickyPanelRef} className="sticky top-0 h-screen w-full">
            {slides.map((slide, idx) => {
              const isActive = idx === activeIndex;

              return (
                <div
                  key={`section-${idx}`}
                  ref={el => slideRefs.current[idx] = el}
                  className={cn(
                    "absolute inset-0 w-full h-full transition-opacity duration-700",
                    isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0",
                    // Mobile transparent backgrounds for non-hero slides
                    !slide.isHero && "max-md:!bg-transparent"
                  )}
                  style={{
                    backgroundColor: slide.overlay ? 'transparent' : slide.bgColor,
                    color: slide.textColor,
                    filter: isActive ? 'blur(var(--blur-amount, 0px))' : 'none',
                    '--blur-amount': '0px',
                    '--content-opacity': '1',
                  } as React.CSSProperties}
                >
                  {/* Full-viewport overlay for this section */}
                  {isActive && slide.overlay && (
                    <div className="absolute inset-0 z-0 pointer-events-none select-none">
                      {slide.overlay}
                    </div>
                  )}

                  <div className="relative h-full w-full">
                    <div className={`grid ${showImages && !slide.isHero ? 'grid-cols-1 md:grid-cols-2 ' : 'grid-cols-1'} h-full w-full`}>
                      {/* Content Column */}
                      <div
                        className={cn(
                          "relative z-10 flex flex-col",
                          showImages && !slide.isHero && 'md:border-r border-gray-700/20 items-center justify-start',
                          slide.isHero && 'items-center text-center justify-center',
                        )}
                        style={{
                          width: '100%',
                          height: '100%',
                          opacity: 'var(--content-opacity, 1)',
                          transition: 'opacity 0.3s ease',
                          padding: slide.isHero
                            ? 'calc(var(--dynamic-spacing) * 2)'
                            : slide.title && !slide.isHero
                              ? 'calc(var(--dynamic-spacing) * 3) var(--dynamic-spacing) 0'
                              : undefined
                        } as React.CSSProperties}
                      >
                        {showImages && !slide.isHero && slide.title ? (
                          <div
                            className="flex flex-col"
                            style={{
                              width: 'clamp(70%, calc(100vw - var(--dynamic-spacing) * 4), 85%)',
                              padding: 'var(--dynamic-spacing)',
                              marginTop: 'calc(var(--dynamic-spacing) * 2)',
                              marginBottom: 'var(--dynamic-spacing)'
                            }}
                          >
                            <h2 className={cn(
                              "font-normal tracking-[2px] flex-shrink-0",
                              isLightMode ? "text-slate-900" : "text-white"
                            )} style={{
                              fontSize: 'var(--dynamic-heading-size)',
                              marginBottom: 'calc(var(--dynamic-spacing) * 0.5)'
                            }}>
                              {slide.title}
                            </h2>
                            <div className="overflow-y-auto flex-1">
                              {slide.content || <p>{slide.description}</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col">
                            {slide.title && (
                              <h2 className={cn(
                                "font-normal tracking-[2px]",
                                isLightMode ? "text-slate-900" : "text-white"
                              )} style={{
                                fontSize: 'var(--dynamic-heading-size)',
                                marginBottom: 'var(--dynamic-spacing)',
                                paddingTop: 'calc(var(--dynamic-spacing) * 0.3)'
                              }}>
                                {slide.title}
                              </h2>
                            )}
                            <div className={cn(
                              slide.title ? 'max-w-5xl overflow-y-auto flex-1' : 'w-full h-full'
                            )}>
                              {slide.content || <p>{slide.description}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Image */}
                      {showImages && !slide.isHero && slide.image && (
                        <div className="hidden md:flex items-center justify-center p-4 md:p-6 lg:p-8" style={isLightMode ? {} : gridPatternStyle}>
                          <div
                            className={cn(
                              "relative rounded-sm overflow-hidden",
                              isLightMode ? "" : "shadow-2xl border border-gray-700/20"
                            )}
                            style={{
                              width: 'fit-content',
                              maxWidth: '90%',
                              maxHeight: '85vh',
                              margin: '0 auto'
                            }}
                          >
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="block max-w-full max-h-[85vh] w-auto h-auto object-cover"
                              style={{ transform: 'scale(1.15)' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
});
