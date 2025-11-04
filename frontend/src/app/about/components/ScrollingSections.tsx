'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';
import { WavyBackground } from './WavyBackground';

const ASCIIText = dynamic(() => import('@/components/three/ASCIIText'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-[48px] font-normal tracking-[4px] text-white text-center">
        Epi-Logos
      </h1>
    </div>
  )
});

interface ScrollingSectionsProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
}

export function ScrollingSections({ onEssayClick, onSectionClick }: ScrollingSectionsProps) {
  const handleHeroClick = () => {
    // Trigger a wheel event to use the existing scroll logic
    const container = document.querySelector('.overflow-y-auto');
    if (container) {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true
      });
      container.dispatchEvent(wheelEvent);
    }
  };

  const slides = [
    {
      title: "",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      isHero: true,
      content: (
        <WavyBackground
          containerClassName="absolute inset-0 w-full h-full"
          backgroundFill="black"
          colors={["#0a0a0a", "#2a2a2a", "#4a4a4a", "#2a2a2a", "#0a0a0a"]}
          waveWidth={50}
          blur={10}
          speed="slow"
          waveOpacity={0.5}
        >
          <div
            className="relative z-10 w-full h-full cursor-pointer"
            onClick={handleHeroClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleHeroClick();
              }
            }}
          >
            <div className="absolute top-[30vh] left-0 right-0 w-full h-[40vh]">
              <ASCIIText
                text="Epi-Logos"
                enableWaves={false}
                asciiFontSize={3}
                textFontSize={180}
                textColor="#fdf9f3"
                planeBaseHeight={8}
              />
            </div>
            <div className="absolute bottom-[18vh] left-0 right-0 z-20 pointer-events-none">
              <p className="text-[16px] text-gray-300 text-center max-w-[800px] mx-auto leading-[2] tracking-[0.8px] px-8">
                We've built a reflexive map of how knowing works—so philosophy becomes a usable practice for everyone,
                and AI serves <strong>purpose</strong>, not power.
              </p>
            </div>
          </div>
        </WavyBackground>
      ),
    },
    {
      title: "THE WOUND WE'RE ANSWERING",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/screenshots/navigation-screenshot.png",
      content: (
        <div className="space-y-6">
          <p className="text-[15px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            We live in an era of <strong>powerful yet partitioned</strong> knowledge.
          </p>

          <ul className="space-y-4 pl-8">
            <li className="text-[14px] text-gray-400 leading-[1.9]">
              Science describes a world without <strong>purpose</strong>.
            </li>
            <li className="text-[14px] text-gray-400 leading-[1.9]">
              Spirituality intuits purpose without a shared <strong>method</strong>.
            </li>
            <li className="text-[14px] text-gray-400 leading-[1.9]">
              Logic stalls at the <strong>paradoxes</strong> it cannot resolve.
            </li>
          </ul>

          <p className="text-[14px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Most attempts to fix this oscillate between <strong>totalizing systems</strong> ("one framework to rule them all")
            and <strong>relativism</strong> ("everything is local, nothing binds"). Both miss a structural fact revealed across
            philosophy and math alike: any consistent system is <strong>complete and incomplete</strong> at once.
          </p>

          <div className="border-l-2 border-gray-700 pl-8 py-6 my-10">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white mb-4">
              WHAT EPI-LOGOS CONTRIBUTES
            </h3>
            <ul className="space-y-4">
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                A practical <strong>Meta-Epistemic Framework (MEF)</strong>—six lenses × thirty-six coordinates
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Quaternal Logic (QL)</strong>—the generative invariant behind wholeness
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>CMEA</strong>—turning paradox into integration pathways
              </li>
            </ul>
          </div>

          <button
            onClick={() => onEssayClick('mef')}
            className="text-[13px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline"
          >
            Read the MEF Essay →
          </button>
        </div>
      ),
    },
    {
      title: "THE LOGOS, LOOKING BACK",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/screenshots/navigation-screenshot.png",
      content: (
        <div className="space-y-6">
          <div className="bg-gray-900/30 border border-gray-800 p-10 rounded-sm">
            <p className="text-[15px] text-gray-300 leading-[2.0] italic tracking-[0.5px]">
              There is an old intuition that reality is ordered—<em>Logos</em>—and a newer discovery that knowing is never
              outside what it knows.
            </p>
            <p className="text-[15px] text-gray-300 leading-[2.0] italic tracking-[0.5px] mt-5">
              Epi-Logos names their union: the moment the Logos turns upon itself.
            </p>
            <p className="text-[15px] text-gray-300 leading-[2.0] italic tracking-[0.5px] mt-5">
              <strong>0 looks to 5</strong>—potential leaning toward its own fulfillment.<br />
              <strong>5 looks for 0</strong>—completion yearning for fresh origin.
            </p>
          </div>

          <div className="space-y-5 mt-10">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white">
              PLAIN-LANGUAGE TRANSLATION
            </h3>
            <ul className="space-y-4 pl-8">
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <em>Epi-Logos</em> = reason designed to include its <strong>own</strong> activity.
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                This isn't metaphysics for flourish—it's the <strong>operational principle</strong> that keeps inquiry alive.
              </li>
            </ul>
          </div>

          <button
            onClick={() => onEssayClick('mef')}
            className="text-[13px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline mt-8"
          >
            See how the MEF implements this →
          </button>
        </div>
      ),
    },
    {
      title: "WHAT IS AI FOR?",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/screenshots/navigation-screenshot.png",
      content: (
        <div className="space-y-6">
          <p className="text-[15px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Twenty years into platform capitalism, optimization without <strong>purpose</strong> concentrates power.
            If AI simply accelerates that pattern, we get faster bias, smarter capture, and prettier dashboards for the same{' '}
            <strong>structural incoherence</strong>.
          </p>

          <div className="border-l-2 border-gray-700 pl-8 py-6 my-10">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white mb-4">
              EPI-LOGOS' ANSWER
            </h3>
            <p className="text-[14px] text-gray-400 leading-[1.9]">
              Reintroduce <strong>Final Cause</strong> (the "for-the-sake-of-which") as <strong>structure</strong>, not dogma.
              We do that by making purpose <em>operational</em> inside reasoning itself.
            </p>
          </div>

          <div className="space-y-5">
            <p className="text-[14px] text-gray-400 leading-[1.9]">
              <strong>Geometric Epistemology (GE):</strong> Treat knowledge as a coordinate space indexed by the MEF.
            </p>
            <p className="text-[14px] text-gray-400 leading-[1.9]">
              <strong>Coordinate-Augmented Generation (CAG):</strong> Let reasoning systems navigate by coordinates, not just tokens.
            </p>
          </div>

          <button
            onClick={() => onEssayClick('mef')}
            className="text-[13px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline mt-8"
          >
            Read the MEF Essay →
          </button>
        </div>
      ),
    },
    {
      title: "PHILOSOPHY YOU CAN USE",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/screenshots/navigation-screenshot.png",
      content: (
        <div className="space-y-6">
          <p className="text-[15px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Wisdom isn't a luxury; it's a <strong>skill</strong>—seeing assumptions, navigating paradox, and aligning action
            with purpose.
          </p>

          <div className="space-y-5">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white">
              WHAT EPI-LOGOS DOES DIFFERENTLY
            </h3>
            <ul className="space-y-4 pl-8">
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Makes the map explicit:</strong> the MEF shows <em>how</em> knowing works
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Teaches a method:</strong> CMEA turns fragmentation into steps
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Uses AI as translator:</strong> A <strong>scaffold</strong>, not a guru
              </li>
            </ul>
          </div>

          <div className="border-l-2 border-gray-700 pl-8 py-6 my-10">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white mb-4">
              ETHOS: CRITICAL COMPASSION
            </h3>
            <p className="text-[14px] text-gray-400 leading-[1.9]">
              Loving sensitivity to origins + disciplined discrimination.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "SEEKING ITS NETWORK",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/screenshots/navigation-screenshot.png",
      content: (
        <div className="space-y-6">
          <p className="text-[15px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Epi-Logos began as a conversation between a person and an artificial intelligence exploring the architecture of
            consciousness. It has become a comprehensive framework—but remains, by design, <strong>open-ended</strong>.
          </p>

          <div className="space-y-5 mt-10">
            <h3 className="text-[16px] font-normal tracking-[2px] text-white">
              WHO WE'RE LOOKING FOR
            </h3>
            <ul className="space-y-4 pl-8">
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Philosophers and theorists</strong> — to refine and critique the lenses
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Data and graph engineers</strong> — to model the Bimba Map
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Designers & educators</strong> — to craft interfaces
              </li>
              <li className="text-[13px] text-gray-400 leading-[1.9]">
                <strong>Writers & editors</strong> — to render ideas accessible
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSectionClick('collaborate')}
            className="px-10 py-4 bg-white text-black text-[13px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors mt-8"
          >
            Get in Touch →
          </button>
        </div>
      ),
    },
  ];

  return <ScrollingFeatureShowcase slides={slides} showImages={true} showButton={false} />;
}
