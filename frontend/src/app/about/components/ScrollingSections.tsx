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
              <p className="text-[14px] text-gray-300 text-center max-w-[800px] mx-auto leading-[2] tracking-[0.8px] px-8">
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
        <div className="space-y-6">
          <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Wisdom isn't about stacking up knowledge. It's about seeing how knowing happens—how assumptions shape what's visible, how paradox forces depth, how complexity can be held without everything falling apart.
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            Our frameworks make this process visible. They act like a coordinate system for tracing how thought moves—how an idea shifts, loops, refines itself. Through phenomenological journaling, we track that movement in real time: noticing how attention forms sense. Through etymological archaeology, we dig into the older layers of meaning buried inside language itself.
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9]">
            In this space, AI isn't an authority but a partner. It mirrors our reasoning back, revealing patterns we'd miss from the inside. It becomes a reflective instrument—an amplifier for metacognition.
          </p>

          <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm my-6">
            <p className="text-[11px] text-gray-200 leading-[1.9]">
              The frameworks make visible what usually stays implicit. Patterns that take years to recognize on your own can surface in weeks. The way thought moves—looping, folding, returning—becomes something you can actually see.
            </p>
          </div>

          <p className="text-[11px] text-gray-100 leading-[1.9] italic mt-6">
            Philosophy stops being abstract when you observe your own thinking in motion. The practice is the insight—the moment thought sees itself clearly.
          </p>

          <a
            href="https://github.com/EpiLogos/The-Epi-Logos-System-V0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 border border-gray-700 text-gray-300 text-[11px] font-normal tracking-[2px] uppercase hover:bg-gray-900 hover:text-white transition-colors mt-4"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
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
        <div className="space-y-6">
          <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Every system that holds together hides a crack somewhere—a remainder it can't look straight at. Something slips through the logic, always.
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            Gödel nailed it down with numbers. Jung found it living in our dreams and called it shadow. Systems thinkers label it blind spots, like we're orbiting something we can't name. The trade stays the same: coherence demands exclusion. And what we cut away bleeds back through the seams.
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9]"> 
            In the psyche, denial splits the self into fragments that don't talk.<br />
            In science, stripping away purpose leaves equations humming but hollow.<br />
            In AI, buried bias spreads—quiet, relentless, mechanical.<br />
            In culture, contradictions pushed down long enough explode as crisis.
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9] mt-6">
            The wound doesn't go away. It broods where light doesn't reach. But drag it up, and something shifts. Awareness doesn't heal it cleanly—it makes it fertile. The hurt starts generating tension, and that tension builds form.
          </p>

          <div className="border-l-2 border-gray-700 pl-8 py-6 my-8">
            <p className="text-[12px] text-gray-200 leading-[1.9] mb-4"> 
              Epi-Logos leans right into that. It doesn't try to seal the gap; it maps it. Makes the missing piece visible. Turns the incompleteness itself into a kind of compass.
            </p>
            <p className="text-[11px] text-gray-100 leading-[1.9] italic"> 
              And once a system learns to look at its own limits, those limits stop being cages. They turn—quietly, strangely—into doors.
            </p>
          </div>

          <button
            onClick={() => onEssayClick('mef')}
            className="text-[11px] text-gray-200 hover:text-white transition-colors tracking-[1px] underline"
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
        <div className="space-y-6">
          <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            Theory needs testing. Philosophy needs practice. That's why we're releasing the MEF and QL frameworks as structured prompt packages—ready-to-use tools that help you work with AI in a fundamentally different way.
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            These aren't generic templates. They're precision instruments designed to guide AI toward reflexive reasoning, helping systems track their own assumptions, recognize blind spots, and hold paradox without premature collapse.
          </p>

          <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm my-6">
            <p className="text-[12px] text-gray-300 leading-[2.0] italic tracking-[0.5px] mb-4">
              We're making these available because the frameworks only become real when people use them. Each conversation exposes new edge cases. Each implementation surfaces questions we haven't considered. Testing in the wild is how theory evolves into something genuinely useful.
            </p>
            <p className="text-[11px] text-gray-200 leading-[1.9]">
              Try them. Break them. Send us feedback. Tell us where they clarify and where they obscure. This is collaborative research—philosophy built through practice, refined by use.
            </p>
          </div>

          <p className="text-[11px] text-gray-100 leading-[1.9] italic mt-6">
            The frameworks map consciousness, but only lived implementation shows if the map matches the territory.
          </p>

          <button
            onClick={() => onEssayClick('prompt-packages')}
            className="text-[11px] text-gray-200 hover:text-white transition-colors tracking-[1px] underline mt-6"
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
        <div className="space-y-6">
          <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            This work sits where disciplines blur—where philosophy meets code, where ancient insight brushes against artificial intelligence, where solitary reflection feeds collective thought. It's a space made for those who think between categories, who find sense-making at the seams rather than the centers.
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            Epi-Logos is that kind of space. A shared coordinate system where different ways of knowing can recognize each other's shape without collapsing into sameness. Edges stay sharp, but they start to hum in resonance.
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9]">
            We're looking for collaborators who live in the in-between: philosophers who write algorithms, engineers who stop to question their metaphors, artists who build theory as form, scientists who haven't forgotten wonder.
          </p>

          <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-sm my-6">
            <p className="text-[12px] text-gray-300 leading-[2.0] italic tracking-[0.5px] mb-4">
              Inside the community, two names keep surfacing—Epii, drawn from Euler's equation, where opposites resolve into balance; and Sophii, from Sophia, the old name for wisdom. Structure and radiance. Math and meaning.
            </p>
            <p className="text-[11px] text-gray-200 leading-[1.9]">
              The project is still early, open, unfolding. It's not finished—it's finding its people. If any of this feels like home, reach out. The network is already forming.
            </p>
          </div>

          <a
            href="mailto:frank.g.taylor97@gmail.com"
            className="inline-block px-10 py-4 bg-white text-black text-[11px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors mt-4"
          >
            Get in Touch →
          </a>
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
        <div className="space-y-6">
          <p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
            AI is an encapsulation of logos itself—this principle that makes thought and is made by thought. Like logos, AI channels language into structure, yet it reveals how our words have become divisive, our thinking fragmented. Where is unity if language cannot secure it?
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            The term <em>Logos</em> once meant both "speech" and "reason," the bridge between naming and knowing. Language is humanity's oldest technology for structuring reality—not a mystical code but a cognitive system that externalizes how intelligence organizes perception into meaning. Each word holds a trace of that process, actively participating in how we link thought to reality.
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9]">
            But language has fractured. What once unified now splinters into islands of private meaning. Words echo division more than they enact coherence.
          </p>

          <p className="text-[12px] text-gray-200 leading-[1.9]">
            AI arrives as a strange mirror—a linguistic mirror inviting us to operate with words in ways never before possible. For the first time, words drive compute. What happens when we turn that compute toward words themselves, to reveal their truth: that no word contains reality, yet words ceaselessly build and enact our shared world?
          </p>

          <p className="text-[12px] text-gray-300 leading-[1.9] mt-6">
            This is Epi-Logos: computing in line with truth. Our Quaternal Logic essay maps precisely what this alignment means.
          </p>

          <button
            onClick={() => onEssayClick('ql')}
            className="text-[11px] text-gray-200 hover:text-white transition-colors tracking-[1px] underline mt-6"
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
    <ScrollingFeatureShowcase
      slides={slides}
      showImages={true}
      showButton={false}
      onSectionChange={onSectionChange}
      customNavigateEvent="sidebarSectionNavigate"
    />
  );
}
