'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';
import { cn } from '@/lib/utils';
import { useLightMode } from '@/contexts/LightModeContext';

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
    title: 'Epi-Logos Philosophical Frameworks',
    description:
      'These are structured prompt packages that embed the core philosophical systems of the Epi-Logos project, the Meta-Epistemic Framework and Quaternal Logic into AI conversations. These are born of philosophical theory but aim toward AI as the medium of engagement - they\'re working tools designed to guide language systems toward reflexive and balanced reasoning, demonstrating what the theories define. It is our attempt to give a paradigm that can be learned and audited conversationally. Download, test, and help us refine.',
    callToAction: 'View the prompt packages'
  },
  {
    id: 'epi-logos',
    eyebrow: '#: The Epi-Logos Project',
    title: 'The Notion of Epi-Logos',
    description:
      'Epi-Logos is the point where disparate meanings hold together without fusing - a gathering that preserves difference. The term comes from Greek: "upon the word," the stance that stands on what language has made available to us, to see what we can make of the fallout. We need this because reality unfolds through relationship, not isolated facts. The Epi-Logos formalizes this through a structure indefinite enough to apply everywhere, relational enough to connect anything. Topology supplies the symbolic language that makes this possible. This essay attempts to make clear the hinge by which diverse perspectives pivot together. This is how understanding self-organizes - not by choosing one view but by discovering the axis that lets divergent truths co-exist.',
    callToAction: 'Read the Epi-Logos essay'
  },
  {
    id: 'ql',
    eyebrow: '#1-3 and #1-4: Spanda Genesis and Quaternal Logic\'s Flowering',
    title: 'Quaternal Logic (QL)',
    description:
      'Quaternal Logic is the formal heart of Epi-Logos: a symbolic-mathematical law describing how unity differentiates into multiplicity without losing itself. Beginning from Spanda - the primordial vibration of self-differentiation expressed as (0/1) - QL unfolds the minimal architecture needed for coherent becoming. Through a logical series of part-metaphysical, part-mathematical developments, this oscillation crystallizes into the basic formula for the toroidal structure: a 4 sided shape folded twice, forming a tube then a ring, producing 2 loops. Quaternal Logic takes the torus and its 4+2 formula as primary symbols for systems that transcend and include themselves, the example par excellence being consciousness. A knowledge that includes the knower in its account must, we argue, hold this form.',
    callToAction: 'Read the QL essay'
  },
  {
    id: 'mef',
    eyebrow: '#2-1: The Meta-Epistemic Framework or Meta-Logikon',
    title: 'Meta-Epistemic Framework (MEF)',
    description:
      'Every rigorous system leaves an aperture - that which it must exclude to function. This isn\'t a defect but an operative law. All things are limited, and limitation is the condition for uniqueness, specificity. This helps us to make knowledge, but at the cost of becoming, often, one sided in our knowing. Through six lenses (archetypal, causal, logical, processual, meta-epistemic, divine-scalar), MEF performs diagnosis - not of knowledge itself but how knowledge is arrived at within a field of conditions. The process of knowing operates within a set of dimensions which are already uniquely meaningful. Thus the MEF aims to help define the field and apply it, in order to reveal in our knowledge systems and personal thought the latent paradigm, the limits it sets, what it represses in order to function, and in what ways the excluded portion returns - whether as grace or crisis.',
    callToAction: 'Read the MEF essay'
  },
  {
    id: 'num-lang',
    eyebrow: '#0-3: The Archetypal Number Language',
    title: 'Numbers: the language of being and becoming',
    description:
      'Within the Anuttara domain - #0, the silent ground before manifestation - numbers emerge not as quantities but as organizing principles of reality itself. This metaphysical system reveals how Being (pure potential) and Becoming (active agency) fold into each other through archetypal patterns: the mirror that enables self-recognition, the relational field where meaning is born, the first word that speaks intelligence into form, the stable structures that receive divine action. Here, zero is not nothing but witnessing presence; one is not singularity but creative assertion; and their interplay choreographs the eternal dance between emptiness and fullness, structure and process, the blueprint and its unfolding. Numbers become the grammar through which reality organizes its own becoming. Numbers are revealed as the code by which reality programmes and runs itself.',
    callToAction: 'Coming soon'
  }
];

