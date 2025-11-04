'use client';

import React from 'react';

interface CTASectionProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
}

export function CTASection({ onEssayClick, onSectionClick }: CTASectionProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 border-b border-gray-800 bg-black">
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Primary CTA */}
        <button
          onClick={() => onEssayClick('mef')}
          className="px-10 py-4 bg-white text-black text-[13px] font-normal tracking-[2px] uppercase hover:bg-gray-200 transition-colors"
        >
          Read the MEF Essay →
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => onSectionClick('collaborate')}
          className="px-10 py-4 border border-white text-white text-[13px] font-normal tracking-[2px] uppercase hover:bg-white hover:text-black transition-colors"
        >
          Collaborate →
        </button>
      </div>

      {/* Tertiary Link */}
      <button
        onClick={() => onEssayClick('ql')}
        className="text-[12px] text-gray-400 hover:text-white transition-colors tracking-[1px] underline"
      >
        What is Quaternal Logic?
      </button>
    </div>
  );
}
