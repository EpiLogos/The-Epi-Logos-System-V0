'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

interface FunctionalPropertyModalProps {
  coordinate: string;
  propertyType: 'protocols' | 'workflows' | 'capabilities';
  isOpen: boolean;
  onClose: () => void;
}

const PREFIX_MAP = {
  protocols: 'f_protocol_',
  workflows: 'f_workflow_',
  capabilities: 'f_capability_'
};

const TITLE_MAP = {
  protocols: 'Agent Protocols',
  workflows: 'Workflow Templates',
  capabilities: 'Agent Capabilities'
};

export const FunctionalPropertyModal: React.FC<FunctionalPropertyModalProps> = ({
  coordinate,
  propertyType,
  isOpen,
  onClose
}) => {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen, coordinate, propertyType]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const prefix = PREFIX_MAP[propertyType];
      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetFunctionalProperties($coordinate: String!, $prefix: String) {
              getFunctionalProperties(coordinate: $coordinate, propertyPrefix: $prefix) {
                success
                coordinate
                properties
                error
              }
            }
          `,
          variables: { coordinate, prefix }
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

      setProperties(data.properties || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditedValue(value);
  };

  const handleSave = async (key: string) => {
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
                { key, value: editedValue }
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
      setProperties(prev => ({ ...prev, [key]: editedValue }));
      setEditingKey(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditedValue('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-[#090a09] border-2 border-purple-900/40 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-900/40">
          <div>
            <h2 className="text-[20px] font-mono tracking-[2px] uppercase text-[#f5f5f5]">
              {TITLE_MAP[propertyType]}
            </h2>
            <p className="text-[11px] text-purple-400/70 mt-1">
              {coordinate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading && (
            <div className="text-center text-[#f5f5f5] py-8">
              <div className="animate-pulse">Loading {propertyType}...</div>
            </div>
          )}

          {error && !editingKey && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && Object.keys(properties).length === 0 && (
            <div className="text-center text-[#f5f5f5] py-8">
              <p className="text-sm">No {propertyType} defined for {coordinate}</p>
              <p className="text-xs text-gray-500 mt-2">
                Add properties in Neo4j with prefix: {PREFIX_MAP[propertyType]}
              </p>
            </div>
          )}

          {!loading && Object.keys(properties).length > 0 && (
            <div className="space-y-4">
              {Object.entries(properties).map(([key, value]) => (
                <div
                  key={key}
                  className="border border-purple-900/40 rounded p-4 bg-black/30"
                >
                  {/* Property key */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[14px] font-mono text-purple-300 break-all">
                      {key}
                    </h3>
                    {editingKey !== key && (
                      <button
                        onClick={() => handleEdit(key, value)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors flex-shrink-0 ml-2"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Property value */}
                  {editingKey === key ? (
                    <div>
                      <textarea
                        value={editedValue}
                        onChange={(e) => setEditedValue(e.target.value)}
                        className={cn(
                          "w-full h-[200px] p-3 bg-black/50 border border-purple-900/40 rounded",
                          "text-[12px] font-mono leading-relaxed text-[#f5f5f5]",
                          "focus:outline-none focus:border-purple-500/60 resize-y"
                        )}
                      />
                      {error && (
                        <div className="mt-2 text-xs text-red-400">{error}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(key)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[12px] font-mono leading-relaxed text-[#f5f5f5] opacity-90 whitespace-pre-wrap break-words">
                      {value || <span className="text-gray-500 italic">Empty</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
