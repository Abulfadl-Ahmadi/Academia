import { useState, useEffect, useRef } from 'react';

interface UseScrollTriggerOptions extends IntersectionObserverInit {}

export const useScrollTrigger = (
  options: UseScrollTriggerOptions = {}
): [React.RefObject<HTMLDivElement>, boolean, boolean] => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setIsVisible(true);
          setHasTriggered(true);
        }
      },
      {
        threshold: 0.3,
        rootMargin: '-100px 0px',
        ...options,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasTriggered, options]);

  return [ref, isVisible, hasTriggered];
};