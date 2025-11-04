'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { essays } from './essays';
import { cn } from '@/lib/utils';

interface EssayReaderProps {
  essayId: string | null;
  onClose: () => void;
}

interface ParsedSection {
  id: string;
  heading: string;
  level: number;
  html: string;
}

interface ParsedEssay {
  sections: ParsedSection[];
  allSections: ParsedSection[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function convertInlineMarkdown(text: string) {
  let converted = text;
  converted = converted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  converted = converted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  converted = converted.replace(/`([^`]+)`/g, '<code>$1</code>');
  return converted;
}

function blockToHtml(lines: string[]) {
  if (lines.length === 0) {
    return '';
  }

  const trimmed = lines.map(line => line.trim());
  const isUnorderedList = trimmed.every(line => /^[-*+]\s+/.test(line));
  const isOrderedList = trimmed.every(line => /^\d+\.\s+/.test(line));

  if (isUnorderedList) {
    const items = trimmed
      .map(line => line.replace(/^[-*+]\s+/, ''))
      .map(item => `<li>${convertInlineMarkdown(item)}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }

  if (isOrderedList) {
    const items = trimmed
      .map(line => line.replace(/^\d+\.\s+/, ''))
      .map(item => `<li>${convertInlineMarkdown(item)}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  }

  const paragraph = convertInlineMarkdown(trimmed.join(' '));
  return `<p>${paragraph}</p>`;
}

function parseMarkdown(markdown: string): ParsedEssay {
  const lines = markdown.split(/\r?\n/);
  const sections: ParsedSection[] = [];

  let current: ParsedSection | null = null;
  let blockBuffer: string[] = [];
  const rootBlocks: string[] = [];

  const flushBlock = () => {
    if (blockBuffer.length === 0) {
      return;
    }

    const html = blockToHtml(blockBuffer);

    if (current) {
      current.html += html;
    } else {
      rootBlocks.push(html);
    }

    blockBuffer = [];
  };

  lines.forEach(line => {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      flushBlock();

      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const id = slugify(headingText);

      current = {
        id,
        heading: headingText,
        level,
        html: ''
      };

      sections.push(current);
    } else if (line.trim() === '') {
      flushBlock();
    } else {
      blockBuffer.push(line);
    }
  });

  flushBlock();

  if (sections.length === 0 && rootBlocks.length > 0) {
    sections.push({
      id: 'overview',
      heading: 'Overview',
      level: 2,
      html: rootBlocks.join('')
    });
  } else if (rootBlocks.length > 0) {
    // Attach introductory blocks to the first section
    sections[0].html = rootBlocks.join('') + sections[0].html;
  }

  const tocSections = sections.filter(section => section.level <= 3);

  return {
    sections: tocSections,
    allSections: sections
  };
}

export function EssayReader({ essayId, onClose }: EssayReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const essay = essayId ? essays[essayId] : null;

  const parsed = useMemo(() => {
    if (!essay) {
      return { sections: [], allSections: [] };
    }
    return parseMarkdown(essay.markdown);
  }, [essay]);

  useEffect(() => {
    setActiveSectionId(parsed.sections[0]?.id ?? null);
  }, [parsed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const headings = Array.from(
      container.querySelectorAll<HTMLElement>('[data-essay-heading="true"]')
    );

    if (headings.length === 0) {
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

    headings.forEach(heading => observer.observe(heading));

    return () => observer.disconnect();
  }, [parsed.allSections]);

  if (!essay) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-gray-600">
        <p className="text-[11px] tracking-[2px]">SELECT AN ESSAY OR DOCUMENT</p>
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
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-40">
        <ScrollProgress
          containerRef={containerRef}
          className="h-[2px] bg-white/70"
        />
      </div>

      <div
        ref={containerRef}
        className="relative h-full overflow-y-auto scroll-smooth"
      >
        <div className="mx-auto w-full max-w-[1300px] px-6 md:px-12 lg:px-20 pt-8 pb-24 text-gray-200">
          <div className="relative">
            <article className="space-y-16 lg:pr-[360px]">
              <div className="space-y-4 border-b border-gray-800 pb-8 lg:pb-10">
                <p className="text-[11px] uppercase tracking-[0.42em] text-gray-500">
                  Essay
                </p>
                <h1 className="text-[34px] md:text-[40px] font-light tracking-[0.32em] text-white">
                  {essay.title}
                </h1>
                {essay.subtitle && (
                  <p className="text-[12px] text-gray-400 tracking-[0.28em] uppercase">
                    {essay.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center text-xs uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors lg:hidden"
              >
                Close
              </button>

              <div className="space-y-16 text-gray-200">
                {parsed.allSections.map(section => (
                  <section key={section.id}>
                    <h2
                      id={section.id}
                      data-essay-heading="true"
                      className={cn(
                        'scroll-mt-24 text-[26px] md:text-[30px] font-light tracking-[0.24em] text-white mb-8',
                        section.level === 3 && 'text-[22px] md:text-[26px]'
                      )}
                    >
                      {section.heading}
                    </h2>
                    <div
                      className="space-y-6 text-[15px] leading-[2] tracking-[0.02em] text-gray-200
                      [&_p]:text-gray-200 [&_p]:leading-[2] [&_p]:tracking-[0.01em]
                      [&_p_strong]:text-white [&_em]:text-gray-300 [&_code]:text-gray-100 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded-sm
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-3
                      [&_li]:text-gray-200 [&_li>strong]:text-white"
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
      {parsed.sections.length > 0 && (
        <div className="hidden lg:block fixed top-[88px] right-0 z-40 group/toc">
          <div className="relative h-[calc(100vh-160px)]">
            <aside
              className="pointer-events-auto relative z-10 flex h-full w-[320px] translate-x-[calc(100%-64px)] overflow-hidden rounded-l-sm border border-white/15 transition-transform duration-300 ease-out group-hover/toc:translate-x-0 group-focus-within/toc:translate-x-0"
            >
              <div className="flex h-full w-16 items-center justify-center border-r border-white/10 bg-white/15 backdrop-blur-md">
                <span className="rotate-90 text-[10px] uppercase tracking-[0.55em] text-white/70">
                  Contents
                </span>
              </div>
              <div className="flex-1 h-full bg-black/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.65)] flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 text-[11px] uppercase tracking-[0.4em] text-white/60">
                  <span>Sections</span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="Close essay view"
                  >
                    ✕
                  </button>
                </div>
                <div className="px-6 pb-6 overflow-y-auto space-y-2 scrollbar-thin-custom">
                  {parsed.sections.map(section => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleTocClick(section.id)}
                    className={cn(
                      'block w-full text-left text-[11px] tracking-[0.32em] uppercase transition-colors py-1.5 text-gray-400 hover:text-gray-100',
                      activeSectionId === section.id && 'text-white'
                    )}
                      style={{ paddingLeft: `${(section.level - 1) * 10}px` }}
                    >
                      {section.heading}
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
