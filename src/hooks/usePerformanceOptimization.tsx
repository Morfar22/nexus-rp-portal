import { useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Monitor LCP
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // Monitor CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('CLS:', clsValue);
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, []);
};

// Hook for debounced callbacks
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  return useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  ) as T;
};

// Hook for optimized search
export const useOptimizedSearch = (searchTerm: string, data: any[], searchKey: string) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      item[searchKey]?.toLowerCase().includes(lowercaseSearch)
    );
  }, [searchTerm, data, searchKey]);
};

// Hook for virtual scrolling (basic)
export const useVirtualScrolling = (items: any[], containerHeight: number, itemHeight: number) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.floor(visibleCount / 2);
    
    return {
      visibleCount: visibleCount + bufferSize * 2,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
        const endIndex = Math.min(items.length, startIndex + visibleCount + bufferSize * 2);
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex)
        };
      }
    };
  }, [items, containerHeight, itemHeight]);
};

// Hook for preloading resources
export const usePreloadResources = (resources: string[]) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }, [resources]);
};