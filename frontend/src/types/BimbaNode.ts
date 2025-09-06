/**
 * Core Bimba Node type definitions
 * 
 * Implements the discriminated union pattern for different node types
 * while maintaining the universal contract for all nodes.
 */

// Universal contract for ANY node in the Bimba Map
export interface BimbaNode {
  coordinate: string;
  name: string;
  subsystem: number;
  nodeType: 'TarotCard' | 'Hexagram' | 'Codon' | 'Generic';
  uuid?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Specific node types with semantic richness
export interface TarotCardNode extends BimbaNode {
  nodeType: 'TarotCard';
  suit?: 'Major' | 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  number?: number;
  archetype: string;
  keywords?: string[];
  meaning?: {
    upright: string;
    reversed: string;
  };
}

export interface HexagramNode extends BimbaNode {
  nodeType: 'Hexagram';
  judgement: string;
  imageText: string;
  lines?: {
    position: number;
    text: string;
    changing?: boolean;
  }[];
}

export interface CodonNode extends BimbaNode {
  nodeType: 'Codon';
  sequence: string;
  aminoAcid: string;
  geneKey?: number;
  shadow?: string;
  gift?: string;
  siddhi?: string;
}

export interface GenericNode extends BimbaNode {
  nodeType: 'Generic';
  category?: string;
  properties?: Record<string, any>;
}

// Discriminated union representing any possible BimbaNode
export type AnyBimbaNode = TarotCardNode | HexagramNode | CodonNode | GenericNode;

// Relationship types between nodes
export interface BimbaRelationship {
  id: string;
  fromCoordinate: string;
  toCoordinate: string;
  relationshipType: string;
  strength?: number;
  properties?: Record<string, any>;
  createdAt?: string;
}

// Graph query result types
export interface BimbaGraphResult {
  nodes: AnyBimbaNode[];
  relationships: BimbaRelationship[];
  metadata?: {
    totalNodes: number;
    totalRelationships: number;
    queryTime: number;
  };
}
