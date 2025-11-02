'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

interface AgentPromptViewProps {
  coordinate: string;
}

interface PromptData {
  f_system_prompt?: string;
  f_agent_prompt?: string;
}

export const AgentPromptView: React.FC<AgentPromptViewProps> = ({ coordinate }) => {
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedSystemPrompt, setEditedSystemPrompt] = useState('');
  const [editedAgentPrompt, setEditedAgentPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromptData();
  }, [coordinate]);

  const fetchPromptData = async () => {
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
              getFunctionalProperties(coordinate: $coordinate, propertyPrefix: "f_") {
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
        throw new Error(data?.error || 'Failed to fetch properties');
      }

      // Parse f_system_prompt and f_agent_prompt from properties
      const props = data.properties || {};
      const systemPrompt = props.f_system_prompt || '';
      const agentPrompt = props.f_agent_prompt || '';

      setPromptData({
        f_system_prompt: systemPrompt,
        f_agent_prompt: agentPrompt
      });
      setEditedSystemPrompt(systemPrompt);
      setEditedAgentPrompt(agentPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
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
                node {
                  coordinate
                }
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
                { key: 'f_system_prompt', value: editedSystemPrompt },
                { key: 'f_agent_prompt', value: editedAgentPrompt }
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

      // Update local state with saved values
      setPromptData({
        f_system_prompt: editedSystemPrompt,
        f_agent_prompt: editedAgentPrompt
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompts');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSystemPrompt(promptData?.f_system_prompt || '');
    setEditedAgentPrompt(promptData?.f_agent_prompt || '');
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="text-[#f5f5f5] text-center py-8">
        <div className="animate-pulse">Loading prompts for {coordinate}...</div>
      </div>
    );
  }

  if (error && !editing) {
    return (
      <div className="text-red-400 text-center py-8">
        <div className="text-sm">Error loading prompts</div>
        <div className="text-xs mt-2 opacity-70">{error}</div>
        <button
          onClick={fetchPromptData}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm text-[#f5f5f5]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-[#f5f5f5] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-mono tracking-[2px] uppercase text-purple-400">
          Prompt Properties
        </h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm text-[#f5f5f5] transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm text-[#f5f5f5] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-[#f5f5f5] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Error display during editing */}
      {error && editing && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* System Prompt */}
      <div>
        <h3 className="text-[14px] font-mono tracking-[1.5px] uppercase text-purple-400 mb-3">
          System Prompt (f_system_prompt)
        </h3>
        {editing ? (
          <textarea
            value={editedSystemPrompt}
            onChange={(e) => setEditedSystemPrompt(e.target.value)}
            className={cn(
              "w-full h-[300px] p-4 bg-black/50 border border-purple-900/40 rounded",
              "text-[13px] font-mono leading-relaxed text-[#f5f5f5]",
              "focus:outline-none focus:border-purple-500/60 resize-y"
            )}
            placeholder="No system prompt defined"
          />
        ) : (
          <div className={cn(
            "w-full min-h-[100px] p-4 bg-black/30 border border-purple-900/40 rounded",
            "text-[13px] font-mono leading-relaxed whitespace-pre-wrap text-[#f5f5f5]"
          )}>
            {promptData?.f_system_prompt || (
              <span className="text-purple-400/70 italic">No system prompt defined</span>
            )}
          </div>
        )}
      </div>

      {/* Agent Prompt */}
      <div>
        <h3 className="text-[14px] font-mono tracking-[1.5px] uppercase text-purple-400 mb-3">
          Agent Prompt (f_agent_prompt)
        </h3>
        {editing ? (
          <textarea
            value={editedAgentPrompt}
            onChange={(e) => setEditedAgentPrompt(e.target.value)}
            className={cn(
              "w-full h-[300px] p-4 bg-black/50 border border-purple-900/40 rounded",
              "text-[13px] font-mono leading-relaxed text-[#f5f5f5]",
              "focus:outline-none focus:border-purple-500/60 resize-y"
            )}
            placeholder="No agent prompt defined"
          />
        ) : (
          <div className={cn(
            "w-full min-h-[100px] p-4 bg-black/30 border border-purple-900/40 rounded",
            "text-[13px] font-mono leading-relaxed whitespace-pre-wrap text-[#f5f5f5]"
          )}>
            {promptData?.f_agent_prompt || (
              <span className="text-purple-400/70 italic">No agent prompt defined</span>
            )}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="text-xs text-purple-400/70 pt-4 border-t border-purple-900/20">
        <p>These prompts are stored in Neo4j as functional properties and used by the Prakāśa system for agent initialization.</p>
      </div>
    </div>
  );
};
