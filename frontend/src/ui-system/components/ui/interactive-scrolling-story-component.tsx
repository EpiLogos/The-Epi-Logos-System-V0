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
  overlay?: React.ReactNode;
}

interface ScrollingFeatureShowcaseProps {
  slides: SlideData[];
  showImages?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonHref?: string;
}

export function ScrollingFeatureShowcase({
  slides,
  showImages = false,
  showButton = false,
  buttonText = "Get Started",
  buttonHref = "#"
}: ScrollingFeatureShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyPanelRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastTriggerTimeRef = useRef(0);

  // Initial page load splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Set initial scroll position to center of first section
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading) return;
    container.scrollTop = window.innerHeight * 0.5;
  }, [isLoading]);

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
      const scrollProgress = (scrollInSection / viewportHeight) * 100;

      const THRESHOLD = 15;
      let blur = 0;

      const isFirst = currentIndex === 0;
      const isLast = currentIndex === slides.length - 1;

      if (!isFirst && scrollProgress < THRESHOLD) {
        blur = ((THRESHOLD - scrollProgress) / THRESHOLD) * 8;
      } else if (!isLast && scrollProgress > (100 - THRESHOLD)) {
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
        className="h-screen w-full overflow-y-auto relative"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Tall inner container to create scroll space */}
        <div style={{ height: `${slides.length * 100}vh` }} className="relative">
          {/* Pagination Dots - Fixed top-left */}
          <div className="fixed top-8 left-12 flex space-x-2 z-50">
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
                  }
                }}
                className={`h-1 rounded-full transition-colors duration-300 ${
                  index === activeIndex ? 'w-12 bg-white/80' : 'w-6 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

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
                    isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
                  )}
                  style={{
                    backgroundColor: slide.bgColor,
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
                    <div className={`grid ${showImages && !slide.isHero ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} h-full w-full`}>
                      {/* Content Column */}
                      <div
                        className={`relative z-10 flex flex-col ${showImages && !slide.isHero ? 'border-r border-gray-700/20' : ''} ${slide.isHero ? 'items-center text-center justify-center p-8 md:p-16' : ''} ${slide.title && !slide.isHero ? 'px-12 md:px-16 pt-12 md:pt-16 pb-12' : ''}`}
                        style={{
                          opacity: 'var(--content-opacity, 1)',
                          transition: 'opacity 0.3s ease',
                        } as React.CSSProperties}
                      >
                        {slide.title && (
                          <h2 className="text-3xl md:text-4xl font-normal tracking-[3px] mb-10 text-white pl-2 pt-2">
                            {slide.title}
                          </h2>
                        )}
                        <div className={`${slide.title ? 'text-base md:text-lg max-w-5xl leading-[2] tracking-[0.5px] overflow-y-auto max-h-[calc(100vh-200px)]' : 'w-full h-full'}`}>
                          {slide.content || <p>{slide.description}</p>}
                        </div>
                      </div>

                      {/* Right Column: Image */}
                      {showImages && !slide.isHero && slide.image && (
                        <div className="hidden md:flex items-center justify-center p-8" style={gridPatternStyle}>
                          <div className="relative w-[80%] h-[80vh] rounded-sm overflow-hidden shadow-2xl border border-gray-700/20">
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="h-full w-full object-cover"
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
}
