"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import Link from 'next/link';
import * as THREE from 'three';
import { GlowParticles } from './GlowParticles';
import { ThreeErrorBoundary } from '../ErrorBoundary';

// Background controller that sets Three.js scene background based on theme
function BackgroundController({ theme }: { theme: 'light' | 'dark' | 'dark-theme' }) {
  const { scene } = useThree();

  useEffect(() => {
    // Create gradient texture for background
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Create gradient based on theme
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    if (theme === 'light') {
      gradient.addColorStop(0, '#9ca3af');
      gradient.addColorStop(1, '#6b7280');
    } else if (theme === 'dark-theme') {
      gradient.addColorStop(0, '#4c1d95');
      gradient.addColorStop(1, '#be185d');
    } else {
      gradient.addColorStop(0, '#1e40af');
      gradient.addColorStop(1, '#000000');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create texture and set as scene background
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;

    // Cleanup
    return () => {
      texture.dispose();
    };
  }, [scene, theme]);

  return null;
}

// Working double torus component
function DoubleTorus() {
  const torusARef = useRef<THREE.Mesh>(null);
  const torusBRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (torusARef.current && torusBRef.current) {
      torusARef.current.rotation.x = t * 0.1;
      torusARef.current.rotation.y = t * 0.15;
      torusBRef.current.rotation.y = -t * 0.12;
      torusBRef.current.rotation.z = t * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={torusARef}>
        <torusGeometry args={[1.8, 0.35, 32, 100]} />
        <meshPhysicalMaterial
          color="#2d7891"
          metalness={0.4}
          roughness={0.15}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          sheen={0.3}
          emissive="#24404a"
          emissiveIntensity={0.18}
          transparent={true}
          opacity={0.75}
        />
      </mesh>
      <mesh ref={torusBRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.25, 32, 100]} />
        <meshPhysicalMaterial
          color="#3c4785"
          metalness={0.95}
          roughness={0.12}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          sheen={0.25}
          emissive="#525a87"
          emissiveIntensity={0.32}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}


// Working particles component
function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = React.useMemo(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.6} />
    </points>
  );
}

// Working title component
function AnimatedTitle({ isTransitioned }: { isTransitioned: boolean }) {
  return (
    <div className={`absolute left-1/2 transform -translate-x-1/2 z-30 pointer-events-none transition-all duration-2000 ease-in-out ${
      isTransitioned ? 'top-1/2 -translate-y-1/2' : 'top-8'
    }`}>
      <motion.h1
        className={`font-heading text-blue-12 transition-all duration-2000 ${
          isTransitioned ? 'text-6xl md:text-9xl' : 'text-4xl md:text-6xl'
        }`}
        style={{
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.5)',
          filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.7))'
        }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Epi:Logos
      </motion.h1>
    </div>
  );
}

// Working transition button
function TransitionButton({ onClick, isTransitioned }: { onClick: () => void; isTransitioned: boolean }) {
  if (isTransitioned) return null;

  return (
    <motion.button
      onClick={onClick}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 px-8 py-4 bg-gradient-to-r from-blue-6 to-blue-8 text-blue-12 font-bold text-xl rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 border-2 border-blue-9/30"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="flex items-center space-x-2">
        <span>Enter Experience</span>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          →
        </motion.span>
      </span>
    </motion.button>
  );
}

// Test navigation component (appears after transition)
function TestNavigation({ isTransitioned }: { isTransitioned: boolean }) {
  if (!isTransitioned) return null;

  return (
    <motion.div
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8 }}
    >
      <Link href="/test-squares">
        <motion.button
          className="px-4 py-2 bg-blue-3/80 text-blue-11 text-sm rounded-lg border border-blue-6 hover:bg-blue-4/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Test Squares
        </motion.button>
      </Link>
      <Link href="/test-scene">
        <motion.button
          className="px-4 py-2 bg-blue-3/80 text-blue-11 text-sm rounded-lg border border-blue-6 hover:bg-blue-4/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Test Scene
        </motion.button>
      </Link>
      <Link href="/test-particles">
        <motion.button
          className="px-4 py-2 bg-blue-3/80 text-blue-11 text-sm rounded-lg border border-blue-6 hover:bg-blue-4/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Test Particles
        </motion.button>
      </Link>
      <Link href="/">
        <motion.button
          className="px-4 py-2 bg-blue-3/80 text-blue-11 text-sm rounded-lg border border-blue-6 hover:bg-blue-4/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Home
        </motion.button>
      </Link>
    </motion.div>
  );
}

