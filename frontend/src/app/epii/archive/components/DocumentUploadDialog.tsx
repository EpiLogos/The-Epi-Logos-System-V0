/**
 * DocumentUploadDialog Component
 * Modal dialog for uploading documents with coordinate assignment
 * Admin-only feature that triggers Story 08.03 preprocessing pipeline
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/ui-system/utils/cn';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, bimbaCoordinate: string, title: string) => Promise<void>;
}

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [bimbaCoordinate, setBimbaCoordinate] = useState('');
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename if title is empty
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!bimbaCoordinate.trim()) {
      setError('Please specify a Bimba coordinate');
      return;
    }

    if (!bimbaCoordinate.startsWith('#')) {
      setError('Bimba coordinate must start with #');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a document title');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'text/html',
      'text/markdown'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      setError('File type not supported. Please upload PDF, DOCX, PPTX, XLSX, HTML, or MD files.');
      return;
    }

    setIsUploading(true);

    try {
      await onUpload(file, bimbaCoordinate.trim(), title.trim());

      // Reset form
      setFile(null);
      setBimbaCoordinate('');
      setTitle('');
      setError(null);

      // Close dialog
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;

    if (file || bimbaCoordinate || title) {
      const confirmClose = confirm('You have unsaved changes. Close anyway?');
      if (!confirmClose) return;
    }

    setFile(null);
    setBimbaCoordinate('');
    setTitle('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Upload Document</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select File <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.pptx,.xlsx,.html,.md"
              disabled={isUploading}
              className={cn(
                "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300",
                "file:mr-4 file:py-1 file:px-3 file:rounded file:border-0",
                "file:text-sm file:bg-blue-600 file:text-white file:cursor-pointer",
                "hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported: PDF, DOCX, PPTX, XLSX, HTML, MD
            </p>
          </div>

          {/* Bimba Coordinate input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bimba Coordinate <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={bimbaCoordinate}
              onChange={(e) => setBimbaCoordinate(e.target.value)}
              placeholder="#1-2-3"
              disabled={isUploading}
              className={cn(
                "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded",
                "text-gray-300 font-mono placeholder-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: #N[-N]... (e.g., #1, #1-2, #5-0)
            </p>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              disabled={isUploading}
              className={cn(
                "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded",
                "text-gray-300 placeholder-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Info message */}
          <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
            ℹ️ Document will be uploaded. Use ⚡ button to manually trigger ingestion.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm text-gray-300 hover:text-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={cn(
                "px-4 py-2 text-sm rounded transition-colors",
                isUploading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
