"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import { Text } from 'troika-three-text';
import * as THREE from 'three';
import anime from 'animejs';
import { motion } from 'framer-motion';
import { useTransition } from '../contexts/TransitionContext';
import ClientOnly from './ClientOnly';

// Custom Shader Material for advanced effects
const WaveShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uColorA: new THREE.Color('#ff6b6b'),
    uColorB: new THREE.Color('#4ecdc4'),
    uAmplitude: 0.5,
    uFrequency: 2.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;

      // Create wave displacement
      vec3 pos = position;
      float wave = sin(pos.x * uFrequency + uTime) * uAmplitude;
      pos.z += wave * sin(pos.y * uFrequency + uTime * 0.5);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      // Create dynamic color mixing
      float mixer = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
      vec3 color = mix(uColorA, uColorB, mixer);

      // Add fresnel effect
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = dot(vNormal, viewDirection);
      fresnel = pow(1.0 - fresnel, 2.0);

      color += fresnel * 0.3;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

// Enhanced Background Shader (Midnight blue/black with depth)
const BackgroundShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#0b1220'), // deep midnight blue
    uColorB: new THREE.Color('#000000'), // black
    uOpacity: 0.8, // Allow light to pass through
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
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
    varying vec3 vWorldPosition;

    // Smooth pseudo-noise via sin blending
    float snoise(vec2 st) {
      return (sin(st.x) + sin(st.y) + sin(st.x + st.y)) / 3.0 * 0.5 + 0.5;
    }

    void main() {
      vec2 st = vUv * 4.0;
      st.x += uTime * 0.03;
      st.y += sin(uTime * 0.15) * 0.05;

      float p = snoise(st) * 0.6 + snoise(st * 0.5) * 0.4;
      vec3 color = mix(uColorB, uColorA, p);

      // Depth-based opacity to not interfere with lighting
      float depth = length(vWorldPosition) / 20.0;
      float alpha = uOpacity * (1.0 - depth * 0.1);

      gl_FragColor = vec4(color, alpha);
    }
  `
);

// Frost Effect Shader for Transition
const FrostShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uFrostProgress: 0,
    uNoiseScale: 8.0,
    uBlurAmount: 0.02,
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
    uniform float uFrostProgress;
    uniform float uNoiseScale;
    uniform float uBlurAmount;
    varying vec2 vUv;

    // Noise function for frost pattern
    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;

      // Create frost pattern
      vec2 noiseUv = uv * uNoiseScale + uTime * 0.1;
      float frostPattern = fbm(noiseUv);
      float frostMask = smoothstep(0.0, 1.0, uFrostProgress + frostPattern * 0.3 - 0.3);

      // Frost color (white with blue tint)
      vec3 frostColor = vec3(0.9, 0.95, 1.0);

      // Output frost effect
      float alpha = frostMask * 0.8;
      gl_FragColor = vec4(frostColor, alpha);
    }
  `
);

// Extend the materials to use with R3F
extend({ WaveShaderMaterial, BackgroundShaderMaterial, FrostShaderMaterial });

// Frost Overlay Component
function FrostOverlay({ progress = 0 }: { progress: number }) {
  const matRef = useRef<THREE.ShaderMaterial & { uFrostProgress: number; uTime: number } | null>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uFrostProgress = progress;
    }
  });

  if (progress <= 0) return null;

  return (
    <mesh position={[0, 0, 5]} renderOrder={1000}>
      <planeGeometry args={[50, 40]} />
      <frostShaderMaterial ref={matRef} transparent />
    </mesh>
  );
}

// TypeScript declarations
declare module '@react-three/fiber' {
  namespace JSX {
    interface IntrinsicElements {
      waveShaderMaterial: any;
      backgroundShaderMaterial: any;
      frostShaderMaterial: any;
    }
  }
}

// Background plane component
type BackgroundMat = THREE.ShaderMaterial & { uTime: number };
function BackgroundPlane() {
  const matRef = useRef<BackgroundMat | null>(null);
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
    }
  });
  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[40, 30, 1, 1]} />
      <backgroundShaderMaterial ref={matRef} />
    </mesh>
  );
}

