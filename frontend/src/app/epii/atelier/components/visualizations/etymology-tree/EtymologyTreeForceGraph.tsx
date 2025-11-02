/**
 * Etymology Tree Force Graph Component
 *
 * Interactive force-directed graph visualization for etymology trees.
 * Based on: https://vasturiano.github.io/force-graph/example/tree/
 *
 * Story 08.10 - D3.js Force-Directed Graph Visualizations
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { EtymologySession, EtymologyCommunity } from '@/types/etymology.types';
import { useTreeData } from './useTreeData';
import type { TreeLink, TreeNode, TreeNodeClassification } from './types';
import { CLASSIFICATION_META, CLASSIFICATION_LABELS } from './constants';

interface EtymologyTreeForceGraphProps {
  session: EtymologySession | null;
  communities: EtymologyCommunity[];
  width?: number;
  height?: number;
  className?: string;
  onNodeSelect?: (node: TreeNode | null) => void;
  selectedNodePath?: string | null;
}

export function EtymologyTreeForceGraph({
  session,
  communities,
  width,
  height,
  className,
  onNodeSelect,
  selectedNodePath
}: EtymologyTreeForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number}>(
    () => ({
      width: width ?? 0,
      height: height ?? 0
    })
  );
  const selectedNodePathRef = useRef<string | null>(null);

  // Transform session/communities data into tree format
  const treeData = useTreeData({ session, communities });

  // Initialize force-graph (client-side only, single initialization)
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    // Only initialize once
    if (graphRef.current) return;

    const initGraph = async () => {
      try {
        // Dynamic imports to avoid SSR
        const ForceGraphModule = await import('force-graph');
        const { forceCollide } = await import('d3-force');

        const ForceGraph = ForceGraphModule.default;

        if (!containerRef.current) return;

        // Initialize graph - EXACT pattern from reference example
        const graph = ForceGraph()(containerRef.current)
          .width(dimensions.width)
          .height(dimensions.height)
          .dagMode('td')
          .dagLevelDistance(280)
          .backgroundColor('#0f172a')
          .nodeRelSize(1)
          .nodeId('path')
          .nodeVal((node: TreeNode) => getNodePhysicsValue(node))
          .nodeLabel((node: TreeNode) => buildNodeLabel(node))
          .linkColor((link: TreeLink) => getLinkColor(link))
          .linkWidth((link: TreeLink) => getLinkWidth(link))
          .linkDirectionalParticles(0)
          .d3Force('collision', forceCollide((node: TreeNode) =>
            getNodeRadius(node) * 1.4
          ))
          .d3VelocityDecay(0.3);

        graph
          .nodeCanvasObject((node: TreeNode, ctx, globalScale) => {
            drawNode(node, ctx, globalScale, selectedNodePathRef.current);
          })
          .nodePointerAreaPaint((node: TreeNode, color, ctx) => {
            drawPointerArea(node, color, ctx);
          });

        graphRef.current = graph;

        // Set initial data if available
        if (treeData.nodes.length > 0) {
          graph.graphData(treeData);
        }
      } catch (err) {
        console.error('Failed to initialize force-graph:', err);
      }
    };

    initGraph();

    // Cleanup
    return () => {
      if (graphRef.current && graphRef.current._destructor) {
        graphRef.current._destructor();
      }
    };
  }, [dimensions.height, dimensions.width]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update graph data when treeData changes
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.graphData(treeData);
    }
  }, [treeData]);

  // Handle external width/height prop updates
  useEffect(() => {
    if (width !== undefined && height !== undefined) {
      setDimensions({ width, height });
    }
  }, [width, height]);

  useEffect(() => {
    selectedNodePathRef.current = selectedNodePath ?? null;
    if (graphRef.current) {
      graphRef.current.refresh();
    }
  }, [selectedNodePath]);

  // Observe container size when width/height are not explicitly provided
  useEffect(() => {
    if (width !== undefined && height !== undefined) {
      return () => undefined;
    }

    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return () => undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);

      setDimensions((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [width, height]);

  // Apply dimension changes to the force graph instance
  useEffect(() => {
    if (!graphRef.current) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    graphRef.current.width(dimensions.width);
    graphRef.current.height(dimensions.height);
  }, [dimensions]);

  useEffect(() => {
    if (!graphRef.current) return;

    graphRef.current
      .onNodeClick((node: TreeNode | undefined) => {
        if (node) {
          onNodeSelect?.(node);
        }
      })
      .onBackgroundClick(() => {
        onNodeSelect?.(null);
      });
  }, [onNodeSelect]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <p className="text-gray-400 text-sm">
            Select a session to view etymology tree
          </p>
        </div>
      </div>
    );
  }

  if (treeData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌳</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            No Etymology Tree Yet
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Explore words in chat to discover PIE roots and build your etymology tree.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width ?? '100%',
        height: height ?? '100%'
      }}
    />
  );
}

function getNodePhysicsValue(node: TreeNode): number {
  if (node.classification === 'pie-root' || node.classification === 'community-root' || node.classification === 'session-root') {
    return 28;
  }

  if (node.classification === 'direct-descendant') {
    return 18;
  }

  if (node.classification === 'semantic-alliance') {
    return 16;
  }

  if (node.classification === 'pie-adjacent') {
    return 14;
  }

  return 12;
}

function buildNodeLabel(node: TreeNode): string {
  if (node.nodeType === 'root' || node.nodeType === 'session-root') {
    const lines = [node.leaf];

    if (node.pieRoot) {
      lines.push('PIE Root');
    }

    if (node.communityIds && node.communityIds.length > 0) {
      lines.push(`Communities: ${node.communityIds.length}`);
    }

    return lines.join('\n');
  }

  const lines = [node.leaf];
  const classificationLabel = CLASSIFICATION_LABELS[node.classification];
  if (classificationLabel) {
    lines.push(classificationLabel);
  }

  if (node.lineage) {
    lines.push(`Lineage: ${node.lineage}`);
  } else if (node.pieLineage) {
    lines.push(`PIE Lineage: ${node.pieLineage}`);
  }

  if (node.relationDescriptor) {
    lines.push(`Relation: ${node.relationDescriptor}`);
  }

  return lines.join('\n');
}

function getLinkColor(link: TreeLink): string {
  switch (link.relationship) {
    case 'direct':
      return 'rgba(147, 51, 234, 0.55)';
    case 'alliance':
      return 'rgba(45, 212, 191, 0.55)';
    default:
      return 'rgba(148, 163, 184, 0.35)';
  }
}

function getLinkWidth(link: TreeLink): number {
  switch (link.relationship) {
    case 'direct':
      return 2.4;
    case 'alliance':
      return 1.8;
    default:
      return 1.2;
  }
}

function getNodeRadius(node: TreeNode): number {
  if (node.classification === 'pie-root') {
    return 14;
  }

  if (node.classification === 'community-root' || node.classification === 'session-root') {
    return 12;
  }

  switch (node.classification) {
    case 'direct-descendant':
      return 9;
    case 'semantic-alliance':
      return 8;
    case 'pie-adjacent':
      return 7.5;
    default:
      return 7;
  }
}

function drawNode(
  node: TreeNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  selectedPath: string | null | undefined
) {
  const style = CLASSIFICATION_META[node.classification] ?? CLASSIFICATION_META['non-pie'];
  const { x = 0, y = 0 } = node as unknown as { x: number; y: number };
  const radius = getNodeRadius(node);
  const isSelected = selectedPath === node.path;

  ctx.save();

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.max(3.5, 6 / globalScale), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(253, 224, 71, 0.18)';
    ctx.fill();
  }

  if (style.glow) {
    const glowRadius = radius * 1.8;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, glowRadius);
    gradient.addColorStop(0, style.glow);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = style.fill;
  ctx.fill();

  const baseLineWidth = Math.max(node.classification === 'pie-root' ? 2.5 : 1.6, 1) / globalScale;
  ctx.lineWidth = isSelected ? baseLineWidth * 1.4 : baseLineWidth;
  ctx.strokeStyle = style.stroke;
  ctx.stroke();

  if (node.classification === 'direct-descendant' || node.classification === 'semantic-alliance') {
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.max(1.5, 3 / globalScale), 0, Math.PI * 2);
    ctx.lineWidth = Math.max(0.8, 1.4 / globalScale);
    ctx.strokeStyle = node.classification === 'direct-descendant'
      ? 'rgba(147, 51, 234, 0.7)'
      : 'rgba(16, 185, 129, 0.7)';
    if (node.classification === 'semantic-alliance') {
      ctx.setLineDash([3 / globalScale, 2 / globalScale]);
    }
    ctx.stroke();
    if (node.classification === 'semantic-alliance') {
      ctx.setLineDash([]);
    }
  }

  // Label beneath the node
  const fontSize = (node.nodeType === 'root' || node.classification === 'pie-root') ? 14 : 11;
  ctx.font = `${fontSize / globalScale}px 'Inter', sans-serif`;
  ctx.fillStyle = style.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(node.leaf, x, y + radius + 4 / globalScale);

  ctx.restore();
}

function drawPointerArea(node: TreeNode, color: string, ctx: CanvasRenderingContext2D) {
  const { x = 0, y = 0 } = node as unknown as { x: number; y: number };
  const radius = getNodeRadius(node) + 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
