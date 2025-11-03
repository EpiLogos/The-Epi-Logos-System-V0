'use client';

import React from 'react';

interface EssayViewProps {
  essayId: string | null;
}

export function EssayView({ essayId }: EssayViewProps) {
  if (!essayId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-gray-600">
        <p className="text-[11px] tracking-[2px]">SELECT AN ESSAY OR DOCUMENT</p>
      </div>
    );
  }

  // Placeholder content for different essays
  const getEssayContent = () => {
    switch (essayId) {
      case 'mef':
        return {
          title: 'META-EPISTEMIC FRAMEWORK (MEF)',
          subtitle: 'Six Lenses, Thirty-Six Coordinates',
          content: `
            <p>The Meta-Epistemic Framework (MEF) is a comprehensive reflective instrument that maps the structure of knowing itself.</p>

            <h3>The Six Lenses</h3>
            <ul>
              <li><strong>Lens 0 (Archetypal):</strong> Pattern and number as proto-logical ground</li>
              <li><strong>Lens 1 (Causal):</strong> The four causes (efficient, material, formal, final)</li>
              <li><strong>Lens 2 (Logical):</strong> Classical and quaternal logic structures</li>
              <li><strong>Lens 3 (Processual):</strong> Becoming, dialectic, and temporal unfolding</li>
              <li><strong>Lens 4 (Meta-Epistemic):</strong> Phenomenology and reflexive knowing</li>
              <li><strong>Lens 5 (Divine-Scalar):</strong> Levels of being and transcendence</li>
            </ul>

            <h3>The Thirty-Six Coordinates</h3>
            <p>Each lens contains six internal positions (0-5), creating a 6×6 = 36-coordinate manifold. This structure enables:</p>
            <ul>
              <li>Precise mapping of epistemic positions</li>
              <li>Cross-lens navigation and integration</li>
              <li>Systematic detection of blind spots</li>
              <li>Reflexive self-correction (5→0′ recursion)</li>
            </ul>

            <p><em>Full essay content will be loaded here...</em></p>
          `
        };

      case 'ql':
        return {
          title: 'QUATERNAL LOGIC (QL)',
          subtitle: 'The Generative Invariant Behind Wholeness',
          content: `
            <p>Quaternal Logic (QL) is the structural law governing how "the many become one and are increased by one" (Whitehead).</p>

            <h3>The Four + Two Topology</h3>
            <p>QL operates on a 4+2 structure:</p>
            <ul>
              <li><strong>The Four (1-4):</strong> Explicit manifestation and differentiation</li>
              <li><strong>The Two (0/5):</strong> Implicit ground and transcendent closure</li>
            </ul>

            <h3>The Tetralemma</h3>
            <p>Inherited from Nāgārjuna, the complete logical space:</p>
            <ul>
              <li>Is (affirmation)</li>
              <li>Is-not (negation)</li>
              <li>Both (conjunction)</li>
              <li>Neither (transcendence)</li>
            </ul>

            <p><em>Full essay content will be loaded here...</em></p>
          `
        };

      case 'cmea':
        return {
          title: 'CRITICAL META-EPISTEMIC ANALYSIS (CMEA)',
          subtitle: 'A Diagnostic Method for Integration',
          content: `
            <p>CMEA is the practical method for diagnosing epistemic fragmentation and navigating toward integration.</p>

            <h3>The Five Steps</h3>
            <ol>
              <li><strong>Diagnose Emphasis:</strong> Identify which lenses are active and which are suppressed</li>
              <li><strong>Detect Shadow:</strong> Locate the compensatory opposite or excluded perspective</li>
              <li><strong>Interpret Return:</strong> Understand why the shadow re-emerges (as symptom or paradox)</li>
              <li><strong>Integrate:</strong> Re-contextualize both emphasis and shadow within the larger structure</li>
              <li><strong>Re-Ground:</strong> Allow synthesis (5) to open into new ground (0′)</li>
            </ol>

            <h3>Ethos: Critical Compassion</h3>
            <p>CMEA embodies critical compassion—loving sensitivity to origins combined with disciplined discrimination.</p>

            <p><em>Full primer content will be loaded here...</em></p>
          `
        };

      default:
        return {
          title: 'DOCUMENT NOT FOUND',
          subtitle: '',
          content: '<p>The requested document could not be loaded.</p>'
        };
    }
  };

  const essay = getEssayContent();

  return (
    <div className="w-full min-h-screen bg-black text-white p-16">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-12 border-b border-gray-800 pb-6">
          <h1 className="text-[28px] font-normal tracking-[3px] text-white mb-2">
            {essay.title}
          </h1>
          {essay.subtitle && (
            <p className="text-[12px] text-gray-500 tracking-[1px]">
              {essay.subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: essay.content }}
          style={{
            fontSize: '13px',
            lineHeight: '1.9',
            color: '#d1d5db'
          }}
        />

        {/* Back Button */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <button
            onClick={() => window.history.back()}
            className="text-[11px] text-gray-500 hover:text-white transition-colors tracking-[1px]"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
}
