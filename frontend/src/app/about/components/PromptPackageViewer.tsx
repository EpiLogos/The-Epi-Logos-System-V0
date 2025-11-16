'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLightMode } from '@/contexts/LightModeContext';
import { ExampleConversationViewer } from './ExampleConversationViewer';
import { ciaConversation } from './conversations/cia-democracy';
import { quantumConsciousnessConversation } from './conversations/quantum-consciousness';
import { godAndConversation } from './conversations/god-and';

interface PromptPackageViewerProps {
  onClose: () => void;
  onExampleSelect?: (exampleId: string) => void;
}

interface PackageFile {
  id: string;
  title: string;
  description: string;
  filename: string;
  path: string;
}

const packageFiles: PackageFile[] = [
  {
    id: 'instructions',
    title: 'AI Agent Instructions',
    description: 'Core system prompt for integrating QL and MEF frameworks into your AI agent. Install this first to enable framework-aware reasoning.',
    filename: 'prompt-package-instruction.md',
    path: '/texts/prompt-package/prompt-package-instruction.md'
  },
  {
    id: 'ql',
    title: 'Quaternal Logic (QL) Package',
    description: 'Complete QL framework: mod6 architecture, tetralemma navigation, and holographic modeling heuristic for structuring multi-dimensional queries.',
    filename: 'ql-prompt-package.md',
    path: '/texts/prompt-package/ql-prompt-package.md'
  },
  {
    id: 'mef',
    title: 'Meta-Epistemic Framework (MEF) Package',
    description: 'Six analytical lenses for investigating domains: archetypal, causal, logical, processual, meta-epistemic, and divine-scalar perspectives with CMEA diagnostic.',
    filename: 'mef-prompt-package.md',
    path: '/texts/prompt-package/mef-prompt-package.md'
  }
];

interface ExampleInquiry {
  id: string;
  title: string;
  description: string;
  framework: 'QL' | 'MEF' | 'Both';
}

const exampleInquiries: ExampleInquiry[] = [
  {
    id: 'cia-democracy',
    title: 'CIA & Democracy Paradox',
    description: 'Deep investigation into institutional contradictions, shadow operations, and the fundamental paradox management function of consciousness itself',
    framework: 'Both'
  },
  {
    id: 'quantum-consciousness',
    title: 'Quantum Mechanics & Consciousness',
    description: 'Exploring why quantum civilization has not emerged despite a century of discovery, and consciousness trauma as institutional resistance',
    framework: 'Both'
  },
  {
    id: 'god-and',
    title: 'But What About God Tho?',
    description: 'A two-part theological investigation: first examining whether mathematical frameworks can capture divine reality through toroidal topology, then pivoting to analyze "god" as a live cultural-psychological phenomenon across traditions',
    framework: 'Both'
  }
];

