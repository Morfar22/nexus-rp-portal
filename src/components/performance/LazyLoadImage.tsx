import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyLoadImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  webpSrc?: string;
  avifSrc?: string;
}

export const LazyLoadImage = ({ 
  src, 
  alt, 
  className, 
  placeholder,
  webpSrc,
  avifSrc 
}: LazyLoadImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder */}
      {!loaded && (
        <div 
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            className
          )}
        />
      )}
      
      {/* Optimized image with modern formats */}
      {inView && (
        <picture>
          {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={cn(
              "transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
              className
            )}
            onLoad={handleLoad}
            loading="lazy"
            decoding="async"
          />
        </picture>
      )}
    </div>
  );
};