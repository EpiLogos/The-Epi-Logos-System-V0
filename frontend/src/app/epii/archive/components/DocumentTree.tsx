/**
 * DocumentTree Component
 * Recursive coordinate tree displaying documents from MongoDB collections
 * Integrates with Sidebar component for Epi-Logos styling
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { CoordinateNode, Document, BimbaDocument } from '@/services/document.service';
import { isPratibimbaDocument } from '@/services/document.service';

interface DocumentTreeProps {
  tree: CoordinateNode[];
  selectedDocumentId: string | null;
  expandedCoordinates: Set<string>;
  onDocumentSelect: (doc: Document) => void;
  onCoordinateToggle: (coordinate: string) => void;
  onCoordinateSelect?: (coordinate: string) => void;
  filter?: string;
  className?: string;
}

export const DocumentTree: React.FC<DocumentTreeProps> = ({
  tree,
  selectedDocumentId,
  expandedCoordinates,
  onDocumentSelect,
  onCoordinateToggle,
  onCoordinateSelect,
  filter = '',
  className
}) => {
  // Filter tree nodes based on search term
  const filterNode = (node: CoordinateNode): boolean => {
    if (!filter) return true;

    const searchLower = filter.toLowerCase();

    // Match coordinate or name
    if (node.coordinate.toLowerCase().includes(searchLower) ||
        node.name.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Match document titles or filenames
    if (node.documents.some(doc => {
      const title = 'title' in doc ? doc.title : doc.filename;
      return title?.toLowerCase().includes(searchLower);
    })) {
      return true;
    }

    // Match children recursively
    return node.children.some(child => filterNode(child));
  };

  const filteredTree = filter ? tree.filter(filterNode) : tree;

  return (
    <div className={cn("w-full space-y-0.5", className)}>
      {filteredTree.length === 0 && filter ? (
        <div className="text-center text-gray-500 text-sm py-8">
          No coordinates match "{filter}"
        </div>
      ) : (
        filteredTree.map(node => (
          <CoordinateTreeNode
            key={node.coordinate}
            node={node}
            level={0}
            selectedDocumentId={selectedDocumentId}
            expandedCoordinates={expandedCoordinates}
            onDocumentSelect={onDocumentSelect}
            onCoordinateToggle={onCoordinateToggle}
            onCoordinateSelect={onCoordinateSelect}
            filter={filter}
          />
        ))
      )}
    </div>
  );
};

interface CoordinateTreeNodeProps {
  node: CoordinateNode;
  level: number;
  selectedDocumentId: string | null;
  expandedCoordinates: Set<string>;
  onDocumentSelect: (doc: Document) => void;
  onCoordinateToggle: (coordinate: string) => void;
  onCoordinateSelect?: (coordinate: string) => void;
  filter?: string;
}

const CoordinateTreeNode: React.FC<CoordinateTreeNodeProps> = ({
  node,
  level,
  selectedDocumentId,
  expandedCoordinates,
  onDocumentSelect,
  onCoordinateToggle,
  onCoordinateSelect,
  filter = ''
}) => {
  const isExpanded = expandedCoordinates.has(node.coordinate);

  const handleToggle = () => {
    onCoordinateToggle(node.coordinate);
  };

  const handleCoordinateClick = (e: React.MouseEvent) => {
    if (onCoordinateSelect) {
      e.stopPropagation();
      onCoordinateSelect(node.coordinate);
    }
  };

  // Filter logic (same as top-level)
  const filterNode = (childNode: CoordinateNode): boolean => {
    if (!filter) return true;

    const searchLower = filter.toLowerCase();

    // Match coordinate or name
    if (childNode.coordinate.toLowerCase().includes(searchLower) ||
        childNode.name.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Match document titles or filenames
    if (childNode.documents.some(doc => {
      const title = 'title' in doc ? doc.title : doc.filename;
      return title?.toLowerCase().includes(searchLower);
    })) {
      return true;
    }

    // Match children recursively
    return childNode.children.some(child => filterNode(child));
  };

  const filteredChildren = filter ? node.children.filter(filterNode) : node.children;
  const hasChildren = filteredChildren.length > 0 || node.documents.length > 0;
  const indentLevel = level * 12; // 12px per level (reduced for deeper nesting)

  return (
    <div className="w-full relative">
      {/* Visual depth indicator - connecting line */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gray-800/50"
          style={{ left: `${indentLevel - 6}px` }}
        />
      )}

      {/* Coordinate header */}
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors rounded relative",
          "hover:bg-gray-100/5",
          isExpanded && "bg-gray-100/3"
        )}
        style={{ paddingLeft: `${indentLevel + 8}px` }}
        onClick={handleToggle}
      >
        {/* Expand/collapse icon */}
        {hasChildren && (
          <span className={cn(
            "text-xs text-gray-400 transition-transform duration-150",
            isExpanded && "rotate-90"
          )}>
            ▸
          </span>
        )}
        {!hasChildren && <span className="w-3" />}

        {/* Coordinate label + name - name is clickable */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-gray-500 flex-shrink-0">
            {node.coordinate}
          </span>
          <span
            className={cn(
              "text-sm truncate hover:text-blue-400 transition-colors cursor-pointer",
              node.documents.length > 0 ? "text-gray-600 font-medium" : "text-gray-400"
            )}
            onClick={handleCoordinateClick}
          >
            {node.name}
          </span>
        </div>

        {/* Document count badge - simple box with border */}
        {node.documents.length > 0 && (
          <span className="text-[10px] font-mono text-gray-600 border border-gray-700 px-1.5 py-0.5 ml-auto flex-shrink-0">
            {node.documents.length}
          </span>
        )}

      </div>

      {/* Expanded content - ONLY child coordinates, documents shown in floating panel */}
      {isExpanded && filteredChildren.length > 0 && (
        <div className="space-y-0.5">
          {/* Child coordinates */}
          {filteredChildren.map(childNode => (
            <CoordinateTreeNode
              key={childNode.coordinate}
              node={childNode}
              level={level + 1}
              selectedDocumentId={selectedDocumentId}
              expandedCoordinates={expandedCoordinates}
              onDocumentSelect={onDocumentSelect}
              onCoordinateToggle={onCoordinateToggle}
              onCoordinateSelect={onCoordinateSelect}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DocumentItemProps {
  document: Document;
  level: number;
  isSelected: boolean;
  onSelect: (doc: Document) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  level,
  isSelected,
  onSelect
}) => {
  const indentLevel = level * 16;
  const isPratibimba = isPratibimbaDocument(document);

  const getDocumentIcon = () => {
    if (isPratibimba) return '🔮'; // Pratibimba analysis document

    const bimbaDoc = document as BimbaDocument;
    switch (bimbaDoc.fileType) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'md': return '📋';
      default: return '📄';
    }
  };

  const getStatusColor = () => {
    if (isPratibimba) return 'text-purple-400';

    const bimbaDoc = document as BimbaDocument;
    switch (bimbaDoc.processingStatus) {
      case 'complete': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'pending': return 'text-gray-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors rounded group",
        "hover:bg-gray-100/5",
        isSelected ? "bg-gray-100/10 border-l-2 border-blue-500" : ""
      )}
      style={{ paddingLeft: `${indentLevel + 8}px` }}
      onClick={() => onSelect(document)}
    >
      {/* Document icon */}
      <span className="text-xs">{getDocumentIcon()}</span>

      {/* Document title */}
      <span className={cn(
        "text-sm flex-1 truncate",
        isSelected ? "text-gray-100 font-medium" : "text-gray-300",
        getStatusColor()
      )}>
        {document.title}
      </span>

      {/* Processing status indicator (minimal) */}
      {!isPratibimba && (document as BimbaDocument).processingStatus === 'processing' && (
        <span className="text-[10px] text-yellow-400 animate-pulse">●</span>
      )}

      {/* Document type badge */}
      {isPratibimba && (
        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded uppercase">
          Analysis
        </span>
      )}
    </div>
  );
};