export function EssayScrollingSections({ onEssaySelect, onSectionChange }: EssayScrollingSectionsProps) {
  const { isLightMode } = useLightMode();
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
    bgColor: isLightMode ? '#ffffff' : '#000000',
    textColor: isLightMode ? '#1a1a1a' : '#FFFFFF',
    isHero: true,
    overlay: (
      <AuroraBackground
        fullScreen={false}
        centered={false}
        className={cn(
          "w-full h-full opacity-80",
          isLightMode ? "bg-white text-gray-800" : "bg-black text-white"
        )}
        isLightMode={isLightMode}
      />
    ),
    content: (
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
        <h1 className={cn(
          "text-[24px] md:text-[36px] font-normal tracking-[4px] text-center mb-6 max-w-[1000px]",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          TWO FRAMES, FOUR DOORWAYS
        </h1>
        <p className={cn(
          "text-[10px] md:text-[16px] leading-[2] tracking-[0.8px] max-w-[800px] text-center px-4",
          isLightMode ? "text-slate-700" : "text-gray-300"
        )}>
          Here we share our <button onClick={() => onEssaySelect('prompt-packages')} className={cn(
            "underline transition-colors",
            isLightMode ? "text-slate-700 hover:text-slate-900" : "text-gray-300 hover:text-white"
          )}>prompt packages</button> and essays to introduce people to the system. The best way in is to explore the example conversations in the prompt package section.
        </p>
        <p className={cn(
          "text-[8px] md:text-[10px] max-w-[900px] leading-[1.8] tracking-[0.6px] text-center mt-12 px-4",
          isLightMode ? "text-gray-500" : "text-gray-500"
        )}>
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
      bgColor: isLightMode ? '#ffffff' : '#000000',
      textColor: isLightMode ? '#1a1a1a' : '#FFFFFF',
      content: (
        <div className="w-full h-full flex items-center justify-center px-6 md:px-12 lg:px-24">
          <div className={cn(
            "w-full max-w-[1100px] border backdrop-blur-sm",
            isLightMode ? "border-slate-300/60 bg-white/40" : "border-gray-900/60 bg-black/40"
          )}>
            <div
              className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 lg:items-stretch`}
            >
              <div className={cn(
                `hidden lg:flex w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r items-center justify-center overflow-hidden ${essay.id === 'epi-logos' || essay.id === 'mef' || essay.id === 'ql' ? 'aspect-square' : 'min-h-[260px]'}`,
                isLightMode ? "bg-slate-50 border-slate-300/60" : "bg-gray-950 border-gray-900/60"
              )}>
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
                  <div className={cn(
                    "w-full h-full flex items-center justify-center p-4",
                    isLightMode ? "bg-slate-100" : "bg-black"
                  )}>
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
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    isLightMode ? "bg-slate-100" : "bg-black"
                  )}>
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
                  <div className={cn(
                    "w-full h-full flex items-center justify-center p-4",
                    isLightMode ? "bg-slate-100" : "bg-black"
                  )}>
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
                  <p className={cn(
                    "text-[8px] md:text-[10px] uppercase tracking-[0.5em]",
                    isLightMode ? "text-gray-500" : "text-gray-500"
                  )}>
                    {essay.eyebrow}
                  </p>
                  <h2 className={cn(
                    "text-lg md:text-xl lg:text-2xl font-light tracking-[0.15em]",
                    isLightMode ? "text-slate-900" : "text-white"
                  )}>
                    {essay.title}
                  </h2>
                </div>
                <p className={cn(
                  "text-[11px] md:text-[13px] lg:text-[15px] leading-relaxed",
                  isLightMode ? "text-slate-700" : "text-gray-300"
                )}>
                  {essay.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleEssayClick(essay.id)}
                  className={cn(
                    "group inline-flex items-center text-[8px] md:text-[11px] lg:text-[13px] uppercase tracking-[0.4em]",
                    essay.callToAction === 'Coming soon'
                      ? cn(isLightMode ? "text-slate-400 cursor-default" : "text-gray-400 cursor-default")
                      : cn("transition-colors", isLightMode ? "text-slate-600 hover:text-slate-900" : "text-gray-400 hover:text-white")
                  )}
                >
                  {essay.callToAction}
                  <span className={cn(
                    "ml-4",
                    essay.callToAction === 'Coming soon'
                      ? cn(isLightMode ? "text-slate-400" : "text-gray-600")
                      : cn(isLightMode ? "text-slate-400 group-hover:text-slate-900" : "text-gray-600 group-hover:text-white")
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
      <div className="relative w-full h-full">
        {/* Fixed aurora background for mobile - persists across all sections */}
        <div className="md:hidden absolute inset-0 z-0 pointer-events-none">
          <AuroraBackground
            fullScreen={false}
            centered={false}
            showRadialGradient={false}
            className={cn(
              "w-full h-full",
              isLightMode ? "bg-white text-gray-800" : "bg-black text-white"
            )}
            isLightMode={isLightMode}
          >
            <div />
          </AuroraBackground>
        </div>

        <div className="relative z-10">
          <ScrollingFeatureShowcase
            slides={[introSlide, ...previewSlides]}
            showImages={false}
            showButton={false}
            hidePagination={true}
            onSectionChange={onSectionChange}
            ref={scrollControlRef}
            isLightMode={isLightMode}
          />
        </div>
      </div>

      {/* PDF Explorer Overlay */}
      {showPDFExplorer && (
        <NumberLanguageExplorer onClose={() => setShowPDFExplorer(false)} />
      )}
    </>
  );
}
