'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { essays } from './essays';
import { cn } from '@/lib/utils';
import { useLightMode } from '@/contexts/LightModeContext';

interface EssayReaderProps {
  essayId: string | null;
  onClose: () => void;
}

interface HeadingData {
  id: string;
  text: string;
  level: number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Preprocess markdown to wrap bare LaTeX in dollar signs for remark-math
function preprocessLaTeX(markdown: string): string {
  const lines = markdown.split('\n');
  const processed: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      processed.push(line);
      continue;
    }

    // Check if line contains LaTeX commands (not in code blocks, headings, or already in $)
    // Look for lines with LaTeX backslash commands
    if (
      !inCodeBlock &&
      line.trim().length > 0 &&
      !line.trim().startsWith('#') &&
      !line.includes('$') &&
      !line.includes('`') &&
      /\\[a-zA-Z{]/.test(line) && // Contains backslash followed by letter or brace
      /\\(mathrm|frac|rightarrow|leftarrow|quad|;|text|,|\{|\})/.test(line)
    ) {
      // Wrap the entire line in display math
      processed.push(`$$${line.trim()}$$`);
    } else {
      processed.push(line);
    }
  }

  return processed.join('\n');
}

// Extract headings from markdown for TOC
function extractHeadings(markdown: string): HeadingData[] {
  const headings: HeadingData[] = [];
  const lines = markdown.split('\n');

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  });

  return headings;
}

