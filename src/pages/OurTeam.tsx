import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown } from 'lucide-react';
import { TeamMemberCard } from '@/components/TeamMemberCard';

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

const OurTeam = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          staff_roles (
            id,
            display_name,
            color,
            hierarchy_level
          )
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) {
        setTeamMembers([]);
        return;
      }
      setTeamMembers(data || []);
    } catch (error) {
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Rolle-gruppering og sortering med hierarki
  const groupedByRole: { [role: string]: TeamMember[] } = {};
  const hierarchyOrder: { [role: string]: number } = {
    'owner': 1,
    'founder': 1,
    'co-owner': 2,
    'admin': 3,
    'administrator': 3,
    'developer': 4,
    'head moderator': 5,
    'senior moderator': 6,
    'moderator': 7,
    'mod': 7,
    'helper': 8,
    'supporter': 9,
    'staff': 10
  };

  teamMembers.forEach((member) => {
    // Use staff role display name if available, otherwise fallback to role field
    const roleKey = member.staff_roles?.display_name || member.role.trim();
    if (!groupedByRole[roleKey]) {
      groupedByRole[roleKey] = [];
    }
    groupedByRole[roleKey].push(member);
  });

  // Sortér roller efter hierarki
  const dynamicRoleOrder = Object.keys(groupedByRole).sort((a, b) => {
    const aLevel = hierarchyOrder[a.toLowerCase()] || 999;
    const bLevel = hierarchyOrder[b.toLowerCase()] || 999;
    return aLevel - bLevel;
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-cyber opacity-10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-glow animate-fade-in">
              Vores Team
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Mød de dedikerede medlemmer, der holder vores community kørende og skaber fantastiske oplevelser!
            </p>
            <div className="flex justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{teamMembers.length}</div>
                <div className="text-sm text-muted-foreground">Team Medlemmer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{teamMembers.filter(m => m.is_active).length}</div>
                <div className="text-sm text-muted-foreground">Aktive</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{dynamicRoleOrder.length}</div>
                <div className="text-sm text-muted-foreground">Roller</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gaming-card border-gaming-border rounded-lg p-6 animate-pulse">
                <div className="text-center">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4 bg-muted/20" />
                  <Skeleton className="h-5 w-32 mx-auto mb-2 bg-muted/20" />
                  <Skeleton className="h-4 w-20 mx-auto mb-4 bg-muted/20" />
                </div>
                <Skeleton className="h-16 w-full bg-muted/20" />
              </div>
            ))}
          </div>
        ) : dynamicRoleOrder.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gaming-card border-gaming-border rounded-2xl p-12 max-w-lg mx-auto">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-3xl font-semibold text-foreground mb-4">Ingen Team Medlemmer Endnu</h3>
              <p className="text-muted-foreground text-lg">
                Team medlemmer vil blive vist her, når de bliver tilføjet af staff.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {dynamicRoleOrder.map((role, roleIndex) => {
              const roleMembers = groupedByRole[role];
              const firstMember = roleMembers[0];
              const roleHierarchy = firstMember.staff_roles?.hierarchy_level || hierarchyOrder[role.toLowerCase()] || 999;
              const isHighLevel = roleHierarchy <= 25;
              
              return (
                <div key={role} className="animate-fade-in" style={{ animationDelay: `${roleIndex * 200}ms` }}>
                  {/* Role Header */}
                  <div className="text-center mb-10">
                    <div className="relative inline-block">
                      <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isHighLevel ? 'text-glow' : 'text-foreground'}`}>
                        {role}
                      </h2>
                      {isHighLevel && (
                        <div className="absolute -top-2 -right-8 text-primary">
                          <Crown className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
                    <p className="text-muted-foreground mt-4 text-lg">
                      {roleMembers.length} medlem{roleMembers.length !== 1 ? 'mer' : ''}
                    </p>
                  </div>

                  {/* Team Members Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {roleMembers
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((member, idx) => (
                        <TeamMemberCard 
                          key={member.id} 
                          member={member} 
                          index={(roleIndex * 4) + idx}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OurTeam;
