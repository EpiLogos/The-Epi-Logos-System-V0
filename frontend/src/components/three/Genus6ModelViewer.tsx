'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';

function Model() {
  const ref = useRef<THREE.Group>(null!);

  useEffect(() => {
    console.log('Model component mounted');
  }, []);

  let obj;
  try {
    obj = useLoader(OBJLoader, '/genus_6_3d_surface.obj');
    console.log('OBJ loaded successfully:', obj);
  } catch (error) {
    console.error('Failed to load OBJ:', error);
    throw error;
  }

  const processedObj = useMemo(() => {
    console.log('Processing obj...');
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log('Found mesh:', child);
        child.material = new THREE.MeshStandardMaterial({
          color: 0xC4A5C7,
          roughness: 0.15,
          metalness: 0.6,
          envMapIntensity: 1.5,
        });
      }
    });
    return obj;
  }, [obj]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  return <primitive ref={ref} object={processedObj} scale={0.65} position={[0, 0, 0]} />;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
      <div>
        <p>Failed to load 3D model</p>
        <p style={{ fontSize: '12px' }}>{error.message}</p>
      </div>
    </div>
  );
}

export function Genus6ModelViewer() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('Genus6ModelViewer mounted');
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div style={{
      width: '100%',
      height: '700px',
      background: 'radial-gradient(ellipse at center, #251825 0%, #1A0F1C 50%, #0D070E 100%)',
      position: 'relative'
    }}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true
        }}
        onCreated={({ gl, scene }) => {
          console.log('Canvas created, setting clear color');
          gl.setClearColor(0x000000, 0);
          scene.background = null;
          const canvas = gl.domElement;
          canvas.style.background = 'transparent';
          console.log('Canvas element:', canvas);
          console.log('Clear color alpha:', gl.getClearAlpha());
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setError(error as Error);
        }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Model />
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 0]}>
            <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
            <Lightformer form="ring" color="#C4A5C7" intensity={10} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
          </group>
        </Environment>
      </Canvas>
    </div>
  );
}
