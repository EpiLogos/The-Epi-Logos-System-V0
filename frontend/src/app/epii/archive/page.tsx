/**
 * Epii Archive Page (#5-0)
 *
 * Document Viewer & Editor Interface - Story 08.02
 * Archive/Document Hub - Reading modality for etymological archaeology
 *
 * Features:
 * - Recursive coordinate tree showing documents from MongoDB
 * - Document viewing/editing canvas
 * - Admin-only upload with coordinate assignment
 * - Integration with Story 08.03 (Docling preprocessing)
 * - Integration with Story 08.09 (Deep document analysis)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/ui-system/utils/cn';
import { Sidebar } from '@/ui-system/components/ui/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/auth/hooks/useAuth';
import { toast, Toaster } from 'sonner';

import { DocumentTree } from './components/DocumentTree';
import { DocumentViewer } from './components/DocumentViewer';
import { DocumentUploadDialog } from './components/DocumentUploadDialog';

import {
  documentService,
  type BimbaDocument,
  type Document,
  type CoordinateNode,
  type PratibimbaDocument,
  isPratibimbaDocument
} from '@/services/document.service';

/**
 * Page coordinate metadata: #5-0 (Epii Archive - Reading modality)
 * Integrates with Story 08.03 Docling preprocessing pipeline
 */
const TREE_EXPANSION_KEY = 'epii-archive-tree-expansion';

