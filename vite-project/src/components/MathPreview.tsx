import { useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathPreviewProps {
  text: string;
  className?: string;
}

export function MathPreview({ text, className = '' }: MathPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // تابع برای اعمال فونت فارسی به اعداد
  const applyPersianNumberFont = () => {
    if (!containerRef.current) return;
    
    const mathElements = containerRef.current.querySelectorAll('.katex .mord');
    mathElements.forEach((element) => {
      const textContent = element.textContent || '';
      // بررسی اینکه آیا محتوا فقط عدد است (یک یا چند رقم)
      if (/^[0-9]+([.,][0-9]+)?$/.test(textContent.trim())) {
        element.classList.add('persian-number');
      } else {
        // حذف کلاس اگر دیگر عدد نیست
        element.classList.remove('persian-number');
      }
    });
  };

  // اعمال فونت بعد از رندر شدن
  useEffect(() => {
    const timer = setTimeout(applyPersianNumberFont, 100);
    return () => clearTimeout(timer);
  }, [text]);

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
        // Regular text - استفاده از فونت FaNum برای متن عادی
        return <span key={index} className="text-fanum">{part}</span>;
      }
    });
  };

  return (
    <div ref={containerRef} className={`prose prose-sm max-w-none math-persian-numbers ${className}`}>
      {renderMathText(text)}
    </div>
  );
}