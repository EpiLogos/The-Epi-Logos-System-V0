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

/**
 * MEF Lens Insight structure
 * Contains lens-specific analysis from MEF (Meta-Epistemic Framework)
 */
export interface MEFLensInsight {
  lens_name?: string;
  analysis?: string;
  key_patterns?: string[];
  resonance_factors?: string[];
  [key: string]: any; // Allow additional lens-specific properties
}

/**
 * MEF Lens Types - 6-fold cognitive framework
 */
export type MEFLensType =
  | "archetypal"
  | "causal"
  | "logical"
  | "processual"
  | "meta_epistemic"
  | "divine_scalar";

/**
 * Bimba Resonance - MEF-analyzed coordinate connection
 *
 * Story 08.13: Complete structure for MEF Resonance Analysis
 * Represents a discovered resonance between an etymology community
 * and a Bimba coordinate, analyzed through the 6-lens MEF framework.
 */
export interface BimbaResonance {
  // Core Identity
  id: string; // UUID of the BimbaResonance node
  coordinate: string; // Bimba coordinate (e.g., "#2-1-0")
  coordinate_name: string; // Human-readable name of the coordinate

  // Resonance Properties
  resonance_type: "semantic" | "structural" | "hybrid";
  resonance_strength: number; // 0.0-1.0 float
  description?: string; // High-level description of the resonance

  // MEF Analysis Metadata
  detected_via_lens: MEFLensType; // Primary MEF lens that detected this resonance
  detected_via_tool: string; // Tool used (semantic_coordinate_discovery, get_direct_children, get_node_relationships)
  reasoning_summary: string; // User-friendly summary of why this resonance was detected
  deepseek_reasoning: string; // DeepSeek reasoning chain (for transparency)
  detected_at: string; // ISO timestamp

  // MEF Lens-Specific Insights (JSON objects)
  mef_archetypal?: MEFLensInsight | any; // Archetypal lens analysis
  mef_causal?: MEFLensInsight | any; // Causal lens analysis
  mef_logical?: MEFLensInsight | any; // Logical lens analysis
  mef_processual?: MEFLensInsight | any; // Processual lens analysis
  mef_meta_epistemic?: MEFLensInsight | any; // Meta-epistemic lens analysis
  mef_divine_scalar?: MEFLensInsight | any; // Divine-scalar lens analysis
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

  // MEF Resonance Analysis (Story 08.13)
  bimba_resonances?: BimbaResonance[]; // Array of discovered Bimba coordinate resonances
  mef_analyzed_at?: string; // ISO timestamp of last MEF analysis
  mef_reasoning_summary?: string; // Overall reasoning summary for the analysis
  mef_resonance_count?: number; // Total number of resonances found

  // Word-level enrichment metadata
  word_nodes?: EtymologyCommunityWord[];
}

export interface EtymologyCommunityWord {
  id?: string | null;
  word: string;
  pie_root?: string | null;
  pie_lineage?: string | null;
  lineage?: string | null;
  semantic_pattern?: string | null;
  relation_descriptor?: string | null;
  ql_position?: number | null;
  enriched_at?: string | null;
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
