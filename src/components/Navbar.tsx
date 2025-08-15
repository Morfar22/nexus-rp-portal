import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Server, LogIn, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { _user_id: user.id });

        if (error) {
          console.error('Error checking staff role:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data);
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setIsStaff(false);
      }
    };

    checkStaffRole();
  }, [user]);

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
        onClick={() => setIsOpen(false)}
      >
        Home
      </Link>
      <Link 
        to="/apply" 
        className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
        onClick={() => setIsOpen(false)}
      >
        Apply
      </Link>
      <Link 
        to="/rules" 
        className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
        onClick={() => setIsOpen(false)}
      >
        Rules
      </Link>
      <Link 
        to="/team" 
        className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
        onClick={() => setIsOpen(false)}
      >
        Our Team
      </Link>
      {isStaff && (
        <>
          <Link 
            to="/staff" 
            className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
            onClick={() => setIsOpen(false)}
          >
            Staff Panel
          </Link>
          <Link 
            to="/servers" 
            className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
            onClick={() => setIsOpen(false)}
          >
            Servers
          </Link>
          <Link 
            to="/users" 
            className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
            onClick={() => setIsOpen(false)}
          >
            Users
          </Link>
        </>
      )}
    </>
  );

  const UserSection = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
      {user ? (
        <>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-neon-purple" />
            <span className="text-sm text-foreground">
              {user.user_metadata?.username || user.email}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="hover:border-neon-purple/50 w-full md:w-auto"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </>
      ) : (
        <Button 
          variant="neon" 
          size="sm" 
          asChild 
          className="w-full md:w-auto"
        >
          <Link to="/auth" onClick={() => setIsOpen(false)}>
            <LogIn className="h-4 w-4 mr-1" />
            Sign In
          </Link>
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <nav className="border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Server className="h-8 w-8 text-neon-purple" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dreamlight RP
            </span>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-gaming-card border-gaming-border">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex flex-col space-y-4">
                  <NavLinks />
                </div>
                <div className="border-t border-gaming-border pt-6">
                  <UserSection />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Server className="h-8 w-8 text-neon-purple" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dreamlight RP
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>
        
        <div className="flex items-center space-x-4">
          <UserSection />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;