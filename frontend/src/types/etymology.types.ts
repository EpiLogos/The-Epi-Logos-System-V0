/**
 * Etymology Archaeology Type Definitions
 *
 * TypeScript types for Etymology Session data structures
 * Matches backend models from graphiti/models.py
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

export enum EtymologySessionStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ARCHIVED = "archived"
}

export enum QuaternalType {
  TWO_PART = "two_part",
  THREE_PART = "three_part",
  FOUR_PART = "four_part",
  FIVE_PART = "five_part",
  SIX_PART = "six_part",
  SEVEN_PART = "seven_part",
  EIGHT_PART = "eight_part",
  NINE_PART = "nine_part",
  TEN_PART = "ten_part",
  ELEVEN_PART = "eleven_part",
  TWELVE_PART = "twelve_part"
}

export interface BimbaResonance {
  coordinate: string;
  name: string;
  resonance_strength: float;
  resonance_type: "semantic" | "structural" | "hybrid";
  detected_at: string; // ISO timestamp
  description?: string;
}

export interface EtymologySession {
  session_id: string;
  user_id: string;
  title: string;
  description?: string;
  thread_ids: string[];
  words_explored: string[];
  communities_created: string[];
  resonances_found: BimbaResonance[];
  aphorisms: string[];
  pie_roots_discovered: string[];
  semantic_patterns: string[];
  status: EtymologySessionStatus;
  coordinate_context: string; // Default: "#5-5"
  created_at: string; // ISO timestamp
  last_activity: string; // ISO timestamp
  metadata: Record<string, any>;
}

export interface EtymologyCommunity {
  id: string;
  group_id: string;
  name: string;
  description: string;
  quaternal_type: QuaternalType;
  words: string[];
  pie_root?: string;
  semantic_pattern?: string;
  session_id?: string;
  user_id?: string;
  bimba_coordinate?: string;
  domain: string; // "EA" for Etymology Archaeology
  formed_at: string; // ISO timestamp
  last_activity: string; // ISO timestamp
}

export interface QLStructure {
  community_id: string;
  pattern_type: QuaternalType;
  positions: QLPosition[];
  completion: number; // 0-1
  is_complete: boolean;
}

export interface QLPosition {
  position: number; // 0-based
  content: string;
  position_name: string;
  filled: boolean;
}

export interface EtymologyTree {
  root_word: string;
  pie_root?: string;
  nodes: EtymologyTreeNode[];
  edges: EtymologyTreeEdge[];
}

export interface EtymologyTreeNode {
  id: string;
  word: string;
  node_type: "pie_root" | "cognate" | "modern";
  language?: string;
  definition?: string;
}

export interface EtymologyTreeEdge {
  source: string; // node id
  target: string; // node id
  relationship: "derives_from" | "cognate_of" | "evolved_to";
}

export interface SessionUpdateNotification {
  type: "community" | "resonance" | "tree" | "aphorism";
  count: number;
  message: string;
  timestamp: string;
}
