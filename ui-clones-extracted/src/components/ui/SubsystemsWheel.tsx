import React from 'react';
import { cn } from '../../utils/cn';

interface SubsystemData {
  id: number;
  name: string;
  imagePath: string;
  color: string;
  description: string;
}

interface SubsystemsWheelProps {
  subsystems?: SubsystemData[];
  size?: number; // Diameter of the hexagon formation
  itemSize?: number; // Size of each PNG
  onSubsystemClick?: (subsystem: SubsystemData) => void;
  className?: string;
}

const defaultSubsystems: SubsystemData[] = [
  { id: 0, name: "Anuttara", imagePath: "/anuttara-hex.png", color: "#ffffff", description: "The absolute, beyond all categories" },
  { id: 1, name: "Paramasiva", imagePath: "/paramasiva-hex.png", color: "#22c55e", description: "Pure consciousness, formless awareness" },
  { id: 2, name: "Parashakti", imagePath: "/parashakti-hex.png", color: "#3b82f6", description: "Dynamic creative power" },
  { id: 5, name: "Epii", imagePath: "/epii-hex.png", color: "#8b5cf6", description: "Meta-rational discourse, beyond logic" },
  { id: 4, name: "Nara", imagePath: "/nara-hex.png", color: "#ef4444", description: "Individual consciousness, the experiencer" },
  { id: 3, name: "Mahamaya", imagePath: "/mahamaya-hex.png", color: "#f59e0b", description: "The great illusion, cosmic manifestation" }
];

export const SubsystemsWheel: React.FC<SubsystemsWheelProps> = ({
  subsystems = defaultSubsystems,
  size = 300,
  itemSize = 80,
  onSubsystemClick,
  className
}) => {
  // Calculate hexagonal vertices for 6 items
  // Each vertex is at 60-degree intervals around a circle
  const calculateHexagonPositions = () => {
    const radius = (size - itemSize) / 2; // Radius minus item size to prevent overlap
    const centerX = size / 2;
    const centerY = size / 2;
    
    return subsystems.map((_, index) => {
      // Start at top (270°) and go clockwise
      const angle = (index * 60 - 90) * (Math.PI / 180); // Convert to radians
      const x = centerX + radius * Math.cos(angle) - itemSize / 2;
      const y = centerY + radius * Math.sin(angle) - itemSize / 2;
      
      return { x, y };
    });
  };

  const positions = calculateHexagonPositions();

  const handleClick = (subsystem: SubsystemData) => {
    if (onSubsystemClick) {
      onSubsystemClick(subsystem);
    } else {
      console.log(`Clicked subsystem: ${subsystem.name}`);
    }
  };

  return (
    <div 
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Central hub indicator (optional) */}
      <div 
        className="absolute bg-[#090a09] rounded-full border-2 border-[#333] opacity-20"
        style={{
          width: itemSize * 0.6,
          height: itemSize * 0.6,
          left: (size - itemSize * 0.6) / 2,
          top: (size - itemSize * 0.6) / 2,
        }}
      />
      
      {/* Subsystem items positioned at hexagon vertices */}
      {subsystems.map((subsystem, index) => {
        const position = positions[index];
        
        return (
          <div
            key={subsystem.id}
            className="absolute cursor-pointer group transition-all duration-300 hover:scale-110 hover:z-10"
            style={{
              left: position.x,
              top: position.y,
              width: itemSize,
              height: itemSize,
            }}
            onClick={() => handleClick(subsystem)}
            title={`${subsystem.name}: ${subsystem.description}`}
          >
            {/* PNG Image */}
            <img
              src={subsystem.imagePath}
              alt={subsystem.name}
              className="w-full h-full object-contain transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-lg"
            />
            
            {/* Hover label */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {subsystem.name}
            </div>
            
          </div>
        );
      })}
      
      {/* Connection lines (optional) */}
      <svg 
        className="absolute inset-0 pointer-events-none opacity-10"
        width={size}
        height={size}
      >
        {positions.map((position, index) => {
          const nextIndex = (index + 1) % positions.length;
          const nextPosition = positions[nextIndex];
          
          return (
            <line
              key={`connection-${index}`}
              x1={position.x + itemSize / 2}
              y1={position.y + itemSize / 2}
              x2={nextPosition.x + itemSize / 2}
              y2={nextPosition.y + itemSize / 2}
              stroke="#333"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}
      </svg>
    </div>
  );
};