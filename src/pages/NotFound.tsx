import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center">
        <div className="bg-gaming-card border-gaming-border rounded-lg p-8 max-w-md mx-auto">
          <h1 className="text-6xl font-bold mb-4 text-neon-purple animate-pulse">404</h1>
          <p className="text-xl text-foreground mb-6">Oops! Side ikke fundet</p>
          <p className="text-muted-foreground mb-6">Siden du leder efter eksisterer ikke eller er blevet flyttet.</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105"
          >
            Tilbage til Forsiden
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