// Main working scene component
type GlowOverride = {
  baseHue?: number;
  saturation?: number;
  lightness?: number;
  monochrome?: boolean;
  particleCount?: number;
  mode?: 'default' | 'mist';
  radiusScale?: number;
};

export function WorkingThreeScene({
  theme = 'dark' as 'light' | 'dark' | 'dark-theme',
  onEnterExperience,
  glow,
  initiallyTransitioned,
  hideThree,
  overlayTint,
  hideUiOverlays,
}: {
  theme?: 'light' | 'dark' | 'dark-theme';
  onEnterExperience?: () => void;
  glow?: GlowOverride;
  initiallyTransitioned?: boolean;
  hideThree?: boolean;
  overlayTint?: string; // rgba string e.g. "rgba(85, 53, 201, 0.86)"
  hideUiOverlays?: boolean;
}) {
  const [isTransitioned, setIsTransitioned] = useState(!!initiallyTransitioned);

  const handleTransition = () => {
    console.log('Starting transition...');
    setIsTransitioned(true);
    if (onEnterExperience) onEnterExperience();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background overlay for transition */}
      {isTransitioned && (
        <motion.div
          className="absolute inset-0 z-20 backdrop-blur-sm"
          style={{
            background: overlayTint
              ? overlayTint
              : 'linear-gradient(135deg, rgba(30,41,59,0.35) 0%, rgba(55,65,81,0.35) 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
        />
      )}

      {/* Three.js Canvas (optional) */}
      {!hideThree && (
        <ThreeErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
          >
          {/* Background Controller - sets scene.background properly */}
          <BackgroundController theme={theme} />

          {/* Theme-responsive Lighting */}
          {theme === 'light' ? (
            <>
              <hemisphereLight args={['#e5d7eaff', '#7a93c5c9', 0.6]} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
              <directionalLight position={[-5, 3, 2]} intensity={0.6} color="#e5e7eb" />
              <pointLight position={[0, 10, 5]} intensity={1.2} color="#ffffff" distance={30} decay={2} />
            </>
          ) : theme === 'dark-theme' ? (
            <>
              <hemisphereLight args={['#255851ffff', '#2b103a', 0.4]} />
              <ambientLight intensity={0.3} />
              <directionalLight position={[5, 5, 5]} intensity={1.1} color="#3fb9a8" />
              <directionalLight position={[-5, 3, 2]} intensity={0.7} color="#8b5cf6" />
              <pointLight position={[0, 10, 5]} intensity={1.4} color="#60a5fa" distance={30} decay={2} />
            </>
          ) : (
            <>
              <hemisphereLight args={['#e2f1f4', '#202d30', 0.35]} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={1.3} color="#e2f1f4" />
              <directionalLight position={[-5, 3, 2]} intensity={0.9} color="#a3b9bd" />
              <pointLight position={[0, 10, 5]} intensity={1.6} color="#ffffff" distance={30} decay={2} />
            </>
          )}

          {/* 3D Elements */}
          <DoubleTorus />
          <Particles />

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            autoRotate={!isTransitioned}
            autoRotateSpeed={0.5}
            minDistance={3}
            maxDistance={20}
          />
        </Canvas>
        </ThreeErrorBoundary>
      )}

      {/* UI Overlays */}
      {!hideUiOverlays && (
        <>
          <AnimatedTitle isTransitioned={isTransitioned} />
          <TransitionButton onClick={handleTransition} isTransitioned={isTransitioned} />
          <TestNavigation isTransitioned={isTransitioned} />
        </>
      )}

      {/* Glow Particles Effect */}
      {(() => {
        const common = {
          isVisible: isTransitioned,
        } as const;
        if (glow) {
          return (
            <GlowParticles
              {...common}
              particleCount={glow.particleCount ?? 200}
              baseHue={glow.baseHue ?? (theme === 'light' ? 180 : 240)}
              saturation={glow.saturation ?? (theme === 'light' ? 50 : 70)}
              lightness={glow.lightness ?? (theme === 'light' ? 35 : 60)}
              monochrome={glow.monochrome}
              mode={glow.mode}
              radiusScale={glow.radiusScale}
            />
          );
        }
        // defaults by theme - monochrome for scene page
        return theme === 'light' ? (
          <GlowParticles
            {...common}
            particleCount={200}
            baseHue={180}
            saturation={50}
            lightness={35}
            monochrome={true}
          />
        ) : (
          <GlowParticles {...common} particleCount={200} baseHue={240} monochrome={true} />
        );
      })()}
    </div>
  );
}
