/**
 * DocumentMetadataPanel Component
 *
 * Reusable metadata panel for documents showing:
 * - Writer Notes (contextual purpose/usage notes)
 * - Development Content (lifecycle context - fresh vs stale)
 * - Action buttons: Journal Entry and Ask Epii
 *
 * Used in Archive DocumentViewer and Etymology Explorer
 */

'use client';

import React from 'react';
import { PencilIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface DocumentMetadataPanelProps {
  writerNotes?: string;
  developmentContent?: string;
  isEditing?: boolean;
  hasUnsavedChanges?: boolean;
  onWriterNotesChange?: (value: string) => void;
  onDevelopmentContentChange?: (value: string) => void;
  onNotesClick: () => void;
  onChatClick: () => void;
  className?: string;
}

export const DocumentMetadataPanel: React.FC<DocumentMetadataPanelProps> = ({
  writerNotes,
  developmentContent,
  isEditing = false,
  hasUnsavedChanges = false,
  onWriterNotesChange,
  onDevelopmentContentChange,
  onNotesClick,
  onChatClick,
  className
}) => {
  return (
    <div className={cn(
      "bg-[#fafafa] px-6 py-4",
      className
    )}>
      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div className="mb-4 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
          ⚠ You have unsaved changes
        </div>
      )}

      {/* Metadata Fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Writer Notes */}
        <div>
          <label className="block text-[10px] tracking-[1px] text-[#666] uppercase mb-2">
            Writer Notes
          </label>
          {isEditing ? (
            <textarea
              value={writerNotes || ''}
              onChange={(e) => onWriterNotesChange?.(e.target.value)}
              placeholder="Contextual notes about document purpose and usage..."
              className={cn(
                "w-full px-3 py-2 text-xs font-mono",
                "bg-white border border-[#e0e0e0] rounded",
                "focus:outline-none focus:border-[#333]",
                "resize-none h-20"
              )}
            />
          ) : (
            <div className={cn(
              "text-xs text-[#333] font-mono leading-relaxed",
              !writerNotes && "text-[#999] italic"
            )}>
              {writerNotes || 'No notes provided'}
            </div>
          )}
        </div>

        {/* Development Content */}
        <div>
          <label className="block text-[10px] tracking-[1px] text-[#666] uppercase mb-2">
            Development Context
          </label>
          {isEditing ? (
            <textarea
              value={developmentContent || ''}
              onChange={(e) => onDevelopmentContentChange?.(e.target.value)}
              placeholder="Development lifecycle context (fresh vs stale)..."
              className={cn(
                "w-full px-3 py-2 text-xs font-mono",
                "bg-white border border-[#e0e0e0] rounded",
                "focus:outline-none focus:border-[#333]",
                "resize-none h-20"
              )}
            />
          ) : (
            <div className={cn(
              "text-xs text-[#333] font-mono leading-relaxed",
              !developmentContent && "text-[#999] italic"
            )}>
              {developmentContent || 'No context provided'}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - matching HexagonSidebarPanel FoundationalActions style */}
      <div className="flex gap-4 pt-3 border-t border-[#e0e0e0]">
        <button
          onClick={onNotesClick}
          className={cn(
            'flex-1 py-2 px-4 text-[11px] font-normal tracking-[1px] text-[#333]',
            'border border-[#e0e0e0] rounded-none',
            'hover:bg-[#ececec] hover:border-[#333]',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <PencilIcon className="w-4 h-4" />
          JOURNAL ENTRY
        </button>

        <button
          onClick={onChatClick}
          className={cn(
            'flex-1 py-2 px-4 text-[11px] font-normal tracking-[1px] text-[#333]',
            'border border-[#e0e0e0] rounded-none',
            'hover:bg-[#ececec] hover:border-[#333]',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          ASK EPII
        </button>
      </div>
    </div>
  );
};
