import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
}

// Function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Function to convert HTML subscripts/superscripts to LaTeX
const convertToLatex = (text: string): string => {
  let converted = text;
  
  // Convert HTML subscripts to LaTeX
  converted = converted.replace(/<sub>(.*?)<\/sub>/g, '_{$1}');
  converted = converted.replace(/&lt;sub&gt;(.*?)&lt;\/sub&gt;/g, '_{$1}');
  
  // Convert HTML superscripts to LaTeX
  converted = converted.replace(/<sup>(.*?)<\/sup>/g, '^{$1}');
  converted = converted.replace(/&lt;sup&gt;(.*?)&lt;\/sup&gt;/g, '^{$1}');
  
  // Wrap mathematical expressions that contain subscripts/superscripts with dollar signs
  // Look for patterns like "x_u", "r_v", "∂g/∂x", etc.
  converted = converted.replace(/([a-zA-Z]+_[a-zA-Z0-9]+)/g, '$$$1$$');
  converted = converted.replace(/([a-zA-Z]+\^[a-zA-Z0-9]+)/g, '$$$1$$');
  converted = converted.replace(/(∂[a-zA-Z]+\/∂[a-zA-Z]+)/g, '$$$1$$');
  converted = converted.replace(/(∫[^.\s]*)/g, '$$$1$$');
  converted = converted.replace(/(∬[^.\s]*)/g, '$$$1$$');
  converted = converted.replace(/(√\([^)]+\))/g, '$$$1$$');
  
  // Convert common math symbols
  converted = converted.replace(/∫/g, '\\int');
  converted = converted.replace(/∬/g, '\\iint');
  converted = converted.replace(/∭/g, '\\iiint');
  converted = converted.replace(/∂/g, '\\partial');
  converted = converted.replace(/√/g, '\\sqrt');
  converted = converted.replace(/≤/g, '\\leq');
  converted = converted.replace(/≥/g, '\\geq');
  converted = converted.replace(/π/g, '\\pi');
  converted = converted.replace(/α/g, '\\alpha');
  converted = converted.replace(/β/g, '\\beta');
  converted = converted.replace(/γ/g, '\\gamma');
  converted = converted.replace(/δ/g, '\\delta');
  converted = converted.replace(/ε/g, '\\epsilon');
  converted = converted.replace(/θ/g, '\\theta');
  converted = converted.replace(/λ/g, '\\lambda');
  converted = converted.replace(/μ/g, '\\mu');
  converted = converted.replace(/σ/g, '\\sigma');
  converted = converted.replace(/φ/g, '\\phi');
  converted = converted.replace(/ω/g, '\\omega');
  
  return converted;
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
