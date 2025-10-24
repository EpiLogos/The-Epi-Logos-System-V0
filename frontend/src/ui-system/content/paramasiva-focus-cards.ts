/**
 * Paramasiva Focus Cards Content
 *
 * Centralized content for all FocusCards used on the Paramasiva page.
 * Mirrors other subsystem pages with modal cards (#1-0, #1-5)
 * and a Subnodes section (#1-1 … #1-4).
 *
 * Images intentionally left empty per request; cards render
 * coordinate/title placeholders with a neutral gradient.
 */

import type { FocusCard } from '../components/ui/FocusCards';

/**
 * Modal-expanded state cards: Original Aspect (#1-0) and Quaternionic Integration (#1-5)
 */
export const paramasivaModalCards: FocusCard[] = [
  {
    title: 'ORIGINAL ASPECT',
    description:
      'From Paramasiva\'s vantage, Epi-Logos is a universal grammar — Order flowering from Reality. In #1-0 the (0/1) seed holds original coherence so every later distinction remains transparent to source.',
    src: '',
    coordinate: '#1-0',
    imageZoom: 1,
    borderColor: "border-blue-400/40"
  },
  {
    title: 'QUATERNIONIC INTEGRATION',
    description:
      'Epi-Logos learns to rotate. Quaternionic integration bridges blueprint and motion (double covering), so transformations stay coherent across nested frames.',
    src: '',
    coordinate: '#1-5',
    borderColor: "border-blue-400/40"
  }
];

/**
 * Subnodes section cards: #1-1, #1-2, #1-3, #1-4
 * Titles align with Paramasiva navigation affordances.
 */
export const paramasivaSubnodeCards: FocusCard[] = [
  {
    title: 'UNITY NETWORKS',
    description:
      'Epi-Logos as original/reflection coherence (#1-1 Pratibimba). Map whole-before-parts so relations stay legible and the source remains visible through every copy.',
    src: '',
    coordinate: '#1-1',
    objectFit: 'contain',
    imageZoom: 1,
    borderColor: "border-blue-400/40"
  },
  {
    title: 'TOPOLOGICAL FORMS',
    description:
      'Epi-Logos as Ananda harmonics (#1-2). Use shapes and coverings to preserve invariants so translations between layers remain truthful.',
    src: '',
    coordinate: '#1-2',
    objectFit: 'contain',
    imageZoom: 1,
    borderColor: "border-blue-400/40"
  },
  {
    title: 'INTERCONNECTED AWARENESS',
    description:
      'Epi-Logos as living rhythm (#1-3 Spanda). Practice perception without partition so analysis never loses the field it arises within.',
    src: '',
    coordinate: '#1-3',
    objectFit: 'contain',
    imageZoom: 1,
    borderColor: "border-blue-400/40"
  },
  {
    title: 'ARCHITECTURAL AXIOMS',
    description:
      'Epi-Logos as Quaternal Logic flowering (#1-4). Minimal commitments, map-compass-lens, and the 16/9 generative code that keeps complexity navigable.',
    src: '',
    coordinate: '#1-4',
    objectFit: 'contain',
    imageZoom: 1,
    borderColor: "border-blue-400/40"
  }
];

export default {
  paramasivaModalCards,
  paramasivaSubnodeCards,
};

