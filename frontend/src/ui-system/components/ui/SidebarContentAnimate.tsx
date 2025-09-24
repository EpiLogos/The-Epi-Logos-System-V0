import React from 'react';
import { TextAnimate } from './TextAnimate';

interface SidebarContentAnimateProps {
  children: React.ReactNode;
  visible?: boolean;
  delay?: number;
  duration?: 'fast' | 'normal' | 'slow' | 'slower';
  className?: string;
}

export const SidebarContentAnimate: React.FC<SidebarContentAnimateProps> = ({
  children,
  visible = true,
  delay = 0,
  duration = 'normal',
  className
}) => {
  // Thin wrapper to semantically denote sidebar content animation.
  // Delegates to TextAnimate without altering behavior.
  return (
    <TextAnimate visible={visible} delay={delay} duration={duration} className={className}>
      {children}
    </TextAnimate>
  );
};

export default SidebarContentAnimate;

