/**
 * Etymology Tree Force Graph Types
 *
 * Data structures for force-graph visualization.
 * Based on: https://vasturiano.github.io/force-graph/example/tree/
 *
 * Story 08.10 - D3.js Force-Directed Graph Visualizations
 */

export type TreeNodeType = 'root' | 'word' | 'session-root';

export type TreeNodeClassification =
  | 'pie-root'
  | 'community-root'
  | 'session-root'
  | 'direct-descendant'
  | 'semantic-alliance'
  | 'pie-adjacent'
  | 'non-pie';

/**
 * Tree node format (matches force-graph example)
 */
export interface TreeNode {
  path: string;      // Full hierarchical path (e.g., "pie_root/word/cognate")
  leaf: string;      // Display name (just the word)
  module: string;    // Color grouping (typically community id)
  level: number;     // Tree depth (0 = root, 1 = direct descendant, etc.)
  size: number;      // Node size (100 for roots, decreases with depth)
  nodeType: TreeNodeType;
  classification: TreeNodeClassification;
  communityId?: string;
  communityName?: string;
  pieRoot?: string | null;
  word?: string;
  lineage?: string | null;
  pieLineage?: string | null;
  relationDescriptor?: string | null;
  semanticPattern?: string | null;
  qlPosition?: number | null;
  enrichedAt?: string | null;
  communityIds?: string[];
}

/**
 * Tree link format
 */
export interface TreeLink {
  source: string;    // Source node path
  target: string;    // Target node path
  targetNode?: TreeNode;  // Optional reference to target node object
  relationship?: 'direct' | 'alliance' | 'unknown';
  communityId?: string;
}

/**
 * Complete tree graph data
 */
export interface TreeGraphData {
  nodes: TreeNode[];
  links: TreeLink[];
}
