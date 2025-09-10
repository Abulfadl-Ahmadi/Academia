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
  
  console.log('Original content:', content);
  console.log('After HTML decode:', processed);
  
  // Convert HTML entities to proper characters first
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&amp;/g, '&');
  processed = processed.replace(/&quot;/g, '"');
  processed = processed.replace(/&#39;/g, "'");
  
  // Convert HTML sub/sup tags to LaTeX format (case insensitive and global)
  processed = processed.replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
  processed = processed.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}');
  
  console.log('After sub/sup conversion:', processed);
  
  // Protect existing math expressions
  const existingMath = [];
  const mathPlaceholder = '___MATH_PLACEHOLDER_';
  
  // Protect existing $...$ and $$...$$ expressions
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    existingMath.push(match);
    return `${mathPlaceholder}${existingMath.length - 1}${mathPlaceholder}`;
  });
  
  processed = processed.replace(/\$([^$\n]+)\$/g, (match) => {
    existingMath.push(match);
    return `${mathPlaceholder}${existingMath.length - 1}${mathPlaceholder}`;
  });
  
  // Convert mathematical expressions
  
  // Handle ² symbol specifically
  processed = processed.replace(/([a-zA-Z]+)²/g, '$$$1^2$$');
  processed = processed.replace(/([xyz])²/g, '$$$$1^2$$$$');
  
  // Handle subscripts and superscripts with better patterns
  processed = processed.replace(/([a-zA-Z]+)\s*_\s*([a-zA-ZφθπαβγδεζηλμνξοπρστυφχψωΦΘΠΣΩ0-9]+)/g, '$$$1_{$2}$$');
  processed = processed.replace(/([a-zA-Z]+)\s*\^\s*([a-zA-Z0-9]+)/g, '$$$1^{$2}$$');
  
  // Handle complex mathematical expressions with braces
  processed = processed.replace(/([a-zA-Z]+)\s*_\s*\{([^}]+)\}/g, '$$$1_{$2}$$');
  processed = processed.replace(/([a-zA-Z]+)\s*\^\s*\{([^}]+)\}/g, '$$$1^{$2}$$');
  
  // Handle trigonometric functions with superscripts
  processed = processed.replace(/(sin|cos|tan)²\(([^)]+)\)/g, '$$\\$1^2($2)$$');
  processed = processed.replace(/(sin|cos|tan)³\(([^)]+)\)/g, '$$\\$1^3($2)$$');
  processed = processed.replace(/(sin|cos|tan)⁴\(([^)]+)\)/g, '$$\\$1^4($2)$$');
  
  // Handle integrals with bounds
  processed = processed.replace(/∫_\{([^}]+)\}\^\{([^}]+)\}/g, '$$\\int_{$1}^{$2}$$');
  processed = processed.replace(/∬_\{([^}]+)\}/g, '$$\\iint_{$1}$$');
  processed = processed.replace(/∫\s*([^∫\n$]*?)\s*d([xyzθφuvw])/g, '$$\\int $1 \\, d$2$$');
  
  // Handle mathematical vectors and bold notation  
  processed = processed.replace(/\*\*r\*\*/g, '$$\\mathbf{r}$$');
  processed = processed.replace(/\*\*([a-zA-Z])\*\*/g, '$$\\mathbf{$1}$$');
  
  // Handle square roots
  processed = processed.replace(/√\(([^)]+)\)/g, '$$\\sqrt{$1}$$');
  processed = processed.replace(/√([a-zA-Z0-9]+)/g, '$$\\sqrt{$1}$$');
  
  // Handle mathematical symbols - Convert to LaTeX within math mode
  processed = processed.replace(/([^$])∫([^$])/g, '$1$$\\int$$$2');
  processed = processed.replace(/([^$])∬([^$])/g, '$1$$\\iint$$$2');
  processed = processed.replace(/([^$])∂([^$])/g, '$1$$\\partial$$$2');
  processed = processed.replace(/([^$])√([^$])/g, '$1$$\\sqrt$$$2');
  processed = processed.replace(/([^$])≤([^$])/g, '$1$$\\leq$$$2');
  processed = processed.replace(/([^$])≥([^$])/g, '$1$$\\geq$$$2');
  processed = processed.replace(/([^$])π([^$])/g, '$1$$\\pi$$$2');
  processed = processed.replace(/([^$])φ([^$])/g, '$1$$\\phi$$$2');
  processed = processed.replace(/([^$])θ([^$])/g, '$1$$\\theta$$$2');
  processed = processed.replace(/([^$])α([^$])/g, '$1$$\\alpha$$$2');
  processed = processed.replace(/([^$])β([^$])/g, '$1$$\\beta$$$2');
  processed = processed.replace(/([^$])γ([^$])/g, '$1$$\\gamma$$$2');
  processed = processed.replace(/([^$])δ([^$])/g, '$1$$\\delta$$$2');
  processed = processed.replace(/([^$])ε([^$])/g, '$1$$\\epsilon$$$2');
  processed = processed.replace(/([^$])λ([^$])/g, '$1$$\\lambda$$$2');
  processed = processed.replace(/([^$])μ([^$])/g, '$1$$\\mu$$$2');
  processed = processed.replace(/([^$])σ([^$])/g, '$1$$\\sigma$$$2');
  processed = processed.replace(/([^$])ω([^$])/g, '$1$$\\omega$$$2');
  
  // Handle symbols at the beginning or end of lines
  processed = processed.replace(/^∫/gm, '$$\\int$$');
  processed = processed.replace(/^∬/gm, '$$\\iint$$');
  processed = processed.replace(/^π/gm, '$$\\pi$$');
  processed = processed.replace(/^φ/gm, '$$\\phi$$');
  processed = processed.replace(/^θ/gm, '$$\\theta$$');
  
  processed = processed.replace(/∫$/gm, '$$\\int$$');
  processed = processed.replace(/∬$/gm, '$$\\iint$$');
  processed = processed.replace(/π$/gm, '$$\\pi$$');
  processed = processed.replace(/φ$/gm, '$$\\phi$$');
  processed = processed.replace(/θ$/gm, '$$\\theta$$');
  
  // Clean up multiple consecutive math delimiters
  processed = processed.replace(/\$\$\s*\$\$/g, '$$');
  processed = processed.replace(/\$\$([^$]*?)\$\$\$\$([^$]*?)\$\$/g, '$$$$1 $2$$$$');
  
  // Restore protected math expressions
  existingMath.forEach((math, index) => {
    processed = processed.replace(`${mathPlaceholder}${index}${mathPlaceholder}`, math);
  });
  
  console.log('Final processed content:', processed);
  
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
