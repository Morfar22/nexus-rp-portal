import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, CreditCard, User, Calendar, Package, Edit, Trash2, Plus, Ban, CheckCircle } from "lucide-react";
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
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function SubscriptionOverview() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [newSubscription, setNewSubscription] = useState({
    email: "",
    subscribed: true,
    subscription_tier: "",
    subscription_end: ""
  });

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

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      const { error } = await supabase
        .from("subscribers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Subscription updated successfully");
      fetchSubscriptions();
      setEditingSubscription(null);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Subscription deleted successfully");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription");
    }
  };

  const createSubscription = async () => {
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newSubscription.email)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      const subscriptionData = {
        email: newSubscription.email,
        user_id: userData?.id || null,
        subscribed: newSubscription.subscribed,
        subscription_tier: newSubscription.subscription_tier || null,
        subscription_end: newSubscription.subscription_end || null,
      };

      const { error } = await supabase
        .from("subscribers")
        .insert(subscriptionData);

      if (error) throw error;
      
      toast.success("Subscription created successfully");
      fetchSubscriptions();
      setNewSubscription({
        email: "",
        subscribed: true,
        subscription_tier: "",
        subscription_end: ""
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Failed to create subscription");
    }
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
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscription</DialogTitle>
                  <DialogDescription>
                    Create a new subscription for a user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={newSubscription.email}
                      onChange={(e) => setNewSubscription({...newSubscription, email: e.target.value})}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier">Subscription Tier</Label>
                    <Select 
                      value={newSubscription.subscription_tier} 
                      onValueChange={(value) => setNewSubscription({...newSubscription, subscription_tier: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                        <SelectItem value="Ultimate RP Friend">Ultimate RP Friend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end_date">Subscription End Date</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={newSubscription.subscription_end}
                      onChange={(e) => setNewSubscription({...newSubscription, subscription_end: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newSubscription.subscribed}
                      onCheckedChange={(checked) => setNewSubscription({...newSubscription, subscribed: checked})}
                    />
                    <Label htmlFor="active">Active Subscription</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createSubscription}>Create Subscription</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingSubscription(subscription)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Subscription</DialogTitle>
                                <DialogDescription>
                                  Update subscription details for {subscription.email}
                                </DialogDescription>
                              </DialogHeader>
                              {editingSubscription && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Subscription Tier</Label>
                                    <Select 
                                      value={editingSubscription.subscription_tier || ""} 
                                      onValueChange={(value) => setEditingSubscription({
                                        ...editingSubscription, 
                                        subscription_tier: value
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select tier" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Basic">Basic</SelectItem>
                                        <SelectItem value="Premium">Premium</SelectItem>
                                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                                        <SelectItem value="Ultimate RP Friend">Ultimate RP Friend</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Subscription End Date</Label>
                                    <Input
                                      type="datetime-local"
                                      value={editingSubscription.subscription_end ? 
                                        new Date(editingSubscription.subscription_end).toISOString().slice(0, 16) : ""}
                                      onChange={(e) => setEditingSubscription({
                                        ...editingSubscription, 
                                        subscription_end: e.target.value ? new Date(e.target.value).toISOString() : null
                                      })}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingSubscription.subscribed}
                                      onCheckedChange={(checked) => setEditingSubscription({
                                        ...editingSubscription, 
                                        subscribed: checked
                                      })}
                                    />
                                    <Label>Active Subscription</Label>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button 
                                  onClick={() => editingSubscription && updateSubscription(editingSubscription.id, {
                                    subscription_tier: editingSubscription.subscription_tier,
                                    subscription_end: editingSubscription.subscription_end,
                                    subscribed: editingSubscription.subscribed
                                  })}
                                >
                                  Update Subscription
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete subscription for ${subscription.email}?`)) {
                                deleteSubscription(subscription.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {getStatusBadge(subscription)}
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateSubscription(subscription.id, { subscribed: !subscription.subscribed })}
                            title={subscription.subscribed ? "Deactivate" : "Activate"}
                          >
                            {subscription.subscribed ? 
                              <Ban className="w-3 h-3 text-red-500" /> : 
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            }
                          </Button>
                        </div>
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
                      
                      {subscription.profiles?.username && (
                        <div className="text-xs text-muted-foreground">
                          User: {subscription.profiles.username}
                        </div>
                      )}
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