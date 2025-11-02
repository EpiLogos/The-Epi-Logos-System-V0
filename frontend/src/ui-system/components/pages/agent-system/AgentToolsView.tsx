'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

interface AgentToolsViewProps {
  coordinate: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  returnType?: string;
}

export const AgentToolsView: React.FC<AgentToolsViewProps> = ({ coordinate }) => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    fetchToolsData();
  }, [coordinate]);

  const fetchToolsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetFunctionalProperties($coordinate: String!) {
              getFunctionalProperties(coordinate: $coordinate, propertyPrefix: "f_tools") {
                success
                coordinate
                properties
                error
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

      const data = result.data?.getFunctionalProperties;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch tools');
      }

      // Parse tools from f_tools property (JSON string)
      const props = data.properties || {};
      const toolsJson = props.f_tools || '[]';

      try {
        const parsedTools = typeof toolsJson === 'string' ? JSON.parse(toolsJson) : toolsJson;
        setTools(Array.isArray(parsedTools) ? parsedTools : []);
      } catch (parseErr) {
        console.warn('Failed to parse tools JSON:', parseErr);
        setTools([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTool = (toolName: string, currentDescription: string) => {
    setEditingTool(toolName);
    setEditedDescription(currentDescription);
  };

  const handleSaveTool = async (toolName: string) => {
    try {
      // Update the tool in the array
      const updatedTools = tools.map(tool =>
        tool.name === toolName
          ? { ...tool, description: editedDescription }
          : tool
      );

      // Save back to Neo4j
      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation UpdateBimbaNode($input: UpdateBimbaNodeInput!) {
              updateBimbaNode(input: $input) {
                success
                errors {
                  field
                  message
                  code
                }
              }
            }
          `,
          variables: {
            input: {
              coordinate,
              properties: [
                { key: 'f_tools', value: JSON.stringify(updatedTools) }
              ]
            }
          }
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const mutationResult = result.data?.updateBimbaNode;

      if (!mutationResult?.success) {
        const errorMsg = mutationResult?.errors?.[0]?.message || 'Update failed';
        throw new Error(errorMsg);
      }

      // Update local state
      setTools(updatedTools);
      setEditingTool(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool');
    }
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setEditedDescription('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="text-[#f5f5f5] text-center py-8">
        <div className="animate-pulse">Loading tools for {coordinate}...</div>
      </div>
    );
  }

  if (error && !editingTool) {
    return (
      <div className="text-red-400 text-center py-8">
        <div className="text-sm">Error loading tools</div>
        <div className="text-xs mt-2 opacity-70">{error}</div>
        <button
          onClick={fetchToolsData}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="text-[#f5f5f5] text-center py-8">
        <div className="text-sm">No tools registered for {coordinate}</div>
        <p className="text-xs text-purple-400/70 mt-2">
          Tools are registered via @agent.tool decorators in Python code
        </p>
      </div>
    );
  }

  return (
    <div className="text-[#f5f5f5] space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-mono tracking-[2px] uppercase mb-2">
          Agent Tools
        </h2>
        <p className="text-xs text-purple-400/70">
          {tools.length} tool{tools.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tools list */}
      <div className="space-y-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="border border-purple-900/40 rounded p-4 bg-black/30"
          >
            {/* Tool name */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-[16px] font-mono text-purple-300">
                {tool.name}
              </h3>
              {editingTool !== tool.name && (
                <button
                  onClick={() => handleEditTool(tool.name, tool.description)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Tool description (editable) */}
            <div className="mb-3">
              <h4 className="text-[11px] font-mono tracking-[1px] uppercase text-purple-400/70 mb-2">
                Description (Docstring)
              </h4>
              {editingTool === tool.name ? (
                <div>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className={cn(
                      "w-full h-[150px] p-3 bg-black/50 border border-purple-900/40 rounded",
                      "text-[12px] font-mono leading-relaxed text-[#f5f5f5]",
                      "focus:outline-none focus:border-purple-500/60 resize-y"
                    )}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveTool(tool.name)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-[#f5f5f5] leading-relaxed opacity-90 whitespace-pre-wrap">
                  {tool.description || <span className="text-purple-400/70 italic">No description</span>}
                </div>
              )}
            </div>

            {/* Parameters */}
            {tool.parameters && Object.keys(tool.parameters).length > 0 && (
              <div className="mb-2">
                <h4 className="text-[11px] font-mono tracking-[1px] uppercase text-purple-400/70 mb-2">
                  Parameters
                </h4>
                <div className="space-y-1">
                  {Object.entries(tool.parameters).map(([paramName, paramType]) => (
                    <div key={paramName} className="text-[11px] font-mono">
                      <span className="text-purple-300">{paramName}</span>
                      <span className="text-purple-400/70">: </span>
                      <span className="text-cyan-400">{String(paramType)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return type */}
            {tool.returnType && (
              <div>
                <h4 className="text-[11px] font-mono tracking-[1px] uppercase text-purple-400/70 mb-1">
                  Returns
                </h4>
                <div className="text-[11px] font-mono text-cyan-400">
                  {tool.returnType}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="text-xs text-purple-400/70 pt-4 border-t border-purple-900/20">
        <p>Tool descriptions (docstrings) are sent to the LLM as function definitions. Edit them to improve agent tool selection.</p>
      </div>
    </div>
  );
};
