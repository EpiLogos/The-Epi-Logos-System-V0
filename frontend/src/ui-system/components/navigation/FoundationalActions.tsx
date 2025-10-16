import React from 'react';
import { cn } from '../../utils/cn';

interface FoundationalActionsProps {
  onNotesClick: () => void;
  onChatClick: () => void;
}

export const FoundationalActions: React.FC<FoundationalActionsProps> = ({
  onNotesClick,
  onChatClick
}) => {
  return (
    <div className="flex flex-row gap-4 pt-4 border-t border-[#e0e0e0]">
      <button
        onClick={onNotesClick}
        className={cn(
          'flex-1 py-3 px-4 text-[12px] font-normal tracking-[1px] text-[#333]',
          'border border-[#e0e0e0] rounded-none',
          'hover:bg-[#ececec] hover:border-[#333]',
          'transition-colors duration-200',
          'cursor-pointer'
        )}
      >
        NOTES
      </button>

      <button
        onClick={onChatClick}
        className={cn(
          'flex-1 py-3 px-4 text-[12px] font-normal tracking-[1px] text-[#333]',
          'border border-[#e0e0e0] rounded-none',
          'hover:bg-[#ececec] hover:border-[#333]',
          'transition-colors duration-200',
          'cursor-pointer'
        )}
      >
        AI CHAT
      </button>
    </div>
  );
};
