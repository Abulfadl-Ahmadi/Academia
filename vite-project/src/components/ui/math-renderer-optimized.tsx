import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { convertNumbersToFarsi } from '@/utils/mathUtils';

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = '' }: MathRendererProps) {
  // Split into paragraphs by two or more newlines
  const paragraphs = content.split(/\n{2,}/g);

  // Helper: split a paragraph into math/text parts
  const splitParts = (text: string) => text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none question-text ${className}`} dir="rtl">
      {paragraphs.map((para, pIdx) => {
        const parts = splitParts(para);
        const blocks: React.ReactNode[] = [];
        let line: React.ReactNode[] = [];
        let lineKey = 0;
        const flushLine = () => {
          if (line.length > 0) {
            // Check if line contains only one InlineMath
            if (
              line.length === 1 &&
              React.isValidElement(line[0]) &&
              (line[0] as any).type &&
              (line[0] as any).type.displayName === 'InlineMath'
            ) {
              blocks.push(
                <p key={`p-${pIdx}-${lineKey++}`} className="question-text ltr text-left" dir="ltr">
                  {line}
                </p>
              );
            } else {
              blocks.push(
                <p key={`p-${pIdx}-${lineKey++}`} className="question-text" dir="rtl">
                  {line}
                </p>
              );
            }
            line = [];
          }
        };
        parts.forEach((part, idx) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            flushLine();
            const math = convertNumbersToFarsi(part.slice(2, -2));
            blocks.push(<BlockMath key={`bm-${pIdx}-${idx}`} math={math} />);
          } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
            // Inline math
            const math = convertNumbersToFarsi(part.slice(1, -1));
            const el = <InlineMath key={`im-${pIdx}-${idx}`} math={math} />;
            // Set displayName for detection
            (el.type as any).displayName = 'InlineMath';
            line.push(el);
          } else if (part.length > 0) {
            // Markdown text
            line.push(
              <ReactMarkdown
                key={`md-${pIdx}-${idx}`}
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children, ...props }) => (
                    <span {...props}>{children}</span>
                  ),
                }}
              >
                {convertNumbersToFarsi(part)}
              </ReactMarkdown>
            );
          }
        });
        flushLine();
        return <React.Fragment key={pIdx}>{blocks}</React.Fragment>;
      })}
    </div>
  );
}

export default MathRenderer;
