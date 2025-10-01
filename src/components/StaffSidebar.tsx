import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  FileText,
  Shield,
  Users,
  Settings,
  Globe,
  UserCheck,
  Layout,
  Tv,
  Mail,
  FileSearch,
  Rocket,
  Activity,
  Home,
  UserPlus,
  Palette,
  MessageSquare,
  CreditCard,
  Scale,
  Instagram,
  Zap,
  Crown,
  Heart
} from "lucide-react";

interface StaffSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    group: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "security", label: "Security", icon: Shield },
      { id: "performance", label: "Performance", icon: Zap },
      { id: "logs", label: "System Logs", icon: Activity },
    ]
  },
  {
    group: "Applications",
    items: [
      { id: "applications", label: "Applications", icon: FileText },
      { id: "application-types", label: "Application Types", icon: UserPlus },
      { id: "application-settings", label: "Application Settings", icon: Settings },
    ]
  },
  {
    group: "Content Management",
    items: [
      { id: "rules", label: "Rules", icon: FileSearch },
      { id: "laws", label: "Laws", icon: Scale },
      { id: "content", label: "Homepage", icon: Layout },
      { id: "design", label: "Design & Appearance", icon: Palette },
      { id: "packages", label: "Packages", icon: CreditCard },
    ]
  },
  {
    group: "User Management",
    items: [
      { id: "team", label: "Team Management", icon: Users },
      { id: "custom-roles", label: "Roller & Staff", icon: Crown },
      { id: "users", label: "Users", icon: Users },
      { id: "partners", label: "Partners", icon: Globe },
      { id: "supporters", label: "Supporters", icon: Heart },
    ]
  },
  {
    group: "Communications",
    items: [
      { id: "chat", label: "Live Chat", icon: MessageSquare },
      { id: "emails", label: "Email Templates", icon: Mail },
      { id: "social-media", label: "Social Media", icon: Instagram },
      { id: "live-streamers", label: "Live Streamers", icon: Tv },
    ]
  },
  {
    group: "System",
    items: [
      { id: "server-management", label: "Server Management", icon: Activity },
      { id: "navbar", label: "Navigation", icon: Layout },
      { id: "deployment", label: "Deployment", icon: Rocket },
      { id: "settings", label: "General Settings", icon: Settings },
    ]
  }
];

export function StaffSidebar({ activeTab, onTabChange }: StaffSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-64"} bg-gaming-card border-gaming-border transition-all duration-300`}
      collapsible="icon"
    >
      <div className="border-b border-gaming-border p-4 bg-gaming-darker/50">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-foreground">Staff Panel</h2>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="bg-gaming-card custom-scrollbar">
        {navigationItems.map((group) => (
          <SidebarGroup key={group.group} className="px-2 py-3">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-primary font-semibold px-3 py-2 text-xs uppercase tracking-wider">
                {group.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={`w-full justify-start transition-all duration-300 rounded-lg group ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-l-4 border-primary shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-gaming-darker/80 hover:scale-[1.02]"
                      }`}
                    >
                      <div className={`p-2 rounded-md transition-all duration-300 ${
                        activeTab === item.id 
                          ? "bg-primary/20 text-primary" 
                          : "group-hover:bg-gaming-border group-hover:text-primary"
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && (
                        <span className="text-sm font-medium ml-2 animate-fade-in">
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}