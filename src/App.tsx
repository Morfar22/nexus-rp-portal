import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { CustomAuthProvider } from "@/hooks/useCustomAuth";
import { ServerSettingsProvider } from "@/hooks/useServerSettings";
import { GlobalPresenceProvider } from "@/contexts/GlobalPresenceContext";
import { usePerformanceMonitor } from "@/hooks/usePerformanceOptimization";
import CustomProtectedRoute from "@/components/CustomProtectedRoute";
import StaffProtectedRoute from "@/components/StaffProtectedRoute";
import MaintenanceMode from "@/components/MaintenanceMode";
import ApplicationGate from "@/components/ApplicationGate";
import PrivacyNotice from "@/components/PrivacyNotice";
import Footer from "@/components/Footer";
import KillSwitch from "@/components/KillSwitch";
import Index from "./pages/Index";

const LazyKillSwitchControl = lazy(() => import("./pages/KillSwitchControl"));

// Lazy load heavy pages for better Core Web Vitals
const LazyCustomAuth = lazy(() => import("./pages/CustomAuth"));

const LazyApplicationForm = lazy(() => import("./pages/ApplicationForm"));
const LazyRules = lazy(() => import("./pages/Rules"));
const LazyLaws = lazy(() => import("./pages/Laws"));
const LazyStaffPanel = lazy(() => import("./pages/StaffPanel"));
const LazyOurTeam = lazy(() => import("./pages/OurTeam"));
const LazyPartners = lazy(() => import("./pages/Partners"));

const LazyProfile = lazy(() => import("./pages/Profile"));
const LazyLive = lazy(() => import("./pages/Live"));
const LazyPackages = lazy(() => import("./pages/Packages"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));
const LazySupporters = lazy(() => import("./pages/Supporters"));
const LazyCharacters = lazy(() => import("./pages/Characters"));
const LazyEvents = lazy(() => import("./pages/Events"));
const LazyVoting = lazy(() => import("./pages/Voting"));
const LazyAchievements = lazy(() => import("./pages/Achievements"));
const LazyAnalytics = lazy(() => import("./pages/Analytics"));
const LazyCreativeTools = lazy(() => import("./pages/CreativeTools"));
const LazyResetPassword = lazy(() => import("./pages/ResetPassword"));
const LazyKeybinds = lazy(() => import("./pages/Keybinds"));

// Optimized loading component for better perceived performance and CLS prevention
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <div className="animate-pulse space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Optimized QueryClient for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize for better performance and reduced network requests
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetching
      gcTime: 10 * 60 * 1000, // 10 minutes - keep data in memory longer (renamed from cacheTime)
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      retry: 2, // Reduce retry attempts for faster error handling
      refetchOnReconnect: 'always', // Sync when connection restored
    },
  },
});

const AppContent = () => {
  // Monitor Core Web Vitals for performance optimization
  usePerformanceMonitor();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <KillSwitch />
        <MaintenanceMode />
        <PrivacyNotice />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              {/* Emergency kill switch control - admin only */}
              <Route path="/emergency-control" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyKillSwitchControl />
                </Suspense>
              } />
              
              {/* Keep Index non-lazy as it's the main landing page for LCP optimization */}
              <Route path="/" element={<Index />} />
              
              {/* Lazy load all other routes with optimized loaders */}
              <Route path="/auth" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyCustomAuth />
                </Suspense>
              } />
              
              <Route path="/reset-password" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyResetPassword />
                </Suspense>
              } />
              
              <Route path="/rules" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyRules />
                </Suspense>
              } />
              
              <Route path="/laws" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyLaws />
                </Suspense>
              } />
              
              
              <Route path="/application-form" element={
                <CustomProtectedRoute>
                  <ApplicationGate>
                    <Suspense fallback={<PageLoader />}>
                      <LazyApplicationForm />
                    </Suspense>
                  </ApplicationGate>
                </CustomProtectedRoute>
              } />
              
              <Route path="/staff" element={
                <StaffProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <LazyStaffPanel />
                  </Suspense>
                </StaffProtectedRoute>
              } />
              
              
              <Route path="/team" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyOurTeam />
                </Suspense>
              } />
              
              <Route path="/partners" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyPartners />
                </Suspense>
              } />
              
              <Route path="/supporters" element={
                <Suspense fallback={<PageLoader />}>
                  <LazySupporters />
                </Suspense>
              } />
              
              <Route path="/packages" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyPackages />
                </Suspense>
              } />
              
              <Route path="/live" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyLive />
                </Suspense>
              } />
              
              <Route path="/characters" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyCharacters />
                </Suspense>
              } />
              
              <Route path="/events" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyEvents />
                </Suspense>
              } />
              
              <Route path="/voting" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyVoting />
                </Suspense>
              } />
              
              <Route path="/achievements" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyAchievements />
                </Suspense>
              } />
              
              <Route path="/analytics" element={
                <StaffProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <LazyAnalytics />
                  </Suspense>
                </StaffProtectedRoute>
              } />
              
              <Route path="/creative-tools" element={
                <StaffProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <LazyCreativeTools />
                  </Suspense>
                </StaffProtectedRoute>
              } />
              
              <Route path="/keybinds" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyKeybinds />
                </Suspense>
              } />
              
              <Route path="/profile" element={
                <CustomProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <LazyProfile />
                  </Suspense>
                </CustomProtectedRoute>
              } />
              
              {/* Catch-all route - keep at the end */}
              <Route path="*" element={
                <Suspense fallback={<PageLoader />}>
                  <LazyNotFound />
                </Suspense>
              } />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <CustomAuthProvider>
        <ServerSettingsProvider>
          <GlobalPresenceProvider>
            <AppContent />
          </GlobalPresenceProvider>
        </ServerSettingsProvider>
      </CustomAuthProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
