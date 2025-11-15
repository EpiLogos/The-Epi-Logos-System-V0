export interface EssaySummary {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  callToAction: string;
}

export interface EssayContent {
  id: string;
  title: string;
  subtitle: string;
  summary: EssaySummary;
  markdownUrl: string; // Path to markdown file instead of inline content
}

export const essays: Record<string, EssayContent> = {
  'epi-logos': {
    id: 'epi-logos',
    title: 'EPI-LOGOS & THE BIMBA MAP',
    subtitle: 'Naming the ground without freezing it',
    summary: {
      id: 'epi-logos',
      eyebrow: 'Epi-Logos',
      title: 'The Notion of Epi-Logos',
      description:
        'We stand at a threshold where knowing itself must evolve. The crisis of our age is not a lack of information but a collapse of coherent form—the architecture that could hold our knowledge together has fractured. Our most advanced tools, like AI systems with million-token windows, demonstrate this paradox: unprecedented access paired with unprecedented fragmentation. The solution is neither nostalgic return nor cynical dissolution, but Epi-Logos—a "logos upon logos," a peroration that gathers what analysis has rightly differentiated and renders it whole without erasure.',
      callToAction: 'Read the Epi-Logos essay'
    },
    markdownUrl: '/essays/epi-logos.md'
  },
  ql: {
    id: 'ql',
    title: 'QUATERNAL LOGIC (QL)',
    subtitle: 'The generative invariant behind wholeness',
    summary: {
      id: 'ql',
      eyebrow: 'Quaternal Logic (QL)',
      title: 'Forming Wholeness Without Collapse',
      description:
        'Four explicit moves, two implicit anchors. QL is the generative invariant that lets the many become one and increase by one. Here we unpack the tetralemma, the 4+2 topology, and the practical stakes for reasoning engines.',
      callToAction: 'Read the QL essay'
    },
    markdownUrl: '/essays/ql.md'
  },
  mef: {
    id: 'mef',
    title: 'META-EPISTEMIC FRAMEWORK (MEF)',
    subtitle: 'Working with incompleteness as a feature',
    summary: {
      id: 'mef',
      eyebrow: 'Meta-Epistemic Framework',
      title: 'Six Lenses for Integral Knowing',
      description:
        'The MEF formalizes reflexive incompleteness as a generative process. By mapping six coordinate lenses—archetypal, causal, logical, processual, meta-epistemic, and divine-scalar—it turns Gödel\'s wound into operational openness, building systems that know they are provisional and thus remain free.',
      callToAction: 'Read the MEF essay'
    },
    markdownUrl: '/essays/mef.md'
  }
};
