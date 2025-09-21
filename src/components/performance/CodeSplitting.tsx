import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/AnalyticsDashboard')
);

export const LazyCharacterGallery = lazy(() => 
  import('@/components/CharacterGallery')
);

export const LazyLiveChatSupport = lazy(() => 
  import('@/components/LiveChatSupport')
);

export const LazyCreativeTools = lazy(() => 
  import('@/components/CreativeTools')
);

// HOC for wrapping lazy components with suspense
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <Suspense fallback={fallback || <ComponentSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};

// Default loading skeleton
const ComponentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-[200px]" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Wrapped components ready for use
export const AnalyticsDashboard = withSuspense(LazyAnalyticsDashboard);
export const CharacterGallery = withSuspense(LazyCharacterGallery);
export const LiveChatSupport = withSuspense(LazyLiveChatSupport);
export const CreativeTools = withSuspense(LazyCreativeTools);