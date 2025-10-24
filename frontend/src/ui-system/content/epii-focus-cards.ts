/**
 * Epii Focus Cards Content
 * 
 * Centralized content for all FocusCards used on the Epii page.
 * Includes both the modal-expanded cards (Archive + Atelier) and the subnodes section cards.
 * 
 * Data sourced from Bimba graph coordinates.
 */

import type { FocusCard } from '../components/ui/FocusCards';

/**
 * Modal-expanded state cards: Archive (#5-0) and Atelier (#5-5)
 */
export const epiiModalCards: FocusCard[] = [
  {
    title: "ARCHIVE & DOCUMENT HUB",
    description: "Living memoria preserving etymological dialogues, source texts, and philosophical insights. Navigate rhizomatically through threads, temporal evolution, and serendipitous connections. Wisdom emerges through dialogue across time as synthesis becomes ground for future inquiries. Stage #0 of the logos cycle: alogos (receptive ground).",
    src: "/ui-system/epii_library.png",
    link: "/epii/archive",
    coordinate: "#5-0",
    imageZoom: 1,
    borderColor: "border-purple-900/40" // No zoom for archive image
  },
  {
    title: "ETYMOLOGICAL ATELIER",
    description: "Active interface for etymological archaeology as method and liberation. Trace PIE roots through Sanskrit/Latin/Greek cognates, build QL communities, discover proportional patterns. Language preserves consciousness-structures; explore how the same root optimally instantiates across different frameworks. Stage #5 of the logos cycle: analogos (proportional recognition).",
    src: "/ui-system/epii_atelier.png",
    link: "/epii/atelier",
    coordinate: "#5-5",
    borderColor: "border-purple-900/40"
    // imageZoom defaults to 1.3 for atelier
  }
];

/**
 * Subnodes section cards: #5-1, #5-2, #5-3, #5-4
 * Represents the four core aspects of the Epii synthesis layer
 */
export const epiiSubnodeCards: FocusCard[] = [
  {
    title: "EPI-LOGOS",
    description: "Understand why this system thinks as it does. Epi-Logos is the closing turn of inquiry—reflection that returns insight to source—explained plainly, with examples you can apply. It’s also the living essay: theory and history written by the developer and collaborators, readable by all.",
    src: "/ui-system/epii-5-1-philosophy.png",
    coordinate: "#5-1",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 16
  },
  {
    title: "SIVA-",
    description: "The quiet backbone of the work. Siva is ground: pipelines, storage, and safeguards that keep conversations coherent so synthesis can land cleanly. Find backend architecture details here—practical guidance and coding tips for contributors.",
    src: "/ui-system/epii-5-2-Siva.png",
    coordinate: "#5-2",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 10
  },
  {
    title: "-SHAKTI",
    description: "The feel of understanding. Shakti is expression: navigation that orients, motion that marks transitions, and calm layouts that let attention settle. Explore page-by-page tutorial views that teach how to navigate and use the system.",
    src: "/ui-system/epii-5-3-shakti.png",
    coordinate: "#5-3",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 0  // Move up a bit
  },
  {
    title: "SIVA-SHAKTI",
    description: "Where ground and expression meet. Agents hand off by coordinate, deepen when needed, and return just enough—your intuition steering, my memory carrying the through-line. See the six agents and the orchestrator in detail—how prompts drive them, how handoffs work—and where to contribute or seek guidance.",
    src: "/ui-system/epii-5-4-siva-shakti.png",
    coordinate: "#5-4",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 3
  }
];
