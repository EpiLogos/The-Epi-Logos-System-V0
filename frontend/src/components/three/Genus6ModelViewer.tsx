'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';

function Model() {
  const ref = useRef<THREE.Group>(null!);
  const obj = useLoader(OBJLoader, '/genus_6_3d_surface.obj');

  // Apply material on every render to ensure it persists
  useEffect(() => {
    console.log('Applying material to mesh...');
    let meshCount = 0;
    obj.traverse((child: any) => {
      // Check by type string instead of instanceof due to Three.js version mismatch
      if (child.type === 'Mesh' && child.geometry) {
        meshCount++;
        console.log('Found mesh #' + meshCount + ', applying MeshStandardMaterial');
        const material = new THREE.MeshStandardMaterial({
          color: 0x3D2A3E,
          roughness: 0.2,
          metalness: 0.8,
          envMapIntensity: 2.0,
        });
        child.material = material;
        child.material.needsUpdate = true;
        console.log('Material applied:', {
          color: material.color.getHexString(),
          roughness: material.roughness,
          metalness: material.metalness,
          envMapIntensity: material.envMapIntensity
        });
      }
    });
    console.log('Traverse complete. Total meshes found:', meshCount);
  }, [obj]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  return <primitive ref={ref} object={obj} scale={0.65} position={[0, 0, 0]} />;
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
      background: 'radial-gradient(ellipse at center, #FEFEFE 0%, #F5F0EA 20%, #EDE6DC 100%)',
      position: 'relative'
    }}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setError(error as Error);
        }}
      >
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
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
