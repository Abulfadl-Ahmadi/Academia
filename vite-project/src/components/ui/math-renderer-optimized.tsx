import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
}

// Simplified preprocessing for properly formatted content
const preprocessMathContent = (content: string): string => {
  // Create a temporary element to decode HTML entities (just in case)
  const textarea = document.createElement('textarea');
  textarea.innerHTML = content;
  let processed = textarea.value;
  
  console.log('Original content:', content);
  console.log('After HTML decode:', processed);
  
  // Only minimal processing needed since AI should format correctly
  // Convert HTML entities to proper characters
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&amp;/g, '&');
  processed = processed.replace(/&quot;/g, '"');
  processed = processed.replace(/&#39;/g, "'");
  
  // Fallback: Convert any remaining HTML sub/sup tags (if AI doesn't follow instructions)
  processed = processed.replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
  processed = processed.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}');
  
  // Fallback: Handle any unformatted math symbols (if AI doesn't follow instructions)
  processed = processed.replace(/([^$])π([^$])/g, '$1$\\pi$$2');
  processed = processed.replace(/([^$])φ([^$])/g, '$1$\\phi$$2');
  processed = processed.replace(/([^$])θ([^$])/g, '$1$\\theta$$2');
  
  console.log('Final processed content:', processed);
  
  return processed;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Process the content to handle any remaining issues
  const processedContent = preprocessMathContent(content);

  
  
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none" dir="rtl">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // @ts-expect-error - inline prop is correctly handled by ReactMarkdown
          code: ({inline, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            
            if (inline) {
              return <code className="bg-muted/70 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
            }
            
            return (
              <pre className="bg-muted/70 p-3 rounded-md my-3 overflow-x-auto">
                <code className={`language-${match?.[1] || 'text'} text-sm`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          p: (props) => <p className="mb-0 leading-relaxed" {...props} />,
          h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />,
          h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props} />,
          h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />,
          ul: (props) => <ul className="list-disc list-inside mb-4 pr-5 space-y-1" {...props} />,
          ol: (props) => <ol className="list-decimal list-inside mb-4 pr-5 space-y-1" {...props} />,
          a: (props) => <a className="text-primary hover:underline transition-colors" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-r-4 border-primary/30 pr-3 py-2 my-3 italic bg-muted/30 rounded-l" {...props} />
          ),
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          em: (props) => <em className="italic text-foreground" {...props} />,
          
          // Math-specific components with LTR direction
          div: ({className, children, ...props}) => {
            if (className?.includes('math-display')) {
              return (
                <div className="my-6 text-center overflow-x-auto bg-muted/20 p-4 rounded-lg border w-full" dir="ltr" {...props}>
                  {children}
                </div>
              );
            }
            return <div className={className} {...props}>{children}</div>;
          },
          
          span: ({className, children, ...props}) => {
            if (className?.includes('math-inline')) {
              return (
                <span className="mx-1 inline-block math-inline-wrapper" dir="ltr" {...props}>
                  {children}
                </span>
              );
            }
            return <span className={className} {...props}>{children}</span>;
          },
          
          // Table support
          table: (props) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="border border-border px-3 py-2 bg-muted font-semibold text-left" {...props} />
          ),
          td: (props) => (
            <td className="border border-border px-3 py-2" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MathRenderer;