export default function EpiiArchive() {
  const { isCollapsed, toggle } = useSidebar();
  const { user, getAuthHeader } = useAuth();

  // Document state
  const [bimbaDocuments, setBimbaDocuments] = useState<BimbaDocument[]>([]);
  const [coordinateTree, setCoordinateTree] = useState<CoordinateNode[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCoordinates, setExpandedCoordinates] = useState<Set<string>>(new Set());

  // UI state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [treeFilter, setTreeFilter] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<string | null>(null);
  const [ingestingDocId, setIngestingDocId] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.isAdmin || false;

  // Load expanded coordinates from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TREE_EXPANSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExpandedCoordinates(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse stored tree expansion:', error);
      }
    }
  }, []);

  // Smart default expansion: auto-expand coordinates with documents
  useEffect(() => {
    if (coordinateTree.length > 0 && expandedCoordinates.size === 0) {
      const coordinatesWithDocs = new Set<string>();

      const findCoordinatesWithDocuments = (nodes: CoordinateNode[]) => {
        nodes.forEach(node => {
          if (node.documents.length > 0) {
            // Expand this coordinate and all its parents
            const parts = node.coordinate.split('-');
            for (let i = 1; i <= parts.length; i++) {
              coordinatesWithDocs.add(parts.slice(0, i).join('-'));
            }
          }
          if (node.children.length > 0) {
            findCoordinatesWithDocuments(node.children);
          }
        });
      };

      findCoordinatesWithDocuments(coordinateTree);

      if (coordinatesWithDocs.size > 0) {
        setExpandedCoordinates(coordinatesWithDocs);
      }
    }
  }, [coordinateTree]);

  // Persist expanded coordinates to localStorage
  useEffect(() => {
    localStorage.setItem(TREE_EXPANSION_KEY, JSON.stringify(Array.from(expandedCoordinates)));
  }, [expandedCoordinates]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const authToken = getAuthHeader()?.replace('Bearer ', '') || undefined;

      // Fetch ALL data: coordinate system + documents
      const [bimbaCoordinates, bimbaDocs, pratibimbaDocs] = await Promise.all([
        documentService.getAllBimbaCoordinates(),
        documentService.getBimbaDocuments(authToken),
        documentService.getPratibimbaDocuments(authToken)
      ]);

      setBimbaDocuments(bimbaDocs);

      // Build tree showing FULL coordinate system with documents nested
      const tree = documentService.buildCoordinateTree(bimbaCoordinates, bimbaDocs, pratibimbaDocs);
      setCoordinateTree(tree);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
    // Auto-collapse sidebar to reveal document viewer
    if (!isCollapsed) {
      toggle();
    }
  };

  const handleCoordinateToggle = (coordinate: string) => {
    setExpandedCoordinates(prev => {
      const next = new Set(prev);
      if (next.has(coordinate)) {
        next.delete(coordinate);
      } else {
        next.add(coordinate);
      }
      return next;
    });
  };

  const handleCoordinateSelect = (coordinate: string) => {
    setSelectedCoordinate(coordinate);
  };

  // Get documents for selected coordinate (recursive search)
  const getCoordinateDocuments = () => {
    if (!selectedCoordinate) return { bimba: [], pratibimba: [], coordinateName: '' };

    const findNode = (nodes: CoordinateNode[]): CoordinateNode | null => {
      for (const node of nodes) {
        if (node.coordinate === selectedCoordinate) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const coordinateNode = findNode(coordinateTree);
    const coordinateName = coordinateNode?.name || selectedCoordinate;

    const bimba = coordinateNode?.documents.filter(doc => !isPratibimbaDocument(doc)) as BimbaDocument[] || [];
    const pratibimba = coordinateNode?.documents.filter(doc => isPratibimbaDocument(doc)) as PratibimbaDocument[] || [];

    return { bimba, pratibimba, coordinateName };
  };

  const coordinateDocs = getCoordinateDocuments();

  const handleUploadDocument = async (file: File, bimbaCoordinate: string, title: string) => {
    const authToken = getAuthHeader()?.replace('Bearer ', '') || '';

    try {
      const uploadedDoc = await documentService.uploadDocument(
        file,
        bimbaCoordinate,
        title,
        authToken,
        {
          triggerPipeline: false // Don't auto-ingest - use manual ⚡ button instead
        }
      );

      // Refresh documents list
      await fetchDocuments();

      console.log('Document uploaded successfully:', uploadedDoc);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleSaveDocument = async (updates: { content?: string; writer_notes?: string; development_content?: string }) => {
    if (!selectedDocument) return;

    const authToken = getAuthHeader()?.replace('Bearer ', '') || '';
    const docType = 'sourceBimbaId' in selectedDocument ? 'pratibimba' : 'bimba';

    try {
      const updatedDoc = await documentService.updateDocument(
        selectedDocument._id,
        docType,
        updates,
        authToken
      );

      // Update selected document
      setSelectedDocument(updatedDoc);

      // Refresh documents list
      await fetchDocuments();

      toast.success('Document saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save document');
      throw error;
    }
  };

  const handleAnalyzeDocument = () => {
    // TODO: Trigger Story 08.09 deep analysis pipeline
    console.log('Trigger deep analysis for document:', selectedDocument?._id);
    alert('Deep Analysis feature coming in Story 08.09');
  };

  const handleIngestDocument = async (docId: string) => {
    const authToken = getAuthHeader()?.replace('Bearer ', '') || '';
    setIngestingDocId(docId);

    try {
      const response = await documentService.ingestDocument(docId, authToken);

      if (response.success) {
        toast.success('Document ingestion started successfully');
      } else {
        toast.error(`Ingestion failed: ${response.error || 'Unknown error'}`);
      }

      // Refresh to update status
      await fetchDocuments();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Ingestion failed: ${errorMsg}`);
      console.error('Ingestion failed:', error);
    } finally {
      setIngestingDocId(null);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-gray-950">
      {/* Toast notifications */}
      <Toaster position="top-right" richColors />

      {/* Sidebar with document tree */}
      <Sidebar
        variant="epi-logos"
        isModalExpanded={false}
        className="flex-shrink-0"
      >
        <div className="relative">
          {/* Header */}
          <div className="relative px-4 py-4 border-b border-gray-800/50">
            {/* Epii Icon - Absolute positioned, centered, overlays content with no layout impact */}
            <div className="absolute -top-24.5 left-1/2 -translate-x-1/2 z-30">
              <Link href="/epii?expand=1" className="group block">
                <Image
                  src="/ui-system/epii-icon.png"
                  alt="Epii"
                  width={155}
                  height={155}
                  className="opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                />
              </Link>
            </div>

            {/* Page Title and Coordinate - natural position, icon overlays on top */}
            <h2 className="text-lg font-semibold text-gray-100 mb-1">
              Archive
            </h2>
            <button
              onClick={fetchDocuments}
              className={cn(
                "text-xs text-gray-500 font-mono hover:text-blue-400 transition-colors",
                "flex items-center gap-1 group"
              )}
              title="Click to refresh document tree"
            >
              #5-0
              <svg
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Document tree title */}
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Document Library
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {bimbaDocuments.length} {bimbaDocuments.length === 1 ? 'document' : 'documents'}
            </p>
          </div>

          {/* Document tree - natural flow, Sidebar handles scroll, right margin for panel */}
          <div className="px-4 py-4 pb-24 mr-[370px]">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-sm">
                Loading documents...
              </div>
            ) : coordinateTree.length === 0 ? (
              <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-sm text-center">
                No documents found.
                {isAdmin && (
                  <div className="mt-2 text-xs">
                    Click "Upload Document" to add documents.
                  </div>
                )}
              </div>
            ) : (
              <DocumentTree
                tree={coordinateTree}
                selectedDocumentId={selectedDocument?._id || null}
                expandedCoordinates={expandedCoordinates}
                onDocumentSelect={handleDocumentSelect}
                onCoordinateToggle={handleCoordinateToggle}
                onCoordinateSelect={handleCoordinateSelect}
                filter={treeFilter}
              />
            )}
          </div>

          {/* Document listing panel wrapper - contains panel + controls */}
          <div className="fixed top-[170px] right-4 w-[360px] z-40">
            {/* Document listing panel - scrollable */}
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto border border-gray-700 rounded">
              {/* Header */}
              <div className="px-3 py-2 border-b border-gray-700">
                <div className="text-[10px] font-mono text-gray-500">
                  {selectedCoordinate || 'No coordinate selected'}
                </div>
                <div className="text-xs font-semibold text-gray-300 mt-0.5">
                  {coordinateDocs.coordinateName || 'Select a coordinate'}
                </div>
              </div>

              {/* Bimba Documents */}
              <div className="px-3 py-2 border-b border-gray-700">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Bimba Documents ({coordinateDocs.bimba.length})
              </h4>
              {coordinateDocs.bimba.length === 0 ? (
                <p className="text-[10px] text-gray-600 italic">No documents</p>
              ) : (
                <div className="space-y-0.5">
                  {coordinateDocs.bimba.map(doc => (
                    <div key={doc._id} className="flex items-center gap-1">
                      <button
                        onClick={() => handleDocumentSelect(doc)}
                        className={cn(
                          "flex-1 text-left px-2 py-1 text-[11px] transition-colors cursor-pointer",
                          selectedDocument?._id === doc._id
                            ? "text-blue-400 font-semibold"
                            : "text-gray-400 hover:text-blue-300 hover:underline"
                        )}
                      >
                        <div className="truncate">{doc.title || doc.filename}</div>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIngestDocument(doc._id);
                          }}
                          disabled={ingestingDocId === doc._id}
                          className={cn(
                            "px-1 py-0.5 text-[9px] rounded",
                            "border border-gray-700 transition-colors",
                            ingestingDocId === doc._id
                              ? "text-gray-700 border-gray-800 cursor-wait"
                              : "text-gray-600 hover:text-blue-400 hover:border-blue-500"
                          )}
                          title="Trigger LightRAG ingestion"
                        >
                          {ingestingDocId === doc._id ? '⏳' : '⚡'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pratibimba Documents */}
            <div className="px-3 py-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Pratibimba Documents ({coordinateDocs.pratibimba.length})
              </h4>
              {coordinateDocs.pratibimba.length === 0 ? (
                <p className="text-[10px] text-gray-600 italic">No analysis documents</p>
              ) : (
                <div className="space-y-0.5">
                  {coordinateDocs.pratibimba.map(doc => (
                    <button
                      key={doc._id}
                      onClick={() => handleDocumentSelect(doc)}
                      className={cn(
                        "w-full text-left px-2 py-1 text-[11px] transition-colors cursor-pointer",
                        selectedDocument?._id === doc._id
                          ? "text-purple-400 font-semibold"
                          : "text-gray-400 hover:text-purple-300 hover:underline"
                      )}
                    >
                      <div className="truncate">{doc.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Controls positioned below panel - flows with panel */}
            <div className="flex items-center justify-end gap-2 mt-2">
            {/* Filter input */}
            <input
              type="text"
              placeholder="Filter..."
              value={treeFilter}
              onChange={(e) => setTreeFilter(e.target.value)}
              className={cn(
                "flex-1 px-2 py-1 text-xs rounded",
                "bg-transparent border border-gray-700",
                "text-gray-800 placeholder-gray-600",
                "focus:outline-none focus:ring-1 focus:ring-gray-600"
              )}
            />

            {/* Upload button */}
            {isAdmin && (
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className={cn(
                  "px-2 py-1 text-xs rounded whitespace-nowrap",
                  "bg-transparent border border-gray-700 text-gray-800 hover:bg-gray-100",
                  "flex items-center gap-1 transition-colors"
                )}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload
              </button>
            )}
            </div>
          </div>
        </div>
      </Sidebar>

      {/* Main content area with document viewer */}
      <div className="flex-1">
        <DocumentViewer
          document={selectedDocument}
          isAdmin={isAdmin}
          isSidebarCollapsed={isCollapsed}
          onSave={handleSaveDocument}
          onAnalyze={handleAnalyzeDocument}
          onRetryIngestion={handleIngestDocument}
          className="h-full"
        />
      </div>

      {/* Upload dialog */}
      {isAdmin && (
        <DocumentUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onUpload={handleUploadDocument}
        />
      )}
    </div>
  );
}
