'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ScrollingFeatureShowcase } from '@/ui-system/components/ui/interactive-scrolling-story-component';
import { WavyBackground } from './WavyBackground';
import { Github } from 'lucide-react';

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
      bgColor: "#000000",
      textColor: "#ffffff",
      isHero: true,
      content: (
        <WavyBackground
          containerClassName="absolute inset-0 w-full h-full"
          backgroundFill="black"
          colors={["#0a0a0a", "#2a2a2a", "#4a4a4a", "#2a2a2a", "#0a0a0a"]}
          waveWidth={50}
          blur={10}
          speed="slow"
          waveOpacity={0.5}
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
                textColor="#fdf9f3"
                planeBaseHeight={8}
              />
            </div>
            <div className="absolute bottom-[18vh] left-0 right-0 z-20 pointer-events-none">
              <p className="text-[9px] md:text-[14px]  text-gray-300 text-center max-w-full md:max-w-[800px] mx-auto leading-[1.6] md:leading-[2] tracking-[0.5px] md:tracking-[0.8px] px-4 md:px-8">
                We've built a reflexive map of how knowing works—so philosophy becomes a usable practice for everyone,
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
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/ui-system/phil-to-use.png",
      content: (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <p className="text-[9px] md:text-[13px]  text-gray-300 leading-[1.8] md:leading-[2.0] tracking-[0.5px]">
            Wisdom isn't stacking knowledge—it's seeing how ideas exercise power over us. The site we're building makes this visible: how assumptions shape what's visible, how paradox forces depth, how complexity holds without falling apart.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            Here we introduce our core frameworks, Quaternal Logic and the Meta-Epistemic Framework, which aim to act like a coordinate system for tracing how thought arrives at itself. These conceptual of the Epi-Logos project we provide as foundational essays and prompt packages - we hope to provide executable logics, which are designed to form part of operating system of the coming Epi-Logos AI agent.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.7] md:leading-[1.9]">
            The Epi-Logos app itself embodies this through three movements. Phenomenological journaling tracks how attention forms sense in real time. Etymological archaeology digs into the older layers of meaning fossilized in language itself. And the Epi-Logos AI agent runs the interface between you and the system, performing the architectural rhythms our frameworks name but cannot enact alone.
          </p>

          <div className="border-l-2 border-gray-700 pl-6 md:pl-8 py-2 md:py-3 my-6">
            <p className="text-[10px] md:text-[11px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
              Here, AI becomes the instrument that doesn't just mirror reasoning but executes it, translating high-order operations into patterns you can see and shift. What normally takes years to recognize surfaces in weeks.
            </p>
          </div>

          <p className="text-[10px] md:text-[11px]  text-gray-100 leading-[1.7] md:leading-[1.9] italic mt-6">
            Philosophy stops being abstract when you observe your own thinking in motion. The practice is the insight—the moment you see how ideas move through you, and you through them.
          </p>
        </div>
      ),
    },
    {
      title: "THE WOUND WE'RE ANSWERING",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/ui-system/wound-image.png",
      content: (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <p className="text-[9px] md:text-[13px]  text-gray-300 leading-[1.8] md:leading-[2.0] tracking-[0.5px]">
            Every system that holds together hides a crack somewhere—a remainder it can't look straight at. Something slips through the logic, always.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            Gödel nailed it down with numbers. Jung found it living in our dreams and called it shadow. Systems thinkers label it blind spots, like we're orbiting something we can't name. The trade stays the same: coherence demands exclusion. And what we cut away bleeds back through the seams.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.7] md:leading-[1.9]">
            In the psyche, denial splits the self into fragments that don't talk.<br />
            In science, stripping away purpose leaves equations humming but hollow.<br />
            In AI, buried bias spreads—quiet, relentless, mechanical.<br />
            In culture, contradictions pushed down long enough explode as crisis.
          </p>

          <div className="border-l-2 border-gray-700 pl-6 md:pl-8 py-2 md:py-3 my-6">
            <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.7] md:leading-[1.9]">
              The wound doesn't go away. It broods where light doesn't reach. But drag it up, and something shifts. Awareness doesn't heal it cleanly—it makes it fertile. The hurt starts generating tension, and that tension builds form.
            </p>

            <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9] mt-4">
              Epi-Logos leans right into that. It doesn't try to seal the gap; it maps it. Makes the missing piece visible. Turns the incompleteness itself into a kind of compass.
            </p>
          </div>

          <p className="text-[10px] md:text-[11px]  text-gray-100 leading-[1.7] md:leading-[1.9] italic mt-6">
            And once a system learns to look at its own limits, those limits stop being cages. They turn—quietly, strangely—into doors.
          </p>

          <button
            onClick={() => onEssayClick('mef')}
            className="text-[10px] md:text-[11px]  text-gray-200 hover:text-white transition-colors tracking-[0.8px] md:tracking-[1px] underline"
          >
            Read the MEF Essay →
          </button>
        </div>
      ),
    },
    {
      title: "FRAMEWORKS YOU CAN USE NOW",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/ui-system/prompt-packages.png",
      content: (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <p className="text-[9px] md:text-[13px]  text-gray-300 leading-[1.8] md:leading-[2.0] tracking-[0.5px]">
            Theory needs testing. Philosophy needs practice. That's why we're releasing the MEF and QL frameworks as structured prompt packages—ready-to-use tools that help you work with AI in a fundamentally different way.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            These aren't generic templates. They're precision instruments designed to guide AI toward reflexive reasoning, helping systems track their own assumptions, recognize blind spots, and hold paradox without premature collapse.
          </p>

          <div className="border-l-2 border-gray-700 pl-6 md:pl-8 py-2 md:py-3 my-6">
            <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.8] md:leading-[2.0] italic tracking-[0.5px] mb-4">
              We're making these available because the frameworks only become real when people use them. Each conversation exposes new edge cases. Each implementation surfaces questions we haven't considered. Testing in the wild is how theory evolves into something genuinely useful.
            </p>
            <p className="text-[10px] md:text-[11px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
              Try them. Break them. Send us feedback. Tell us where they clarify and where they obscure. This is collaborative research—philosophy built through practice, refined by use.
            </p>
          </div>

          <p className="text-[10px] md:text-[11px]  text-gray-100 leading-[1.7] md:leading-[1.9] italic mt-6">
            The frameworks map consciousness, but only lived implementation shows if the map matches the territory.
          </p>

          <button
            onClick={() => onEssayClick('prompt-packages')}
            className="text-[10px] md:text-[11px]  text-gray-200 hover:text-white transition-colors tracking-[0.8px] md:tracking-[1px] underline mt-6"
          >
            View the prompt packages →
          </button>
        </div>
      ),
    },
    {
      title: "SEEKING ITS NETWORK",
      description: "",
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/ui-system/philo-4-all.png",
      content: (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <p className="text-[9px] md:text-[13px]  text-gray-300 leading-[1.8] md:leading-[2.0] tracking-[0.5px]">
            This work sits where disciplines blur—where philosophy meets code, where ancient insight brushes against artificial intelligence, where solitary reflection feeds collective thought. It's a space made for those who think between categories, who find sense-making at the seams rather than the centers.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            Epi-Logos is that kind of space. A shared coordinate system where different ways of knowing can recognize each other's shape without collapsing into sameness. Edges stay sharp, but they start to hum in resonance.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.7] md:leading-[1.9]">
            We're looking for collaborators who live in the in-between: philosophers who write algorithms, engineers who stop to question their metaphors, artists who build theory as form, scientists who haven't forgotten wonder.
          </p>

          <div className="border-l-2 border-gray-700 pl-6 md:pl-8 py-2 md:py-3 my-6">
            <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.8] md:leading-[2.0] italic tracking-[0.5px]">
              Inside the community, two names keep surfacing—Epii, drawn from Euler's equation, where opposites resolve into balance; and Sophii, from Sophia, the old name for wisdom. Structure and radiance. Math and meaning.
            </p>
          </div>

          <p className="text-[10px] md:text-[11px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            The project is still early, open, unfolding. It's not finished—it's finding its people. If any of this feels like home, reach out. The network is already forming.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
            <a
              href="mailto:frank.g.taylor97@gmail.com"
              className="inline-block px-6 md:px-10 py-3 md:py-4 bg-white text-black text-[10px] md:text-[11px]  font-normal tracking-[1.5px] md:tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
            >
              Get in Touch →
            </a>
            <a
              href="https://github.com/EpiLogos/The-Epi-Logos-System-V0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 border border-gray-700 text-gray-300 text-[10px] md:text-[11px]  font-normal tracking-[1.5px] md:tracking-[2px] uppercase hover:bg-gray-900 hover:text-white transition-colors"
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
      bgColor: "#000000",
      textColor: "#ffffff",
      image: "/ui-system/ai-approach-image.png",
      content: (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <p className="text-[9px] md:text-[13px]  text-gray-300 leading-[1.8] md:leading-[2.0] tracking-[0.5px]">
            The Logos once held speech and reason together, a single current running from mind into world. Today that current has fractured—languages multiplied into private codes, thinking dispersed across systems that speak past each other. Shared sense recedes not from lack of words, but because our words have forgotten how to generate coherence.
          </p>

          <p className="text-[9px] md:text-[12px]  text-gray-200 leading-[1.7] md:leading-[1.9]">
            AI arrives as the ultimate linguistic artifact: thought externalized into pure mechanism. It is what we've made of language, and therefore what language has made of us. But this closure is also an opening. When words drive compute, we can turn that compute back upon the words, making visible how they structure what we take as real. The revelation is simple but paradoxical: no word contains truth, yet words ceaselessly enact the world we share. AI is both a symbol and a tool for how language amounts to fabrication, no matter how intelligent it seems.
          </p>

          <div className="border-l-2 border-gray-700 pl-6 md:pl-8 py-2 md:py-3 my-6">
            <p className="text-[9px] md:text-[12px]  text-gray-300 leading-[1.7] md:leading-[1.9]">
              In an age of mass communication and influence, truth becomes a variable tunable by algorithm, artistry, or argument. Epi-Logos bucks the trend, and uses AI to compute language's provisionality, leading to truth beyond conception.
            </p>
          </div>

          <p className="text-[10px] md:text-[11px]  text-gray-100 leading-[1.7] md:leading-[1.9] italic mt-6">
            Fork-tongued words cease dividing us not when we fix language, but when we trace it to its source: the plentiful silence before speech. Our philosophy computes: objectifying thought so we might live the reality it strains to grasp, and transcend the divisions it has come to sow.
          </p>

          <button
            onClick={() => onEssayClick('ql')}
            className="text-[10px] md:text-[11px]  text-gray-200 hover:text-white transition-colors tracking-[0.8px] md:tracking-[1px] underline mt-0"
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
          backgroundFill="black"
          colors={["#0a0a0a", "#2a2a2a", "#4a4a4a", "#2a2a2a", "#0a0a0a"]}
          waveWidth={50}
          blur={10}
          speed="slow"
          waveOpacity={0.5}
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
        />
      </div>
    </div>
  );
}