// Enhanced 3D Text Component with Shader Effects
function ShaderText({
  text = "Epi-Logos",
  position = [0, 3, 0],
  size = 1.2,
  isTransitioning = false
}: {
  text?: string;
  position?: [number, number, number];
  size?: number;
  isTransitioning?: boolean;
}) {
  const textRef = useRef<any>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const animValues = useRef({
    glowIntensity: 0.5,
    colorShift: 0.0,
    letterSpacing: 0.1
  });

  useEffect(() => {
    // Letter-by-letter entrance animation
    const timeline = anime.timeline({
      easing: 'easeOutCubic'
    });

    timeline.add({
      targets: animValues.current,
      glowIntensity: [0, 0.8],
      colorShift: [0, 1],
      duration: 1200,
      delay: 300
    });

    return () => timeline.pause();
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      // Animated glow effect
      const glow = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      materialRef.current.emissiveIntensity = animValues.current.glowIntensity * glow;

      // Color shifting
      const hue = (state.clock.elapsedTime * 0.1 + animValues.current.colorShift) % 1;
      materialRef.current.emissive.setHSL(hue * 0.1, 0.3, 0.2);
    }

    if (textRef.current && isTransitioning) {
      // Transition animation: move from top to center
      const targetY = 0;
      const currentY = textRef.current.position.y;
      textRef.current.position.y = THREE.MathUtils.lerp(currentY, targetY, 0.02);

      // Scale up during transition
      const targetScale = 1.4;
      const currentScale = textRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.02);
      textRef.current.scale.setScalar(newScale);
    }
  });

  return (
    <primitive
      ref={textRef}
      object={new Text()}
      text={text}
      fontSize={size}
      position={position}
      anchorX="center"
      anchorY="middle"
      font="/fonts/Ranade-Thin.woff"
      letterSpacing={animValues.current.letterSpacing}
      material-ref={materialRef}
      material={new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#4a5568',
        emissiveIntensity: 0.3,
        metalness: 0.1,
        roughness: 0.4,
      })}
    />
  );
}



/**
 * Double Torus Component with Shader Morphs
 */
type WaveMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uAmplitude: number;
  uFrequency: number;
  uColorA: THREE.Color;
  uColorB: THREE.Color;
};

function DoubleTorus(): React.ReactElement {
  const torusARef = useRef<THREE.Mesh>(null);
  const torusBRef = useRef<THREE.Mesh>(null);

  const anim = useRef({ speedA: 0.6, speedB: 0.8, scale: 1.0 });

  useEffect(() => {
    const tl = anime.timeline({ loop: true, direction: 'alternate', easing: 'easeInOutSine' });

    tl.add({
      targets: anim.current,
      speedA: [0.6, 1.0],
      speedB: [0.7, 1.1],
      scale: [1.0, 1.06],
      duration: 4000,
    });

    return () => tl.pause();
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (torusARef.current && torusBRef.current) {
      torusARef.current.rotation.x = t * 0.06 * anim.current.speedA;
      torusARef.current.rotation.y = t * 0.09 * anim.current.speedA;
      torusBRef.current.rotation.y = -t * 0.07 * anim.current.speedB;
      torusBRef.current.rotation.z = t * 0.1 * anim.current.speedB;

      const s = anim.current.scale;
      torusARef.current.scale.setScalar(s);
      torusBRef.current.scale.setScalar(s * 0.995);
    }
  });

  return (
    <group>
      {/* Torus A - Using standard material for proper lighting */}
      <mesh ref={torusARef} position={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.35, 64, 256]} />
        <meshStandardMaterial
          color="#e5e7eb"
          metalness={0.3}
          roughness={0.4}
          emissive="#4a5568"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Torus B - Perpendicular */}
      <mesh ref={torusBRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.25, 64, 256]} />
        <meshStandardMaterial
          color="#d1d5db"
          metalness={0.4}
          roughness={0.3}
          emissive="#6b7280"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

/**
 * Particle System with Custom Shaders
 */
function ShaderParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const particleCount = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}



/**
 * Enhanced Background Elements with Multiple Geometries
 */
function BackgroundElements() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Calmer scene: only subtle particles remain */}
      <ShaderParticles />
    </group>
  );
}

/**
 * Three.js Scene Component
 * 
 * Full-screen 3D scene with animated elements
 */
