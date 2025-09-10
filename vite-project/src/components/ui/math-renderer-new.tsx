import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
}

// Function to properly convert HTML math to LaTeX format
const preprocessMathContent = (content: string): string => {
  // Create a temporary element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = content;
  let processed = textarea.value;
  
  // Convert HTML entities to proper characters first
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&amp;/g, '&');
  processed = processed.replace(/&quot;/g, '"');
  processed = processed.replace(/&#39;/g, "'");
  
  // Convert HTML sub/sup tags to LaTeX format (case insensitive and global)
  processed = processed.replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
  processed = processed.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}');
  
  // Handle mathematical expressions that need to be wrapped in $ for inline math
  // First, protect existing math expressions by temporarily replacing $ with a placeholder
  const mathPlaceholder = '__MATH_PLACEHOLDER__';
  const existingMath = processed.match(/\$[^$]+\$/g) || [];
  existingMath.forEach((math, index) => {
    processed = processed.replace(math, `${mathPlaceholder}${index}${mathPlaceholder}`);
  });
  
  // Convert common math patterns to LaTeX
  // Variables with subscripts and superscripts
  processed = processed.replace(/([a-zA-Z])\s*_\s*([a-zA-Z0-9]+)/g, '$$$1_{$2}$$');
  processed = processed.replace(/([a-zA-Z])\s*\^\s*([a-zA-Z0-9]+)/g, '$$$1^{$2}$$');
  
  // More complex expressions with parentheses
  processed = processed.replace(/([a-zA-Z]+)\s*_\s*\{([^}]+)\}/g, '$$$1_{$2}$$');
  processed = processed.replace(/([a-zA-Z]+)\s*\^\s*\{([^}]+)\}/g, '$$$1^{$2}$$');
  
  // Handle integrals
  processed = processed.replace(/∫_\{([^}]+)\}\^\{([^}]+)\}/g, '$$\\int_{$1}^{$2}$$');
  processed = processed.replace(/∬_\{([^}]+)\}/g, '$$\\iint_{$1}$$');
  processed = processed.replace(/∫([^$]*?)d([xyz])/g, '$$\\int $1 d$2$$');
  
  // Handle square roots with parentheses or expressions
  processed = processed.replace(/√\(([^)]+)\)/g, '$$\\sqrt{$1}$$');
  processed = processed.replace(/√([a-zA-Z0-9]+)/g, '$$\\sqrt{$1}$$');
  
  // Restore existing math expressions
  existingMath.forEach((math, index) => {
    processed = processed.replace(`${mathPlaceholder}${index}${mathPlaceholder}`, math);
  });
  
  
  // Convert mathematical symbols to LaTeX (only if not already in math mode)
  processed = processed.replace(/∫/g, '\\int');
  processed = processed.replace(/∬/g, '\\iint');
  processed = processed.replace(/∭/g, '\\iiint');
  processed = processed.replace(/∂/g, '\\partial');
  processed = processed.replace(/√/g, '\\sqrt');
  processed = processed.replace(/≤/g, '\\leq');
  processed = processed.replace(/≥/g, '\\geq');
  processed = processed.replace(/≠/g, '\\neq');
  processed = processed.replace(/≈/g, '\\approx');
  processed = processed.replace(/∞/g, '\\infty');
  processed = processed.replace(/±/g, '\\pm');
  processed = processed.replace(/π/g, '\\pi');
  processed = processed.replace(/α/g, '\\alpha');
  processed = processed.replace(/β/g, '\\beta');
  processed = processed.replace(/γ/g, '\\gamma');
  processed = processed.replace(/δ/g, '\\delta');
  processed = processed.replace(/ε/g, '\\epsilon');
  processed = processed.replace(/θ/g, '\\theta');
  processed = processed.replace(/λ/g, '\\lambda');
  processed = processed.replace(/μ/g, '\\mu');
  processed = processed.replace(/σ/g, '\\sigma');
  processed = processed.replace(/φ/g, '\\phi');
  processed = processed.replace(/ω/g, '\\omega');
  
  return processed;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Process the content to handle math properly
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
          p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
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
          
          // Math-specific components
          div: ({className, children, ...props}) => {
            if (className?.includes('math-display')) {
              return (
                <div className="my-6 text-center overflow-x-auto bg-muted/20 p-4 rounded-lg border" dir="ltr" {...props}>
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
