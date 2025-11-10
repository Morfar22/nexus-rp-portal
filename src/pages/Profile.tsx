import UserProfileManager from "@/components/UserProfileManager";
import Navbar from "@/components/Navbar";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileActivity } from "@/components/profile/ProfileActivity";
import { ProfileSecurity } from "@/components/profile/ProfileSecurity";
import { User, BarChart3, Clock, Shield } from "lucide-react";

const Profile = () => {
  const { user } = useCustomAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>
          
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-gaming-card border-gaming-border">
              <TabsTrigger value="profile" className="data-[state=active]:bg-neon-purple">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-neon-purple">
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-neon-purple">
                <Clock className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-neon-purple">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <UserProfileManager />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <ProfileStats />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <ProfileActivity />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <ProfileSecurity />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;