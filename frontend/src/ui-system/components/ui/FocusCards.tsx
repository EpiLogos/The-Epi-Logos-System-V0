"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../utils/cn";

export interface FocusCard {
  title: string;
  description: string;
  src?: string;
  link?: string;
  coordinate?: string;
  imageZoom?: number; // Optional zoom level for image (default 1.3)
  objectFit?: 'cover' | 'contain'; // How image fills container (default 'cover')
  objectPosition?: string; // Where to position the image (default 'center')
  imageOffsetY?: number; // Vertical offset in pixels (positive = down, negative = up)
  borderColor?: string; // Tailwind border color class (default 'border-purple-900/40')
}

export type FocusCardSize = 'default' | 'compact';

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    size = 'default',
  }: {
    card: FocusCard;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    size?: FocusCardSize;
  }) => {
    const router = useRouter();

    const handleClick = () => {
      if (card.link) {
        router.push(card.link);
      }
    };

    const imageZoom = card.imageZoom !== undefined ? card.imageZoom : 1.3;
    const objectFit = card.objectFit || 'cover';
    const objectPosition = card.objectPosition || 'center';
    const imageOffsetY = card.imageOffsetY || 0;
    const hasImage = Boolean(card.src && card.src.trim().length > 0);
    const fallbackLabel = card.coordinate || card.title || 'FOCUS';
    const borderColorClass = card.borderColor || 'border-purple-900/40';

    return (
      <div className={cn("relative h-full w-full border rounded-sm", borderColorClass)}>
        <div
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
          onClick={handleClick}
          className={cn(
            "rounded-sm relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-full w-full transition-all duration-300 ease-out scale-[1.003]",
            hovered !== null && hovered !== index && "blur-sm scale-[0.999]",
            card.link && "cursor-pointer"
          )}
        >
        {hasImage ? (
          <img
            src={card.src}
            alt={card.title}
            className={cn(
              "absolute inset-0 w-full h-full",
              objectFit === 'contain' ? 'object-contain' : 'object-cover'
            )}
            style={{
              transform: imageZoom !== 1 || imageOffsetY !== 0
                ? `scale(${imageZoom}) translateY(${imageOffsetY}px)`
                : undefined,
              objectPosition: objectPosition
            }}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80",
              "flex items-center justify-center"
            )}
          >
            <div className={cn(
              "text-neutral-200 tracking-[0.3em] font-light uppercase text-xs text-center px-4"
            )}>
              {fallbackLabel}
            </div>
          </div>
        )}
        {/* Hover overlay with title, description, and coordinate */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex flex-col items-start justify-end py-10 px-8 transition-opacity duration-300",
            hovered === index ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Coordinate - Centered, midway between center and top */}
          {card.coordinate && (
            <div className="absolute top-[25%] left-0 right-0 flex justify-center">
              <div className={cn(
                "text-neutral-200 tracking-widest font-mono font-thin",
                size === 'compact' ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
              )}>
                {card.coordinate}
              </div>
            </div>
          )}

          {/* Title and description at bottom */}
          <div className={cn(
            "font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-200 mb-3 tracking-wide",
            size === 'compact' ? "text-sm md:text-base" : "text-base md:text-lg"
          )}>
            {card.title}
          </div>
          {card.description && (
            <p className={cn(
              "text-neutral-200 leading-relaxed",
              size === 'compact' ? "text-[10px] md:text-xs" : "text-xs md:text-sm"
            )}>
              {card.description}
            </p>
          )}
        </div>
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";

interface FocusCardsProps {
  cards: FocusCard[];
  className?: string;
  size?: FocusCardSize;
}

export function FocusCards({ cards, className, size = 'default' }: FocusCardsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 w-full h-full p-8", className)}>
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          size={size}
        />
      ))}
    </div>
  );
}
