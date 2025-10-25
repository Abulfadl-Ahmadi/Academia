import React from 'react';

interface PersianNumberProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component to properly render Persian numbers with correct boundaries
 * Prevents glyph box boundary errors and overlapping with letters
 */
export const PersianNumber: React.FC<PersianNumberProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  return (
    <span 
      className={`persian-number ${className}`}
      style={{
        direction: 'ltr',
        unicodeBidi: 'embed',
        display: 'inline-block',
        whiteSpace: 'nowrap',
        margin: '0 1px',
        fontFamily: '"Ravi FaNum", "IRANSansX", serif',
        ...style
      }}
    >
      {children}
    </span>
  );
};

/**
 * Component for mixed Persian text with numbers
 */
export const PersianText: React.FC<PersianNumberProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`persian-text ${className}`}
      style={{
        direction: 'rtl',
        textAlign: 'justify',
        unicodeBidi: 'embed',
        ...style
      }}
    >
      {children}
    </div>
  );
};

/**
 * Component for mathematical expressions with Persian numbers
 */
export const MathPersian: React.FC<PersianNumberProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  return (
    <span 
      className={`math-persian ${className}`}
      style={{
        direction: 'ltr',
        fontFamily: '"Ravi FaNum", "KaTeX_Main", serif',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    >
      {children}
    </span>
  );
};

/**
 * Utility function to wrap Persian numbers in text
 */
export const wrapPersianNumbers = (text: string): React.ReactNode => {
  // Regular expression to match Persian numbers (۰-۹)
  const persianNumberRegex = /[\u06F0-\u06F9]+/g;
  
  if (!persianNumberRegex.test(text)) {
    return text;
  }
  
  const parts = text.split(persianNumberRegex);
  const numbers = text.match(persianNumberRegex) || [];
  
  const result: React.ReactNode[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      result.push(parts[i]);
    }
    if (numbers[i]) {
      result.push(
        <PersianNumber key={`num-${i}`}>
          {numbers[i]}
        </PersianNumber>
      );
    }
  }
  
  return result;
};

export default PersianNumber;
