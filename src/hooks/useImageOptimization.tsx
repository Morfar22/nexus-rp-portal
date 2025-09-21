import { useState, useCallback } from 'react';

interface OptimizedImageUrls {
  webp?: string;
  avif?: string;
  original: string;
}

export const useImageOptimization = () => {
  const [optimizing, setOptimizing] = useState(false);

  const generateOptimizedUrls = useCallback((originalUrl: string): OptimizedImageUrls => {
    // For existing images, we can generate WebP versions
    const isPublicAsset = originalUrl.startsWith('/public/') || originalUrl.startsWith('/assets/');
    
    if (isPublicAsset) {
      const basePath = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '');
      return {
        avif: `${basePath}.avif`,
        webp: `${basePath}.webp`,
        original: originalUrl
      };
    }

    return { original: originalUrl };
  }, []);

  const convertToWebP = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/webp',
            0.8 // Quality setting
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const optimizeImageFile = useCallback(async (file: File) => {
    setOptimizing(true);
    try {
      const webpBlob = await convertToWebP(file);
      const webpFile = new File([webpBlob], file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), {
        type: 'image/webp'
      });
      
      return {
        original: file,
        webp: webpFile,
        sizeSaved: file.size - webpBlob.size
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      return { original: file };
    } finally {
      setOptimizing(false);
    }
  }, [convertToWebP]);

  return {
    optimizing,
    generateOptimizedUrls,
    optimizeImageFile,
    convertToWebP
  };
};