/**
 * Atelier Header Component
 *
 * Displays Epii icon (clickable link to /epii), page title, and coordinate badge (#5-5)
 * Matches Archive header pattern for consistency
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function AtelierHeader() {
  return (
    <div className="relative px-4 py-4 border-b border-gray-800/50">
      {/* Epii Icon - Absolute positioned, centered, overlays content with no layout impact */}
      <div className="absolute -top-24.5 left-1/2 -translate-x-1/2 z-30">
        <Link href="/epii?expand=1" className="group block">
          <Image
            src="/ui-system/epii-icon.png"
            alt="Epii"
            width={155}
            height={155}
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-200"
          />
        </Link>
      </div>

      {/* Page Title and Coordinate - natural position, icon overlays on top */}
      <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A1942' }}>
        Atelier
      </h2>
      <div className="text-xs text-gray-500 font-mono hover:text-blue-400 transition-colors cursor-default">
        #5-5
      </div>
    </div>
  );
}
