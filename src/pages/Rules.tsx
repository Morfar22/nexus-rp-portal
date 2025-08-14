import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Shield, Users, Car, Heart } from "lucide-react";

const Rules = () => {
  const ruleCategories = [
    {
      title: "General Rules",
      icon: Shield,
      color: "text-neon-purple",
      rules: [
        "Be respectful to all players and staff members",
        "No metagaming, powergaming, or fail RP",
        "Stay in character at all times while in city",
        "Use /ooc sparingly and only when necessary",
        "No random deathmatch (RDM) or vehicle deathmatch (VDM)"
      ]
    },
    {
      title: "Roleplay Rules",
      icon: Users,
      color: "text-neon-blue",
      rules: [
        "Create realistic and believable characters",
        "Fear for your character's life in dangerous situations",
        "No unrealistic stunts or superhuman abilities",
        "Proper initiation required before hostile actions",
        "New Life Rule applies after death scenarios"
      ]
    },
    {
      title: "Crime & Police",
      icon: Car,
      color: "text-neon-green",
      rules: [
        "Maximum 4 players per criminal group",
        "Police must have probable cause for searches",
        "No camping police stations or hospitals",
        "Realistic police pursuits and procedures",
        "Hostage situations require proper RP buildup"
      ]
    },
    {
      title: "EMS & Medical",
      icon: Heart,
      color: "text-red-400",
      rules: [
        "Allow EMS to do their job without interference",
        "No combat logging to avoid medical RP",
        "Respect medical facilities as safe zones",
        "Proper injury RP based on damage taken",
        "EMS has final say on medical situations"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Server Rules
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these rules to ensure everyone has an amazing roleplay experience. 
            Violations may result in warnings, kicks, or permanent bans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ruleCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="p-6 bg-gaming-card border-gaming-border shadow-gaming hover:border-neon-purple/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <IconComponent className={`h-6 w-6 ${category.color}`} />
                  <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {category.rules.length} rules
                  </Badge>
                </div>
                
                <ul className="space-y-3">
                  {category.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start space-x-2">
                      <span className={`w-2 h-2 rounded-full ${category.color.replace('text-', 'bg-')} mt-2 flex-shrink-0`} />
                      <span className="text-muted-foreground text-sm leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-6 bg-gaming-card border-gaming-border shadow-gaming">
          <h2 className="text-xl font-semibold text-foreground mb-4">Important Notes</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• Staff decisions are final. Respect their authority and follow their instructions.</p>
            <p>• Report rule violations through Discord or in-game reporting system.</p>
            <p>• Ignorance of the rules is not an excuse. It's your responsibility to stay updated.</p>
            <p>• Rules may be updated periodically. Check back regularly for changes.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rules;