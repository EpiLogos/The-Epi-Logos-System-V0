'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* Main Content - Scrollable container */}
      <div className="relative h-full overflow-y-auto">
        {/* Header - scrolls with content */}
        <div className="border-b border-gray-800 bg-black/95 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.42em] text-gray-500 mb-2">
                Prompt Packages
              </p>
              <h1 className="text-[28px] md:text-[32px] font-light tracking-[0.28em] text-white">
                MEF + QL FRAMEWORK
              </h1>
            </div>
            <button
              onClick={onClose}
              className="text-[11px] uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors"
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
            <h2 className="text-[22px] font-light tracking-[0.2em] text-white mb-6">
              Installation & Usage
            </h2>
            <div className="space-y-4 text-[14px] leading-[2]">
              <p className="text-gray-200">
                This package provides a complete cognitive operating system combining <span className="text-white">Quaternal Logic (QL)</span> and the <span className="text-white">Meta-Epistemic Framework (MEF)</span>—two complementary systems for multi-dimensional reasoning and analysis.
              </p>
              <p className="text-gray-200">
                <span className="text-white">Quaternal Logic (QL)</span> provides the architectural logic: the mod6 framework (0-5) and tetralemma (is/is-not/both/neither) that structure all reasoning and enable holographic modeling.
              </p>
              <p className="text-gray-200">
                <span className="text-white">Meta-Epistemic Framework (MEF)</span> provides the analytical lenses: six complementary perspectives for investigating any domain and performing critical diagnosis of epistemic systems.
              </p>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mb-16 max-w-[900px]">
            <h2 className="text-[18px] font-light tracking-[0.2em] text-white mb-6">
              How to Use
            </h2>
            <div className="space-y-6 text-[13px] leading-[2]">
              <div>
                <h3 className="text-white font-light mb-2">Step 1: Installation</h3>
                <p className="text-gray-200">
                  Add the <span className="text-white">AI Agent Instructions</span> to your Gemini Gem, Custom GPT, or Claude Project instructions. Upload the <span className="text-white">QL</span> and <span className="text-white">MEF</span> prompt packages as knowledge files to your AI agent.
                </p>
              </div>
              <div>
                <h3 className="text-white font-light mb-2">Step 2: Activation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-200">For <span className="text-white">modeling/framing work</span>: "Apply the QL Modeling Heuristic to [topic]"</li>
                  <li className="text-gray-200">For <span className="text-white">analysis/critique work</span>: "Perform CMEA on [domain/concept]"</li>
                  <li className="text-gray-200">For <span className="text-white">complete investigation</span>: "Use both QL and MEF to explore [question]"</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-light mb-3">Key Principles and Guidance</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-300 font-light mb-2">1. Learn Through Use</p>
                    <p className="text-gray-200 text-[12px] leading-[1.9]">
                      The frameworks reveal themselves through practice. Don't try to master them theoretically first—dive in, experiment, let the structures guide your thinking. Each inquiry deepens your understanding of how QL and MEF operate.
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-light mb-2">2. Guide the Agent Back</p>
                    <p className="text-gray-200 text-[12px] leading-[1.9]">
                      AI naturally drifts from framework discipline over long conversations. When responses become generic or lose structure, redirect: "Return to the QL modeling" or "Apply CMEA here." The packages aren't magic—they require active engagement to maintain paradigm coherence.
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-light mb-2">3. Let Frameworks Transform Thinking</p>
                    <p className="italic text-gray-200 text-[12px] leading-[1.9]">
                      Don't just "apply frameworks"—let them transform how you think. QL changes the structure of reasoning itself; MEF reveals hidden dimensions in any epistemic system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Files Grid */}
          <div className="space-y-6 mb-16">
            <h2 className="text-[18px] font-light tracking-[0.2em] text-white mb-8">
              Package Components
            </h2>

            {packageFiles.map((file, index) => (
              <div
                key={file.id}
                className="border border-gray-800 bg-black/40 backdrop-blur-sm hover:border-gray-700 transition-colors"
              >
                <div className="p-8 md:p-10">
                  <div className="space-y-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] tracking-[0.4em] text-gray-600 uppercase">
                          File {index + 1}
                        </span>
                      </div>
                      <h3 className="text-[20px] md:text-[24px] font-light tracking-[0.15em] text-white mb-4">
                        {file.title}
                      </h3>
                      <p className="text-[13px] leading-[1.9] text-gray-200">
                        {file.description}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-4 font-mono">
                        {file.filename}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-700 text-gray-300 text-[10px] font-normal tracking-[2px] uppercase hover:bg-gray-900 hover:text-white transition-colors w-fit"
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
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-[11px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download All Files
              </button>
            </div>
          </div>

          {/* Example Inquiries Section */}
          {exampleInquiries.length > 0 && (
            <div className="mt-16 max-w-[1200px] border-t border-gray-800 pt-16">
              <h2 className="text-[18px] font-light tracking-[0.2em] text-white mb-6">
                Example Inquiries
              </h2>
              <p className="text-[13px] leading-[2] text-gray-200 mb-10 max-w-[900px]">
                See the frameworks in action. These full conversation transcripts demonstrate how QL and MEF transform inquiry—from modeling questions holographically to diagnosing epistemic systems.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {exampleInquiries.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedConversation(example.id)}
                    className="text-left border border-gray-800 bg-black/40 backdrop-blur-sm hover:border-gray-700 hover:bg-black/60 transition-all p-6 group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] tracking-[0.4em] text-gray-600 uppercase">
                        {example.framework}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-light tracking-[0.12em] text-white mb-3 group-hover:text-gray-100">
                      {example.title}
                    </h3>
                    <p className="text-[12px] leading-[1.8] text-gray-400">
                      {example.description}
                    </p>
                    <div className="mt-4 text-[10px] tracking-[0.3em] text-gray-600 uppercase group-hover:text-gray-500">
                      View Conversation →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="mt-16 max-w-[900px] bg-gray-900/30 border border-gray-800 p-8 rounded-sm">
            <h3 className="text-[16px] font-light tracking-[0.2em] text-white mb-4">
              We Want Your Feedback
            </h3>
            <p className="text-[13px] leading-[2] text-gray-200 mb-4">
              The frameworks evolve through active use. Every conversation reveals new patterns, every application surfaces questions we haven't yet considered. Your experience using these tools is invaluable data.
            </p>
            <p className="text-[12px] text-gray-300">
              Test them rigorously. Notice what works and what doesn't. Share where the frameworks bring clarity and where they introduce confusion. This is iterative development—philosophical systems refined through real-world practice.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
