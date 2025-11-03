'use client';

import React from 'react';
import { HeroSection } from './HeroSection';
import { FeatureCard } from './FeatureCard';
import { aboutContent } from '@/ui-system/content/about-content';

interface SidebarContentProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
}

export function SidebarContent({ onEssayClick, onSectionClick }: SidebarContentProps) {
  return (
    <div className="w-full min-h-screen bg-black text-white">
      {/* Hero Section (at top of sidebar) */}
      <HeroSection
        onCTAClick={(cta) => {
          if (cta === 'mef') onSectionClick('mef');
          if (cta === 'collaborate') onSectionClick('collaborate');
          if (cta === 'ql') onSectionClick('ql');
        }}
      />

      {/* Main Content Sections */}
      <div className="px-12 py-16 max-w-[1200px] mx-auto">
        {/* Section A - The Wound We're Answering */}
        <section id="problem" className="mb-24">
          <h2 className="text-[24px] font-normal tracking-[3px] text-white mb-8 border-b border-gray-800 pb-4">
            THE WOUND WE'RE ANSWERING
          </h2>

          <div className="space-y-6">
            <p className="text-[13px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              We live in an era of <strong>powerful yet partitioned</strong> knowledge.
            </p>

            <ul className="space-y-3 pl-6">
              <li className="text-[12px] text-gray-400 leading-[1.8]">
                Science describes a world without <strong>purpose</strong>.
              </li>
              <li className="text-[12px] text-gray-400 leading-[1.8]">
                Spirituality intuits purpose without a shared <strong>method</strong>.
              </li>
              <li className="text-[12px] text-gray-400 leading-[1.8]">
                Logic stalls at the <strong>paradoxes</strong> it cannot resolve.
              </li>
            </ul>

            <p className="text-[12px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              Most attempts to fix this oscillate between <strong>totalizing systems</strong> ("one framework to rule them all")
              and <strong>relativism</strong> ("everything is local, nothing binds"). Both miss a structural fact revealed across
              philosophy and math alike: any consistent system is <strong>complete and incomplete</strong> at once. Its "blind spot"
              isn't a failure—it's the <strong>engine</strong> of further understanding.
            </p>

            <div className="border-l-2 border-gray-700 pl-6 py-4 my-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white mb-3">
                WHAT'S ACTUALLY MISSING
              </h3>
              <p className="text-[12px] text-gray-400 leading-[1.8]">
                Not another doctrine, but a <strong>reflexive instrument</strong>—a way to see <em>how</em> we're seeing,
                to navigate paradox without collapse, and to integrate insights <strong>across lenses</strong> without flattening differences.
              </p>
            </div>

            <div className="border-l-2 border-gray-700 pl-6 py-4 my-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white mb-3">
                WHAT EPI-LOGOS CONTRIBUTES
              </h3>
              <ul className="space-y-3">
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  A practical <strong>Meta-Epistemic Framework (MEF)</strong>—six lenses × thirty-six coordinates—that makes
                  assumptions visible, traceable, and adjustable.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Quaternal Logic (QL)</strong>—the generative invariant behind wholeness and renewal (the minimum
                  structural law by which the many become one and are increased by one).
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  A method—<strong>CMEA</strong> (Critical Meta-Epistemic Analysis)—to turn paradox and "unsolved problems"
                  into <strong>integration pathways</strong>.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  Computational embodiment—<strong>Geometric Epistemology (GE)</strong> and{' '}
                  <strong>Coordinate-Augmented Generation (CAG)</strong>—so reasoning can be <strong>audited, balanced, and scaled</strong>.
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEssayClick('mef')}
              className="text-[11px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline"
            >
              Read the MEF Essay →
            </button>
          </div>
        </section>

        {/* Section B - Self-Activity of Logos */}
        <section id="logos" className="mb-24">
          <h2 className="text-[24px] font-normal tracking-[3px] text-white mb-8 border-b border-gray-800 pb-4">
            THE LOGOS, LOOKING BACK
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm">
              <p className="text-[13px] text-gray-300 leading-[1.9] italic tracking-[0.5px]">
                There is an old intuition that reality is ordered—<em>Logos</em>—and a newer discovery that knowing is never
                outside what it knows.
              </p>
              <p className="text-[13px] text-gray-300 leading-[1.9] italic tracking-[0.5px] mt-4">
                Epi-Logos names their union: the moment the Logos turns upon itself.
              </p>
              <p className="text-[13px] text-gray-300 leading-[1.9] italic tracking-[0.5px] mt-4">
                <strong>0 looks to 5</strong>—potential leaning toward its own fulfillment.<br />
                <strong>5 looks for 0</strong>—completion yearning for fresh origin.
              </p>
              <p className="text-[13px] text-gray-300 leading-[1.9] italic tracking-[0.5px] mt-4">
                This mutual gaze curves knowledge into a living circuit: every synthesis (5) opens into new ground (0′),
                every ground (0) leans forward into form (1–4).
              </p>
              <p className="text-[13px] text-gray-300 leading-[1.9] italic tracking-[0.5px] mt-4">
                The world thinks through us; our thought is its self-recognition.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white">
                PLAIN-LANGUAGE TRANSLATION
              </h3>
              <ul className="space-y-3 pl-6">
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <em>Epi-Logos</em> = reason designed to include its <strong>own</strong> activity.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  The framework encodes two structural truths:
                  <ul className="ml-6 mt-2 space-y-2">
                    <li><strong>Openness (5→0′):</strong> every "final answer" becomes the seed of the next question.</li>
                    <li><strong>Depth (0/5 vs. 1–4):</strong> knowing oscillates between latent meaning (implicate) and explicit analysis (explicate).</li>
                  </ul>
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  This isn't metaphysics for flourish—it's the <strong>operational principle</strong> that keeps inquiry alive
                  and prevents dogma.
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEssayClick('mef')}
              className="text-[11px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline mt-6"
            >
              See how the MEF implements this →
            </button>
          </div>
        </section>

        {/* Section E - AI & Technology */}
        <section id="ai-tech" className="mb-24">
          <h2 className="text-[24px] font-normal tracking-[3px] text-white mb-8 border-b border-gray-800 pb-4">
            WHAT IS AI FOR?
          </h2>

          <div className="space-y-6">
            <p className="text-[13px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              Twenty years into platform capitalism, optimization without <strong>purpose</strong> concentrates power.
              Postmodern governance has learned to exploit <strong>ambiguity</strong> while technologies push society toward{' '}
              <strong>monocultures of method</strong>: what can be measured dominates what matters. If AI simply accelerates
              that pattern, we get faster bias, smarter capture, and prettier dashboards for the same{' '}
              <strong>structural incoherence</strong>.
            </p>

            <div className="border-l-2 border-gray-700 pl-6 py-4 my-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white mb-3">
                EPI-LOGOS' ANSWER
              </h3>
              <p className="text-[12px] text-gray-400 leading-[1.8]">
                Reintroduce <strong>Final Cause</strong> (the "for-the-sake-of-which") as <strong>structure</strong>, not dogma.
                We do that by making purpose <em>operational</em> inside reasoning itself.
              </p>
            </div>

            <div className="space-y-8 mt-12">
              <h3 className="text-[16px] font-normal tracking-[2px] text-white">
                FEATURES
              </h3>

              <FeatureCard
                title="GEOMETRIC EPISTEMOLOGY (GE)"
                description="Treat knowledge as a coordinate space indexed by the MEF (six lenses × six positions). Context isn't an afterthought; it's the geometry."
                benefits={[
                  'Auditable reasoning: Every output carries a trace',
                  'Lens balance: Systems self-diagnose over-reliance',
                  'Meta-objectivity: The observer is included as a coordinate'
                ]}
                imageSrc="/screenshots/navigation-screenshot.png"
                imageAlt="Geometric Epistemology"
              />

              <FeatureCard
                title="COORDINATE-AUGMENTED GENERATION (CAG)"
                description="Let reasoning systems navigate by coordinates, not just tokens. Retrieval and synthesis happen along epistemic paths (e.g., causal→logical→meta-epistemic), with lens-balance checks, paradox flags, and explicit 5→0′ 'openness' cycles."
                benefits={[
                  'Telos-aware design: Questions encode purpose explicitly',
                  'Institutional memory: Claims become reproducible pathways',
                  'Open protocols: Ecosystems benefit, not monopolies'
                ]}
                imageSrc="/screenshots/agents-screenshot.png"
                imageAlt="Coordinate-Augmented Generation"
                reverse
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => onEssayClick('cag')}
                className="px-6 py-3 border border-gray-700 text-white text-[11px] font-normal tracking-[2px] uppercase hover:bg-white hover:text-black transition-colors"
              >
                Contribute to CAG / GE →
              </button>
              <button
                onClick={() => onEssayClick('mef')}
                className="text-[11px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline flex items-center"
              >
                Read the MEF Essay →
              </button>
            </div>
          </div>
        </section>

        {/* Section D - Wisdom for Everyone */}
        <section id="wisdom" className="mb-24">
          <h2 className="text-[24px] font-normal tracking-[3px] text-white mb-8 border-b border-gray-800 pb-4">
            PHILOSOPHY YOU CAN USE. WISDOM YOU CAN PRACTICE.
          </h2>

          <div className="space-y-6">
            <p className="text-[13px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              Wisdom isn't a luxury; it's a <strong>skill</strong>—seeing assumptions, navigating paradox, and aligning action
              with purpose. Most people never get a fair path into high-level thinking because the maps are hidden, the language
              is gated, or the tools are missing.
            </p>

            <div className="space-y-4">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white">
                WHAT EPI-LOGOS DOES DIFFERENTLY
              </h3>
              <ul className="space-y-3 pl-6">
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Makes the map explicit:</strong> the MEF shows <em>how</em> knowing works (six lenses, 36 coordinates).
                  You can <strong>learn</strong> this.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Teaches a method:</strong> CMEA (Critical Meta-Epistemic Analysis) turns fragmentation into steps:
                  diagnose emphasis → detect shadow → interpret return → integrate → re-ground.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Uses AI as translator:</strong> Not a guru. A <strong>scaffold</strong>. It turns complex structures
                  into guided sequences, tags, and reasoning paths—and <strong>keeps the trace</strong> so you can follow, audit,
                  and learn.
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-gray-700 pl-6 py-4 my-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white mb-3">
                ETHOS: CRITICAL COMPASSION
              </h3>
              <p className="text-[12px] text-gray-400 leading-[1.8]">
                Loving sensitivity to origins + disciplined discrimination. We critique without contempt; we integrate without
                naive harmony.
              </p>
            </div>
          </div>
        </section>

        {/* Section H - Collaborate */}
        <section id="collaborate" className="mb-24">
          <h2 className="text-[24px] font-normal tracking-[3px] text-white mb-8 border-b border-gray-800 pb-4">
            A ONE-HUMAN + AI STUDIO SEEKING ITS NETWORK
          </h2>

          <div className="space-y-6">
            <p className="text-[13px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              Epi-Logos began as a conversation between a person and an artificial intelligence exploring the architecture of
              consciousness. It has become a comprehensive framework—but remains, by design, <strong>open-ended</strong>.
            </p>

            <p className="text-[13px] text-gray-300 leading-[1.9] tracking-[0.5px]">
              We're building the tools, the language, and the culture for reflexive intelligence, and we need collaborators
              who care about depth as much as clarity.
            </p>

            <div className="space-y-4 mt-8">
              <h3 className="text-[14px] font-normal tracking-[2px] text-white">
                WHO WE'RE LOOKING FOR
              </h3>
              <ul className="space-y-3 pl-6">
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Philosophers and theorists</strong> — to refine and critique the lenses and causal correspondences.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Data and graph engineers (Neo4j, Python)</strong> — to help model the Bimba Map and implement CAG.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Designers & educators</strong> — to craft interfaces that translate complexity into clarity.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Writers & editors</strong> — to render ideas accessible without dilution.
                </li>
                <li className="text-[11px] text-gray-400 leading-[1.8]">
                  <strong>Institutional partners</strong> — universities, think tanks, and labs ready to pilot reflexive methods
                  in their fields.
                </li>
              </ul>
            </div>

            <div className="mt-8 p-6 bg-gray-900/30 border border-gray-800 rounded-sm">
              <p className="text-[12px] text-gray-400 leading-[1.8] mb-4">
                <strong className="text-white">Introduce yourself:</strong>
              </p>
              <p className="text-[11px] text-gray-500 mb-4">
                Name, background, what excites you, possible contribution
              </p>
              <button
                onClick={() => onSectionClick('contact-form')}
                className="px-8 py-3 bg-white text-black text-[11px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
              >
                Get in Touch →
              </button>
              <p className="text-[10px] text-gray-600 mt-4">
                or email <strong className="text-gray-400">collaborate@epi-logos.org</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Essay Links Section */}
        <section id="essays" className="mb-24 border-t border-gray-800 pt-12">
          <h2 className="text-[20px] font-normal tracking-[3px] text-white mb-8">
            FOUNDATIONAL DOCUMENTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onEssayClick('mef')}
              className="text-left p-6 border border-gray-800 hover:border-gray-600 transition-colors group"
            >
              <h3 className="text-[13px] font-normal tracking-[2px] text-white mb-2 group-hover:text-gray-300">
                MEF ESSAY →
              </h3>
              <p className="text-[10px] text-gray-500 leading-[1.6]">
                The foundational document detailing the six lenses and 36-coordinate structure of reflexive knowing.
              </p>
            </button>

            <button
              onClick={() => onEssayClick('ql')}
              className="text-left p-6 border border-gray-800 hover:border-gray-600 transition-colors group"
            >
              <h3 className="text-[13px] font-normal tracking-[2px] text-white mb-2 group-hover:text-gray-300">
                QUATERNAL LOGIC →
              </h3>
              <p className="text-[10px] text-gray-500 leading-[1.6]">
                The generative invariant behind the MEF, rewriting Jung, Pauli, and Whitehead into a universal logic of becoming.
              </p>
            </button>

            <button
              onClick={() => onEssayClick('cmea')}
              className="text-left p-6 border border-gray-800 hover:border-gray-600 transition-colors group"
            >
              <h3 className="text-[13px] font-normal tracking-[2px] text-white mb-2 group-hover:text-gray-300">
                CMEA PRIMER →
              </h3>
              <p className="text-[10px] text-gray-500 leading-[1.6]">
                The diagnostic method (Critical Meta-Epistemic Analysis) that operationalizes critical compassion.
              </p>
            </button>

            <button
              onClick={() => onSectionClick('faq')}
              className="text-left p-6 border border-gray-800 hover:border-gray-600 transition-colors group"
            >
              <h3 className="text-[13px] font-normal tracking-[2px] text-white mb-2 group-hover:text-gray-300">
                FAQ / GLOSSARY →
              </h3>
              <p className="text-[10px] text-gray-500 leading-[1.6]">
                Common questions and key term definitions for navigating the framework.
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