export function PromptPackageViewer({ onClose, onExampleSelect }: PromptPackageViewerProps) {
  const { isLightMode } = useLightMode();
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const handleDownload = async (file: PackageFile) => {
    try {
      const response = await fetch(file.path);
      const content = await response.text();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (const file of packageFiles) {
      await handleDownload(file);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  // Show conversation viewer if one is selected
  if (selectedConversation === 'cia-democracy') {
    return (
      <ExampleConversationViewer
        title={ciaConversation.title}
        description={ciaConversation.description}
        framework={ciaConversation.framework}
        turns={ciaConversation.turns}
        onClose={() => setSelectedConversation(null)}
      />
    );
  }

  if (selectedConversation === 'quantum-consciousness') {
    return (
      <ExampleConversationViewer
        title={quantumConsciousnessConversation.title}
        description={quantumConsciousnessConversation.description}
        framework={quantumConsciousnessConversation.framework}
        turns={quantumConsciousnessConversation.turns}
        onClose={() => setSelectedConversation(null)}
      />
    );
  }

  if (selectedConversation === 'god-and') {
    return (
      <ExampleConversationViewer
        title={godAndConversation.title}
        description={godAndConversation.description}
        framework={godAndConversation.framework}
        turns={godAndConversation.turns}
        onClose={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden transition-colors duration-500",
      isLightMode ? "bg-white text-gray-800" : "bg-black text-white"
    )}>
      {/* Main Content - Scrollable container */}
      <div className="relative h-full overflow-y-auto">
        {/* Header - scrolls with content */}
        <div className={cn(
          "border-b backdrop-blur-sm",
          isLightMode ? "border-slate-300 bg-white/95" : "border-gray-800 bg-black/95"
        )}>
          <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-6 flex items-center justify-between">
            <div>
              <p className={cn(
                "text-[11px] uppercase tracking-[0.42em] mb-2",
                isLightMode ? "text-gray-500" : "text-gray-500"
              )}>
                Prompt Packages
              </p>
              <h1 className={cn(
                "text-[28px] md:text-[32px] font-light tracking-[0.28em]",
                isLightMode ? "text-slate-900" : "text-white"
              )}>
                MEF + QL FRAMEWORK
              </h1>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "text-[11px] uppercase tracking-[0.4em] transition-colors",
                isLightMode ? "text-gray-500 hover:text-slate-900" : "text-gray-500 hover:text-white"
              )}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">

          {/* Introduction */}
          <div className="mb-16 max-w-[900px] mt-16">
            <h2 className={cn(
              "text-[22px] font-light tracking-[0.2em] mb-6",
              isLightMode ? "text-slate-900" : "text-white"
            )}>
              Installation & Usage
            </h2>
            <div className="space-y-4 text-[14px] leading-[2]">
              <p className={isLightMode ? "text-slate-700" : "text-gray-200"}>
                This package provides the Epi-Logos Philosophy as a "cognitive operating system" combining <span className={isLightMode ? "text-slate-900" : "text-white"}>Quaternal Logic (QL)</span> and the <span className={isLightMode ? "text-slate-900" : "text-white"}>Meta-Epistemic Framework (MEF)</span> - two complementary systems for multi-dimensional, paradox aware reasoning and analysis. They are theoretical lynchpins of the project.
              </p>
              <p className={isLightMode ? "text-slate-700" : "text-gray-200"}>
                <span className={isLightMode ? "text-slate-900" : "text-white"}>Quaternal Logic (QL)</span> provides the architectural logic. The <span className={isLightMode ? "text-slate-900" : "text-white"}>Meta-Epistemic Framework (MEF)</span> provides the analytical lenses: six complementary perspectives for investigating any query, in any domain, and performing critical diagnosis of epistemic systems.
              </p>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mb-16 max-w-[900px]">
            <h2 className={cn("text-[18px] font-light tracking-[0.2em] mb-6", isLightMode ? "text-slate-900" : "text-white")}>
              How to Use
            </h2>
            <div className="space-y-6 text-[13px] leading-[2]">
              <div>
                <h3 className={cn("font-light mb-3", isLightMode ? "text-slate-900" : "text-white")}>1. Learn Through Use:</h3>
                <p className={cn("text-[12px] leading-[1.9]", isLightMode ? "text-slate-700" : "text-gray-200")}>
                  The frameworks reveal themselves through practice. You can approach them theoretically first, or install, experiment, and let familiarity develop and influence your thinking. Each inquiry deepens your understanding of how the Epi-Logos operates, the reason behind QL and the MEF, and what it all means.
                </p>
              </div>
              <div>
                <h3 className={cn("font-light mb-3", isLightMode ? "text-slate-900" : "text-white")}>2. Guide the Agent Back:</h3>
                <p className={cn("text-[12px] leading-[1.9]", isLightMode ? "text-slate-700" : "text-gray-200")}>
                  AI naturally drifts from framework discipline over long conversations. When responses become generic or lose structure, redirect: "Return to the QL modeling" or "Apply CMEA here." It's also recommended to give style guidance in your prompts: as there's a tendency for responses to be given as lists, so you might want to specify "flowing prose" or "conversationally" in your prompt, depending on the kind of output that speaks to you. The packages don't beat the indeterminism of AI - they require some amount of active engagement to maintain paradigm coherence.
                </p>
              </div>
              <div>
                <h3 className={cn("font-light mb-3", isLightMode ? "text-slate-900" : "text-white")}>3. Let Frameworks Transform Thinking:</h3>
                <p className={cn("text-[12px] leading-[1.9]", isLightMode ? "text-slate-700" : "text-gray-200")}>
                  Some amount of implicit "going along with it" is implied here. If there's confusion or something isn't clear, ask the agent to clarify or specify details. Our wager; QL offers a glimpse into a way to structure reasoning coherently and ensure the whole is considered as much as the part in each inquiry; the MEF reveals hidden angles on the knowledge we already have. Whether applied to personal or institutional conception, the intent is to find a way of approaching complexity that genuinely helps to reduce it and alchemise it into clarity, through the discovery of underlying patterns of integration that operate across differences. If, in the dialogues they help generate, the theories serve this intent we'll be happy with what we're providing.
                </p>
              </div>
            </div>
          </div>

          {/* Package Files Grid */}
          <div className="space-y-6 mb-16">
            <h2 className={cn("text-[18px] font-light tracking-[0.2em] mb-8", isLightMode ? "text-slate-900" : "text-white")}>
              Package Components
            </h2>

            {packageFiles.map((file, index) => (
              <div
                key={file.id}
                className={cn(
                  "border backdrop-blur-sm transition-colors",
                  isLightMode
                    ? "border-slate-200 bg-slate-50 hover:border-slate-300"
                    : "border-gray-800 bg-black/40 hover:border-gray-700"
                )}
              >
                <div className="p-8 md:p-10">
                  <div className="space-y-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className={cn("text-[10px] tracking-[0.4em] uppercase", isLightMode ? "text-slate-500" : "text-gray-600")}>
                          File {index + 1}
                        </span>
                      </div>
                      <h3 className={cn("text-[20px] md:text-[24px] font-light tracking-[0.15em] mb-4", isLightMode ? "text-slate-900" : "text-white")}>
                        {file.title}
                      </h3>
                      <p className={cn("text-[13px] leading-[1.9]", isLightMode ? "text-slate-700" : "text-gray-200")}>
                        {file.description}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-4 font-mono">
                        {file.filename}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 border text-[10px] font-normal tracking-[2px] uppercase transition-colors w-fit",
                        isLightMode
                          ? "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          : "border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-white"
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Download All Button - placed after package files */}
            <div className="mt-10">
              <button
                onClick={handleDownloadAll}
                className={cn(
                  "inline-flex items-center gap-3 px-8 py-4 text-[11px] font-normal tracking-[2px] uppercase transition-colors",
                  isLightMode
                    ? "bg-slate-900 text-white hover:bg-slate-700"
                    : "bg-white text-black hover:bg-gray-200"
                )}
              >
                <Download className="w-4 h-4" />
                Download All Files
              </button>
            </div>
          </div>

          {/* Example Inquiries Section */}
          {exampleInquiries.length > 0 && (
            <div className={cn("mt-16 max-w-[1200px] border-t pt-16", isLightMode ? "border-slate-200" : "border-gray-800")}>
              <h2 className={cn("text-[18px] font-light tracking-[0.2em] mb-6", isLightMode ? "text-slate-900" : "text-white")}>
                Example Dialogues
              </h2>
              <p className={cn("text-[13px] leading-[2] mb-10 max-w-[900px]", isLightMode ? "text-slate-700" : "text-gray-200")}>
                See the tools in action. These full conversation transcripts demonstrate how QL and MEF bring shape to inquiry.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {exampleInquiries.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedConversation(example.id)}
                    className={cn(
                      "text-left border backdrop-blur-sm transition-all p-6 group",
                      isLightMode
                        ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                        : "border-gray-800 bg-black/40 hover:border-gray-700 hover:bg-black/60"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("text-[9px] tracking-[0.4em] uppercase", isLightMode ? "text-slate-500" : "text-gray-600")}>
                        {example.framework}
                      </span>
                    </div>
                    <h3 className={cn("text-[16px] font-light tracking-[0.12em] mb-3", isLightMode ? "text-slate-900 group-hover:text-slate-700" : "text-white group-hover:text-gray-100")}>
                      {example.title}
                    </h3>
                    <p className={cn("text-[12px] leading-[1.8]", isLightMode ? "text-slate-700" : "text-gray-400")}>
                      {example.description}
                    </p>
                    <div className={cn("mt-4 text-[10px] tracking-[0.3em] uppercase", isLightMode ? "text-slate-600 group-hover:text-slate-700" : "text-gray-600 group-hover:text-gray-500")}>
                      View Conversation →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className={cn("mt-16 max-w-[900px] border p-8 rounded-sm", isLightMode ? "bg-slate-50 border-slate-200" : "bg-gray-900/30 border-gray-800")}>
            <h3 className={cn("text-[16px] font-light tracking-[0.2em] mb-4", isLightMode ? "text-slate-900" : "text-white")}>
              We Want Your Feedback
            </h3>
            <p className={cn("text-[13px] leading-[2] mb-4", isLightMode ? "text-slate-700" : "text-gray-200")}>
              The frameworks evolve through active use. Every conversation reveals new patterns, every application surfaces questions we haven't yet considered. Your experience using these tools brings invaluable data.
            </p>
            <p className={cn("text-[12px]", isLightMode ? "text-slate-600" : "text-gray-300")}>
              Please share with us where the frameworks bring clarity and where they introduce confusion.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
