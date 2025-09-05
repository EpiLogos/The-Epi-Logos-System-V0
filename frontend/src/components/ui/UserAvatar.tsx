'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface UserAvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    picture?: string;
    email?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showBorder = true,
  clickable = false,
  onClick
}: UserAvatarProps) {
  // Generate initials from user data
  const getInitials = () => {
    if (!user) return 'U';
    
    // Try firstName + lastName first
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    // Try full name
    if (user.name) {
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Fallback to email
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Generate a consistent color based on user data
  const getAvatarColor = () => {
    if (!user) return 'bg-gray-500';
    
    const identifier = user.email || user.name || user.firstName || 'default';
    const hash = identifier.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-cyan-500',
      'bg-emerald-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      text: 'text-xs',
      border: 'border'
    },
    md: {
      container: 'w-8 h-8',
      text: 'text-sm',
      border: 'border-2'
    },
    lg: {
      container: 'w-12 h-12',
      text: 'text-lg',
      border: 'border-2'
    },
    xl: {
      container: 'w-16 h-16',
      text: 'text-xl',
      border: 'border-2'
    }
  };

  const config = sizeConfig[size];
  const initials = getInitials();
  const avatarColor = getAvatarColor();
  
  const borderClass = showBorder ? `${config.border} border-white/20` : '';
  const hoverClass = clickable ? 'hover:border-white/40 cursor-pointer' : '';
  
  const avatarContent = user?.picture ? (
    <img
      src={user.picture}
      alt={`${user.name || user.email || 'User'}'s avatar`}
      className="w-full h-full object-cover"
      onError={(e) => {
        // If image fails to load, hide it and show initials fallback
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : (
    <div className={`w-full h-full ${avatarColor} flex items-center justify-center`}>
      <span className={`${config.text} font-semibold text-white`}>
        {initials}
      </span>
    </div>
  );

  const avatarElement = (
    <div 
      className={`
        ${config.container} 
        rounded-full 
        overflow-hidden 
        ${borderClass} 
        ${hoverClass}
        transition-all duration-200
        ${className}
      `}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {avatarContent}
      {/* Fallback initials if image fails */}
      {user?.picture && (
        <div 
          className={`w-full h-full ${avatarColor} flex items-center justify-center absolute inset-0`}
          style={{ display: 'none' }}
          id="fallback-initials"
        >
          <span className={`${config.text} font-semibold text-white`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );

  // Wrap with motion if clickable
  if (clickable) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {avatarElement}
      </motion.div>
    );
  }

  return avatarElement;
}
