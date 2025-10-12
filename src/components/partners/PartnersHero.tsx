import { Trophy, Zap, Star, Shield } from "lucide-react";

export function PartnersHero() {
  return (
    <section className="text-center mb-16 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl -z-10" />
      
      <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gaming-card/30 backdrop-blur-sm border border-gaming-border rounded-full">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">Elite Partnership Network</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Adventure RP
        </span>
        <span className="block text-2xl md:text-3xl font-bold text-foreground mt-2 animate-fade-in">
          <Zap className="inline w-6 h-6 mr-2 text-primary" />
          Premium Partners
        </span>
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
        Discover our exclusive partnership network. Elite collaborations that elevate the entire RP experience with premium benefits and exclusive offers.
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-gaming-card/30 backdrop-blur-sm border border-gaming-border rounded-lg">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Verified Partners</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gaming-card/30 backdrop-blur-sm border border-gaming-border rounded-lg">
          <Star className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">Exclusive Benefits</span>
        </div>
      </div>
    </section>
  );
}