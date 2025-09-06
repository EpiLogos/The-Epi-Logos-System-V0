"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import ClientOnly from './ClientOnly';

// TEST 1: Simple rotating cube to verify Three.js works
function TestCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8b5cf6" />
    </mesh>
  );
}

// TEST 2: Animated text overlay to verify Framer Motion works
function TestText({ isTransitioned }: { isTransitioned: boolean }) {
  return (
    <div className={`absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none transition-all duration-1000 ${
      isTransitioned ? 'top-1/2 -translate-y-1/2' : 'top-8'
    }`}>
      <motion.h1
        className={`font-heading font-thin text-white transition-all duration-1000 ${
          isTransitioned ? 'text-8xl' : 'text-6xl'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Epi-Logos
      </motion.h1>
    </div>
  );
}

// TEST 3: Animated button to verify interactions work
function TestButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Toggle Transition
    </motion.button>
  );
}

// Main test component
export function SimpleThreeScene() {
  const [isTransitioned, setIsTransitioned] = useState(false);

  const handleButtonClick = () => {
    console.log('Test button clicked!');
    setIsTransitioned(!isTransitioned);
    console.log('Transition state:', !isTransitioned);
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* TEST: Three.js Canvas */}
      <ClientOnly fallback={<div className="absolute inset-0 bg-black" />}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <TestCube />
          <OrbitControls />
        </Canvas>
      </ClientOnly>
      
      {/* TEST: Animated Text Overlay */}
      <TestText isTransitioned={isTransitioned} />

      {/* TEST: Interactive Button */}
      <TestButton onClick={handleButtonClick} />
    </div>
  );
}
