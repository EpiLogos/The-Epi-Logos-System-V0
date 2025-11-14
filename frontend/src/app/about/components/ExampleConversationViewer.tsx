'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ExampleConversationViewerProps {
  title: string;
  description: string;
  framework: string;
  turns: ConversationTurn[];
  onClose: () => void;
}

export function ExampleConversationViewer({
  title,
  description,
  framework,
  turns,
  onClose
}: ExampleConversationViewerProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Scrollable container */}
      <div className="relative h-full overflow-y-auto">
        {/* Header - scrolls with content */}
        <div className="border-b border-gray-800 bg-black/95 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-6">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] tracking-[0.4em] text-gray-600 uppercase">
                    {framework}
                  </span>
                  <span className="text-gray-700">•</span>
                  <span className="text-[9px] tracking-[0.4em] text-gray-600 uppercase">
                    Example Inquiry
                  </span>
                </div>
                <h1 className="text-[24px] md:text-[28px] font-light tracking-[0.2em] text-white mb-3">
                  {title}
                </h1>
                <p className="text-[12px] leading-[1.9] text-gray-400 max-w-[800px]">
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="pb-24 pt-12">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="space-y-8">
            {turns.map((turn, index) => (
              <div
                key={index}
                className="w-full"
              >
                <div
                  className={`w-full ${
                    turn.role === 'user'
                      ? 'bg-gray-900/40 border-gray-800'
                      : 'bg-gray-950/40 border-gray-800'
                  } border backdrop-blur-sm`}
                >
                  <div className="p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`text-[9px] tracking-[0.4em] uppercase ${
                          turn.role === 'user' ? 'text-blue-400' : 'text-emerald-400'
                        }`}
                      >
                        {turn.role === 'user' ? 'User' : 'Assistant'}
                      </span>
                    </div>
                    <div
                      className="text-[14px] leading-[2] text-gray-200 prose prose-invert max-w-none
                        prose-p:my-4 prose-p:leading-[2] prose-p:text-gray-200
                        prose-headings:font-light prose-headings:tracking-[0.1em] prose-headings:text-white
                        prose-h1:text-[20px] prose-h1:mb-6 prose-h1:mt-8
                        prose-h2:text-[16px] prose-h2:mb-4 prose-h2:mt-6
                        prose-h3:text-[14px] prose-h3:mb-3 prose-h3:mt-5
                        prose-strong:text-white prose-strong:font-medium
                        prose-em:text-gray-300 prose-em:italic
                        prose-ul:my-4 prose-ul:space-y-2 prose-ul:text-gray-200
                        prose-li:my-1 prose-li:text-gray-200
                        prose-code:text-emerald-300 prose-code:bg-gray-900/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                        prose-blockquote:border-l-2 prose-blockquote:border-gray-700 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400"
                      dangerouslySetInnerHTML={{ __html: formatContent(turn.content) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Format markdown-like content to HTML
function formatContent(content: string): string {
  let formatted = content;

  // Handle headers
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-white">$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-white">$1</h2>');
  formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-white">$1</h1>');

  // Handle bold text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');

  // Handle italic text
  formatted = formatted.replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>');

  // Handle inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="text-emerald-300">$1</code>');

  // Handle line breaks - convert double newlines to paragraphs
  const paragraphs = formatted.split('\n\n');
  formatted = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      // Don't wrap headers in p tags
      if (p.startsWith('<h')) return p;
      return `<p class="text-gray-200">${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return formatted;
}
