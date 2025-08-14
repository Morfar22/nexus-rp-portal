import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Server, Users, FileText, Settings } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Server className="h-8 w-8 text-neon-purple" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            NightCity RP
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-neon-purple transition-colors">
            Home
          </Link>
          <Link to="/apply" className="text-foreground hover:text-neon-purple transition-colors">
            Apply
          </Link>
          <Link to="/rules" className="text-foreground hover:text-neon-purple transition-colors">
            Rules
          </Link>
          <Link to="/map" className="text-foreground hover:text-neon-purple transition-colors">
            Live Map
          </Link>
          <Link to="/staff" className="text-foreground hover:text-neon-purple transition-colors">
            Staff Panel
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="neon" size="sm">
            Join Server
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;