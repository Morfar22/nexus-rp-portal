import Navbar from "@/components/Navbar";
import RPEventCalendar from "@/components/RPEventCalendar";

const Events = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <RPEventCalendar />
      </main>
    </div>
  );
};

export default Events;