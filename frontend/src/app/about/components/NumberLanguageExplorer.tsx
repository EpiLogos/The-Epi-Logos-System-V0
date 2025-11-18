'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViewportSection {
  id: string;
  name: string;
  description?: string;
  page: number;
  scale: number;
  offsetX: number; // X coordinate to focus on (in PDF coordinates)
  offsetY: number; // Y coordinate to focus on (in PDF coordinates)
}

// Define the journey through the Anuttara Language System
// PDF rendered at 2x (7974px wide), CSS transforms zoom/pan from there
// Scale: 0.5 = show full PDF (undo 2x), 1.0 = actual size, >1.0 = zoom in
const sections: ViewportSection[] = [
  {
    id: 'overview',
    name: 'The Complete Map',
    description: 'The full Anuttara Language System',
    page: 1,
    scale: 0.12, // Zoom out to show full map (PDF is 7974px wide @ 2x, container ~900px)
    offsetX: 0,
    offsetY: 0
  },
  {
    id: 'top-left',
    name: 'Top Left Section',
    description: 'Starting exploration point',
    page: 1,
    scale: 1.2,
    offsetX: 1500,
    offsetY: 1200
  }
];

interface NumberLanguageExplorerProps {
  onClose: () => void;
}

export function NumberLanguageExplorer({ onClose }: NumberLanguageExplorerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manual zoom and pan state
  const [manualZoom, setManualZoom] = useState(1.0);
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentViewport = sections[currentSection];

  // Load PDF document
  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const pdfjs = await import('pdfjs-dist');

        // Set worker URL for version 3.4.120
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

        const loadingTask = pdfjs.getDocument('/ui-system/Anuttara Language System.pdf');
        const pdf = await loadingTask.promise;

        if (mounted) {
          setPdfDoc(pdf);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      mounted = false;
    };
  }, []);

  // Render PDF page once at high resolution (2x for quality)
  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      const page = await pdfDoc.getPage(1);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Render at 2x for high quality, CSS transform will scale it down
      const scale = 2;
      const viewport = page.getViewport({ scale });

      // Use device pixel ratio for retina displays
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = viewport.width * outputScale;
      canvas.height = viewport.height * outputScale;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (outputScale !== 1) {
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      }

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      console.log('[NumberLanguageExplorer] PDF rendered at 2x', {
        canvasWidth: viewport.width,
        canvasHeight: viewport.height
      });
    } catch (error) {
      console.error('[NumberLanguageExplorer] Error rendering page:', error);
    }
  };

  // Render PDF once when loaded
  useEffect(() => {
    if (!pdfDoc || loading) return;
    renderPage();
  }, [pdfDoc, loading]);

  // Re-render on window resize
  useEffect(() => {
    if (!pdfDoc || loading) return;

    const handleResize = () => {
      renderPage(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentSection, loading]);

  const goToSection = async (index: number) => {
    if (index < 0 || index >= sections.length) return;

    console.log('[NumberLanguageExplorer] goToSection called', { from: currentSection, to: index });

    // Reset manual overrides when jumping to section
    setManualZoom(1.0);
    setManualOffset({ x: 0, y: 0 });

    // Update section immediately
    setCurrentSection(index);
  };

  const nextSection = () => goToSection(currentSection + 1);
  const prevSection = () => goToSection(currentSection - 1);

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.1, manualZoom + delta), 5.0);

    setManualZoom(newZoom);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - manualOffset.x, y: e.clientY - manualOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setManualOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showMinimap) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextSection();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSection();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setShowMinimap(!showMinimap);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, showMinimap, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white/70 text-sm">Loading PDF explorer...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Exit Button */}
      <button
        onClick={onClose}
        className="fixed top-6 left-6 z-50 px-4 py-2 bg-black/60 hover:bg-black/80 border border-gray-700 hover:border-gray-500 rounded text-xs text-gray-400 hover:text-white transition-all flex items-center gap-2"
        aria-label="Back to essays"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Essays</span>
      </button>

      {/* PDF Canvas Container with CSS Transform for Zoom/Pan */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full flex items-center justify-center p-6 overflow-hidden">
        <div
          className="relative w-full h-full max-w-[95%] max-h-[90%] bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <motion.canvas
            ref={canvasRef}
            initial={false}
            animate={{
              scale: currentViewport.scale * manualZoom,
              x: currentViewport.offsetX + manualOffset.x,
              y: currentViewport.offsetY + manualOffset.y,
            }}
            transition={{
              duration: 0,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              transformOrigin: 'center center',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6">
        {/* Previous Button */}
        <button
          onClick={prevSection}
          disabled={currentSection === 0 || isTransitioning}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full border transition-all",
            currentSection === 0 || isTransitioning
              ? "border-gray-800 text-gray-700 cursor-not-allowed"
              : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
          )}
          aria-label="Previous section"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSection(index)}
              disabled={isTransitioning}
              className={cn(
                "transition-all rounded-full",
                index === currentSection
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-gray-700 hover:bg-gray-500"
              )}
              aria-label={`Go to section ${index + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSection}
          disabled={currentSection === sections.length - 1 || isTransitioning}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full border transition-all",
            currentSection === sections.length - 1 || isTransitioning
              ? "border-gray-800 text-gray-700 cursor-not-allowed"
              : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
          )}
          aria-label="Next section"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Minimap Toggle */}
      <button
        onClick={() => setShowMinimap(!showMinimap)}
        className="fixed bottom-8 right-8 z-40 px-4 py-2 bg-black/80 backdrop-blur-sm border border-gray-800 rounded-sm text-xs text-gray-400 hover:text-white transition-colors"
      >
        {showMinimap ? 'Hide' : 'Show'} Map
      </button>

      {/* Keyboard Hints */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 text-xs text-gray-600 uppercase tracking-wider">
        <span>← → Navigate</span>
        <span className="mx-3">|</span>
        <span>M Map</span>
        <span className="mx-3">|</span>
        <span>Esc Close</span>
      </div>

      {/* Minimap Overlay */}
      <AnimatePresence>
        {showMinimap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-12"
            onClick={() => setShowMinimap(false)}
          >
            <div className="max-w-6xl w-full">
              <div className="grid grid-cols-3 gap-4">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSection(index);
                      setShowMinimap(false);
                    }}
                    className={cn(
                      "p-4 border rounded-sm text-left transition-all",
                      index === currentSection
                        ? "border-white bg-white/10"
                        : "border-gray-800 hover:border-gray-600"
                    )}
                  >
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                      {index + 1}
                    </p>
                    <p className="text-sm text-white mb-1">{section.name}</p>
                    {section.description && (
                      <p className="text-xs text-gray-500">{section.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
