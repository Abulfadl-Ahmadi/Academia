import { useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { MathRenderer } from '@/components/ui/math-renderer-optimized';
import 'katex/dist/katex.min.css';
import { convertNumbersToFarsi } from '@/utils/mathUtils';

interface MathPreviewProps {
  text: string;
  className?: string;
}

export function MathPreview({ text, className = '' }: MathPreviewProps) {
  return <MathRenderer content={text} />;
  const containerRef = useRef<HTMLDivElement>(null);

  // اعمال فونت Ravi به اعداد فارسی - بهتر و پایدارتر
  useEffect(() => {
    const applyPersianFont = () => {
      if (!containerRef.current) return;
      
      // پیدا کردن همه عناصری که حاوی اعداد فارسی هستند
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent && /[۰-۹]/.test(node.textContent)) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const parent = textNode.parentElement;
        if (parent && !parent.classList.contains('persian-number')) {
          parent.classList.add('persian-number');
          parent.style.fontFamily = '"Ravi FaNum", serif';
        }
      });
    };

    // اجرای فوری + اجرای با تاخیر برای اطمینان
    applyPersianFont();
    const timer = setTimeout(applyPersianFont, 100);
    
    // MutationObserver برای تغییرات DOM
    const observer = new MutationObserver(applyPersianFont);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
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