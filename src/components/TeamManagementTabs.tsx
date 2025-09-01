import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users } from "lucide-react";
import RoleManager from "./RoleManager";
import TeamManager from "./TeamManager";

const TeamManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gaming-card border-gaming-border">
          <TabsTrigger value="roles" className="flex items-center space-x-2 data-[state=active]:bg-gaming-dark">
            <Settings className="h-4 w-4" />
            <span>Manage Roles</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2 data-[state=active]:bg-gaming-dark">
            <Users className="h-4 w-4" />
            <span>Team Members</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="mt-6">
          <RoleManager />
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <TeamManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamManagementTabs;