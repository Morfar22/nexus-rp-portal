import { ExternalLink, Star } from "lucide-react";

export function PartnersEmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gaming-card/30 backdrop-blur-sm border-2 border-gaming-border rounded-full mx-auto mb-6">
        <ExternalLink className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h3 className="text-2xl font-bold mb-4 text-foreground">Building Elite Partnerships</h3>
      
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
        We're curating exclusive partnerships to enhance your Adventure RP experience. Stay tuned for amazing collaborations!
      </p>
      
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4 text-primary" />
        <span>Premium partnerships coming soon</span>
      </div>
    </div>
  );
}