import { MathRenderer } from '@/components/ui/math-renderer-optimized';
import 'katex/dist/katex.min.css';

interface MathPreviewProps {
  text: string;
  className?: string;
}

export function MathPreview({ text, className = '' }: MathPreviewProps) {
  // Handle undefined or null text
  const safeText = text || '';
  return <div className={`persian-number ${className}`}><MathRenderer content={safeText} /></div>;
}