import Navbar from "@/components/Navbar";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <AnalyticsDashboard />
      </main>
    </div>
  );
};

export default Analytics;