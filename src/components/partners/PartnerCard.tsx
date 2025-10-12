import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle, Star, Shield } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  order_index: number;
  discount_code?: string | null;
}

interface PartnerCardProps {
  partner: Partner;
  index: number;
}

export function PartnerCard({ partner, index }: PartnerCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="group animate-fade-in hover-scale"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card className="relative h-full bg-gaming-card/50 backdrop-blur-sm border-gaming-border hover:border-primary/50 overflow-hidden transition-all duration-500 hover:shadow-glow-primary">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Premium badge */}
        {partner.discount_code && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-gradient-to-r from-secondary to-primary text-white border-0 shadow-lg text-xs font-semibold">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
        
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300 truncate">
                {partner.name}
              </CardTitle>
              
              <Badge className="bg-primary/40 text-primary border border-primary/60 text-xs font-semibold shadow-glow-primary">
                <Shield className="w-3 h-3 mr-1" />
                Verified Partner
              </Badge>
            </div>
            
            {partner.logo_url && (
              <div className="flex-shrink-0 relative z-0 mt-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-gaming-border rounded-lg p-3 group-hover:border-primary/50 transition-all duration-300">
                  <img 
                    src={partner.logo_url} 
                    alt={`${partner.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0 space-y-4">
          {partner.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {partner.description}
            </p>
          )}
          
          {/* Discount code section */}
          {partner.discount_code && (
            <div className="p-3 bg-gradient-to-r from-gaming-card/80 to-gaming-dark/80 backdrop-blur-sm border border-gaming-border/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-secondary" />
                <span className="text-xs font-medium text-secondary">Exclusive Discount</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-bold text-primary bg-gaming-dark/50 px-2 py-1 rounded border border-gaming-border">
                  {partner.discount_code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(partner.discount_code!)}
                  className="h-8 px-2 border-primary/30 hover:bg-primary/10"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Website button */}
          {partner.website_url && (
            <Button
              className="w-full bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/30 text-foreground transition-all duration-300"
              asChild
            >
              <a 
                href={partner.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Website
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}