'use client';

import React from 'react';
import PlaceholderPageTemplate from '@/components/placeholder/PlaceholderPageTemplate';

/**
 * Development page for testing and refining the Living Placeholder system.
 * This replaces the failed placeholder-demo page and provides a proper
 * testing ground for the placeholder system's thematic and stylistic alignment.
 */
export default function PlaceholderTemplatePage() {
  // Use coordinate #2-3 as a test case (Parashakti branch, Mahamaya terminal)
  const testCoordinate = '#2-3';
  
  return (
    <div className="min-h-screen bg-black">
      <PlaceholderPageTemplate 
        coordinate={testCoordinate}
        isDevMode={true}
        className="text-white"
      />
    </div>
  );
}