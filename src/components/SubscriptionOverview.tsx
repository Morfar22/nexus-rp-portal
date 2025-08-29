import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard, User, Calendar, Package } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  email: string;
  user_id: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  package_id: string | null;
  updated_at: string;
  created_at: string;
}

export function SubscriptionOverview() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // First get all subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from("subscribers")
        .select("*")
        .order("updated_at", { ascending: false });

      if (subscribersError) throw subscribersError;
      
      // Then get profiles for all user_ids
      const userIds = subscribersData?.map(s => s.user_id).filter(Boolean) || [];
      let profilesData = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else {
          profilesData = profiles || [];
        }
      }
      
      // Combine the data
      const combinedData = subscribersData?.map(subscriber => ({
        ...subscriber,
        profiles: profilesData.find(p => p.id === subscriber.user_id) || null
      })) || [];
      
      console.log("Fetched subscriptions:", combinedData);
      setSubscriptions(combinedData);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (!subscription.subscribed) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const now = new Date();
      
      if (endDate < now) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        return <Badge variant="destructive">Expiring Soon</Badge>;
      }
    }
    
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading subscriptions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Overview and management of all user subscriptions (active and inactive)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No subscriptions found
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-l-4 border-primary">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">
                            {subscription.email}
                          </span>
                        </div>
                        {getStatusBadge(subscription)}
                      </div>
                      
                      {subscription.subscription_tier && (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="secondary">
                            {subscription.subscription_tier}
                          </Badge>
                        </div>
                      )}
                      
                      {subscription.subscription_end && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Expires: {formatDate(subscription.subscription_end)}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Updated: {formatDate(subscription.updated_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="border-t pt-4 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Subscriptions:</span>
                  <span className="font-medium text-foreground ml-2">{subscriptions.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Active:</span>
                  <span className="font-medium text-green-500 ml-2">
                    {subscriptions.filter(s => s.subscribed).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Inactive:</span>
                  <span className="font-medium text-red-500 ml-2">
                    {subscriptions.filter(s => !s.subscribed).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">With Tiers:</span>
                  <span className="font-medium text-foreground ml-2">
                    {subscriptions.filter(s => s.subscription_tier).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}