import type { TreeNodeClassification } from './types';

export interface ClassificationVisualMeta {
  label: string;
  fill: string;
  stroke: string;
  text: string;
  glow?: string;
  legendDescription: string;
}

export const CLASSIFICATION_META: Record<TreeNodeClassification, ClassificationVisualMeta> = {
  'pie-root': {
    label: 'PIE Root Anchor',
    fill: '#fef08a',
    stroke: '#f59e0b',
    text: '#0f172a',
    glow: 'rgba(253, 224, 71, 0.55)',
    legendDescription: 'Golden halo marks confirmed Proto-Indo-European origin'
  },
  'community-root': {
    label: 'Community Origin',
    fill: '#cbd5f5',
    stroke: '#475569',
    text: '#0f172a',
    legendDescription: 'Entry point when a community begins beyond known PIE roots'
  },
  'session-root': {
    label: 'Session Root',
    fill: '#e2e8f0',
    stroke: '#475569',
    text: '#111827',
    legendDescription: 'Temporary root for words explored outside existing communities'
  },
  'direct-descendant': {
    label: 'Direct PIE Descendant',
    fill: '#c4b5fd',
    stroke: '#7c3aed',
    text: '#0f172a',
    legendDescription: 'Solid violet ring signals lineage explicitly traced back to the root'
  },
  'semantic-alliance': {
    label: 'Semantic / Phonetic Alliance',
    fill: '#5eead4',
    stroke: '#0f766e',
    text: '#064e3b',
    legendDescription: 'Dashed teal ring highlights phonetic or semantic resonance'
  },
  'pie-adjacent': {
    label: 'PIE Related (Indirect)',
    fill: '#bae6fd',
    stroke: '#0ea5e9',
    text: '#0c4a6e',
    legendDescription: 'Shares PIE context without a direct descendant statement'
  },
  'non-pie': {
    label: 'Non-PIE Origin',
    fill: '#e2e8f0',
    stroke: '#94a3b8',
    text: '#1e293b',
    legendDescription: 'Nodes that originate outside the PIE lineage'
  }
};

export const LEGEND_CLASSIFICATIONS: TreeNodeClassification[] = [
  'pie-root',
  'direct-descendant',
  'semantic-alliance',
  'pie-adjacent',
  'non-pie'
];

export const CLASSIFICATION_LABELS: Record<TreeNodeClassification, string> = Object.fromEntries(
  Object.entries(CLASSIFICATION_META).map(([key, meta]) => [key, meta.label])
) as Record<TreeNodeClassification, string>;
