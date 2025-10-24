/**
 * DocumentViewer Component
 * Main canvas for viewing and editing documents with MDXEditor
 * Supports read-only mode for non-admin users and edit mode for admins
 */

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/ui-system/utils/cn';
import type { Document, BimbaDocument, PratibimbaDocument } from '@/services/document.service';
import { isPratibimbaDocument } from '@/services/document.service';
import { DocumentMetadataPanel } from '@/ui-system/components/ui/DocumentMetadataPanel';

interface DocumentViewerProps {
  document: Document | null;
  isAdmin: boolean;
  isSidebarCollapsed: boolean;
  onSave?: (updates: { content?: string; writer_notes?: string; development_content?: string }) => Promise<void>;
  onAnalyze?: () => void; // Trigger Story 08.09 analysis
  onRetryIngestion?: (docId: string) => void; // Retry failed ingestion
  onNotesClick?: () => void; // Journal entry action
  onChatClick?: () => void; // Ask Epii action
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isAdmin,
  isSidebarCollapsed,
  onSave,
  onAnalyze,
  onRetryIngestion,
  onNotesClick = () => console.log('Notes clicked'),
  onChatClick = () => console.log('Chat clicked'),
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editWriterNotes, setEditWriterNotes] = useState('');
  const [editDevelopmentContent, setEditDevelopmentContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update edit content when document changes
  useEffect(() => {
    if (document) {
      const bimbaDoc = !isPratibimbaDocument(document) ? document as BimbaDocument : null;
      setEditContent(document.content || '');
      setEditWriterNotes(bimbaDoc?.writer_notes || '');
      setEditDevelopmentContent(bimbaDoc?.development_content || '');
      setHasUnsavedChanges(false);
      setIsEditing(false);
    }
  }, [document?._id]);

  const handleEditToggle = () => {
    if (isEditing && hasUnsavedChanges) {
      const confirmDiscard = confirm('You have unsaved changes. Discard them?');
      if (!confirmDiscard) return;

      if (document) {
        const bimbaDoc = !isPratibimbaDocument(document) ? document as BimbaDocument : null;
        setEditContent(document.content || '');
        setEditWriterNotes(bimbaDoc?.writer_notes || '');
        setEditDevelopmentContent(bimbaDoc?.development_content || '');
      }
      setHasUnsavedChanges(false);
    }
    setIsEditing(!isEditing);
  };

  const handleContentChange = (newContent: string) => {
    setEditContent(newContent);
    checkUnsavedChanges(newContent, editWriterNotes, editDevelopmentContent);
  };

  const handleWriterNotesChange = (newNotes: string) => {
    setEditWriterNotes(newNotes);
    checkUnsavedChanges(editContent, newNotes, editDevelopmentContent);
  };

  const handleDevelopmentContentChange = (newDevContent: string) => {
    setEditDevelopmentContent(newDevContent);
    checkUnsavedChanges(editContent, editWriterNotes, newDevContent);
  };

  const checkUnsavedChanges = (content: string, writerNotes: string, devContent: string) => {
    if (!document) return;
    const bimbaDoc = !isPratibimbaDocument(document) ? document as BimbaDocument : null;
    const hasChanges =
      content !== (document.content || '') ||
      writerNotes !== (bimbaDoc?.writer_notes || '') ||
      devContent !== (bimbaDoc?.development_content || '');
    setHasUnsavedChanges(hasChanges);
  };

  const handleSave = async () => {
    if (!onSave || !document) return;

    setIsSaving(true);
    try {
      await onSave({
        content: editContent,
        writer_notes: editWriterNotes,
        development_content: editDevelopmentContent
      });
      setHasUnsavedChanges(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!document) {
    return (
      <div className={cn(
        "relative h-full bg-[#f5f5f5]",
        className
      )}>
        {/* Epii Icon */}
        <div
          className={cn(
            "absolute transition-opacity duration-500",
            isSidebarCollapsed ? "opacity-100 delay-[300ms]" : "opacity-0"
          )}
          style={{
            top: '120px',
            left: 'calc(50% - 5px)',
            transform: 'translateX(-50%)'
          }}
        >
          <img
            src="/ui-system/epii-icon.png"
            alt="Epii Archive"
            width={220}
            height={220}
          />
        </div>

        {/* Instructions - Below icon with more spacing */}
        <div
          className={cn(
            "absolute text-center max-w-md transition-opacity duration-500",
            isSidebarCollapsed ? "opacity-100 delay-[300ms]" : "opacity-0"
          )}
          style={{
            top: '400px',
            left: 'calc(50% - 5px)',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="space-y-3">
            <h3 className="text-lg font-normal tracking-[1px] text-[#333]">
              NO DOCUMENT SELECTED
            </h3>
            <div className="text-xs text-[#888] leading-relaxed space-y-2">
              <p>Press <kbd className="px-2 py-1 bg-white border border-[#e0e0e0] rounded font-mono text-[#333]">ESC</kbd> to open the sidebar</p>
              <p>Navigate the coordinate tree to find documents</p>
              <p>Click a document to view its contents</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPratibimba = isPratibimbaDocument(document);
  const bimbaDoc = !isPratibimba ? document as BimbaDocument : null;

  return (
    <div className={cn("flex flex-col h-full bg-[#f5f5f5] p-5", className)}>
      {/* Document header with metadata */}
      <div className="border-b border-[#e0e0e0] bg-white p-6">
        <div className="flex items-start gap-4">
          {/* Left: Title and metadata */}
          <div className="flex-1 min-w-0 max-w-[400px]">
            {/* Title - matching sidebar header style with proper wrapping */}
            <h2 className="text-[18px] font-normal tracking-[2px] text-[#333] mb-4 break-words">
              {(document.title || bimbaDoc?.filename || 'UNTITLED DOCUMENT').toUpperCase()}
            </h2>

            {/* Metadata - compact badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-3 py-1 rounded bg-[#333] text-[#f5f5f5] tracking-wide font-mono">
                {isPratibimba
                  ? (document as PratibimbaDocument).sourceBimbaCoordinate
                  : (document as BimbaDocument).coordinate
                }
              </span>

              {!isPratibimba && bimbaDoc && (
                <>
                  <span className="px-3 py-1 rounded bg-[#555] text-[#f5f5f5] tracking-wide uppercase">{bimbaDoc.file_type}</span>

                  {bimbaDoc.processing_status && (
                    <span className={cn(
                      "px-3 py-1 rounded tracking-wide uppercase",
                      bimbaDoc.processing_status === 'complete' && "bg-green-600 text-white",
                      bimbaDoc.processing_status === 'processing' && "bg-yellow-600 text-white",
                      bimbaDoc.processing_status === 'pending' && "bg-[#888] text-white",
                      bimbaDoc.processing_status === 'failed' && "bg-red-600 text-white"
                    )}>
                      {bimbaDoc.processing_status}
                    </span>
                  )}
                </>
              )}

              {isPratibimba && (
                <>
                  <span className="px-3 py-1 rounded bg-purple-600 text-white tracking-wide">ANALYSIS</span>
                  <span className="px-3 py-1 rounded bg-[#666] text-[#f5f5f5] tracking-wide">{(document as PratibimbaDocument).analysisModel}</span>
                </>
              )}

              <span className="text-[#888] tracking-wide">
                {new Date(
                  isPratibimba
                    ? (document as PratibimbaDocument).analysisDate
                    : (document as BimbaDocument).upload_timestamp
                ).toLocaleDateString()}
              </span>
            </div>

            {/* Error display for failed processing */}
            {!isPratibimba && bimbaDoc?.processing_status === 'failed' && (
              <div className="mt-4 px-4 py-3 bg-red-100 border border-red-300 rounded">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-red-800 mb-1 text-sm">Processing Failed</div>
                    <div className="text-red-700 text-xs">
                      The document failed during preprocessing. This may be due to an unsupported format or corrupted file.
                    </div>
                  </div>
                  {isAdmin && onRetryIngestion && (
                    <button
                      onClick={() => onRetryIngestion(document._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs tracking-wide transition-colors"
                    >
                      RETRY
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Document Metadata Panel */}
          {!isPratibimba && (
            <div className="flex-1 min-w-0 flex-shrink">
              <DocumentMetadataPanel
                writerNotes={isEditing ? editWriterNotes : bimbaDoc?.writer_notes}
                developmentContent={isEditing ? editDevelopmentContent : bimbaDoc?.development_content}
                isEditing={isEditing}
                hasUnsavedChanges={hasUnsavedChanges}
                onWriterNotesChange={handleWriterNotesChange}
                onDevelopmentContentChange={handleDevelopmentContentChange}
                onNotesClick={onNotesClick}
                onChatClick={onChatClick}
                className="-my-6"
              />
            </div>
          )}

          {/* Right: Action buttons (admin only) */}
          {isAdmin && !isPratibimba && (
            <div className="flex items-start gap-2 flex-shrink-0">
              <button
                onClick={handleEditToggle}
                className={cn(
                  "px-4 py-2 text-[11px] tracking-wide rounded-none transition-colors uppercase",
                  "border border-[#333] text-[#333] bg-transparent hover:bg-[#ececec]"
                )}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>

              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={cn(
                    "px-4 py-2 text-[11px] tracking-wide rounded-none transition-colors uppercase",
                    hasUnsavedChanges && !isSaving
                      ? "border border-[#333] text-[#333] bg-transparent hover:bg-[#ececec]"
                      : "border border-[#ccc] text-[#888] bg-transparent cursor-not-allowed"
                  )}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}

              {!isEditing && onAnalyze && bimbaDoc?.processing_status === 'complete' && (
                <button
                  onClick={onAnalyze}
                  className="px-4 py-2 text-[11px] tracking-wide rounded-none border border-[#333] text-[#333] bg-transparent hover:bg-[#ececec] transition-colors uppercase"
                >
                  Deep Analysis
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Document content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {document.content ? (
          <>
            {/* Markdown files */}
            {!isPratibimba && bimbaDoc?.file_type === 'md' ? (
              isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className={cn(
                    "w-full h-full p-6 bg-white",
                    "text-[#333] font-mono text-xs resize-none leading-relaxed",
                    "focus:outline-none"
                  )}
                  placeholder="Document content..."
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-slate max-w-none text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editContent.replace(/^---[\s\S]*?---\n/, '')}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            ) : (
              /* Plain text fallback */
              <>
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className={cn(
                      "w-full h-full p-6 bg-white",
                      "text-[#333] font-mono text-xs resize-none leading-relaxed",
                      "focus:outline-none"
                    )}
                    placeholder="Document content..."
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <pre className="whitespace-pre-wrap font-mono text-[#333] leading-relaxed text-xs">
                      {document.content}
                    </pre>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#888]">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-sm tracking-wide">DOCUMENT CONTENT NOT YET PROCESSED</p>
              <p className="text-xs mt-2">The file may need to be extracted or converted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
