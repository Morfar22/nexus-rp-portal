import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Server, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, signOut } = useAuth();

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
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-neon-purple" />
                <span className="text-sm text-foreground">
                  {user.user_metadata?.username || user.email}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="hover:border-neon-purple/50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="neon" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;