export function EssayReader({ essayId, onClose }: EssayReaderProps) {
  const { isLightMode } = useLightMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const essay = essayId ? essays[essayId] : null;

  // Fetch markdown content
  useEffect(() => {
    if (!essay) return;

    setLoading(true);
    fetch(essay.markdownUrl)
      .then(res => res.text())
      .then(text => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load essay:', err);
        setLoading(false);
      });
  }, [essay]);

  const processedMarkdown = markdown ? preprocessLaTeX(markdown) : '';
  const headings = markdown ? extractHeadings(markdown) : [];

  useEffect(() => {
    setActiveSectionId(headings[0]?.id ?? null);
  }, [headings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const headingElements = Array.from(
      container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
    );

    if (headingElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry?.target) {
          const id = visibleEntry.target.getAttribute('id');
          if (id) {
            setActiveSectionId(id);
          }
        }
      },
      {
        root: container,
        threshold: 0.3,
        rootMargin: '0px 0px -40% 0px'
      }
    );

    headingElements.forEach(heading => observer.observe(heading));

    return () => observer.disconnect();
  }, [markdown]);

  if (!essay) {
    return (
      <div className={cn(
        "w-full h-screen flex items-center justify-center",
        isLightMode ? "bg-white text-slate-600" : "bg-black text-gray-600"
      )}>
        <p className="text-sm tracking-[2px]">SELECT AN ESSAY OR DOCUMENT</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        "w-full h-screen flex items-center justify-center",
        isLightMode ? "bg-white text-gray-600" : "bg-black text-gray-400"
      )}>
        <p className="text-sm tracking-[2px]">LOADING ESSAY...</p>
      </div>
    );
  }

  const handleTocClick = (id: string) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector<HTMLElement>(`#${id}`);
    if (target) {
      container.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth'
      });
      setActiveSectionId(id);
    }
  };

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden transition-colors duration-500",
      isLightMode ? "bg-white text-gray-800" : "bg-black text-white"
    )}>
      <div className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent",
        isLightMode ? "from-white via-white/70" : "from-black via-black/70"
      )} />
      <div className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent",
        isLightMode ? "from-white via-white/70" : "from-black via-black/70"
      )} />

      <div className="absolute inset-x-0 top-0 z-40">
        <ScrollProgress
          containerRef={containerRef}
          className={cn("h-[2px]", isLightMode ? "bg-slate-800/70" : "bg-white/70")}
        />
      </div>

      <div
        ref={containerRef}
        className="relative h-full w-full overflow-y-auto scroll-smooth"
      >
        <div className={cn(
          "w-full px-6 md:px-12 lg:px-20 pt-8 pb-24",
          isLightMode ? "text-slate-700" : "text-gray-200"
        )}>
          <div className="relative max-w-[1600px] mx-auto">
            {/* Header with close button */}
            <div className={cn(
              "flex items-start justify-between mb-8 border-b pb-8 lg:pb-10",
              isLightMode ? "border-slate-300" : "border-gray-800"
            )}>
              <div className="flex-1 space-y-4">
                <p className={cn(
                  "text-sm uppercase tracking-[0.42em]",
                  isLightMode ? "text-gray-500" : "text-gray-500"
                )}>
                  Essay
                </p>
                <h1 className={cn(
                  "text-[2.5rem] font-light tracking-[0.32em]",
                  isLightMode ? "text-slate-900" : "text-white"
                )}>
                  {essay.title}
                </h1>
                {essay.subtitle && (
                  <p className={cn(
                    "text-sm tracking-[0.28em] uppercase",
                    isLightMode ? "text-slate-600" : "text-gray-400"
                  )}>
                    {essay.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "ml-8 text-xs uppercase tracking-[0.4em] transition-colors flex-shrink-0",
                  isLightMode ? "text-gray-500 hover:text-slate-900" : "text-gray-500 hover:text-white"
                )}
              >
                Close
              </button>
            </div>

            <article className="space-y-16 lg:pr-[340px]">

              <div className={cn(
                "prose max-w-none",
                isLightMode ? "prose-gray" : "prose-invert",
                `[&_h1]:text-[2.25rem] [&_h1]:font-light [&_h1]:tracking-[0.24em] [&_h1]:mb-8 [&_h1]:scroll-mt-24
                [&_h2]:text-[1.875rem] [&_h2]:font-light [&_h2]:tracking-[0.24em] [&_h2]:mb-8 [&_h2]:scroll-mt-24
                [&_h3]:text-[1.625rem] [&_h3]:font-light [&_h3]:tracking-[0.24em] [&_h3]:mb-8 [&_h3]:scroll-mt-24
                [&_h4]:text-[1.375rem] [&_h4]:font-light [&_h4]:tracking-[0.24em] [&_h4]:mb-8 [&_h4]:scroll-mt-24
                [&_h5]:text-lg [&_h5]:font-light [&_h5]:tracking-[0.24em] [&_h5]:mb-8 [&_h5]:scroll-mt-24
                [&_h6]:text-base [&_h6]:font-light [&_h6]:tracking-[0.24em] [&_h6]:mb-8 [&_h6]:scroll-mt-24
                [&_p]:leading-[2.2] [&_p]:tracking-[0.01em] [&_p]:mb-8 [&_p]:text-base
                [&_strong]:font-semibold
                [&_em]:italic
                [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:text-sm
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-3 [&_ul]:my-8
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-3 [&_ol]:my-8
                [&_li]:leading-[2]
                [&_hr]:border-0 [&_hr]:border-t [&_hr]:my-12
                [&_.katex-display]:my-8 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden`,
                isLightMode ? `
                  [&_h1]:text-slate-900 [&_h2]:text-slate-900 [&_h3]:text-slate-900 [&_h4]:text-slate-900 [&_h5]:text-slate-900 [&_h6]:text-slate-900
                  [&_p]:text-slate-700 [&_strong]:text-slate-900 [&_em]:text-slate-700
                  [&_code]:text-slate-800 [&_code]:bg-slate-200
                  [&_li]:text-slate-700 [&_li>strong]:text-slate-900
                  [&_hr]:border-slate-300 [&_.katex]:text-slate-800` : `
                  [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white
                  [&_p]:text-gray-200 [&_strong]:text-white [&_em]:text-gray-300
                  [&_code]:text-gray-100 [&_code]:bg-white/10
                  [&_li]:text-gray-200 [&_li>strong]:text-white
                  [&_hr]:border-gray-800 [&_.katex]:text-gray-100`
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h1: ({ node, ...props }) => <h1 id={slugify(String(props.children))} {...props} />,
                    h2: ({ node, ...props }) => <h2 id={slugify(String(props.children))} {...props} />,
                    h3: ({ node, ...props }) => <h3 id={slugify(String(props.children))} {...props} />,
                    h4: ({ node, ...props }) => <h4 id={slugify(String(props.children))} {...props} />,
                    h5: ({ node, ...props }) => <h5 id={slugify(String(props.children))} {...props} />,
                    h6: ({ node, ...props }) => <h6 id={slugify(String(props.children))} {...props} />,
                  }}
                >
                  {processedMarkdown}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        </div>
      </div>
      {headings.length > 0 && (
        <div className="hidden lg:block fixed top-[88px] right-0 z-40 group/toc">
          <div className="relative h-[calc(100vh-160px)]">
            <aside
              className={cn(
                "pointer-events-auto relative z-10 flex h-full w-[320px] translate-x-[calc(100%-24px)] overflow-hidden rounded-l-sm border transition-transform duration-300 ease-out group-hover/toc:translate-x-0 group-focus-within/toc:translate-x-0",
                isLightMode ? "border-slate-300/40" : "border-white/15"
              )}
            >
              <div className={cn(
                "flex h-full w-6 items-center justify-center border-r bg-transparent",
                isLightMode ? "border-slate-300/50" : "border-gray-700/50"
              )}>
                <span className={cn(
                  "rotate-90 text-xs uppercase tracking-[0.6em]",
                  isLightMode ? "text-slate-600/60" : "text-white/40"
                )}>
                  Contents
                </span>
              </div>
              <div className={cn(
                "flex-1 h-full backdrop-blur-xl flex flex-col",
                isLightMode ? "bg-white/80 shadow-[0_0_40px_rgba(0,0,0,0.1)]" : "bg-black/80 shadow-[0_0_40px_rgba(0,0,0,0.65)]"
              )}>
                <div className={cn(
                  "flex items-center justify-between px-6 pt-6 pb-4 text-sm uppercase tracking-[0.4em]",
                  isLightMode ? "text-slate-600/60" : "text-white/60"
                )}>
                  <span>Sections</span>
                </div>
                <div className="px-6 pb-6 overflow-y-auto space-y-2 scrollbar-thin-custom">
                  {headings.map(heading => (
                    <button
                      key={heading.id}
                      type="button"
                      onClick={() => handleTocClick(heading.id)}
                      className={cn(
                        'block w-full text-left text-sm tracking-[0.32em] uppercase transition-colors py-1.5',
                        activeSectionId === heading.id
                          ? isLightMode ? 'text-slate-900' : 'text-white'
                          : isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-gray-100'
                      )}
                      style={{ paddingLeft: `${(heading.level - 1) * 10}px` }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
