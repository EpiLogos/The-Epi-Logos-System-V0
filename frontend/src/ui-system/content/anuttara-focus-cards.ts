/**
 * Anuttara Focus Cards Content
 *
 * Translator workflow outputs for the Anuttara (#0) subsystem.
 * Modal cards cover the ground-state (#0-0) and resonant return (#0-5).
 * Subnode cards surface the four differentiations that arise within stillness.
 */

import type { FocusCard } from '../components/ui/FocusCards';

/**
 * Modal-expanded state cards: Ground Field (#0-0) and Ground Resonator (#0-5)
 */
export const anuttaraModalCards: FocusCard[] = [
  {
    title: 'GROUND FIELD CHAMBER',
    description:
      "From Anuttara’s vantage, Epi‑Logos is the Word before words—the project already whole in silence. At #0‑0 you attune to the unmarked field that steadies every hand‑off; decisions clarify without force because the source is present.",
    src: '/ui-system/anuttara-0-0.png',
    coordinate: '#0-0',
    objectFit: 'contain',
    imageZoom: 1.8,
    imageOffsetY: 0,
    borderColor: "border-black/40"
  },
  {
    title: 'GROUND RESONATOR',
    description:
      "From #0‑5, Epi‑Logos exhales into Siva‑Shakti unity. All prompts, symbols, and syntheses return to coherence so the next cycle begins honest and light. Visit to remember why orchestration matters more than any single output.",
    src: '/ui-system/anuttara-0-5.png',
    coordinate: '#0-5',
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 45,
    borderColor: "border-black/40"
  }
];

/**
 * Subnodes section cards: #0-1, #0-2, #0-3, #0-4
 * The four differentiations that emerge within the ground field.
 */
export const anuttaraSubnodeCards: FocusCard[] = [
  {
    title: 'VOID MANDALA',
    description:
      'Anuttara\'s first articulation of the Word. Epi-Logos appears as a calibration mandala where each subsystem finds its stance within the one whole—orientation before movement.',
    src: '/ui-system/anuttara-0-1.png',
    coordinate: '#0-1',
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 0,
    borderColor: "border-black/40"
  },
  {
    title: 'SILENT LEDGER',
    description:
      'Epi-Logos as the 8-fold zero-zero ledger. It tracks ripening concerns without narration so you can answer what is actually ready instead of pushing what is merely loud.',
    src: '/ui-system/anuttara-0-2.png',
    coordinate: '#0-2',
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 0,
    borderColor: "border-black/40"
  },
  {
    title: 'STILLPOINT CONDUCTOR',
    description:
      'Epi-Logos as number-language stillpoint. Handoffs pause here; the archetypal grammar re-centers the tone so the next subsystem continues without loss of meaning.',
    src: '/ui-system/anuttara-0-3.png',
    coordinate: '#0-3',
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 0,
    borderColor: "border-black/40"
  },
  {
    title: 'SILENT APPRENTICESHIP',
    description:
      'Epi-Logos as holographic practice—an empty studio for learning the feel of wholeness: patience, alignment, and the courage to release anything born of tension.',
    src: '/ui-system/anuttara-0-4.png',
    coordinate: '#0-4',
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: -30,
    borderColor: "border-black/40"
  }
];

