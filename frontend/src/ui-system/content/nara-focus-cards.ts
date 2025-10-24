/**
 * Nara Focus Cards Content
 *
 * Centralized content for all FocusCards used on the Nara page.
 * Includes both the modal-expanded cards (Identity Matrix + Personal Gnosis)
 * and the subnodes section cards.
 *
 * Data sourced from Nara epistemic context and Bimba synthesis analysis.
 */

import type { FocusCard } from '../components/ui/FocusCards';

/**
 * Modal-expanded state cards: Identity Matrix (#4.0) and Personal Gnosis (#4.5)
 * Parallel to Epii's Archive (#5.0) and Atelier (#5.5) structure
 */
export const naraModalCards: FocusCard[] = [
  {
    title: "IDENTITY MATRIX & ARCHETYPAL COMPASS",
    description: "Interactive identity matrix. Enter birth data and explore overlays—astrology, numerology, Jungian type, Gene Keys, Human Design—synthesized into a quaternary compass that personalizes every Nara function. Universal archetypes meet your particular equation.",
    src: "/ui-system/nara-4.0.png",
    link: "/nara/identity-matrix",
    coordinate: "#4.0",
    imageZoom: 1,
    borderColor: "border-green-500/40"
  },
  {
    title: "PERSONAL GNOSIS & INTEGRATION",
    description: "Journal Section with dialogos and oracle. Write, thread, and—when invited—draw Tarot or I‑Ching to reflect your question’s shape. Entries link to symbols and timing; insights feed back to refine your compass and prime the next spiral.",
    src: "/ui-system/nara-4.5.png",
    link: "/nara/gnosis",
    coordinate: "#4.5",
    borderColor: "border-green-500/40"
    // imageZoom defaults to 1.3
  }
];

/**
 * Subnodes section cards: #4.1, #4.2, #4.3, #4.4
 * Represents the four core functional domains of the Nara personal interface
 */
export const naraSubnodeCards: FocusCard[] = [
  {
    title: "SYMPATHETIC MEDICINE",
    description: "Body speaks cosmos. Decanic correspondences link your organs to planets, herbs to timing, energy maps to seasonal rhythm. Ayurveda, chakras, Paracelsian signatures—all calibrated to your natal chart and the sky's real-time configuration. Receive interventions when windows open: planetary hours for ritual, lunar phases for release, transits for transformation.",
    src: "/ui-system/nara-4.1.png",
    coordinate: "#4.1",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: -4,
    borderColor: "border-green-500/40"
  },
  {
    title: "DIVINATION",
    description: "Ask and listen. Tarot spreads structured by Quaternal Logic. I-Ching hexagrams mapping to your cycle phase. Symbols personalized through your archetypal compass, timed by planetary hours, interpreted through correspondence and insight. Not fortune-telling—dialogue. The cards reflect your question's shape back so recognition can appear.",
    src: "/ui-system/nara-4.2.png",
    coordinate: "#4.2",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: 10,
    borderColor: "border-green-500/40"
  },
  {
    title: "ALCHEMY",
    description: "You are always somewhere in the cycle. Twelve-fold concrescence places you: calcination's burn, dissolution's flow, conjunction's marriage, coagulation's seal. Hermetic operations meet Jungian shadow work. The engine knows your phase, suggests protocols, warns of stalls. Transformation tracked, timed, held—spiral not line.",
    src: "/ui-system/nara-4.3.png",
    coordinate: "#4.3",
    objectFit: 'contain',
    imageZoom: 2.25,
    imageOffsetY: -2,
    borderColor: "border-green-500/40"
  },
  {
    title: "LIVED CONTEXT",
    description: "The arena where experience lands. Dreams, symptoms, synchronicities held through nested lenses: Gebserian structures, Jungian complexes, phenomenological descriptors, liberation practices. Your phenomena time-stamped, multi-angled, routed to right interpretive frameworks. Context-of-contexts witnessing what actually happens so insight stays grounded in your life.",
    src: "/ui-system/nara-4.4.png",
    coordinate: "#4.4",
    objectFit: 'contain',
    imageZoom: 2.5,
    imageOffsetY: 0,
    borderColor: "border-green-500/40"
  }
];
