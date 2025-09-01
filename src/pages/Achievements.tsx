import Navbar from "@/components/Navbar";
import AchievementSystem from "@/components/AchievementSystem";

const Achievements = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <AchievementSystem />
      </main>
    </div>
  );
};

export default Achievements;