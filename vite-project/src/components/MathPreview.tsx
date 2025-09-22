import { useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { convertNumbersToFarsi } from '@/utils/mathUtils';

interface MathPreviewProps {
  text: string;
  className?: string;
}

export function MathPreview({ text, className = '' }: MathPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // اعمال فونت Ravi به اعداد فارسی بعد از رندر
  useEffect(() => {
    if (!containerRef.current) return;
    
    const applyFontToDigits = () => {
      const allSpans = containerRef.current!.querySelectorAll('span');
      allSpans.forEach(span => {
        const text = span.textContent || '';
        if (/[۰-۹]/.test(text)) {
          span.style.fontFamily = '"Ravi FaNum", serif';
        }
      });
    };

    // اجرای تابع با تاخیر کوتاه تا KaTeX رندر شود
    const timer = setTimeout(applyFontToDigits, 50);
    return () => clearTimeout(timer);
  }, [text]);

  // تابع برای پردازش متن و جدا کردن قسمت‌های ریاضی
  const renderMathText = (input: string) => {
    const parts = input.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math - تبدیل اعداد به فارسی
        const math = convertNumbersToFarsi(part.slice(2, -2));
        return <BlockMath 
          key={index} 
          math={math}
        />;
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        // Inline math - تبدیل اعداد به فارسی
        const math = convertNumbersToFarsi(part.slice(1, -1));
        return <InlineMath 
          key={index} 
          math={math}
        />;
      } else {
        // Regular text - تبدیل اعداد به فارسی
        return <span key={index} className="text-fanum">{convertNumbersToFarsi(part)}</span>;
      }
    });
  };

  return (
    <div ref={containerRef} className={`prose prose-sm max-w-none math-persian-numbers ${className}`}>
      {renderMathText(text)}
    </div>
  );
}