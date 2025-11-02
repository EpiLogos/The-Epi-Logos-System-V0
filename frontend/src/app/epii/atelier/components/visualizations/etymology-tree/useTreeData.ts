/**
 * useTreeData Hook
 *
 * Transforms session + communities data into force-graph tree format.
 * Creates hierarchical structure: PIE roots → community words → related words
 *
 * Story 08.10 - D3.js Force-Directed Graph Visualizations
 */

import { useMemo } from 'react';
import type { EtymologySession, EtymologyCommunity, EtymologyCommunityWord } from '@/types/etymology.types';
import type {
  TreeNode,
  TreeLink,
  TreeGraphData,
  TreeNodeClassification
} from './types';

export interface UseTreeDataConfig {
  session: EtymologySession | null;
  communities: EtymologyCommunity[];
}

export function useTreeData({ session, communities }: UseTreeDataConfig): TreeGraphData {
  return useMemo(() => {
    if (!session) {
      return { nodes: [], links: [] };
    }

    const nodes: TreeNode[] = [];
    const links: TreeLink[] = [];
    const addedPaths = new Set<string>();
    const rootRegistry = new Map<string, TreeNode>();

    communities.forEach((community) => {
      const communityPieRoot = community.pie_root?.trim() || null;
      const hasPieRoot = Boolean(communityPieRoot);
      const sanitizedRootKey = sanitizePathPart(
        hasPieRoot ? communityPieRoot! : community.id
      );
      const rootPath = hasPieRoot
        ? `pie-root::${sanitizedRootKey}`
        : `community::${sanitizedRootKey}`;
      const rootLabel = hasPieRoot
        ? communityPieRoot!
        : `Community: ${community.name}`;

      if (!rootRegistry.has(rootPath)) {
        const classification = hasPieRoot ? 'pie-root' : 'community-root';
        const rootNode: TreeNode = {
          path: rootPath,
          leaf: rootLabel,
          module: hasPieRoot ? communityPieRoot! : community.id,
          level: 0,
          size: hasPieRoot ? 120 : 100,
          nodeType: 'root',
          classification,
          pieRoot: communityPieRoot,
          communityId: hasPieRoot ? undefined : community.id,
          communityName: hasPieRoot ? undefined : community.name,
          communityIds: [community.id]
        };
        nodes.push(rootNode);
        rootRegistry.set(rootPath, rootNode);
        addedPaths.add(rootPath);
      } else {
        const existingRoot = rootRegistry.get(rootPath)!;
        if (existingRoot.communityIds && !existingRoot.communityIds.includes(community.id)) {
          existingRoot.communityIds.push(community.id);
        }
      }

      const rootNode = rootRegistry.get(rootPath)!;

      const wordNodes = getWordNodesForCommunity(community);

      wordNodes.forEach((wordNode, index) => {
        const sanitizedWord = sanitizePathPart(wordNode.word);
        const suffix = wordNode.id ? sanitizePathPart(wordNode.id) : String(index);
        const nodePath = `${rootPath}/${sanitizePathPart(community.id)}/${sanitizedWord}-${suffix}`;

        if (addedPaths.has(nodePath)) {
          return;
        }

        const classification = classifyWordNode(wordNode, community);

        const treeNode: TreeNode = {
          path: nodePath,
          leaf: wordNode.word,
          module: community.id,
          level: 1,
          size: getNodeSizeForClassification(classification),
          nodeType: 'word',
          classification,
          communityId: community.id,
          communityName: community.name,
          pieRoot: communityPieRoot,
          word: wordNode.word,
          lineage: wordNode.lineage ?? wordNode.pie_lineage ?? null,
          pieLineage: wordNode.pie_lineage ?? null,
          relationDescriptor: wordNode.relation_descriptor ?? null,
          semanticPattern: wordNode.semantic_pattern ?? null,
          qlPosition: wordNode.ql_position ?? null,
          enrichedAt: wordNode.enriched_at ?? null
        };

        nodes.push(treeNode);
        addedPaths.add(nodePath);

        const relationship: TreeLink['relationship'] = classification === 'direct-descendant'
          ? 'direct'
          : classification === 'semantic-alliance'
          ? 'alliance'
          : 'unknown';

        links.push({
          source: rootNode.path,
          target: treeNode.path,
          targetNode: treeNode,
          relationship,
          communityId: community.id
        });
      });
    });

    // Fallback: If no communities, show session words if available
    if (nodes.length === 0 && session.words_explored.length > 0) {
      const rootPath = 'session::explored-words';

      const sessionRoot: TreeNode = {
        path: rootPath,
        leaf: 'Explored Words',
        module: 'session',
        level: 0,
        size: 110,
        nodeType: 'session-root',
        classification: 'session-root',
        pieRoot: null
      };

      nodes.push(sessionRoot);
      addedPaths.add(rootPath);

      session.words_explored.forEach((word, index) => {
        const sanitizedWord = sanitizePathPart(word);
        const path = `${rootPath}/${sanitizedWord}-${index}`;

        if (!addedPaths.has(path)) {
          const sessionNode: TreeNode = {
            path,
            leaf: word,
            module: 'session',
            level: 1,
            size: 60,
            nodeType: 'word',
            classification: 'non-pie',
            communityId: undefined,
            communityName: undefined,
            pieRoot: null,
            word,
            lineage: null,
            pieLineage: null,
            relationDescriptor: null,
            semanticPattern: null,
            qlPosition: null,
            enrichedAt: null
          };

          nodes.push(sessionNode);
          addedPaths.add(path);

          links.push({
            source: rootPath,
            target: path,
            targetNode: sessionNode,
            relationship: 'unknown'
          });
        }
      });
    }

    console.log('📊 [useTreeData] Generated tree:', {
      communities: communities.length,
      nodes: nodes.length,
      links: links.length,
      nodesPaths: nodes.map(n => n.path)
    });

    return { nodes, links };
  }, [session, communities]);
}

