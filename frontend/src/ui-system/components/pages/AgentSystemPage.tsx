'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextAnimate } from '../ui/TextAnimate';
import { WaveBackground } from '../ui/WaveBackground';
import { CoordinateText } from '../ui/CoordinateText';
import { GlowParticles } from '../ui/GlowParticles';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { cn } from '../../lib/utils';
import { HexagonButton } from '../navigation/HexagonButton';
import { useSidebar } from '@/contexts/SidebarContext';
import { AgentSelector } from './agent-system/AgentSelector';
import { AgentContentPanel } from './agent-system/AgentContentPanel';
import { AgentPromptView } from './agent-system/AgentPromptView';
import { AgentToolsView } from './agent-system/AgentToolsView';
import { OrchestratorView } from './agent-system/OrchestratorView';
import { AgentToolbar, ViewMode, ModalMode } from './agent-system/AgentToolbar';

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

interface InlinePropertyViewProps {
  coordinate: string;
  propertyType: 'protocols' | 'workflows' | 'capabilities';
  onClose: () => void;
}

const InlinePropertyView: React.FC<InlinePropertyViewProps> = ({ coordinate, propertyType, onClose }) => {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        const prefix = PREFIX_MAP[propertyType];
        const response = await fetch('http://localhost:8000/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        if (result.errors) throw new Error(result.errors[0].message);

        const data = result.data?.getFunctionalProperties;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch properties');

        setProperties(data.properties || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [coordinate, propertyType]);

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditedValue(value);
  };

  const handleSave = async (key: string) => {
    try {
      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateBimbaNode($input: UpdateBimbaNodeInput!) {
              updateBimbaNode(input: $input) {
                success
                errors { field message code }
              }
            }
          `,
          variables: {
            input: {
              coordinate,
              properties: [{ key, value: editedValue }]
            }
          }
        })
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);

      const mutationResult = result.data?.updateBimbaNode;
      if (!mutationResult?.success) {
        const errorMsg = mutationResult?.errors?.[0]?.message || 'Update failed';
        throw new Error(errorMsg);
      }

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

  return (
    <div className="text-[#f5f5f5] space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-mono tracking-[2px] uppercase text-purple-400">
          {TITLE_MAP[propertyType]}
        </h2>
        <button onClick={onClose} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm text-[#f5f5f5] transition-colors">
          Close
        </button>
      </div>

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
          <p className="text-xs text-purple-400/70 mt-2">
            Add properties in Neo4j with prefix: {PREFIX_MAP[propertyType]}
          </p>
        </div>
      )}

      {!loading && Object.keys(properties).length > 0 && (
        <div className="space-y-4">
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="border border-purple-900/40 rounded p-4 bg-black/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[14px] font-mono text-purple-300 break-all">{key}</h3>
                {editingKey !== key && (
                  <button onClick={() => handleEdit(key, value)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs text-[#f5f5f5] transition-colors flex-shrink-0 ml-2">
                    Edit
                  </button>
                )}
              </div>

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
                  {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCancel} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-[#f5f5f5] transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleSave(key)} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-[#f5f5f5] transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] font-mono leading-relaxed text-[#f5f5f5] opacity-90 whitespace-pre-wrap break-words">
                  {value || <span className="text-purple-400/70 italic">Empty</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AgentSystemPage: React.FC<{ coordinate?: string }> = ({ coordinate = '#5-4' }) => {
  const { openHexagonPanel, panelMode } = useSidebar();

  const {
    whiteOverlayVisible,
    isTransitioning,
    textFadeStarted,
    currentTransitionDirection,
    transitionToSubsystems,
    transitionToEpiLogosFromQuaternal
  } = useInterPageTransition();

  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('prompts');
  const [inlinePropertyView, setInlinePropertyView] = useState<ModalMode>(null);
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coordTimer = setTimeout(() => setCoordinateTextVisible(true), 2500);
    return () => clearTimeout(coordTimer);
  }, []);

  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setWavesVisible(true);
      setWavesFadeState('visible');
    }, 1000);
    return () => clearTimeout(waveTimer);
  }, []);

  useEffect(() => {
    const particleTimer = setTimeout(() => {
      setParticlesVisible(true);
      setParticlesFadeState('visible');
    }, 1000);
    return () => clearTimeout(particleTimer);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setInlinePropertyView(null);
    if (mode === 'orchestrator') {
      setSelectedAgent(null);
    }
  };

  const handlePropertyViewOpen = (mode: ModalMode) => {
    setInlinePropertyView(mode);
  };

  const handleSelectAgent = (agentIndex: number) => {
    setSelectedAgent(agentIndex);
    setViewMode('prompts');
    setInlinePropertyView(null);
  };

  const handleSubsystemsClick = () => transitionToSubsystems();
  const handleEpiLogosClick = () => transitionToEpiLogosFromQuaternal();

  const currentCoordinate = selectedAgent !== null ? `#5-4.${selectedAgent}` : '#5-4';
  const isPanelExpanded = selectedAgent !== null || viewMode === 'orchestrator' || inlinePropertyView !== null;

  const renderContent = () => {
    // Inline property views (protocols, workflows, capabilities)
    if (inlinePropertyView) {
      return <InlinePropertyView coordinate={currentCoordinate} propertyType={inlinePropertyView} onClose={() => setInlinePropertyView(null)} />;
    }

    // Standard views
    if (viewMode === 'orchestrator') return <OrchestratorView />;
    if (selectedAgent === null) return <AgentContentPanel coordinate="#5-4" />;
    if (viewMode === 'prompts') return <AgentPromptView coordinate={currentCoordinate} />;
    if (viewMode === 'tools') return <AgentToolsView coordinate={currentCoordinate} />;
    return null;
  };

  return (
    <div data-coordinate={coordinate}>
      <PageFadeIn>
        <PortfolioContainer
          pageType="epi-logos"
          isModalExpanded={false}
          isTransitioning={isTransitioning}
          transitionDirection="to-subsystems"
        >
          <Sidebar variant="main" isModalExpanded={false} isTransitioning={isTransitioning}>
            <TextAnimate visible={!textFadeStarted} delay={200} duration="slow" className="text-[18px] font-normal tracking-[2px] text-[#333] mb-10 text-center">
              EPI : LOGOS
            </TextAnimate>

            <div className="flex flex-col flex-1 justify-center">
              <TextAnimate visible={!textFadeStarted} delay={600} duration="slow" className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center">
                AGENT SYSTEM
              </TextAnimate>
              <TextAnimate visible={!textFadeStarted} delay={1000} className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center">
                EPII SIVA-SHAKTI
              </TextAnimate>
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-col gap-[10px] items-start text-left">
                <div onClick={handleSubsystemsClick}>
                  <TextAnimate visible={!textFadeStarted} delay={1300} duration="normal" className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]">
                    Subsystems
                  </TextAnimate>
                </div>
                <div onClick={handleEpiLogosClick}>
                  <TextAnimate visible={!textFadeStarted} delay={1600} duration="normal" className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]">
                    Epi:Logos
                  </TextAnimate>
                </div>
                <TextAnimate visible={!textFadeStarted} delay={1900} duration="normal" className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]">
                  Account
                </TextAnimate>
              </div>

              <div className="mt-6 flex justify-center w-full">
                <TextAnimate visible={!textFadeStarted} delay={2200} duration="normal">
                  <div className="translate-y-[3px]">
                    <HexagonButton onClick={openHexagonPanel} isOpen={panelMode === 'hexagon-panel'} />
                  </div>
                </TextAnimate>
              </div>
            </div>
          </Sidebar>

          <div className="flex-1 flex flex-col relative">
            <div className={cn(
              "relative overflow-hidden m-[20px_20px_20px_0] bg-[#090a09]",
              "transition-[height,min-height,max-height] duration-[800ms] ease-out",
              isPanelExpanded ? "flex-shrink-0 min-h-[calc(100vh-40px)] max-h-[calc(100vh-40px)]" : "flex-shrink-0 min-h-[40vh] max-h-[40vh]"
            )}>
              <div ref={modalPanelRef} className="h-full bg-[#090a09] relative overflow-hidden border-2 border-[#ccc] flex flex-col">
                <WaveBackground isVisible={wavesVisible} containerRef={modalPanelRef} modalExpanded={false} fadeState={wavesFadeState} />
                <GlowParticles isVisible={particlesVisible} particleCount={50} baseHue={270} monochrome={true} mode="default" saturation={100} lightness={70} radiusScale={0.6} parentRef={modalPanelRef} showDebug={false} scaleOnHover={false} fadeState={particlesFadeState} />

                <div className="relative z-10">
                  <AgentToolbar
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onModalOpen={handlePropertyViewOpen}
                    selectedAgent={selectedAgent}
                    isPanelExpanded={isPanelExpanded}
                    onBackToSelector={() => {
                      setSelectedAgent(null);
                      setViewMode('prompts');
                      setInlinePropertyView(null);
                    }}
                  />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto">
                  <div className="p-8">
                    {renderContent()}
                  </div>
                </div>
              </div>
            </div>

            <CoordinateText coordinate={coordinate} visible={!textFadeStarted && coordinateTextVisible} position="overlay" linkToPageCoordinate />

            <div className={cn(
              "relative m-[0_20px_20px_0] bg-[#f5f5f5] transition-[height,min-height,max-height] duration-[800ms] ease-out overflow-hidden",
              isPanelExpanded ? "h-0 min-h-0 max-h-0" : "flex-shrink-0 min-h-[40vh] max-h-[40vh]"
            )}>
              <AgentSelector onSelectAgent={handleSelectAgent} selectedAgent={selectedAgent} />
            </div>
          </div>
        </PortfolioContainer>
      </PageFadeIn>

      <WhiteFadeOverlay visible={whiteOverlayVisible} onAnimationComplete={() => {}} />
    </div>
  );
};

export default AgentSystemPage;
