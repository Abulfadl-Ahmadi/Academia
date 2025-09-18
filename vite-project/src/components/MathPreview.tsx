import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathPreviewProps {
  text: string;
  className?: string;
}

export function MathPreview({ text, className = '' }: MathPreviewProps) {
  // تابع برای پردازش متن و جدا کردن قسمت‌های ریاضی
  const renderMathText = (input: string) => {
    const parts = input.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math
        const math = part.slice(2, -2);
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        // Inline math
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderMathText(text)}
    </div>
  );
}