function sanitizePathPart(value: string): string {
  return encodeURIComponent(value.replace(/\s+/g, '_'));
}

function getWordNodesForCommunity(community: EtymologyCommunity): EtymologyCommunityWord[] {
  if (community.word_nodes && community.word_nodes.length > 0) {
    return community.word_nodes;
  }

  return community.words.map((word) => ({
    word,
    pie_root: community.pie_root ?? null,
    pie_lineage: null,
    lineage: null,
    relation_descriptor: null,
    semantic_pattern: community.semantic_pattern ?? null,
    ql_position: null,
    enriched_at: null
  }));
}

function classifyWordNode(
  word: EtymologyCommunityWord,
  community: EtymologyCommunity
): TreeNodeClassification {
  const lineageText = `${word.lineage ?? ''} ${word.pie_lineage ?? ''}`.toLowerCase();
  const descriptorText = (word.relation_descriptor ?? '').toLowerCase();
  const communityPieRoot = (community.pie_root ?? '').toLowerCase();
  const wordPieRoot = (word.pie_root ?? '').toLowerCase();

  const matchesCommunityRoot = Boolean(communityPieRoot && wordPieRoot && communityPieRoot === wordPieRoot);

  const isDirectLineage =
    lineageText.includes('direct descendant') ||
    lineageText.includes('direct descendent') ||
    descriptorText.includes('direct descendant') ||
    descriptorText.includes('direct descendent');

  if (matchesCommunityRoot || isDirectLineage) {
    return 'direct-descendant';
  }

  const isSemanticAlliance =
    descriptorText.includes('cousin') ||
    descriptorText.includes('resonance') ||
    descriptorText.includes('alliance') ||
    lineageText.includes('cousin') ||
    lineageText.includes('resonance');

  if (isSemanticAlliance) {
    return 'semantic-alliance';
  }

  if (wordPieRoot || lineageText.includes('proto-indo-european')) {
    return 'pie-adjacent';
  }

  return 'non-pie';
}

function getNodeSizeForClassification(classification: TreeNodeClassification): number {
  switch (classification) {
    case 'direct-descendant':
      return 80;
    case 'semantic-alliance':
      return 70;
    case 'pie-adjacent':
      return 65;
    default:
      return 60;
  }
}
