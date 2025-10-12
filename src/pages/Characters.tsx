import Navbar from "@/components/Navbar";
import CharacterGallery from "@/components/CharacterGallery";

const Characters = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <CharacterGallery />
      </main>
    </div>
  );
};

export default Characters;