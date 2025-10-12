import { useState, useEffect, useRef } from 'react';

export const useNavbarOverflow = (items: any[], enabled: boolean = true) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      
      if (!container || !content) return;

      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      
      // Add some buffer space (100px) to prevent edge cases
      const buffer = 100;
      const wouldOverflow = contentWidth + buffer > containerWidth;
      
      setIsOverflowing(wouldOverflow);
    };

    // Check on mount and resize
    checkOverflow();
    
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', checkOverflow);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [items, enabled]);

  return {
    isOverflowing,
    containerRef,
    contentRef
  };
};