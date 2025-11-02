'use client';

import React, { useEffect, useState } from 'react';

interface AgentContentPanelProps {
  coordinate: string;
}

interface NodeData {
  name?: string;
  description?: string;
  operationalEssence?: string;
  coreNature?: string;
}

export const AgentContentPanel: React.FC<AgentContentPanelProps> = ({ coordinate }) => {
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodeData = async () => {
      setLoading(true);
      setError(null);

      try {
        // GraphQL query to fetch node data
        const response = await fetch('http://localhost:8000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetNode($coordinate: String!) {
                getNodeByCoordinate(coordinate: $coordinate) {
                  name
                  description
                  operationalEssence
                  coreNature
                }
              }
            `,
            variables: { coordinate }
          })
        });

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        setNodeData(result.data?.getNodeByCoordinate || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load node data');
      } finally {
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [coordinate]);

  if (loading) {
    return (
      <div className="text-[#f5f5f5] text-center py-8">
        <div className="animate-pulse">Loading {coordinate}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-8">
        <div className="text-sm">Error loading {coordinate}</div>
        <div className="text-xs mt-2 opacity-70">{error}</div>
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className="text-[#f5f5f5] text-center py-8">
        <div className="text-sm">No data found for {coordinate}</div>
      </div>
    );
  }

  return (
    <div className="text-[#f5f5f5]">
      {/* Coordinate Header */}
      <div className="mb-6">
        <h2 className="text-[24px] font-mono tracking-[3px] uppercase text-center mb-2">
          {coordinate}
        </h2>
        {nodeData.name && (
          <h3 className="text-[16px] font-mono tracking-[2px] text-center opacity-80">
            {nodeData.name}
          </h3>
        )}
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {nodeData.description && (
          <div>
            <h4 className="text-[12px] font-mono tracking-[1.5px] uppercase text-purple-400 mb-2">
              Description
            </h4>
            <p className="text-[13px] text-[#f5f5f5] leading-relaxed opacity-90">
              {nodeData.description}
            </p>
          </div>
        )}

        {nodeData.operationalEssence && (
          <div>
            <h4 className="text-[12px] font-mono tracking-[1.5px] uppercase text-purple-400 mb-2">
              Operational Essence
            </h4>
            <p className="text-[13px] text-[#f5f5f5] leading-relaxed opacity-90">
              {nodeData.operationalEssence}
            </p>
          </div>
        )}

        {nodeData.coreNature && (
          <div>
            <h4 className="text-[12px] font-mono tracking-[1.5px] uppercase text-purple-400 mb-2">
              Core Nature
            </h4>
            <p className="text-[13px] text-[#f5f5f5] leading-relaxed opacity-90">
              {nodeData.coreNature}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
