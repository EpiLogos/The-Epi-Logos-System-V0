'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';
import { cn } from '@/lib/utils';

const Genus6ModelViewer = dynamic(
  () => import('@/components/three/Genus6ModelViewer').then(mod => ({ default: mod.Genus6ModelViewer })),
  { ssr: false }
);

const NumberLanguageExplorer = dynamic(
  () => import('./NumberLanguageExplorer').then(mod => ({ default: mod.NumberLanguageExplorer })),
  { ssr: false }
);


// Sketchfab Torus Viewer with custom camera control
function SketchfabTorusViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Load Sketchfab Viewer API
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.onload = () => {
      const client = new (window as any).Sketchfab(iframe);

      client.init('9a1d30bf2ebf475cac7c3e5c0fcd79fe', {
        success: (api: any) => {
          api.start();
          api.addEventListener('viewerready', () => {
            // Initial camera position
            api.setCameraLookAt(
              [0, 8, 600],  // Start position
              [0, 0, 0],    // Look at center
              0,            // Instant
              () => {
                // Animate camera Y from 8 to 1200 over 4 seconds
                api.setCameraLookAt(
                  [0, 1200, 600],  // End position: elevated to Y=1200
                  [0, 0, 0],       // Look at center
                  4,               // Duration: 4 seconds
                  () => {}
                );
              }
            );
          });
        },
        error: () => {
          console.error('Sketchfab API error');
        },
        autostart: 1,
        preload: 1,
        camera: 0
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="Torus"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; fullscreen; xr-spatial-tracking"
      className="w-full h-full min-h-[700px]"
    />
  );
}

interface EssayScrollingSectionsProps {
  onEssaySelect: (id: string) => void;
  onSectionChange?: (index: number) => void;
}

interface EssayPreview {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  callToAction: string;
}

const essayPreviews: EssayPreview[] = [
  {
    id: 'prompt-packages',
    eyebrow: 'Prompt Packages',
    title: 'MEF & QL Ready for Use',
    description:
      'Structured prompt packages that embed the MEF and QL frameworks into AI conversations. These aren\'t theory - they\'re working tools designed to guide systems toward reflexive, balanced reasoning. Download, test, and help us refine them.',
    callToAction: 'View the prompt packages'
  },
  {
    id: 'epi-logos',
    eyebrow: 'Epi-Logos',
    title: 'The Notion of Epi-Logos',
    description:
      'Epi-Logos is the point where disparate meanings hold together without fusing—a gathering that preserves difference. The term comes from Greek: "upon the word," the stance that stands on what language makes available to see what comes next. We need this because reality unfolds through relationship, not isolated facts. The Epi-Logos formalizes this: a structure indefinite enough to apply everywhere, relational enough to connect anything. We attempt to create the hinge where diverse perspectives pivot together. This is how consciousness self-organizes—not by choosing one view but by discovering the axis that lets incompatible truths co-exist.',
    callToAction: 'Read the Epi-Logos essay'
  },
  {
    id: 'ql',
    eyebrow: 'Quaternal Logic',
    title: 'Quaternal Logic (QL)',
    description:
      'Quaternal Logic is the formal heart of Epi-Logos: a symbolic-mathematical law describing how unity differentiates into multiplicity without losing itself. Beginning from Spanda - the primordial vibration of self-differentiation expressed as (0/1) - QL unfolds the minimal architecture needed for coherent manifestation. Through the Trika (threefold operator that holds opposites in generative tension) and successive context frames, this oscillation crystallizes into the toroidal structure: a 4+2 pattern where four explicit operations circulate around two implicit depths. This is not abstract numerology but computable metaphysics - a grammar of becoming verified across physics, cognition, and cosmology.',
    callToAction: 'Read the QL essay'
  },
  {
    id: 'mef',
    eyebrow: 'Meta-Epistemic Framework',
    title: 'Meta-Epistemic Framework (MEF)',
    description:
      'The MEF formalizes reflexive incompleteness as generative process. Every rigorous system leaves an aperture—what it must exclude to function. This isn\'t defect but operative law: the gap that keeps reasoning alive. Through six lenses (archetypal, causal, logical, processual, meta-epistemic, divine-scalar), MEF performs diagnosis - not of knowledge but how knowledge is arrived at. It reveals what each paradigm represses and how that returns as crisis. The method: turn negative discoveries (Gödel\'s unprovability, Lacan\'s lack, Wittgenstein\'s silence, Derrida\'s deferral) into positive capacities. Systems that know they\'re contingent and remain free. Incompleteness becomes an engine; lack becomes the possibility of discovery.',
    callToAction: 'Read the MEF essay'
  },
  {
    id: 'num-lang',
    eyebrow: 'Number Language',
    title: 'Numbers: the language of being and becoming',
    description:
      'Beyond arithmetic, number becomes narrative. This essay follows how modulations of quantity express qualitative shifts, bridging formal systems, mythic sequencing, and lived strategy.',
    callToAction: 'Coming soon'
  }
];

export function EssayScrollingSections({ onEssaySelect, onSectionChange }: EssayScrollingSectionsProps) {
  const [showPDFExplorer, setShowPDFExplorer] = useState(false);
  const scrollControlRef = useRef<{ navigateToSection: (index: number) => void } | null>(null);

  // Listen for navigation events from external pagination dots
  useEffect(() => {
    const handleNavigation = (e: CustomEvent) => {
      scrollControlRef.current?.navigateToSection(e.detail.index);
    };
    window.addEventListener('essaySectionNavigate', handleNavigation as EventListener);
    return () => window.removeEventListener('essaySectionNavigate', handleNavigation as EventListener);
  }, []);

  const handleEssayClick = (essayId: string) => {
    if (essayId === 'num-lang') {
      // Coming soon - no action
      return;
    } else {
      // Regular essay handling (includes prompt-packages)
      onEssaySelect(essayId);
    }
  };

  const introSlide = {
    title: '',
    description: '',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    isHero: true,
    overlay: (
      <AuroraBackground
        fullScreen={false}
        centered={false}
        className="w-full h-full bg-black text-white opacity-80"
      />
    ),
    content: (
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
        <h1 className="text-[36px] font-normal tracking-[4px] text-white text-center mb-6 max-w-[1000px]">
          TWO FRAMES, 4 DOORWAYS
        </h1>
        <p className="text-[16px] text-gray-300 leading-[2] tracking-[0.8px] max-w-[800px] text-center">
          Here we share our <button onClick={() => onEssaySelect('prompt-packages')} className="text-gray-300 underline hover:text-white transition-colors">prompt packages</button> and essays to introduce people to the system. The best way in is to explore the example conversations in the prompt package section.
        </p>
        <p className="text-[10px] text-gray-500 max-w-[900px] leading-[1.8] tracking-[0.6px] text-center mt-12">
          Drafts are live and evolving; feedback is welcome.
        </p>
      </div>
    )
  };

  const previewSlides = essayPreviews.map((essay, index) => {
    const isEven = index % 2 === 0;

    return {
      title: '',
      description: '',
      bgColor: '#000000',
      textColor: '#FFFFFF',
      content: (
        <div className="w-full h-full flex items-center justify-center px-6 md:px-12 lg:px-24">
          <div className="w-full max-w-[1100px] border border-gray-900/60 bg-black/40 backdrop-blur-sm">
            <div
              className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 lg:items-stretch`}
            >
              <div className={`w-full lg:w-1/2 bg-gray-950 border-b border-gray-900/60 lg:border-b-0 lg:border-r lg:border-gray-900/60 flex items-center justify-center overflow-hidden ${essay.id === 'epi-logos' || essay.id === 'mef' || essay.id === 'ql' ? 'aspect-square' : 'min-h-[260px]'}`}>
                {essay.id === 'mef' ? (
                  <Suspense
                    fallback={
                      <div className="w-full h-full aspect-square bg-gradient-to-br from-pink-100 via-pink-50 to-pink-100 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">Loading 3D model...</span>
                      </div>
                    }
                  >
                    <Genus6ModelViewer />
                  </Suspense>
                ) : essay.id === 'epi-logos' ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100">
                    <SketchfabTorusViewer />
                  </div>
                ) : essay.id === 'ql' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center p-4">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="max-w-full max-h-full object-contain"
                    >
                      <source src="/ui-system/Torus Animation.mp4" type="video/mp4" />
                    </video>
                  </div>
                ) : essay.id === 'num-lang' ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      style={{ direction: 'normal' }}
                      onEnded={(e) => {
                        const video = e.currentTarget;
                        if (video.playbackRate === 1) {
                          video.playbackRate = -1;
                          video.play();
                        } else {
                          video.playbackRate = 1;
                          video.currentTime = 0;
                          video.play();
                        }
                      }}
                    >
                      <source src="/ui-system/anuttara-animation.mp4" type="video/mp4" />
                    </video>
                  </div>
                ) : essay.id === 'prompt-packages' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center p-4">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      <source src="/ui-system/Torus_Folding_From_Square_Plane - LOOP - Videobolt.net.mp4" type="video/mp4" />
                    </video>
                  </div>
                ) : (
                  <div className="text-center px-6 py-16 space-y-4">
                    <span className="text-[11px] uppercase tracking-[0.35em] text-gray-600">
                      imagery placeholder
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Drop in artwork, diagram, or archival photo that anchors this essay&apos;s perspective.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-1/2 px-6 py-10 md:px-10 md:py-12 space-y-6">
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.5em] text-gray-500">
                    {essay.eyebrow}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white">
                    {essay.title}
                  </h2>
                </div>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {essay.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleEssayClick(essay.id)}
                  className={cn(
                    "group inline-flex items-center text-xs md:text-sm uppercase tracking-[0.4em]",
                    essay.callToAction === 'Coming soon'
                      ? "text-gray-400 cursor-default"
                      : "text-gray-400 hover:text-white transition-colors"
                  )}
                >
                  {essay.callToAction}
                  <span className={cn(
                    "ml-4",
                    essay.callToAction === 'Coming soon'
                      ? "text-gray-600"
                      : "text-gray-600 group-hover:text-white"
                  )}>
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    };
  });

  return (
    <>
      <ScrollingFeatureShowcase
        slides={[introSlide, ...previewSlides]}
        showImages={false}
        showButton={false}
        hidePagination={true}
        onSectionChange={onSectionChange}
        ref={scrollControlRef}
      />

      {/* PDF Explorer Overlay */}
      {showPDFExplorer && (
        <NumberLanguageExplorer onClose={() => setShowPDFExplorer(false)} />
      )}
    </>
  );
}
