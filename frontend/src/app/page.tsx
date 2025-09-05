"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import HexagonNavigation from '@/components/HexagonNavigation';
import { Button } from '@epi-logos/ui-components';
import { GlowParticles } from '@/components/system/GlowParticles';
import EpiLogo from '@/components/EpiLogo';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="relative min-h-screen bg-black overflow-hidden">
      {/* Background particles overlay (localized to page) */}
      <GlowParticles
        isVisible={true}
        particleCount={600}
        monochrome={true}
        radiusScale={0.000000000001}
        //mode="mist"
        parentRef={containerRef as unknown as React.RefObject<HTMLElement>}
      />

      {/* Hexagon navigation component - moved to top left and scaled down 50% */}
      <HexagonNavigation
        preset="logo"
        position="absolute"
        coordinates={{ top: "2rem", left: "2rem" }}
        scale={0.5}
        transformOrigin="top left"
        zIndex={10}
      />

      {/* Main content area - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-12">
        {/* SVG Logo - back in its original centered position */}
        <div className="relative">
          <EpiLogo size={400} interactive={false} className="opacity-90" />
        </div>

        {/* Epi-Logos text with Modak font */}
        <h1
          className="font-heading text-7xl md:text-9xl text-blue-12 tracking-wider"
          style={{
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.5)',
            filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.7))',
            transform: 'translateY(-90px)'
          }}
        >
           Epi:Logos
        </h1>

        <div className="flex flex-col gap-4">
          <Link href="/system" aria-label="Enter System">
            <Button
              variant="outline"
              size="lg"
              className="bg-blue-2/80 border-blue-6 text-blue-12 hover:bg-blue-3/80 hover:border-blue-7 transition-all duration-600"
            >
              Enter System
            </Button>
          </Link>
          
          <Link href="/dev/dashboard" aria-label="Developer Dashboard">
            <Button
              variant="outline"
              size="lg"
              className="bg-purple-2/80 border-purple-6 text-purple-12 hover:bg-purple-3/80 hover:border-purple-7 transition-all duration-600"
            >
              Developer Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