interface ThreeSceneProps {
  title?: string;
  subtitle?: string;
  className?: string;
  theme?: string; // 'light' | 'dark' | 'dark-theme'
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  title: _title = "Epi-Logos",
  subtitle: _subtitle = "",
  className = "",
  theme = 'dark'
}) => {
  const { state: transitionState, setPhase, updateProgress } = useTransition();
  const titleRef = useRef<HTMLDivElement>(null);

  // Transition timeline management
  useEffect(() => {
    console.log('ThreeScene: Transition state changed:', transitionState);
    if (transitionState.phase === 'initiating') {
      console.log('ThreeScene: Starting transition timeline');
      // Start transition sequence
      const timeline = anime.timeline({
        complete: () => {
          console.log('ThreeScene: Transition complete');
          setPhase('complete');
        }
      });

      // Phase 1: Frost effect (0.5-3s)
      timeline.add({
        targets: { progress: 0 },
        progress: 1,
        duration: 2500,
        delay: 500,
        easing: 'easeInOutQuad',
        update: (anim: any) => {
          setPhase('frosting');
          updateProgress(anim.progress / 100);
        }
      });

      // Phase 2: Title repositioning (2-4s)
      timeline.add({
        targets: { progress: 0 },
        progress: 1,
        duration: 2000,
        easing: 'easeInOutCubic',
        update: () => {
          setPhase('repositioning');
        }
      }, '-=1500');

      return () => timeline.pause();
    }
  }, [transitionState, setPhase, updateProgress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleRef.current) {
        anime({
          targets: titleRef.current.querySelectorAll('span'),
          opacity: [0, 1],
          translateY: [24, 0],
          delay: anime.stagger(80, { start: 300 }),
          duration: 900,
          easing: 'easeOutCubic'
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const renderAnimatedTitle = (text: string) => {
    return text.split('').map((char, index) => (
      <span key={index} className="inline-block" style={{ opacity: 1 }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  // Theme-aware palette
  const palette = (() => {
    switch (theme) {
      case 'light':
        return {
          bgStart: '#e8ebff',
          bgEnd: '#ffffff',
          primary: '#6366f1',
          accent: '#3b82f6',
          text: '#111827',
        };
      case 'dark-theme':
        return {
          bgStart: '#1a3c47',
          bgEnd: '#000000',
          primary: '#8b5cf6',
          accent: '#60a5fa',
          text: '#e5e7eb',
        };
      case 'dark':
      default:
        return {
          bgStart: '#1e1b4b',
          bgEnd: '#000000',
          primary: '#8b5cf6',
          accent: '#3b82f6',
          text: '#ffffff',
        };
    }
  })();

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Transition overlay */}
      {transitionState.phase === 'frosting' && (
        <div
          className="absolute inset-0 z-30 bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm transition-opacity duration-1000"
          style={{ opacity: transitionState.progress }}
        />
      )}

      {/* Three.js Canvas - Full Screen */}
      <ClientOnly fallback={
        <div
          className="absolute inset-0 z-1"
          style={{
            background: `radial-gradient(ellipse at center, ${palette.bgStart} 0%, ${palette.bgEnd} 70%)`,
          }}
        />
      }>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: transitionState.phase === 'complete'
              ? 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%)'
              : `radial-gradient(ellipse at center, ${palette.bgStart} 0%, ${palette.bgEnd} 70%)`,
            zIndex: 1,
            transition: 'background 2s ease-in-out'
          }}
        >
        {/* Restored Proper Lighting System */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={palette.primary} />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color={palette.accent} />
        <pointLight position={[0, 0, 8]} intensity={0.4} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />

        {/* 3D Elements */}
        <DoubleTorus />
        <BackgroundElements />

        {/* 3D Text - Temporarily disabled until fixed */}
        {/* <ShaderText
          text="Epi-Logos"
          position={[0, 3, 0]}
          size={1.2}
          isTransitioning={transitionState.isTransitioning}
        /> */}

        {/* Frost Overlay */}
        <FrostOverlay progress={transitionState.phase === 'frosting' ? transitionState.progress : 0} />

        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate
          autoRotateSpeed={0.5}
          minDistance={3}
          maxDistance={20}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
        </Canvas>
      </ClientOnly>

      {/* Restored CSS title - working implementation */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className={`flex justify-center transition-all duration-2000 ease-in-out ${
          transitionState.phase === 'repositioning' || transitionState.phase === 'complete'
            ? 'pt-[50vh] -translate-y-1/2'
            : 'pt-8'
        }`}>
          <motion.div
            ref={titleRef}
            className={`font-heading font-thin tracking-wide text-white transition-all duration-2000 ${
              transitionState.phase === 'repositioning' || transitionState.phase === 'complete'
                ? 'text-6xl md:text-8xl lg:text-9xl'
                : 'text-5xl md:text-7xl lg:text-8xl'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Epi-Logos
          </motion.div>
        </div>

        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 70%)'
        }}
      />
    </div>
  );
};
