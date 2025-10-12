import Navbar from "@/components/Navbar";
import CreativeToolsComponent from "@/components/CreativeTools";

const CreativeTools = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <CreativeToolsComponent />
      </main>
    </div>
  );
};

export default CreativeTools;