'use client';

import React from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertTable,
  ListsToggle,
  BlockTypeSelect,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface MarkdownEditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const MarkdownEditor = React.forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ markdown, onChange, readOnly = false, className = '' }, ref) => {
    // Filter out YAML frontmatter for display
    const displayContent = markdown.replace(/^---[\s\S]*?---\n/, '');

    return (
      <div className={`markdown-editor-wrapper ${className}`}>
        <MDXEditor
          ref={ref}
          markdown={displayContent}
          onChange={onChange}
          readOnly={readOnly}
          contentEditableClassName="prose max-w-none"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                javascript: 'JavaScript',
                ts: 'TypeScript',
                typescript: 'TypeScript',
                python: 'Python',
                bash: 'Bash',
                json: 'JSON',
                css: 'CSS',
                html: 'HTML',
                markdown: 'Markdown',
              },
            }),
            diffSourcePlugin({ viewMode: 'rich-text' }),
            ...(readOnly
              ? []
              : [
                  toolbarPlugin({
                    toolbarContents: () => (
                      <>
                        <UndoRedo />
                        <BlockTypeSelect />
                        <BoldItalicUnderlineToggles />
                        <CodeToggle />
                        <CreateLink />
                        <ListsToggle />
                        <InsertTable />
                      </>
                    ),
                  }),
                ]),
          ]}
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';
