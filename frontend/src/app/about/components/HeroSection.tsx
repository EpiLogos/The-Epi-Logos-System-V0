'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WavyBackground } from './WavyBackground';

const ASCIIText = dynamic(() => import('@/components/three/ASCIIText'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-[36px] font-normal tracking-[4px] text-white text-center">
        Epi-Logos
      </h1>
    </div>
  )
});

export function HeroSection() {
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
      <div className="flex flex-col items-center justify-center px-8 h-screen">
        {/* Logo - Positioned top left with white color */}
        <div className="absolute top-8 left-8">
          <div
            className="w-[120px] h-[120px]"
            style={{
              WebkitMaskImage: 'url(/ui-system/epi-logos-logo.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: 'url(/ui-system/epi-logos-logo.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              backgroundColor: '#f0f4ff'
            }}
          />
        </div>

        {/* ASCII Text Title */}
        <div className="relative w-full h-[300px] flex items-center justify-center">
          <ASCIIText
            text="Epi-Logos"
            enableWaves={true}
            asciiFontSize={4}
            textFontSize={120}
            textColor="#fdf9f3"
            planeBaseHeight={6}
          />
        </div>
      </div>
    </WavyBackground>
  );
}
