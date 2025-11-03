'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import Image from 'next/image';

// Shader material for background animation
const BackgroundShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#000000'), // black
    uColorB: new THREE.Color('#0a0a0a'), // very dark gray
    uOpacity: 1.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    varying vec2 vUv;

    // Noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Subtle flowing pattern
      float n = noise(vUv * 3.0 + uTime * 0.05);
      float pattern = sin(vUv.y * 2.0 + uTime * 0.1 + n) * 0.5 + 0.5;

      vec3 color = mix(uColorA, uColorB, pattern * 0.3);

      // Add very subtle gradient
      float gradient = vUv.y * 0.1;
      color += gradient;

      gl_FragColor = vec4(color, uOpacity);
    }
  `
);

extend({ BackgroundShaderMaterial });

// Animated background plane
function AnimatedBackground() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as any;
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <backgroundShaderMaterial />
    </mesh>
  );
}

interface HeroSectionProps {
  onCTAClick?: (cta: 'mef' | 'collaborate' | 'ql') => void;
}

export function HeroSection({ onCTAClick }: HeroSectionProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Three.js Shader Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <AnimatedBackground />
        </Canvas>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
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
    </div>
  );
}
