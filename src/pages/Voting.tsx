import Navbar from "@/components/Navbar";
import CommunityVoting from "@/components/CommunityVoting";

const Voting = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <CommunityVoting />
      </main>
    </div>
  );
};

export default Voting;