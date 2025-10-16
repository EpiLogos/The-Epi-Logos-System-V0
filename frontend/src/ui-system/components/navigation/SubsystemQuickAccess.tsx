import React from 'react';
import { cn } from '../../utils/cn';
import { SubsystemFeature } from '@/config/subsystemFeatures';

interface SubsystemQuickAccessProps {
  subsystems: SubsystemFeature[];
  onFeatureClick: (subsystemId: string, feature: 'left' | 'right') => void;
}

export const SubsystemQuickAccess: React.FC<SubsystemQuickAccessProps> = ({
  subsystems,
  onFeatureClick
}) => {
  return (
    <div className="grid grid-rows-3 gap-0 flex-1">
      {subsystems.map((subsystem) => (
        <div
          key={subsystem.id}
          className="grid grid-cols-2 gap-0 border-b border-[#e0e0e0] last:border-b-0"
        >
          {/* Left Feature */}
          <button
            onClick={() => !subsystem.leftFeature.comingSoon && onFeatureClick(subsystem.id, 'left')}
            disabled={subsystem.leftFeature.comingSoon}
            className={cn(
              'flex flex-col items-start justify-center p-6 border-r border-[#e0e0e0] text-left transition-colors min-h-[120px]',
              subsystem.leftFeature.comingSoon
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-[#ececec] cursor-pointer'
            )}
          >
            <div className="text-[11px] text-[#666] tracking-wider mb-2">
              {subsystem.coordinate} {subsystem.name.toUpperCase()}
            </div>
            <div className={cn(
              'text-[14px] font-normal tracking-[0.5px]',
              subsystem.leftFeature.comingSoon ? 'text-[#999] italic' : 'text-[#333]'
            )}>
              {subsystem.leftFeature.label}
            </div>
          </button>

          {/* Right Feature */}
          <button
            onClick={() => !subsystem.rightFeature.comingSoon && onFeatureClick(subsystem.id, 'right')}
            disabled={subsystem.rightFeature.comingSoon}
            className={cn(
              'flex flex-col items-start justify-center p-6 text-left transition-colors min-h-[120px]',
              subsystem.rightFeature.comingSoon
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-[#ececec] cursor-pointer'
            )}
          >
            <div className="text-[11px] text-[#666] tracking-wider mb-2 opacity-0">
              {/* Hidden for alignment */}
              {subsystem.coordinate}
            </div>
            <div className={cn(
              'text-[14px] font-normal tracking-[0.5px]',
              subsystem.rightFeature.comingSoon ? 'text-[#999] italic' : 'text-[#333]'
            )}>
              {subsystem.rightFeature.label}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};
