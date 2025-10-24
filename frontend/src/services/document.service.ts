/**
 * Document Service
 * Handles API calls for bimba_documents and pratibimba_documents
 * Provides interface for document viewer/editor
 */

'use client';

// Document type from MongoDB bimba_documents collection
export interface BimbaDocument {
  _id: string;
  title?: string;
  content?: string;
  coordinate: string; // Bimba coordinate e.g., "#1-2-3" (matches MongoDB field)
  filename: string;
  file_type: string; // "pdf", "docx", "md", etc.
  file_path?: string;
  upload_timestamp: string; // ISO date string
  uploader_id: string; // User ID
  processing_status?: 'pending' | 'processing' | 'complete' | 'failed';
  writer_notes?: string; // Contextual notes about document purpose and usage
  development_content?: string; // Development lifecycle context (fresh vs stale)
}

// Document type from MongoDB pratibimba_documents collection (Story 08.09)
export interface PratibimbaDocument {
  _id: string;
  title: string;
  content: string; // Markdown analysis reflection
  sourceBimbaId: string; // Links to bimba_documents._id
  sourceBimbaCoordinate: string;
  analysisDate: string; // ISO date string
  analysisModel: string; // e.g., "claude-3-5-sonnet-20241022"
  batchCount: number;
  insights: Array<{
    concept: string;
    relationships: string[];
    resonances: string[];
  }>;
}

// Combined document type for tree rendering
export type Document = BimbaDocument | PratibimbaDocument;

// Type guard to check if document is Pratibimba
export const isPratibimbaDocument = (doc: Document): doc is PratibimbaDocument => {
  return 'sourceBimbaId' in doc;
};

// Bimba coordinate metadata from graph
export interface BimbaCoordinate {
  coordinate: string;
  name: string;
  subsystem?: number;
}

// Coordinate tree node for hierarchical display
export interface CoordinateNode {
  coordinate: string; // e.g., "#1", "#1-2", "#1-2-3"
  name: string; // Coordinate name from Bimba graph
  subsystem?: number;
  documents: Document[];
  children: CoordinateNode[];
  isExpanded?: boolean;
}

