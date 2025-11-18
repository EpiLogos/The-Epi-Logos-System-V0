'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLightMode } from '@/contexts/LightModeContext';
import { cn } from '@/lib/utils';

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
  const { isLightMode } = useLightMode();

  return (
    <div className={cn(
      "fixed inset-0 z-[100] transition-colors duration-500",
      isLightMode ? "bg-white" : "bg-black"
    )}>
      {/* Scrollable container */}
      <div className="relative h-full overflow-y-auto">
        {/* Header - scrolls with content */}
        <div className={cn(
          "border-b backdrop-blur-sm",
          isLightMode ? "border-slate-300 bg-white/95" : "border-gray-800 bg-black/95"
        )}>
          <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-6">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn(
                    "text-xs tracking-[0.4em] uppercase",
                    isLightMode ? "text-gray-600" : "text-gray-600"
                  )}>
                    {framework}
                  </span>
                  <span className={isLightMode ? "text-slate-400" : "text-gray-700"}>•</span>
                  <span className={cn(
                    "text-xs tracking-[0.4em] uppercase",
                    isLightMode ? "text-gray-600" : "text-gray-600"
                  )}>
                    Example Inquiry
                  </span>
                </div>
                <h1 className={cn(
                  "text-2xl md:text-[1.75rem] font-light tracking-[0.2em] mb-3",
                  isLightMode ? "text-slate-900" : "text-white"
                )}>
                  {title}
                </h1>
                <p className={cn(
                  "text-sm leading-[1.9] max-w-[800px]",
                  isLightMode ? "text-slate-600" : "text-gray-400"
                )}>
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 text-sm uppercase tracking-[0.4em] transition-colors",
                  isLightMode ? "text-gray-500 hover:text-slate-900" : "text-gray-500 hover:text-white"
                )}
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
                  className={cn(
                    `w-full border backdrop-blur-sm`,
                    turn.role === 'user'
                      ? isLightMode ? 'bg-slate-50/40 border-slate-300' : 'bg-gray-900/40 border-gray-800'
                      : isLightMode ? 'bg-white/40 border-slate-300' : 'bg-gray-950/40 border-gray-800'
                  )}
                >
                  <div className="p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={cn(
                          'text-xs tracking-[0.4em] uppercase',
                          turn.role === 'user' ? 'text-blue-400' : 'text-emerald-400'
                        )}
                      >
                        {turn.role === 'user' ? 'User' : 'Assistant'}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-base leading-[2] prose max-w-none",
                        isLightMode ? "prose-gray" : "prose-invert",
                        "prose-p:my-4 prose-p:leading-[2]",
                        "prose-headings:font-light prose-headings:tracking-[0.1em]",
                        "prose-h1:text-xl prose-h1:mb-6 prose-h1:mt-8",
                        "prose-h2:text-lg prose-h2:mb-4 prose-h2:mt-6",
                        "prose-h3:text-base prose-h3:mb-3 prose-h3:mt-5",
                        "prose-strong:font-medium prose-em:italic",
                        "prose-ul:my-4 prose-ul:space-y-2 prose-li:my-1",
                        "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
                        "prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic",
                        isLightMode ? `
                          text-slate-700 prose-p:text-slate-700
                          prose-headings:text-slate-900
                          prose-strong:text-slate-900
                          prose-em:text-slate-700
                          prose-ul:text-slate-700 prose-li:text-slate-700
                          prose-code:text-emerald-600 prose-code:bg-slate-200
                          prose-blockquote:border-slate-400 prose-blockquote:text-slate-600
                        ` : `
                          text-gray-200 prose-p:text-gray-200
                          prose-headings:text-white
                          prose-strong:text-white
                          prose-em:text-gray-300
                          prose-ul:text-gray-200 prose-li:text-gray-200
                          prose-code:text-emerald-300 prose-code:bg-gray-900/60
                          prose-blockquote:border-gray-700 prose-blockquote:text-gray-400
                        `
                      )}
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
