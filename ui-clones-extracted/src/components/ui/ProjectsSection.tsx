import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { ProjectCarousel } from './ProjectCarousel';

interface ProjectsSectionProps {
  className?: string;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ className }) => {
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
          src="/Generated Image August 28, 2025 - 11_22PM.png"
          alt="Logo"
          className="projects-logo-image-styling"
        />
      </div>

      {/* Header + Carousel */}
      <div className="flex-1 flex flex-col justify-center pt-[60px]">
        <div className="projects-carousel-container w-full">
          <div className="flex justify-between items-start mb-12">
            <div className="flex-1">
              <h2 className="text-4xl font-normal text-gray-800 mb-6 tracking-wide">Subnodes</h2>
              <p className="text-sm text-gray-600 leading-relaxed tracking-wide max-w-2xl pb-5 border-b border-gray-300">
                Discover how leading companies and developers are leveraging modern web technologies to build exceptional digital experiences. These case studies showcase real-world applications and success stories.
              </p>
            </div>
          </div>

          <ProjectCarousel className="w-full" variant="projects" showArrows={true} showDots={true} />
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;

