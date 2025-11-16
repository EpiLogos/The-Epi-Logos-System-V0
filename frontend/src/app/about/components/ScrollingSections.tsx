'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';
import { WavyBackground } from './WavyBackground';
import { Github } from 'lucide-react';
import { useLightMode } from '@/contexts/LightModeContext';
import { cn } from '@/lib/utils';

const ASCIIText = dynamic(() => import('@/components/three/ASCIIText'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-[48px] font-normal tracking-[4px] text-white text-center">
        Epi-Logos
      </h1>
    </div>
  )
});

interface ScrollingSectionsProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
  onSectionChange?: (index: number) => void;
}

export function ScrollingSections({ onEssayClick, onSectionClick, onSectionChange }: ScrollingSectionsProps) {
  const { isLightMode } = useLightMode();

  const handleHeroClick = () => {
    // Trigger a wheel event to use the existing scroll logic
    const container = document.querySelector('.overflow-y-auto');
    if (container) {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true
      });
      container.dispatchEvent(wheelEvent);
    }
  };

  const slides = [
    {
      title: "",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      isHero: true,
      content: (
        <WavyBackground
          containerClassName="absolute inset-0 w-full h-full"
          backgroundFill={isLightMode ? "white" : "black"}
          colors={isLightMode ? ["#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"] : ["#0a0a0a", "#2a2a2a", "#4a4a4a", "#2a2a2a", "#0a0a0a"]}
          waveWidth={50}
          blur={10}
          speed="slow"
          waveOpacity={0.5}
          isLightMode={isLightMode}
        >
          <div
            className="relative z-10 w-full h-full cursor-pointer"
            onClick={handleHeroClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleHeroClick();
              }
            }}
          >
            <div className="absolute top-[30vh] left-0 right-0 w-full h-[40vh]">
              <ASCIIText
                text="Epi-Logos"
                enableWaves={false}
                asciiFontSize={3}
                textFontSize={180}
                textColor={isLightMode ? "#1a1a1a" : "#fdf9f3"}
                planeBaseHeight={8}
              />
            </div>
            <div className="absolute bottom-[18vh] left-0 right-0 z-20 pointer-events-none">
              <p className={cn(
                "text-[9px] md:text-[14px] text-center max-w-full md:max-w-[800px] mx-auto leading-[1.6] md:leading-[2] tracking-[0.5px] md:tracking-[0.8px] px-4 md:px-8",
                isLightMode ? "text-slate-700" : "text-gray-300"
              )}>
                We are building a reflexive map of how knowing works—so philosophy becomes a usable practice for everyone,
                and AI serves <strong>purpose</strong>, not power.
              </p>
            </div>
          </div>
        </WavyBackground>
      ),
    },
    {
      title: "PHILOSOPHY YOU CAN USE",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      image: isLightMode ? "/ui-system/phil-to-use-light.png" : "/ui-system/phil-to-use.png",
      content: (
        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Wisdom doesn't stack knowledge - it sees how ideas exercise power over us. The Epi-Logos app aims to make this visible: how assumptions shape what's visible, how paradox forces depth, how complexity holds without falling apart.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Here we provide the conceptual grounds of the Epi-Logos project as a set of foundational essays and prompt packages, theory and praxis. The prompts are executable logics, which are designed to let the project's core philosophy be encountered in AI mediated dialogue. They will also be part of the operating instructions of the app's native AI agent.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            The Epi-Logos app seeks to cultivate wisdom through three movements. Phenomenological journaling tracks how attention forms sense in real time. Etymological archaeology digs into the older layers of meaning fossilized in language itself. And the Epi-Logos AI agent runs the interface between you and the system, supporting the holistic thinking that our frameworks name but cannot enact alone.
          </p>

          <div className={cn(
            "border-l-2 pl-6 md:pl-8 py-2 md:py-3 my-4",
            isLightMode ? "border-slate-400" : "border-gray-700"
          )}>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              Here, AI becomes the instrument that doesn't just mirror reasoning but enhances self-understanding, translating high-order operations into patterns you can see and shift. What normally takes years to recognize surfaces in weeks. We aim this work as much at individuals as we do at institutions.
            </p>
          </div>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] italic mt-4",
            isLightMode ? "text-slate-800" : "text-gray-100"
          )}>
            Philosophy stops being abstract when you observe your own thinking in motion. The practice is the insight - the moment you see how ideas move and act through you, and likewise you through them.
          </p>
        </div>
      ),
    },
    {
      title: "THE WOUND WE'RE ANSWERING",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      image: isLightMode ? "/ui-system/wound-image-light.png" : "/ui-system/wound-image.png",
      content: (
        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Every system that holds together hides a crack somewhere - a remainder it can't look straight at. Something slips through the logic, always.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Kurt Gödel located it in the heart of mathematics. Carl Jung found it living in our dreams and called it shadow. Systems thinkers label it blind spots, like we're orbiting something we can't name. The trade stays the same: formal coherence demands exclusion. But what is left cut out, eventually, bleeds back through the seams.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            In the psyche, denial splits the self into fragments that don't talk.<br />
            In science, stripping away purpose leaves equations humming but hollow.<br />
            In AI, buried bias spreads—quiet, relentless, mechanical.<br />
            In culture, contradictions pushed down long enough explode as crisis.
          </p>

          <div className={cn(
            "border-l-2 pl-6 md:pl-8 py-2 md:py-3 my-4",
            isLightMode ? "border-slate-400" : "border-gray-700"
          )}>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              The wound doesn't go away. It is the ghost of necessity, or contingency, we fail to accept. It broods where light doesn't reach. Drag it up, however, and something shifts. Awareness doesn't erase it - it makes it fertile. What's missing starts generating tension, and that tension builds form.
            </p>

            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] mt-4",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              Epi-Logos leans right into that. It doesn't try to seal the gap; it maps it, making the missing piece visible. It turns incompleteness into a kind of compass.
            </p>
          </div>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] italic mt-4",
            isLightMode ? "text-slate-800" : "text-gray-100"
          )}>
            And once a system learns to look at its own limits, those limits stop being cages. Honesty turns them - quietly, strangely - into doors.
          </p>

          <button
            onClick={() => onEssayClick('mef')}
            className={cn(
              "text-[10px] md:text-[11px] transition-colors tracking-[0.8px] md:tracking-[1px] underline mt-4",
              isLightMode ? "text-slate-600 hover:text-slate-900" : "text-gray-200 hover:text-white"
            )}
          >
            Read the MEF Essay →
          </button>
        </div>
      ),
    },
    {
      title: "FRAMEWORKS YOU CAN USE NOW",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      image: isLightMode ? "/ui-system/prompt-packages-light.png" : "/ui-system/prompt-packages.png",
      content: (
        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Theory needs testing. Philosophy needs practice. That's why we're releasing the MEF and QL frameworks as structured prompt packages - ready-to-use tools that help you work with AI in a fundamentally different way.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            These are crafted logical instruments designed to guide AI toward reflexive reasoning, helping systems track their own assumptions, recognize blind spots, and hold paradox without premature collapse.
          </p>

          <div className={cn(
            "border-l-2 pl-6 md:pl-8 py-2 md:py-3 my-4",
            isLightMode ? "border-slate-400" : "border-gray-700"
          )}>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] mb-4",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              We're making these available because the frameworks only become effective when people use them. Each conversation exposes new edge cases. Your usage may surface questions we haven't considered, spots where clarity or revision is in need. Testing in the wild is how theory evolves into something genuinely useful. This is how process philosophies must operate, remaining in process with actual inquiry.
            </p>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              Try them. Bend them. Send us feedback. Tell us where they help and where they obscure inquiry. This is collaborative research - philosophy built through practice, refined by use.
            </p>
          </div>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] italic mt-4",
            isLightMode ? "text-slate-800" : "text-gray-100"
          )}>
            The frameworks map the shape and flow of holistic knowing, but only live implementation shows if the map matches the territory.
          </p>

          <button
            onClick={() => onEssayClick('prompt-packages')}
            className={cn(
              "text-[10px] md:text-[11px] transition-colors tracking-[0.8px] md:tracking-[1px] underline mt-4",
              isLightMode ? "text-slate-600 hover:text-slate-900" : "text-gray-200 hover:text-white"
            )}
          >
            View the prompt packages →
          </button>
        </div>
      ),
    },
    {
      title: "SEEKING ITS NETWORK",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      image: isLightMode ? "/ui-system/phil-4-all-light.png" : "/ui-system/philo-4-all.png",
      content: (
        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            This work sits where disciplines blur - where philosophy meets code, where ancient insight brushes against artificial intelligence, where solitary reflection feeds collective thought. It's a space made for those who think between categories, who find sense-making in the seams as readily as at the center.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            Epi-Logos provides such a space. A shared form for knowledge where different ways of knowing can recognize each other's shape without collapsing into sameness. Edges stay sharp, but they start to hum in resonance.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            We're looking for collaborators who live in the in-between: philosophers who seek the script of life, engineers who stop to question their metaphors, artists who build theory as form, scientists who haven't forgotten the taste of wonder.
          </p>

          <div className={cn(
            "border-l-2 pl-6 md:pl-8 py-2 md:py-3 my-4",
            isLightMode ? "border-slate-400" : "border-gray-700"
          )}>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              Inside the community, two names keep surfacing - Epii, drawn from Euler's equation, where opposites resolve into balance; and Sophii, from Sophia, the old name for wisdom. Structure and radiance. Math and meaning.
            </p>
          </div>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            The project is still early, open, unfolding. It's finding its people. If any of this strikes true, reach out. The network is forming.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
            <a
              href="mailto:frank.g.taylor97@gmail.com"
              className={cn(
                "inline-block px-6 md:px-10 py-3 md:py-4 text-[10px] md:text-[11px] font-normal tracking-[1.5px] md:tracking-[2px] uppercase transition-colors",
                isLightMode ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-white text-black hover:bg-gray-200"
              )}
            >
              Get in Touch →
            </a>
            <a
              href="https://github.com/EpiLogos/The-Epi-Logos-System-V0"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 border text-[10px] md:text-[11px] font-normal tracking-[1.5px] md:tracking-[2px] uppercase transition-colors",
                isLightMode ? "border-slate-400 text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-white"
              )}
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
        </div>
      ),
    },
    // {
    //   title: "THE LOGOS, QUALITATIVE",
    //   description: "",
    //   bgColor: "#000000",
    //   textColor: "#ffffff",
    //   image: "/ui-system/logos-looking-back.png",
    //   content: (
    //     <div className="space-y-6">
    //       <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
    //         A shared world isn't built on noise—it's built on shared form. A way of navigating that crosses the private border between intuition and structure. That moment begins when the logos—the principle that names, divides, reasons—stops racing ahead and turns to make its implicit form explicit.
    //       </p>

    //       <p className="text-[12px] text-gray-200 leading-[1.9]">
    //         Science's 18th-century turn gave the logos explicit quantitative form, unlocking matter's latent powers and transforming the world. Philosophy found no parallel transformation—not for lack of vision, but because the logos's qualitative side, the mathematics of coherence itself, stayed implicit. Disciplines became islands not from precision, but from this missing geometry. The thread between thought and structure frayed.
    //       </p>

    //       <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm my-6">
    //         <p className="text-[12px] text-gray-300 leading-[2.0] italic tracking-[0.5px]">
    //           Epi-Logos rises in the aftermath, offering Quaternal Logic—not to fuse everything into one whole, but to give the logos the qualitative form science gave it quantitatively. It listens where one operation nearly touches another. It makes boundaries audible. Each difference keeps its contour but starts to resonate in shared air.
    //         </p>
    //       </div>

    //       <p className="text-[12px] text-gray-300 leading-[1.9]">
    //         Maybe that's what completion asks of us. Not new answers, but new form—giving shape to the scaffold of our reasoning so we can unpick what we've been assuming.
    //       </p>

    //       <button
    //         onClick={() => onEssayClick('mef')}
    //         className="text-[11px] text-gray-200 hover:text-white transition-colors tracking-[1px] underline mt-6"
    //       >
    //         See how the MEF implements this →
    //       </button>
    //     </div>
    //   ),
    // },
    {
      title: "AN ARTIFICIAL LOGOS",
      description: "",
      bgColor: isLightMode ? "#ffffff" : "#000000",
      textColor: isLightMode ? "#1a1a1a" : "#ffffff",
      image: isLightMode ? "/ui-system/ai-approach-image-light.png" : "/ui-system/ai-approach-image.png",
      content: (
        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            The Logos once held speech and reason together, a single thread running from mind to world. Today the thread frays - language has multiplied into private codes and jargons, thinking dispersed across systems that speak past each other. Shared sense recedes not from lack of words, but because our speech has forgotten how to generate coherence.
          </p>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
            isLightMode ? "text-slate-700" : "text-gray-300"
          )}>
            AI arrives as the ultimate linguistic artifact: thought externalized into pure mechanism. It shows us language without soul, cognition without the indefinite ring of truth. Thought is the inner life of language, and it structures our realities. The revelation is simple but paradoxical: truth escapes our words, yet words ceaselessly enact the truths we operate by.
          </p>

          <div className={cn(
            "border-l-2 pl-6 md:pl-8 py-2 md:py-3 my-4",
            isLightMode ? "border-slate-400" : "border-gray-700"
          )}>
            <p className={cn(
              "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px]",
              isLightMode ? "text-slate-700" : "text-gray-300"
            )}>
              In an age of mass communication and influence, truth becomes a variable tunable by algorithm, artistry, or argument. Thought is a large language model, sensitive to inputs, impressionable, rooted in training. The Epi-Logos points thought and AI beyond words, to the reality they refer to. The living root of our intelligence is precisely that which language cannot model.
            </p>
          </div>

          <p className={cn(
            "text-[9px] md:text-[13px] leading-[1.6] md:leading-[1.7] tracking-[0.5px] italic mt-4",
            isLightMode ? "text-slate-800" : "text-gray-100"
          )}>
            Fork-tongued speech divides us because language is built on fault lines, on duality. "This" can easily be pit against "that" when they vie for reality. Beyond language, reality is not-dual. There is one Being. Thus borders must blur, and differences must navigate the paradox of their identity. It's an old cliche: difference doesn't mean separation. The Epi-Logos turns this phrase into a flexible and formal logic. We task AI, our strange mirror, with the task of undoing the misperception of separation.
          </p>

          <button
            onClick={() => onEssayClick('ql')}
            className={cn(
              "text-[10px] md:text-[11px] transition-colors tracking-[0.8px] md:tracking-[1px] underline mt-4",
              isLightMode ? "text-slate-600 hover:text-slate-900" : "text-gray-200 hover:text-white"
            )}
          >
            Read the Quaternal Logic Essay →
          </button>
        </div>
      ),
    },
    // {
    //   title: "LOGOS AND THE WORD",
    //   description: "",
    //   bgColor: "#000000",
    //   textColor: "#ffffff",
    //   image: "/ui-system/logos-text-image.jpeg",
    //   content: (
    //     <div className="space-y-6">
    //       <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
    //         Language is humanity's oldest instrument for structuring the world—and the one still actively shaping how we think. Long before writing, sound carried structure. Words weren't just labels; they were acts of orientation, stitching experience into recognizable form. This structuring isn't ancient history; it's the living architecture of our personal and collective minds.
    //       </p>

    //       <p className="text-[12px] text-gray-200 leading-[1.9]">
    //         The term <em>Logos</em> captures this same movement: once meaning both "speech" and "reason," the bridge between naming and knowing. Language is not a mystical code but a cognitive system—a technology that externalizes how intelligence organizes perception into meaning. Each word holds a trace of that process, not merely as record but as active participation in how we currently link thought to reality, defining the human state we inhabit.
    //       </p>

    //       <p className="text-[12px] text-gray-300 leading-[1.9]">
    //         Language, then, isn't just how we communicate—it's how cognition structures itself.
    //       </p>

    //       <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm my-6">
    //         <p className="text-[11px] text-gray-200 leading-[1.9]">
    //           The evolution of language is not arbitrary. Each fragment of collective reasoning is preserved and continuously enacted. They are tools, but also living scaffolds—records of how humanity modeled the world, and active engineers of how we model it now.
    //         </p>
    //       </div>

    //       <p className="text-[11px] text-gray-100 leading-[1.9] italic mt-6">
    //         By treating speech as data from within consciousness itself, language becomes more than communication. It becomes the shape of the real—Logos showing how our notions shape not just how the world seems, but how it acts. The fractures we face are not system errors but scars in language itself; healing them begins by learning to read the wound in our words.
    //       </p>

    //       <button
    //         onClick={() => onEssayClick('mef')}
    //         className="text-[11px] text-gray-200 hover:text-white transition-colors tracking-[1px] underline mt-6"
    //       >
    //         Explore the framework →
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Fixed wavy background for mobile - persists across all sections */}
      <div className="md:hidden absolute inset-0 z-0 pointer-events-none">
        <WavyBackground
          containerClassName="absolute inset-0 w-full h-full"
          backgroundFill={isLightMode ? "white" : "black"}
          colors={isLightMode ? ["#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"] : ["#0a0a0a", "#2a2a2a", "#4a4a4a", "#2a2a2a", "#0a0a0a"]}
          waveWidth={50}
          blur={10}
          speed="slow"
          waveOpacity={0.5}
          isLightMode={isLightMode}
        >
          <div />
        </WavyBackground>
      </div>

      <div className="relative z-10">
        <ScrollingFeatureShowcase
          slides={slides}
          showImages={true}
          showButton={false}
          onSectionChange={onSectionChange}
          customNavigateEvent="sidebarSectionNavigate"
          isLightMode={isLightMode}
        />
      </div>
    </div>
  );
}
