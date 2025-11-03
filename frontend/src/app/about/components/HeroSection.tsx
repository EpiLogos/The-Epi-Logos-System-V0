'use client';

import React from 'react';
import Image from 'next/image';
import { WavyBackground } from './WavyBackground';

interface HeroSectionProps {
  onCTAClick?: (cta: 'mef' | 'collaborate' | 'ql') => void;
}

export function HeroSection({ onCTAClick }: HeroSectionProps) {
  return (
    <WavyBackground
      containerClassName="relative w-full h-screen overflow-hidden"
      backgroundFill="black"
      colors={[
        "#1a1a1a",
        "#2a2a2a",
        "#3a3a3a",
        "#2a2a2a",
        "#1a1a1a",
      ]}
      waveWidth={50}
      blur={10}
      speed="slow"
      waveOpacity={0.3}
    >
      {/* Hero Content */}
      <div className="flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/ui-system/epi-logos-logo-vibes.jpeg"
            alt="Epi-Logos"
            width={300}
            height={300}
            className="rounded-sm"
            priority
          />
        </div>

        {/* Headline */}
        <h1 className="text-[32px] font-normal tracking-[3px] text-white text-center mb-4 max-w-[900px]">
          EPI-LOGOS: AN INSTRUMENT FOR INTEGRAL INTELLIGENCE
        </h1>

        {/* Subheadline */}
        <p className="text-[14px] text-gray-300 text-center mb-10 max-w-[700px] leading-[1.8] tracking-[0.5px]">
          We've built a reflexive map of how knowing works—so philosophy becomes a usable practice for everyone,
          and AI serves <strong>purpose</strong>, not power.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Primary CTA */}
          <button
            onClick={() => onCTAClick?.('mef')}
            className="px-8 py-3 bg-white text-black text-[12px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
          >
            Read the MEF Essay →
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => onCTAClick?.('collaborate')}
            className="px-8 py-3 border border-white text-white text-[12px] font-normal tracking-[2px] uppercase hover:bg-white hover:text-black transition-colors"
          >
            Collaborate →
          </button>
        </div>

        {/* Tertiary Link */}
        <button
          onClick={() => onCTAClick?.('ql')}
          className="text-[11px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline"
        >
          What is Quaternal Logic?
        </button>

        {/* Trust cues */}
        <p className="absolute bottom-8 text-[9px] text-gray-500 text-center max-w-[800px] leading-[1.6] tracking-[0.5px]">
          With influences from Aristotle, Nāgārjuna, Whitehead, Jung/Pauli, Bohm, and Gödel—Epi-Logos turns reason upon itself
          to make coherence a method, not a miracle.
        </p>
      </div>
    </WavyBackground>
  );
}
