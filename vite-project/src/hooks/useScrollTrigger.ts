import { useState, useEffect, useRef } from 'react';

type UseScrollTriggerOptions = IntersectionObserverInit;

export const useScrollTrigger = (
  options: UseScrollTriggerOptions = {}
): [React.RefObject<HTMLDivElement | null>, boolean, boolean] => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

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