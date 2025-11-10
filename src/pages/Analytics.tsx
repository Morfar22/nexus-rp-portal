import Navbar from "@/components/Navbar";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ServerStatsHistory from "@/components/ServerStatsHistory";

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <AnalyticsDashboard />
        <ServerStatsHistory />
      </main>
    </div>
  );
};

export default Analytics;