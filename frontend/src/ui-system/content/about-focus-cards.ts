/**
 * About Page Focus Cards Content
 *
 * Screenshot showcase cards for the landing page.
 * Images will be populated later - using placeholder paths for now.
 */

import type { FocusCard } from '../components/ui/FocusCards';

/**
 * App screenshot showcase cards
 */
export const aboutScreenshotCards: FocusCard[] = [
  {
    title: "ETYMOLOGICAL ATELIER",
    description: "Active interface for etymological archaeology. Trace PIE roots through Sanskrit, Latin, and Greek cognates. Build QL communities and discover proportional patterns across languages.",
    src: "/screenshots/atelier-screenshot.png", // Placeholder - replace later
    coordinate: "#SCREENSHOT-1",
    borderColor: "border-purple-900/40"
  },
  {
    title: "ARCHIVE & MEMORIA",
    description: "Living memory system preserving dialogues and insights. Navigate rhizomatically through threads, temporal evolution, and serendipitous connections.",
    src: "/screenshots/archive-screenshot.png", // Placeholder - replace later
    coordinate: "#SCREENSHOT-2",
    borderColor: "border-purple-900/40"
  },
  {
    title: "AGENT ORCHESTRATION",
    description: "Coordinate-aware AI system with six specialized subsystems. Single orchestrator navigates through epistemic contexts, adapting role based on coordinate position.",
    src: "/screenshots/agents-screenshot.png", // Placeholder - replace later
    coordinate: "#SCREENSHOT-3",
    borderColor: "border-purple-900/40"
  },
  {
    title: "GEOMETRIC NAVIGATION",
    description: "Spatial knowledge architecture using the six-coordinate system. Navigate from proto-logical ground to synthesis orchestration with precision.",
    src: "/screenshots/navigation-screenshot.png", // Placeholder - replace later
    coordinate: "#SCREENSHOT-4",
    borderColor: "border-purple-900/40"
  }
];
