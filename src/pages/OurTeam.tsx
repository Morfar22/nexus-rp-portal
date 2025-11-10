import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Settings } from 'lucide-react';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { usePermissions } from '@/hooks/usePermissions';

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Use secure column selection - exclude sensitive Discord data for public view
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          name,
          role,
          bio,
          image_url,
          location,
          order_index,
          is_active,
          created_at,
          staff_roles!fk_team_members_staff_role (
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

  // Filter members based on search
  const filteredMembers = teamMembers.filter(member => 
    searchQuery === "" ||
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group members by role and sort by hierarchy level from staff_roles
  const groupedMembers = filteredMembers.reduce((groups, member) => {
    const roleName = member.staff_roles?.display_name || member.role || 'Unknown';
    if (!groups[roleName]) {
      groups[roleName] = [];
    }
    groups[roleName].push(member);
    return groups;
  }, {} as Record<string, TeamMember[]>);

  // Get unique roles with their hierarchy levels and sort them
  const sortedRoleNames = Object.keys(groupedMembers).sort((a, b) => {
    const roleA = groupedMembers[a][0].staff_roles;
    const roleB = groupedMembers[b][0].staff_roles;
    
    // If both have staff_roles, sort by hierarchy_level (lower = higher priority)
    if (roleA && roleB) {
      return roleA.hierarchy_level - roleB.hierarchy_level;
    }
    
    // If only one has staff_roles, prioritize it
    if (roleA && !roleB) return -1;
    if (!roleA && roleB) return 1;
    
    // If neither has staff_roles, sort alphabetically
    return a.localeCompare(b);
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
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <Input
                placeholder="Søg efter navn eller rolle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gaming-card border-gaming-border"
              />
            </div>
            
            <div className="flex justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{filteredMembers.length}</div>
                <div className="text-sm text-muted-foreground">Team Medlemmer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{filteredMembers.filter(m => m.is_active).length}</div>
                <div className="text-sm text-muted-foreground">Aktive</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{sortedRoleNames.length}</div>
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
        ) : sortedRoleNames.length === 0 ? (
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
            {sortedRoleNames.map((role, roleIndex) => {
              const roleMembers = groupedMembers[role];
              const firstMember = roleMembers[0];
              const roleHierarchy = firstMember.staff_roles?.hierarchy_level || 999;
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
                  <div className="flex flex-wrap justify-center gap-6">
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
