import Navbar from "@/components/Navbar";

const Map = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Server Map
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore the server locations and points of interest
          </p>
        </div>

        <div className="bg-gaming-card border-gaming-border rounded-lg p-8 shadow-gaming">
          <div className="text-center">
            <div className="w-full h-96 bg-gaming-dark rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg 
                    className="w-8 h-8 text-neon-purple" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Interactive Map Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  We're working on an interactive map to showcase all the amazing locations in our server.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-gaming-card border-gaming-border rounded-lg p-6 shadow-gaming">
            <h3 className="text-lg font-semibold text-foreground mb-3">Police Department</h3>
            <p className="text-muted-foreground text-sm">
              Main headquarters for law enforcement operations.
            </p>
          </div>
          
          <div className="bg-gaming-card border-gaming-border rounded-lg p-6 shadow-gaming">
            <h3 className="text-lg font-semibold text-foreground mb-3">Hospital</h3>
            <p className="text-muted-foreground text-sm">
              Emergency medical services and healthcare facility.
            </p>
          </div>
          
          <div className="bg-gaming-card border-gaming-border rounded-lg p-6 shadow-gaming">
            <h3 className="text-lg font-semibold text-foreground mb-3">City Hall</h3>
            <p className="text-muted-foreground text-sm">
              Government offices and administrative services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;