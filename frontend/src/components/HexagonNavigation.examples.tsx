/**
 * HexagonNavigation Component Examples
 * 
 * This file demonstrates various ways to use the HexagonNavigation component
 * throughout your application for consistent hexagon-based UI elements.
 */

import React from 'react';
import HexagonNavigation from './HexagonNavigation';

export function HexagonNavigationExamples() {
  return (
    <div className="p-8 space-y-12 bg-black min-h-screen">
      <h1 className="text-white text-3xl font-bold text-center mb-8">
        HexagonNavigation Component Examples
      </h1>

      {/* Example 1: Logo preset */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">1. Logo Preset (with overlay image)</h2>
        <p className="text-gray-400">Perfect for main branding elements with the Epi-Logos symbol overlay.</p>
        <div className="flex justify-center">
          <HexagonNavigation preset="logo" scale={0.5} />
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<HexagonNavigation 
  preset="logo" 
  scale={0.5} 
/>`}
        </pre>
      </section>

      {/* Example 2: Loader preset */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">2. Loader Preset</h2>
        <p className="text-gray-400">Clean loading animation without background glow, perfect for auth pages.</p>
        <div className="flex justify-center">
          <HexagonNavigation preset="loader" />
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<HexagonNavigation preset="loader" />`}
        </pre>
      </section>

      {/* Example 3: Nav preset */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">3. Navigation Preset</h2>
        <p className="text-gray-400">Minimal hexagon for navigation elements and menu items.</p>
        <div className="flex justify-center">
          <HexagonNavigation preset="nav" />
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<HexagonNavigation preset="nav" />`}
        </pre>
      </section>

      {/* Example 4: Custom configuration */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">4. Custom Configuration</h2>
        <p className="text-gray-400">Override preset values or create completely custom configurations.</p>
        <div className="flex justify-center">
          <HexagonNavigation 
            preset="loader"
            color="#ff6b6b"
            colorTo="#4ecdc4"
            size={120}
            interactive={true}
            onClick={() => alert('Hexagon clicked!')}
          />
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<HexagonNavigation 
  preset="loader"
  color="#ff6b6b"
  colorTo="#4ecdc4"
  size={120}
  interactive={true}
  onClick={() => alert('Hexagon clicked!')}
/>`}
        </pre>
      </section>

      {/* Example 5: Positioned elements */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">5. Positioned Elements</h2>
        <p className="text-gray-400">Use absolute positioning for fixed UI elements like logos.</p>
        <div className="relative h-32 bg-gray-900 rounded">
          <HexagonNavigation 
            preset="nav"
            position="absolute"
            coordinates={{ top: "1rem", left: "1rem" }}
            scale={0.7}
          />
          <HexagonNavigation 
            preset="nav"
            position="absolute"
            coordinates={{ top: "1rem", right: "1rem" }}
            scale={0.7}
          />
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Content Area
          </div>
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<HexagonNavigation 
  preset="nav"
  position="absolute"
  coordinates={{ top: "1rem", left: "1rem" }}
  scale={0.7}
/>`}
        </pre>
      </section>

      {/* Example 6: Multiple sizes */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-semibold">6. Multiple Sizes</h2>
        <p className="text-gray-400">Different sizes for different use cases.</p>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <HexagonNavigation preset="nav" size={40} />
            <p className="text-gray-400 text-sm mt-2">Small (40px)</p>
          </div>
          <div className="text-center">
            <HexagonNavigation preset="nav" size={80} />
            <p className="text-gray-400 text-sm mt-2">Medium (80px)</p>
          </div>
          <div className="text-center">
            <HexagonNavigation preset="nav" size={120} />
            <p className="text-gray-400 text-sm mt-2">Large (120px)</p>
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="space-y-4 border-t border-gray-700 pt-8">
        <h2 className="text-white text-xl font-semibold">Usage Guidelines</h2>
        <div className="text-gray-400 space-y-2">
          <p><strong>Logo preset:</strong> Use for main branding, hero sections, and primary navigation elements.</p>
          <p><strong>Loader preset:</strong> Use for loading states, auth pages, and simple branding.</p>
          <p><strong>Nav preset:</strong> Use for menu items, secondary navigation, and decorative elements.</p>
          <p><strong>Custom:</strong> Override any preset property or create entirely custom configurations.</p>
        </div>
      </section>
    </div>
  );
}

export default HexagonNavigationExamples;
