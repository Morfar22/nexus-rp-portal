import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ChevronDown, ChevronUp, User } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image_url?: string;
  location?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  staff_roles?: {
    id: string;
    display_name: string;
    color: string;
    hierarchy_level: number;
  };
}

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

export function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  const [showBio, setShowBio] = useState(false);

  const getInitials = (name: string) =>
    name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);

  const getJoinedTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const memberRole = member.staff_roles?.display_name || member.role;
  const roleColor = member.staff_roles?.color;

  return (
    <div
      className="group animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card className="relative h-full bg-gaming-card/80 backdrop-blur-sm border-gaming-border hover:border-primary/50 overflow-hidden transition-all duration-300 hover:shadow-glow-primary">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Active status indicator */}
        {member.is_active && (
          <div className="absolute top-4 right-4 z-20 w-3 h-3 bg-neon-green rounded-full shadow-glow-teal animate-pulse" />
        )}
        
        <CardHeader className="relative z-10 text-center pb-3">
          {/* Profile Section */}
          <div className="relative mb-4">
            {/* Profile picture with gradient background */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full p-1">
                <Avatar className="w-full h-full border-2 border-gaming-border group-hover:border-primary/30 transition-colors duration-300">
                  <AvatarImage 
                    src={member.image_url} 
                    alt={member.name}
                    className="object-cover rounded-full"
                  />
                  <AvatarFallback className="bg-gaming-dark/50 text-foreground font-semibold text-lg">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {member.name}
          </h3>

          {/* Role Badge */}
          <Badge 
            className="mb-3 font-semibold border-2 px-3 py-1.5 text-sm shadow-sm"
            style={{
              backgroundColor: roleColor ? `${roleColor}25` : 'hsl(var(--gaming-card))',
              borderColor: roleColor ? `${roleColor}80` : 'hsl(var(--primary) / 0.5)',
              color: '#000000',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            <User className="w-3 h-3 mr-1" />
            {memberRole}
          </Badge>

          {/* Location */}
          {member.location && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{member.location}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="relative z-10 pt-0 space-y-3">
          {/* Bio Toggle */}
          {member.bio && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBio(!showBio)}
                className="text-primary hover:text-secondary hover:bg-primary/10 transition-all duration-200"
              >
                <span className="mr-1">Vis bio</span>
                {showBio ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              {showBio && (
                <div className="mt-3 p-3 bg-gaming-dark/60 backdrop-blur-sm border border-gaming-border/50 rounded-lg text-sm text-muted-foreground leading-relaxed animate-fade-in">
                  {member.bio}
                </div>
              )}
            </div>
          )}

          {/* Stats Section */}
          <div className="flex items-center justify-between pt-3 border-t border-gaming-border/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {getJoinedTime(member.created_at)}</span>
            </div>
            
            {member.is_active && (
              <div className="flex items-center gap-1 text-neon-green">
                <span>Aktiv</span>
              </div>
            )}
          </div>

          {/* Staff Member Badge */}
          <div className="flex justify-center pt-2">
            <Badge 
              variant="outline" 
              className="text-xs font-medium bg-secondary/10 border-secondary/30 text-secondary"
            >
              Staff Medlem
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}