'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';

const Genus6ModelViewer = dynamic(
  () => import('@/components/three/Genus6ModelViewer').then(mod => ({ default: mod.Genus6ModelViewer })),
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
    id: 'epi-logos',
    eyebrow: 'Epi-Logos & The Bimba Map',
    title: 'The Notion of Epi-Logos',
    description:
      'Why naming the ground matters. This essay traces how the Bimba coordinate map makes consciousness legible without flattening it, and how Epi-Logos keeps systems accountable to the realities they claim to model.',
    callToAction: 'Open the Epi-Logos essay'
  },
  {
    id: 'ql',
    eyebrow: 'Quaternal Logic (QL)',
    title: 'Forming Wholeness Without Collapse',
    description:
      'Four explicit moves, two implicit anchors. QL is the generative invariant that lets the many become one and increase by one. Here we unpack the tetralemma, the 4+2 topology, and the practical stakes for reasoning engines.',
    callToAction: 'Read the QL essay'
  },
  {
    id: 'mef',
    eyebrow: 'Meta-Epistemic Framework (MEF)',
    title: 'Navigating Thirty-Six Coordinates',
    description:
      'Six lenses crossed with six internal positions create a living cartography of knowing. The MEF essay shows how to diagnose imbalance, integrate shadow perspectives, and recurse purpose back into practice.',
    callToAction: 'Explore the MEF essay'
  },
  {
    id: 'num-lang',
    eyebrow: 'Number Language',
    title: 'Numbers As Carries of Meaning',
    description:
      'Beyond arithmetic, number becomes narrative. This essay follows how modulations of quantity express qualitative shifts, bridging formal systems, mythic sequencing, and lived strategy.',
    callToAction: 'Study the Number Language essay'
  }
];

export function EssayScrollingSections({ onEssaySelect }: EssayScrollingSectionsProps) {
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
          FOUR DOORWAYS INTO THE EPI-LOGOS SYSTEM
        </h1>
        <p className="text-[16px] text-gray-300 leading-[2] tracking-[0.8px] max-w-[800px] text-center">
          Collapse the sidebar to enter reading mode. Choose an essay to open a full-screen draft ready for publication,
          or linger here to scan the themes and plan imagery for each section.
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
              className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 lg:items-center`}
            >
              <div className={`w-full lg:w-1/2 bg-gray-950 border-b border-gray-900/60 lg:border-b-0 lg:border-r lg:border-gray-900/60 flex items-center justify-center overflow-hidden ${essay.id === 'ql' || essay.id === 'mef' ? 'min-h-[700px]' : 'min-h-[260px]'}`}>
                {essay.id === 'mef' ? (
                  <Suspense
                    fallback={
                      <div className="w-full h-full min-h-[700px] bg-gradient-to-br from-pink-100 via-pink-50 to-pink-100 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">Loading 3D model...</span>
                      </div>
                    }
                  >
                    <Genus6ModelViewer />
                  </Suspense>
                ) : essay.id === 'ql' ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100">
                    <SketchfabTorusViewer />
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
                  onClick={() => onEssaySelect(essay.id)}
                  className="group inline-flex items-center text-xs md:text-sm uppercase tracking-[0.4em] text-gray-400 hover:text-white transition-colors"
                >
                  {essay.callToAction}
                  <span className="ml-4 text-gray-600 group-hover:text-white">
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
    <ScrollingFeatureShowcase
      slides={[introSlide, ...previewSlides]}
      showImages={false}
      showButton={false}
    />
  );
}
