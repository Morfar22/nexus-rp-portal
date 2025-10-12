import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useStaffDataInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAndInitializeData = async () => {
      if (isInitialized) return;
      
      setIsLoading(true);
      try {
        // Check if we have any analytics data
        const { data: analyticsData } = await supabase
          .from('website_analytics')
          .select('id')
          .limit(1);

        // Check if we have any financial data
        const { data: financialData } = await supabase
          .from('financial_metrics')
          .select('id')
          .limit(1);

        // Check if we have any server performance data
        const { data: serverData } = await supabase
          .from('server_performance_metrics')
          .select('id')
          .limit(1);

        // If we don't have enough data, seed some sample data
        const needsSeeding = !analyticsData?.length || !financialData?.length || !serverData?.length;

        if (needsSeeding) {
          console.log('Staff panel: Initializing sample data...');
          
          // Seed sample data in the background
          if (!analyticsData?.length) {
            try {
              await supabase.functions.invoke('data-seeder', {
                body: { action: 'seedAnalytics' }
              });
            } catch (error) {
              console.log('Could not seed analytics data:', error);
            }
          }

          if (!financialData?.length) {
            try {
              await supabase.functions.invoke('data-seeder', {
                body: { action: 'seedFinancialData' }
              });
            } catch (error) {
              console.log('Could not seed financial data:', error);
            }
          }

          if (!serverData?.length) {
            try {
              await supabase.functions.invoke('data-seeder', {
                body: { action: 'seedServerPerformance' }
              });
            } catch (error) {
              console.log('Could not seed server data:', error);
            }
          }

          // Also seed some activity logs
          try {
            await supabase.functions.invoke('data-seeder', {
              body: { action: 'seedActivityLogs' }
            });
          } catch (error) {
            console.log('Could not seed activity logs:', error);
          }

          console.log('Staff panel: Sample data initialization complete');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing staff data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndInitializeData();
  }, [isInitialized]);

  return { isInitialized, isLoading };
};