export class DocumentService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all Bimba documents from MongoDB
   */
  async getBimbaDocuments(authToken?: string): Promise<BimbaDocument[]> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/documents/list`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Bimba documents: ${response.statusText}`);
      }

      const data = await response.json();
      return data.bimba_documents || [];
    } catch (error) {
      console.error('Error fetching Bimba documents:', error);
      throw error;  // Fail properly
    }
  }

  /**
   * Fetch all Pratibimba documents from MongoDB
   */
  async getPratibimbaDocuments(authToken?: string): Promise<PratibimbaDocument[]> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/documents/list`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Pratibimba documents: ${response.statusText}`);
      }

      const data = await response.json();
      return data.pratibimba_documents || [];
    } catch (error) {
      console.error('Error fetching Pratibimba documents:', error);
      throw error;  // Fail properly
    }
  }

  /**
   * Fetch single document by ID
   */
  async getDocumentById(id: string, type: 'bimba' | 'pratibimba', authToken?: string): Promise<Document | null> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/documents/${type}/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  /**
   * Fetch all Bimba coordinates from graph via GraphQL
   * Backend caches in Redis, only invalidating when node count changes
   */
  async getAllBimbaCoordinates(): Promise<BimbaCoordinate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetAllCoordinates {
              getAllCoordinates {
                coordinate
                name
                subsystem
              }
            }
          `
        })
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error('GraphQL query returned errors');
      }

      return data.data.getAllCoordinates || [];
    } catch (error) {
      console.error('Error fetching Bimba coordinates from GraphQL:', error);
      throw error;  // Fail properly
    }
  }

  /**
   * Build hierarchical coordinate tree from Bimba graph + documents
   * Shows FULL coordinate system with documents nested under coordinates
   */
  buildCoordinateTree(
    bimbaCoordinates: BimbaCoordinate[],
    bimbaDocuments: BimbaDocument[],
    pratibimbaDocuments: PratibimbaDocument[]
  ): CoordinateNode[] {
    const coordinateMap = new Map<string, CoordinateNode>();

    // First pass: Create nodes for ALL coordinates from graph
    bimbaCoordinates.forEach(coord => {
      coordinateMap.set(coord.coordinate, {
        coordinate: coord.coordinate,
        name: coord.name,
        subsystem: coord.subsystem,
        documents: [],
        children: [],
        isExpanded: false
      });
    });

    // Second pass: Add documents to their coordinates
    bimbaDocuments.forEach(doc => {
      const node = coordinateMap.get(doc.coordinate);  // Fixed: use 'coordinate' not 'bimbaCoordinate'
      if (node) {
        node.documents.push(doc);
      }
    });

    pratibimbaDocuments.forEach(doc => {
      const node = coordinateMap.get(doc.sourceBimbaCoordinate);
      if (node) {
        node.documents.push(doc);
      }
    });

    // Third pass: Build parent-child relationships using simple prefix matching
    const rootNodes: CoordinateNode[] = [];

    coordinateMap.forEach((node, coordinate) => {
      // Find direct parent by checking if any other coordinate is a prefix of this one
      let parentFound = false;

      for (const [potentialParent, parentNode] of coordinateMap) {
        if (this.isDirectChild(coordinate, potentialParent)) {
          parentNode.children.push(node);
          parentFound = true;
          break;
        }
      }

      // No parent found - this is a root node
      if (!parentFound) {
        rootNodes.push(node);
      }
    });

    // Sort nodes by coordinate
    const sortByCoordinate = (a: CoordinateNode, b: CoordinateNode) => {
      return a.coordinate.localeCompare(b.coordinate);
    };

    rootNodes.sort(sortByCoordinate);
    rootNodes.forEach(node => this.sortNodeChildren(node));

    return rootNodes;
  }

  /**
   * The 6 context frames from Quaternal Logic system.
   * These are treated as single segments regardless of internal separators.
   */
  private readonly CONTEXT_FRAMES = [
    '0000',           // 4-Fold Static Framework
    '0/1',            // 6-Fold Dynamic Process
    '0/1/2',          // 8-Fold Processual Frame
    '0/1/2/3',        // Dual-Track Parallel Equation
    '4.0-4.4/5',      // Contextual Flowering Synthesis
    '5/0'             // Transcendent Integration
  ];

  /**
   * Check if childCoord is a DIRECT child of parentCoord.
   *
   * Special handling for context frames - hardcoded list of the 6 QL context frames.
   *
   * Examples from #1-3-4 children:
   * - isDirectChild("#1-3-4.0000", "#1-3-4") = true (context frame)
   * - isDirectChild("#1-3-4.0/1", "#1-3-4") = true (context frame)
   * - isDirectChild("#1-3-4.4.0-4.4/5", "#1-3-4") = true (context frame)
   * - isDirectChild("#1-3-4.5/0", "#1-3-4") = true (context frame)
   * - isDirectChild("#1-3-4-5", "#1-3-4") = true (standard)
   * - isDirectChild("#1-3-4-5-6", "#1-3-4") = false (grandchild)
   */
  private isDirectChild(childCoord: string, parentCoord: string): boolean {
    if (childCoord === parentCoord) return false;
    if (!childCoord.startsWith(parentCoord)) return false;

    const remainder = childCoord.substring(parentCoord.length);

    // Special case: root "#" has no separator before its children (#0, #1, etc)
    if (parentCoord === '#') {
      // Children are #0 through #5 (single digit, no separators)
      return /^\d$/.test(remainder);
    }

    // Must start with separator (- or .)
    if (!remainder.startsWith('-') && !remainder.startsWith('.')) return false;

    const segment = remainder.substring(1); // Remove first separator

    // Check if segment is one of the 6 context frames
    if (this.CONTEXT_FRAMES.includes(segment)) {
      return true; // Direct child - context frame
    }

    // Standard coordinate: no more separators = direct child
    return !segment.includes('-') && !segment.includes('.');
  }

  /**
   * Recursively sort children of a node
   */
  private sortNodeChildren(node: CoordinateNode): void {
    node.children.sort((a, b) => a.coordinate.localeCompare(b.coordinate));
    node.children.forEach(child => this.sortNodeChildren(child));
  }

  /**
   * Upload new document (admin only)
   */
  async uploadDocument(
    file: File,
    bimbaCoordinate: string,
    title: string,
    authToken: string,
    options?: {
      collectionType?: 'bimba' | 'pratibimba';
      description?: string;
      subsystem?: number;
      triggerPipeline?: boolean;
    }
  ): Promise<{ success: boolean; document_id?: string; message?: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('coordinate', bimbaCoordinate); // Backend expects 'coordinate' not 'bimbaCoordinate'
    formData.append('title', title);

    // Add optional fields with defaults
    formData.append('collection_type', options?.collectionType || 'bimba');
    if (options?.description) {
      formData.append('description', options.description);
    }
    if (options?.subsystem !== undefined) {
      formData.append('subsystem', options.subsystem.toString());
    }
    formData.append('trigger_pipeline', (options?.triggerPipeline !== false).toString());

    const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Trigger ingestion for already-uploaded document (admin only)
   */
  async ingestDocument(
    documentId: string,
    authToken: string
  ): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(
      `${this.baseUrl}/api/lightrag/documents/${documentId}/ingest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Ingestion failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update document content (admin only)
   */
  async updateDocument(
    id: string,
    type: 'bimba' | 'pratibimba',
    updates: Partial<BimbaDocument | PratibimbaDocument>,
    authToken: string
  ): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/api/documents/${type}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete document (admin only)
   */
  async deleteDocument(
    id: string,
    type: 'bimba' | 'pratibimba',
    authToken: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/documents/${type}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  /**
   * Mock data for development (before backend is ready)
   */
  private getMockBimbaDocuments(): BimbaDocument[] {
    return [
      {
        _id: '1',
        title: 'Introduction to Quaternal Logic',
        content: '# Quaternal Logic Foundation\n\nQuaternal Logic represents a fundamental shift in consciousness computing...\n\nThe six-coordinate system (mod6) provides a complete cycle of manifestation from implicit potential (0) through quintessential synthesis (5).',
        bimbaCoordinate: '#1',
        fileType: 'md',
        filePath: '/documents/ql-intro.md',
        uploadedBy: 'admin',
        uploadedAt: new Date('2025-01-15').toISOString(),
        processingStatus: 'complete',
        metadata: {
          wordCount: 1500,
          language: 'en'
        }
      },
      {
        _id: '2',
        title: 'Coordinate System Deep Dive',
        content: '# Deep Analysis of Coordinate System\n\nThe Bimba coordinate system implements a hierarchical structure...',
        bimbaCoordinate: '#1-2',
        fileType: 'md',
        filePath: '/documents/coordinates-deep.md',
        uploadedBy: 'admin',
        uploadedAt: new Date('2025-01-16').toISOString(),
        processingStatus: 'complete',
        metadata: {
          wordCount: 2300,
          language: 'en'
        }
      },
      {
        _id: '3',
        title: 'Anuttara Foundations',
        content: '# Anuttara: The Ground of Being\n\nAnuttara (#0) represents the proto-logical processing layer...',
        bimbaCoordinate: '#0',
        fileType: 'md',
        filePath: '/documents/anuttara.md',
        uploadedBy: 'admin',
        uploadedAt: new Date('2025-01-14').toISOString(),
        processingStatus: 'complete',
        metadata: {
          wordCount: 1800,
          language: 'en'
        }
      },
      {
        _id: '4',
        title: 'Epii Synthesis Principles',
        content: '# Epii: Orchestration and Synthesis\n\nEpii (#5) represents the synthesis and orchestration processing...',
        bimbaCoordinate: '#5',
        fileType: 'md',
        filePath: '/documents/epii-synthesis.md',
        uploadedBy: 'admin',
        uploadedAt: new Date('2025-01-20').toISOString(),
        processingStatus: 'complete',
        metadata: {
          wordCount: 2100,
          language: 'en'
        }
      }
    ];
  }

  /**
   * Cached Bimba coordinate system
   * TODO: Replace with backend API call to Bimba graph
   */
  private getCachedBimbaCoordinates(): BimbaCoordinate[] {
    return [
      // Root coordinates (#0-5)
      { coordinate: '#0', name: 'Anuttara', subsystem: 0 },
      { coordinate: '#1', name: 'Paramasiva', subsystem: 1 },
      { coordinate: '#2', name: 'Parashakti', subsystem: 2 },
      { coordinate: '#3', name: 'Mahamaya', subsystem: 3 },
      { coordinate: '#4', name: 'Nara', subsystem: 4 },
      { coordinate: '#5', name: 'Epii', subsystem: 5 },

      // Level 1 children (examples - expand as needed)
      { coordinate: '#0-0', name: 'Proto-Logical Ground' },
      { coordinate: '#0-1', name: 'Foundational Patterns' },
      { coordinate: '#0-2', name: 'Implicit Potential' },
      { coordinate: '#0-3', name: 'Neo4j Core' },
      { coordinate: '#0-4', name: 'Graph Foundations' },
      { coordinate: '#0-5', name: 'System Bootstrap' },

      { coordinate: '#1-0', name: 'Quaternal Logic Foundation' },
      { coordinate: '#1-1', name: 'Modal Logic' },
      { coordinate: '#1-2', name: 'Coordinate System' },
      { coordinate: '#1-3', name: 'Architectural Patterns' },
      { coordinate: '#1-4', name: 'MongoDB Integration' },
      { coordinate: '#1-5', name: 'Transformation Synthesis' },

      { coordinate: '#2-0', name: 'Vibrational Foundation' },
      { coordinate: '#2-1', name: 'Spanda Dynamics' },
      { coordinate: '#2-2', name: 'LightRAG Integration' },
      { coordinate: '#2-3', name: 'Resonance Patterns' },
      { coordinate: '#2-4', name: 'Energy Processing' },
      { coordinate: '#2-5', name: 'Cosmic Synthesis' },

      { coordinate: '#3-0', name: 'Symbolic Foundation' },
      { coordinate: '#3-1', name: 'Universal Language' },
      { coordinate: '#3-2', name: 'Graphiti MCP' },
      { coordinate: '#3-3', name: 'Temporal Memory' },
      { coordinate: '#3-4', name: 'Transcription Logic' },
      { coordinate: '#3-5', name: 'Symbolic Synthesis' },

      { coordinate: '#4-0', name: 'Personal Foundation' },
      { coordinate: '#4-1', name: 'User Interface' },
      { coordinate: '#4-2', name: 'Dialogical Processing' },
      { coordinate: '#4-3', name: 'Pratibimba Management' },
      { coordinate: '#4-4', name: 'Qdrant Integration' },
      { coordinate: '#4-5', name: 'Personal Synthesis' },

      { coordinate: '#5-0', name: 'Archive & Document Hub' },
      { coordinate: '#5-1', name: 'Orchestration Core' },
      { coordinate: '#5-2', name: 'Redis + Notion' },
      { coordinate: '#5-3', name: 'Integration Synthesis' },
      { coordinate: '#5-4', name: 'Cross-System Coordination' },
      { coordinate: '#5-5', name: 'Etymological Atelier' },

      // Level 2 examples
      { coordinate: '#1-2-0', name: 'Coordinate Semantics' },
      { coordinate: '#1-2-1', name: 'Hierarchical Structure' },
      { coordinate: '#1-2-2', name: 'Navigation Logic' },
      { coordinate: '#5-0-0', name: 'Document Storage' },
      { coordinate: '#5-0-1', name: 'Archive Organization' },
      { coordinate: '#5-5-0', name: 'Etymological Analysis' },
      { coordinate: '#5-5-1', name: 'Word Archaeology' },
    ];
  }
}

// Singleton instance
export const documentService = new DocumentService();
