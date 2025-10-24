import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { FocusCards, FocusCard } from './FocusCards';

interface SubnodesSectionProps {
  cards: FocusCard[];
  title?: string;
  description?: string;
  logoSrc?: string;
  logoAlt?: string;
  className?: string;
}

export const SubnodesSection: React.FC<SubnodesSectionProps> = ({
  cards,
  title = 'Subnodes',
  description,
  logoSrc = '/ui-system/Generated Image August 28, 2025 - 11_22PM.png',
  logoAlt = 'Logo',
  className
}) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 500 && !logoVisible) {
        setTimeout(() => setLogoVisible(true), 1500);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [logoVisible]);

  return (
    <section ref={sectionRef} className={cn('projects-section-container', className)}>
      {/* Logo overlay */}
      <div className={cn('projects-logo-positioning', logoVisible && 'projects-logo-visible')}>
        <img
          src={logoSrc}
          alt={logoAlt}
          className="projects-logo-image-styling"
        />
      </div>

      {/* Header + Focus Cards */}
      <div className="flex-1 flex flex-col justify-center pt-[30px]">
        <div className="projects-carousel-container w-full">
          <div className="flex justify-between items-start mb-12">
            <div className="flex-1">
              <h2 className="text-3xl font-normal text-gray-800 mb-4 tracking-wide">{title}</h2>
              {description && (
                <p className="text-xs text-gray-600 leading-relaxed tracking-wide max-w-2xl pb-5 border-b border-gray-300">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* 4 FocusCards in horizontal layout - taller, less gap, closer to squares */}
          <FocusCards
            cards={cards}
            className="grid grid-cols-4 gap-3 w-full h-[600px]"
            size="compact"
          />
        </div>
      </div>
    </section>
  );
};

export default SubnodesSection;
