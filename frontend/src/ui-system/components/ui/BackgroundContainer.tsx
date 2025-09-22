import React from 'react';
import { cn } from '../../utils/cn';
import WavesBackground from './WavesBackground';
import ParticlesBackground from './ParticlesBackground';

interface BackgroundContainerProps {
  // Background visibility and state
  showWaves?: boolean;
  showParticles?: boolean;
  isModalExpanded?: boolean;
  imageRepositioned?: boolean;
  
  // Background configuration
  particleConfig?: {
    count?: number;
    baseHue?: number;
    monochrome?: boolean;
    mode?: 'default' | 'mist';
    saturation?: number;
    lightness?: number;
    radiusScale?: number;
  };
  
  className?: string;
}

export const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  showWaves = true,
  showParticles = true,
  isModalExpanded = false,
  imageRepositioned = false,
  particleConfig = {},
  className
}) => {
  const {
    count = 150,
    baseHue = 240,
    monochrome = false,
    mode = 'default',
    saturation = 70,
    lightness = 60,
    radiusScale = 1
  } = particleConfig;

  // Calculate background opacity and effects based on modal state
  const getBackgroundClasses = (isWaves: boolean = false) => {
    if (isModalExpanded && imageRepositioned) {
      // Modal fully expanded with backgrounds visible
      return isWaves 
        ? "opacity-20 blur-[1px] scale-105" // Waves dimmer with blur
        : "opacity-70 blur-none scale-105"; // Particles brighter, no blur
    }
    
    if (isModalExpanded) {
      // Modal expanding - fade out during expansion
      return "opacity-0 blur-[8px] scale-100";
    }
    
    // Normal state - both fully visible
    return isWaves
      ? "opacity-100 blur-[2px] scale-100" // Waves with subtle blur
      : "opacity-100 blur-none scale-100"; // Particles clear
  };

  return (
    <div className={cn(
      "absolute inset-0 w-full h-full overflow-hidden",
      className
    )}>
      {/* Waves Background */}
      {showWaves && (
        <div className={cn(
          "absolute inset-0 transition-all ease-out duration-[800ms] pointer-events-none",
          getBackgroundClasses(true)
        )}>
          <WavesBackground />
        </div>
      )}
      
      {/* Particles Background */}
      {showParticles && (
        <div className={cn(
          "absolute inset-0 transition-all ease-out duration-[800ms] pointer-events-none",
          getBackgroundClasses(false)
        )}>
          <ParticlesBackground 
            particleCount={count}
            baseHue={baseHue}
            monochrome={monochrome}
            mode={mode}
            saturation={saturation}
            lightness={lightness}
            radiusScale={radiusScale}
            scaleOnHover={false}
          />
        </div>
      )}
    </div>
  );
};