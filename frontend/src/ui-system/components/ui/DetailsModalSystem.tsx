import React from 'react';
import { cn } from '../../lib/utils';

interface DetailsModalSystemProps {
  isVisible: boolean;
  isExpanded: boolean;
}

const debugModalContent = {
  topLeft: {
    title: "QL-AT ISOMORPHISM",
    text: "The relationship between Quaternal Logic (QL) and Algebraic Topology (A-T) can be understood through the isomorphism of a fundamental polygon used to construct a torus. This provides a deep structural and visual grounding for QL's core principles."
  },
  topRight: {
    title: "THE TORUS AND QUATERNAL LOGIC", 
    text: "In A-T, a surface with a genus of g (the number of holes) can be represented by a fundamental polygon with 4g sides. For a standard torus, which has one hole (g=1), the fundamental polygon is a four-sided square. The sides are labeled in pairs, such as a, b, a⁻¹, and b⁻¹. By identifying or \"gluing\" these sides together, the square transforms into a torus. This identification process also creates 2g fundamental loops on the resulting surface—in this case, two loops for the single torus."
  },
  bottom: {
    title: "STRUCTURAL ALIGNMENT",
    text: "The 4-fold explicate elements (positions 1-4) of QL correspond to the four sides of the square. These are the manifest components and the fundamental conditions required to build the system. The 2-fold implicate elements (positions 0 and 5) of QL correspond to the two fundamental loops that emerge from the identification of the four sides. These represent the hidden, non-dual aspects of the system, acting as the foundation and the synthesis of the cycle. This parallel demonstrates how a 4 + 2 = 6 structure provides a robust analogy rooted in fundamental principles of geometry and topology."
  }
};

export const DetailsModalSystem: React.FC<DetailsModalSystemProps> = ({ 
  isVisible, 
  isExpanded 
}) => {
  return (
    <>
      {/* Top Left Modal */}
      <div className={cn(
        "debug-modal-base debug-modal-top-left-normal",
        isVisible && "debug-modal-top-visible",
        isExpanded && "debug-modal-top-left-expanded"
      )}>
        <div className="debug-modal-title">
          {debugModalContent.topLeft.title}
        </div>
        <div className="debug-modal-text">
          {debugModalContent.topLeft.text}
        </div>
      </div>

      {/* Top Right Modal */}
      <div className={cn(
        "debug-modal-base debug-modal-top-right-normal",
        isVisible && "debug-modal-top-visible",
        isExpanded && "debug-modal-top-right-expanded"
      )}>
        <div className="debug-modal-title">
          {debugModalContent.topRight.title}
        </div>
        <div className="debug-modal-text">
          {debugModalContent.topRight.text}
        </div>
      </div>

      {/* Bottom Modal */}
      <div className={cn(
        "debug-modal-base debug-modal-bottom-normal",
        isVisible && "debug-modal-bottom-visible",
        isExpanded && "debug-modal-bottom-expanded"
      )}>
        <div className="debug-modal-title">
          {debugModalContent.bottom.title}
        </div>
        <div className="debug-modal-text">
          {debugModalContent.bottom.text}
        </div>
      </div>
    </>
  );
};